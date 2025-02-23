import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus, Edit, Trash2, CalendarIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Calendar } from "../ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { useToast } from "../ui/use-toast";

interface PeriodManagerProps {
  academicPeriods: AcademicPeriod[];
  selectedPeriod: string;
  onPeriodChange: (periodId: string) => void;
  onPeriodsUpdate: (periods: AcademicPeriod[]) => void;
}

interface AcademicPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

export function PeriodManager({
  academicPeriods,
  selectedPeriod,
  onPeriodChange,
  onPeriodsUpdate,
}: PeriodManagerProps) {
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null);
  const [isAddPeriodOpen, setIsAddPeriodOpen] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedPeriod} onValueChange={onPeriodChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {academicPeriods.map((period) => (
            <div
              key={period.id}
              className="flex items-center justify-between p-2"
            >
              <SelectItem value={period.id}>{period.name}</SelectItem>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingPeriod(period);
                    setIsEditMode(true);
                    setIsAddPeriodOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete academic period and remove all data from
                        database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          try {
                            // First delete all related time slots
                            const { error: timeSlotsError } = await supabase
                              .from("time_slots")
                              .delete()
                              .eq("academic_period_id", period.id);
                            
                            if (timeSlotsError) throw timeSlotsError;
                            
                            // Then delete the academic period
                            const { error } = await supabase
                              .from("academic_periods")
                              .delete()
                              .eq("id", period.id);
                            
                            if (error) throw error;
                            
                            const { data } = await supabase
                              .from("academic_periods")
                              .select("*");
                            onPeriodsUpdate(data || []);
                            
                            if (selectedPeriod === period.id) {
                              onPeriodChange("");
                            }
                            
                            toast({
                              title: "Success",
                              description:
                                "Academic period deleted successfully",
                            });
                          } catch (error: any) {
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: error.message,
                            });
                          }
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </SelectContent>
      </Select>

      <Dialog
        open={isAddPeriodOpen}
        onOpenChange={(open) => {
          setIsAddPeriodOpen(open);
          if (!open) {
            setIsEditMode(false);
            setEditingPeriod(null);
            setNewPeriod({
              name: "",
              start_date: "",
              end_date: "",
            });
          } else if (isEditMode && editingPeriod) {
            setNewPeriod({
              name: editingPeriod.name,
              start_date: editingPeriod.start_date,
              end_date: editingPeriod.end_date,
            });
          }
        }}
      >
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Period
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit" : "Add"} Academic Period
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? "Modify" : "Create"} an academic period for
              timetable planning.
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
              <Popover>
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
                            newPeriod.start_date
                              .split(".")
                              .reverse()
                              .join("-"),
                          ),
                          "PPP",
                          { locale: ru },
                        )
                      : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      newPeriod.start_date
                        ? new Date(
                            newPeriod.start_date
                              .split(".")
                              .reverse()
                              .join("-"),
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
                      const button = document.activeElement as HTMLElement;
                      button?.blur();
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
                            newPeriod.end_date
                              .split(".")
                              .reverse()
                              .join("-"),
                          ),
                          "PPP",
                          { locale: ru },
                        )
                      : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      newPeriod.end_date
                        ? new Date(
                            newPeriod.end_date
                              .split(".")
                              .reverse()
                              .join("-"),
                          )
                        : undefined
                    }
                    onSelect={(date) => {
                      setNewPeriod({
                        ...newPeriod,
                        end_date: date
                          ? date.toLocaleDateString("ru-RU")
                          : "",
                      });
                      const button = document.activeElement as HTMLElement;
                      button?.blur();
                    }}
                    initialFocus
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={async () => {
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
                      .insert([periodData]);
                    if (error) throw error;
                  }

                  const { data } = await supabase
                    .from("academic_periods")
                    .select("*");
                  onPeriodsUpdate(data || []);

                  setIsAddPeriodOpen(false);
                  setIsEditMode(false);
                  setEditingPeriod(null);
                  setNewPeriod({
                    name: "",
                    start_date: "",
                    end_date: "",
                  });

                  toast({
                    title: "Success",
                    description: `Academic period ${
                      isEditMode ? "updated" : "added"
                    } successfully`,
                  });
                } catch (error: any) {
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.message,
                  });
                }
              }}
            >
              {isEditMode ? "Update" : "Add"} Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}