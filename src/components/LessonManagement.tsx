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
import { Edit, Plus, Trash2 } from "lucide-react";

interface Lesson {
  id: string;
  lesson_number: number;
  start_time: string;
  end_time: string;
}

const LessonManagement = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({
    lesson_number: 0,
    start_time: "",
    end_time: "",
  });
  const [editingLesson, setEditingLesson] = useState<Lesson>({
    id: "",
    lesson_number: 0,
    start_time: "",
    end_time: "",
  });

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .order("lesson_number");

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = async () => {
    try {
      const { error } = await supabase.from("lessons").insert([
        {
          lesson_number: newLesson.lesson_number,
          start_time: newLesson.start_time,
          end_time: newLesson.end_time,
        },
      ]);

      if (error) throw error;
      fetchLessons();
      setNewLesson({ lesson_number: 0, start_time: "", end_time: "" });
    } catch (error) {
      console.error("Error adding lesson:", error);
    }
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson) return;

    try {
      const { error } = await supabase
        .from("lessons")
        .update({
          lesson_number: editingLesson.lesson_number,
          start_time: editingLesson.start_time,
          end_time: editingLesson.end_time,
        })
        .eq("id", editingLesson.id);

      if (error) throw error;
      fetchLessons();
      setEditingLesson(null);
    } catch (error) {
      console.error("Error updating lesson:", error);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    try {
      const { error } = await supabase.from("lessons").delete().eq("id", id);

      if (error) throw error;
      fetchLessons();
    } catch (error) {
      console.error("Error deleting lesson:", error);
    }
  };

  const LessonForm = ({
    mode,
    formData,
    onChange,
    onSubmit,
  }: {
    mode: "add" | "edit";
    formData: Partial<Lesson>;
    onChange: (field: string, value: string) => void;
    onSubmit: () => void;
  }) => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="lesson_number">Lesson Number</Label>
          <Input
            id="lesson_number"
            type="number"
            value={formData.lesson_number ?? ""}
            onChange={(e) => onChange("lesson_number", e.target.value)}
            placeholder="Enter lesson number"
          />
        </div>

        <div>
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => onChange("start_time", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => onChange("end_time", e.target.value)}
          />
        </div>

        <Button className="w-full" onClick={onSubmit}>
          {mode === "add" ? "Add Lesson" : "Update Lesson"}
        </Button>
      </div>
    );
  };

  return (
    <div className="p-6 bg-white">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lesson Management</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Lesson
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Lesson</DialogTitle>
              </DialogHeader>
              <LessonForm
                mode="add"
                formData={newLesson}
                onChange={(field, value) => {
                  setNewLesson((prev) => {
                    const parsedValue = parseInt(value, 10);
                    return {
                      ...prev,
                      [field]:
                        field === "lesson_number"
                          ? isNaN(parsedValue)
                            ? 0
                            : parsedValue
                          : value,
                    };
                  });
                }}
                onSubmit={handleAddLesson}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lesson Number</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell>{lesson.lesson_number}</TableCell>
                  <TableCell>{lesson.start_time}</TableCell>
                  <TableCell>{lesson.end_time}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingLesson(lesson)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Lesson</DialogTitle>
                          </DialogHeader>
                          <LessonForm
                            mode="edit"
                            formData={editingLesson}
                            onChange={(field, value) => {
                              setEditingLesson((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      [field]: value,
                                    }
                                  : null,
                              );
                            }}
                            onSubmit={handleUpdateLesson}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLesson(lesson.id)}
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

export default LessonManagement;
