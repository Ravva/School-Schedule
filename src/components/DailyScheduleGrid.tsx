import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Button } from "./ui/button";
import { Database } from "@/lib/database.types";

type TimeSlot = Database["public"]["Tables"]["time_slots"]["Row"];
type Lesson = Database["public"]["Tables"]["lessons"]["Row"];
type Teacher = Database["public"]["Tables"]["teachers"]["Row"];
type Class = Database["public"]["Tables"]["classes"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];
type AcademicPeriod = Database["public"]["Tables"]["academic_periods"]["Row"];

interface DailyScheduleGridProps {
  date?: Date;
}

interface TimeSlotWithDetails extends TimeSlot {
  lesson: Lesson | null;
  teacher: Teacher | null;
  class: Class | null;
  room: Room | null;
}

const DailyScheduleGrid = ({ date: initialDate = new Date() }: DailyScheduleGridProps) => {
  const [date, setDate] = useState(initialDate);
  const [timeSlots, setTimeSlots] = useState<TimeSlotWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false); // Add here instead
  const fetchData = async () => {
    try {
      const englishDayName = date.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const dayMap: { [key: string]: string } = {
        'Monday': 'Понедельник',
        'Tuesday': 'Вторник',
        'Wednesday': 'Среда',
        'Thursday': 'Четверг',
        'Friday': 'Пятница',
        'Saturday': 'Суббота',
        'Sunday': 'Воскресенье'
      };
      const dayName = dayMap[englishDayName];
  
      // Fetch time slots
      const { data: timeSlotsData, error: timeSlotsError } = await supabase
        .from("time_slots")
        .select(
          `
          *,
          lesson:lesson_id(*),
          teacher:teacher_id(*),
          class:class_id(*),
          room:room_id(*)
        `,
        )
        .eq("day", dayName)
        .order("lesson_id");
  
      if (timeSlotsError) throw timeSlotsError;
  
      // Fetch academic periods
      const { data: academicPeriodsData, error: periodsError } = await supabase
        .from("academic_periods")
        .select("*")
        .order("name");
  
      if (periodsError) throw periodsError;
  
      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .order("name");
  
      if (classesError) throw classesError;
  
      // Fetch teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from("teachers")
        .select("*")
        .order("name");
  
      if (teachersError) throw teachersError;
  
      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .order("room_number");
  
      if (roomsError) throw roomsError;
  
      setTimeSlots(timeSlotsData as unknown as TimeSlotWithDetails[]);
      setAcademicPeriods(academicPeriodsData || []);
      setClasses(classesData || []);
      setTeachers(teachersData || []);
      setRooms(roomsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };
  // Update useEffect dependency
  useEffect(() => {
    fetchData();
  }, [date]); // Now it will refetch when date changes
  const filteredTimeSlots = timeSlots.filter((slot) => {
    if (selectedTeacher !== "all" && slot.teacher_id !== selectedTeacher)
      return false;
    if (selectedRoom !== "all" && slot.room_id !== selectedRoom) return false;
    if (selectedClass !== "all" && slot.class_id !== selectedClass)
      return false;
    if (selectedPeriod && slot.academic_period_id !== selectedPeriod)
      return false;
    return true;
  });
  return (
    <div className="w-full h-full bg-white p-6">
      <div className="mb-6 flex justify-between items-center">
      <div className="flex items-center gap-4">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[280px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPPP", { locale: ru })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  if (newDate) {
                    setDate(newDate);
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
                locale={ru}
              />
            </PopoverContent>
          </Popover>
        </div>
  
        <div className="flex gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Academic Period" />
            </SelectTrigger>
            <SelectContent>
              {academicPeriods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
  
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes
                .sort((a, b) => {
                  const aGrade = parseInt(a.name.match(/\d+/)?.[0] || '0');
                  const bGrade = parseInt(b.name.match(/\d+/)?.[0] || '0');
                  const aLiteral = a.name.match(/[A-Za-z]+/)?.[0] || '';
                  const bLiteral = b.name.match(/[A-Za-z]+/)?.[0] || '';
                  if (aGrade !== bGrade) return aGrade - bGrade;
                  return aLiteral.localeCompare(bLiteral);
                })
                .map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Teacher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedRoom} onValueChange={setSelectedRoom}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Room" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.room_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
  
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">№</TableHead>
              <TableHead className="w-[120px]">Time</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Subgroup</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredTimeSlots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No lessons found
                </TableCell>
              </TableRow>
            ) : (
              filteredTimeSlots
                .sort((a, b) => {
                  // Extract grade (number) and literal (letter) from class names
                  const aClass = a.class?.name || '';
                  const bClass = b.class?.name || '';
                  
                  const aGrade = parseInt(aClass.match(/\d+/)?.[0] || '0');
                  const bGrade = parseInt(bClass.match(/\d+/)?.[0] || '0');
                  
                  const aLiteral = aClass.match(/[A-Za-z]+/)?.[0] || '';
                  const bLiteral = bClass.match(/[A-Za-z]+/)?.[0] || '';
  
                  // Sort by grade first
                  if (aGrade !== bGrade) {
                    return aGrade - bGrade;
                  }
                  
                  // Then by literal
                  if (aLiteral !== bLiteral) {
                    return aLiteral.localeCompare(bLiteral);
                  }
                  
                  // Finally by lesson number
                  const aNum = a.lesson?.lesson_number || 0;
                  const bNum = b.lesson?.lesson_number || 0;
                  return aNum - bNum;
                })
                .map((slot) => (
                  <TableRow key={slot.id}>
                    <TableCell>{slot.lesson?.lesson_number}</TableCell>
                    <TableCell>
                      {slot.lesson?.start_time?.slice(0, 5)} -{" "}
                      {slot.lesson?.end_time?.slice(0, 5)}
                    </TableCell>
                    <TableCell>{slot.subject}</TableCell>
                    <TableCell>{slot.teacher?.name}</TableCell>
                    <TableCell>{slot.class?.name}</TableCell>
                    <TableCell>{slot.room?.room_number}</TableCell>
                    <TableCell>{slot.subgroup || "-"}</TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DailyScheduleGrid;