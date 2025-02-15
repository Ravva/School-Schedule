import React, { useState, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, Edit, Trash2 } from "lucide-react";
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
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

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
  teachers: Teacher | null;
  subjects: Subject | null;
  classes: Class | null;
}

function SyllabusManagement() {
  const [syllabuses, setSyllabuses] = useState<SyllabusData[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
    const [currentClassId, setCurrentClassId] = useState<string | null>(null);

    const [editingSyllabus, setEditingSyllabus] = useState<SyllabusData | null>(null);
    const [newSyllabus, setNewSyllabus] = useState<{
        class_id: string | null;
        subject_id: string | null;
        amount_of_academic_hours_per_week: number | null;
        teacher_id: string | null;
    }>({
        class_id: null,
        subject_id: null,
        amount_of_academic_hours_per_week: null,
        teacher_id: null,
    });

  useEffect(() => {
      const fetchTeachers = async () => {
          const { data, error } = await supabase.from("teachers").select("*");
          if (error) {
              console.error("Error fetching teachers:", error);
              return;
          }
          setTeachers(data || []);
      };

      const fetchSubjects = async () => {
          const { data, error } = await supabase.from("subjects").select("*");
          if (error) {
              console.error("Error fetching subjects:", error);
              return;
          }
          setSubjects(data || []);
      };

    const fetchClasses = async () => {
      const { data, error } = await supabase.from("classes").select("*").order("grade").order("literal");
      if (error) {
        console.error("Error fetching classes:", error);
        return;
      }
      setClasses(data || []);
        if (data?.length) {
            setCurrentClassId(data[0].id)
        }
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
        setSyllabuses(syllabusData as unknown as SyllabusData[] || []);
    };

    fetchTeachers();
    fetchSubjects();
    fetchSyllabus();
    fetchClasses();
}, []);

    useEffect(() => {
        if (classes.length > 0 && !currentClassId) {
            setCurrentClassId(classes[0].id);
        }
    }, [classes, currentClassId]);

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
        setSyllabuses(syllabusData as unknown as SyllabusData[] || []);
    };

    const handleAddSyllabus = async () => {
        if (
            !newSyllabus.class_id ||
            !newSyllabus.subject_id ||
            !newSyllabus.amount_of_academic_hours_per_week ||
            !newSyllabus.teacher_id
        ) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const { error } = await supabase.from("syllabus").insert([
                {
                    class_id: newSyllabus.class_id,
                    subject_id: newSyllabus.subject_id,
                    amount_of_academic_hours_per_week:
                        newSyllabus.amount_of_academic_hours_per_week,
                    teacher_id: newSyllabus.teacher_id,
                },
            ]);

            if (error) throw error;
            fetchSyllabus();
            setNewSyllabus({
                class_id: null,
                subject_id: null,
                amount_of_academic_hours_per_week: null,
                teacher_id: null,
            });
        } catch (error) {
            console.error("Error adding syllabus:", error);
        }
    };

    const handleUpdateSyllabus = async () => {
        if (
            !editingSyllabus ||
            !editingSyllabus.class_id ||
            !editingSyllabus.subject_id ||
            !editingSyllabus.amount_of_academic_hours_per_week ||
            !editingSyllabus.teacher_id
        ) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const { error } = await supabase
                .from("syllabus")
                .update({
                    subject_id: editingSyllabus.subject_id,
                    amount_of_academic_hours_per_week:
                        editingSyllabus.amount_of_academic_hours_per_week,
                    teacher_id: editingSyllabus.teacher_id,
                })
                .eq("id", editingSyllabus.id);

            if (error) throw error;
            fetchSyllabus();
            setEditingSyllabus(null);
        } catch (error) {
            console.error("Error updating syllabus:", error);
        }
    };

    const handleDeleteSyllabus = async (id: string) => {
        try {
            const { error } = await supabase.from("syllabus").delete().eq("id", id);

            if (error) throw error;
            fetchSyllabus();
        } catch (error) {
            console.error("Error deleting syllabus:", error);
        }
    };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Syllabus Management</h1>
        <Dialog>
            <DialogTrigger asChild>
                <Button className="mb-4">
                    <Plus className="mr-2" />
                    Add Syllabus
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Syllabus</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="class">Class</Label>
                        <Select
                            onValueChange={(value) =>
                                setNewSyllabus((prev) => ({ ...prev, class_id: value }))
                            }
                            value={newSyllabus.class_id || undefined}
                        >
                            <SelectTrigger id="class">
                                <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map((classItem) => (
                                    <SelectItem key={classItem.id} value={classItem.id}>
                                        {classItem.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Select
                            onValueChange={(value) =>
                                setNewSyllabus((prev) => ({ ...prev, subject_id: value }))
                            }
                            value={newSyllabus.subject_id || undefined}
                        >
                            <SelectTrigger id="subject">
                                <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map((subject) => (
                                    <SelectItem key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="hours">Hours/Week</Label>
                        <Input
                            id="hours"
                            type="number"
                            value={newSyllabus.amount_of_academic_hours_per_week ?? ""}
                            onChange={(e) =>
                                setNewSyllabus((prev) => ({
                                    ...prev,
                                    amount_of_academic_hours_per_week: parseInt(e.target.value, 10),
                                }))
                            }
                            placeholder="Enter hours/week"
                        />
                    </div>
                    <div>
                        <Label htmlFor="teacher">Teacher</Label>
                        <Select
                            onValueChange={(value) =>
                                setNewSyllabus((prev) => ({ ...prev, teacher_id: value }))
                            }
                            value={newSyllabus.teacher_id || undefined}
                        >
                            <SelectTrigger id="teacher">
                                <SelectValue placeholder="Select a teacher" />
                            </SelectTrigger>
                            <SelectContent>
                                {teachers.map((teacher) => (
                                    <SelectItem key={teacher.id} value={teacher.id}>
                                        {teacher.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAddSyllabus}>Add Syllabus</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      <Tabs value={currentClassId || ""}>
        <TabsList>
          {classes.map((classItem) => (
            <TabsTrigger
                key={classItem.id}
                value={classItem.id}
                onClick={() => setCurrentClassId(classItem.id)}
            >
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
                      <TableCell>{syllabusItem.subjects?.name}</TableCell>
                      <TableCell>
                        {syllabusItem.amount_of_academic_hours_per_week}
                      </TableCell>
                      <TableCell>{syllabusItem.teachers?.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                                  <DialogTrigger asChild>
                                      <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                              setEditingSyllabus(syllabusItem)
                                          }}
                                      >
                                          <Edit className="w-4 h-4" />
                                      </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                      <DialogHeader>
                                          <DialogTitle>Edit Syllabus</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                          <div>
                                              <Label htmlFor="subject">Subject</Label>
                                              <Select
                                                  onValueChange={(value) =>
                                                      setEditingSyllabus((prev) =>
                                                          prev
                                                              ? { ...prev, subject_id: value }
                                                              : null
                                                      )
                                                  }
                                                  value={
                                                      editingSyllabus
                                                          ? editingSyllabus.subject_id
                                                          : undefined
                                                  }
                                              >
                                                  <SelectTrigger id="subject">
                                                      <SelectValue placeholder="Select a subject" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                      {subjects.map((subject) => (
                                                          <SelectItem
                                                              key={subject.id}
                                                              value={subject.id}
                                                          >
                                                              {subject.name}
                                                          </SelectItem>
                                                      ))}
                                                  </SelectContent>
                                              </Select>
                                          </div>
                                          <div>
                                              <Label htmlFor="hours">Hours/Week</Label>
                                              <Input
                                                  id="hours"
                                                  type="number"
                                                  value={
                                                      editingSyllabus
                                                          ? editingSyllabus.amount_of_academic_hours_per_week
                                                          : ""
                                                  }
                                                  onChange={(e) =>
                                                      setEditingSyllabus((prev) =>
                                                          prev
                                                              ? {
                                                                  ...prev,
                                                                  amount_of_academic_hours_per_week:
                                                                      parseInt(e.target.value, 10),
                                                              }
                                                              : null
                                                      )
                                                  }
                                                  placeholder="Enter hours/week"
                                              />
                                          </div>
                                          <div>
                                              <Label htmlFor="teacher">Teacher</Label>
                                              <Select
                                                  onValueChange={(value) =>
                                                      setEditingSyllabus((prev) =>
                                                          prev
                                                              ? { ...prev, teacher_id: value }
                                                              : null
                                                      )
                                                  }
                                                  value={
                                                      editingSyllabus
                                                          ? editingSyllabus.teacher_id
                                                          : undefined
                                                  }
                                              >
                                                  <SelectTrigger id="teacher">
                                                      <SelectValue placeholder="Select a teacher" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                      {teachers.map((teacher) => (
                                                          <SelectItem
                                                              key={teacher.id}
                                                              value={teacher.id}
                                                          >
                                                              {teacher.name}
                                                          </SelectItem>
                                                      ))}
                                                  </SelectContent>
                                              </Select>
                                          </div>
                                      </div>
                                      <DialogFooter>
                                          <Button onClick={handleUpdateSyllabus}>
                                              Update Syllabus
                                          </Button>
                                      </DialogFooter>
                                  </DialogContent>
                              </Dialog>
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteSyllabus(syllabusItem.id)}
                              >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                          </div>
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
