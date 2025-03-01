import { TimeSlotForm } from "./TimeSlotForm";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
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

// Интерфейс для существующих записей
interface TimeSlot {
  id: string;
  day: string;
  lesson_id: string;
  subject: string;
  teacher_id: string;
  room_id: string;
  class_id: string;
  subgroup?: number;
  academic_period_id: string;
  created_at?: string;
  subjects?: {  // Added this
    is_extracurricular: boolean;
  };
}

// Интерфейс для новых записей (без id)
interface NewTimeSlot {
  day: string;
  lesson_id: string;
  subject: string;
  teacher_id: string;
  room_id: string;
  class_id: string;
  subgroup?: number;
  academic_period_id: string;
  created_at?: string;
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
  subjects?: string[];
  rooms?: Room[];
}

interface Room {
  id: string;
  room_number: string;  // Changed from 'name' to 'room_number'
  class_id?: string;
  created_at?: string;
  subject_id?: string;
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
  const [editingTimeSlot, setEditingTimeSlot] = useState<EditingTimeSlot | null>(null);

  // Добавим новый тип для редактируемого слота
  type EditingTimeSlot = {
    isSubgroups: boolean;
    slots: TimeSlot[];  // Заменили TimeSlotRow на TimeSlot
    lessonNumber: number;
    day: string;
  };

  const handleUpdateTimeSlot = async (updatedData: any) => {
    try {
      setEditingTimeSlot(null); // Close dialog immediately

      if (updatedData.slots[0].id === 'new') {
        const { error } = await supabase
          .from("time_slots")
          .insert({
            day: updatedData.slots[0].day,
            lesson_id: updatedData.slots[0].lesson_id,
            subject: updatedData.slots[0].subject,
            teacher_id: updatedData.slots[0].teacher_id,
            room_id: updatedData.slots[0].room_id,
            class_id: selectedClass,
            academic_period_id: selectedPeriod,
            created_at: new Date().toISOString(),
            subgroup: updatedData.slots[0].subgroup
          });

        if (error) throw error;
      } else {
        // Update existing slots (your existing update logic)
        if (updatedData.isSubgroups) {
          for (const slot of updatedData.slots) {
            const { error } = await supabase
              .from("time_slots")
              .update({
                subject: slot.subject,
                teacher_id: slot.teacher_id,
                room_id: slot.room_id,
                subgroup: slot.subgroup
              })
              .eq("id", slot.id);

            if (error) throw error;
          }
        } else {
          const { error } = await supabase
            .from("time_slots")
            .update({
              subject: updatedData.slots[0].subject,
              teacher_id: updatedData.slots[0].teacher_id,
              room_id: updatedData.slots[0].room_id,
              subgroup: updatedData.slots[0].subgroup
            })
            .eq("id", updatedData.slots[0].id);

          if (error) throw error;
        }
      }
      
      // Refresh the time slots
      const { data: updatedTimeSlots } = await supabase
        .from("time_slots")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("academic_period_id", selectedPeriod);
      
      setTimeSlots(updatedTimeSlots || []);
    } catch (error: any) {
      console.error("Error updating time slot:", error);
      toast({
        variant: "destructive",
        title: "Error updating time slot",
        description: error.message
      });
    }
  };

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

    const fetchData = async () => {
      try {
        const [teachersData, subjectsData, roomsData] = await Promise.all([
          supabase
            .from("teachers")
            .select(`
              *,
              subjects,
              teacher_rooms(
                rooms(*)
              )
            `),
          supabase
            .from("subjects")
            .select("*"),
          supabase
            .from("rooms")
            .select("*")
        ]);

        // Transform the teachers data to include rooms
        const transformedTeachers = teachersData.data?.map(teacher => ({
          id: teacher.id,
          name: teacher.name,
          subjects: teacher.subjects || [],
          rooms: teacher.teacher_rooms?.map(tr => tr.rooms) || []
        }));

        setTeachers(transformedTeachers || []);
        setSubjects(subjectsData.data || []);
        setRooms(roomsData.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const fetchAllData = async () => {
      await Promise.all([
        fetchAcademicPeriods(),
        fetchClasses(),
        fetchLessons(),
        fetchData()
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
        .select(`
          *,
          subjects!inner (
            is_extracurricular
          )
        `)
        .eq("academic_period_id", selectedPeriod)
        .eq("class_id", selectedClass);

      if (error) throw error;

      // Transform the data to include subjects info
      const transformedData = (data || []).map(slot => ({
        ...slot,
        subjects: {
          is_extracurricular: data.find(s => s.subject === slot.subject)?.subjects?.is_extracurricular || false
        }
      }));

      setTimeSlots(transformedData);
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

      const newTimeSlots: NewTimeSlot[] = [];
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
              academic_period_id: selectedPeriod
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

  // Add these styles at the top of your component or in a separate CSS file
  const tableStyles = {
    table: "w-full table-fixed", // Make table fixed width
    cell: "py-3 px-2",
    headerCell: "pb-2 font-medium text-center px-2",
    numberCol: "w-[8%] text-center",  // Already centered
    timeCol: "w-[15%] text-center",   // Added text-center here
    subjectCol: "w-[32%]", 
    teacherCol: "w-[25%]",
    roomCol: "w-[20%]",
    subgroupGrid: "grid grid-cols-2 gap-2 h-full",
    subgroupCell: "h-full flex items-center justify-center",
    subgroupDivider: "border-r"
  };

  // В компоненте TimetableBuilder обновим обработку данных перед открытием формы
  const handleEditTimeSlot = (timeSlotsForLesson: TimeSlot[], lesson: Lesson, day: string) => {
    let formattedSlots: TimeSlot[];
    
    if (timeSlotsForLesson.length === 0) {
      formattedSlots = [{
        id: 'new',
        day: reverseWeekdayMap[day],
        lesson_id: lesson.id,
        subject: '',
        teacher_id: '',
        room_id: '',
        class_id: selectedClass,
        academic_period_id: selectedPeriod,
        created_at: new Date().toISOString()
      }];
    } else {
      formattedSlots = timeSlotsForLesson.map(slot => ({
        ...slot,
        subject: slot.subject || '',
      }));
    }

    setEditingTimeSlot({
      isSubgroups: timeSlotsForLesson.length > 1,
      slots: formattedSlots,
      lessonNumber: lesson.lesson_number,
      day: day
    });
  };

  // Add these helper functions at component level
  const getTeachersForSubject = (subjectName: string): Teacher[] => {
    return teachers.filter(teacher => {
      // Check if teacher has this subject in their subjects array
      const teacherData = teachers.find(t => t.id === teacher.id);
      return teacherData?.subjects?.includes(subjectName);
    });
  };

  const getRoomsForTeacher = (teacherId: string): Room[] => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher?.rooms) return rooms; // If no rooms specified, return all rooms
    return rooms.filter(room => 
      teacher.rooms.some(teacherRoom => teacherRoom.id === room.id)
    );
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
                rooms={rooms.map(room => ({ id: room.id, name: room.room_number }))}
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
                            <table className={tableStyles.table}>
                              <thead>
                                <tr className="text-left border-b">
                                  <th className={`${tableStyles.headerCell} ${tableStyles.numberCol}`}>
                                    №
                                  </th>
                                  <th className={`${tableStyles.headerCell} ${tableStyles.timeCol}`}>
                                    Time
                                  </th>
                                  <th className={`${tableStyles.headerCell} ${tableStyles.subjectCol}`}>
                                    Subject
                                  </th>
                                  <th className={`${tableStyles.headerCell} ${tableStyles.teacherCol}`}>
                                    Teacher
                                  </th>
                                  <th className={`${tableStyles.headerCell} ${tableStyles.roomCol}`}>
                                    Room
                                  </th>
                                  <th className={`${tableStyles.headerCell} w-[10%]`}>Actions</th>
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

    if (lesson.lesson_number >= 7 && timeSlotsForLesson.length === 0) {
      return null;
    }

    const isExtracurricular = timeSlotsForLesson.length > 0 && 
      timeSlotsForLesson[0].subjects?.is_extracurricular;

    const bgColor = timeSlotsForLesson.length > 1 
      ? "bg-green-50" 
      : isExtracurricular 
        ? "bg-purple-50" 
        : "";

    return (
      <tr
        key={`${day}-${lesson.id}`}
        className={`border-b last:border-0 ${bgColor}`}
      >
                                        <td className={`${tableStyles.cell} text-center ${tableStyles.numberCol}`}>
                                          {lesson.lesson_number}
                                        </td>
                                        <td className={`${tableStyles.cell} ${tableStyles.timeCol} text-center`}>
                                          <div className="flex justify-center items-center">
                                            {lesson.start_time.slice(0, 5)}-{lesson.end_time.slice(0, 5)}
                                          </div>
                                        </td>
                                          <td className={`${tableStyles.cell} ${tableStyles.subjectCol}`}>
                                          {timeSlotsForLesson.length > 0 ? (
                                            timeSlotsForLesson.length > 1 ? (
                                              <div className={tableStyles.subgroupGrid}>
                                                <div className={`${tableStyles.subgroupCell} ${tableStyles.subgroupDivider}`}>
                                                  {timeSlotsForLesson.find(ts => ts.subgroup === 1)?.subject + "(1)" || "-"}
                                                </div>
                                                <div className={tableStyles.subgroupCell}>
                                                  {timeSlotsForLesson.find(ts => ts.subgroup === 2)?.subject + "(2)" || "-"}
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="text-center">
                                                {timeSlotsForLesson[0].subject + (timeSlotsForLesson[0].subgroup ? `(${timeSlotsForLesson[0].subgroup})` : "")}
                                              </div>
                                            )
                                          ) : (
                                            <div className="text-center">-</div>
                                          )}
                                        </td>
                                        <td className={`${tableStyles.cell} ${tableStyles.teacherCol}`}>
                                          {timeSlotsForLesson.length > 1 ? (
                                            <div className={tableStyles.subgroupGrid}>
                                              <div className={`${tableStyles.subgroupCell} ${tableStyles.subgroupDivider}`}>
                                                {teachers.find(t => t.id === timeSlotsForLesson.find(ts => ts.subgroup === 1)?.teacher_id)?.name || "-"}
                                              </div>
                                              <div className={tableStyles.subgroupCell}>
                                                {teachers.find(t => t.id === timeSlotsForLesson.find(ts => ts.subgroup === 2)?.teacher_id)?.name || "-"}
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="text-center">
                                              {teachers.find(t => t.id === timeSlotsForLesson[0]?.teacher_id)?.name || "-"}
                                            </div>
                                          )}
                                        </td>
                                        <td className={`${tableStyles.cell} ${tableStyles.roomCol}`}>
                                          {timeSlotsForLesson.length > 1 ? (
                                            <div className={tableStyles.subgroupGrid}>
                                              <div className={`${tableStyles.subgroupCell} ${tableStyles.subgroupDivider}`}>
                                                {rooms.find(r => r.id === timeSlotsForLesson.find(ts => ts.subgroup === 1)?.room_id)?.room_number || "-"}
                                              </div>
                                              <div className={tableStyles.subgroupCell}>
                                                {rooms.find(r => r.id === timeSlotsForLesson.find(ts => ts.subgroup === 2)?.room_id)?.room_number || "-"}
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="text-center">
                                              {rooms.find(r => r.id === timeSlotsForLesson[0]?.room_id)?.room_number || "-"}
                                            </div>
                                          )}
                                        </td>
                                        <td className={`${tableStyles.cell} text-right`}>
                                          <Dialog 
                                            open={editingTimeSlot !== null} 
                                            onOpenChange={(open) => !open && setEditingTimeSlot(null)}
                                          >
                                            <DialogTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleEditTimeSlot(timeSlotsForLesson, lesson, day);
                                                }}
                                              >
                                                <Edit className="h-4 w-4" />
                                              </Button>
                                            </DialogTrigger>
                                            {editingTimeSlot && (
                                              <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                  <DialogTitle>
                                                    Edit Lesson - {reverseWeekdayMap[editingTimeSlot?.day || ""]} - Урок {editingTimeSlot?.lessonNumber}
                                                  </DialogTitle>
                                                  <DialogDescription>
                                                    Edit the details for this time slot
                                                  </DialogDescription>
                                                </DialogHeader>
                                                <TimeSlotForm
                                                  timeSlot={editingTimeSlot}
                                                  subjects={Array.from(subjects).sort((a, b) => a.name.localeCompare(b.name))}
                                                  teachers={teachers.map(teacher => ({
                                                    id: teacher.id,
                                                    name: teacher.name,
                                                    subjects: teacher.subjects || [],
                                                    rooms: teacher.rooms?.map(room => ({
                                                      id: room.id,
                                                      name: room.room_number, // Convert room_number to name to match the expected interface
                                                    })) || []
                                                  }))}
                                                  rooms={rooms.map(room => ({
                                                    id: room.id,
                                                    name: room.room_number
                                                  }))}
                                                  onSubmit={handleUpdateTimeSlot}
                                                  onCancel={() => setEditingTimeSlot(null)}
                                                  selectedPeriod={selectedPeriod}
                                                  selectedClass={selectedClass}
                                                />
                                              </DialogContent>
                                            )}
                                          </Dialog>
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
