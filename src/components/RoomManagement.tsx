import { Database } from "@/lib/database.types";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type Subject = Database["public"]["Tables"]["subjects"]["Row"];
type Teacher = Database["public"]["Tables"]["teachers"]["Row"];
type Class = Database["public"]["Tables"]["classes"]["Row"];

// Type for fetching rooms with related data
type RoomAssignment = Room & {
  teachers: Teacher | null;
  subjects: Subject[] | null;
  classes: Class | null;

};
interface RoomAssignmentFormProps {
  mode: "add" | "edit";
  initialRoom?: (RoomAssignment & { subject_ids?: string[] }) | null;
  subjects: Subject[];
  teachers: Teacher[];
  classes: Class[];
  onAdd?: (
    room: Omit<RoomAssignment, "id" | "created_at"> & { subject_ids: string[] }
  ) => void;
  onUpdate?: (room: RoomAssignment & { subject_ids: string[] }) => void;
  onClose: () => void;
}

const RoomAssignmentForm: React.FC<RoomAssignmentFormProps> = ({
  mode,
  initialRoom,
  subjects,
  teachers,
  classes,
  onAdd,
  onUpdate,
  onClose,
}) => {
  const [room, setRoom] = useState<RoomAssignment & { subject_ids: string[] }>(
    mode === "add"
      ? {
          id: "",
          created_at: "",
          room_number: "",
          teacher_id: null,
          subject_id: null,
          class_id: null,
          teachers: null,
          subjects: null,
          classes: null,
          subject_ids: [],
        }
      : {
          ...initialRoom,
          subject_ids: initialRoom?.subjects?.map((s) => s.id) || [],
        } as RoomAssignment & { subject_ids: string[] }
  );

  const handleAddOrUpdate = () => {
    if (mode === "add" && onAdd) {
      const { id, created_at, teachers, subjects, classes, ...newRoom } = room;
      onAdd({
        ...newRoom,
        subject_ids: room.subject_ids,
        teachers: null,
        classes: null,
        subjects: null
      });
    } else if (mode === "edit" && onUpdate) {
      onUpdate(room);
    }
    onClose();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "edit" ? "Edit Room Assignment" : "Add Room Assignment"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="room_number">Room Number</Label>
            <Input
              id="room_number"
              maxLength={3}
              value={room.room_number || ""}
              onChange={(e) => {
                const updatedRoomNumber = e.target.value.replace(/\D/g, "").slice(0, 3);
                setRoom((prevRoom) => ({ ...prevRoom, room_number: updatedRoomNumber }));
              }}
              placeholder="Enter room number"
            />
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Select
              onValueChange={(value) => {
                setRoom((prevRoom) => {
                  const subjectIds = prevRoom?.subject_ids || [];
                  const newSubjectId = value;

                  if (!subjectIds.includes(newSubjectId)) {
                    return {
                      ...prevRoom,
                      subject_ids: [...subjectIds, newSubjectId],
                    };
                  } else {
                    return {
                      ...prevRoom,
                      subject_ids: subjectIds.filter((id) => id !== newSubjectId),
                    };
                  }
                });
              }}
              value={undefined}
            >
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select subjects" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {room.subject_ids?.includes(subject.id) ? "✓ " : ""}
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
              value={room.teacher_id || undefined}
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
          <div>
            <Label htmlFor="class">Class</Label>
            <Select
              onValueChange={(value) => {
                setRoom((prevRoom) => ({ ...prevRoom, class_id: value }));
              }}
              value={room.class_id || undefined}
            >
              <SelectTrigger id="class">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddOrUpdate} className="w-full mt-4">
            {mode === "edit" ? "Save Changes" : "Add Room"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};


const RoomAssignments = () => {
  const [rooms, setRooms] = useState<RoomAssignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<
    (RoomAssignment & { subject_ids?: string[] }) | null
  >(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch rooms with related teachers, subjects, and classes
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*, teachers(*), subjects!subject_id(*), classes(*)")
        .order("room_number");

      if (roomsError) throw roomsError;

      const fetchedRooms = (roomsData as RoomAssignment[]) || [];

      // Populate the `subjects` array for each room
      const roomsWithSubjects = await Promise.all(
        fetchedRooms.map(async (room) => {
          const { data: roomSubjects, error: roomSubjectsError } = await supabase
            .from("room_subjects")
            .select("subject_id")
            .eq("room_id", room.id);

          if (roomSubjectsError) throw roomSubjectsError;

          const subjectIds = roomSubjects?.map((rs) => rs.subject_id) || [];
          const subjects =
            subjectsData.filter((subject) =>
              subjectIds.includes(subject.id)
            );

          return {
            ...room,
            subjects,
          };
        })
      );

      setRooms(roomsWithSubjects);

      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .order("name");
      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);

      const { data: teachersData, error: teachersError } = await supabase
        .from("teachers")
        .select("*")
        .order("name");
      if (teachersError) throw teachersError;
      setTeachers(teachersData || []);

      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .order("name");
      if (classesError) throw classesError;
      setClasses(classesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Function to handle adding a new room
  const handleAddRoom = async (
    newRoom: Omit<RoomAssignment, "id" | "created_at"> & {
      subject_ids: string[];
    }
  ) => {
    try {
      const { subject_ids, ...roomData } = newRoom;

      // Insert the new room and get its ID
      const { data: insertedRoom, error: insertError } = await supabase
        .from("rooms")
        .insert([roomData])
        .select("id");

      if (insertError) throw insertError;
      const roomId = insertedRoom![0].id;

      // Insert related subjects
      if (subject_ids.length > 0) {
        const roomSubjectsToInsert = subject_ids.map((subjectId) => ({
          room_id: roomId,
          subject_id: subjectId,
        }));
        const { error: insertSubjectsError } = await supabase
          .from("room_subjects")
          .insert(roomSubjectsToInsert);

        if (insertSubjectsError) throw insertSubjectsError;
      }

      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error adding room:", error);
    }
  };

  // Function to handle updating an existing room
  const handleUpdateRoom = async (
    updatedRoom: RoomAssignment & { subject_ids: string[] }
  ) => {
    try {
      const { subject_ids, subjects, ...roomData } = updatedRoom;

      // Update the room details
      const { error: updateError } = await supabase
        .from("rooms")
        .update(roomData)
        .eq("id", updatedRoom.id);

      if (updateError) throw updateError;

      // Delete existing room_subjects entries
      const { error: deleteError } = await supabase
        .from("room_subjects")
        .delete()
        .eq("room_id", updatedRoom.id);

      if (deleteError) throw deleteError;

      // Insert updated room_subjects entries
      if (subject_ids.length > 0) {
        const roomSubjectsToInsert = subject_ids.map((subjectId) => ({
          room_id: updatedRoom.id,
          subject_id: subjectId,
        }));
        const { error: insertError } = await supabase
          .from("room_subjects")
          .insert(roomSubjectsToInsert);

        if (insertError) throw insertError;
      }

      fetchData(); // Refresh data
      setEditingRoom(null);
    } catch (error) {
      console.error("Error updating room:", error);
    }
  };

  // Function to handle deleting a room
  const handleDeleteRoom = async (id: string) => {
    try {
      const { error } = await supabase.from("rooms").delete().eq("id", id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

    const openEditDialog = (room: RoomAssignment) => {
        setEditingRoom(room);
        setIsDialogOpen(true);
    }

  return (
    <div className="p-6 bg-white">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rooms</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2" />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingRoom ? "Edit Room" : "Add New Room"}
                </DialogTitle>
              </DialogHeader>
              <RoomAssignmentForm
                mode={editingRoom ? "edit" : "add"}
                initialRoom={
                  editingRoom
                    ? {
                        ...editingRoom,
                        subject_ids: editingRoom.subjects?.map((s) => s.id) || [],
                      }
                    : undefined
                }
                subjects={subjects}
                teachers={teachers}
                classes={classes}
                onAdd={handleAddRoom}
                onUpdate={handleUpdateRoom}
                onClose={() => {
                  setIsDialogOpen(false);
                  setEditingRoom(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] w-full space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell>{room.room_number}</TableCell>
                    <TableCell>{room.teachers ? room.teachers.name : "N/A"}</TableCell>
                    <TableCell>{room.classes ? room.classes.name : "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap">
                        {(room.subjects || []).map((subject) => subject.name).join(", ") || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(room)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteRoom(room.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomAssignments;
