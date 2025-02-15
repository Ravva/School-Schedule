import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/home";
const SyllabusManagement = React.lazy(
  () => import("./components/SyllabusManagement")
);

function App() {
  console.log("App component rendering");
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/syllabus" element={<SyllabusManagement />} />
        </Routes>
      </>
    </Suspense>
  );
}

export default App;
