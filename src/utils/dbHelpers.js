import { supabase } from '../supabaseClient'

// ========================================
// USER FUNCTIONS
// ========================================

/**
 * Get user by student_id
 */
export const getUserByStudentId = async (studentId) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('student_id', studentId)
        .single()

    if (error) throw error
    return data
}

/**
 * Create new student
 */
export const createStudent = async (studentData) => {
    const { data, error } = await supabase
        .from('users')
        .insert([studentData])
        .select()
        .single()

    if (error) throw error
    return data
}

// ========================================
// TEACHER FUNCTIONS
// ========================================

/**
 * Get all active teachers
 */
export const getTeachers = async () => {
    console.log('📡 dbHelpers: getTeachers called');
    const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('is_active', true)
        .order('name')

    if (error) {
        console.error('❌ dbHelpers: getTeachers error:', error);
        throw error;
    }
    console.log('✅ dbHelpers: getTeachers success:', data);
    return data
}

/**
 * Get all teachers (including inactive) - Admin only
 */
export const getAllTeachers = async () => {
    console.log('📡 dbHelpers: getAllTeachers called');
    const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('name')

    if (error) {
        console.error('❌ dbHelpers: getAllTeachers error:', error);
        throw error;
    }
    console.log('✅ dbHelpers: getAllTeachers success:', data);
    return data || []
}

/**
 * Generate Teacher ID
 * Format: TCHR0001, TCHR0002, etc.
 */
export const generateTeacherId = async () => {
    console.log('🆔 dbHelpers: Generating teacher ID');

    // Get last teacher ID
    const { data, error } = await supabase
        .from('teachers')
        .select('teacher_id')
        .not('teacher_id', 'is', null)
        .order('teacher_id', { ascending: false })
        .limit(1)

    if (error) {
        console.error('❌ dbHelpers: Error getting last teacher ID:', error);
        // If error, start from TCHR0001
        return 'TCHR0001';
    }

    let sequence = 1;

    if (data && data.length > 0 && data[0].teacher_id) {
        // Extract sequence from last ID (TCHR0001 -> 1)
        const lastId = data[0].teacher_id;
        const lastSeq = parseInt(lastId.replace('TCHR', ''));
        sequence = lastSeq + 1;
    }

    const teacherId = `TCHR${sequence.toString().padStart(4, '0')}`;
    console.log('✅ dbHelpers: Generated teacher ID:', teacherId);
    return teacherId;
}

/**
 * Create new teacher
 */
export const createTeacher = async (teacherData) => {
    console.log('📡 dbHelpers: createTeacher called with:', teacherData);

    // Generate teacher_id if not provided
    if (!teacherData.teacher_id) {
        teacherData.teacher_id = await generateTeacherId();
    }

    const { data, error } = await supabase
        .from('teachers')
        .insert([teacherData])
        .select()
        .single()

    if (error) {
        console.error('❌ dbHelpers: createTeacher error:', error);
        throw error;
    }
    console.log('✅ dbHelpers: createTeacher success:', data);
    return data
}

/**
 * Update teacher
 */
export const updateTeacher = async (teacherId, teacherData) => {
    console.log('📡 dbHelpers: updateTeacher called', { teacherId, teacherData });
    const { data, error } = await supabase
        .from('teachers')
        .update(teacherData)
        .eq('id', teacherId)
        .select()
        .single()

    if (error) {
        console.error('❌ dbHelpers: updateTeacher error:', error);
        throw error;
    }
    console.log('✅ dbHelpers: updateTeacher success:', data);
    return data
}

/**
 * Delete teacher (soft delete - set is_active to false)
 */
export const deleteTeacher = async (teacherId) => {
    console.log('📡 dbHelpers: deleteTeacher called for:', teacherId);
    const { data, error } = await supabase
        .from('teachers')
        .update({ is_active: false })
        .eq('id', teacherId)
        .select()
        .single()

    if (error) {
        console.error('❌ dbHelpers: deleteTeacher error:', error);
        throw error;
    }
    console.log('✅ dbHelpers: deleteTeacher success:', data);
    return data
}

/**
 * Restore teacher (set is_active to true)
 */
export const restoreTeacher = async (teacherId) => {
    console.log('📡 dbHelpers: restoreTeacher called for:', teacherId);
    const { data, error } = await supabase
        .from('teachers')
        .update({ is_active: true })
        .eq('id', teacherId)
        .select()
        .single()

    if (error) {
        console.error('❌ dbHelpers: restoreTeacher error:', error);
        throw error;
    }
    console.log('✅ dbHelpers: restoreTeacher success:', data);
    return data
}

/**
 * Permanently delete teacher from database
 */
export const permanentDeleteTeacher = async (teacherId) => {
    console.log('📡 dbHelpers: permanentDeleteTeacher called for:', teacherId);
    const { data, error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacherId)
        .select()
        .single()

    if (error) {
        console.error('❌ dbHelpers: permanentDeleteTeacher error:', error);
        throw error;
    }
    console.log('✅ dbHelpers: permanentDeleteTeacher success:', data);
    return data
}

/**
 * Assign teacher to schedule
 */
export const assignTeacherToSchedule = async (scheduleId, teacherId) => {
    console.log('📡 dbHelpers: assignTeacherToSchedule called', { scheduleId, teacherId });
    const { data, error } = await supabase
        .from('schedules')
        .update({ teacher_id: teacherId })
        .eq('id', scheduleId)
        .select()
        .single()

    if (error) {
        console.error('❌ dbHelpers: assignTeacherToSchedule error:', error);
        throw error;
    }
    console.log('✅ dbHelpers: assignTeacherToSchedule success:', data);
    return data
}

// ========================================
// CLASS FUNCTIONS
// ========================================

/**
 * Get all active classes
 */
export const getClasses = async () => {
    console.log('📡 dbHelpers: getClasses called');
    const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('is_active', true)
        .order('name')

    if (error) {
        console.error('❌ dbHelpers: getClasses error:', error);
        throw error;
    }
    console.log('✅ dbHelpers: getClasses success:', data);
    return data
}

// ========================================
// SCHEDULE FUNCTIONS
// ========================================

/**
 * Get or create schedule
 */
export const getOrCreateSchedule = async (scheduleData) => {
    console.log('📡 dbHelpers: getOrCreateSchedule called with:', scheduleData);

    const { class_id, program, level, phase, day, time_slot, week_number, year, batch } = scheduleData

    // Check if schedule already exists
    let query = supabase
        .from('schedules')
        .select('*')
        .eq('class_id', class_id)
        .eq('program', program)
        .eq('level', level)
        .eq('phase', phase)
        .eq('time_slot', time_slot)
        .eq('week_number', week_number)
        .eq('year', year)

    // Add day filter if provided
    if (day) {
        query = query.eq('day', day)
    }

    // Add batch filter if provided
    if (batch) {
        query = query.eq('batch', batch)
    }

    let { data, error } = await query.maybeSingle()

    // Jika belum ada, buat baru
    if (!data) {
        console.log('📝 Creating new schedule...');
        const { data: newData, error: createError } = await supabase
            .from('schedules')
            .insert([scheduleData])
            .select()
            .single()

        if (createError) {
            console.error('❌ Error creating schedule:', createError);
            throw createError;
        }
        console.log('✅ Schedule created:', newData);
        return newData
    }

    if (error) {
        console.error('❌ Error fetching schedule:', error);
        throw error;
    }

    console.log('✅ Schedule found:', data);
    return data
}

/**
 * Get schedules by filters
 */
export const getSchedules = async (filters = {}) => {
    console.log('📡 dbHelpers: getSchedules called with filters:', filters);

    let query = supabase
        .from('schedules')
        .select(`
      *,
      class:classes(*),
      teacher:teachers(*)
    `)

    if (filters.program) query = query.eq('program', filters.program)
    if (filters.level) query = query.eq('level', filters.level)
    if (filters.phase) query = query.eq('phase', filters.phase)
    if (filters.day) query = query.eq('day', filters.day)
    if (filters.time_slot) query = query.eq('time_slot', filters.time_slot)
    if (filters.week_number) query = query.eq('week_number', filters.week_number)
    if (filters.year) query = query.eq('year', filters.year)
    if (filters.batch) query = query.eq('batch', filters.batch)
    if (filters.teacher_id) query = query.eq('teacher_id', filters.teacher_id)

    const { data, error } = await query

    if (error) {
        console.error('❌ dbHelpers: getSchedules error:', error);
        throw error;
    }

    console.log('✅ dbHelpers: getSchedules success, found:', data?.length || 0);
    return data || []
}

/**
 * Check which classes are already booked by OTHER programs at the same day/time
 * This is for the Class Room Exclusivity Rule:
 * One classroom can only be used for one program at the same time
 * 
 * @param {Object} params - Parameters
 * @param {string} params.day - Day of the week
 * @param {string} params.time_slot - Time slot (afternoon/evening)
 * @param {number} params.week_number - Week number
 * @param {number} params.year - Year
 * @param {string} params.currentProgram - Current user's program (to exclude from check)
 * @param {string} params.batch - Batch (optional)
 * @returns {Array} - Array of class_ids that are occupied by other programs
 */
export const getOccupiedClassesByOtherPrograms = async (params) => {
    const { day, time_slot, week_number, year, currentProgram, batch } = params;

    console.log('📡 dbHelpers: getOccupiedClassesByOtherPrograms called with:', params);

    // Get all schedules for this day/time/week that have bookings (current_students > 0)
    // and are NOT the current program
    let query = supabase
        .from('schedules')
        .select('class_id, program, current_students')
        .eq('day', day)
        .eq('time_slot', time_slot)
        .eq('week_number', week_number)
        .eq('year', year)
        .neq('program', currentProgram)
        .gt('current_students', 0);  // Only schedules that have at least 1 student

    if (batch) {
        query = query.eq('batch', batch);
    }

    const { data, error } = await query;

    if (error) {
        console.error('❌ dbHelpers: getOccupiedClassesByOtherPrograms error:', error);
        throw error;
    }

    // Extract unique class_ids that are occupied
    const occupiedClasses = data?.map(s => ({
        class_id: s.class_id,
        program: s.program,
        students: s.current_students
    })) || [];

    console.log('✅ dbHelpers: getOccupiedClassesByOtherPrograms found:', occupiedClasses);
    return occupiedClasses;
}

// ========================================
// BOOKING FUNCTIONS
// ========================================

/**
 * Create booking
 */
export const createBooking = async (bookingData) => {
    console.log('📡 dbHelpers: createBooking called with:', bookingData);

    const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single()

    if (error) {
        console.error('❌ dbHelpers: createBooking error:', error);
        throw error;
    }

    console.log('✅ dbHelpers: createBooking success:', data);
    return data
}

/**
 * Check if user already booked in phase (check directly from bookings table)
 */
export const hasUserBookedPhase = async (userId, phase, weekNumber, year, batch = null) => {
    console.log('📡 dbHelpers: hasUserBookedPhase called', { userId, phase, weekNumber, year, batch });

    try {
        // First, get all schedules for this phase, week, year, and batch
        let scheduleQuery = supabase
            .from('schedules')
            .select('id')
            .eq('phase', phase)
            .eq('week_number', weekNumber)
            .eq('year', year);

        // Filter by batch if provided
        if (batch) {
            scheduleQuery = scheduleQuery.eq('batch', batch);
        }

        const { data: schedules, error: scheduleError } = await scheduleQuery;

        if (scheduleError) {
            console.error('❌ dbHelpers: hasUserBookedPhase schedule error:', scheduleError);
            return false;
        }

        if (!schedules || schedules.length === 0) {
            console.log('✅ dbHelpers: No schedules found for this phase/week/year/batch');
            return false;
        }

        const scheduleIds = schedules.map(s => s.id);
        console.log('📋 Found schedule IDs:', scheduleIds);

        // Then check if user has any booking in these schedules
        const { data: bookings, error: bookingError } = await supabase
            .from('bookings')
            .select('id, schedule_id')
            .eq('user_id', userId)
            .eq('status', 'confirmed')
            .in('schedule_id', scheduleIds);

        if (bookingError) {
            console.error('❌ dbHelpers: hasUserBookedPhase booking error:', bookingError);
            return false;
        }

        const hasBooked = bookings && bookings.length > 0;
        console.log('✅ dbHelpers: hasUserBookedPhase result:', hasBooked, 'bookings found:', bookings?.length || 0);
        return hasBooked;
    } catch (err) {
        console.error('❌ dbHelpers: hasUserBookedPhase exception:', err);
        return false;
    }
}

/**
 * Mark phase as booked
 */
export const markPhaseBooked = async (userId, phase, weekNumber, year) => {
    console.log('📡 dbHelpers: markPhaseBooked called', { userId, phase, weekNumber, year });

    const { data, error } = await supabase
        .from('booking_rules')
        .upsert([
            {
                user_id: userId,
                phase: phase,
                week_number: weekNumber,
                year: year,
                has_booked: true
            }
        ], {
            onConflict: 'user_id,phase,week_number,year'
        })
        .select()

    if (error) {
        console.error('❌ dbHelpers: markPhaseBooked error:', error);
        throw error;
    }

    console.log('✅ dbHelpers: markPhaseBooked success:', data);
    return data
}

/**
 * Get user's bookings for specific week and batch
 */
export const getUserBookings = async (userId, weekNumber, year, batch = null) => {
    console.log('📡 dbHelpers: getUserBookings called', { userId, weekNumber, year, batch });

    let query = supabase
        .from('bookings')
        .select(`
      *,
      schedule:schedules!inner(
        *,
        class:classes(*),
        teacher:teachers(*)
      )
    `)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .eq('schedule.week_number', weekNumber)
        .eq('schedule.year', year)

    // Filter by batch if provided
    if (batch) {
        query = query.eq('schedule.batch', batch)
    }

    const { data, error } = await query

    if (error) {
        console.error('❌ dbHelpers: getUserBookings error:', error);
        throw error;
    }

    console.log('✅ dbHelpers: getUserBookings success, found:', data?.length || 0);
    return data || []
}

/**
 * Get students in a schedule
 */
export const getScheduleStudents = async (scheduleId) => {
    console.log('📡 dbHelpers: getScheduleStudents called for schedule:', scheduleId);

    const { data, error } = await supabase
        .from('bookings')
        .select(`
      *,
      user:users(student_id, full_name)
    `)
        .eq('schedule_id', scheduleId)
        .eq('status', 'confirmed')

    if (error) {
        console.error('❌ dbHelpers: getScheduleStudents error:', error);
        throw error;
    }

    console.log('✅ dbHelpers: getScheduleStudents success:', data);
    return data || []
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Get current week number (ISO week - starts on Monday)
 */
export const getCurrentWeek = () => {
    const now = new Date()

    // ISO week calculation (week starts on Monday)
    const dayOfWeek = now.getDay() || 7 // Convert Sunday (0) to 7
    const thursday = new Date(now)
    thursday.setDate(now.getDate() - dayOfWeek + 4) // Get Thursday of current week

    const yearStart = new Date(thursday.getFullYear(), 0, 1)
    const weekNumber = Math.ceil((((thursday - yearStart) / 86400000) + 1) / 7)

    console.log('📅 getCurrentWeek (ISO):', weekNumber);
    return weekNumber
}

/**
 * Get current year
 */
export const getCurrentYear = () => {
    const year = new Date().getFullYear()
    console.log('📅 getCurrentYear:', year);
    return year
}

/**
 * Get the date for a specific day in a given week
 * @param {string} dayName - Day name (monday, tuesday, etc.)
 * @param {number} weekNumber - ISO week number
 * @param {number} year - Year
 * @returns {Date} - Date object for that day
 */
export const getDateForDayInWeek = (dayName, weekNumber, year) => {
    const dayMap = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 7
    };

    const dayIndex = dayMap[dayName.toLowerCase()] || 1;

    // Get January 4th of the year (always in week 1 per ISO)
    const jan4 = new Date(year, 0, 4);
    const jan4DayOfWeek = jan4.getDay() || 7; // Convert Sunday (0) to 7

    // Get Monday of week 1
    const week1Monday = new Date(jan4);
    week1Monday.setDate(jan4.getDate() - jan4DayOfWeek + 1);

    // Calculate the target date
    const targetDate = new Date(week1Monday);
    targetDate.setDate(week1Monday.getDate() + (weekNumber - 1) * 7 + (dayIndex - 1));

    return targetDate;
}

/**
 * Format date to display string (e.g., "Jan 15")
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
export const formatDateShort = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Format date to full display string (e.g., "Monday, January 15, 2026")
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
export const formatDateFull = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Get all students (Admin only)
 */
export const getAllStudents = async () => {
    console.log('📡 dbHelpers: getAllStudents called');

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .eq('is_active', true)
        .order('student_id')

    if (error) {
        console.error('❌ dbHelpers: getAllStudents error:', error);
        throw error;
    }

    console.log('✅ dbHelpers: getAllStudents success:', data?.length || 0);
    return data || [];
}


// ========================================
// AUTO-COPY BOOKING FUNCTIONS
// ========================================

/**
 * Check if it's Sunday night (after 20:00) - time to auto-copy
 * Auto-copy happens on Sunday night before the new week starts on Monday
 */
export const isSundayNight = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const hour = now.getHours();

    // Sunday (0) after 20:00 (8 PM)
    return dayOfWeek === 0 && hour >= 20;
}

/**
 * Check if we're in the new week (Monday onwards) and copy hasn't been done
 * This is a fallback in case user didn't open app on Sunday night
 */
export const isNewWeekStarted = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Monday (1) is the start of new week
    // If it's Monday-Saturday, we're in the new week
    return dayOfWeek >= 1 && dayOfWeek <= 6;
}

/**
 * Get the key for tracking if copy was done for a specific week
 */
const getCopyKey = (weekNumber, year) => `booking_copied_${year}_${weekNumber}`;

/**
 * Check if bookings were already copied for next week
 */
export const wasBookingCopied = (weekNumber, year) => {
    const key = getCopyKey(weekNumber, year);
    return localStorage.getItem(key) === 'true';
}

/**
 * Mark bookings as copied for a specific week
 */
export const markBookingCopied = (weekNumber, year) => {
    const key = getCopyKey(weekNumber, year);
    localStorage.setItem(key, 'true');
}

/**
 * Copy all bookings from previous week to current week
 * This runs automatically:
 * - On Sunday night (after 20:00) - copies to next week
 * - On Monday-Saturday if copy wasn't done - copies from previous week
 */
export const autoCopyBookingsToNextWeek = async () => {
    const currentWeek = getCurrentWeek();
    const currentYear = getCurrentYear();

    console.log('🔄 autoCopyBookings: Checking if copy needed...');
    console.log('📅 Current week:', currentWeek);

    // Determine source and target weeks
    let sourceWeek, targetWeek;

    if (isSundayNight()) {
        // Sunday night: copy current week to next week
        sourceWeek = currentWeek;
        targetWeek = currentWeek + 1;
        console.log('📅 Sunday night mode: copying week', sourceWeek, 'to week', targetWeek);
    } else if (isNewWeekStarted()) {
        // Monday-Saturday: copy previous week to current week (if not done)
        sourceWeek = currentWeek - 1;
        targetWeek = currentWeek;
        console.log('📅 New week mode: copying week', sourceWeek, 'to week', targetWeek);
    } else {
        // Sunday before 20:00 - don't copy yet
        console.log('⏳ autoCopyBookings: Sunday before 20:00, waiting...');
        return { copied: false, reason: 'waiting_for_sunday_night' };
    }

    // Check if already copied for target week
    if (wasBookingCopied(targetWeek, currentYear)) {
        console.log('✅ autoCopyBookings: Already copied for week', targetWeek);
        return { copied: false, reason: 'already_copied' };
    }

    try {
        // Get all bookings from source week
        const { data: sourceBookings, error: fetchError } = await supabase
            .from('bookings')
            .select(`
                *,
                schedule:schedules!inner(
                    id,
                    class_id,
                    teacher_id,
                    program,
                    level,
                    phase,
                    day,
                    time_slot,
                    week_number,
                    year
                )
            `)
            .eq('status', 'confirmed')
            .eq('schedule.week_number', sourceWeek)
            .eq('schedule.year', currentYear);

        if (fetchError) {
            console.error('❌ autoCopyBookings: Error fetching bookings:', fetchError);
            return { copied: false, reason: 'fetch_error', error: fetchError };
        }

        console.log('📋 autoCopyBookings: Found', sourceBookings?.length || 0, 'bookings to copy');

        if (!sourceBookings || sourceBookings.length === 0) {
            markBookingCopied(targetWeek, currentYear);
            return { copied: true, reason: 'no_bookings_to_copy', count: 0 };
        }

        let copiedCount = 0;

        for (const booking of sourceBookings) {
            const schedule = booking.schedule;

            // Find or create schedule for target week with same parameters
            const scheduleData = {
                class_id: schedule.class_id,
                teacher_id: schedule.teacher_id,
                program: schedule.program,
                level: schedule.level,
                phase: schedule.phase,
                day: schedule.day,
                time_slot: schedule.time_slot,
                week_number: targetWeek,
                year: currentYear
            };

            const targetWeekSchedule = await getOrCreateSchedule(scheduleData);

            // Check if user already has booking for target week in this phase
            const existingBooking = await hasUserBookedPhase(
                booking.user_id,
                schedule.phase,
                targetWeek,
                currentYear
            );

            if (existingBooking) {
                console.log('⏭️ User', booking.user_id, 'already booked phase', schedule.phase, 'for week', targetWeek);
                continue;
            }

            // Check if class is full (max 10)
            if (targetWeekSchedule.current_students >= 10) {
                console.log('⚠️ Class full for schedule', targetWeekSchedule.id);
                continue;
            }

            // Create booking for target week
            await createBooking({
                schedule_id: targetWeekSchedule.id,
                user_id: booking.user_id,
                status: 'confirmed'
            });

            copiedCount++;
            console.log('✅ Copied booking for user', booking.user_id, 'to week', targetWeek);
        }

        // Mark as copied
        markBookingCopied(targetWeek, currentYear);

        console.log('🎉 autoCopyBookings: Successfully copied', copiedCount, 'bookings to week', targetWeek);
        return { copied: true, reason: 'success', count: copiedCount };

    } catch (err) {
        console.error('❌ autoCopyBookings: Error:', err);
        return { copied: false, reason: 'error', error: err };
    }
}


// ========================================
// ATTENDANCE FUNCTIONS
// ========================================

/**
 * Submit attendance record to Supabase
 */
export const submitAttendance = async (attendanceRecord) => {
    console.log('📡 dbHelpers: submitAttendance called', attendanceRecord);

    const { data, error } = await supabase
        .from('attendance')
        .insert([attendanceRecord])
        .select()
        .single();

    if (error) {
        console.error('❌ Error submitting attendance:', error);
        throw error;
    }

    console.log('✅ Attendance submitted successfully:', data);
    return data;
};

/**
 * Submit multiple attendance records (batch)
 * Includes duplicate prevention - will not insert if attendance already exists for schedule_id + student_id
 */
export const submitBatchAttendance = async (attendanceRecords) => {
    console.log('📡 dbHelpers: submitBatchAttendance called', attendanceRecords.length, 'records');

    // Check for existing attendance records to prevent duplicates
    const scheduleIds = [...new Set(attendanceRecords.map(r => r.schedule_id))];
    const studentIds = [...new Set(attendanceRecords.map(r => r.student_id))];

    console.log('🔍 Checking for existing attendance records...');
    const { data: existingRecords, error: checkError } = await supabase
        .from('attendance')
        .select('schedule_id, student_id')
        .in('schedule_id', scheduleIds);

    if (checkError) {
        console.error('❌ Error checking existing attendance:', checkError);
        throw checkError;
    }

    // Create a Set of existing combinations for fast lookup
    const existingSet = new Set(
        existingRecords?.map(r => `${r.schedule_id}_${r.student_id}`) || []
    );

    // Filter out records that already exist
    const newRecords = attendanceRecords.filter(record => {
        const key = `${record.schedule_id}_${record.student_id}`;
        const exists = existingSet.has(key);
        if (exists) {
            console.log('⚠️ Skipping duplicate attendance for student:', record.student_name, 'schedule:', record.schedule_id);
        }
        return !exists;
    });

    if (newRecords.length === 0) {
        console.log('⚠️ All attendance records already exist - no new records to insert');
        return {
            success: true,
            inserted: 0,
            skipped: attendanceRecords.length,
            message: 'Attendance already submitted for all students'
        };
    }

    console.log(`📝 Inserting ${newRecords.length} new records (skipped ${attendanceRecords.length - newRecords.length} duplicates)`);

    const { data, error } = await supabase
        .from('attendance')
        .insert(newRecords)
        .select();

    if (error) {
        console.error('❌ Error submitting batch attendance:', error);
        throw error;
    }

    console.log('✅ Batch attendance submitted successfully:', data.length, 'records');
    return {
        success: true,
        inserted: data.length,
        skipped: attendanceRecords.length - newRecords.length,
        data
    };
};

/**
 * Get attendance records with filters
 */
export const getAttendanceRecords = async (filters = {}) => {
    console.log('📡 dbHelpers: getAttendanceRecords called with filters:', filters);

    // Fetch ALL records using pagination to bypass 1000 row limit
    let allData = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        let query = supabase
            .from('attendance')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, from + pageSize - 1);

        // Apply filters
        if (filters.student_id) {
            query = query.eq('student_id', filters.student_id);
        }
        if (filters.teacher_id) {
            query = query.eq('teacher_id', filters.teacher_id);
        }
        if (filters.week_number) {
            query = query.eq('week_number', filters.week_number);
        }
        if (filters.year) {
            query = query.eq('year', filters.year);
        }
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.class_name) {
            query = query.eq('class_name', filters.class_name);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('❌ Error fetching attendance:', error);
            throw error;
        }

        if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += pageSize;

            // Check if there are more records
            hasMore = data.length === pageSize && allData.length < count;
        } else {
            hasMore = false;
        }
    }

    console.log('✅ Fetched', allData.length, 'attendance records (all pages)');
    return allData;
};

/**
 * Get attendance statistics
 */
export const getAttendanceStats = async (filters = {}) => {
    console.log('📡 dbHelpers: getAttendanceStats called');

    const records = await getAttendanceRecords(filters);

    const stats = {
        total: records.length,
        present: records.filter(r => r.status === 'present').length,
        late: records.filter(r => r.status === 'late').length,
        absent: records.filter(r => r.status === 'absent').length,
    };

    stats.attendanceRate = stats.total > 0
        ? ((stats.present / stats.total) * 100).toFixed(1)
        : 0;

    return stats;
};

/**
 * Get student attendance summary
 */
export const getStudentAttendanceSummary = async (studentId) => {
    console.log('📡 dbHelpers: getStudentAttendanceSummary for student:', studentId);

    const records = await getAttendanceRecords({ student_id: studentId });

    const summary = {
        total: records.length,
        present: records.filter(r => r.status === 'present').length,
        late: records.filter(r => r.status === 'late').length,
        absent: records.filter(r => r.status === 'absent').length,
        records: records
    };

    summary.attendanceRate = summary.total > 0
        ? ((summary.present / summary.total) * 100).toFixed(1)
        : 0;

    return summary;
};

/**
 * Check if attendance already exists for a student in a specific class/schedule
 */
export const checkAttendanceExists = async (studentId, scheduleId, weekNumber, year) => {
    const { data, error } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', studentId)
        .eq('schedule_id', scheduleId)
        .eq('week_number', weekNumber)
        .eq('year', year)
        .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error checking attendance:', error);
        throw error;
    }

    return data !== null;
};

/**
 * Update attendance record
 */
export const updateAttendance = async (attendanceId, updates) => {
    console.log('📡 dbHelpers: updateAttendance called', attendanceId);

    const { data, error } = await supabase
        .from('attendance')
        .update(updates)
        .eq('id', attendanceId)
        .select()
        .single();

    if (error) {
        console.error('❌ Error updating attendance:', error);
        throw error;
    }

    console.log('✅ Attendance updated successfully');
    return data;
};

/**
 * Delete attendance record
 */
export const deleteAttendance = async (attendanceId) => {
    console.log('📡 dbHelpers: deleteAttendance called', attendanceId);

    const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', attendanceId);

    if (error) {
        console.error('❌ Error deleting attendance:', error);
        throw error;
    }

    console.log('✅ Attendance deleted successfully');
    return true;
};

// ========================================
// BULK OPERATIONS
// ========================================

/**
 * Bulk create users (students)
 */
export const bulkCreateUsers = async (users) => {
    console.log('📡 dbHelpers: bulkCreateUsers called with', users.length, 'users');

    const success = [];
    const failed = [];

    for (const user of users) {
        try {
            // Check if email already exists
            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('email', user.email)
                .single();

            if (existing) {
                failed.push({ ...user, error: 'Email already exists' });
                continue;
            }

            // Generate student ID
            const year = new Date().getFullYear().toString().slice(-2);
            const batchPadded = user.batch.toString().padStart(2, '0');

            // Get last student ID for this batch
            const { data: lastStudent } = await supabase
                .from('users')
                .select('student_id')
                .like('student_id', `EYSA${year}${batchPadded}%`)
                .order('student_id', { ascending: false })
                .limit(1)
                .single();

            let sequence = 1;
            if (lastStudent && lastStudent.student_id) {
                const lastSequence = parseInt(lastStudent.student_id.slice(-3));
                sequence = lastSequence + 1;
            }

            const student_id = `EYSA${year}${batchPadded}${sequence.toString().padStart(3, '0')}`;

            // Create user
            const { data, error } = await supabase
                .from('users')
                .insert([{
                    ...user,
                    student_id,
                    password: 'student123', // Default password
                    role: 'student'
                }])
                .select()
                .single();

            if (error) throw error;

            success.push(data);
        } catch (error) {
            console.error('Error creating user:', error);
            failed.push({ ...user, error: error.message });
        }
    }

    console.log('✅ Bulk create complete:', success.length, 'success,', failed.length, 'failed');
    return { success, failed };
};

/**
 * Bulk assign students to class
 */
export const bulkAssignStudentsToClass = async (assignments) => {
    console.log('📡 dbHelpers: bulkAssignStudentsToClass called with', assignments.length, 'assignments');

    const success = [];
    const failed = [];

    for (const assignment of assignments) {
        try {
            // Get user ID from student_id
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('student_id', assignment.student_id)
                .single();

            if (userError || !user) {
                failed.push({ ...assignment, error: 'Student not found' });
                continue;
            }

            // Get or create class
            let { data: classData } = await supabase
                .from('classes')
                .select('id')
                .eq('name', assignment.class_name)
                .single();

            if (!classData) {
                // Create class if doesn't exist
                const { data: newClass, error: classError } = await supabase
                    .from('classes')
                    .insert([{
                        name: assignment.class_name,
                        program: assignment.program,
                        level: assignment.level,
                        is_active: true
                    }])
                    .select()
                    .single();

                if (classError) throw classError;
                classData = newClass;
            }

            // Check if already enrolled
            const { data: existing } = await supabase
                .from('class_students')
                .select('id')
                .eq('class_id', classData.id)
                .eq('user_id', user.id)
                .single();

            if (existing) {
                failed.push({ ...assignment, error: 'Already enrolled' });
                continue;
            }

            // Enroll student
            const { data, error } = await supabase
                .from('class_students')
                .insert([{
                    class_id: classData.id,
                    user_id: user.id
                }])
                .select()
                .single();

            if (error) throw error;

            success.push({ ...assignment, enrollment_id: data.id });
        } catch (error) {
            console.error('Error assigning student:', error);
            failed.push({ ...assignment, error: error.message });
        }
    }

    console.log('✅ Bulk assign complete:', success.length, 'success,', failed.length, 'failed');
    return { success, failed };
};

/**
 * Bulk update attendance
 */
export const bulkUpdateAttendance = async (updates) => {
    console.log('📡 dbHelpers: bulkUpdateAttendance called with', updates.length, 'updates');

    const success = [];
    const failed = [];

    for (const update of updates) {
        try {
            const { data, error } = await supabase
                .from('attendance')
                .update({
                    status: update.status.toLowerCase(),
                    notes: update.notes || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', update.id)
                .select()
                .single();

            if (error) throw error;

            success.push(data);
        } catch (error) {
            console.error('Error updating attendance:', error);
            failed.push({ ...update, error: error.message });
        }
    }

    console.log('✅ Bulk update complete:', success.length, 'success,', failed.length, 'failed');
    return { success, failed };
};
