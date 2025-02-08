import React from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import { Clock, Plus } from "lucide-react";

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string;
  room: string;
}

interface TimetableBuilderProps {
  timeSlots?: TimeSlot[];
  onTimeSlotAdd?: (timeSlot: TimeSlot) => void;
  onTimeSlotMove?: (
    timeSlot: TimeSlot,
    newDay: string,
    newTime: string,
  ) => void;
}

const defaultTimeSlots: TimeSlot[] = [
  {
    id: "1",
    day: "Monday",
    startTime: "09:00",
    endTime: "09:45",
    subject: "Mathematics",
    teacher: "John Smith",
    room: "101",
  },
  {
    id: "2",
    day: "Monday",
    startTime: "10:00",
    endTime: "10:45",
    subject: "English",
    teacher: "Jane Doe",
    room: "102",
  },
  {
    id: "3",
    day: "Tuesday",
    startTime: "09:00",
    endTime: "09:45",
    subject: "Science",
    teacher: "Mike Johnson",
    room: "103",
  },
];

const TimetableBuilder = ({
  timeSlots = defaultTimeSlots,
  onTimeSlotAdd = () => {},
  onTimeSlotMove = () => {},
}: TimetableBuilderProps) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const times = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Weekly Timetable Builder
        </h2>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Time Slot
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Teacher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teachers</SelectItem>
            <SelectItem value="john">John Smith</SelectItem>
            <SelectItem value="jane">Jane Doe</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            <SelectItem value="math">Mathematics</SelectItem>
            <SelectItem value="english">English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {/* Time column */}
        <div className="pt-16">
          {times.map((time) => (
            <div
              key={time}
              className="h-24 flex items-center justify-center text-sm text-slate-600"
            >
              <Clock className="h-4 w-4 mr-2" />
              {time}
            </div>
          ))}
        </div>

        {/* Days columns */}
        {days.map((day) => (
          <div key={day} className="space-y-4">
            <div className="h-16 flex items-center justify-center font-semibold text-slate-900">
              {day}
            </div>
            {times.map((time) => (
              <Card
                key={`${day}-${time}`}
                className="h-24 border-2 border-dashed border-slate-200 p-2"
              >
                {timeSlots.find(
                  (slot) => slot.day === day && slot.startTime === time,
                ) && (
                  <div className="flex items-center gap-2 text-sm bg-slate-100 p-2 rounded">
                    <DragHandleDots2Icon className="h-4 w-4 text-slate-500" />
                    <div className="flex-1">
                      <div className="font-medium">Mathematics</div>
                      <div className="text-slate-500">Room 101</div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimetableBuilder;
