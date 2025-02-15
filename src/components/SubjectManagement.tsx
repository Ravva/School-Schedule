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
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";

interface Subject {
  id: string;
  name: string;
  created_at: string;
  is_extracurricular: boolean;
  is_subgroup: boolean;
}

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleUpdateSubject = async () => {
    if (!editingSubject) return;

    try {
      const { error } = await supabase
        .from("subjects")
        .update({
          name: editingSubject.name,
          is_extracurricular: editingSubject.is_extracurricular,
          is_subgroup: editingSubject.is_subgroup,
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

  const SubjectForm = ({
    mode,
    initialSubject,
    onAdd,
  }: {
    mode: "add" | "edit";
    initialSubject?: Subject;
    onAdd?: (subject: {
      name: string;
      is_extracurricular: boolean;
      is_subgroup: boolean;
    }) => void;
  }) => {
    const [subject, setSubject] = useState(
      mode === "add"
        ? { name: "", is_extracurricular: false, is_subgroup: false }
        : initialSubject || {
            name: "",
            is_extracurricular: false,
            is_subgroup: false,
          },
    );

    if (!subject) return null;

    const handleAddOrUpdate = () => {
      if (mode === "add" && onAdd) {
        onAdd(subject);
      } else if (mode === "edit" && editingSubject) {
        handleUpdateSubject();
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={subject.name}
            onChange={(e) => setSubject({ ...subject, name: e.target.value })}
            placeholder="Enter subject name"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_extracurricular"
            checked={subject.is_extracurricular}
            onCheckedChange={(checked) =>
              setSubject((prev) => ({ ...prev, is_extracurricular: checked }))
            }
          />
          <Label htmlFor="is_extracurricular">Extracurricular</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_subgroup"
            checked={subject.is_subgroup}
            onCheckedChange={(checked) =>
              setSubject((prev) => ({ ...prev, is_subgroup: checked }))
            }
          />
          <Label htmlFor="is_subgroup">Subgroup</Label>
        </div>

        <Button className="w-full" onClick={handleAddOrUpdate}>
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
              <SubjectForm
                mode="add"
                onAdd={async (newSubject) => {
                  try {
                    const { error } = await supabase.from("subjects").insert([
                      {
                        name: newSubject.name,
                        is_extracurricular: newSubject.is_extracurricular,
                        is_subgroup: newSubject.is_subgroup,
                      },
                    ]);

                    if (error) throw error;
                    fetchSubjects();
                  } catch (error) {
                    console.error("Error adding subject:", error);
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
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subgroup</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow
                  key={subject.id}
                  className={`${
                    subject.is_extracurricular ? "bg-purple-50" : ""
                  } ${subject.is_subgroup ? "bg-green-50" : ""}`}
                >
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell>
                    {subject.is_extracurricular ? (
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 text-purple-800"
                      >
                        Extracurricular
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Regular</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {subject.is_subgroup ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="secondary">No</Badge>
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
                          <SubjectForm
                            mode="edit"
                            initialSubject={editingSubject}
                          />
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
