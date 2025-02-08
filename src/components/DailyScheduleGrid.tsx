import React from "react";
import LessonCard from "./LessonCard";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface TimeSlot {
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string;
  room: string;
  isExtracurricular: boolean;
}

interface DailyScheduleGridProps {
  date?: Date;
  timeSlots?: TimeSlot[];
}

const defaultTimeSlots: TimeSlot[] = [
  {
    startTime: "09:00",
    endTime: "09:45",
    subject: "Mathematics",
    teacher: "John Smith",
    room: "101",
    isExtracurricular: false,
  },
  {
    startTime: "10:00",
    endTime: "10:45",
    subject: "Physics",
    teacher: "Sarah Johnson",
    room: "102",
    isExtracurricular: false,
  },
  {
    startTime: "11:00",
    endTime: "11:45",
    subject: "Chess Club",
    teacher: "Michael Brown",
    room: "103",
    isExtracurricular: true,
  },
  {
    startTime: "12:00",
    endTime: "12:45",
    subject: "English",
    teacher: "Emma Wilson",
    room: "104",
    isExtracurricular: false,
  },
];

const DailyScheduleGrid = ({
  date = new Date(),
  timeSlots = defaultTimeSlots,
}: DailyScheduleGridProps) => {
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
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Teacher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              <SelectItem value="john-smith">John Smith</SelectItem>
              <SelectItem value="sarah-johnson">Sarah Johnson</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Room" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              <SelectItem value="101">Room 101</SelectItem>
              <SelectItem value="102">Room 102</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="h-[700px] w-full rounded-md border border-slate-200">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {timeSlots.map((slot, index) => (
            <LessonCard
              key={index}
              startTime={slot.startTime}
              endTime={slot.endTime}
              subject={slot.subject}
              teacher={slot.teacher}
              room={slot.room}
              isExtracurricular={slot.isExtracurricular}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DailyScheduleGrid;
