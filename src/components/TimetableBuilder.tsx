import { useEffect, useState } from "react";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import { Clock, Plus } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../lib/database.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type Lesson = Database["public"]["Tables"]["lessons"]["Row"];
type Subject = Database["public"]["Tables"]["subjects"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];
type Teacher = Database["public"]["Tables"]["teachers"]["Row"];
type Class = Database["public"]["Tables"]["classes"]["Row"];

interface TimetableBuilderProps {
  timeSlots?: any[]; // Update this type
  onTimeSlotAdd?: (timeSlot: any) => void; // Update this type
  onTimeSlotMove?: (timeSlot: any, newDay: string, newTime: string) => void; // Update this type
}

const TimetableBuilder = ({
  timeSlots = [],
  onTimeSlotAdd = () => {},
  onTimeSlotMove = () => {},
}: TimetableBuilderProps) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const [lessons, setLessons] = useState<any[]>([]);
  const [availableLessons, setAvailableLessons] = useState<Lesson[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  // Fetch lesson data
  useEffect(() => {
    const fetchLessons = async () => {
      const { data, error } = await supabase
        .from("time_slots")
        .select(
          `
          id,
          day,
          lessons (
            start_time,
            end_time,
            lesson_number
          ),
          subjects (
            name
          ),
          rooms (
            room_number
          ),
          teachers(
            name
          ),
          classes(
            name
          )
        `
        )
        .order("day", { ascending: true });

      if (error) {
        console.error("Error fetching lessons:", error);
      } else {
        setLessons(data || []);
        console.log(data);
      }
    };

    fetchLessons();
  }, []);
  const lessonNumbers = Array.from(
    new Set(lessons.map((lesson) => lesson?.lessons?.lesson_number))
  ).sort((a, b) => a - b);

  useEffect(() => {
    const fetchAvailableLessons = async () => {
      const { data, error } = await supabase.from("lessons").select("*");
      if (error) {
        console.error("Error fetching available lessons:", error);
      } else {
        setAvailableLessons(data || []);
      }
    };

    const fetchAvailableSubjects = async () => {
      const { data, error } = await supabase.from("subjects").select("*");
      if (error) {
        console.error("Error fetching available subjects:", error);
      } else {
        setAvailableSubjects(data || []);
      }
    };
    const fetchAvailableRooms = async () => {
      const { data, error } = await supabase.from("rooms").select("*");
      if (error) {
        console.error("Error fetching available rooms:", error);
      } else {
        setAvailableRooms(data || []);
      }
    };
    const fetchAvailableTeachers = async () => {
      const { data, error } = await supabase.from("teachers").select("*");
      if (error) {
        console.error("Error fetching available teachers:", error);
      } else {
        setAvailableTeachers(data || []);
      }
    };
    const fetchAvailableClasses = async () => {
      const { data, error } = await supabase.from("classes").select("*");
      if (error) {
        console.error("Error fetching available classes:", error);
      } else {
        setAvailableClasses(data || []);
      }
    };

    fetchAvailableLessons();
    fetchAvailableSubjects();
    fetchAvailableRooms();
    fetchAvailableTeachers();
    fetchAvailableClasses();
  }, []);

    const handleAddTimeSlot = async () => {
        if (!selectedDay || !selectedLesson || !selectedSubject || !selectedRoom || !selectedTeacher || !selectedClass) {
            alert("Please fill in all fields.");
      return;
    }

        const selectedLessonObj = availableLessons.find(lesson => lesson.id === selectedLesson);
        const selectedSubjectObj = availableSubjects.find(subject => subject.id === selectedSubject);
        const selectedRoomObj = availableRooms.find(room => room.id === selectedRoom);
        const selectedTeacherObj = availableTeachers.find(teacher => teacher.id === selectedTeacher);
        const selectedClassObj = availableClasses.find(cls => cls.id === selectedClass);

    if (!selectedLessonObj || !selectedSubjectObj || !selectedRoomObj || !selectedTeacherObj || !selectedClassObj) {
        alert("Please ensure all selections are valid.");
        return;
    }

    console.log("Adding time slot with data:", {
      day: selectedDay,
      lesson_id: selectedLessonObj.id,
      subject: selectedSubjectObj.name,
      room_id: selectedRoomObj.id,
      teacher_id: selectedTeacherObj.id,
      class_id: selectedClassObj.id,
    });

    const { data, error } = await supabase
      .from("time_slots")
      .insert([
        {
          day: selectedDay,
          lesson_id: selectedLessonObj.id,
          subject: selectedSubjectObj.name,
          room_id: selectedRoomObj.id,
          teacher_id: selectedTeacherObj.id,
          class_id: selectedClassObj.id,
        },
      ])
      .select();

    if (error) {
      console.error("Error adding time slot:", error);
    } else {
      console.log("Time slot added successfully:", data);
      setLessons([...lessons, data![0]]);
      setSelectedDay("");
      setSelectedLesson(null);
      setSelectedSubject(null);
      setSelectedRoom(null);
      setSelectedTeacher(null);
      setSelectedClass(null);
      setIsDialogOpen(false);
    }
  };

  // Function to format time range
  const formatTimeRange = (startTime: string, endTime: string) => {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      return `${hours}:${minutes}`;
    }
    return `${formatTime(startTime)}-${formatTime(endTime)}`;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Timetable Builder
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Time Slot
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Time Slot</DialogTitle>
              <DialogDescription>
                Add a new time slot to the timetable.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="day" className="text-right">
                  Day
                </Label>
                <Select onValueChange={(value) => setSelectedDay(value)} value={selectedDay}>
                  <SelectTrigger id="day" className="col-span-3">
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lesson" className="text-right">
                  Lesson
                </Label>
                <Select onValueChange={(value) => setSelectedLesson(value)} value={selectedLesson}>
                  <SelectTrigger id="lesson" className="col-span-3">
                    <SelectValue placeholder="Select a lesson" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.lesson_number} ({formatTimeRange(lesson.start_time, lesson.end_time)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  Subject
                </Label>
                <Select
                  onValueChange={(value) => setSelectedSubject(value)}
                  value={selectedSubject}
                >
                  <SelectTrigger id="subject" className="col-span-3">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room" className="text-right">
                  Room
                </Label>
                 <Select onValueChange={(value) => setSelectedRoom(value)} value={selectedRoom}>
                  <SelectTrigger id="room" className="col-span-3">
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.room_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="teacher" className="text-right">
                  Teacher
                </Label>
                <Select onValueChange={(value) => setSelectedTeacher(value)} value={selectedTeacher}>
                  <SelectTrigger id="teacher" className="col-span-3">
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="teacher" className="text-right">
                  Class
                </Label>
                <Select onValueChange={(value) => setSelectedClass(value)} value={selectedClass}>
                  <SelectTrigger id="class" className="col-span-3">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleAddTimeSlot}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex gap-4 mb-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Teacher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teachers</SelectItem>
            {availableTeachers.map(teacher => (
                <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {availableSubjects.map(subject => (
                <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {/* Time column */}
        <div className="pt-16">
          {lessonNumbers.map((lessonNumber) => {
            const lesson = lessons.find(
              (l) => l?.lessons?.lesson_number === lessonNumber
            );
            return (
              <div
                key={lessonNumber}
                className="h-24 flex items-center text-sm text-slate-600"
              >
                <div className="flex items-center gap-2">
                  <div className="font-medium">{lessonNumber}</div>
                  <Clock className="h-4 w-4" />
                  <div>
                    {lesson?.lessons
                      ? formatTimeRange(
                          lesson.lessons.start_time,
                          lesson.lessons.end_time
                        )
                      : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Days columns */}
        {days.map((day) => (
          <div key={day} className="space-y-4">
            <div className="h-16 flex items-center justify-center font-semibold text-slate-900">
              {day}
            </div>
            {lessons
              .filter((lesson) => lesson.day === day)
              .map((time) => (
                <Card
                  key={`${day}-${time.lessons.start_time}`}
                  className="h-24 border-2 border-dashed border-slate-200 p-2"
                >
                  <div className="flex items-center gap-2 text-sm bg-slate-100 p-2 rounded">
                    <DragHandleDots2Icon className="h-4 w-4 text-slate-500" />
                    <div className="flex-1">
                      <div className="font-medium">{time.subjects.name}</div>
                      <div className="text-slate-500">
                        {time.rooms.room_number}
                      </div>
                      <div className="text-slate-500">{time.teachers?.name}</div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimetableBuilder;
