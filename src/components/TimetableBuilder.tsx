import { useEffect, useState } from "react";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import { Plus } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../lib/database.types";
import { useToast } from "./ui/use-toast";
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

    interface TimeSlot {
        id: string;
        day: string;
        lessons: {
            start_time: string;
            end_time: string;
            lesson_number: number;
        };
        subjects: {
            name: string;
        };
        rooms: {
            room_number: string;
        };
        teachers: {
            name: string;
        } | null;
        classes: {
            name: string;
        };
    }

    interface TimetableBuilderProps {
        timeSlots?: TimeSlot[];
        onTimeSlotAdd?: (timeSlot: TimeSlot) => void;
        onTimeSlotMove?: (
            day: string,
            lessonNumber: string,
            subjectId: string,
            roomId: string,
            teacherId: string,
            classId: string
        ) => void;
    }

    const TimetableBuilder = ({
        timeSlots = [],
        onTimeSlotAdd = () => { },
        onTimeSlotMove = () => { },
    }: TimetableBuilderProps) => {
        const { toast } = useToast();
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        const [lessons, setLessons] = useState<TimeSlot[]>([]);
        const [availableLessons, setAvailableLessons] = useState<Lesson[]>([]);
        const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
        const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
        const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
        const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
        const [isDialogOpen, setIsDialogOpen] = useState(false);
        const [loading, setLoading] = useState(true);

        const [selectedDay, setSelectedDay] = useState<string>("");
        const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
        const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
        const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
        const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
        const [selectedClass, setSelectedClass] = useState<string | null>(null);

        // Fetch lesson data
        useEffect(() => {
            const fetchLessons = async () => {
                try {
                    const { data, error } = await supabase
                        .from("time_slots")
                        .select(
                            `
                            id,
                            day,
                            lesson_id,
                            subject,
                            room_id,
                            teacher_id,
                            class_id,
                            lessons (
                                start_time,
                                end_time,
                                lesson_number
                            ),
                            subjects!inner (
                                name
                            ),
                            rooms!inner (
                                room_number
                            ),
                            teachers!inner (
                                name
                            ),
                            classes!inner (
                                name
                            )
                            `
                        )
                        .order("day", { ascending: true });

                    if (error) throw error;

                    // Type the fetched data according to TimeSlot interface
                    const typedData: TimeSlot[] = (data || []).map((item: any) => ({
                        id: item.id,
                        day: item.day,
                        lessons: {
                            start_time: item.lessons.start_time,
                            end_time: item.lessons.end_time,
                            lesson_number: item.lessons.lesson_number,
                        },
                        subjects: {
                            name: item.subjects.name,
                        },
                        rooms: {
                            room_number: item.rooms.room_number,
                        },
                        teachers: item.teachers ? { name: item.teachers.name } : null,
                        classes: {
                            name: item.classes.name,
                        },
                    }));
                    setLessons(typedData);

                } catch (error: any) {
                    toast({
                        variant: "destructive",
                        title: "Error fetching lessons.",
                        description: error.message,
                    });
                }
            };

            const fetchAvailableLessons = async () => {
                try {
                    const { data, error } = await supabase.from("lessons").select("*");
                    if (error) throw error;
                    setAvailableLessons(data || []);
                } catch (error: any) {
                    toast({
                        variant: "destructive",
                        title: "Error fetching available lessons.",
                        description: error.message,
                    });
                }
            };

            const fetchAvailableSubjects = async () => {
                try {
                    const { data, error } = await supabase.from("subjects").select("*");
                    if (error) throw error;
                    setAvailableSubjects(data || []);
                } catch (error: any) {
                    toast({
                        variant: "destructive",
                        title: "Error fetching available subjects.",
                        description: error.message,
                    });
                }
            };
            const fetchAvailableRooms = async () => {
                try {
                    const { data, error } = await supabase.from("rooms").select("*");
                    if (error) throw error;
                    setAvailableRooms(data || []);
                } catch (error: any) {
                    toast({
                        variant: "destructive",
                        title: "Error fetching available rooms.",
                        description: error.message,
                    });
                }
            };
            const fetchAvailableTeachers = async () => {
                try {
                    const { data, error } = await supabase.from("teachers").select("*");
                    if (error) throw error;
                    setAvailableTeachers(data || []);
                } catch (error: any) {
                    toast({
                        variant: "destructive",
                        title: "Error fetching available teachers.",
                        description: error.message,
                    });
                }
            };
            const fetchAvailableClasses = async () => {
                try {
                    const { data, error } = await supabase.from("classes").select("*");
                    if (error) throw error;
                    setAvailableClasses(data || []);
                } catch (error: any) {
                    toast({
                        variant: "destructive",
                        title: "Error fetching available classes.",
                        description: error.message,
                    });
                }
            };

            const fetchData = async () => {
                await Promise.all([
                    fetchLessons(),
                    fetchAvailableLessons(),
                    fetchAvailableSubjects(),
                    fetchAvailableRooms(),
                    fetchAvailableTeachers(),
                    fetchAvailableClasses()
                ]);
                setLoading(false);
            }

            fetchData();
        }, []);

        const handleAddTimeSlot = async () => {
            if (!selectedDay || !selectedLesson || !selectedSubject || !selectedRoom || !selectedTeacher || !selectedClass) {
                toast({
                    variant: "destructive",
                    title: "Error adding time slot.",
                    description: "Please fill in all fields.",
                });
                return;
            }

            const selectedLessonObj = availableLessons.find(lesson => lesson.id === selectedLesson);
            const selectedSubjectObj = availableSubjects.find(subject => subject.id === selectedSubject);
            const selectedRoomObj = availableRooms.find(room => room.id === selectedRoom);
            const selectedTeacherObj = availableTeachers.find(teacher => teacher.id === selectedTeacher);
            const selectedClassObj = availableClasses.find(cls => cls.id === selectedClass);

            if (!selectedLessonObj || !selectedSubjectObj || !selectedRoomObj || !selectedTeacherObj || !selectedClassObj) {
                toast({
                    variant: "destructive",
                    title: "Error adding time slot.",
                    description: "Please ensure all selections are valid.",
                });
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("time_slots")
                    .insert([
                        {
                            day: selectedDay,
                            lesson_id: selectedLessonObj.id,
                            subject: selectedSubjectObj.name, // Use 'subject' (name) instead of 'subject_id'
                            room_id: selectedRoomObj.id,
                            teacher_id: selectedTeacherObj.id,
                            class_id: selectedClassObj.id, // Keep using class_id as is for now
                        },
                    ])
                    .select();

                if (error) throw error;

                // Refetch lessons to include the new time slot
                const fetchUpdatedLessons = async () => {
                    const { data: updatedLessons, error: updatedError } = await supabase
                        .from("time_slots")
                        .select(
                            `
                            id,
                            day,
                            lesson_id,
                            subject,
                            room_id,
                            teacher_id,
                            class_id,
                            lessons (
                                start_time,
                                end_time,
                                lesson_number
                            ),
                            subjects!inner (
                                name
                            ),
                            rooms!inner (
                                room_number
                            ),
                            teachers!inner (
                                name
                            ),
                            classes!inner (
                                name
                            )
                            `
                        )
                        .order("day", { ascending: true });

                    if (updatedError) throw updatedError;
                    // Type the fetched data according to TimeSlot interface
                    const typedData: TimeSlot[] = (updatedLessons || []).map((item: any) => ({
                        id: item.id,
                        day: item.day,
                        lessons: {
                            start_time: item.lessons.start_time,
                            end_time: item.lessons.end_time,
                            lesson_number: item.lessons.lesson_number,
                        },
                        subjects: {
                            name: item.subjects.name,
                        },
                        rooms: {
                            room_number: item.rooms.room_number,
                        },
                        teachers: item.teachers ? { name: item.teachers.name } : null,
                        classes: {
                            name: item.classes.name,
                        },
                    }));
                    setLessons(typedData);
                };

                await fetchUpdatedLessons();
                setSelectedDay("");
                setSelectedLesson(null);
                setSelectedSubject(null);
                setSelectedRoom(null);
                setSelectedTeacher(null);
                setSelectedClass(null);
                setIsDialogOpen(false);
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Error adding time slot.",
                    description: error.message,
                });
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
    
            interface TimeSlotCardProps {
                timeSlot: TimeSlot | undefined;
                lessonNumber: number;
            }
    
            const TimeSlotCard: React.FC<TimeSlotCardProps> = ({ timeSlot, lessonNumber }) => {
                if (!timeSlot) {
                    return (
                        <div
                            key={`empty-${lessonNumber}`}
                            className="h-24 border-2 border-dashed border-slate-300 rounded-md"
                        ></div>
                    );
                }
                return (
                    <Card
                        key={`${timeSlot.day}-${timeSlot.lessons.start_time}`}
                        className="h-24 border-2 border-slate-300 p-2 rounded-md"
                    >
                        <div className="flex items-center gap-2 text-sm bg-slate-200 p-2 rounded-md">
                            <DragHandleDots2Icon className="h-4 w-4 text-slate-500" />
                            <div className="flex-1">
                                <div className="font-medium">{timeSlot.subjects.name}</div>
                                <div className="text-slate-600">
                                    {timeSlot.rooms.room_number}
                                </div>
                                <div className="text-slate-600">{timeSlot.teachers?.name}</div>
                            </div>
                        </div>
                    </Card>
                )
            }
    
            return (
                <div className="p-6 bg-slate-100 rounded-lg shadow-lg">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <p>Loading...</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-900">
                                    Timetable Builder
                                </h2>
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
                                    <Dialog
                                        open={isDialogOpen}
                                        onOpenChange={setIsDialogOpen}
                                    >
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
                                                        onValueChange={(value) =>
                                                            setSelectedDay(value)
                                                        }
                                                        value={selectedDay}
                                                    >
                                                        <SelectTrigger
                                                            id="day"
                                                            className="col-span-3"
                                                        >
                                                            <SelectValue placeholder="Select a day" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {days.map((day) => (
                                                                <SelectItem
                                                                    key={day}
                                                                    value={day}
                                                                >
                                                                    {day}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label
                                                        htmlFor="lesson"
                                                        className="text-right"
                                                    >
                                                        Lesson
                                                    </Label>
                                                    <Select
                                                        onValueChange={(value) =>
                                                            setSelectedLesson(value)
                                                        }
                                                        value={selectedLesson}
                                                    >
                                                        <SelectTrigger
                                                            id="lesson"
                                                            className="col-span-3"
                                                        >
                                                            <SelectValue placeholder="Select a lesson" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableLessons.map((lesson) => (
                                                                <SelectItem
                                                                    key={lesson.id}
                                                                    value={lesson.id}
                                                                >
                                                                    {lesson.lesson_number}{" "}
                                                                    ({formatTimeRange(
                                                                        lesson.id
                                                                    )})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label
                                                        htmlFor="subject"
                                                        className="text-right"
                                                    >
                                                        Subject
                                                    </Label>
                                                    <Select
                                                        onValueChange={(value) =>
                                                            setSelectedSubject(value)
                                                        }
                                                        value={selectedSubject}
                                                    >
                                                        <SelectTrigger
                                                            id="subject"
                                                            className="col-span-3"
                                                        >
                                                            <SelectValue placeholder="Select a subject" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableSubjects.map((subject) => (
                                                                <SelectItem
                                                                    key={subject.id}
                                                                    value={subject.id}
                                                                >
                                                                    {subject.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label
                                                        htmlFor="room"
                                                        className="text-right"
                                                    >
                                                        Room
                                                    </Label>
                                                    <Select
                                                        onValueChange={(value) =>
                                                            setSelectedRoom(value)
                                                        }
                                                        value={selectedRoom}
                                                    >
                                                        <SelectTrigger
                                                            id="room"
                                                            className="col-span-3"
                                                        >
                                                            <SelectValue placeholder="Select a room" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableRooms.map((room) => (
                                                                <SelectItem
                                                                    key={room.id}
                                                                    value={room.id}
                                                                >
                                                                    {room.room_number}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label
                                                        htmlFor="teacher"
                                                        className="text-right"
                                                    >
                                                        Teacher
                                                    </Label>
                                                    <Select
                                                        onValueChange={(value) =>
                                                            setSelectedTeacher(value)
                                                        }
                                                        value={selectedTeacher}
                                                    >
                                                        <SelectTrigger
                                                            id="teacher"
                                                            className="col-span-3"
                                                        >
                                                            <SelectValue placeholder="Select a teacher" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableTeachers.map((teacher) => (
                                                                <SelectItem
                                                                    key={teacher.id}
                                                                    value={teacher.id}
                                                                >
                                                                    {teacher.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label
                                                        htmlFor="teacher"
                                                        className="text-right"
                                                    >
                                                        Class
                                                    </Label>
                                                    <Select
                                                        onValueChange={(value) =>
                                                            setSelectedClass(value)
                                                        }
                                                        value={selectedClass}
                                                    >
                                                        <SelectTrigger
                                                            id="class"
                                                            className="col-span-3"
                                                        >
                                                            <SelectValue placeholder="Select a class" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableClasses.map((cls) => (
                                                                <SelectItem
                                                                    key={cls.id}
                                                                    value={cls.id}
                                                                >
                                                                    {cls.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    type="button"
                                                    onClick={handleAddTimeSlot}
                                                >
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
                                        const lesson = availableLessons.find(
                                            (l) => l?.lesson_number === lessonNumber
                                        );
    
                                        return (
                                            <div
                                                key={lessonNumber}
                                                className="h-24 flex items-center justify-center text-sm text-slate-600"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium text-center">
                                                        {lessonNumber}
                                                    </div>
                                                    <div className="text-xs">
                                                        {lesson
                                                            ? formatTimeRange(lesson.id)
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
                                        {/* Render 8 slots for each day */}
                                        {Array.from({ length: 8 }).map((_, index) => {
                                            const lessonNumber = index + 1;
                                            // Find the specific time slot for this day and lesson number
                                            const timeSlot = lessons.find(
                                                (lesson) =>
                                                    lesson.day === day &&
                                                    lesson.lessons.lesson_number === lessonNumber
                                            );
                                            return (
                                                <TimeSlotCard
                                                    key={`${day}-${lessonNumber}`}
                                                    timeSlot={timeSlot}
                                                    lessonNumber={lessonNumber}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            );
        };

export default TimetableBuilder;
