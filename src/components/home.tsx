import React, { useState } from "react";
import Sidebar from "./Sidebar";
import DailyScheduleGrid from "./DailyScheduleGrid";
import TeacherManagement from "./TeacherManagement";

import TimetableBuilder from "./TimetableBuilder";
import SubjectManagement from "./SubjectManagement";
import ClassManagement from "./ClassManagement";

type ViewMode = "timetable" | "teachers" | "subjects" | "classes" | "builder";
type FilterMode = "teacher" | "class" | "room";

interface HomeProps {
  initialView?: ViewMode;
  initialFilter?: FilterMode;
}

const Home = ({
  initialView = "timetable",
  initialFilter = "teacher",
}: HomeProps) => {
  const [activeView, setActiveView] = useState<ViewMode>(initialView);
  const [selectedFilter, setSelectedFilter] =
    useState<FilterMode>(initialFilter);

  const renderMainContent = () => {
    switch (activeView) {
      case "timetable":
        return <DailyScheduleGrid />;
      case "teachers":
        return <TeacherManagement />;
      case "subjects":
        return <SubjectManagement />;
      case "classes":
        return <ClassManagement />;

      case "builder":
        return <TimetableBuilder />;
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
