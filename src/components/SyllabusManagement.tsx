import React, { useState, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

type Syllabus = Database["public"]["Tables"]["syllabus"]["Row"];
type Class = Database["public"]["Tables"]["classes"]["Row"];
type Teacher = Database["public"]["Tables"]["teachers"]["Row"];
type Subject = Database["public"]["Tables"]["subjects"]["Row"];

interface SyllabusData {
  id: string;
  class_id: string;
  subject_id: string;
  amount_of_academic_hours_per_week: number;
  teacher_id: string;
  teachers: Teacher[] | null;
  subjects: Subject[] | null;
  classes: Class[] | null;
}
function SyllabusManagement() {
  const [syllabuses, setSyllabuses] = useState<SyllabusData[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase.from("classes").select("*").order("grade").order("literal");
      if (error) {
        console.error("Error fetching classes:", error);
        return;
      }
      setClasses(data || []);
    };

    const fetchSyllabus = async () => {
      const { data: syllabusData, error: syllabusError } = await supabase
        .from("syllabus")
        .select(
          `
        *,
        teachers:teacher_id ( * ),
        subjects:subject_id ( * ),
        classes:class_id ( * )
      `
        );

      if (syllabusError) {
        console.error("Error fetching syllabus:", syllabusError);
        return;
      }
      setSyllabuses(syllabusData as SyllabusData[] || []);
    };

    fetchSyllabus();
    fetchClasses();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Syllabus Management</h1>
      <Tabs defaultValue={classes[0]?.id}>
        <TabsList>
          {classes.map((classItem) => (
            <TabsTrigger key={classItem.id} value={classItem.id}>
              {classItem.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {classes.map((classItem) => (
          <TabsContent key={classItem.id} value={classItem.id}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Hours/Week</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syllabuses
                  .filter((s) => s.class_id === classItem.id)
                  .map((syllabusItem) => (
                    <TableRow key={syllabusItem.id}>
                      <TableCell>{syllabusItem.subjects?.[0]?.name}</TableCell>
                      <TableCell>
                        {syllabusItem.amount_of_academic_hours_per_week}
                      </TableCell>
                      <TableCell>{syllabusItem.teachers?.[0]?.name}</TableCell>
                      <TableCell>
                        {/* Placeholder for icons */}
                        <span>Edit</span> | <span>Delete</span>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default SyllabusManagement;
