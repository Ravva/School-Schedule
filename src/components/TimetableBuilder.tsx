import { useEffect, useState } from "react";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";

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
            is_extracurricular?: boolean;
            is_subgroup?: boolean;
        };
        rooms: {
            room_number: string;
        };
        teachers: {
            name: string;
        } | null;
        classes: {
            name: string;
            has_subgroups?: boolean;
            subgroup?: number;
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
                onDelete: (id: string) => void;
                onEdit: (timeSlot: TimeSlot) => void;
                availableSubjects: Subject[];
                availableTeachers: Teacher[];
                availableRooms: Room[];
            }
    const TimeSlotCard: React.FC<TimeSlotCardProps> = ({ 
        timeSlot, 
        lessonNumber,
        onDelete,
        onEdit,
        availableSubjects,
        availableTeachers,
        availableRooms
    }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [editedSubject, setEditedSubject] = useState<string | null>(null);
        const [editedTeacher, setEditedTeacher] = useState<string | null>(null);
        const [editedRoom, setEditedRoom] = useState<string | null>(null);
    
        if (!timeSlot) {
            return (
                <div
                    key={`empty-${lessonNumber}`}
                    className="h-24 border-2 border-dashed border-slate-300 rounded-md"
                ></div>
            );
        }
    
        const handleSave = () => {
            if (editedSubject && editedTeacher && editedRoom) {
                // Update the timeSlot with new values and call onEdit
                const updatedTimeSlot = {
                    ...timeSlot,
                    subjects: { name: editedSubject },
                    teachers: { name: editedTeacher },
                    rooms: { room_number: editedRoom }
                };
                onEdit(updatedTimeSlot);
                setIsEditing(false);
            }
        };
    
        return (
            <ContextMenu>
                <ContextMenuTrigger>
                    <Card
                        key={`${timeSlot.day}-${timeSlot.lessons.start_time}`}
                        className={`${isEditing ? 'h-36' : 'h-24'} border-2 border-slate-300 p-2 rounded-md relative transition-all duration-200 
                        ${timeSlot.subjects.is_extracurricular ? 'bg-purple-50' : ''} 
                        ${timeSlot.subjects.is_subgroup ? 'bg-green-50' : ''}`}
                    >
                        {isEditing ? (
                            <div className="flex flex-col gap-1">
                                <Select value={editedSubject || timeSlot.subjects.name} onValueChange={setEditedSubject}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableSubjects.map(subject => (
                                            <SelectItem key={subject.id} value={subject.name}>
                                                {subject.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="grid grid-cols-2 gap-2">
                                    <Select value={editedTeacher || timeSlot.teachers?.name || ''} onValueChange={setEditedTeacher}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select teacher" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTeachers.map(teacher => (
                                                <SelectItem key={teacher.id} value={teacher.name}>
                                                    {teacher.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={editedRoom || timeSlot.rooms.room_number} onValueChange={setEditedRoom}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select room" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableRooms.map(room => (
                                                <SelectItem key={room.id} value={room.room_number}>
                                                    {room.room_number}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleSave} className="mt-2">Save</Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1 text-sm">
                                <div className="font-medium">{timeSlot.subjects.name}</div>
                                <div className="text-slate-600 flex items-center gap-2">
                                    <span>{timeSlot.teachers?.name}</span>
                                    {timeSlot.classes.has_subgroups && (
                                        <span className="text-xs bg-slate-200 px-1 rounded">
                                            Group {timeSlot.classes.subgroup}
                                        </span>
                                    )}
                                    <span className="ml-auto">{timeSlot.rooms.room_number}</span>
                                </div>
                            </div>
                        )}
                    </Card>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onClick={() => setIsEditing(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onDelete(timeSlot.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        );
    };
    const handleDeleteTimeSlot = async (id: string) => {
        try {
            const { error } = await supabase
                .from("time_slots")
                .delete()
                .eq('id', id);

            if (error) throw error;

            setLessons(lessons.filter(lesson => lesson.id !== id));
            toast({
                title: "Time slot deleted",
                description: "The time slot has been successfully deleted.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error deleting time slot",
                description: error.message,
            });
        }
    };
    const handleEditTimeSlot = (timeSlot: TimeSlot) => {
        const lessonObj = availableLessons.find(l => l.lesson_number === timeSlot.lessons.lesson_number);
        const subjectObj = availableSubjects.find(s => s.name === timeSlot.subjects.name);
        const roomObj = availableRooms.find(r => r.room_number === timeSlot.rooms.room_number);
        const teacherObj = availableTeachers.find(t => t.name === timeSlot.teachers?.name);
        const classObj = availableClasses.find(c => c.name === timeSlot.classes.name);
    setSelectedDay(timeSlot.day);
    setSelectedLesson(lessonObj?.id || null);
    setSelectedSubject(subjectObj?.id || null);
    setSelectedRoom(roomObj?.id || null);
    setSelectedTeacher(teacherObj?.id || null);
    setSelectedClass(classObj?.id || null);
    setIsDialogOpen(true);
};
    // Update the TimeSlotCard usage in the render:
    <TimeSlotCard
        availableSubjects={availableSubjects}
        availableTeachers={availableTeachers}
        availableRooms={availableRooms}
        key={`${days[0]}-${timeSlots?.[0]?.lessons?.lesson_number}`}
        timeSlot={timeSlots?.[0]}
        lessonNumber={timeSlots?.[0]?.lessons?.lesson_number || 0}
        onDelete={handleDeleteTimeSlot}
        onEdit={handleEditTimeSlot}
    />
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
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Time Slot
                        </Button>
                    </div>
                    
                    <div className="grid grid-cols-[min-content_repeat(5,1fr)] gap-2">
                        <div className="space-y-4 pt-12 pr-2 w-8">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={`lesson-${index + 1}`} className="h-24 flex items-center justify-center font-semibold text-sm">
                                    {index + 1}
                                </div>
                            ))}
                        </div>
                        {days.map((day) => (
                            <div key={day} className="space-y-4">
                                <h3 className="text-xl font-semibold text-center">{day}</h3>
                                <div className="space-y-4">
                                    {Array.from({ length: 8 }).map((_, index) => {
                                        const lessonNumber = index + 1;
                                        const timeSlot = lessons.find(
                                            (lesson) =>
                                                lesson.day === day &&
                                                lesson.lessons.lesson_number === lessonNumber
                                        );
                                        return (
                                            <TimeSlotCard
                                                availableSubjects={availableSubjects}
                                                availableTeachers={availableTeachers}
                                                availableRooms={availableRooms}
                                                key={`${day}-${lessonNumber}`}
                                                timeSlot={timeSlot}
                                                lessonNumber={lessonNumber}
                                                onDelete={handleDeleteTimeSlot}
                                                onEdit={handleEditTimeSlot}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Time Slot</DialogTitle>
                                <DialogDescription>
                                    Fill in the details for the new time slot.
                                </DialogDescription>
                            </DialogHeader>
                            {/* Add your form fields here */}
                            <DialogFooter>
                                <Button onClick={handleAddTimeSlot}>Add Time Slot</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    );
};

export default TimetableBuilder;
