import React from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import {
  Calendar,
  Users,
  CalendarRange,
  Filter,
  User,
  School,
  DoorOpen,
  BookOpen,
} from "lucide-react";
import { cn } from "../lib/utils";

interface SidebarProps {
  activeView?: "timetable" | "teachers" | "subjects" | "builder";
  onViewChange?: (
    view: "timetable" | "teachers" | "subjects" | "builder",
  ) => void;
  selectedFilter?: "teacher" | "class" | "room";
  onFilterChange?: (filter: "teacher" | "class" | "room") => void;
}

const Sidebar = ({
  activeView = "timetable",
  onViewChange = () => {},
  selectedFilter = "teacher",
  onFilterChange = () => {},
}: SidebarProps) => {
  const navigationItems = [
    { id: "timetable", label: "Daily Schedule", icon: Calendar },
    { id: "teachers", label: "Teachers", icon: Users },
    { id: "subjects", label: "Subjects", icon: BookOpen },
    { id: "builder", label: "Schedule Builder", icon: CalendarRange },
  ];

  const filterItems = [
    { id: "teacher", label: "By Teacher", icon: User },
    { id: "class", label: "By Class", icon: School },
    { id: "room", label: "By Room", icon: DoorOpen },
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

      <Separator className="my-2" />

      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-slate-500" />
          <h3 className="font-medium text-slate-900">Filters</h3>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {filterItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={selectedFilter === item.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    selectedFilter === item.id ? "bg-slate-200" : "",
                  )}
                  onClick={() => onFilterChange(item.id as any)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Sidebar;
