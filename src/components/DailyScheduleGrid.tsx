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

const DailyScheduleGrid = ({ date = new Date() }: DailyScheduleGridProps) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlotWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  // Map English day names to Russian
  const dayMap: { [key: string]: string } = {
    Monday: "Понедельник",
    Tuesday: "Вторник",
    Wednesday: "Среда",
    Thursday: "Четверг",
    Friday: "Пятница",
    Saturday: "Суббота",
    Sunday: "Воскресенье",
  };

  const fetchData = async () => {
    try {
      const englishDayName = date.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const dayName = dayMap[englishDayName];

      console.log("Fetching data for day:", dayName);

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

      console.log("Time slots data:", timeSlotsData);

      if (timeSlotsError) throw timeSlotsError;

      const { data: academicPeriodsData, error: periodsError } = await supabase
        .from("academic_periods")
        .select("*")
        .order("name");

      if (periodsError) throw periodsError;

      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .order("name");

      if (classesError) throw classesError;

      setTimeSlots((timeSlotsData as TimeSlotWithDetails[]) || []);
      setAcademicPeriods(academicPeriodsData || []);
      setClasses(classesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [date]);

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
        <h2 className="text-2xl font-bold text-slate-900">
          {date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h2>

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
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
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
              <TableHead className="w-[100px]">Lesson №</TableHead>
              <TableHead>Time</TableHead>
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
