import { useEffect, useState } from "react";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import { Plus } from "lucide-react";
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
  onTimeSlotMove?: (day: string, lessonNumber: string, subjectId: string, roomId: string, teacherId: string, classId: string) => void;
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
      // Refetch lessons to include the new time slot
      const fetchUpdatedLessons = async () => {
        const { data: updatedLessons, error: updatedError } = await supabase
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

        if (updatedError) {
          console.error("Error fetching updated lessons:", updatedError);
        } else {
          setLessons(updatedLessons || []);
        }
      };

      fetchUpdatedLessons();
      setSelectedDay("");
      setSelectedLesson(null);
      setSelectedSubject(null);
      setSelectedRoom(null);
      setSelectedTeacher(null);
      setSelectedClass(null);
      setIsDialogOpen(false);
    }
  };

    // Function to format time range, now using lessons data
    const formatTimeRange = (lessonId: string) => {
        const lesson = availableLessons.find(l => l.id === lessonId);
        if (!lesson) return "";
        const startTime = lesson.start_time.substring(0, 5); // "HH:mm"
        const endTime = lesson.end_time.substring(0, 5); // "HH:mm"
        return `${startTime}-${endTime}`;
    };

  return (
    <div className="p-6 bg-slate-100 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Timetable Builder</h2>
        <div className="flex gap-4">
          <Select defaultValue="all">
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Teacher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              {availableTeachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {availableSubjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  <Select
                    onValueChange={(value) => setSelectedDay(value)}
                    value={selectedDay}
                  >
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
                  <Select
                    onValueChange={(value) => setSelectedLesson(value)}
                    value={selectedLesson}
                  >
                    <SelectTrigger id="lesson" className="col-span-3">
                      <SelectValue placeholder="Select a lesson" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lesson.lesson_number}{" "}
                          ({formatTimeRange(lesson.id)})
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
                  <Select
                    onValueChange={(value) => setSelectedRoom(value)}
                    value={selectedRoom}
                  >
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
                  <Select
                    onValueChange={(value) => setSelectedTeacher(value)}
                    value={selectedTeacher}
                  >
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
                  <Select
                    onValueChange={(value) => setSelectedClass(value)}
                    value={selectedClass}
                  >
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
                <Button type="button" onClick={handleAddTimeSlot}>
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4 mt-8">
        {/* Time column */}
        <div className="flex flex-col justify-between space-y-4">
          {Array.from({ length: 8 }).map((_, index) => {
            const lessonNumber = index + 1;
            // Find the lesson for this lesson number from availableLessons
            const lesson = availableLessons.find(
              (l) => l?.lesson_number === lessonNumber
            );

            return (
              <div
                key={lessonNumber}
                className="h-24 flex items-center justify-center text-sm text-slate-600"
              >
                <div className="flex items-center gap-2">
                  <div className="font-medium text-center">{lessonNumber}</div>
                  <div className="text-xs">
                    {lesson ? formatTimeRange(lesson.id) : ""}
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
            {/* Render 8 empty slots, and fill in with data if available */}
            {Array.from({ length: 8 }).map((_, index) => {
              const lessonNumber = index + 1;
              const timeSlot = lessons.find(
                (lesson) =>
                  lesson.day === day && lesson.lessons.lesson_number === lessonNumber
              );

              return timeSlot ? (
                <Card
                  key={`${day}-${timeSlot.lessons.start_time}`}
                  className="h-24 border-2 border-slate-300 p-2 rounded-md"
                >
                  <div className="flex items-center gap-2 text-sm bg-slate-200 p-2 rounded-md">
                    <DragHandleDots2Icon className="h-4 w-4 text-slate-500" />
                    <div className="flex-1">
                      <div className="font-medium">{timeSlot.subjects.name}</div>
                      <div className="text-slate-600">
                        {timeSlot.rooms.room_number}
                      </div>
                      <div className="text-slate-600">
                        {timeSlot.teachers?.name}
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <div
                  key={`${day}-${lessonNumber}`}
                  className="h-24 border-2 border-dashed border-slate-300 rounded-md"
                ></div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimetableBuilder;
