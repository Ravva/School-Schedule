import React, { useState } from "react";
import Sidebar from "./Sidebar";
import DailyScheduleGrid from "./DailyScheduleGrid";
import TeacherManagement from "./TeacherManagement";

import TimetableBuilder from "./TimetableBuilder";
import LessonManagement from "./LessonManagement";
import RoomManagement from "./RoomManagement";
import SubjectManagement from "./SubjectManagement";
import ClassManagement from "./ClassManagement";
import SyllabusManagement from "./SyllabusManagement";

export type ViewMode =
  | "timetable"
  | "teachers"
  | "subjects"
  | "classes"
  | "lessons"
  | "rooms"
  | "builder"
  | "syllabus";
export type FilterMode = "teacher" | "class" | "room";

export interface HomeProps {
  initialView?: ViewMode;
  initialFilter?: FilterMode;
}

const Home = ({
  initialView = "teachers",
  initialFilter = "teacher",
}: HomeProps) => {
  const [activeView, setActiveView] = useState<ViewMode>(initialView);
  const [selectedFilter, setSelectedFilter] =
    useState<FilterMode>(initialFilter);

  const renderMainContent = () => {
    console.log("renderMainContent called, activeView:", activeView);
    switch (activeView) {
      case "timetable":
        return <DailyScheduleGrid />;
      case "teachers":
        return <TeacherManagement />;
      case "subjects":
        return <SubjectManagement />;
      case "classes":
        return <ClassManagement />;

      case "lessons":
        return <LessonManagement />;
      case "rooms":
        return <RoomManagement />;
      case "builder":
        return <TimetableBuilder />;
      case "syllabus":
        return <SyllabusManagement />;
      default:
        return <DailyScheduleGrid />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />
      <main className="flex-1 overflow-auto">{renderMainContent()}</main>
    </div>
  );
};

export default Home;
