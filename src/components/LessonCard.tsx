import React from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock, MapPin, User } from "lucide-react";

interface LessonCardProps {
  startTime?: string;
  endTime?: string;
  subject?: string;
  teacher?: string;
  room?: string;
  isExtracurricular?: boolean;
}

const LessonCard = ({
  startTime = "09:00",
  endTime = "09:45",
  subject = "Mathematics",
  teacher = "John Smith",
  room = "101",
  isExtracurricular = false,
}: LessonCardProps) => {
  return (
    <Card
      className={`w-[280px] h-[120px] ${isExtracurricular ? "bg-purple-50" : "bg-slate-50"}`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              {startTime} - {endTime}
            </span>
          </div>
          {isExtracurricular && (
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-800"
            >
              Extracurricular
            </Badge>
          )}
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-2">{subject}</h3>

        <div className="flex items-center space-x-4 text-sm text-slate-600">
          <div className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>{teacher}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" />
            <span>Room {room}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonCard;
