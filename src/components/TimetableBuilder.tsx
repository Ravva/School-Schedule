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
} from "./ui/alert-dialog";
import { Calendar } from "./ui/calendar";
import { read, utils } from "xlsx";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useToast } from "./ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const weekdayMap: { [key: string]: string } = {
  Понедельник: "Monday",
  Вторник: "Tuesday",
  Среда: "Wednesday",
  Четверг: "Thursday",
  Пятница: "Friday",
};

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface TimeSlot {
  day: string;
  lesson_id: string;
  subject: string; // Changed from subject_id to subject
  teacher_id: string;
  room_id: string;
  class_id: string;
}

interface AcademicPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

interface Class {
  id: string;
  name: string;
  grade: number;
  literal: string;
}

interface Lesson {
  id: string;
  lesson_number: number;
  start_time: string;
  end_time: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
}

const TimetableBuilder = () => {
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState<string | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [isAddPeriodOpen, setIsAddPeriodOpen] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<{
    [key: string]: string;
  }>({});
  const [selectedTeachers, setSelectedTeachers] = useState<{
    [key: string]: string;
  }>({});
  const [selectedRooms, setSelectedRooms] = useState<{ [key: string]: string }>(
    {},
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Add this function inside the TimetableBuilder component
  const handleFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      setIsImporting(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // Clear existing time slots for the selected period
      const { error: deleteError } = await supabase
        .from("time_slots")
        .delete()
        .eq("class_id", selectedClass);

      if (deleteError) throw deleteError;

      await await parseExcelTimeTable(file, supabase);

      // Refresh time slots
      const { data: updatedTimeSlots, error: fetchError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("class_id", selectedClass);

      if (fetchError) throw fetchError;

      setTimeSlots(updatedTimeSlots || []);
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
      // Reset the input
      if (event.target) event.target.value = "";
    }
  };

  // Add these interfaces at the top with other interfaces
  interface ExcelLesson {
    Teacher: string;
    Weekday: string;
    "Lesson number": number;
    Class: string;
    Subgroup: string | null;
    Subject: string;
    Room: string;
  }
  // Update the parseExcelTimeTable function
  const parseExcelTimeTable = async (file: File, supabase: any) => {
    const data = await file.arrayBuffer();
    const workbook = read(data);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = utils.sheet_to_json(sheet, { header: 1 });
    const weekdayMap: { [key: string]: string } = {
      Понедельник: "Monday",
      Вторник: "Tuesday",
      Среда: "Wednesday",
      Четверг: "Thursday",
      Пятница: "Friday",
    };
    // Convert raw Excel data to ExcelLesson array
    const lessons: ExcelLesson[] = rawData
      .slice(1)
      .map((row: any) => ({
        Teacher: row[0],
        Weekday: row[1],
        "Lesson number": row[2],
        Class: row[3],
        Subgroup: row[4],
        Subject: row[5],
        Room: row[6],
      }))
      .filter((lesson: ExcelLesson) => lesson.Teacher && lesson.Weekday);

    for (const lessonData of lessons) {
      try {
        // Find lesson by time slot
        const lesson = lessons.find((l) =>
          l.start_time.startsWith(lessonData.Weekday.split(" ")[0]),
        );
        // Find teacher by number (assuming Teacher field contains a number)
        const teacher = teachers[Number(lessonData.Teacher) - 1];

        // Find room by class name (assuming Room field contains class name)
        const room = rooms.find((r) => r.name === lessonData.Room);

        // Find class by class name (e.g. "7Э", "8Ю" etc)
        const cls = classes.find(
          (c) => c.name === lessonData.Class?.split("(")[0]?.trim(),
        );

        if (!lesson || !teacher || !room || !cls) {
          console.error("Missing reference for:", lessonData);
          continue;
        }

        const timeSlotData = {
          day: weekdayMap[lessonData.Weekday] || lessonData.Weekday,
          lesson_id: lesson.id,
          subject: lessonData.Subject,
          teacher_id: teacher.id,
          room_id: room.id,
          class_id: cls.id,
          subgroup: lessonData.Subgroup
            ? Number(lessonData.Subgroup.replace(/[^\d]/g, ""))
            : null,
          created_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("time_slots")
          .insert([timeSlotData]);

        if (error) throw error;
      } catch (error) {
        console.error("Error inserting time slot:", error);
        throw error;
      }
    }
  };
  useEffect(() => {
    const fetchAcademicPeriods = async () => {
      const { data, error } = await supabase
        .from("academic_periods")
        .select("*");

      if (error) {
        console.error("Error fetching academic periods:", error);
      } else {
        setAcademicPeriods(data || []);
        if (data?.length) {
          setSelectedPeriod(data[0].id);
        }
      }
      setLoading(false);
    };

    const fetchClasses = async () => {
      const { data, error } = await supabase.from("classes").select("*");

      if (error) {
        console.error("Error fetching classes:", error);
      } else {
        setClasses(data || []);
      }
    };

    const fetchLessons = async () => {
      const { data, error } = await supabase.from("lessons").select("*");

      if (error) {
        console.error("Error fetching lessons:", error);
      } else {
        setLessons(data || []);
      }
    };

    const fetchSubjects = async () => {
      const { data, error } = await supabase.from("subjects").select("*");

      if (error) {
        console.error("Error fetching subjects:", error);
      } else {
        setSubjects(data || []);
      }
    };

    const fetchTeachers = async () => {
      const { data, error } = await supabase.from("teachers").select("*");

      if (error) {
        console.error("Error fetching teachers:", error);
      } else {
        setTeachers(data || []);
      }
    };

    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, room_number");

      if (error) {
        console.error("Error fetching rooms:", error);
      } else {
        // Map the fetched data to match the Room interface
        const formattedRooms =
          data?.map((room) => ({
            id: room.id,
            name: room.room_number, // Assuming room_number is the name of the room
          })) || [];
        setRooms(formattedRooms);
      }
    };

    const fetchTimeSlots = async () => {
      const { data, error } = await supabase.from("time_slots").select("*");
      if (error) {
        console.error("Error fetching time slots:", error);
      } else {
        // Correctly map the fetched data to TimeSlot interface
        const formattedTimeSlots =
          data?.map((ts) => ({
            day: ts.day,
            lesson_id: ts.lesson_id,
            subject: ts.subject, // Using 'subject' to match the TimeSlot interface
            teacher_id: ts.teacher_id,
            room_id: ts.room_id,
            class_id: ts.class_id,
          })) || [];
        setTimeSlots(formattedTimeSlots);
      }
    };

    fetchAcademicPeriods();
    fetchClasses();
    fetchLessons();
    fetchSubjects();
    fetchTeachers();
    fetchRooms();
    fetchTimeSlots();
  }, [toast]);

  useEffect(() => {
    if (isEditMode && editingPeriod) {
      setNewPeriod({
        name: editingPeriod.name,
        start_date: editingPeriod.start_date,
        end_date: editingPeriod.end_date,
      });
    }
  }, [isEditMode, editingPeriod]);

  const generateSchedule = async () => {
    try {
      setIsGenerating(true);

      // First get syllabus data for the class
      const { data: syllabusData, error: syllabusError } = await supabase
        .from("syllabus")
        .select("*, subjects(*), teachers(*)")
        .eq("class_id", selectedClass);

      if (syllabusError) throw syllabusError;

      // Get subject-teacher assignments as fallback
      const { data: subjectTeachers, error: stError } = await supabase
        .from("subject_teachers")
        .select("*, subjects(*), teachers(*)")
        .eq("class_id", selectedClass);

      if (stError) throw stError;

      if (
        !syllabusData?.length &&
        (!subjectTeachers || !subjectTeachers.length)
      ) {
        throw new Error(
          "No teacher assignments found for this class. Please set up the syllabus first.",
        );
      }

      // Clear existing schedule
      const { error: deleteError } = await supabase
        .from("time_slots")
        .delete()
        .eq("class_id", selectedClass);

      if (deleteError) throw deleteError;

      const newTimeSlots: TimeSlot[] = [];

      // Create a map to track how many hours have been assigned for each subject
      const subjectHoursAssigned = new Map<string, number>();

      // Initialize the map with syllabus data
      syllabusData?.forEach((syllabus) => {
        subjectHoursAssigned.set(syllabus.subject_id, 0);
      });

      // Create a list of available slots
      const availableSlots = [];
      for (const day of WEEKDAYS) {
        for (const lesson of lessons) {
          availableSlots.push({ day, lesson });
        }
      }

      // Shuffle available slots for random distribution
      availableSlots.sort(() => Math.random() - 0.5);

      // Process each syllabus entry
      for (const syllabus of syllabusData || []) {
        const hoursNeeded = syllabus.amount_of_academic_hours_per_week || 0;
        let currentHours = subjectHoursAssigned.get(syllabus.subject_id) || 0;

        // Ensure we assign the correct number of time slots
        while (currentHours < hoursNeeded) {
          // Find available slots for this subject
          for (const slot of availableSlots) {
            if (currentHours >= hoursNeeded) break;

            // Check if this slot is already used
            const isSlotUsed = newTimeSlots.some(
              (ts) => ts.day === slot.day && ts.lesson_id === slot.lesson.id,
            );

            if (isSlotUsed) continue;

            // Check if teacher is available in this slot
            const isTeacherBusy = newTimeSlots.some(
              (ts) =>
                ts.day === slot.day &&
                ts.lesson_id === slot.lesson.id &&
                ts.teacher_id === syllabus.teacher_id,
            );
            if (isTeacherBusy) continue;

            // Get available rooms
            const usedRoomIds = newTimeSlots
              .filter(
                (ts) => ts.day === slot.day && ts.lesson_id === slot.lesson.id,
              )
              .map((ts) => ts.room_id);

            const roomsQuery = supabase.from("rooms").select("*");
            const { data: availableRooms, error: rError } =
              await (usedRoomIds.length > 0
                ? roomsQuery.not("id", "in", usedRoomIds)
                : roomsQuery);

            if (rError) throw rError;
            if (!availableRooms?.length) continue;

            const randomRoom =
              availableRooms[Math.floor(Math.random() * availableRooms.length)];

            // Get the subject name
            const subjectName = subjects.find(
              (s) => s.id === syllabus.subject_id,
            )?.name;
            if (!subjectName) continue;

            // Add the time slot
            newTimeSlots.push({
              day: slot.day,
              lesson_id: slot.lesson.id,
              subject: subjectName,
              teacher_id: syllabus.teacher_id,
              room_id: randomRoom.id,
              class_id: selectedClass,
            });

            // Update assigned hours
            currentHours++;
            subjectHoursAssigned.set(syllabus.subject_id, currentHours);
          }
        }
      }

      // Insert time slots one by one to better handle conflicts
      for (const slot of newTimeSlots) {
        const { error: insertError } = await supabase
          .from("time_slots")
          .insert({
            day: slot.day,
            lesson_id: slot.lesson_id,
            subject: slot.subject,
            teacher_id: slot.teacher_id,
            room_id: slot.room_id,
            class_id: slot.class_id,
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error("Error inserting time slot:", insertError);
          throw insertError;
        }
      }

      // Fetch updated time slots
      const { data: updatedTimeSlots, error: fetchError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("class_id", selectedClass);

      if (fetchError) throw fetchError;

      // Update state with formatted time slots
      const formattedTimeSlots =
        updatedTimeSlots?.map((ts) => ({
          day: ts.day,
          lesson_id: ts.lesson_id,
          subject: ts.subject,
          teacher_id: ts.teacher_id,
          room_id: ts.room_id,
          class_id: ts.class_id,
        })) || [];

      setTimeSlots(formattedTimeSlots);

      toast({
        title: "Success",
        description: "Schedule generated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error generating schedule",
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 bg-slate-100 rounded-lg shadow-lg">
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-900">
              Timetable Builder
            </h2>
            <div className="flex items-center gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
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
                                This action cannot be undone. This will
                                permanently delete academic period and remove
                                all data from database.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  try {
                                    const { error } = await supabase
                                      .from("academic_periods")
                                      .delete()
                                      .eq("id", period.id);

                                    if (error) throw error;

                                    const { data } = await supabase
                                      .from("academic_periods")
                                      .select("*");
                                    setAcademicPeriods(data || []);

                                    if (selectedPeriod === period.id) {
                                      setSelectedPeriod("");
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
            </div>
            <div className="flex gap-2">
              {" "}
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
                            className={`w-full justify-start text-left font-normal ${!newPeriod.start_date && "text-muted-foreground"}`}
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
                              const button =
                                document.activeElement as HTMLElement;
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
                            className={`w-full justify-start text-left font-normal ${!newPeriod.end_date && "text-muted-foreground"}`}
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
                              const button =
                                document.activeElement as HTMLElement;
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
                          // Convert dates from DD.MM.YYYY to YYYY-MM-DD
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

                          // Rest of the code remains the same
                          const { data } = await supabase
                            .from("academic_periods")
                            .select("*");
                          setAcademicPeriods(data || []);

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
                            description: `Academic period ${isEditMode ? "updated" : "added"} successfully`,
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
              <Button
                onClick={generateSchedule}
                disabled={!selectedPeriod || !selectedClass || isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate Schedule"}
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileImport}
                  className="hidden"
                  id="file-import"
                  disabled={!selectedPeriod || !selectedClass || isImporting}
                />
                <Button
                  asChild
                  disabled={!selectedPeriod || !selectedClass || isImporting}
                >
                  <label htmlFor="file-import" className="cursor-pointer">
                    {isImporting ? "Importing..." : "Import from Excel"}
                  </label>
                </Button>
              </div>
            </div>
          </div>
          {selectedPeriod && (
            <Tabs
              value={selectedClass}
              onValueChange={setSelectedClass}
              className="mt-6"
            >
              <TabsList className="w-full justify-start h-auto flex-wrap gap-2 bg-transparent">
                {classes
                  .sort((a, b) => {
                    // First sort by grade
                    if (a.grade !== b.grade) {
                      return a.grade - b.grade;
                    }
                    // Then sort by literal
                    return a.literal.localeCompare(b.literal);
                  })
                  .map((cls) => (
                    <TabsTrigger
                      key={cls.id}
                      value={cls.id}
                      className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                    >
                      {cls.name}
                    </TabsTrigger>
                  ))}
              </TabsList>

              {classes
                .sort((a, b) => {
                  // Apply the same sorting for the content
                  if (a.grade !== b.grade) {
                    return a.grade - b.grade;
                  }
                  return a.literal.localeCompare(b.literal);
                })
                .map((cls) => (
                  <TabsContent key={cls.id} value={cls.id}>
                    <div className="p-4 mt-4 bg-white rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">
                        Timetable for {cls.name}
                      </h3>
                      <div className="space-y-6">
                        {WEEKDAYS.map((day) => (
                          <div key={day} className="border rounded-lg">
                            <h4 className="text-md font-medium p-4 bg-slate-50 border-b">
                              {day}
                            </h4>
                            <div className="p-4">
                              <table className="w-full">
                                <thead>
                                  <tr className="text-left border-b">
                                    <th className="pb-2 font-medium text-center pr-2 w-10">
                                      №
                                    </th>
                                    <th className="pb-2 font-medium text-left px-2">
                                      Time
                                    </th>
                                    <th className="pb-2 font-medium text-left px-2">
                                      Subject
                                    </th>
                                    <th className="pb-2 font-medium text-left px-2">
                                      Teacher
                                    </th>
                                    <th className="pb-2 font-medium text-left px-2">
                                      Room
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {lessons
                                    .sort(
                                      (a, b) =>
                                        a.lesson_number - b.lesson_number,
                                    )
                                    .map((lesson) => {
                                      const timeSlot = timeSlots.find(
                                        (ts) =>
                                          ts.lesson_id === lesson.id &&
                                          ts.day === day &&
                                          ts.class_id === cls.id,
                                      );
                                      // Determine the background color based on flags
                                      const subject = subjects.find(
                                        (s) => s.name === timeSlot?.subject,
                                      );
                                      const bgColor = subject
                                        ? false // Assuming is_extracurricular is not available, default to false
                                          ? "bg-purple-50"
                                          : false
                                            ? "bg-green-50"
                                            : ""
                                        : "";
                                      return (
                                        <tr
                                          key={`${day}-${lesson.id}`}
                                          className={`border-b last:border-0 ${bgColor}`}
                                        >
                                          <td className="py-3 text-center pr-2">
                                            {lesson.lesson_number}
                                          </td>
                                          <td className="py-3 text-left px-2">
                                            {lesson.start_time.slice(0, 5)}-
                                            {lesson.end_time.slice(0, 5)}
                                          </td>
                                          <td className="py-3 text-left px-2">
                                            {timeSlot ? timeSlot.subject : "-"}
                                          </td>
                                          <td className="py-3 text-left px-2">
                                            {timeSlot
                                              ? teachers.find(
                                                  (t) =>
                                                    t.id ===
                                                    timeSlot.teacher_id,
                                                )?.name
                                              : "-"}
                                          </td>
                                          <td className="py-3 text-left px-2">
                                            {timeSlot
                                              ? rooms.find(
                                                  (r) =>
                                                    r.id === timeSlot.room_id,
                                                )?.name
                                              : "-"}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                ))}
            </Tabs>
          )}
        </>
      )}
    </div>
  );
};

export default TimetableBuilder;
