import { Database } from "@/lib/database.types";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type Subject = Database["public"]["Tables"]["subjects"]["Row"];
type Teacher = Database["public"]["Tables"]["teachers"]["Row"];
type Class = Database["public"]["Tables"]["classes"]["Row"];

// Type for fetching rooms with related data
type RoomAssignment = Room & {
  teachers: Teacher | null;
  subjects: Subject | null;
  classes: Class | null;
};

const RoomAssignments = () => {
  const [rooms, setRooms] = useState<RoomAssignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<RoomAssignment | null>(null);

    const getRoomsTableStructure = async () => {
        const { data, error } = await supabase.rpc('get_table_structure', { table_name: 'rooms' });

        if (error) {
            console.error("Error fetching table structure:", error);
            return;
        }
        console.log("Rooms table structure:", data);
    };


  useEffect(() => {
    fetchData();
      getRoomsTableStructure();
  }, []);

  const fetchData = async () => {
    let roomsData: { data: RoomAssignment[] | null; error: any } = { data: null, error: null };
    let subjectsData: { data: Subject[] | null; error: any } = { data: null, error: null };
    let teachersData: { data: Teacher[] | null; error: any } = { data: null, error: null };
    let classesData: { data: Class[] | null; error: any } = { data: null, error: null };

    try {
      [roomsData, subjectsData, teachersData, classesData] = await Promise.all([
        supabase
          .from("rooms")
          .select("*, teachers(*), subjects(*), classes(*)")
          .order("room_number"),
        supabase.from("subjects").select("*").order("name"),
        supabase.from("teachers").select("*").order("name"),
        supabase.from("classes").select("*").order("name"),
      ]);

      if (roomsData.error) throw roomsData.error;
      if (subjectsData.error) throw subjectsData.error;
      if (teachersData.error) throw teachersData.error;
      if (classesData.error) throw classesData.error;

      // Type casting to handle the joined data
      setRooms(roomsData.data as RoomAssignment[] || []);
      setSubjects(subjectsData.data || []);
      setTeachers(teachersData.data || []);
      setClasses(classesData.data || []);

      console.log("Subjects:", subjectsData.data); // Log the fetched subjects

    } catch (error) {
      console.error("Error fetching data:", error);
      if (roomsData.error) console.error("Rooms error:", roomsData.error);
      if (subjectsData.error) console.error("Subjects error:", subjectsData.error);
      if (teachersData.error) console.error("Teachers error:", teachersData.error);
      if (classesData.error) console.error("Classes error:", classesData.error);

    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom) return;

    try {
      const { error } = await supabase
        .from("rooms")
        .update({
          room_number: editingRoom.room_number,
          teacher_id: editingRoom.teacher_id,
          subject_id: editingRoom.subject_id,
          class_id: editingRoom.class_id,
        })
        .eq("id", editingRoom.id);

      if (error) throw error;
      fetchData();
      setEditingRoom(null); // Close dialog
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

  const RoomAssignmentForm = ({
    mode,
    initialRoom,
    onAdd,
  }: {
    mode: "add" | "edit";
    initialRoom?: Partial<RoomAssignment>;
    onAdd?: (room: Partial<RoomAssignment>) => void;
  }) => {
    const [room, setRoom] = useState(
      mode === "add" ? {} : initialRoom || {},
    );

    console.log("Rendering RoomAssignmentForm with room:", room);

    if (!room) return null;

    const handleAddOrUpdate = () => {
      if (mode === "add" && onAdd) {
        onAdd(room);
      } else if (mode === "edit") {
        handleUpdateRoom();
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="room_number">Room Number</Label>
          <Input
            id="room_number"
            maxLength={3}
            value={room.room_number || ""}
            onChange={(e) => {
              const updatedRoomNumber = e.target.value
                .replace(/\D/g, "")
                .slice(0, 3);
              setRoom((prevRoom) => ({
                ...prevRoom,
                room_number: updatedRoomNumber,
              }));
            }}
            placeholder="Enter room number"
          />
        </div>
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Select
            onValueChange={(value) => {
              setRoom((prevRoom) => ({ ...prevRoom, subject_id: value }));
            }}
            value={room.subject_id || ""}
          >
            <SelectTrigger id="subject">
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>None</SelectItem>
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
            onValueChange={(value) => {
              setRoom((prevRoom) => ({ ...prevRoom, teacher_id: value }));
            }}
            value={room.teacher_id || ""}
          >
            <SelectTrigger id="teacher">
              <SelectValue placeholder="Select a teacher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>None</SelectItem>
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
            onValueChange={(value) => {
              setRoom((prevRoom) => ({ ...prevRoom, class_id: value }));
            }}
            value={room.class_id || ""}
          >
            <SelectTrigger id="class">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>None</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Removed time-related and extracurricular fields */}
        <Button onClick={handleAddOrUpdate} className="w-full mt-4">
          {mode === "edit" ? "Save Changes" : "Add Room"}
        </Button>
      </div>
    );
  };

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Room Management</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Add Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Room</DialogTitle>
              </DialogHeader>
              <RoomAssignmentForm
                mode="add"
                onAdd={async (newRoom) => {
                  try {
                    const { error } = await supabase.from("rooms").insert([
                      {
                        room_number: newRoom.room_number,
                        teacher_id: newRoom.teacher_id,
                        subject_id: newRoom.subject_id,
                        class_id: newRoom.class_id,
                      },
                    ]);

                    if (error) throw error;
                    fetchData();
                  } catch (error) {
                    console.error("Error adding room assignment:", error);
                  }
                }}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                    <TableCell>
                      {room.subjects?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {room.teachers?.name || "-"}
                    </TableCell>
                    <TableCell>{room.classes?.name || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingRoom(room)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Room Assignment</DialogTitle>
                            </DialogHeader>
                            <RoomAssignmentForm
                              mode="edit"
                              initialRoom={editingRoom}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          onClick={() => handleDeleteRoom(room.id)}
                          variant="ghost"
                          size="icon"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomAssignments;
