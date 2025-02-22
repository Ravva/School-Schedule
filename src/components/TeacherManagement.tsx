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
import { Badge } from "./ui/badge";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Switch } from "./ui/switch";
import { Checkbox } from "./ui/checkbox";
import { Database } from "@/lib/database.types";
import { Separator } from "./ui/separator";
import { useToast } from "./ui/use-toast";

type Teacher = Database["public"]["Tables"]["teachers"]["Row"];
type Class = Database["public"]["Tables"]["classes"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];

interface TeacherFormProps {
  mode: "add" | "edit";
  data: Omit<Teacher, "id" | "created_at"> & { rooms: Room[] };
  onSubmit: () => void;
  onChange: (data: TeacherFormProps["data"]) => void;
  subjects: { id: string; name: string }[];
  availableClasses: Class[];
  availableRooms: Room[];
  weekDays: string[];
}

const TeacherForm = ({
  mode,
  data,
  onChange,
  onSubmit,
  subjects,
  availableClasses,
  availableRooms,
  weekDays,
}: TeacherFormProps) => {
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);

    const getClassName = (classId: string) => {
      const foundClass = availableClasses.find((c) => c.id === classId);
      return foundClass ? foundClass.name : "";
    };

    const getRoomNumber = (roomId: string) => {
        const foundRoom = availableRooms.find((r) => r.id === roomId)
        return foundRoom ? foundRoom.room_number : ""
    }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="Enter teacher name"
        />
      </div>

      <div>
        <Label>Subjects</Label>
        <div className="relative">
          <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[38px]">
            {data.subjects &&
              data.subjects.map((subject) => (
                <Badge key={subject} className="gap-1">
                  {subject}
                  <button
                    onClick={() =>
                      onChange({
                        ...data,
                        subjects: data.subjects
                          ? data.subjects.filter((s) => s !== subject)
                          : [],
                      })
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
                    (subject) => !data.subjects?.includes(subject.name),
                  )
                  .map((subject) => (
                    <button
                      key={subject.id}
                      className="w-full px-3 py-2 text-left hover:bg-slate-100"
                      onClick={() => {
                        onChange({
                          ...data,
                          subjects: data.subjects
                            ? [...data.subjects, subject.name]
                            : [subject.name],
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

      <div>
        <Label>Supervised Classes</Label>
        <div className="relative">
          <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[38px]">
            {data.supervised_classes &&
              data.supervised_classes.map((classId) => (
                <Badge key={classId} className="gap-1">
                  {getClassName(classId)}
                  <button
                    onClick={() =>
                      onChange({
                        ...data,
                        supervised_classes: data.supervised_classes
                          ? data.supervised_classes.filter((c) => c !== classId)
                          : [],
                      })
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
                {availableClasses
                  .filter(
                    (cls) => !data.supervised_classes?.includes(cls.id),
                  )
                  .map((cls) => (
                    <button
                      key={cls.id}
                      className="w-full px-3 py-2 text-left hover:bg-slate-100"
                      onClick={() => {
                        onChange({
                          ...data,
                          supervised_classes: data.supervised_classes
                            ? [...data.supervised_classes, cls.id]
                            : [cls.id],
                        });
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

      <div>
        <Label>Rooms</Label>
        <div className="relative">
          <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[38px]">
            {data.rooms &&
              data.rooms.map((room) => (
                <Badge key={room.id} className="gap-1">
                  {room.room_number}
                  <button
                    onClick={() =>
                      onChange({
                        ...data,
                        rooms: data.rooms
                          ? data.rooms.filter((r) => r.id !== room.id)
                          : [],
                      })
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            <button
              className="text-sm text-slate-500 hover:text-slate-700"
              onClick={() => setShowRoomDropdown(!showRoomDropdown)}
            >
              + Add Room
            </button>
          </div>
          {showRoomDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
              <ScrollArea className="h-[200px]">
                {availableRooms
                  .filter((room) => !data.rooms?.some(existingRoom => existingRoom.id === room.id))
                  .sort((a, b) => a.room_number.localeCompare(b.room_number))
                  .map((room) => (
                    <button
                      key={room.id}
                      className="w-full px-3 py-2 text-left hover:bg-slate-100"
                      onClick={() => {
                        onChange({
                          ...data,
                          rooms: data.rooms ? [...data.rooms, room] : [room],
                        });
                        setShowRoomDropdown(false);
                      }}
                    >
                      {room.room_number}
                    </button>
                  ))}
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_part_time"
            checked={data.is_part_time || false}
            onCheckedChange={(checked) =>
              onChange({
                ...data,
                is_part_time: checked,
                work_days: checked ? [] : weekDays,
              })
            }
          />
          <Label htmlFor="is_part_time">Part-time Teacher</Label>
        </div>

        {data.is_part_time && (
          <div className="space-y-2">
            <Label>Work Days</Label>
            <div className="grid grid-cols-2 gap-2">
              {weekDays.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day}`}
                    checked={data.work_days ? data.work_days.includes(day) : false}
                    onCheckedChange={(checked) => {
                      const newDays = checked
                        ? data.work_days
                          ? [...data.work_days, day]
                          : [day]
                        : data.work_days
                          ? data.work_days.filter((d) => d !== day)
                          : [];
                      onChange({
                        ...data,
                        work_days: newDays,
                      });
                    }}
                  />
                  <Label htmlFor={`day-${day}`}>{day}</Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button className="w-full" onClick={onSubmit}>
        {mode === "add" ? "Add Teacher" : "Update Teacher"}
      </Button>
    </div>
  );
};

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState<(Teacher & { rooms: Room[] | null })[]>(
    [],
  );
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeacher, setNewTeacher] = useState<
    Omit<Teacher, "id" | "created_at"> & { rooms: Room[] }
  >({
    name: "",
    subjects: [],
    supervised_classes: [],
    rooms: [],
    is_part_time: false,
    work_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  });
  const [editingTeacher, setEditingTeacher] = useState<
    (Teacher & { rooms: Room[] | null }) | null
  >(null);
    const [dialogOpen, setDialogOpen] = useState(false);

  const { toast } = useToast();


  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  useEffect(() => {
    fetchData();
  }, []);

const fetchData = async () => {
  try {
    const [teachersData, subjectsData, classesData, roomsData, timeSlotsData] =
      await Promise.all([
        supabase.from("teachers").select("*").order("name"),
        supabase.from("subjects").select("*").order("name"),
        supabase.from("classes").select("*").order("grade"),
        supabase.from("rooms").select("*"),
        supabase.from("time_slots").select("teacher_id, room_id, rooms(*)"),
      ]);

    // ... error handling ...
    if (teachersData.error) throw teachersData.error;
    if (subjectsData.error) throw subjectsData.error;
    if (classesData.error) throw classesData.error;
    if (roomsData.error) throw roomsData.error;
    if (timeSlotsData.error) throw timeSlotsData.error;

    // Process teachers data to include their rooms from time_slots
    const teachersWithRooms = teachersData.data.map(teacher => {
      const teacherRooms = timeSlotsData.data
        .filter(slot => slot.teacher_id === teacher.id)
        .map(slot => slot.rooms)
        .filter((room, index, self) => 
          room && index === self.findIndex(r => r?.id === room?.id)
        );

      return {
        ...teacher,
        rooms: teacherRooms.length > 0 ? teacherRooms : null
      };
    });

    setTeachers(teachersWithRooms);
    // ... rest of the code ...
    setSubjects(subjectsData.data || []);
    setClasses(classesData.data || []);
    setRooms(roomsData.data || []);
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    setLoading(false);
  }
};

  const handleAddTeacher = async () => {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .insert([
          {
            name: newTeacher.name,
            subjects: newTeacher.subjects,
            supervised_classes: newTeacher.supervised_classes,
            rooms: newTeacher.rooms,
            is_part_time: newTeacher.is_part_time,
            work_days: newTeacher.work_days,
          },
        ])
        .select();

      if (error) throw error;

      // Construct the toast message
      const teacherName = data && data[0] ? data[0].name : "New Teacher";
      const toastMessage = `${teacherName} added successfully.`;

      toast({
        title: "Success",
        description: toastMessage,
        duration: 5000, // 5 seconds
      });

      fetchData();
      setNewTeacher({
        name: "",
        subjects: [],
        supervised_classes: [],
        rooms: [],
        is_part_time: false,
        work_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      });
            setDialogOpen(false);

    } catch (error) {
      console.error("Error adding teacher:", error);
        toast({
          title: "Error",
          description: "Failed to add teacher.",
          variant: "destructive",
        });
    }
  };

const handleUpdateTeacher = async () => {
  if (!editingTeacher) return;

  try {
    // Update the teacher's basic information
    const { error: updateError } = await supabase
      .from("teachers")
      .update({
        name: editingTeacher.name,
        subjects: editingTeacher.subjects,
        supervised_classes: editingTeacher.supervised_classes,
        is_part_time: editingTeacher.is_part_time,
        work_days: editingTeacher.work_days,
      })
      .eq("id", editingTeacher.id);

    if (updateError) throw updateError;

    // Get existing time slots for this teacher
    const { data: existingSlots, error: slotsError } = await supabase
      .from("time_slots")
      .select("*")
      .eq("teacher_id", editingTeacher.id);

    if (slotsError) throw slotsError;

    // Fetch first lesson for default assignment
    const { data: lessonData, error: lessonsError } = await supabase
      .from("lessons")
      .select("id")
      .order("lesson_number")
      .limit(1);

    if (lessonsError) throw lessonsError;

    // Remove existing room assignments
    if (existingSlots && existingSlots.length > 0) {
      const { error: deleteError } = await supabase
        .from("time_slots")
        .delete()
        .eq("teacher_id", editingTeacher.id);

      if (deleteError) throw deleteError;
    }

    // Add new room assignments
    if (editingTeacher.rooms && editingTeacher.rooms.length > 0 && lessonData && lessonData[0]) {
      const newTimeSlots = editingTeacher.rooms.map(room => ({
        teacher_id: editingTeacher.id,
        room_id: room.id,
        day: editingTeacher.work_days[0],
        lesson_id: lessonData[0].id,  // Use lesson_id instead of start/end times
        subject: editingTeacher.subjects?.[0] || null // Add first subject as default
      }));

      const { error: insertError } = await supabase
        .from("time_slots")
        .insert(newTimeSlots);

      if (insertError) throw insertError;
    }

    const toastMessage = `${editingTeacher.name} updated successfully.`;
    toast({
      title: "Success",
      description: toastMessage,
      duration: 5000,
    });

    await fetchData();
    setEditingTeacher(null);
    setDialogOpen(false)
  } catch (error) {
    console.error("Error updating teacher:", error);
    toast({
      title: "Error",
      description: "Failed to update teacher.",
      variant: "destructive",
    });
  }
};

  const handleDeleteTeacher = async (id: string) => {
    try {
      const { error } = await supabase.from("teachers").delete().eq("id", id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error deleting teacher:", error);
    }
  };

  const getClassName = (classId: string) => {
    const foundClass = classes.find((c) => c.id === classId);
    return foundClass ? foundClass.name : "";
  };

  return (
    <div className="p-6 bg-white">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Teacher Management</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
              </DialogHeader>
              <TeacherForm
                mode="add"
                data={newTeacher}
                onChange={(data) => setNewTeacher({ ...newTeacher, ...data })}
                onSubmit={handleAddTeacher}
                subjects={subjects}
                availableClasses={classes}
                availableRooms={rooms}
                weekDays={weekDays}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Supervised Classes</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Rooms</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>{teacher.name}</span>
                      {teacher.is_part_time && (
                        <Badge className="w-fit">Part-time</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.subjects &&
                        teacher.subjects.map((subject) => (
                          <Badge key={subject}>{subject}</Badge>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.supervised_classes &&
                        teacher.supervised_classes.map((classId) => (
                          <Badge key={classId}>{getClassName(classId)}</Badge>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.work_days &&
                        teacher.work_days.map((day) => (
                          <Badge key={day}>{day.slice(0, 3)}</Badge>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                    {teacher.rooms && teacher.rooms.length > 0 ? (
                      [...teacher.rooms]
                        .sort((a, b) => a.room_number.localeCompare(b.room_number))
                        .map(room => (
                          <Badge key={room.id}>{room.room_number}</Badge>
                        ))
                    ) : (
                      <></>
                    )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog
                        open={editingTeacher?.id === teacher.id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setEditingTeacher(null);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setEditingTeacher({
                              ...teacher,
                              rooms: teacher.rooms || [] // Ensure rooms is always an array
                            })}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Teacher</DialogTitle>
                          </DialogHeader>
                          {editingTeacher && (
                            <TeacherForm
                              mode="edit"
                              data={editingTeacher}
                              onChange={(data) => {
                                setEditingTeacher({
                                  ...editingTeacher,
                                  ...data,
                                });
                              }}
                              onSubmit={handleUpdateTeacher}
                              subjects={subjects}
                              availableClasses={classes}
                              availableRooms={rooms}
                              weekDays={weekDays}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTeacher(teacher.id)}
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

export default TeacherManagement;
