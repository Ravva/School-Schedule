import { read, utils } from "xlsx";
import { supabase } from "../lib/supabase";

export interface ExcelLesson {
  Teacher: string;
  Weekday: string;
  "Lesson number": number;
  Class: string;
  Subgroup: string | null;
  Subject: string;
  Room: string;
}

const weekdayMap: { [key: string]: string } = {
  "Понедельник": "Monday",
  "Вторник": "Tuesday",
  "Среда": "Wednesday",
  "Четверг": "Thursday",
  "Пятница": "Friday",
};

interface Teacher {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  grade: number;
  literal: string;
}

export const parseExcelTimeTable = async (
  file: File,
  selectedClass: string,
  {
    teachers,
    rooms,
    classes,
  }: {
    teachers: Teacher[];
    rooms: Room[];
    classes: Class[];
  }
) => {
  try {
    const data = await file.arrayBuffer();
    const workbook = read(data);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = utils.sheet_to_json(sheet, { header: 1 });

    // Validate Excel structure
    const headerRow = rawData[0];
    const expectedHeaders = ['Teacher', 'Weekday', 'Lesson number', 'Class', 'Subgroup', 'Subject', 'Room'];
    const isValidStructure = expectedHeaders.every((header, index) => 
      headerRow[index]?.toString().toLowerCase().includes(header.toLowerCase())
    );

    if (!isValidStructure) {
      throw new Error('Invalid Excel structure. Please check the template format.');
    }

    const lessons: ExcelLesson[] = rawData
      .slice(1)
      .map((row: any) => {
        // Validate required fields
        if (!row[0] || !row[1] || !row[2] || !row[5]) {
          console.warn('Skipping invalid row:', row);
          return null;
        }

        return {
          Teacher: row[0],
          Weekday: row[1],
          "Lesson number": Number(row[2]),
          Class: row[3],
          Subgroup: row[4] || null,
          Subject: row[5],
          Room: row[6],
        };
      })
      .filter((lesson): lesson is ExcelLesson => 
        lesson !== null && 
        lesson.Teacher && 
        lesson.Weekday && 
        lesson["Lesson number"] > 0 &&
        lesson["Lesson number"] <= 8 // Assuming max 8 lessons per day
      );

    if (lessons.length === 0) {
      throw new Error('No valid lessons found in the Excel file');
    }
  // Clear existing time slots
  const { error: deleteError } = await supabase
    .from("time_slots")
    .delete()
    .eq("class_id", selectedClass);

  if (deleteError) throw deleteError;

  for (const lessonData of lessons) {
    try {
      const teacher = teachers[Number(lessonData.Teacher) - 1];
      const room = rooms.find((r) => r.name === lessonData.Room);
      const cls = classes.find(
        (c) => c.name === lessonData.Class?.split("(")[0]?.trim()
      );

      if (!teacher || !room || !cls) {
        console.error("Missing reference for:", lessonData);
        continue;
      }

      const timeSlotData = {
        day: weekdayMap[lessonData.Weekday] || lessonData.Weekday,
        lesson_id: String(lessonData["Lesson number"]),
        subject: lessonData.Subject,
        teacher_id: teacher.id,
        room_id: room.id,
        class_id: cls.id,
        subgroup: lessonData.Subgroup
          ? Number(lessonData.Subgroup.replace(/[^\d]/g, ""))
          : null,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("time_slots")
        .insert([timeSlotData]);

      if (error) throw error;
    } catch (error) {
      console.error("Error inserting time slot:", error);
      throw error;
    }
  }

  return lessons;
  } catch (error) {
    console.error("Error processing Excel file:", error);
    throw error;
  }
};