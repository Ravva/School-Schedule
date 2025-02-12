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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Room {
  id: string;
  room_number: string;
  subject_id: string | null;
  teacher_id: string | null;
  class_id: string | null;
}

interface Subject {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
}

const RoomManagement = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoom, setNewRoom] = useState({
    room_number: "",
    subject_id: "",
    teacher_id: "",
    class_id: "",
  });
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomsData, subjectsData, teachersData, classesData] =
        await Promise.all([
          supabase
            .from("rooms")
            .select(
              `
            *,
            subject:subject_id(name),
            teacher:teacher_id(name),
            class:class_id(name)
          `,
            )
            .order("room_number"),
          supabase.from("subjects").select("*").order("name"),
          supabase.from("teachers").select("*").order("name"),
          supabase.from("classes").select("*").order("name"),
        ]);

      if (roomsData.error) throw roomsData.error;
      if (subjectsData.error) throw subjectsData.error;
      if (teachersData.error) throw teachersData.error;
      if (classesData.error) throw classesData.error;

      setRooms(roomsData.data || []);
      setSubjects(subjectsData.data || []);
      setTeachers(teachersData.data || []);
      setClasses(classesData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async () => {
    try {
      const { error } = await supabase.from("rooms").insert([
        {
          room_number: newRoom.room_number,
          subject_id: newRoom.subject_id || null,
          teacher_id: newRoom.teacher_id || null,
          class_id: newRoom.class_id || null,
        },
      ]);

      if (error) throw error;
      fetchData();
      setNewRoom({
        room_number: "",
        subject_id: "",
        teacher_id: "",
        class_id: "",
      });
    } catch (error) {
      console.error("Error adding room:", error);
    }
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom) return;

    try {
      const { error } = await supabase
        .from("rooms")
        .update({
          room_number: editingRoom.room_number,
          subject_id: editingRoom.subject_id || null,
          teacher_id: editingRoom.teacher_id || null,
          class_id: editingRoom.class_id || null,
        })
        .eq("id", editingRoom.id);

      if (error) throw error;
      fetchData();
      setEditingRoom(null);
    } catch (error) {
      console.error("Error updating room:", error);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      const { error } = await supabase.from("rooms").delete().eq("id", id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

  const RoomForm = ({ mode }: { mode: "add" | "edit" }) => {
    const room = mode === "add" ? newRoom : editingRoom;
    const setRoom = mode === "add" ? setNewRoom : setEditingRoom;

    if (!room) return null;

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="room_number">Room Number</Label>
          <Input
            id="room_number"
            maxLength={3}
            value={room.room_number}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (value.length <= 3) {
                setRoom({ ...room, room_number: value });
              }
            }}
            placeholder="Enter 3-digit room number"
          />
        </div>

        <div>
          <Label htmlFor="subject">Subject</Label>
          <Select
            value={room.subject_id}
            onValueChange={(value) => setRoom({ ...room, subject_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="teacher">Teacher</Label>
          <Select
            value={room.teacher_id}
            onValueChange={(value) => setRoom({ ...room, teacher_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select teacher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="class">Class</Label>
          <Select
            value={room.class_id}
            onValueChange={(value) => setRoom({ ...room, class_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full"
          onClick={mode === "add" ? handleAddRoom : handleUpdateRoom}
        >
          {mode === "add" ? "Add Room" : "Update Room"}
        </Button>
      </div>
    );
  };

  return (
    <div className="p-6 bg-white">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Room Management</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Room</DialogTitle>
              </DialogHeader>
              <RoomForm mode="add" />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Number</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>{room.room_number}</TableCell>
                  <TableCell>{room.subject?.name || "-"}</TableCell>
                  <TableCell>{room.teacher?.name || "-"}</TableCell>
                  <TableCell>{room.class?.name || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingRoom(room)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Room</DialogTitle>
                          </DialogHeader>
                          <RoomForm mode="edit" />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRoom(room.id)}
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

export default RoomManagement;
