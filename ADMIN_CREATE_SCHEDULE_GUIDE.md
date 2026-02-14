# Admin Create Schedule Guide

## Overview
Admin can now create new schedules for students to book. This solves the problem of empty schedules (0/10) cluttering the dashboard.

## How It Works

### 1. Create Schedule (Admin)
1. Click **"New"** button in admin dashboard header (orange button with calendar icon)
2. Fill in the form:
   - **Class** (required): Select from dropdown (Oxford, Harvard, etc.)
   - **Phase**: Phase 1 (I1), Phase 2 (I2), or Recap (RC)
   - **Day**: Monday - Sunday
   - **Time**: Morning, Afternoon, or Evening
   - **Week** (required): Week number (auto-filled with current/next week)
   - **Batch** (optional): A, B, C, etc.
   - **Teacher** (optional): Select from dropdown
3. Click **"Create Schedule"**
4. Schedule is created with 0 students

### 2. Students Book (Student Dashboard)
1. Students see the new schedule in their dashboard
2. Students click **"Book Now"**
3. Schedule becomes 1/10, 2/10, etc.

### 3. Admin Manages (Admin Dashboard)
- View all schedules (with students)
- Add students manually
- Move students between schedules
- Assign teachers
- Delete students

## Features Added

### Admin Dashboard
- **"New" button** in header (next to Refresh button)
- **Create Schedule Modal** with form validation
- **Hide Empty toggle** (👁️ Active / 👁️‍🗨️ All) - hide/show empty schedules
- **Auto-validation**: Prevents duplicate schedules (same class, day, time, phase, week)

### Database Protection
- **unique_schedule_combination** constraint prevents duplicates
- **check_schedule_capacity** trigger prevents over-capacity (max 10)
- **update_schedule_student_count** trigger auto-updates student count

## Workflow Example

**Scenario: Admin wants to create Oxford Class Monday Phase1 for Week 8**

1. Admin clicks "New" button
2. Fills form:
   - Class: Oxford Class
   - Phase: Phase 1 (I1)
   - Day: Monday
   - Time: Evening (19:00-20:30)
   - Week: 8
   - Batch: A
   - Teacher: Miss Feby
3. Clicks "Create Schedule"
4. Schedule appears in admin dashboard (0/10)
5. Students see schedule in their dashboard
6. Student "Catharina" books → Schedule becomes 1/10
7. Student "Brian" books → Schedule becomes 2/10
8. Admin can add more students manually if needed

## Cleaning Up Empty Schedules

If you have many empty schedules (0/10) from before:

### Option 1: Delete Empty Schedules (Recommended)
Run `DELETE_EMPTY_SCHEDULES.sql` to remove all schedules with 0 students.

### Option 2: Hide Empty Schedules
Click the **"👁️ Active"** toggle in admin dashboard to hide empty schedules temporarily.

## Error Messages

- **"Schedule already exists!"** - Same class, day, time, phase, and week already exists
- **"Please fill in all required fields!"** - Class or Week is missing
- **"Failed to create schedule"** - Database error (check console)

## Best Practices

1. **Create schedules as needed** - Don't create all possible schedules upfront
2. **Let students book first** - Students can choose their preferred schedule
3. **Use batch field** - Helps organize multiple sections of same class
4. **Assign teachers** - Can be done during creation or later
5. **Clean up regularly** - Delete empty schedules that students don't want

## Technical Details

### Database Schema
```sql
schedules (
  id uuid PRIMARY KEY,
  class_id uuid REFERENCES classes(id),
  phase text,
  day text,
  time_slot text,
  week_number integer,
  year integer,
  batch text,
  teacher_id uuid REFERENCES teachers(id),
  current_students integer DEFAULT 0
)
```

### Constraints
- `unique_schedule_combination`: Prevents duplicate schedules
- `check_schedule_capacity`: Max 10 students per schedule

### Triggers
- `update_schedule_student_count`: Auto-updates current_students when bookings change
- `check_schedule_capacity`: Prevents booking when full

## Troubleshooting

**Q: Why can't I create a schedule?**
A: Check if the same schedule already exists (same class, day, time, phase, week).

**Q: Students can't see my schedule?**
A: Make sure the week number matches the current or next week in student dashboard.

**Q: How do I delete a schedule?**
A: Currently, you need to delete all bookings first, then the schedule will show 0/10. You can then delete it from database or use the DELETE_EMPTY_SCHEDULES.sql script.

**Q: Can I create schedules for past weeks?**
A: Yes, but students won't see them in their dashboard (only shows current/next week).

## Related Files
- `AdminBookingDashboard.jsx` - Admin dashboard with create schedule feature
- `BookingDashboard.jsx` - Student dashboard with booking feature
- `DELETE_EMPTY_SCHEDULES.sql` - Script to clean up empty schedules
- `SAFE_PROTECTION_ONLY.sql` - Database protection triggers
