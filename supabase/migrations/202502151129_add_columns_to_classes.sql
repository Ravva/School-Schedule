ALTER TABLE classes
ADD COLUMN literal text NULL,
ADD COLUMN supervisor_teacher_id uuid NULL,
ADD COLUMN room_id uuid NULL;

ALTER TABLE classes
ADD CONSTRAINT classes_supervisor_teacher_id_fkey FOREIGN KEY (supervisor_teacher_id) REFERENCES teachers(id);

ALTER TABLE classes
ADD CONSTRAINT classes_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id);
