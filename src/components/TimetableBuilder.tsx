import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useToast } from "./ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

interface TimeSlot {
  day: string;
  lesson_id: string;
  subject: string; // Changed from subject_id to subject
  teacher_id: string;
  room_id: string;
  class_id: string;
}

interface AcademicPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

interface Class {
  id: string;
  name: string;
  grade: number;
  literal: string;
}

interface Lesson {
  id: string;
  lesson_number: number;
  start_time: string;
  end_time: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
}

const TimetableBuilder = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [isAddPeriodOpen, setIsAddPeriodOpen] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<{
    [key: string]: string;
  }>({});
  const [selectedTeachers, setSelectedTeachers] = useState<{
    [key: string]: string;
  }>({});
  const [selectedRooms, setSelectedRooms] = useState<{ [key: string]: string }>(
    {},
  );
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchAcademicPeriods = async () => {
      const { data, error } = await supabase
        .from("academic_periods")
        .select("*");

      if (error) {
        console.error("Error fetching academic periods:", error);
      } else {
        setAcademicPeriods(data || []);
        if (data?.length) {
          setSelectedPeriod(data[0].id);
        }
      }
      setLoading(false);
    };

    const fetchClasses = async () => {
      const { data, error } = await supabase.from("classes").select("*");

      if (error) {
        console.error("Error fetching classes:", error);
      } else {
        setClasses(data || []);
      }
    };

    const fetchLessons = async () => {
      const { data, error } = await supabase.from("lessons").select("*");

      if (error) {
        console.error("Error fetching lessons:", error);
      } else {
        setLessons(data || []);
      }
    };

    const fetchSubjects = async () => {
      const { data, error } = await supabase.from("subjects").select("*");

      if (error) {
        console.error("Error fetching subjects:", error);
      } else {
        setSubjects(data || []);
      }
    };

    const fetchTeachers = async () => {
      const { data, error } = await supabase.from("teachers").select("*");

      if (error) {
        console.error("Error fetching teachers:", error);
      } else {
        setTeachers(data || []);
      }
    };

    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, room_number");

      if (error) {
        console.error("Error fetching rooms:", error);
      } else {
        // Map the fetched data to match the Room interface
        const formattedRooms =
          data?.map((room) => ({
            id: room.id,
            name: room.room_number, // Assuming room_number is the name of the room
          })) || [];
        setRooms(formattedRooms);
      }
    };

    const fetchTimeSlots = async () => {
      const { data, error } = await supabase.from("time_slots").select("*");
      if (error) {
        console.error("Error fetching time slots:", error);
      } else {
        // Correctly map the fetched data to TimeSlot interface
        const formattedTimeSlots =
          data?.map((ts) => ({
            day: ts.day,
            lesson_id: ts.lesson_id,
            subject: ts.subject, // Using 'subject' to match the TimeSlot interface
            teacher_id: ts.teacher_id,
            room_id: ts.room_id,
            class_id: ts.class_id,
          })) || [];
        setTimeSlots(formattedTimeSlots);
      }
    };

    fetchAcademicPeriods();
    fetchClasses();
    fetchLessons();
    fetchSubjects();
    fetchTeachers();
    fetchRooms();
    fetchTimeSlots();
  }, [toast]);

  const generateSchedule = async () => {
    try {
      setIsGenerating(true);

      // First get syllabus data for the class
      const { data: syllabusData, error: syllabusError } = await supabase
        .from("syllabus")
        .select("*, subjects(*), teachers(*)")
        .eq("class_id", selectedClass);

      if (syllabusError) throw syllabusError;

      // Get subject-teacher assignments as fallback
      const { data: subjectTeachers, error: stError } = await supabase
        .from("subject_teachers")
        .select("*, subjects(*), teachers(*)")
        .eq("class_id", selectedClass);

      if (stError) throw stError;

      if (
        !syllabusData?.length &&
        (!subjectTeachers || !subjectTeachers.length)
      ) {
        throw new Error(
          "No teacher assignments found for this class. Please set up the syllabus first.",
        );
      }

      // Clear existing schedule
      const { error: deleteError } = await supabase
        .from("time_slots")
        .delete()
        .eq("class_id", selectedClass);

      if (deleteError) throw deleteError;

      const newTimeSlots: TimeSlot[] = [];

      // Create a map to track how many hours have been assigned for each subject
      const subjectHoursAssigned = new Map<string, number>();

      // Initialize the map with syllabus data
      syllabusData?.forEach((syllabus) => {
        subjectHoursAssigned.set(syllabus.subject_id, 0);
      });

      // Create a list of available slots
      const availableSlots = [];
      for (const day of WEEKDAYS) {
        for (const lesson of lessons) {
          availableSlots.push({ day, lesson });
        }
      }

      // Shuffle available slots for random distribution
      availableSlots.sort(() => Math.random() - 0.5);

      // Process each syllabus entry
      for (const syllabus of syllabusData || []) {
        const hoursNeeded = syllabus.amount_of_academic_hours_per_week || 0;
        const currentHours = subjectHoursAssigned.get(syllabus.subject_id) || 0;

        if (currentHours >= hoursNeeded) continue;

        // Find available slots for this subject
        for (const slot of availableSlots) {
          if (currentHours >= hoursNeeded) break;

          // Check if this slot is already used
          const isSlotUsed = newTimeSlots.some(
            (ts) => ts.day === slot.day && ts.lesson_id === slot.lesson.id,
          );

          if (isSlotUsed) continue;

          // Check if teacher is available in this slot
          const isTeacherBusy = newTimeSlots.some(
            (ts) =>
              ts.day === slot.day &&
              ts.lesson_id === slot.lesson.id &&
              ts.teacher_id === syllabus.teacher_id,
          );
          if (isTeacherBusy) continue;

          // Get available rooms
          const usedRoomIds = newTimeSlots
            .filter(
              (ts) => ts.day === slot.day && ts.lesson_id === slot.lesson.id,
            )
            .map((ts) => ts.room_id);

          // Get available rooms - handle empty usedRoomIds case
          const roomsQuery = supabase.from("rooms").select("*");

          // Only add the not-in condition if there are used room IDs
          const { data: availableRooms, error: rError } =
            await (usedRoomIds.length > 0
              ? roomsQuery.not("id", "in", usedRoomIds)
              : roomsQuery);

          if (rError) throw rError;
          if (!availableRooms?.length) continue;

          const randomRoom =
            availableRooms[Math.floor(Math.random() * availableRooms.length)];

          // Get the subject name
          const subjectName = subjects.find(
            (s) => s.id === syllabus.subject_id,
          )?.name;
          if (!subjectName) continue;

          // Add the time slot
          newTimeSlots.push({
            day: slot.day,
            lesson_id: slot.lesson.id,
            subject: subjectName,
            teacher_id: syllabus.teacher_id,
            room_id: randomRoom.id,
            class_id: selectedClass,
          });

          // Update assigned hours
          subjectHoursAssigned.set(
            syllabus.subject_id,
            (subjectHoursAssigned.get(syllabus.subject_id) || 0) + 1,
          );
        }
      }

      // Insert time slots one by one to better handle conflicts
      for (const slot of newTimeSlots) {
        const { error: insertError } = await supabase
          .from("time_slots")
          .insert({
            day: slot.day,
            lesson_id: slot.lesson_id,
            subject: slot.subject,
            teacher_id: slot.teacher_id,
            room_id: slot.room_id,
            class_id: slot.class_id,
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error("Error inserting time slot:", insertError);
          throw insertError;
        }
      }

      // Fetch updated time slots
      const { data: updatedTimeSlots, error: fetchError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("class_id", selectedClass);

      if (fetchError) throw fetchError;

      // Update state with formatted time slots
      const formattedTimeSlots =
        updatedTimeSlots?.map((ts) => ({
          day: ts.day,
          lesson_id: ts.lesson_id,
          subject: ts.subject,
          teacher_id: ts.teacher_id,
          room_id: ts.room_id,
          class_id: ts.class_id,
        })) || [];

      setTimeSlots(formattedTimeSlots);

      toast({
        title: "Success",
        description: "Schedule generated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error generating schedule",
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 bg-slate-100 rounded-lg shadow-lg">
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Timetable Builder
              </h2>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {academicPeriods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={generateSchedule}
                disabled={!selectedPeriod || !selectedClass || isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate Schedule"}
              </Button>
              <Dialog open={isAddPeriodOpen} onOpenChange={setIsAddPeriodOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Period
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Academic Period</DialogTitle>
                    <DialogDescription>
                      Create a new academic period for timetable planning.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Period Name</Label>
                      <Input
                        id="name"
                        value={newPeriod.name}
                        onChange={(e) =>
                          setNewPeriod({ ...newPeriod, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={newPeriod.start_date}
                        onChange={(e) =>
                          setNewPeriod({
                            ...newPeriod,
                            start_date: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={newPeriod.end_date}
                        onChange={(e) =>
                          setNewPeriod({
                            ...newPeriod,
                            end_date: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from("academic_periods")
                            .insert([
                              {
                                name: newPeriod.name,
                                start_date: newPeriod.start_date,
                                end_date: newPeriod.end_date,
                              },
                            ]);
                          if (error) throw error;
                          // Refetch academic periods
                          const { data } = await supabase
                            .from("academic_periods")
                            .select("*");
                          setAcademicPeriods(data || []);

                          setIsAddPeriodOpen(false);
                          setNewPeriod({
                            name: "",
                            start_date: "",
                            end_date: "",
                          });

                          toast({
                            title: "Success",
                            description: "Academic period added successfully",
                          });
                        } catch (error: any) {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: error.message,
                          });
                        }
                      }}
                    >
                      Add Period
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {selectedPeriod && (
            <Tabs
              value={selectedClass}
              onValueChange={setSelectedClass}
              className="mt-6"
            >
              <TabsList className="w-full justify-start h-auto flex-wrap gap-2 bg-transparent">
                {classes.map((cls) => (
                  <TabsTrigger
                    key={cls.id}
                    value={cls.id}
                    className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                  >
                    {cls.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {classes.map((cls) => (
                <TabsContent key={cls.id} value={cls.id}>
                  <div className="p-4 mt-4 bg-white rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">
                      Timetable for {cls.name}
                    </h3>
                    <div className="space-y-6">
                      {WEEKDAYS.map((day) => (
                        <div key={day} className="border rounded-lg">
                          <h4 className="text-md font-medium p-4 bg-slate-50 border-b">
                            {day}
                          </h4>
                          <div className="p-4">
                            <table className="w-full">
                              <thead>
                                <tr className="text-left border-b">
                                  <th className="pb-2 font-medium">№</th>
                                  <th className="pb-2 font-medium">Time</th>
                                  <th className="pb-2 font-medium">Subject</th>
                                  <th className="pb-2 font-medium">Teacher</th>
                                  <th className="pb-2 font-medium">Room</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lessons
                                  .sort(
                                    (a, b) => a.lesson_number - b.lesson_number,
                                  )
                                  .map((lesson) => {
                                    const timeSlot = timeSlots.find(
                                      (ts) =>
                                        ts.lesson_id === lesson.id &&
                                        ts.day === day &&
                                        ts.class_id === cls.id,
                                    );
                                    return (
                                      <tr
                                        key={`${day}-${lesson.id}`}
                                        className="border-b last:border-0"
                                      >
                                        <td className="py-3">
                                          {lesson.lesson_number}
                                        </td>
                                        <td className="py-3">
                                          {lesson.start_time.slice(0, 5)}-
                                          {lesson.end_time.slice(0, 5)}
                                        </td>
                                        <td className="py-3">
                                          {timeSlot
                                            ? subjects.find(
                                                (s) =>
                                                  s.id === timeSlot.subject,
                                              )?.name
                                            : "-"}
                                        </td>
                                        <td className="py-3">
                                          {timeSlot
                                            ? teachers.find(
                                                (t) =>
                                                  t.id === timeSlot.teacher_id,
                                              )?.name
                                            : "-"}
                                        </td>
                                        <td className="py-3">
                                          {timeSlot
                                            ? rooms.find(
                                                (r) =>
                                                  r.id === timeSlot.room_id,
                                              )?.name
                                            : "-"}
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </>
      )}
    </div>
  );
};

export default TimetableBuilder;
