import React from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import {
  Calendar,
  Users,
  CalendarRange,
  User,
  School,
  DoorOpen,
  BookOpen,
  Clock,
  NotebookPen,
} from "lucide-react";
import { cn } from "../lib/utils";

import type { ViewMode } from "./home";

interface SidebarProps {
  activeView?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
}

const Sidebar = ({
  activeView = "timetable",
  onViewChange = () => {},
}: SidebarProps) => {
  const navigationItems = [
    { id: "timetable", label: "Daily Schedule", icon: Calendar },
    { id: "teachers", label: "Teachers", icon: Users },
    { id: "subjects", label: "Subjects", icon: BookOpen },
    { id: "lessons", label: "Lessons", icon: Clock },
    { id: "rooms", label: "Rooms", icon: DoorOpen },
    { id: "classes", label: "Classes", icon: School },
    { id: "syllabus", label: "Syllabus", icon: NotebookPen },
    { id: "builder", label: "Timetable Builder", icon: CalendarRange },
  ];

  return (
    <div className="w-[280px] h-full bg-slate-50 border-r border-slate-200 flex flex-col">
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">
          School Dashboard
        </h2>

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeView === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2",
                  activeView === item.id ? "bg-slate-200" : "",
                )}
                onClick={() => onViewChange(item.id as any)}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
