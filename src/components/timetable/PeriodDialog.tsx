import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "../ui/use-toast";

interface PeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  editingPeriod: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  } | null;
  onSuccess: (data: any[]) => void;
}

export function PeriodDialog({
  open,
  onOpenChange,
  isEditMode,
  editingPeriod,
  onSuccess,
}: PeriodDialogProps) {
  const { toast } = useToast();
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (isEditMode && editingPeriod) {
      setNewPeriod({
        name: editingPeriod.name,
        start_date: editingPeriod.start_date,
        end_date: editingPeriod.end_date,
      });
    } else {
      setNewPeriod({
        name: "",
        start_date: "",
        end_date: "",
      });
    }
  }, [isEditMode, editingPeriod]);

  const handleSubmit = async () => {
    try {
      const formatDate = (dateStr: string) => {
        return dateStr.split(".").reverse().join("-");
      };

      const periodData = {
        name: newPeriod.name,
        start_date: formatDate(newPeriod.start_date),
        end_date: formatDate(newPeriod.end_date),
      };

      if (isEditMode && editingPeriod) {
        const { error } = await supabase
          .from("academic_periods")
          .update(periodData)
          .eq("id", editingPeriod.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("academic_periods")
          .insert(periodData);

        if (error) throw error;
      }

      const { data } = await supabase.from("academic_periods").select("*");
      onSuccess(data || []);
      onOpenChange(false);

      toast({
        title: "Success",
        description: `Academic period ${isEditMode ? "updated" : "added"} successfully`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit" : "Add"} Academic Period
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? "Modify" : "Create"} an academic period for timetable
            planning.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Period Name</Label>
            <Input
              id="name"
              value={newPeriod.name}
              onChange={(e) =>
                setNewPeriod({ ...newPeriod, name: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Start Date</Label>
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !newPeriod.start_date && "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newPeriod.start_date
                    ? format(
                        new Date(
                          newPeriod.start_date.split(".").reverse().join("-")
                        ),
                        "PPP",
                        { locale: ru }
                      )
                    : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={
                    newPeriod.start_date
                      ? new Date(
                          newPeriod.start_date.split(".").reverse().join("-")
                        )
                      : undefined
                  }
                  onSelect={(date) => {
                    setNewPeriod({
                      ...newPeriod,
                      start_date: date
                        ? date.toLocaleDateString("ru-RU")
                        : "",
                    });
                  }}
                  initialFocus
                  locale={ru}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !newPeriod.end_date && "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newPeriod.end_date
                    ? format(
                        new Date(
                          newPeriod.end_date.split(".").reverse().join("-")
                        ),
                        "PPP",
                        { locale: ru }
                      )
                    : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={
                    newPeriod.end_date
                      ? new Date(
                          newPeriod.end_date.split(".").reverse().join("-")
                        )
                      : undefined
                  }
                  onSelect={(date) => {
                    setNewPeriod({
                      ...newPeriod,
                      end_date: date ? date.toLocaleDateString("ru-RU") : "",
                    });
                  }}
                  initialFocus
                  locale={ru}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>
            {isEditMode ? "Update" : "Add"} Period
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
