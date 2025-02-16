import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "./ui/use-toast";
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
import { Edit, Plus, Trash2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
  teacher_id?: string | null;
  teachers: Teacher | null;
  subjects: Subject | null;
  classes: Class | null;
}

const SyllabusManagement = () => {
    const { toast } = useToast();
    const [syllabuses, setSyllabuses] = useState<SyllabusData[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSyllabus, setEditingSyllabus] = useState<SyllabusData | null>(null);
    const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSyllabus, setNewSyllabus] = useState<{
      class_id: string | null;
      subject_id: string | null;
      amount_of_academic_hours_per_week: number | null;
      teacher_id: string | null | undefined;
  }>({
      class_id: null,
      subject_id: null,
      amount_of_academic_hours_per_week: null,
      teacher_id: null,
  });

  useEffect(() => {
    fetchSyllabusData();
    fetchClasses();
    fetchTeachers();
        fetchSubjects();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([
                fetchSyllabusData(),
                fetchClasses(),
                fetchTeachers(),
                fetchSubjects(),
            ]);
            setLoading(false);
        }
        fetchData();
    }, []);

    const fetchSyllabusData = async () => {
        try {
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

            if (syllabusError) throw syllabusError;
            setSyllabuses(syllabusData as unknown as SyllabusData[] || []);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error fetching syllabus data.",
                description: error.message,
            });
        }
    };

    const fetchClasses = async () => {
        try {
            const { data, error } = await supabase.from("classes").select("*").order("grade").order("literal");
            if (error) throw error;
            setClasses(data || []);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error fetching classes.",
                description: error.message,
            });
        }
    };

    const fetchTeachers = async () => {
        try {
            const { data, error } = await supabase.from("teachers").select("*");
            if (error) throw error;
            setTeachers(data || []);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error fetching teachers.",
                description: error.message,
            });
        }
    };

    const fetchSubjects = async () => {
        try {
            const { data, error } = await supabase.from("subjects").select("*");
            if (error) throw error;
            setSubjects(data || []);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error fetching subjects.",
                description: error.message,
            });
        }
    };

    const handleUpdateSyllabus = async () => {
        if (!editingSyllabus) return;

        try {
            const { error } = await supabase
                .from("syllabus")
                .update({
                    subject_id: editingSyllabus.subject_id,
                    amount_of_academic_hours_per_week: editingSyllabus.amount_of_academic_hours_per_week,
                    teacher_id: editingSyllabus.teacher_id,
                })
                .eq("id", editingSyllabus.id);

            if (error) throw error;
            fetchSyllabusData();
            setEditingSyllabus(null);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error updating syllabus.",
                description: error.message,
            });
        }
    };

    const handleDeleteSyllabus = async (id: string) => {
        try {
            const { error } = await supabase.from("syllabus").delete().eq("id", id);

            if (error) throw error;
            fetchSyllabusData();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error deleting syllabus.",
                description: error.message,
            });
        }
    };

  const SyllabusForm = ({
    mode,
    initialSyllabus,
    onAdd,
  }: {
    mode: "add" | "edit";
    initialSyllabus?: SyllabusData;
    onAdd?: (syllabus: {
      class_id: string | null;
      subject_id: string | null;
      amount_of_academic_hours_per_week: number | null;
      teacher_id?: string | null;
    }) => void;
  }) => {
    const [syllabus, setSyllabus] = useState(
      mode === "add"
        ? { class_id: null, subject_id: null, amount_of_academic_hours_per_week: null, teacher_id: null }
        : initialSyllabus || { class_id: null, subject_id: null, amount_of_academic_hours_per_week: null, teacher_id: null },
    );

    if (!syllabus) return null;

    const handleAddOrUpdate = async () => {
      if (mode === "add" && onAdd) {
        onAdd({
          class_id: syllabus.class_id ?? "",
          subject_id: syllabus.subject_id ?? "",
          amount_of_academic_hours_per_week: syllabus.amount_of_academic_hours_per_week ?? 0,
          teacher_id: syllabus.teacher_id ?? null,
        });
            } else if (mode === "edit" && editingSyllabus) {
                handleUpdateSyllabus();
            }
        };

        return (
            <div className="space-y-4">
                <div>
                    <Label htmlFor="class">Class</Label>
                    <Select
                        onValueChange={(value) =>
                            setSyllabus((prev) => ({ ...prev, class_id: value }))
                        }
                        value={syllabus.class_id || undefined}
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
                            setSyllabus((prev) => ({ ...prev, subject_id: value }))
                        }
                        value={syllabus.subject_id || undefined}
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
                        value={syllabus.amount_of_academic_hours_per_week ?? ""}
                        onChange={(e) => {
                            const hours = parseInt(e.target.value, 10);
                            if (!isNaN(hours) && hours >= 0) {
                                setSyllabus({ ...syllabus, amount_of_academic_hours_per_week: hours });
                            }
                        }}
                        placeholder="Enter hours/week"
                    />
                </div>

                <div>
                    <Label htmlFor="teacher">Teacher</Label>
                    <Select
                        onValueChange={(value) =>
                            setSyllabus((prev) => ({ ...prev, teacher_id: value }))
                        }
                        value={syllabus.teacher_id || undefined}
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

                <Button className="w-full" onClick={handleAddOrUpdate}>
                    {mode === "add" ? "Add Syllabus" : "Update Syllabus"}
                </Button>
            </div>
        );
    };

    return (
        <div className="p-6 bg-white">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Syllabus Management</CardTitle>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Syllabus
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Syllabus</DialogTitle>
                            </DialogHeader>
                            <SyllabusForm
                                mode="add"
                                onAdd={async (newSyllabus) => {
                                    try {
                                        if (
                                            newSyllabus.class_id === null ||
                                            newSyllabus.subject_id === null ||
                                            newSyllabus.amount_of_academic_hours_per_week === null
                                        ) {
                                            toast({
                                                variant: "destructive",
                                                title: "Error adding syllabus.",
                                                description: "Please fill in all required fields.",
                                            });
                                            return;
                                        }
                                        const { error } = await supabase.from("syllabus").insert([
                                            {
                                                class_id: newSyllabus.class_id,
                                                subject_id: newSyllabus.subject_id,
                                                amount_of_academic_hours_per_week: newSyllabus.amount_of_academic_hours_per_week,
                                                teacher_id: newSyllabus.teacher_id,
                                            },
                                        ]);

                                        if (error) throw error;
                                        fetchSyllabusData();
                                    } catch (error: any) {
                                        toast({
                                            variant: "destructive",
                                            title: "Error adding syllabus.",
                                            description: error.message,
                                        });
                                    }
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Class</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Hours/Week</TableHead>
                                <TableHead>Teacher</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {syllabuses.map((syllabusItem) => (
                                <TableRow
                                    key={syllabusItem.id}
                                >
                                    <TableCell>{syllabusItem.classes?.name}</TableCell>
                                    <TableCell>{syllabusItem.subjects?.name}</TableCell>
                                    <TableCell>{syllabusItem.amount_of_academic_hours_per_week}</TableCell>
                                    <TableCell>{syllabusItem.teachers?.name}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setEditingSyllabus({ ...syllabusItem })}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Edit Syllabus</DialogTitle>
                                                    </DialogHeader>
                                                    <SyllabusForm
                                                        mode="edit"
                                                        initialSyllabus={editingSyllabus}
                                                    />
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
                </CardContent>
            </Card>
        </div>
    );
};

export default SyllabusManagement;
