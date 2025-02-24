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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { PeriodManager } from "./timetable/PeriodManager";
import { ImportJSON } from "./ImportJSON";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
// First, add a reverse weekday map for English to Russian conversion
const reverseWeekdayMap: { [key: string]: string } = {
  "Monday": "Понедельник",
  "Tuesday": "Вторник",
  "Wednesday": "Среда",
  "Thursday": "Четверг",
  "Friday": "Пятница",
};
const weekdayMap: { [key: string]: string } = {
  "Понедельник": "Monday",
  "Вторник": "Tuesday",
  "Среда": "Wednesday",
  "Четверг": "Thursday",
  "Пятница": "Friday",
};

interface TimeSlot {
  day: string;
  lesson_id: string;
  subject: string;
  teacher_id: string;
  room_id: string;
  class_id: string;
  subgroup?: number;
  academic_period_id: string;  // Add this field
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
  const [periodToDelete, setPeriodToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null);
  const [newPeriod, setNewPeriod] = useState({
    name: '',
    start_date: '',
    end_date: ''
  });
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<{[key: string]: string}>({});
  const [selectedTeachers, setSelectedTeachers] = useState<{[key: string]: string}>({});
  const [selectedRooms, setSelectedRooms] = useState<{[key: string]: string}>({});
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchAcademicPeriods = async () => {
      const { data, error } = await supabase.from("academic_periods").select("*");
      if (error) {
        console.error("Error fetching academic periods:", error);
      } else {
        setAcademicPeriods(data || []);
        // Auto-select the first period if available
        if (data && data.length > 0) {
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
      const { data, error } = await supabase.from("rooms").select("*");
      if (error) {
        console.error("Error fetching rooms:", error);
      } else {
        const formattedRooms = (data || []).map(room => ({
          id: room.id,
          name: room.room_number
        }));
        setRooms(formattedRooms);
      }
    };

    const fetchAllData = async () => {
      await Promise.all([
        fetchAcademicPeriods(),
        fetchClasses(),
        fetchLessons(),
        fetchSubjects(),
        fetchTeachers(),
        fetchRooms()
      ]);
    };

    fetchAllData();
  }, []); // Empty dependency array - runs only on mount

// Separate useEffect for timeSlots
// Add this state to track loading state for time slots
const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);

// Update the useEffect for timeSlots
useEffect(() => {
  const fetchTimeSlots = async () => {
    if (!selectedPeriod || !selectedClass) {
      setTimeSlots([]);
      return;
    }
    
    setIsLoadingTimeSlots(true);
    try {
      const { data, error } = await supabase
        .from("time_slots")
        .select("*")
        .eq("academic_period_id", selectedPeriod)
        .eq("class_id", selectedClass);
    
      if (error) throw error;
      setTimeSlots(data || []);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setTimeSlots([]);
    } finally {
      setIsLoadingTimeSlots(false);
    }
  };

  fetchTimeSlots();
}, [selectedPeriod, selectedClass]);

  const generateSchedule = async () => {
    try {
      setIsGenerating(true);

      const { data: syllabusData, error: syllabusError } = await supabase
        .from("syllabus")
        .select("*, subjects(*), teachers(*)")
        .eq("class_id", selectedClass);

      if (syllabusError) throw syllabusError;

      const { data: subjectTeachers, error: stError } = await supabase
        .from("subject_teachers")
        .select("*, subjects(*), teachers(*)")
        .eq("class_id", selectedClass);

      if (stError) throw stError;

      if (!syllabusData?.length && (!subjectTeachers || !subjectTeachers.length)) {
        throw new Error("No teacher assignments found for this class. Please set up the syllabus first.");
      }

      const { error: deleteError } = await supabase
        .from("time_slots")
        .delete()
        .eq("class_id", selectedClass)
        .eq("academic_period_id", selectedPeriod);

      if (deleteError) throw deleteError;

      const newTimeSlots: TimeSlot[] = [];
      const subjectHoursAssigned = new Map<string, number>();

      syllabusData?.forEach((syllabus) => {
        subjectHoursAssigned.set(syllabus.subject_id, 0);
      });

      const availableSlots = [];
      for (const day of WEEKDAYS) {
        for (const lesson of lessons) {
          availableSlots.push({ day, lesson });
        }
      }

      availableSlots.sort(() => Math.random() - 0.5);

      for (const syllabus of syllabusData || []) {
        const hoursNeeded = syllabus.amount_of_academic_hours_per_week || 0;
        let currentHours = subjectHoursAssigned.get(syllabus.subject_id) || 0;

        while (currentHours < hoursNeeded) {
          for (const slot of availableSlots) {
            if (currentHours >= hoursNeeded) break;

            const isSlotUsed = newTimeSlots.some(
              (ts) => ts.day === slot.day && ts.lesson_id === slot.lesson.id
            );

            if (isSlotUsed) continue;

            const isTeacherBusy = newTimeSlots.some(
              (ts) =>
                ts.day === slot.day &&
                ts.lesson_id === slot.lesson.id &&
                ts.teacher_id === syllabus.teacher_id
            );
            if (isTeacherBusy) continue;

            const usedRoomIds = newTimeSlots
              .filter((ts) => ts.day === slot.day && ts.lesson_id === slot.lesson.id)
              .map((ts) => ts.room_id);

            const roomsQuery = supabase.from("rooms").select("*");
            const { data: availableRooms, error: rError } = await (
              usedRoomIds.length > 0
                ? roomsQuery.not("id", "in", usedRoomIds)
                : roomsQuery
            );

            if (rError) throw rError;
            if (!availableRooms?.length) continue;

            const randomRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];

            const subjectName = subjects.find((s) => s.id === syllabus.subject_id)?.name;
            if (!subjectName) continue;

            newTimeSlots.push({
              day: slot.day,
              lesson_id: slot.lesson.id,
              subject: subjectName,
              teacher_id: syllabus.teacher_id,
              room_id: randomRoom.id,
              class_id: selectedClass,
              academic_period_id: selectedPeriod  // Add this field
            });

            currentHours++;
            subjectHoursAssigned.set(syllabus.subject_id, currentHours);
          }
        }
      }

      for (const slot of newTimeSlots) {
        const { error: insertError } = await supabase
          .from("time_slots")
          .insert({
            ...slot,
            academic_period_id: selectedPeriod,
            created_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      const { data: updatedTimeSlots, error: fetchError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("academic_period_id", selectedPeriod);

      if (fetchError) throw fetchError;

      setTimeSlots(updatedTimeSlots || []);

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
              <PeriodManager
                academicPeriods={academicPeriods}
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
                onPeriodsUpdate={setAcademicPeriods}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={generateSchedule}
                disabled={!selectedPeriod || !selectedClass || isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate Schedule"}
              </Button>
              <ImportJSON
                selectedClass={selectedClass}
                teachers={teachers}
                rooms={rooms}
                classes={classes}
                lessons={lessons}
                weekdayMap={weekdayMap}
                selectedPeriod={selectedPeriod}
                onImportComplete={async () => {
                  try {
                    const { data, error } = await supabase
                      .from("time_slots")
                      .select("*")
                      .eq("class_id", selectedClass)
                      .eq("academic_period_id", selectedPeriod);
                    
                    if (error) throw error;
                    setTimeSlots(data || []);
                  } catch (error) {
                    console.error("Error refreshing time slots:", error);
                  }
                }}
              />
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
                    if (a.grade !== b.grade) {
                      return a.grade - b.grade;
                    }
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
                                  <th className="pb-2 font-medium text-center px-2">
                                    Subject
                                  </th>
                                  <th className="pb-2 font-medium text-center px-2">
                                    Teacher
                                  </th>
                                  <th className="pb-2 font-medium text-center px-2">
                                    Room
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                              {lessons
  .sort((a, b) => a.lesson_number - b.lesson_number)
  .map((lesson) => {
    const timeSlotsForLesson = timeSlots.filter(
      (ts) =>
        ts.lesson_id === lesson.id &&
        ts.day === reverseWeekdayMap[day] && // Only check for Russian day name
        ts.class_id === cls.id &&
        ts.academic_period_id === selectedPeriod
    );
    // Hide rows with lesson number 7+ if they have no subject data
    if (lesson.lesson_number >= 7 && timeSlotsForLesson.length === 0) {
      return null;
    }
    const bgColor = timeSlotsForLesson.length > 1 ? "bg-green-50" : "";
    return (
      <tr
        key={`${day}-${lesson.id}`}
        className={`border-b last:border-0 ${bgColor}`}
      >
                                        <td className="py-3 text-center pr-2">
                                          {lesson.lesson_number}
                                        </td>
                                        <td className="py-3 text-left px-2">
                                          {lesson.start_time.slice(0, 5)}-{lesson.end_time.slice(0, 5)}
                                        </td>
                                          <td className="py-3 text-center px-2">
                                          {timeSlotsForLesson.length > 0 ? (
                                            timeSlotsForLesson.length > 1 ? (
                                              <div className="grid grid-cols-2 gap-2">
                                                <div className="border-r pr-2 text-center">
                                                  {timeSlotsForLesson.find(ts => ts.subgroup === 1)?.subject + "(1)" || "-"}
                                                </div>
                                                <div className="pl-2 text-center">
                                                  {timeSlotsForLesson.find(ts => ts.subgroup === 2)?.subject + "(2)" || "-"}
                                                </div>
                                              </div>
                                            ) : (
                                              timeSlotsForLesson[0].subject + (timeSlotsForLesson[0].subgroup ? `(${timeSlotsForLesson[0].subgroup})` : "")
                                            )
                                          ) : (
                                            "-"
                                          )}
                                        </td>
                                        <td className="py-3 text-center px-2">
                                          {timeSlotsForLesson.length > 1 ? (
                                            <div className="grid grid-cols-2 gap-2">
                                              <div className="border-r pr-2 text-center">
                                                {teachers.find(t => t.id === timeSlotsForLesson.find(ts => ts.subgroup === 1)?.teacher_id)?.name || "-"}
                                              </div>
                                              <div className="pl-2 text-center">
                                                {teachers.find(t => t.id === timeSlotsForLesson.find(ts => ts.subgroup === 2)?.teacher_id)?.name || "-"}
                                              </div>
                                            </div>
                                          ) : (
                                            teachers.find(t => t.id === timeSlotsForLesson[0]?.teacher_id)?.name || "-"
                                          )}
                                        </td>
                                        <td className="py-3 text-center px-2">
                                          {timeSlotsForLesson.length > 1 ? (
                                            <div className="grid grid-cols-2 gap-2">
                                              <div className="border-r pr-2 text-center">
                                                {rooms.find(r => r.id === timeSlotsForLesson.find(ts => ts.subgroup === 1)?.room_id)?.name || "-"}
                                              </div>
                                              <div className="pl-2 text-center">
                                                {rooms.find(r => r.id === timeSlotsForLesson.find(ts => ts.subgroup === 2)?.room_id)?.name || "-"}
                                              </div>
                                            </div>
                                          ) : (
                                            rooms.find(r => r.id === timeSlotsForLesson[0]?.room_id)?.name || "-"
                                          )}
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