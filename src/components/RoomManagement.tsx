import { Database } from "@/lib/database.types";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
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
  type RoomState = RoomAssignment & { subject_ids: string[] };
  const initialRoomState: RoomState = mode === "add"
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
      subject_ids: initialRoom?.subjects?.map((s) => s.id) || [],
    }
    : {
      ...initialRoom,
      subject_ids: initialRoom?.subjects?.map((s) => s.id) || [],
    } as RoomState;

  const [room, setRoom] = useState<RoomState>(initialRoomState);

  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  const handleAddOrUpdate = () => {
    if (mode === "add" && onAdd) {
      const { id, created_at, teachers, subjects, classes, ...newRoom } = room;
      onAdd({
        ...newRoom,
        subject_ids: room.subject_ids,
        teachers: null,
        classes: null,
        subjects: null,
      });
    } else if (mode === "edit" && onUpdate) {
      onUpdate(room);
    }
    onClose();
  };

  const getSubjectName = (id: string) => {
    return subjects.find((s) => s.id === id)?.name || "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "edit" ? "Edit Room Assignment" : "Add Room Assignment"}
        </CardTitle>
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
            <Label>Subjects</Label>
            <div className="relative">
              <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[38px]">
                {room.subject_ids.map((subjectId) => (
                  <Badge key={subjectId} className="gap-1">
                    {getSubjectName(subjectId)}
                    <button
                      onClick={() =>
                        setRoom((prevRoom) => ({
                          ...prevRoom,
                          subject_ids: prevRoom.subject_ids.filter(
                            (id) => id !== subjectId
                          ),
                        }))
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
                      .filter(
                        (subject) => !room.subject_ids.includes(subject.id)
                      )
                      .map((subject) => (
                        <button
                          key={subject.id}
                          className="w-full px-3 py-2 text-left hover:bg-slate-100"
                          onClick={() => {
                            setRoom((prevRoom) => ({
                              ...prevRoom,
                              subject_ids: [...prevRoom.subject_ids, subject.id],
                            }));
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
          <Button onClick={() => handleAddOrUpdate()} className="w-full mt-4">
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
            // Fetch subjects first
            const { data: subjectsData, error: subjectsError } = await supabase
                .from("subjects")
                .select("*")
                .order("name");
            if (subjectsError) throw subjectsError;
            setSubjects(subjectsData || []);

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
                    // Use the fetched subjectsData here
                    const subjects = subjectsData.filter((subject) => subjectIds.includes(subject.id));

                    return {
                        ...room,
                        subjects,
                    };
                })
            );

            setRooms(roomsWithSubjects);

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
    console.log("New Room Data:", newRoom); // Log the new room data

    try {
      const { subject_ids, class_id, ...roomData } = newRoom; // Remove class_id from roomData

      // Insert the new room and get its ID
      const { data: insertedRoom, error: insertError } = await supabase
        .from("rooms")
        .insert([{ ...roomData, class_id: null }]) // Set class_id to null if it's not provided
        .select("id");

      if (insertError) {
        console.error("Error inserting room:", insertError);
        throw insertError;
      }
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

        if (insertSubjectsError) {
          console.error("Error inserting room_subjects:", insertSubjectsError);
          throw insertSubjectsError;
        }
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

      if (updateError) {
        console.error("Error updating room:", updateError);
        throw updateError;
      }

      // Delete existing room_subjects entries
      const { error: deleteError } = await supabase
        .from("room_subjects")
        .delete()
        .eq("room_id", updatedRoom.id);

      if (deleteError) {
        console.error("Error deleting room_subjects:", deleteError);
        throw deleteError;
      }

      // Insert updated room_subjects entries
      if (subject_ids.length > 0) {
        const roomSubjectsToInsert = subject_ids.map((subjectId) => ({
          room_id: updatedRoom.id,
          subject_id: subjectId,
        }));
        const { error: insertError } = await supabase
          .from("room_subjects")
          .insert(roomSubjectsToInsert);

        if (insertError) {
          console.error("Error inserting updated room_subjects:", insertError);
          throw insertError;
        }
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
  };

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
                  Add New Room
                </DialogTitle>
              </DialogHeader>
              <RoomAssignmentForm
                mode="add"
                initialRoom={null}
                subjects={subjects}
                teachers={teachers}
                classes={classes}
                onAdd={handleAddRoom}
                onUpdate={handleUpdateRoom}
                onClose={() => setEditingRoom(null)}
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
