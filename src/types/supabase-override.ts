export interface Room {
  id: string;
  room_number: string;
  teacher_name: string | null;
  subject_name: string | null;
  class: string | null;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  rooms?: Room[];
}

export interface Class {
  id: string;
  name: string;
}
