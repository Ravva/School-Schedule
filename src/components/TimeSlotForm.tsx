import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Teacher, Room, Subject } from "@/types/supabase-override";

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

    const cleanedFormData = {
      ...formData,
      slots: formData.slots.map(slot => ({
        ...slot,
        teacher_id: slot.teacher_id || '',  // Изменено с null на ''
        room_id: slot.room_id || '',        // Изменено с null на ''
        subject: slot.subject || ''         // Изменено с null на ''
      })).filter(slot => 
        // Фильтруем слоты с пустыми значениями
        slot.day && 
        slot.lesson_id && 
        slot.subject && 
        slot.teacher_id && 
        slot.room_id
      )
    };

    // Проверяем, что после фильтрации остался хотя бы один слот
    if (cleanedFormData.slots.length === 0) {
      console.error('Invalid form data - no valid slots', cleanedFormData);
      return;
    }

    onSubmit(cleanedFormData);
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
              // Clear teacher and room selections when subject changes
              updateSlotData(subgroup, "teacher_id", null);
              updateSlotData(subgroup, "room_id", null);
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
            value={slot.teacher_id || ''}
            onValueChange={(value) => {
              updateSlotData(subgroup, "teacher_id", value || null);
              updateSlotData(subgroup, "room_id", null);
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
            onValueChange={(value) => updateSlotData(subgroup, "room_id", value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select room" />
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
      </div>
    );
  };

  // Add toggle for subgroups
  const toggleSubgroups = () => {
    setFormData(prev => {
      if (!prev) return prev;

      if (prev.isSubgroups) {
        // Converting from subgroups to single group
        return {
          ...prev,
          isSubgroups: false,
          slots: [{
            ...prev.slots[0],
            id: prev.slots[0].id,
            subgroup: null,
            day: prev.slots[0].day,
            lesson_id: prev.slots[0].lesson_id,
            subject: prev.slots[0].subject,
            teacher_id: prev.slots[0].teacher_id,
            room_id: prev.slots[0].room_id,
            class_id: prev.slots[0].class_id,
            academic_period_id: prev.slots[0].academic_period_id
          }]
        };
      } else {
        // Converting from single to subgroups
        // Копируем значения из первой подгруппы, но оставляем вторую пустой
        return {
          ...prev,
          isSubgroups: true,
          slots: [
            { ...prev.slots[0], subgroup: 1 },
            { 
              ...prev.slots[0], 
              subgroup: 2,
              // Оставляем поля пустыми для второй подгруппы
              subject: null,
              teacher_id: null,
              room_id: null 
            }
          ]
        };
      }
    });
  };

  const updateSlotData = (subgroup: number | null, field: string, value: string | null) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        slots: prev.slots.map(slot => {
          if (slot.subgroup === subgroup || (!subgroup && !slot.subgroup)) {
            // Если значение пустое, установим null для полей teacher_id и room_id
            const finalValue = (field === 'teacher_id' || field === 'room_id') && !value ? null : value;
            return { ...slot, [field]: finalValue };
          }
          return slot;
        })
      };
    });
  };

  const handleClear = () => {
    // Очищаем все поля, сохраняя только day и lesson_id
    const clearedSlots = formData.slots.map(slot => ({
      ...slot,
      id: slot.id,
      day: slot.day,
      lesson_id: slot.lesson_id,
      subject: '',
      teacher_id: null, // Изменено с '' на null
      room_id: null,    // Изменено с '' на null
    }));

    setFormData(prev => ({
      ...prev,
      slots: clearedSlots,
      isSubgroups: false
    }));
  };

  if (!formData) return null;

  return (
    <div className="space-y-4">
      {/* Add subgroups toggle at the top */}
      <div className="flex items-center space-x-2">
        <Switch
          id="is_subgroups"
          checked={formData.isSubgroups}
          onCheckedChange={toggleSubgroups}
        />
        <Label htmlFor="is_subgroups">Split into subgroups</Label>
      </div>

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

      <div className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={handleClear}
          type="button"
        >
          Clear
        </Button>
        <Button 
          variant="outline" 
          onClick={onCancel}
          type="button"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          type="submit"
        >
          Save
        </Button>
      </div>
    </div>
  );
};
