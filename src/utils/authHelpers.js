import { supabase } from '../supabaseClient'
import { supabaseAdmin } from '../supabaseAdmin'

/**
 * Login user (Admin or Student)
 */
export const login = async (studentId, password) => {
    console.log('🔐 Attempting login for:', studentId);

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('student_id', studentId)
            .eq('password', password)
            .eq('is_active', true)
            .single()

        if (error) {
            console.error('❌ Login error:', error);
            throw new Error('Invalid Student ID or password');
        }

        if (!data) {
            throw new Error('User not found or inactive');
        }

        console.log('✅ Login successful:', data);

        // Store in localStorage
        localStorage.setItem('user', JSON.stringify(data));

        return data;
    } catch (err) {
        console.error('❌ Login failed:', err);
        throw err;
    }
}

/**
 * Logout user
 */
export const logout = () => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('user');
}

/**
 * Get current logged in user
 */
export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
        return JSON.parse(userStr);
    } catch (err) {
        console.error('Error parsing user:', err);
        return null;
    }
}

/**
 * Check if user is admin
 */
export const isAdmin = () => {
    const user = getCurrentUser();
    return user?.role === 'admin';
}

/**
 * Check if user is logged in
 */
export const isLoggedIn = () => {
    return getCurrentUser() !== null;
}

/**
 * Get the latest batch number from existing students
 */
export const getLatestBatch = async () => {
    console.log('🔍 Getting latest batch number...');

    const { data, error } = await supabase
        .from('users')
        .select('batch')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
        .limit(1)

    if (error) {
        console.error('❌ Error getting latest batch:', error);
        return 1; // Default batch
    }

    if (data && data.length > 0) {
        const latestBatch = parseInt(data[0].batch);
        console.log('✅ Latest batch found:', latestBatch);
        return latestBatch;
    }

    console.log('ℹ️ No students found, returning default batch 1');
    return 1; // Default batch
}

/**
 * Generate Student ID
 * Format: EYSA-YY-BA-SEQ (Example: EYSA26010001)
 */
export const generateStudentId = async (batchNumber) => {
    console.log('🆔 Generating student ID for batch:', batchNumber);

    const year = new Date().getFullYear().toString().slice(-2); // 26 for 2026
    const batchPadded = batchNumber.toString().padStart(2, '0'); // 01, 02, etc
    const prefix = `EYSA${year}${batchPadded}`;

    console.log('🔍 Searching for students with prefix:', prefix);

    // IMPROVED: Get ALL students with this prefix first (no role filter initially)
    const { data: allData, error: allError } = await supabase
        .from('users')
        .select('student_id, role')
        .like('student_id', `${prefix}%`)
        .order('student_id', { ascending: false })

    console.log('📊 All matching records:', allData);
    console.log('📊 Total records found:', allData?.length || 0);

    if (allError) {
        console.error('❌ Error querying students:', allError);
    }

    // Filter students with role='student' in JavaScript
    const studentData = allData?.filter(user => user.role === 'student') || [];
    console.log('👥 Filtered students only:', studentData);
    console.log('👥 Total students found:', studentData.length);

    let sequence = 1;

    if (studentData && studentData.length > 0) {
        // Extract sequence from last ID
        const lastId = studentData[0].student_id;
        console.log('📌 Last student ID found:', lastId);

        const lastSeq = parseInt(lastId.slice(-4));
        console.log('🔢 Last sequence number:', lastSeq);

        sequence = lastSeq + 1;
        console.log('➕ New sequence number:', sequence);
    } else {
        console.log('ℹ️ No existing students found for this batch, starting from 0001');
    }

    const seqPadded = sequence.toString().padStart(4, '0');
    const studentId = `${prefix}${seqPadded}`;

    console.log('✅ Generated student ID:', studentId);
    return studentId;
}

/**
 * Create new student (Admin only)
 */
export const createStudentAccount = async (studentData) => {
    console.log('👤 Creating student account:', studentData);

    if (!isAdmin()) {
        throw new Error('Only admin can create student accounts');
    }

    const { data, error } = await supabase
        .from('users')
        .insert([{
            ...studentData,
            role: 'student',
            is_active: true,
            password: 'student123' // Default password
        }])
        .select()
        .single()

    if (error) {
        console.error('❌ Error creating student:', error);
        throw error;
    }

    console.log('✅ Student created:', data);
    return data;
}

/**
 * Get all students (Admin only)
 */
export const getAllStudents = async () => {
    if (!isAdmin()) {
        throw new Error('Only admin can view all students');
    }

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .order('student_id')

    if (error) throw error;
    return data || [];
}


/**
 * Update student (Admin only)
 */
export const updateStudent = async (studentId, studentData) => {
    console.log('📝 Updating student:', studentId, studentData);

    if (!isAdmin()) {
        throw new Error('Only admin can update students');
    }

    // Use supabaseAdmin to bypass RLS
    const { data, error } = await supabaseAdmin
        .from('users')
        .update(studentData)
        .eq('id', studentId)
        .select()
        .single()

    if (error) {
        console.error('❌ Error updating student:', error);
        throw error;
    }

    console.log('✅ Student updated:', data);
    return data;
}

/**
 * Delete/Deactivate student (Admin only) - Soft delete
 */
export const deleteStudent = async (studentId) => {
    console.log('🗑️ Deactivating student:', studentId);

    if (!isAdmin()) {
        throw new Error('Only admin can deactivate students');
    }

    const { data, error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', studentId)
        .select()
        .single()

    if (error) {
        console.error('❌ Error deactivating student:', error);
        throw error;
    }

    console.log('✅ Student deactivated:', data);
    return data;
}

/**
 * Restore student (Admin only)
 */
export const restoreStudent = async (studentId) => {
    console.log('♻️ Restoring student:', studentId);

    if (!isAdmin()) {
        throw new Error('Only admin can restore students');
    }

    const { data, error } = await supabase
        .from('users')
        .update({ is_active: true })
        .eq('id', studentId)
        .select()
        .single()

    if (error) {
        console.error('❌ Error restoring student:', error);
        throw error;
    }

    console.log('✅ Student restored:', data);
    return data;
}

/**
 * Permanently delete student from database (Admin only)
 */
export const permanentDeleteStudent = async (studentId) => {
    console.log('🗑️ Permanently deleting student:', studentId);

    if (!isAdmin()) {
        throw new Error('Only admin can permanently delete students');
    }

    const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('id', studentId)
        .select()
        .single()

    if (error) {
        console.error('❌ Error permanently deleting student:', error);
        throw error;
    }

    console.log('✅ Student permanently deleted:', data);
    return data;
}


/**
 * Update user's own password
 */
export const updateOwnPassword = async (userId, currentPassword, newPassword) => {
    console.log('🔐 Updating password for user:', userId);

    // Verify current password first
    const { data: user, error: verifyError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('password', currentPassword)
        .single()

    if (verifyError || !user) {
        throw new Error('Current password is incorrect');
    }

    // Update password
    const { data, error } = await supabase
        .from('users')
        .update({
            password: newPassword
        })
        .eq('id', userId)
        .select()
        .single()

    if (error) {
        console.error('❌ Error updating password:', error);
        throw error;
    }

    // Update localStorage
    localStorage.setItem('user', JSON.stringify(data));

    console.log('✅ Password updated successfully');
    return data;
}

/**
 * Update teacher's own password
 */
export const updateTeacherPassword = async (teacherId, currentPassword, newPassword) => {
    console.log('🔐 Updating password for teacher:', teacherId);

    // Verify current password first
    const { data: teacher, error: verifyError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
        .eq('password', currentPassword)
        .single()

    if (verifyError || !teacher) {
        throw new Error('Current password is incorrect');
    }

    // Update password
    const { data, error } = await supabase
        .from('teachers')
        .update({
            password: newPassword
        })
        .eq('id', teacherId)
        .select()
        .single()

    if (error) {
        console.error('❌ Error updating password:', error);
        throw error;
    }

    // Update localStorage
    const teacherData = { ...data, role: 'teacher' };
    localStorage.setItem('user', JSON.stringify(teacherData));

    console.log('✅ Teacher password updated successfully');
    return teacherData;
}

/**
 * Admin reset user password
 */
export const adminResetPassword = async (userId, newPassword) => {
    console.log('🔐 Admin resetting password for user:', userId);

    if (!isAdmin()) {
        throw new Error('Only admin can reset password');
    }

    const { data, error } = await supabase
        .from('users')
        .update({
            password: newPassword
        })
        .eq('id', userId)
        .select()
        .single()

    if (error) {
        console.error('❌ Error resetting password:', error);
        throw error;
    }

    console.log('✅ Password reset successfully');
    return data;
}

/**
 * Get user password (Admin only) - for viewing
 */
export const getUserPassword = async (userId) => {
    if (!isAdmin()) {
        throw new Error('Only admin can view password');
    }

    const { data, error } = await supabase
        .from('users')
        .select('password')
        .eq('id', userId)
        .single()

    if (error) throw error;
    return data;
}


/**
 * Login teacher/tutor
 */
export const teacherLogin = async (teacherId, password) => {
    console.log('🔐 Attempting teacher login for:', teacherId);

    try {
        // Try to login with teacher_id first (new format: TCHR0001)
        let query = supabase
            .from('teachers')
            .select('*')
            .eq('password', password)
            .eq('is_active', true);

        // Check if it's new format (TCHR) or old format (UUID)
        if (teacherId.startsWith('TCHR')) {
            query = query.eq('teacher_id', teacherId);
        } else {
            // Old format: try UUID
            query = query.eq('id', teacherId);
        }

        const { data, error } = await query.single();

        if (error) {
            console.error('❌ Teacher login error:', error);
            throw new Error('Invalid Teacher ID or password');
        }

        if (!data) {
            throw new Error('Teacher not found or inactive');
        }

        console.log('✅ Teacher login successful:', data);

        // Store in localStorage with role
        const teacherData = { ...data, role: 'teacher' };
        localStorage.setItem('user', JSON.stringify(teacherData));
        localStorage.setItem('teacherRemember', 'true'); // Remember teacher login

        return teacherData;
    } catch (err) {
        console.error('❌ Teacher login failed:', err);
        throw err;
    }
}

/**
 * Check if teacher is remembered (auto-login)
 */
export const isTeacherRemembered = () => {
    return localStorage.getItem('teacherRemember') === 'true';
}

/**
 * Clear teacher remember status
 */
export const clearTeacherRemember = () => {
    localStorage.removeItem('teacherRemember');
}
