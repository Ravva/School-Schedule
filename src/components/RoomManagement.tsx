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
  classes: Class[] | Class | null;
};

interface RoomAssignmentFormProps {
  mode: "add" | "edit";
  initialRoom?: (RoomAssignment & { subject_ids?: string[] }) | null;
  subjects: Subject[];
  teachers: Teacher[];
  classes: Class[];
  onAdd?: (
    room: Omit<RoomAssignment, "id" | "created_at"> & { subject_ids: string[], class_ids: string[] }
  ) => void;
  onUpdate?: (room: RoomAssignment & { subject_ids: string[], class_ids: string[] }) => void;
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
  type RoomState = RoomAssignment & { subject_ids: string[]; class_ids: string[] };
    const initialRoomState: RoomState =
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
            subject_ids: initialRoom?.subjects?.map((s) => s.id) || [],
            class_ids: [],
          }
        : {
            ...initialRoom,
            subject_ids: initialRoom?.subjects?.map((s) => s.id) || [],
            class_ids:
              (initialRoom?.classes
                ? Array.isArray(initialRoom.classes)
                  ? initialRoom.classes.map((c) => c.id)
                  : [initialRoom.classes.id]
                : []) || [],
          } as RoomState;

    const [room, setRoom] = useState<RoomState>(initialRoomState);
    const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);


  const handleAddOrUpdate = () => {
    if (mode === "add" && onAdd) {
      const { id, created_at, teachers, subjects, classes, ...newRoom } = room;
      onAdd({
        ...newRoom,
        subject_ids: room.subject_ids,
        class_ids: room.class_ids,
        teachers: null,
        classes: null,
        subjects: null,
      });
    } else if (mode === "edit" && onUpdate) {
      const { teachers, subjects, classes, ...updatedRoom } = room;
      onUpdate(room);
    }
    onClose();
};

  const getSubjectName = (id: string) => {
    return subjects.find((s) => s.id === id)?.name || "";
  };

    const getClassName = (id: string) => {
      return classes.find((c) => c.id === id)?.name || "";
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
            <Label>Classes</Label>
            <div className="relative">
              <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[38px]">
                {room.class_ids.map((classId) => (
                  <Badge key={classId} className="gap-1">
                    {getClassName(classId)}
                    <button
                      onClick={() =>
                        setRoom((prevRoom) => ({
                          ...prevRoom,
                          class_ids: prevRoom.class_ids.filter(
                            (id) => id !== classId
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
                  onClick={() => setShowClassDropdown(!showClassDropdown)}
                >
                  + Add Class
                </button>
              </div>
              {showClassDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                  <ScrollArea className="h-[200px]">
                    {classes
                      .filter((cls) => !room.class_ids.includes(cls.id))
                      .map((cls) => (
                        <button
                          key={cls.id}
                          className="w-full px-3 py-2 text-left hover:bg-slate-100"
                          onClick={() => {
                            setRoom((prevRoom) => ({
                              ...prevRoom,
                              class_ids: [...prevRoom.class_ids, cls.id],
                            }));
                            setShowClassDropdown(false);
                          }}
                        >
                          {cls.name}
                        </button>
                      ))}
                  </ScrollArea>
                </div>
              )}
            </div>
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
            // Fetch subjects first
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

      // Fetch rooms with related teachers, subjects, and classes
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select(
          `
        *,
        teachers(*),
        room_subjects(
          subjects(*)
        )
        `
        )
        .order("room_number");

      if (roomsError) throw roomsError;

      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .order("grade");

      if (classesError) throw classesError;

      const combinedRooms: RoomAssignment[] = (roomsData || []).map((room) => {
        const relatedSubjects = room.room_subjects.map(
          (rs: any) => rs.subjects
        );
        const relatedClass = classesData.find(
          (cls) => cls.id === room.class_id
        );

        return {
          ...room,
          teachers: room.teachers,
          subjects: relatedSubjects,
          classes: relatedClass || null,
        };
      });

      setRooms(combinedRooms);
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
      const { subject_ids, teachers, subjects, classes, ...roomData } = newRoom;
      console.log("Room Data to Insert:", roomData);

      // Insert the new room and get its ID
      const { data: insertedRoom, error: insertError } = await supabase
        .from("rooms")
        .insert([roomData])
        .select("id");

      if (insertError) {
        console.error("Error inserting room:", insertError);
        throw insertError;
      }
      const roomId = insertedRoom![0].id;
      console.log("Inserted Room ID:", roomId);

      // Insert related subjects
      if (subject_ids.length > 0) {
        const roomSubjectsToInsert = subject_ids.map((subjectId) => ({
          room_id: roomId,
          subject_id: subjectId,
        }));
        console.log("Room Subjects to Insert:", roomSubjectsToInsert);
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
      const { subject_ids, subjects, teachers, classes, ...roomData } = updatedRoom;
      console.log("Room Data to Update:", roomData);

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
        console.log("Room Subjects to Insert:", roomSubjectsToInsert);
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
    <>
      <Dialog
        open={editingRoom !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRoom(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
          </DialogHeader>
          <RoomAssignmentForm
            mode="edit"
            initialRoom={editingRoom}
            subjects={subjects}
            teachers={teachers}
            classes={classes}
            onUpdate={handleUpdateRoom}
            onClose={() => setEditingRoom(null)}
          />
        </DialogContent>
      </Dialog>
      <div className="p-6 bg-white">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Rooms</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2" />Add Room
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Room</DialogTitle>
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
                    <TableHead>Classes</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell>{room.room_number}</TableCell>
                      <TableCell>
                        {room.teachers ? room.teachers.name : ""}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap">
                          {Array.isArray(room.classes)
                            ? room.classes.map((cls) => cls.name).join(", ")
                            : room.classes?.name ?? ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap">
                          {(room.subjects || []).map((subject) => subject.name).join(", ") || ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(room)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteRoom(room.id)}
                          >
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
    </>
  );
};

export default RoomAssignments;
