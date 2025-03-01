import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Определяем базовые интерфейсы
interface Subject {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  rooms?: Room[]; // Add optional rooms array to Teacher interface
}

interface Room {
  id: string;
  name: string;
}

// Определяем интерфейс TimeSlot
interface TimeSlot {
  id: string;
  day: string;
  lesson_id: string;
  subject: string;
  teacher_id: string;
  room_id: string;
  class_id: string;
  subgroup?: number | null;
  academic_period_id: string;
  created_at?: string;
}

// Определяем тип EditingTimeSlot
interface EditingTimeSlot {
  isSubgroups: boolean;
  slots: TimeSlot[];
  lessonNumber: number;
  day: string;
}

interface TimeSlotFormProps {
  timeSlot: EditingTimeSlot;
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  onSubmit: (updatedData: any) => void;
  onCancel: () => void;
  selectedPeriod: string;
  selectedClass: string;
}

export const TimeSlotForm: React.FC<TimeSlotFormProps> = ({
  timeSlot,
  subjects,
  teachers,
  rooms,
  onSubmit,
  onCancel,
  selectedPeriod,
  selectedClass
}) => {
  const [formData, setFormData] = useState<EditingTimeSlot>(timeSlot);

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSubmit(formData);
  };

  const SubgroupForm = ({ subgroup }: { subgroup: number | null }) => {
    const slot = formData?.slots.find(s => s.subgroup === subgroup) || formData?.slots[0];
    
    if (!slot) return null;

    // Get filtered teachers based on selected subject
    const availableTeachers = teachers.filter(teacher => 
      teacher.subjects?.includes(slot.subject || '')
    );

    // Get filtered rooms based on selected teacher
    const availableRooms = useMemo(() => {
      const selectedTeacher = teachers.find(t => t.id === slot.teacher_id);
      
      if (!selectedTeacher || !slot.teacher_id) {
        return rooms; // Return all rooms if no teacher selected
      }

      // If teacher has assigned rooms, filter by them
      if (selectedTeacher.rooms && selectedTeacher.rooms.length > 0) {
        const teacherRoomIds = selectedTeacher.rooms.map(room => room.id);
        return rooms.filter(room => teacherRoomIds.includes(room.id));
      }

      return rooms; // Return all rooms if teacher has no specific room assignments
    }, [slot.teacher_id, teachers, rooms]);

    return (
      <div className="space-y-4">
        <div>
          <Label>Subject</Label>
          <Select
            value={slot.subject || ''}
            onValueChange={(value) => {
              updateSlotData(subgroup, "subject", value);
              // Clear teacher selection when subject changes
              updateSlotData(subgroup, "teacher_id", '');
              // Clear room selection when subject changes
              updateSlotData(subgroup, "room_id", '');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.name}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Teacher</Label>
          <Select
            value={slot.teacher_id}
            onValueChange={(value) => {
              updateSlotData(subgroup, "teacher_id", value);
              // Clear room selection when teacher changes
              updateSlotData(subgroup, "room_id", '');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select teacher" />
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

        <div>
          <Label>Room</Label>
          <Select
            value={slot.room_id || ''}
            onValueChange={(value) => updateSlotData(subgroup, "room_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select room" />
            </SelectTrigger>
            <SelectContent>
              {availableRooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const updateSlotData = (subgroup: number | null, field: string, value: string) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        slots: prev.slots.map(slot => {
          if (slot.subgroup === subgroup || (!subgroup && !slot.subgroup)) {
            return { ...slot, [field]: value };
          }
          return slot;
        })
      };
    });
  };

  if (!formData) return null;

  return (
    <div className="space-y-4">
      {formData.isSubgroups ? (
        <Tabs defaultValue="1">
          <TabsList>
            <TabsTrigger value="1">Subgroup 1</TabsTrigger>
            <TabsTrigger value="2">Subgroup 2</TabsTrigger>
          </TabsList>
          <TabsContent value="1">
            <SubgroupForm subgroup={1} />
          </TabsContent>
          <TabsContent value="2">
            <SubgroupForm subgroup={2} />
          </TabsContent>
        </Tabs>
      ) : (
        <SubgroupForm subgroup={null} />
      )}

      <div className="flex justify-end space-x-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};
