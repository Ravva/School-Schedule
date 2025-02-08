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

interface Class {
  id: string;
  name: string;
  grade: number;
  section: string;
  capacity: number;
}

const ClassManagement = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClass, setNewClass] = useState({
    name: "",
    grade: "",
    section: "",
    capacity: "",
  });
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("grade")
        .order("section");

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    try {
      const { error } = await supabase.from("classes").insert([
        {
          name: newClass.name,
          grade: parseInt(newClass.grade),
          section: newClass.section,
          capacity: parseInt(newClass.capacity),
        },
      ]);

      if (error) throw error;
      fetchClasses();
      setNewClass({ name: "", grade: "", section: "", capacity: "" });
    } catch (error) {
      console.error("Error adding class:", error);
    }
  };

  const handleUpdateClass = async () => {
    if (!editingClass) return;

    try {
      const { error } = await supabase
        .from("classes")
        .update({
          name: editingClass.name,
          grade: editingClass.grade,
          section: editingClass.section,
          capacity: editingClass.capacity,
        })
        .eq("id", editingClass.id);

      if (error) throw error;
      fetchClasses();
      setEditingClass(null);
    } catch (error) {
      console.error("Error updating class:", error);
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      const { error } = await supabase.from("classes").delete().eq("id", id);

      if (error) throw error;
      fetchClasses();
    } catch (error) {
      console.error("Error deleting class:", error);
    }
  };

  const ClassForm = ({ mode }: { mode: "add" | "edit" }) => {
    const classData = mode === "add" ? newClass : editingClass;
    const setClassData = mode === "add" ? setNewClass : setEditingClass;

    if (!classData) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="grade">Grade</Label>
            <Input
              id="grade"
              type="number"
              value={classData.grade}
              onChange={(e) =>
                setClassData({ ...classData, grade: e.target.value })
              }
              placeholder="Enter grade"
            />
          </div>
          <div>
            <Label htmlFor="section">Section</Label>
            <Input
              id="section"
              value={classData.section}
              onChange={(e) =>
                setClassData({ ...classData, section: e.target.value })
              }
              placeholder="Enter section"
              maxLength={1}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="name">Class Name</Label>
          <Input
            id="name"
            value={classData.name}
            onChange={(e) =>
              setClassData({ ...classData, name: e.target.value })
            }
            placeholder="Enter class name"
          />
        </div>

        <div>
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            value={classData.capacity}
            onChange={(e) =>
              setClassData({ ...classData, capacity: e.target.value })
            }
            placeholder="Enter capacity"
          />
        </div>

        <Button
          className="w-full"
          onClick={mode === "add" ? handleAddClass : handleUpdateClass}
        >
          {mode === "add" ? "Add Class" : "Update Class"}
        </Button>
      </div>
    );
  };

  return (
    <div className="p-6 bg-white">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Class Management</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
              </DialogHeader>
              <ClassForm mode="add" />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>{cls.grade}</TableCell>
                  <TableCell>{cls.section}</TableCell>
                  <TableCell>{cls.capacity}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingClass(cls)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Class</DialogTitle>
                          </DialogHeader>
                          <ClassForm mode="edit" />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClass(cls.id)}
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

export default ClassManagement;
