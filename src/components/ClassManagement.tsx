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
import { Database } from "@/lib/database.types";
import { Edit, Plus, Trash2 } from "lucide-react";

// Utility function to generate class name
const generateClassName = (grade: number, literal?: string | null) => {
  if (!grade || grade < 1 || grade > 11) {
    return ""; // Or throw an error, or return a default value
  }
  if (literal && (literal.length !== 1 || !/^[a-zA-Z]$/.test(literal))) {
    return ""; // Or throw an error, or return a default value
  }
  return literal ? `${grade}${literal}` : `${grade}`;
};

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type Class = Database["public"]["Tables"]["classes"]["Row"];
type Teacher = Database["public"]["Tables"]["teachers"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];

const ClassManagement = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
 const [teachers, setTeachers] = useState<Teacher[]>([]);
 const [rooms, setRooms] = useState<Room[]>([]);

interface NewClass {
  name: string;
  grade: number;
  literal?: string | null;
  supervisor_teacher_id?: string | null;
  room_id?: string | null;
};
const [newClass, setNewClass] = useState<NewClass>({
 name: "",
 grade: 0,
 literal: null,
 supervisor_teacher_id: null,
 room_id: null,
});
const [editingClass, setEditingClass] = useState<Class | null>(null);

useEffect(() => {
  fetchClasses();
  fetchTeachers();
 fetchRooms();
}, []);

const fetchClasses = async () => {
 setLoading(true);
 try {
  const { data, error } = await supabase
   .from("classes")
   .select("*")
   .order("grade");

  if (error) throw error;
  setClasses(data || []);
 } catch (error) {
  console.error("Error fetching classes:", error);
 } finally {
  setLoading(false);
 }
};

const fetchTeachers = async () => {
 try {
  const { data, error } = await supabase.from("teachers").select("*").order("name");
  if (error) throw error;
  setTeachers(data || []);
 } catch (error) {
  console.error("Error fetching teachers:", error);
 }
};

const fetchRooms = async () => {
 try {
  const { data, error } = await supabase.from("rooms").select("*").order("room_number");
  if (error) throw error;
  setRooms(data || []);
 } catch (error) {
  console.error("Error fetching rooms:", error);
 }
};

interface ClassWithOptionalFields extends Partial<Class> {}


const handleAddClass = async () => {
  const generatedName = generateClassName(newClass.grade, newClass.literal);

  if (!generatedName) {
    alert("Please enter a valid grade (1-11) and literal (single letter).");
    return;
  }

  try {
    const { error } = await supabase.from("classes").insert([
      {
        name: generatedName,
        grade: newClass.grade,
        literal: newClass.literal,
        supervisor_teacher_id: newClass.supervisor_teacher_id,
        room_id: newClass.room_id,
      },
    ]);

    if (error) throw error;
    fetchClasses();
    setNewClass({
      name: "",
      grade: 0,
      literal: null,
      supervisor_teacher_id: null,
      room_id: null,
    });
  } catch (error) {
    console.error("Error adding class:", error);
  }
};

const handleUpdateClass = async () => {
  if (!editingClass) return;

  const generatedName = generateClassName(
    editingClass.grade,
    editingClass.literal
  );

  if (!generatedName) {
      alert("Please enter a valid grade (1-11) and literal (single letter).");
    return;
  }

  try {
    const { error } = await supabase
      .from("classes")
      .update({
        name: generatedName,
        grade: editingClass.grade,
        literal: editingClass.literal,
        supervisor_teacher_id: editingClass.supervisor_teacher_id,
        room_id: editingClass.room_id,
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
 const classData: ClassWithOptionalFields | null = mode === "add" ? newClass : editingClass;
 const setClassData = mode === "add" ? setNewClass : setEditingClass;

 if (!classData && mode === "edit") return null;

const handleGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  if (/^\d*$/.test(value)) {
    const grade = parseInt(value, 10);
    setClassData((prev: any) => {
      const updated = { ...prev, grade: grade };
      updated.name = generateClassName(updated.grade, updated.literal);
      return updated;
    });
  }
};

const handleLiteralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const literal = e.target.value;
  setClassData((prev: any) => {
    const updated = { ...prev, literal: literal };
    updated.name = generateClassName(prev.grade, updated.literal);
    return updated;
  });
};

const handleSectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setClassData((prev: any) => ({ ...prev, section: e.target.value }));
};

 const handleSupervisorTeacherChange = (value: string) => {
  setClassData((prev: any) => ({ ...prev, supervisor_teacher_id: value }));
 };

 const handleRoomChange = (value: string) => {
  setClassData((prev: any) => ({ ...prev, room_id: value }));
 };

 return (
  <div className="space-y-4">
   <div className="grid grid-cols-2 gap-4">
    <div>
     <Label htmlFor="grade">Grade</Label>
     <Input
      id="grade"
      type="number"
      min="1"
      max="11"
      value={classData ? classData.grade || "" : ""}
      onChange={handleGradeChange}
      placeholder="Enter grade"
     />
    </div>
    <div>
     <Label htmlFor="literal">Literal</Label>
     <Input
      id="literal"
      value={classData ? classData.literal || "" : ""}
      onChange={(e) => {
        const value = e.target.value;
        if (value.length <= 1 && /^[a-zA-Z]*$/.test(value)) {
          handleLiteralChange(e)
        }
      }}
      placeholder="Enter literal"
      maxLength={1}
     />
   </div>
   </div>

   <div>
    <Label htmlFor="supervisor_teacher">Supervisor Teacher</Label>
    <Select
     onValueChange={handleSupervisorTeacherChange}
     value={classData ? classData.supervisor_teacher_id || undefined : undefined}
    >
     <SelectTrigger id="supervisor_teacher">
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

   <div>
    <Label htmlFor="room">Room</Label>
    <Select
     onValueChange={handleRoomChange}
     value={classData ? classData.room_id || undefined : undefined}
    >
     <SelectTrigger id="room">
      <SelectValue placeholder="Select a room" />
     </SelectTrigger>
     <SelectContent>
      {rooms.map((room) => (
       <SelectItem key={room.id} value={room.id}>
        {room.room_number}
       </SelectItem>
      ))}
     </SelectContent>
    </Select>
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
             <TableHead>Literal</TableHead>
             
             <TableHead>Supervisor Teacher</TableHead>
             <TableHead>Room</TableHead>
             <TableHead className="text-right">Actions</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {classes.map((cls) => (
               <TableRow key={cls.id}>
                <TableCell className="font-medium">{cls.name}</TableCell>
                <TableCell>{cls.grade}</TableCell>
                <TableCell>{cls.literal}</TableCell>
                <TableCell>
                  {
                    teachers.find(
                      (teacher) => teacher.id === cls.supervisor_teacher_id
                    )?.name || "N/A"
                  }
                </TableCell>
                <TableCell>
                  {rooms.find((room) => room.id === cls.room_id)?.room_number ||
                    "N/A"}
                </TableCell>
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
