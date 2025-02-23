import { FileJson } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { useToast } from "./ui/use-toast";
import { supabase } from "../lib/supabase";
import { ImportPreviewModal } from "./ImportPreviewModal";

interface ImportJSONProps {
  selectedClass: string;
  teachers: { id: string; name: string; }[];
  rooms: { id: string; name: string; }[];
  classes: { id: string; name: string; }[];
  lessons: { id: string; lesson_number: number; }[];
  onImportComplete: () => void;
  weekdayMap: { [key: string]: string };
  selectedPeriod: string;
}

interface TimeTableLesson {
  Teacher: string;
  Weekday: string;
  LessonNumber: number;
  Class: string;
  Subgroup: string;
  Subject: string;
  Room: string;
}

export function ImportJSON({ 
  selectedClass, 
  teachers, 
  rooms, 
  classes, 
  lessons,
  onImportComplete,
  weekdayMap,
  selectedPeriod,  // Add this to destructuring
}: ImportJSONProps) {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<TimeTableLesson[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonData: TimeTableLesson[] = JSON.parse(e.target?.result as string);
          setPreviewData(jsonData);
          setShowPreview(true);
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Error processing JSON",
            description: error.message,
          });
        }
      };

      reader.readAsText(file);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error importing timetable",
        description: error.message,
      });
    } finally {
      if (event.target) event.target.value = "";
    }
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    try {
      // Your existing import logic here
      // ... (the database insertion code)
      onImportComplete();
      setShowPreview(false);
      toast({
        title: "Success",
        description: "Timetable imported successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error importing timetable",
        description: error.message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div className="relative">
        <input
          type="file"
          accept=".json"
          onChange={handleFileImport}
          className="hidden"
          id="file-import"
          disabled={!selectedClass || isImporting}
        />
        <Button
          asChild
          disabled={!selectedClass || isImporting}
          className="gap-2"
        >
          <label htmlFor="file-import" className="cursor-pointer">
            <FileJson className="h-4 w-4" />
            {isImporting ? "Importing..." : "Import from JSON"}
          </label>
        </Button>
      </div>
      <ImportPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirmImport}
        data={previewData}
        selectedClass={selectedClass}
        teachers={teachers}
        rooms={rooms}
        lessons={lessons}
        selectedPeriod={selectedPeriod}  // Add this prop
      />
    </>
  );
}