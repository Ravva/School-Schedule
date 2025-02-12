import { useEffect, useState } from "react";
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
import { Database } from "@/lib/database.types";

type TimeSlot = Database['public']['Tables']['time_slots']['Row']
type Subject = Database['public']['Tables']['subjects']['Row']
type Teacher = Database['public']['Tables']['teachers']['Row']
type Class = Database['public']['Tables']['classes']['Row']


const RoomManagement = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTimeSlot, setNewTimeSlot] = useState<Partial<TimeSlot>>({});
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [timeSlotsData, subjectsData, teachersData, classesData] =
        await Promise.all([
          supabase.from("time_slots").select("*").order("room"),
          supabase.from("subjects").select("*").order("name"),
          supabase.from("teachers").select("*").order("name"),
          supabase.from("classes").select("*").order("name"),
        ]);

      if (timeSlotsData.error) throw timeSlotsData.error;
      if (subjectsData.error) throw subjectsData.error;
      if (teachersData.error) throw teachersData.error;
      if (classesData.error) throw classesData.error;

      setTimeSlots(timeSlotsData.data || []);
      setSubjects(subjectsData.data || []);
      setTeachers(teachersData.data || []);
      setClasses(classesData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeSlot = async () => {
    try {
      const { error } = await supabase.from("time_slots").insert([
        {
          room: newTimeSlot.room,
          teacher_id: newTimeSlot.teacher_id,
          subject: newTimeSlot.subject,
          day: newTimeSlot.day,
          start_time: newTimeSlot.start_time,
          end_time: newTimeSlot.end_time,
          is_extracurricular: newTimeSlot.is_extracurricular
        },
      ]);

      if (error) throw error;
      fetchData();
      setNewTimeSlot({}); // Reset form
    } catch (error) {
      console.error("Error adding time slot:", error);
    }
  };

  const handleUpdateTimeSlot = async () => {
    if (!editingTimeSlot) return;

    try {
      const { error } = await supabase
        .from("time_slots")
        .update({
          room: editingTimeSlot.room,
          teacher_id: editingTimeSlot.teacher_id,
          subject: editingTimeSlot.subject,
          day: editingTimeSlot.day,
          start_time: editingTimeSlot.start_time,
          end_time: editingTimeSlot.end_time,
          is_extracurricular: editingTimeSlot.is_extracurricular
        })
        .eq("id", editingTimeSlot.id);

      if (error) throw error;
      fetchData();
      setEditingTimeSlot(null); // Close dialog
    } catch (error) {
      console.error("Error updating time slot:", error);
    }
  };

  const handleDeleteTimeSlot = async (id: string) => {
    try {
      const { error } = await supabase.from("time_slots").delete().eq("id", id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error deleting time slot:", error);
    }
  };

  const TimeSlotForm = ({ mode }: { mode: "add" | "edit" }) => {
    const timeSlot = mode === "add" ? newTimeSlot : editingTimeSlot;
    const setTimeSlot = mode === "add" ? setNewTimeSlot : setEditingTimeSlot;

    if (!timeSlot) return null;

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="room">Room Number</Label>
          <Input
            id="room"
            maxLength={3}
            value={timeSlot.room || ""}
            onChange={(e) => {
              const updatedRoomNumber = e.target.value.replace(/\D/g, "").slice(0, 3);
              setTimeSlot(prevTimeSlot => ({ ...prevTimeSlot, room: updatedRoomNumber }))

            }}
            placeholder="Enter room number"
          />
        </div>
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Select
            onValueChange={(value) => {
              setTimeSlot((prevTimeSlot) => ({ ...prevTimeSlot, subject: value }));
            }}
            value={timeSlot.subject || ""}
          >
            <SelectTrigger id="subject">
              <SelectValue placeholder="Select a subject" />
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
            onValueChange={(value) => {
              setTimeSlot((prevTimeSlot) => ({ ...prevTimeSlot, teacher_id: value }));
            }}
            value={timeSlot.teacher_id || ""}
          >
            <SelectTrigger id="teacher">
              <SelectValue placeholder="Select a teacher" />
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
            onValueChange={(value) => {
              setTimeSlot((prevTimeSlot) => ({ ...prevTimeSlot, day: value }));
            }}
            value={timeSlot.day || ""}
          >
            <SelectTrigger id="class">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {/* Replace with actual days if you have a days array */}
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            type="time"
            value={timeSlot.start_time || ""}
            onChange={(e) => setTimeSlot(prevTimeSlot => ({ ...prevTimeSlot, start_time: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            type="time"
            value={timeSlot.end_time || ""}
            onChange={(e) => setTimeSlot(prevTimeSlot => ({ ...prevTimeSlot, end_time: e.target.value }))}
          />
        </div>
        <div className="flex items-center">
          <Label htmlFor="is_extracurricular" className="mr-2">Extracurricular</Label>
          <input
            type="checkbox"
            id="is_extracurricular"
            checked={timeSlot.is_extracurricular || false}
            onChange={(e) => setTimeSlot(prevTimeSlot => ({ ...prevTimeSlot, is_extracurricular: e.target.checked }))}
          />
        </div>

        <Button
          onClick={mode === "edit" ? handleUpdateTimeSlot : handleAddTimeSlot}
          className="w-full mt-4"
        >
          {mode === "edit" ? "Save Changes" : "Add Time Slot"}
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
                <Plus className="mr-2 h-4 w-4" /> Add Time Slot
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Time Slot</DialogTitle>
              </DialogHeader>
              <TimeSlotForm mode="add" />
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
                {timeSlots.map((timeSlot) => (
                  <TableRow key={timeSlot.id}>
                    <TableCell>{timeSlot.room}</TableCell>
                    <TableCell>{timeSlot.subject || "-"}</TableCell>
                    <TableCell>{timeSlot.teacher_id || "-"}</TableCell>
                    {/* Assuming you have a way to get class name from class ID */}
                    <TableCell>{timeSlot.day || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingTimeSlot(timeSlot)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Time Slot</DialogTitle>
                            </DialogHeader>
                            <TimeSlotForm mode="edit" />
                          </DialogContent>
                        </Dialog>
                        <Button
                          onClick={() => handleDeleteTimeSlot(timeSlot.id)}
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

export default RoomManagement;
