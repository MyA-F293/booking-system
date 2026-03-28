# Fix Week Display Inconsistency

## Problem:
After reset batch, admin dashboard showed inconsistent week numbers:
- Header: "Batch 1 | Week 2" ✅ (database week)
- Statistics Dashboard: "Week 14, 2026" ❌ (ISO week)

## Root Cause:
Some components still used `getCurrentWeek()` (ISO week) instead of `useWeek()` hook (database week).

## Components Fixed:
1. ✅ AdminStatsDashboard - Changed to use `useWeek()` hook
2. ✅ BookingSystemDB - Changed to use `useWeek()` hook
3. ✅ AdminBookingDashboard - Changed to use `useWeek()` hook
4. ✅ AttendanceReportExcel - Changed to use `useWeek()` hook
5. ✅ BookingDashboard - Changed to use `useWeek()` hook
6. ✅ TeacherDashboard - Changed to use `useWeek()` hook

## Changes Made:
- Import `useWeek` from `../contexts/WeekContext`
- Remove `getCurrentWeek` from imports
- Replace `const currentWeek = getCurrentWeek()` with `const { currentWeek } = useWeek()`

## Result:
All components now display database week consistently (Week 1-8 relative to batch start).

## Test:
1. Refresh localhost:5173
2. Check admin dashboard header: Should show "Week 2"
3. Check Statistics Dashboard: Should show "Week 2, 2026" (not Week 14)
4. All week displays should be consistent across all pages
