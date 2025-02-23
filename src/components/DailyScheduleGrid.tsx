import React, { useEffect, useState } from "react";
import { supabase, type TimeSlotRow, type TeacherRow } from "@/lib/supabase";
import LessonCard from "./LessonCard";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface DailyScheduleGridProps {
  date?: Date;
}

// Update the component to use lesson_id instead of start/end time
// Add this interface near the top of the file
interface TimeSlotWithDetails extends TimeSlotRow {
  lesson?: {
    start_time: string;
    end_time: string;
  };
  teacher?: {
    name: string;
  } | null;
}

const DailyScheduleGrid = ({ date = new Date() }: DailyScheduleGridProps) => {
  // Update the timeSlots state to use the new interface
  const [timeSlots, setTimeSlots] = useState<TimeSlotWithDetails[]>([]);
  
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  // Add state for lessons
  const [lessons, setLessons] = useState<any[]>([]);
  
  useEffect(() => {
    fetchData();
  }, [date]);
  
  const fetchData = async () => {
    try {
      const [timeSlotsData, teachersData, lessonsData] = await Promise.all([
        supabase
          .from("time_slots")
          .select("*")
          .eq("day", date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()),
        supabase.from("teachers").select("*").order("name"),
        supabase.from("lessons").select("*").order("lesson_number"),
      ]);
  
      if (timeSlotsData.error) throw timeSlotsData.error;
      if (teachersData.error) throw teachersData.error;
      if (lessonsData.error) throw lessonsData.error;
  
      setLessons(lessonsData.data || []);
  
      const timeSlotsWithTeachers = await Promise.all(
        timeSlotsData.data?.map(async (slot) => {
          const { data: teacherData, error: teacherError } = await supabase
            .from("teachers")
            .select("name")
            .eq("id", slot.teacher_id)
            .single();
  
          // Get lesson times from lessons table
          const lesson = lessonsData.data?.find(l => l.id === slot.lesson_id);
  
          return {
            ...slot,
            teacher: teacherData ? { name: teacherData.name } : null,
            lesson: lesson ? {
              start_time: lesson.start_time,
              end_time: lesson.end_time
            } : undefined
          };
        }) || []
      );
  
      setTimeSlots(timeSlotsWithTeachers.map(slot => ({
        ...slot,
        room: slot.room_id // Map room_id to room to match TimeSlotWithDetails interface
      })));
      setTeachers(teachersData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };
  
    const filteredTimeSlots = timeSlots.filter((slot) => {
    if (selectedTeacher !== "all" && slot.teacher_id !== selectedTeacher) return false;
    if (selectedRoom !== "all" && (slot as any).room !== selectedRoom) return false;
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

        <div className="flex space-x-4">
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Teacher" />
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
              <SelectValue placeholder="Filter by Room" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {Array.from(new Set(timeSlots.map((slot) => (slot as any).room))).map((room) => (
                <SelectItem key={room} value={room}>
                  Room {room}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="h-full w-full rounded-md border border-slate-200">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div>Loading...</div>
          ) : (
            filteredTimeSlots.map((slot) => (
              // Update the LessonCard rendering
              <LessonCard
                key={slot.id}
                startTime={slot.lesson?.start_time || ""}
                endTime={slot.lesson?.end_time || ""}
                subject={slot.subject}
                teacher={(slot as any).teacher?.name ?? "No Teacher"}
                room={slot.room}
                isExtracurricular={slot.is_extracurricular}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DailyScheduleGrid;
