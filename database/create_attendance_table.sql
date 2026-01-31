-- Create attendance table in Supabase
-- This replaces Google Sheets for attendance tracking

CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Teacher Info
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    teacher_name TEXT NOT NULL,
    
    -- Class Info
    schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    class_name TEXT NOT NULL,
    program TEXT NOT NULL,
    level TEXT NOT NULL,
    phase TEXT NOT NULL,
    
    -- Schedule Info
    day TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    
    -- Student Info
    student_id TEXT NOT NULL, -- EYSA ID format
    student_name TEXT NOT NULL,
    
    -- Attendance Status
    status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent')),
    
    -- Metadata
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_id ON attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_week_year ON attendance(week_number, year);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at DESC);

-- Enable Row Level Security
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read attendance (for reports)
CREATE POLICY "Anyone can read attendance"
    ON attendance FOR SELECT
    USING (true);

-- Policy: Teachers can insert their own attendance records
CREATE POLICY "Teachers can insert attendance"
    ON attendance FOR INSERT
    WITH CHECK (true);

-- Policy: Teachers can update their own attendance records
CREATE POLICY "Teachers can update their attendance"
    ON attendance FOR UPDATE
    USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_updated_at();

-- Add comment
COMMENT ON TABLE attendance IS 'Stores student attendance records marked by teachers';
