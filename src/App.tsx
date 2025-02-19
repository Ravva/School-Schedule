import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/home";
import TeacherManagement from "./components/TeacherManagement";
import SubjectManagement from "./components/SubjectManagement";
import RoomManagement from "./components/RoomManagement";
import ClassManagement from "./components/ClassManagement";
import LessonManagement from "./components/LessonManagement";
import TimetableBuilder from "./components/TimetableBuilder";
import Ttes from "./components/Ttes";
const SyllabusManagement = React.lazy(
  () => import("./components/SyllabusManagement"),
);

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teachers" element={<TeacherManagement />} />
        <Route path="/subjects" element={<SubjectManagement />} />
        <Route path="/rooms" element={<RoomManagement />} />
        <Route path="/classes" element={<ClassManagement />} />
        <Route path="/lessons" element={<LessonManagement />} />
        <Route path="/syllabus" element={<SyllabusManagement />} />
        <Route path="/builder" element={<TimetableBuilder />} />
      </Routes>
    </Suspense>
  );
}

export default App;
