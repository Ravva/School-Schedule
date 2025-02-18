import { Database } from "@/lib/database.types";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Edit, Plus, Trash2, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "./ui/use-toast";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type Subject = Database["public"]["Tables"]["subjects"]["Row"];
type Teacher = Database["public"]["Tables"]["teachers"]["Row"];
type Class = Database["public"]["Tables"]["classes"]["Row"];

// Type for fetching rooms with related data
type RoomAssignment = Room & {
  teachers: Teacher | null;
  subjects: Subject[];
  classes: Class[] | null;
};

interface RoomAssignmentFormProps {
  mode: "add" | "edit";
  initialRoom?: RoomAssignment | null;
  subjects: Subject[];
  teachers: Teacher[];
  classes: Class[];
  onAdd?: (
    room: Omit<Room, "id" | "created_at"> & {
      subject_ids: string[];
    }
  ) => void;
  onUpdate?: (room: Room & { subject_ids: string[] }) => void;
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
  type RoomState = Room & {
    teachers: Teacher | null;
    subjects: Subject[];
    classes: Class[] | null;
    subject_ids: string[];
  };

  type AddRoomState = Omit<Room, "id" | "created_at"> & {
    subject_ids: string[];
  };

  const initialRoomState: RoomState | AddRoomState =
    mode === "add"
      ? {
          room_number: "",
          teacher_id: null,
          subject_ids: [],
        } as AddRoomState
      : {
          ...initialRoom,
          subject_ids: initialRoom?.subjects?.map((s) => s.id) ?? [],
          teachers: initialRoom?.teachers ?? null,
          subjects: initialRoom?.subjects ?? [],
          classes: initialRoom?.classes ?? null,
        } as RoomState;

  const [room, setRoom] = useState<RoomState | AddRoomState>(
    initialRoomState
  );
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  const handleAddOrUpdate = () => {
    if (mode === "add" && onAdd) {
      const newRoom = {
        room_number: room.room_number,
        teacher_id: room.teacher_id === "" ? null : room.teacher_id,
        subject_ids: room.subject_ids,
      } as AddRoomState;

      onAdd(newRoom);
    } else if (mode === "edit" && onUpdate) {
      const updatedRoom = room as RoomState;
      const { teachers, subjects, classes, ...roomData } = updatedRoom;
      onUpdate({
        ...roomData,
      });
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
              value={"room_number" in room ? room.room_number : ""}
              onChange={(e) => {
                setRoom((prevRoom) => ({
                  ...prevRoom,
                  room_number: e.target.value,
                }));
              }}
              placeholder="Enter room number"
            />
          </div>
          <div>
            <Label htmlFor="teacher">Teacher</Label>
            <Select
              onValueChange={(value) => {
                setRoom((prevRoom) => ({ ...prevRoom, teacher_id: value }));
              }}
              value={
                "teacher_id" in room ? room.teacher_id || undefined : undefined
              }
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
            <Label>Subjects</Label>
            <div className="relative">
              <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[38px]">
                {("subject_ids" in room ? room.subject_ids : []).map(
                  (subjectId) => (
                    <Badge key={subjectId} className="gap-1">
                      {getSubjectName(subjectId)}
                      <button
                        onClick={() =>
                          setRoom((prevRoom) => ({
                            ...prevRoom,
                            subject_ids:
                              "subject_ids" in prevRoom
                                ? prevRoom.subject_ids.filter(
                                    (id) => id !== subjectId
                                  )
                                : [],
                          }))
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                )}
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
                        (subject) =>
                          !("subject_ids" in room) ||
                          !room.subject_ids.includes(subject.id)
                      )
                      .map((subject) => (
                        <button
                          key={subject.id}
                          className="w-full px-3 py-2 text-left hover:bg-slate-100"
                          onClick={() => {
                            setRoom((prevRoom) => {
                              const updatedRoom = {
                                ...prevRoom,
                                subject_ids:
                                  "subject_ids" in prevRoom
                                    ? [...prevRoom.subject_ids, subject.id]
                                    : [subject.id],
                              };
                              return updatedRoom;
                            });
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
          <Button onClick={handleAddOrUpdate} className="w-full mt-4">
            {mode === "edit" ? "Save Changes" : "Add Room"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const RoomAssignments = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<RoomAssignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomAssignment | null>(null);

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
          teachers!left(*),
          room_subjects!room_subjects_room_id_fkey(
            subjects(*)
          )
          `
        )
        .order("room_number");

      if (roomsError) throw roomsError;

      // Fetch all classes
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .order("grade");

      if (classesError) throw classesError;
      setClasses(classesData || []);

      const combinedRooms: RoomAssignment[] = (roomsData || []).map((room) => {
        const relatedSubjects = room.room_subjects.map(
          (rs: any) => rs.subjects
        );

        // Find classes associated with the room
        const relatedClasses =
          classesData?.filter((cls) => cls.room_id === room.id) || [];

        return {
          ...room,
          teachers: room.teachers,
          subjects: relatedSubjects,
          classes: relatedClasses,
        };
      });

      setRooms(combinedRooms);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Error fetching data.",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Function to handle adding a new room
  const handleAddRoom = async (
    newRoom: Omit<Room, "id" | "created_at"> & {
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
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding room.",
        description: error.message,
      });
    }
  };

  // Function to handle updating an existing room
  const handleUpdateRoom = async (
    updatedRoom: Room & { subject_ids: string[] }
  ) => {
    try {
      const { id, subject_ids, ...roomData } = updatedRoom;

      // Update the room details
      const { error: updateError } = await supabase
        .from("rooms")
        .update(roomData)
        .eq("id", id);

      if (updateError) throw updateError;

      // Delete existing room_subjects entries
      const { error: deleteSubjectsError } = await supabase
        .from("room_subjects")
        .delete()
        .eq("room_id", id);

      if (deleteSubjectsError) throw deleteSubjectsError;

      // Insert updated room_subjects entries
      if (subject_ids.length > 0) {
        const roomSubjectsToInsert = subject_ids.map((subjectId) => ({
          room_id: id,
          subject_id: subjectId,
        }));
        const { error: insertSubjectsError } = await supabase
          .from("room_subjects")
          .insert(roomSubjectsToInsert);

        if (insertSubjectsError) throw insertSubjectsError;
      }

      fetchData(); // Refresh data
      setEditingRoom(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating room.",
        description: error.message,
      });
    }
  };

  // Function to handle deleting a room
  const handleDeleteRoom = async (id: string) => {
    try {
      // First, delete related entries in room_subjects
      const { error: deleteSubjectsError } = await supabase
        .from("room_subjects")
        .delete()
        .eq("room_id", id);

      if (deleteSubjectsError) throw deleteSubjectsError;

      // Finally, delete the room itself
      const { error: deleteRoomError } = await supabase
        .from("rooms")
        .delete()
        .eq("id", id);

      if (deleteRoomError) throw deleteRoomError;
      fetchData(); // Refresh the data after successful deletion
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting room.",
        description: error.message,
      });
    }
  };

  const openEditDialog = (room: RoomAssignment) => {
    setEditingRoom(room);
  };

  return (
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
              <DialogTitle>Add New Room</DialogTitle>
            </DialogHeader>
            <RoomAssignmentForm
              mode="add"
              initialRoom={null}
              subjects={subjects}
              teachers={teachers}
              classes={classes}
              onAdd={handleAddRoom}
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
                    {room.classes
                      ? room.classes.map((c) => c.name).join(", ")
                      : ""}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap">
                      {(room.subjects || [])
                        .map((subject) => subject.name)
                        .join(", ") || ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog
                        open={editingRoom?.id === room.id}
                        onOpenChange={setIsDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setIsDialogOpen(true);
                              openEditDialog(room);
                            }}
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
                            subjects={subjects}
                            teachers={teachers}
                            classes={classes}
                            onUpdate={handleUpdateRoom}
                            onClose={() => {
                              setEditingRoom(null);
                              setIsDialogOpen(false);
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRoom(room.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
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
  );
};

export default RoomAssignments;
