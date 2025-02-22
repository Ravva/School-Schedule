import React from 'react';
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
// ... existing imports and types ...

// Placeholder state definitions (replace with actual types and initial values)
const [teachers, setTeachers] = React.useState<any[]>([]);
const [subjects, setSubjects] = React.useState<any[]>([]);
const [classes, setClasses] = React.useState<any[]>([]);
const [rooms, setRooms] = React.useState<any[]>([]);
const [loading, setLoading] = React.useState(false);
const [newTeacher, setNewTeacher] = React.useState<any>(null); // Replace 'any' with the actual type
const [editingTeacher, setEditingTeacher] = React.useState<any>(null); // Replace 'any' with the actual type
const { toast } = useToast();

const fetchData = async () => {
  try {
    const [teachersData, subjectsData, classesData, roomsData, teacherRoomsData] =
      await Promise.all([
        supabase.from("teachers").select("*").order("name"),
        supabase.from("subjects").select("*").order("name"),
        supabase.from("classes").select("*").order("grade"),
        supabase.from("rooms").select("*"),
        supabase.from("teacher_rooms").select("teacher_id, room_id, rooms(*)"),
      ]);

    // ... error handling ...
    if (teachersData.error) throw teachersData.error;
    if (subjectsData.error) throw subjectsData.error;
    if (classesData.error) throw classesData.error;
    if (roomsData.error) throw roomsData.error;
    if (teacherRoomsData.error) throw teacherRoomsData.error;

    // Process teachers data to include their rooms from teacher_rooms
    const teachersWithRooms = teachersData.data.map(teacher => {
      const teacherRooms = teacherRoomsData.data
        .filter(tr => tr.teacher_id === teacher.id)
        .map(tr => tr.rooms)
        .filter((room): room is NonNullable<typeof room> => room !== null);

      return {
        ...teacher,
        rooms: teacherRooms.length > 0 ? teacherRooms : null
      };
    });

    setTeachers(teachersWithRooms);
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
    // First, insert the teacher
    const { data, error } = await supabase
      .from("teachers")
      .insert([
        {
          name: newTeacher.name,
          subjects: newTeacher.subjects,
          supervised_classes: newTeacher.supervised_classes,
          is_part_time: newTeacher.is_part_time,
          work_days: newTeacher.work_days,
        },
      ])
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error("No data returned");

    // Then, insert teacher-room relationships
    if (newTeacher.rooms.length > 0) {
      const { error: roomsError } = await supabase
        .from("teacher_rooms")
        .insert(
          newTeacher.rooms.map(room => ({
            teacher_id: data[0].id,
            room_id: room.id
          }))
        );

      if (roomsError) throw roomsError;
    }

    // ... rest of the success handling ...
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
    // Update teacher's basic information
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

    // Delete existing room assignments
    const { error: deleteError } = await supabase
      .from("teacher_rooms")
      .delete()
      .eq("teacher_id", editingTeacher.id);

    if (deleteError) throw deleteError;

    // Insert new room assignments
    if (editingTeacher.rooms && editingTeacher.rooms.length > 0) {
      const { error: insertError } = await supabase
        .from("teacher_rooms")
        .insert(
          editingTeacher.rooms.map(room => ({
            teacher_id: editingTeacher.id,
            room_id: room.id
          }))
        );

      if (insertError) throw insertError;
    }

    // ... rest of success handling ...
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
    // Delete teacher-room relationships first
    const { error: roomsError } = await supabase
      .from("teacher_rooms")
      .delete()
      .eq("teacher_id", id);

    if (roomsError) throw roomsError;

    // Then delete the teacher
    const { error } = await supabase
      .from("teachers")
      .delete()
      .eq("id", id);

    if (error) throw error;
    
    fetchData();
  } catch (error) {
    console.error("Error deleting teacher:", error);
    toast({
      title: "Error",
      description: "Failed to delete teacher.",
      variant: "destructive",
    });
  }
};

// ... rest of the component remains the same ...
