import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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
import { Switch } from "./ui/switch";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";

interface TeacherFormProps {
  mode: "add" | "edit";
  data: {
    name: string;
    subjects: string[];
    supervised_classes: string[];
    is_part_time: boolean;
    work_days: string[];
  };
  onSubmit: () => void;
  onChange: (data: TeacherFormProps["data"]) => void;
}

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  supervised_classes: string[];
  is_part_time: boolean;
  work_days: string[];
};

const TeacherForm = ({
  mode,
  data,
  onChange,
  onSubmit,
  subjects,
  availableClasses,
  weekDays,
}: TeacherFormProps & {
  subjects: { id: string; name: string }[];
  availableClasses: string[];
  weekDays: string[];
}) => {
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="Enter teacher name"
        />
      </div>

      <div>
        <Label>Subjects</Label>
        <div className="relative">
          <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[38px]">
            {data.subjects.map((subject) => (
              <Badge key={subject} className="gap-1">
                {subject}
                <button
                  onClick={() =>
                    onChange({
                      ...data,
                      subjects: data.subjects.filter((s) => s !== subject),
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
                  .filter((subject) => !data.subjects.includes(subject.name))
                  .map((subject) => (
                    <button
                      key={subject.id}
                      className="w-full px-3 py-2 text-left hover:bg-slate-100"
                      onClick={() => {
                        onChange({
                          ...data,
                          subjects: [...data.subjects, subject.name],
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
            {data.supervised_classes.map((className) => (
              <Badge key={className} className="gap-1">
                {className}
                <button
                  onClick={() =>
                    onChange({
                      ...data,
                      supervised_classes: data.supervised_classes.filter(
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
                      !data.supervised_classes.includes(className),
                  )
                  .map((className) => (
                    <button
                      key={className}
                      className="w-full px-3 py-2 text-left hover:bg-slate-100"
                      onClick={() => {
                        onChange({
                          ...data,
                          supervised_classes: [
                            ...data.supervised_classes,
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

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_part_time"
            checked={data.is_part_time}
            onCheckedChange={(checked) =>
              onChange({
                ...data,
                is_part_time: checked,
                work_days: checked ? [] : weekDays,
              })
            }
          />
          <Label htmlFor="is_part_time">Part-time Teacher</Label>
        </div>

        {data.is_part_time && (
          <div className="space-y-2">
            <Label>Work Days</Label>
            <div className="grid grid-cols-2 gap-2">
              {weekDays.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day}`}
                    checked={data.work_days.includes(day)}
                    onCheckedChange={(checked) => {
                      const newDays = checked
                        ? [...data.work_days, day]
                        : data.work_days.filter((d) => d !== day);
                      onChange({
                        ...data,
                        work_days: newDays,
                      });
                    }}
                  />
                  <Label htmlFor={`day-${day}`}>{day}</Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button className="w-full" onClick={onSubmit}>
        {mode === "add" ? "Add Teacher" : "Update Teacher"}
      </Button>
    </div>
  );
};

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    subjects: [] as string[],
    supervised_classes: [] as string[],
    is_part_time: false,
    work_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  });
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

    const availableClasses = ["10A", "10B", "11A", "11B", "12A", "12B"];
    const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

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

      const teachersWithCorrectTypes = teachersData.data ? teachersData.data.map(teacher => ({
        ...teacher,
        subjects: teacher.subjects || [],
        supervised_classes: teacher.supervised_classes || [],
        is_part_time: teacher.is_part_time !== null ? teacher.is_part_time : false,
        work_days: teacher.work_days || [],
      })) : [];
      setTeachers(teachersWithCorrectTypes);
      setSubjects(subjectsData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    try {
      console.log("newTeacher:", newTeacher);
      const { data, error } = await supabase.from("teachers").insert([
        {
          name: newTeacher.name,
          subjects: newTeacher.subjects,
          supervised_classes: newTeacher.supervised_classes,
          is_part_time: newTeacher.is_part_time,
          work_days: newTeacher.work_days,
        },
      ]).select();

      console.log("supabase insert result:", data);

      if (error) throw error;
      console.log("fetchData after insert");
      fetchData();
      console.log("resetting newTeacher");
      setNewTeacher({
        name: "",
        subjects: [],
        supervised_classes: [],
        is_part_time: false,
        work_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      });
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
          is_part_time: editingTeacher.is_part_time,
          work_days: editingTeacher.work_days,
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
              <TeacherForm
                mode="add"
                data={newTeacher}
                onChange={(data) => setNewTeacher({...newTeacher, ...data})}
                onSubmit={handleAddTeacher}
                subjects={subjects}
                availableClasses={availableClasses}
                weekDays={weekDays}
              />
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
                <TableHead>Schedule</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>{teacher.name}</span>
                      {teacher.is_part_time && (
                        <Badge className="w-fit">Part-time</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.subjects.map((subject) => (
                        <Badge key={subject}>{subject}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.supervised_classes.map((className) => (
                        <Badge key={className}>{className}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.work_days.map((day) => (
                        <Badge key={day}>{day.slice(0, 3)}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => setEditingTeacher(teacher)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Teacher</DialogTitle>
                          </DialogHeader>
                          {editingTeacher && (
                            <TeacherForm
                              mode="edit"
                              data={editingTeacher}
                              onChange={(data) => setEditingTeacher({...data, id: editingTeacher.id})}
                              onSubmit={handleUpdateTeacher}
                              subjects={subjects}
                              availableClasses={availableClasses}
                              weekDays={weekDays}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
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
