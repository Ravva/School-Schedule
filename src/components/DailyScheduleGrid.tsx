import React, { useEffect, useState } from "react";
import { supabase, type TimeSlotRow, type TeacherRow } from "@/lib/supabase";
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

type Lesson = Database["public"]["Tables"]["lessons"]["Row"];
type Teacher = Database["public"]["Tables"]["teachers"]["Row"];
type Class = Database["public"]["Tables"]["classes"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];

interface DailyScheduleGridProps {
  date?: Date;
}

interface TimeSlotWithDetails
  extends Omit<TimeSlotRow, "lesson" | "teacher" | "class"> {
  lesson: Lesson | null;
  teacher: Teacher | null;
  class: Class | null;
  room: Room | null;
}

const DailyScheduleGrid = ({ date = new Date() }: DailyScheduleGridProps) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlotWithDetails[]>([]);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");  // Changed from "all" to ""
  const [lessons, setLessons] = useState<any[]>([]);

  // Modify the fetchWithRetry function
  // Remove the first fetchWithRetry and keep only this one
  const fetchWithRetry = async <T,>(
    queryFn: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> => {
    try {
      return await queryFn();
    } catch (error) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(queryFn, retries - 1, delay * 2);
      }
      throw error;
    }
  };

  const fetchData = async () => {
        try {
          const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
          //console.log('Querying for day:', dayName);
    
          const [
            timeSlotsData,
            teachersData,
            lessonsData,
            classesData,
            roomsData,
            academicPeriodsData,
        ] = await Promise.all([
          fetchWithRetry(() =>
            supabase
              .from("time_slots")
              .select(
                `
                  *,
                  lesson:lesson_id (*),
                  teacher:teacher_id (*),
                  class:class_id (*),
                  room:room_id (*)
                `
              )
              .eq("day", dayName.toLowerCase())
              .then((result) => result)
          ),
          fetchWithRetry(() =>
            supabase
              .from("teachers")
              .select("*")
              .order("name")
              .then((result) => result)
          ),
          fetchWithRetry(() =>
            supabase
              .from("lessons")
              .select("*")
              .order("lesson_number")
              .then((result) => result)
          ),
          fetchWithRetry(() =>
            supabase
              .from("classes")
              .select("*")
              .order("name")
              .then((result) => result)
          ),
          fetchWithRetry(() =>
            supabase
              .from("rooms")
              .select("*")
              .order("room_number")
              .then((result) => result)
          ),
          fetchWithRetry(() =>
            supabase
              .from("academic_periods")
              .select("*")
              .order("name")
              .then((result) => result)
          ),
        ]);

        if (timeSlotsData.error) throw timeSlotsData.error;
        if (teachersData.error) throw teachersData.error;
        if (lessonsData.error) throw lessonsData.error;
        if (classesData.error) throw classesData.error;
        if (roomsData.error) throw roomsData.error;
        if (academicPeriodsData.error) throw academicPeriodsData.error;

      const formattedTimeSlots: TimeSlotWithDetails[] = (
        timeSlotsData.data || []
      ).map((slot) => {
        return {
          id: slot.id,
          day: slot.day,
          lesson_id: slot.lesson_id,
          subject: slot.subject,
          teacher_id: slot.teacher_id,
          room: slot.room,
          class_id: slot.class_id,
          subgroup: slot.subgroup,
          academic_period_id: slot.academic_period_id,
          created_at: slot.created_at,
          is_extracurricular: slot.is_extracurricular,
          lesson: slot.lesson,
          teacher: slot.teacher,
          class: slot.class,
        };
      });

        const sortedClasses = (classesData.data || []).sort((a, b) => {
          const gradeA = parseInt(a.name.match(/\d+/)?.[0] || "0");
          const gradeB = parseInt(b.name.match(/\d+/)?.[0] || "0");
          if (gradeA !== gradeB) return gradeA - gradeB;
          return a.name.localeCompare(b.name);
        });

          setTimeSlots(formattedTimeSlots);
          setTeachers(teachersData.data || []);
          setClasses(sortedClasses);
          setLessons(lessonsData.data || []);
          setAcademicPeriods(academicPeriodsData.data || []); // Fix: Use academicPeriodsData instead of periodsData
        } catch (error) {
         // console.error("Error fetching data:", error);
          setLoading(false);
        } finally {
          setLoading(false);
        }
      };
      useEffect(() => {
        fetchData();
      }, [date, selectedTeacher, selectedRoom, selectedClass, selectedPeriod]);

      const filteredTimeSlots = timeSlots.filter((slot) => {
        console.log("Checking slot:", {
          slot,
          teacherMatch:
            selectedTeacher === "all" || slot.teacher_id === selectedTeacher,
          roomMatch: selectedRoom === "all" || slot.room?.id === selectedRoom,
          classMatch: selectedClass === "all" || slot.class_id === selectedClass,
          periodMatch:
            !selectedPeriod || slot.academic_period_id === selectedPeriod,
        });

        if (selectedTeacher !== "all" && slot.teacher_id !== selectedTeacher)
          return false;
        if (selectedRoom !== "all" && slot.room?.id !== selectedRoom)
          return false;
        if (selectedClass !== "all" && slot.class_id !== selectedClass)
          return false;
        if (selectedPeriod && slot.academic_period_id !== selectedPeriod)
          return false;
        return true;
      });

      return (
        <div className="w-full h-full bg-white p-6">
          {/* Debug section */}
          <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
            <p>Debug Info:</p>
            <p>Date: {date.toLocaleDateString()}</p>
            <p>Day: {date.toLocaleDateString("en-US", { weekday: "long" })}</p>
            <p>Total Time Slots: {timeSlots.length}</p>
            <p>Filtered Time Slots: {filteredTimeSlots.length}</p>
            <p>Loading: {loading ? "Yes" : "No"}</p>
          </div>

      {/* Rest of your component */}
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

          {/* Existing teacher and room filters */}
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
                .sort((a, b) => (a.lesson?.lesson_number || 0) - (b.lesson?.lesson_number || 0))
                .map((slot) => (
                  <TableRow key={slot.id}>
                    <TableCell>{slot.lesson?.lesson_number}</TableCell>
                    <TableCell>
                      {slot.lesson?.start_time?.slice(0, 5)} - {slot.lesson?.end_time?.slice(0, 5)}
                    </TableCell>
                    <TableCell>{slot.subject}</TableCell>
                    <TableCell>{slot.teacher?.name}</TableCell>
                    <TableCell>{slot.class?.name}</TableCell>
                    <TableCell>{slot.room?.room_number}</TableCell>
                    <TableCell>{slot.subgroup || '-'}</TableCell>
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
