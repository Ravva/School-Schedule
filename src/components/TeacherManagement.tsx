import React, { useEffect, useState } from "react";
import { supabase, type TeacherRow, type SubjectRow } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    subjects: [] as string[],
    supervised_classes: [] as string[],
  });
  const [editingTeacher, setEditingTeacher] = useState<TeacherRow | null>(null);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersData, subjectsData] = await Promise.all([
        supabase.from("teachers").select("*").order("name"),
        supabase.from("subjects").select("*").order("name"),
      ]);

      if (teachersData.error) throw teachersData.error;
      if (subjectsData.error) throw subjectsData.error;

      setTeachers(teachersData.data || []);
      setSubjects(subjectsData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    try {
      const { error } = await supabase.from("teachers").insert([
        {
          name: newTeacher.name,
          subjects: newTeacher.subjects,
          supervised_classes: newTeacher.supervised_classes,
        },
      ]);

      if (error) throw error;
      fetchData();
      setNewTeacher({ name: "", subjects: [], supervised_classes: [] });
    } catch (error) {
      console.error("Error adding teacher:", error);
    }
  };

  const handleUpdateTeacher = async () => {
    if (!editingTeacher) return;

    try {
      const { error } = await supabase
        .from("teachers")
        .update({
          name: editingTeacher.name,
          subjects: editingTeacher.subjects,
          supervised_classes: editingTeacher.supervised_classes,
        })
        .eq("id", editingTeacher.id);

      if (error) throw error;
      fetchData();
      setEditingTeacher(null);
    } catch (error) {
      console.error("Error updating teacher:", error);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      const { error } = await supabase.from("teachers").delete().eq("id", id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error deleting teacher:", error);
    }
  };

  const availableClasses = ["10A", "10B", "11A", "11B", "12A", "12B"];

  const TeacherForm = ({ mode }: { mode: "add" | "edit" }) => {
    const teacher = mode === "add" ? newTeacher : editingTeacher;
    const setTeacher = mode === "add" ? setNewTeacher : setEditingTeacher;

    if (!teacher) return null;

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={teacher.name}
            onChange={(e) => setTeacher({ ...teacher, name: e.target.value })}
            placeholder="Enter teacher name"
          />
        </div>

        <div>
          <Label>Subjects</Label>
          <div className="relative">
            <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[38px]">
              {teacher.subjects.map((subject) => (
                <Badge key={subject} variant="secondary" className="gap-1">
                  {subject}
                  <button
                    onClick={() =>
                      setTeacher({
                        ...teacher,
                        subjects: teacher.subjects.filter((s) => s !== subject),
                      })
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <button
                className="text-sm text-slate-500 hover:text-slate-700"
                onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
              >
                + Add Subject
              </button>
            </div>
            {showSubjectDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                <ScrollArea className="h-[200px]">
                  {subjects
                    .filter(
                      (subject) => !teacher.subjects.includes(subject.name),
                    )
                    .map((subject) => (
                      <button
                        key={subject.id}
                        className="w-full px-3 py-2 text-left hover:bg-slate-100"
                        onClick={() => {
                          setTeacher({
                            ...teacher,
                            subjects: [...teacher.subjects, subject.name],
                          });
                          setShowSubjectDropdown(false);
                        }}
                      >
                        {subject.name}
                      </button>
                    ))}
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        <div>
          <Label>Supervised Classes</Label>
          <div className="relative">
            <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[38px]">
              {teacher.supervised_classes.map((className) => (
                <Badge key={className} variant="outline" className="gap-1">
                  {className}
                  <button
                    onClick={() =>
                      setTeacher({
                        ...teacher,
                        supervised_classes: teacher.supervised_classes.filter(
                          (c) => c !== className,
                        ),
                      })
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <button
                className="text-sm text-slate-500 hover:text-slate-700"
                onClick={() => setShowClassDropdown(!showClassDropdown)}
              >
                + Add Class
              </button>
            </div>
            {showClassDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                <ScrollArea className="h-[200px]">
                  {availableClasses
                    .filter(
                      (className) =>
                        !teacher.supervised_classes.includes(className),
                    )
                    .map((className) => (
                      <button
                        key={className}
                        className="w-full px-3 py-2 text-left hover:bg-slate-100"
                        onClick={() => {
                          setTeacher({
                            ...teacher,
                            supervised_classes: [
                              ...teacher.supervised_classes,
                              className,
                            ],
                          });
                          setShowClassDropdown(false);
                        }}
                      >
                        {className}
                      </button>
                    ))}
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        <Button
          className="w-full"
          onClick={mode === "add" ? handleAddTeacher : handleUpdateTeacher}
        >
          {mode === "add" ? "Save Teacher" : "Update Teacher"}
        </Button>
      </div>
    );
  };

  return (
    <div className="p-6 bg-white">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Teacher Management</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
              </DialogHeader>
              <TeacherForm mode="add" />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Supervised Classes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>{teacher.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.subjects.map((subject) => (
                        <Badge key={subject} variant="secondary">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.supervised_classes.map((className) => (
                        <Badge key={className} variant="outline">
                          {className}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingTeacher(teacher)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Teacher</DialogTitle>
                          </DialogHeader>
                          <TeacherForm mode="edit" />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTeacher(teacher.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherManagement;
