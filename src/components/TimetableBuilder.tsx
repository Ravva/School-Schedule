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
import { useEffect, useState, useMemo } from "react";
import { Plus, Edit, Trash2, PlusCircle, FileJson } from "lucide-react";
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
import { Teacher } from "@/types/supabase-override";
import { ImportPreviewModal } from "./ImportPreviewModal";
import { PeriodDialog } from "@/components/timetable/PeriodDialog";

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
  is_extracurricular?: boolean | null;
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
  const [isAddPeriodOpen, setIsAddPeriodOpen] = useState(false);
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
  const [showImportModal, setShowImportModal] = useState(false);

  const sortedSubjects = useMemo(() => 
    [...subjects].sort((a, b) => a.name.localeCompare(b.name)),
    [subjects]
  );

  // Добавим новый тип для редактируемого слота
  type EditingTimeSlot = {
    isSubgroups: boolean;
    slots: TimeSlot[];  // Заменили TimeSlotRow на TimeSlot
    lessonNumber: number;
    day: string;
  };

  const handleUpdateTimeSlot = async (updatedData: any) => {
    try {
      setEditingTimeSlot(null);

      const slotsToInsert = updatedData.slots
        .filter((slot: any) => 
          slot.day && 
          slot.lesson_id && 
          slot.subject &&
          slot.teacher_id && 
          slot.room_id
        )
        .map((slot: any) => ({
          day: slot.day,
          lesson_id: slot.lesson_id,
          subject: slot.subject,
          teacher_id: slot.teacher_id,
          room_id: slot.room_id,
          class_id: selectedClass,
          academic_period_id: selectedPeriod,
          subgroup: updatedData.isSubgroups ? slot.subgroup : null,
          created_at: new Date().toISOString()
        }));

      if (slotsToInsert.length === 0) {
        throw new Error('No valid slots to insert');
      }

      if (updatedData.slots[0].id === 'new') {
        // Создание новых слотов
        const { error } = await supabase
          .from("time_slots")
          .insert(slotsToInsert);

        if (error) throw error;
      } else {
        if (!updatedData.isSubgroups) {
          // Если не подгруппы, удаляем все существующие слоты для этого урока
          const { error: deleteError } = await supabase
            .from("time_slots")
            .delete()
            .eq("day", updatedData.slots[0].day)
            .eq("lesson_id", updatedData.slots[0].lesson_id)
            .eq("class_id", selectedClass)
            .eq("academic_period_id", selectedPeriod);

          if (deleteError) throw deleteError;

          // Создаем новый слот без подгруппы
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
              subgroup: null
            });

          if (error) throw error;
        } else {
          // Удаляем существующие слоты
          const { error: deleteError } = await supabase
            .from("time_slots")
            .delete()
            .eq("day", updatedData.slots[0].day)
            .eq("lesson_id", updatedData.slots[0].lesson_id)
            .eq("class_id", selectedClass)
            .eq("academic_period_id", selectedPeriod);

          if (deleteError) throw deleteError;

          // Создаем новые слоты для подгрупп
          const { error } = await supabase
            .from("time_slots")
            .insert(slotsToInsert);

          if (error) throw error;
        }
      }
      
      // Обновляем состояние после изменений
      const { data: updatedTimeSlots } = await supabase
        .from("time_slots")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("academic_period_id", selectedPeriod);
      
      setTimeSlots(updatedTimeSlots || []);
    } catch (error) {
      console.error('Error updating time slot:', error);
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

        setTeachers(transformedTeachers?.map(teacher => ({
          id: teacher.id,
          name: teacher.name,
          subjects: teacher.subjects,
          rooms: teacher.rooms.map(room => ({
            id: room.id,
            room_number: room.room_number,
            teacher_name: null,
            subject_name: null,
            class: null
          }))
        })) || []);
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
          subjects!inner(
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
    subgroupGrid: "grid grid-cols-2 gap-2",
    subgroupCell: "flex items-start justify-center", // изменено с items-center на items-start
    subgroupDivider: "border-r"
  };

  // В компоненте TimetableBuilder обновим обработку данных перед открытием формы
  const handleEditTimeSlot = (timeSlotsForLesson: TimeSlot[], lesson: Lesson, day: string) => {
    let formattedSlots: TimeSlot[];
    
    if (timeSlotsForLesson.length === 0) {
      // Находим урок по номеру
      const lessonForNumber = lessons.find(l => l.lesson_number === lesson.lesson_number);
      if (!lessonForNumber) return;

      formattedSlots = [{
        id: 'new',
        day: reverseWeekdayMap[day],
        lesson_id: lessonForNumber.id, // Используем ID найденного урока
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

  const renderTimeSlotsForClass = (cls: Class, day: string) => {
    return (
      <div className="space-y-2">
        {lessons
          .sort((a, b) => a.lesson_number - b.lesson_number)
          .filter(lesson => {
            // Получаем все уроки для этого дня
            const dayLessons = lessons
              .sort((a, b) => a.lesson_number - b.lesson_number)
              .map(l => {
                const slots = timeSlots.filter(
                  ts =>
                    ts.day === reverseWeekdayMap[day] &&
                    ts.lesson_id === l.id &&
                    ts.class_id === cls.id &&
                    ts.academic_period_id === selectedPeriod
                );
                return { lesson: l, hasSlots: slots.length > 0 };
              });

            // Находим последний урок с занятиями
            const lastFilledLessonIndex = dayLessons.reduce((acc, curr, idx) => 
              curr.hasSlots ? idx : acc, -1);

            // Показываем урок если:
            // 1. У него есть занятия
            // 2. ИЛИ его номер меньше или равен последнему заполненному уроку
            const hasSlots = timeSlots.some(
              ts =>
                ts.day === reverseWeekdayMap[day] &&
                ts.lesson_id === lesson.id &&
                ts.class_id === cls.id &&
                ts.academic_period_id === selectedPeriod
            );

            return hasSlots || lesson.lesson_number <= dayLessons[lastFilledLessonIndex]?.lesson.lesson_number;
          })
          .map((lesson) => {
            const timeSlotsForLesson = timeSlots.filter(
              (ts) =>
                ts.day === reverseWeekdayMap[day] &&
                ts.lesson_id === lesson.id &&
                ts.class_id === cls.id &&
                ts.academic_period_id === selectedPeriod
            );

            return (
              <div
                key={lesson.id}
                className={`border rounded p-2 cursor-pointer hover:bg-gray-50 min-h-[84px] flex items-center ${
                  timeSlotsForLesson.length > 1 
                    ? "bg-green-50" 
                    : subjects.find(s => s.name === timeSlotsForLesson[0]?.subject)?.is_extracurricular
                      ? "bg-purple-100" 
                      : ""
                }`}
                onClick={() => handleEditTimeSlot(timeSlotsForLesson, lesson, day)}
              >
                <div className={`w-full ${timeSlotsForLesson.length > 1 ? tableStyles.subgroupGrid : ""}`}>
                  {timeSlotsForLesson.map((slot) => (
                    <div key={slot.id} className={`${tableStyles.subgroupCell} h-full`}>
                      <div className="leading-none">
                        <div className="font-medium leading-tight">{slot.subject}</div>
                        <div className="text-sm text-gray-600 leading-tight">
                          {teachers.find((t) => t.id === slot.teacher_id)?.name}
                          {slot.subgroup && ` (${slot.subgroup})`}
                        </div>
                        <div className="text-sm text-gray-500 leading-tight">
                          {rooms.find((r) => r.id === slot.room_id)?.room_number}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        
        {/* Add button after the last lesson */}
        <button
          className="w-full h-[40px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors"
          onClick={() => {
            const currentDayTimeSlots = timeSlots.filter(
              ts => ts.day === reverseWeekdayMap[day] && 
                   ts.class_id === selectedClass &&
                   ts.academic_period_id === selectedPeriod
            );
            
            const maxLessonNumber = Math.max(
              ...currentDayTimeSlots.map(ts => 
                lessons.find(l => l.id === ts.lesson_id)?.lesson_number || 0
              ),
              0
            );

            const nextLessonNumber = maxLessonNumber + 1;
            const lessonForNumber = lessons.find(l => l.lesson_number === nextLessonNumber);
            
            if (!lessonForNumber) return;

            setEditingTimeSlot({
              slots: [{
                id: 'new',
                day: reverseWeekdayMap[day],
                lesson_id: lessonForNumber.id, // Используем ID найденного урока
                subject: '',
                teacher_id: null,
                room_id: null,
                class_id: selectedClass,
                academic_period_id: selectedPeriod,
                subgroup: null
              }],
              isSubgroups: false,
              lessonNumber: nextLessonNumber,
              day: day
            });
          }}
        >
          <Plus className="h-5 w-5 text-gray-400" />
        </button>
      </div>
    );
  };

  return (
    <div className="mx-auto p-4">
      <div className="flex flex-col space-y-4">
        {/* Period and Class Selection */}
        <div className="flex space-x-4 mb-4">
          <div className="w-[200px]">
            <Label>Academic Period</Label>
            <div className="flex items-center gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {academicPeriods.map((period) => (
                    <div key={period.id} className="flex items-center justify-between p-2">
                      <SelectItem value={period.id}>
                        {period.name}
                      </SelectItem>
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
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the academic period and remove all associated data.
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
                                    setAcademicPeriods(data || []);
                                    
                                    if (selectedPeriod === period.id) {
                                      setSelectedPeriod("");
                                    }
                                    
                                    toast({
                                      title: "Success",
                                      description: "Academic period deleted successfully",
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
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setIsEditMode(false);
                  setEditingPeriod(null);
                  setIsAddPeriodOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="w-[200px]">
            <Label>Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes
                  .sort((a, b) => {
                    // Sort by grade first
                    if (a.grade !== b.grade) {
                      return a.grade - b.grade;
                    }
                    // Then by literal
                    return (a.literal || '').localeCompare(b.literal || '');
                  })
                  .map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {/* Add Buttons */}
          <div className="flex items-end space-x-2">
            <Button 
              onClick={generateSchedule}
              disabled={!selectedClass || !selectedPeriod || isGenerating}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Generate Schedule
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowImportModal(true)}
              disabled={!selectedClass || !selectedPeriod}
            >
              <FileJson className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="grid grid-cols-[auto_auto_repeat(5,1fr)] gap-4">
          {/* Lesson Numbers column */}
          <div className="space-y-2">  {/* Changed from space-y-4 to space-y-2 */}
            <h3 className="text-lg font-semibold text-center mb-4">№</h3>
            {lessons
              .sort((a, b) => a.lesson_number - b.lesson_number)
              .map((lesson) => {
                const hasLessons = WEEKDAYS.some(day => {
                  const timeSlotsForLesson = timeSlots.filter(
                    ts =>
                      ts.day === reverseWeekdayMap[day] &&
                      ts.lesson_id === lesson.id &&
                      ts.class_id === selectedClass &&
                      ts.academic_period_id === selectedPeriod
                  );
                  return timeSlotsForLesson.length > 0;
                });

                return hasLessons ? (
                  <div key={lesson.id} className="h-[84px] flex items-center justify-center">
                    {lesson.lesson_number}
                  </div>
                ) : null;
              })}
          </div>
          
          {/* Time column */}
          <div className="space-y-2">  {/* Changed from space-y-4 to space-y-2 */}
            <h3 className="text-lg font-semibold text-center mb-4">Time</h3>
            {lessons
              .sort((a, b) => a.lesson_number - b.lesson_number)
              .map((lesson) => {
                const hasLessons = WEEKDAYS.some(day => {
                  const timeSlotsForLesson = timeSlots.filter(
                    ts =>
                      ts.day === reverseWeekdayMap[day] &&
                      ts.lesson_id === lesson.id &&
                      ts.class_id === selectedClass &&
                      ts.academic_period_id === selectedPeriod
                  );
                  return timeSlotsForLesson.length > 0;
                });

                return hasLessons ? (
                  <div key={lesson.id} className="h-[84px] flex items-center justify-center">
                    {lesson.start_time.slice(0, 5)}-{lesson.end_time.slice(0, 5)}
                  </div>
                ) : null;
              })}
          </div>

          {/* Days of the week */}
          {WEEKDAYS.map((day) => (
            <div key={day} className="space-y-4">
              <h3 className="text-lg font-semibold text-center">{day}</h3>
              {classes
                .filter((cls) => cls.id === selectedClass)
                .map((cls) => (
                  <div key={cls.id} className="space-y-2">
                    {renderTimeSlotsForClass(cls, day)}
                  </div>
                ))}
            </div>
          ))}
        </div>

        {/* Dialog */}
        <Dialog open={!!editingTimeSlot} onOpenChange={() => setEditingTimeSlot(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                Edit Lesson - {reverseWeekdayMap[editingTimeSlot?.day || ""]} - Урок{" "}
                {editingTimeSlot?.lessonNumber}
              </DialogTitle>
              <DialogDescription>
                Make changes to the lesson schedule below.
              </DialogDescription>
            </DialogHeader>
            {editingTimeSlot && (
              <TimeSlotForm
                timeSlot={editingTimeSlot}
                subjects={sortedSubjects}
                teachers={teachers}
                rooms={rooms.map(room => ({
                  id: room.id,
                  room_number: room.room_number,
                  teacher_name: null,
                  subject_name: null,
                  class: null
                }))}
                onSubmit={handleUpdateTimeSlot}
                onCancel={() => setEditingTimeSlot(null)}
                selectedPeriod={selectedPeriod}
                selectedClass={selectedClass}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Import Modal */}
        {showImportModal && (
          <ImportPreviewModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            selectedClass={selectedClass}
            selectedPeriod={selectedPeriod}
            onConfirm={async () => {
              setShowImportModal(false);
              const { data: updatedTimeSlots } = await supabase
                .from("time_slots")
                .select(`
                  *,
                  subjects!inner(
                    is_extracurricular
                  )
                `)
                .eq("academic_period_id", selectedPeriod)
                .eq("class_id", selectedClass);

              // Transform the data to include subjects info
              const transformedData = (updatedTimeSlots || []).map(slot => ({
                ...slot,
                subjects: {
                  is_extracurricular: updatedTimeSlots.find(s => s.subject === slot.subject)?.subjects?.is_extracurricular || false
                }
              }));

              setTimeSlots(transformedData);
            }}
            data={[]}  // Add your data array here
            teachers={teachers}
            rooms={rooms.map(room => ({
              id: room.id,
              name: room.room_number
            }))}
            lessons={lessons}
          />
        )}

        {/* Period Dialog */}
        <PeriodDialog
          open={isAddPeriodOpen}
          onOpenChange={setIsAddPeriodOpen}
          isEditMode={isEditMode}
          editingPeriod={editingPeriod}
          onSuccess={(data) => {
            setAcademicPeriods(data);
            setIsAddPeriodOpen(false);
            setIsEditMode(false);
            setEditingPeriod(null);
          }}
        />
      </div>
    </div>
  );
};

export default TimetableBuilder;
