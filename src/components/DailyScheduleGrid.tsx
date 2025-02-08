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

const DailyScheduleGrid = ({ date = new Date() }: DailyScheduleGridProps) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlotRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [timeSlotsData, teachersData] = await Promise.all([
        supabase
          .from("time_slots")
          .select(
            `
            *,
            teacher:teacher_id(name)
          `,
          )
          .eq(
            "day",
            date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase(),
          )
          .order("start_time"),
        supabase.from("teachers").select("*").order("name"),
      ]);

      if (timeSlotsData.error) throw timeSlotsData.error;
      if (teachersData.error) throw teachersData.error;

      setTimeSlots(timeSlotsData.data || []);
      setTeachers(teachersData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTimeSlots = timeSlots.filter((slot) => {
    if (selectedTeacher !== "all" && slot.teacher_id !== selectedTeacher)
      return false;
    if (selectedRoom !== "all" && slot.room !== selectedRoom) return false;
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
              {Array.from(new Set(timeSlots.map((slot) => slot.room))).map(
                (room) => (
                  <SelectItem key={room} value={room}>
                    Room {room}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="h-[700px] w-full rounded-md border border-slate-200">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div>Loading...</div>
          ) : (
            filteredTimeSlots.map((slot) => (
              <LessonCard
                key={slot.id}
                startTime={slot.start_time}
                endTime={slot.end_time}
                subject={slot.subject}
                teacher={slot.teacher?.name}
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
