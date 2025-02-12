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
import { Textarea } from "./ui/textarea";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";

interface Subject {
  id: string;
  name: string;
  description: string;
  is_extracurricular: boolean;
}

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubject, setNewSubject] = useState({
    name: "",
    description: "",
    is_extracurricular: false,
  });
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("name");

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async () => {
    try {
      const { error } = await supabase.from("subjects").insert([
        {
          name: newSubject.name,
          description: newSubject.description,
          is_extracurricular: newSubject.is_extracurricular,
        },
      ]);

      if (error) throw error;
      fetchSubjects();
      setNewSubject({ name: "", description: "", is_extracurricular: false });
    } catch (error) {
      console.error("Error adding subject:", error);
    }
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject) return;

    try {
      const { error } = await supabase
        .from("subjects")
        .update({
          name: editingSubject.name,
          description: editingSubject.description,
          is_extracurricular: editingSubject.is_extracurricular,
        })
        .eq("id", editingSubject.id);

      if (error) throw error;
      fetchSubjects();
      setEditingSubject(null);
    } catch (error) {
      console.error("Error updating subject:", error);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      const { error } = await supabase.from("subjects").delete().eq("id", id);

      if (error) throw error;
      fetchSubjects();
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  };

  const SubjectForm = ({ mode }: { mode: "add" | "edit" }) => {
    const subject = mode === "add" ? newSubject : editingSubject;
    const setSubject = mode === "add" ? setNewSubject : setEditingSubject;

    if (!subject) return null;

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={subject.name}
            onChange={(e) => setSubject(prev => ({...prev, name: e.target.value}))}
            placeholder="Enter subject name"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={subject.description}
            onChange={(e) => setSubject(prev => ({...prev, description: e.target.value}))}
            placeholder="Enter subject description"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_extracurricular"
            checked={subject.is_extracurricular}
            onCheckedChange={(checked) => setSubject(prev => ({...prev, is_extracurricular: checked}))}
          />
          <Label htmlFor="is_extracurricular">Extracurricular</Label>
        </div>

        <Button
          className="w-full"
          onClick={mode === "add" ? handleAddSubject : handleUpdateSubject}
        >
          {mode === "add" ? "Add Subject" : "Update Subject"}
        </Button>
      </div>
    );
  };

  return (
    <div className="p-6 bg-white">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Subject Management</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
              </DialogHeader>
              <SubjectForm mode="add" />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow
                  key={subject.id}
                  className={subject.is_extracurricular ? "bg-purple-50" : ""}
                >
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell>{subject.description}</TableCell>
                  <TableCell>
                    {subject.is_extracurricular ? (
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 text-purple-800"
                      >
                        Extracurricular
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Regular
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingSubject(subject)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Subject</DialogTitle>
                          </DialogHeader>
                          <SubjectForm mode="edit" />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSubject(subject.id)}
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

export default SubjectManagement;
