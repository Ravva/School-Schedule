-- Создание enum для дней недели
CREATE TYPE day_of_week AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday');

-- Функция проверки доступности слота
CREATE OR REPLACE FUNCTION check_slot_availability(
    p_day text,
    p_lesson_number integer,
    p_teacher_id uuid,
    p_class_id uuid,
    p_room_id uuid
) RETURNS boolean AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM time_slots
        WHERE day = p_day 
        AND lesson_id = (SELECT id FROM lessons WHERE lesson_number = p_lesson_number)
        AND (teacher_id = p_teacher_id OR class_id = p_class_id OR room_id = p_room_id)
    );
END;
$$ LANGUAGE plpgsql;

-- Функция проверки доступности слота для подгрупп
CREATE OR REPLACE FUNCTION check_subgroup_slot_availability(
    p_day text,
    p_lesson_number integer,
    p_teacher_ids uuid[],
    p_class_id uuid,
    p_room_ids uuid[]
) RETURNS boolean AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM time_slots
        WHERE day = p_day 
        AND lesson_id = (SELECT id FROM lessons WHERE lesson_number = p_lesson_number)
        AND (
            teacher_id = ANY(p_teacher_ids)
            OR room_id = ANY(p_room_ids)
            OR (class_id = p_class_id AND subject IN (
                SELECT name FROM subjects WHERE is_subgroup = true
            ))
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Функция проверки равномерности распределения
CREATE OR REPLACE FUNCTION check_distribution_balance(
    p_class_id uuid,
    p_subject_id uuid,
    p_day text,
    p_target_hours integer
) RETURNS boolean AS $$
DECLARE
    current_day_count integer;
    total_week_count integer;
BEGIN
    SELECT COUNT(*)
    INTO current_day_count
    FROM time_slots ts
    WHERE ts.class_id = p_class_id 
    AND ts.subject = (SELECT name FROM subjects WHERE id = p_subject_id)
    AND ts.day = p_day;

    SELECT COUNT(*)
    INTO total_week_count
    FROM time_slots ts
    WHERE ts.class_id = p_class_id 
    AND ts.subject = (SELECT name FROM subjects WHERE id = p_subject_id);

    RETURN current_day_count <= CEIL(p_target_hours::float / 5)
    AND total_week_count < p_target_hours;
END;
$$ LANGUAGE plpgsql;

-- Основная процедура генерации расписания
CREATE OR REPLACE PROCEDURE generate_schedule() AS $$
BEGIN
    -- Очистка существующего расписания
    DELETE FROM time_slots;

    -- 1. Part-time учителя
    WITH part_time_lessons AS (
        SELECT 
            s.class_id,
            s.subject_id,
            s.teacher_id,
            t.work_days,
            s.amount_of_academic_hours_per_week,
            sub.name as subject_name
        FROM syllabus s
        JOIN teachers t ON s.teacher_id = t.id
        JOIN subjects sub ON s.subject_id = sub.id
        WHERE t.is_part_time = true
        ORDER BY s.amount_of_academic_hours_per_week DESC
    )
    INSERT INTO time_slots (day, lesson_id, subject, room_id, teacher_id, class_id)
    SELECT 
        d.day,
        l.id,
        ptl.subject_name,
        r.id,
        ptl.teacher_id,
        ptl.class_id
    FROM part_time_lessons ptl
    CROSS JOIN UNNEST(ptl.work_days) as d(day)
    CROSS JOIN lessons l
    JOIN rooms r ON r.subject_id = ptl.subject_id
    WHERE check_slot_availability(d.day, l.lesson_number, ptl.teacher_id, ptl.class_id, r.id)
    AND check_distribution_balance(ptl.class_id, ptl.subject_id, d.day, ptl.amount_of_academic_hours_per_week);

    -- 2. Предметы с подгруппами
    WITH subgroup_lessons AS (
        SELECT 
            s.class_id,
            s.subject_id,
            ARRAY_AGG(s.teacher_id) as teacher_ids,
            s.amount_of_academic_hours_per_week,
            sub.name as subject_name
        FROM syllabus s
        JOIN subjects sub ON s.subject_id = sub.id
        WHERE sub.is_subgroup = true
        GROUP BY s.class_id, s.subject_id, s.amount_of_academic_hours_per_week, sub.name
        HAVING COUNT(DISTINCT s.teacher_id) = 2
    )
    INSERT INTO time_slots (day, lesson_id, subject, room_id, teacher_id, class_id)
    SELECT 
        d.day,
        l.id,
        sl.subject_name,
        r.id,
        unnest(sl.teacher_ids),
        sl.class_id
    FROM subgroup_lessons sl
    CROSS JOIN generate_series(1, 5) as d(day)
    CROSS JOIN lessons l
    JOIN rooms r ON r.subject_id = sl.subject_id
    WHERE check_subgroup_slot_availability(d.day, l.lesson_number, sl.teacher_ids, sl.class_id, ARRAY[r.id])
    AND check_distribution_balance(sl.class_id, sl.subject_id, d.day, sl.amount_of_academic_hours_per_week);

    -- 3. Обычные предметы
    WITH regular_lessons AS (
        SELECT 
            s.class_id,
            s.subject_id,
            s.teacher_id,
            s.amount_of_academic_hours_per_week,
            sub.name as subject_name
        FROM syllabus s
        JOIN subjects sub ON s.subject_id = sub.id
        WHERE sub.is_subgroup = false 
        AND sub.is_extracurricular = false
    )
    INSERT INTO time_slots (day, lesson_id, subject, room_id, teacher_id, class_id)
    SELECT 
        d.day,
        l.id,
        rl.subject_name,
        r.id,
        rl.teacher_id,
        rl.class_id
    FROM regular_lessons rl
    CROSS JOIN generate_series(1, 5) as d(day)
    CROSS JOIN lessons l
    JOIN rooms r ON r.subject_id = rl.subject_id
    WHERE check_slot_availability(d.day, l.lesson_number, rl.teacher_id, rl.class_id, r.id)
    AND check_distribution_balance(rl.class_id, rl.subject_id, d.day, rl.amount_of_academic_hours_per_week);

END;
$$ LANGUAGE plpgsql;