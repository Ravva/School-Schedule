import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { useState } from "react";  // Add this import
import { toast } from "sonner";  // Add this import

interface PreviewData {
  Teacher: string;
  Weekday: string;
  LessonNumber: number;
  Class: string;
  Subgroup: string;
  Subject: string;
  Room: string;
}

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: PreviewData[];
  selectedClass: string;
  teachers: { id: string; name: string; }[];
  rooms: { id: string; name: string; }[];
  lessons: { id: string; lesson_number: number; }[];
  selectedPeriod: string;  // Add this prop
}

export function ImportPreviewModal({
    isOpen,
    onClose,
    onConfirm,
    data,
    selectedClass,
    teachers,
    rooms,
    lessons,
    selectedPeriod,
  }: ImportPreviewModalProps) {
    const [isImporting, setIsImporting] = useState(false);
  
    const handleImport = async () => {
      try {
        setIsImporting(true);
  
        // Get unique class names from the data
        const uniqueClasses = [...new Set(data.map(row => row.Class))];
  
        // Fetch all class IDs at once
        const { data: classesData, error: classesError } = await supabase
          .from("classes")
          .select("id, name")
          .in("name", uniqueClasses);
  
        if (classesError || !classesData) {
          throw new Error("Failed to fetch class data");
        }
  
        // Create a map of class names to their IDs
        const classIdMap = Object.fromEntries(
          classesData.map(c => [c.name, c.id])
        );
  
        // Check if all classes were found
        const missingClasses = uniqueClasses.filter(
          className => !classIdMap[className]
        );
        if (missingClasses.length > 0) {
          throw new Error(`Classes not found: ${missingClasses.join(", ")}`);
        }
  
        // First, check if period exists
        const { data: periodData, error: periodError } = await supabase
          .from("academic_periods")
          .select("id")
          .eq("id", selectedPeriod)
          .single();
  
      if (periodError || !periodData) {
        throw new Error("Selected academic period not found");
      }
  
      // Fetch subjects with subgroup info
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("name, is_subgroup");
  
      if (subjectsError) throw subjectsError;
  
      // Clear existing schedule for the class and period
      const { error: deleteError } = await supabase
        .from("time_slots")
        .delete()
        .in("class_id", Object.values(classIdMap))
        .eq("academic_period_id", selectedPeriod);
  
      if (deleteError) throw deleteError;
  
      // Prepare time slots for import
      const timeSlots = data.flatMap(row => {
        const teacher = teachers.find(t => t.name === row.Teacher);
        const room = rooms.find(r => r.name === row.Room);
        const lesson = lessons.find(l => l.lesson_number === row.LessonNumber);
        const subject = subjectsData?.find(s => s.name === row.Subject);
  
        if (!teacher || !room || !lesson) {
          throw new Error(`Missing reference for row: ${JSON.stringify(row)}`);
        }
  
        const baseTimeSlot = {
          day: row.Weekday,
          lesson_id: lesson.id,
          subject: row.Subject,
          teacher_id: teacher.id,
          room_id: room.id,
          class_id: classIdMap[row.Class], // Use the correct class ID from the map
          academic_period_id: selectedPeriod,
          created_at: new Date().toISOString(),
          ...(row.Subgroup ? { subgroup: parseInt(row.Subgroup) } : {})
        };
  
        // Modify the slot creation logic
        if (subject?.is_subgroup && row.Subgroup) {
          return [{
            ...baseTimeSlot,
            subgroup: parseInt(row.Subgroup)
          }];
        }
        if (subject?.is_subgroup) {
          return [
            { ...baseTimeSlot, subgroup: 1 },
            { ...baseTimeSlot, room_id: rooms[0].id, subgroup: 2 }
          ];
        }
        return [baseTimeSlot];
      });
  
      // Insert time slots
      const { error: insertError } = await supabase
        .from("time_slots")
        .insert(timeSlots);
  
      if (insertError) {
        console.error("Insert error details:", insertError);
        throw insertError;
      }
  // After successful insert, fetch the updated data
  const { data: updatedTimeSlots, error: fetchError } = await supabase
    .from("time_slots")
    .select("*")
    .in("class_id", Object.values(classIdMap))  // Update the fetch query at the end
    .eq("academic_period_id", selectedPeriod);
  
  if (fetchError) throw fetchError;
  
  toast.success("Timetable imported successfully");
  onConfirm(); // This will trigger the parent's refresh
  onClose();
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error("Error importing timetable", {
        description: error.message,
      });
    } finally {
      setIsImporting(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Preview Import Data</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[600px] mt-4">
          <table className="w-full">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th className="text-left p-2">Teacher</th>
                <th className="text-left p-2">Day</th>
                <th className="text-left p-2">Lesson</th>
                <th className="text-left p-2">Class</th>
                <th className="text-left p-2">Subgroup</th>
                <th className="text-left p-2">Subject</th>
                <th className="text-left p-2">Room</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{row.Teacher}</td>
                  <td className="p-2">{row.Weekday}</td>
                  <td className="p-2">{row.LessonNumber}</td>
                  <td className="p-2">{row.Class}</td>
                  <td className="p-2">{row.Subgroup || '-'}</td>
                  <td className="p-2">{row.Subject}</td>
                  <td className="p-2">{row.Room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting}>
            {isImporting ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}