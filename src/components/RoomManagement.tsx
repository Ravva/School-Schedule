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
  teachers: Teacher[];
  subjects: Subject[];
  classes: Class[] | null;
};

interface RoomAssignmentFormProps {
  mode: "add" | "edit";
  initialRoom?: RoomAssignment | null;
  subjects: Subject[];
  teachers: Teacher[];
  classes: Class[];
  onAdd?: (room: RoomFormState) => void;
  onUpdate?: (room: RoomFormState) => void;
  onClose: () => void;
}

// New unified form state type
type RoomFormState = {
  id?: string;
  room_number: string;
  teacher_ids: string[];  // Changed from teacher_id to teacher_ids
  subject_ids: string[];
  class_id?: string | null;
  subject_id?: string | null;
  created_at?: string;
};

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
  const initialRoomState: RoomFormState =
    mode === "add"
      ? {
          room_number: "",
          teacher_ids: [],  // Changed from teacher_id to teacher_ids
          subject_ids: [],
        }
      : {
          ...initialRoom,
          id: initialRoom?.id,
          room_number: initialRoom?.room_number || "",
          teacher_ids: initialRoom?.teachers ? initialRoom.teachers.map(t => t.id) : [],  // Changed to support multiple teachers
          subject_ids: initialRoom?.subjects.map((s) => s.id) || [],
          created_at: initialRoom?.created_at
        };

  const [room, setRoom] = useState<RoomFormState>(initialRoomState);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

  // Add teacher name helper function
  const getTeacherName = (id: string) => {
    return teachers.find((t) => t.id === id)?.name || "";
  };

  const getSubjectName = (id: string) => {
    return subjects.find((s) => s.id === id)?.name || "";
  };

  const handleAddOrUpdate = () => {
    if (mode === "add" && onAdd) {
      const newRoom: RoomFormState = {
        room_number: room.room_number,
        teacher_ids: room.teacher_ids,
        subject_ids: room.subject_ids,
      };
      onAdd(newRoom);
    } else if (mode === "edit" && onUpdate) {
      const updatedRoom: RoomFormState = {
        id: room.id,
        room_number: room.room_number,
        teacher_ids: room.teacher_ids,
        subject_ids: room.subject_ids,
        created_at: room.created_at
      };
      onUpdate(updatedRoom);
    }
    onClose();
  };

return (
  <Card>
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
                room_number: e.target.value
              }))
            }}
            placeholder="Enter room number"
          />
        </div>
        <div>
            <Label>Teachers</Label>
            <div className="relative">
              <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[38px]">
                {room.teacher_ids.map((teacherId) => (
                  <Badge key={teacherId} className="gap-1">
                    {getTeacherName(teacherId)}
                    <button onClick={() => setRoom(prevRoom => ({
                      ...prevRoom,
                      teacher_ids: prevRoom.teacher_ids.filter(id => id !== teacherId)
                    }))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <button
                  className="text-sm text-slate-500 hover:text-slate-700"
                  onClick={() => setShowTeacherDropdown(!showTeacherDropdown)}
                >
                  + Add Teacher
                </button>
              </div>
              {showTeacherDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                  <ScrollArea className="h-[200px]">
                    {teachers
                      .filter((teacher) => !room.teacher_ids.includes(teacher.id))
                      .map((teacher) => (
                        <button
                          key={teacher.id}
                          className="w-full px-3 py-2 text-left hover:bg-slate-100"
                          onClick={() => {
                            setRoom((prevRoom) => ({
                              ...prevRoom,
                              teacher_ids: [...prevRoom.teacher_ids, teacher.id],
                            }));
                            setShowTeacherDropdown(false);
                          }}
                        >
                          {teacher.name}
                        </button>
                      ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
          <div>
            <Label>Subjects</Label>
            <div className="relative">
              <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[38px]">
                {room.subject_ids.map((subjectId) => (
                  <Badge key={subjectId} className="gap-1">
                    {getSubjectName(subjectId)}
                    <button onClick={() => setRoom(prevRoom => ({
                      ...prevRoom,
                      subject_ids: prevRoom.subject_ids.filter(id => id !== subjectId)
                    }))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <button className="text-sm text-slate-500 hover:text-slate-700" onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}>
                  + Add Subject
                </button>
              </div>
              {showSubjectDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                  <ScrollArea className="h-[200px]">
                    {subjects
                      .filter((subject) => !room.subject_ids.includes(subject.id))
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
      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .order("name");
      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);

      // Fetch teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from("teachers")
        .select("*")
        .order("name");
      if (teachersError) throw teachersError;
      setTeachers(teachersData || []);

      // Fetch rooms with related subjects and teachers
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select(
          `
          *,
          room_subjects!room_subjects_room_id_fkey(
            subjects(*)
          ),
          time_slots!time_slots_room_id_fkey(
            teacher_id,
            teachers!time_slots_teacher_id_fkey(*)
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

      // Combine the data
      const combinedRooms: RoomAssignment[] = (roomsData || []).map((room) => {
        const relatedSubjects = room.room_subjects.map((rs: any) => rs.subjects);

        // Extract teachers from time_slots, handling null/undefined
        const relatedTeachers: Teacher[] = (room.time_slots || []).map((ts: any) => ts.teachers).filter((teacher): teacher is Teacher => teacher !== null);


        // Find classes associated with the room
        const relatedClasses = classesData?.filter((cls) => cls.room_id === room.id) || [];

        return {
          ...room,
          teachers: relatedTeachers,
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

  const handleAddRoom = async (newRoom: RoomFormState) => {
    try {
      const { subject_ids, teacher_ids, ...roomData } = newRoom;

      // Create room data matching the exact schema
      const roomToInsert = {
        room_number: roomData.room_number.trim(),
        // teacher_ids:
        //   roomData.teacher_ids.length === 0 ? null : roomData.teacher_ids, // Removed teacher_ids
        class_id: null,
        subject_id: null,
      };

      // Insert the new room and get its ID
      const { data: insertedRoom, error: insertError } = await supabase
        .from("rooms")
        .insert([roomToInsert])
        .select("id");

      if (insertError) {
        console.error("Insert error:", insertError);
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

        if (insertSubjectsError) throw insertSubjectsError;
      }

      // Insert related teachers via time_slots
      if (teacher_ids.length > 0) {
        const timeSlotsToInsert = teacher_ids.map((teacherId) => ({
          room_id: roomId,
          teacher_id: teacherId,
          day: "Monday", // You might want to specify a day or make it dynamic
        }));
        const { error: insertTimeSlotsError } = await supabase
          .from("time_slots")
          .insert(timeSlotsToInsert);

        if (insertTimeSlotsError) throw insertTimeSlotsError;
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

  const handleUpdateRoom = async (updatedRoom: RoomFormState) => {
    try {
      const { id, subject_ids, teacher_ids, created_at, ...roomData } = updatedRoom;

      if (id) {


        // First, update the room_subjects
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

        // Update time_slots for teacher assignments
        await supabase
          .from("time_slots")
          .delete()
          .eq("room_id", id);

        if (teacher_ids.length > 0) {
          const timeSlots = teacher_ids.map(teacherId => ({
            room_id: id,
            teacher_id: teacherId,
            day: "Monday", // Default day
          }));

          const { error: insertTeachersError } = await supabase
            .from("time_slots")
            .insert(timeSlots);

          if (insertTeachersError) throw insertTeachersError;
        }

        // Update the room details
        const { error: updateError } = await supabase
          .from("rooms")
          .update({ room_number: roomData.room_number })
          .eq("id", id);

        if (updateError) throw updateError;


        await fetchData(); // Refresh data and clear editing state
        setEditingRoom(null);
        setIsDialogOpen(false);

        toast({
          title: "Success",
          description: "Room updated successfully.",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Error updating room:", error);
      toast({
        variant: "destructive",
        title: "Error updating room.",
        description: error.message,
      });
    }
  };
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
              onClose={() => {
                setIsDialogOpen(false);
                setEditingRoom(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-full w-full space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>{room.room_number}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {room.teachers.map((teacher) => (
                        <Badge key={teacher.id}>{teacher.name}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {room.classes
                        ? room.classes.map((c) => (
                          <Badge key={c.id}>{c.name}</Badge>
                        ))
                        : ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(room.subjects || []).map((subject) => (
                        <Badge key={subject.id}>{subject.name}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 items-center">
                      {" "}
                      {/* Added items-center */}
                      {/* In the RoomAssignments component, update the Dialog for editing */}
                      <Dialog
                        open={editingRoom?.id === room.id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setEditingRoom(null);
                            setIsDialogOpen(false);
                          }
                        }}
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
