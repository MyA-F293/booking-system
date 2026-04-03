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
export const getOrCreateSchedule = async (scheduleData, retryCount = 0) => {
    console.log('📡 dbHelpers: getOrCreateSchedule called with:', scheduleData, 'retry:', retryCount);
    console.log('🔍 DEBUG: Full schedule data:', JSON.stringify(scheduleData, null, 2));

    const { class_id, program, level, phase, day, time_slot, week_number, year, batch } = scheduleData

    // Check if schedule already exists
    console.log('🔍 DEBUG: Building query to check existing schedule...');
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
        console.log('🔍 DEBUG: Adding day filter:', day);
        query = query.eq('day', day)
    }

    // Add batch filter if provided
    if (batch) {
        console.log('🔍 DEBUG: Adding batch filter:', batch);
        query = query.eq('batch', batch)
    }

    console.log('🔍 DEBUG: Executing query to find existing schedule...');
    let { data, error } = await query.maybeSingle()

    console.log('🔍 DEBUG: Query result:', { found: !!data, error: error?.message });

    // Jika belum ada, buat baru
    if (!data) {
        console.log('📝 Schedule not found, creating new schedule...');
        console.log('🔍 DEBUG: INSERT data:', JSON.stringify(scheduleData, null, 2));

        const { data: newData, error: createError } = await supabase
            .from('schedules')
            .insert([scheduleData])
            .select()
            .single()

        if (createError) {
            console.error('❌ Error creating schedule:', createError);
            console.error('🔍 DEBUG: Error code:', createError.code);
            console.error('🔍 DEBUG: Error message:', createError.message);
            console.error('🔍 DEBUG: Error details:', createError.details);
            console.error('🔍 DEBUG: Error hint:', createError.hint);

            // ✅ Handle duplicate key error (race condition)
            if (createError.code === '23505' && retryCount < 3) {
                console.log('⚠️ Duplicate key detected (code 23505), retrying to fetch existing schedule...');
                // Wait a bit and retry fetching
                await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
                return getOrCreateSchedule(scheduleData, retryCount + 1);
            }

            // 🔍 DEBUG: Check if error is from trigger
            if (createError.message && createError.message.includes('Duplicate schedule detected')) {
                console.error('🚨 DEBUG: TRIGGER ERROR DETECTED!');
                console.error('🚨 This error comes from prevent_duplicate_schedule trigger');
                console.error('🚨 Trigger is blocking the INSERT even though schedule should be allowed');
                console.error('🚨 SOLUTION: Disable the trigger in Supabase');
            }

            throw createError;
        }
        console.log('✅ Schedule created:', newData);
        console.log('🔍 DEBUG: New schedule ID:', newData?.id);
        return newData
    }

    if (error) {
        console.error('❌ Error fetching schedule:', error);
        throw error;
    }

    console.log('✅ Schedule found:', data);
    console.log('🔍 DEBUG: Existing schedule ID:', data?.id);
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
    if (filters.teacher_id) query = query.eq('teacher_id', filters.teacher_id)

    // Handle batch filter - normalize "Batch 1" to "1"
    if (filters.batch) {
        const batchNumber = filters.batch.toString().replace(/[^0-9]/g, '');
        console.log('🔍 Batch filter in getSchedules:', { original: filters.batch, normalized: batchNumber });
        query = query.eq('batch', batchNumber);
    }

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
        // Normalize batch format
        const batchNumber = batch.toString().replace(/[^0-9]/g, '');
        query = query.eq('batch', batchNumber);
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

        // Filter by batch if provided - normalize format
        if (batch) {
            const batchNumber = batch.toString().replace(/[^0-9]/g, '');
            console.log('🔍 Batch filter in hasUserBookedPhase:', { original: batch, normalized: batchNumber });
            scheduleQuery = scheduleQuery.eq('batch', batchNumber);
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
    console.log('📡 dbHelpers: getUserBookings called', { userId, weekNumber, year, batch, timestamp: new Date().toISOString() });

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
        .order('created_at', { ascending: false }) // Get latest bookings first

    // ❌ REMOVED: Batch filter was too strict and hiding bookings
    // Students should see ALL their bookings regardless of schedule batch
    // The batch filter was causing bookings to disappear when schedule.batch was NULL or different

    // Filter by batch if provided - DISABLED for now
    // if (batch) {
    //     const batchNumber = batch.toString().replace(/[^0-9]/g, '');
    //     console.log('🔍 Batch filter:', { original: batch, normalized: batchNumber });
    //     query = query.eq('schedule.batch', batchNumber)
    // }

    const { data, error } = await query

    if (error) {
        console.error('❌ dbHelpers: getUserBookings error:', error);
        throw error;
    }

    console.log('✅ dbHelpers: getUserBookings success, found:', data?.length || 0);
    console.log('📋 Bookings details:', data?.map(b => ({
        id: b.id,
        class: b.schedule?.class?.name,
        day: b.schedule?.day,
        time: b.schedule?.time_slot,
        phase: b.schedule?.phase,
        schedule_batch: b.schedule?.batch,
        created: b.created_at
    })));
    return data || []
}

/**
 * Get students in a schedule
 */
export const getScheduleStudents = async (scheduleId) => {
    console.log('📡 dbHelpers: getScheduleStudents called for schedule:', scheduleId);

    // Query bookings and manually join with users using user_id
    const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, user_id, schedule_id, status, created_at')
        .eq('schedule_id', scheduleId)
        .eq('status', 'confirmed');

    if (bookingsError) {
        console.error('❌ dbHelpers: getScheduleStudents bookings error:', bookingsError);
        throw bookingsError;
    }

    if (!bookingsData || bookingsData.length === 0) {
        console.log('⚠️ No bookings found for schedule:', scheduleId);
        return [];
    }

    // Get user IDs (convert UUID to string for matching)
    const userIds = bookingsData.map(b => b.user_id);

    // Fetch users data - match by id (UUID) not student_id (TEXT)
    const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, student_id, full_name')
        .in('id', userIds);

    if (usersError) {
        console.error('❌ dbHelpers: getScheduleStudents users error:', usersError);
        throw usersError;
    }

    // Create a map of users by id for quick lookup
    const usersMap = {};
    usersData?.forEach(user => {
        usersMap[user.id] = user;
    });

    // Combine bookings with user data
    const result = bookingsData.map(booking => ({
        ...booking,
        user: usersMap[booking.user_id] || null
    }));

    console.log('✅ dbHelpers: getScheduleStudents success:', result.length, 'students');
    console.log('📋 Sample student data:', result[0]);

    return result;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Get current week number (SYNC version for backward compatibility)
 * Returns ISO week number as fallback
 * For database-based week, use useWeek() hook instead
 */
export const getCurrentWeek = () => {
    // Return ISO week as fallback for components that need sync version
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekNumber = Math.ceil(diff / oneWeek);
    return weekNumber;
}

/**
 * Get current week from database (ASYNC version)
 * Use this when you need database-based week
 * Or better: use useWeek() hook in components
 */
export const getCurrentWeekFromDB = async () => {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('current_week')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('❌ Error getting current week:', error);
            return getCurrentWeek(); // fallback to ISO week
        }

        console.log('📅 getCurrentWeekFromDB:', data.current_week);
        return data.current_week;
    } catch (err) {
        console.error('❌ Exception getting current week:', err);
        return getCurrentWeek(); // fallback to ISO week
    }
}

/**
 * Increment current week by 1 (admin only)
 * DEPRECATED: Use useWeek() hook instead
 */
export const incrementWeek = async () => {
    try {
        const currentWeek = await getCurrentWeekFromDB();
        const newWeek = currentWeek + 1;

        const { error } = await supabase
            .from('settings')
            .update({
                current_week: newWeek,
                updated_at: new Date().toISOString()
            })
            .eq('id', 1);

        if (error) throw error;

        console.log('✅ Week incremented to:', newWeek);
        return newWeek;
    } catch (err) {
        console.error('❌ Error incrementing week:', err);
        throw err;
    }
}

/**
 * Set current week to specific number (admin only)
 */
export const setCurrentWeek = async (weekNumber) => {
    try {
        const { error } = await supabase
            .from('settings')
            .update({
                current_week: weekNumber,
                updated_at: new Date().toISOString()
            })
            .eq('id', 1);

        if (error) throw error;

        console.log('✅ Week set to:', weekNumber);
        return weekNumber;
    } catch (err) {
        console.error('❌ Error setting week:', err);
        throw err;
    }
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
 * @param {number} weekNumber - Week number (1-8, not ISO week)
 * @param {number} year - Year (for fallback only)
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

    // FIXED: Use actual week start date from batch
    // Week 1 starts on March 30, 2026 (Monday)
    // Today (March 29) is Week 0 (preparation week)
    const week1StartDate = new Date(2026, 2, 30); // March 30, 2026 (Monday)

    // Calculate the Monday of the target week
    const targetWeekMonday = new Date(week1StartDate);
    targetWeekMonday.setDate(week1StartDate.getDate() + (weekNumber - 1) * 7);

    // Calculate the target date by adding days from Monday
    const targetDate = new Date(targetWeekMonday);
    targetDate.setDate(targetWeekMonday.getDate() + (dayIndex - 1));

    return targetDate;
}

/**
 * Format date to display string (e.g., "Feb 15")
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
export const formatDateShort = (date) => {
    if (!date) return '';
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
                year: currentYear,
                batch: null, // Will be set by trigger when first student books
                current_students: 0
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
 * Supports UPSERT - will insert new records or update existing ones if status changed
 */
export const submitBatchAttendance = async (attendanceRecords) => {
    console.log('📡 dbHelpers: submitBatchAttendance called', attendanceRecords.length, 'records');

    // Check for existing attendance records
    const scheduleIds = [...new Set(attendanceRecords.map(r => r.schedule_id))];

    console.log('🔍 Checking for existing attendance records...');
    const { data: existingRecords, error: checkError } = await supabase
        .from('attendance')
        .select('id, schedule_id, student_id, status')
        .in('schedule_id', scheduleIds);

    if (checkError) {
        console.error('❌ Error checking existing attendance:', checkError);
        throw checkError;
    }

    // Create a Map of existing records for fast lookup
    const existingMap = new Map();
    existingRecords?.forEach(r => {
        const key = `${r.schedule_id}_${r.student_id}`;
        existingMap.set(key, r);
    });

    // Separate records into: new inserts, updates, and unchanged
    const toInsert = [];
    const toUpdate = [];
    let unchangedCount = 0;

    attendanceRecords.forEach(record => {
        const key = `${record.schedule_id}_${record.student_id}`;
        const existing = existingMap.get(key);

        if (!existing) {
            // New record - insert
            toInsert.push(record);
            console.log('➕ New attendance:', record.student_name, '-', record.status);
        } else if (existing.status !== record.status) {
            // Existing record with different status - update
            toUpdate.push({
                id: existing.id,
                ...record
            });
            console.log('🔄 Update attendance:', record.student_name, existing.status, '→', record.status);
        } else {
            // Existing record with same status - skip
            unchangedCount++;
            console.log('⏭️ Skip unchanged:', record.student_name, '-', record.status);
        }
    });

    let insertedCount = 0;
    let updatedCount = 0;

    // Insert new records
    if (toInsert.length > 0) {
        console.log(`📝 Inserting ${toInsert.length} new records...`);
        const { data, error } = await supabase
            .from('attendance')
            .insert(toInsert)
            .select();

        if (error) {
            console.error('❌ Error inserting attendance:', error);
            throw error;
        }
        insertedCount = data.length;
        console.log('✅ Inserted:', insertedCount, 'records');
    }

    // Update existing records
    if (toUpdate.length > 0) {
        console.log(`🔄 Updating ${toUpdate.length} records...`);

        // Update one by one (Supabase doesn't support batch update easily)
        for (const record of toUpdate) {
            const { error } = await supabase
                .from('attendance')
                .update({
                    status: record.status,
                    teacher_id: record.teacher_id,
                    teacher_name: record.teacher_name
                })
                .eq('id', record.id);

            if (error) {
                console.error('❌ Error updating attendance:', error);
                throw error;
            }
            updatedCount++;
        }
        console.log('✅ Updated:', updatedCount, 'records');
    }

    const totalProcessed = insertedCount + updatedCount;
    console.log('✅ Batch attendance complete:', {
        inserted: insertedCount,
        updated: updatedCount,
        unchanged: unchangedCount,
        total: attendanceRecords.length
    });

    return {
        success: true,
        inserted: insertedCount,
        updated: updatedCount,
        unchanged: unchangedCount,
        total: totalProcessed,
        message: totalProcessed > 0
            ? `${insertedCount} new, ${updatedCount} updated, ${unchangedCount} unchanged`
            : 'All attendance records unchanged'
    };
};

/**
 * Get attendance records with filters
 */
export const getAttendanceRecords = async (filters = {}) => {
    console.log('📡 dbHelpers: getAttendanceRecords called with filters:', filters);
    console.log('🔍 dbHelpers: Filter details:', {
        schedule_id: filters.schedule_id || 'none',
        student_id: filters.student_id || 'none',
        teacher_id: filters.teacher_id || 'none',
        week_number: filters.week_number || 'none',
        year: filters.year || 'none',
        status: filters.status || 'none',
        class_name: filters.class_name || 'none'
    });

    // Fetch ALL records using pagination to bypass 1000 row limit
    let allData = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore) {
        pageCount++;
        console.log(`📄 dbHelpers: Fetching page ${pageCount}, range ${from}-${from + pageSize - 1}`);

        let query = supabase
            .from('attendance')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, from + pageSize - 1);

        // Apply filters
        if (filters.schedule_id) {
            query = query.eq('schedule_id', filters.schedule_id);
        }
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
            console.error('❌ dbHelpers: Error fetching attendance page', pageCount, ':', error);
            throw error;
        }

        console.log(`✅ dbHelpers: Page ${pageCount} fetched:`, data?.length || 0, 'records, total count:', count);

        if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += pageSize;

            // Check if there are more records
            hasMore = data.length === pageSize && allData.length < count;

            if (hasMore) {
                console.log(`🔄 dbHelpers: More records available, fetching next page...`);
            }
        } else {
            hasMore = false;
            console.log('🏁 dbHelpers: No more records to fetch');
        }
    }

    console.log('✅ dbHelpers: getAttendanceRecords complete - Total records:', allData.length);
    console.log('📋 dbHelpers: Sample records (first 3):', allData.slice(0, 3).map(r => ({
        id: r.id,
        student_id: r.student_id,
        class_name: r.class_name,
        week: r.week_number,
        status: r.status
    })));

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
            // Check if student_id already exists
            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('student_id', user.student_id)
                .single();

            if (existing) {
                failed.push({ ...user, error: 'Student ID already exists' });
                continue;
            }

            // Use student_id from CSV (no auto-generation)
            // Create user with default password student123
            const { data, error } = await supabase
                .from('users')
                .insert([{
                    student_id: user.student_id,
                    full_name: user.full_name,
                    batch: user.batch,
                    program: user.program,
                    level: user.level,
                    password: 'student123', // Default password
                    role: 'student',
                    is_active: true
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


/**
 * Bulk create attendance records
 */
export const bulkCreateAttendance = async (records) => {
    console.log('📡 dbHelpers: bulkCreateAttendance called with', records.length, 'records');

    const success = [];
    const failed = [];

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        try {
            const { data, error } = await supabase
                .from('attendance')
                .insert(batch)
                .select();

            if (error) {
                console.error('❌ Batch insert error:', error);
                // Add all batch records to failed
                batch.forEach(record => {
                    failed.push({ ...record, error: error.message });
                });
            } else {
                success.push(...data);
            }
        } catch (error) {
            console.error('❌ Exception during batch insert:', error);
            batch.forEach(record => {
                failed.push({ ...record, error: error.message });
            });
        }
    }

    console.log('✅ Bulk create attendance complete:', success.length, 'success,', failed.length, 'failed');
    return { success, failed };
};
