# EYSA Booking System - Design Document

**Version:** 1.0  
**Date:** March 28, 2026  
**Status:** Active Development

---

## 🎨 System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EYSA BOOKING SYSTEM                       │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                         │
│                      (React + Vite)                          │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Admin    │  │  Student   │  │  Teacher   │            │
│  │ Dashboard  │  │ Dashboard  │  │ Dashboard  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                               │
│  ┌────────────────────────────────────────────────┐         │
│  │         Context API (State Management)          │         │
│  │  - WeekContext  - AuthContext  - ThemeContext  │         │
│  └────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                            │
│                   (Supabase BaaS)                            │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐         │
│  │           PostgreSQL Database                   │         │
│  │  - users  - students  - teachers  - classes    │         │
│  │  - schedules  - bookings  - attendance         │         │
│  │  - settings                                     │         │
│  └────────────────────────────────────────────────┘         │
│                                                               │
│  ┌────────────────────────────────────────────────┐         │
│  │           RPC Functions                         │         │
│  │  - reset_batch()  - increment_week()           │         │
│  │  - api_increment_week()  - copy_week()         │         │
│  └────────────────────────────────────────────────┘         │
│                                                               │
│  ┌────────────────────────────────────────────────┐         │
│  │           Row Level Security (RLS)              │         │
│  │  - Role-based access control                   │         │
│  └────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    AUTOMATION LAYER                           │
│                   (GitHub Actions)                           │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐         │
│  │      Auto-Increment Week (Cron Job)            │         │
│  │  Schedule: Every Monday 00:01 WIB              │         │
│  │  Action: Call api_increment_week()             │         │
│  └────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Design

### Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐
│   users     │         │  students   │
├─────────────┤         ├─────────────┤
│ id (PK)     │         │ id (PK)     │
│ username    │         │ student_id  │
│ password    │         │ full_name   │
│ role        │         │ batch       │
│ full_name   │         │ program     │
│ is_active   │         │ level       │
└─────────────┘         │ password    │
                        │ is_active   │
                        └─────────────┘
                               │
                               │ 1:N
                               ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  teachers   │         │  bookings   │         │  schedules  │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ id (PK)     │         │ id (PK)     │         │ id (PK)     │
│ teacher_id  │         │ student_id  │◄────────│ program     │
│ name        │         │ schedule_id │────────►│ level       │
│ password    │         │ status      │         │ phase       │
│ is_active   │         │ booked_at   │         │ day         │
└─────────────┘         └─────────────┘         │ time_slot   │
       │                                         │ class_name  │
       │ 1:N                                     │ week_number │
       │                                         │ year        │
       │                                         │ batch       │
       │                                         │ teacher_id  │
       │                                         │ current_st. │
       │                                         │ max_cap.    │
       └────────────────────────────────────────┤ (FK)        │
                                                 └─────────────┘
                                                        │
                                                        │ 1:N
                                                        ▼
                                                 ┌─────────────┐
                                                 │ attendance  │
                                                 ├─────────────┤
                                                 │ id (PK)     │
                                                 │ student_id  │
                                                 │ schedule_id │
                                                 │ status      │
                                                 │ week_number │
                                                 │ submitted_at│
                                                 │ submitted_by│
                                                 └─────────────┘

┌─────────────┐         ┌─────────────┐
│  classes    │         │  settings   │
├─────────────┤         ├─────────────┤
│ id (PK)     │         │ id (PK)     │
│ class_name  │         │ current_week│
│ max_capacity│         │ updated_at  │
└─────────────┘         └─────────────┘
```

### Key Relationships

1. **Students → Bookings** (1:N)
   - One student can have multiple bookings
   - Each booking belongs to one student

2. **Schedules → Bookings** (1:N)
   - One schedule can have multiple bookings
   - Each booking belongs to one schedule

3. **Teachers → Schedules** (1:N)
   - One teacher can be assigned to multiple schedules
   - Each schedule can have one teacher (optional)

4. **Schedules → Attendance** (1:N)
   - One schedule can have multiple attendance records
   - Each attendance record belongs to one schedule

5. **Students → Attendance** (1:N)
   - One student can have multiple attendance records
   - Each attendance record belongs to one student

---

## 🔐 Security Design

### Authentication Flow

```
┌─────────────┐
│   User      │
│  (Browser)  │
└─────────────┘
       │
       │ 1. Enter credentials
       ▼
┌─────────────┐
│   Login     │
│   Page      │
└─────────────┘
       │
       │ 2. Submit login
       ▼
┌─────────────┐
│  Supabase   │
│   Auth      │
└─────────────┘
       │
       │ 3. Verify credentials
       │    (username/password)
       ▼
┌─────────────┐
│  Database   │
│   Query     │
└─────────────┘
       │
       │ 4. Return user data + role
       ▼
┌─────────────┐
│  Frontend   │
│  (Context)  │
└─────────────┘
       │
       │ 5. Store in AuthContext
       │    - user data
       │    - role (admin/student/teacher)
       ▼
┌─────────────┐
│  Dashboard  │
│  (Role-based)│
└─────────────┘
```

### Authorization (RLS Policies)

#### Students Table
```sql
-- Students can only read their own data
CREATE POLICY "Students can view own data"
ON students FOR SELECT
USING (auth.uid() = id);

-- Admins can do everything
CREATE POLICY "Admins can do everything"
ON students FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');
```

#### Bookings Table
```sql
-- Students can only view/create/cancel their own bookings
CREATE POLICY "Students can manage own bookings"
ON bookings FOR ALL
USING (student_id = auth.uid());

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
ON bookings FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');
```

#### Attendance Table
```sql
-- Teachers can submit/edit attendance for their schedules
CREATE POLICY "Teachers can manage attendance"
ON attendance FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM schedules
    WHERE schedules.id = attendance.schedule_id
    AND schedules.teacher_id = auth.uid()
  )
);

-- Admins can view all attendance
CREATE POLICY "Admins can view all attendance"
ON attendance FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 🎯 Business Logic Design

### Booking Validation Flow

```
┌─────────────────────────────────────────────────────────────┐
│              STUDENT BOOKING VALIDATION                      │
└─────────────────────────────────────────────────────────────┘

Student clicks "Book Now"
         │
         ▼
┌─────────────────────┐
│ Check Phase Rule    │ ◄── Rule: 1 booking per phase per week
│ (Frontend)          │
└─────────────────────┘
         │
         │ ✅ Pass
         ▼
┌─────────────────────┐
│ Check Capacity      │ ◄── Rule: current_students < max_capacity
│ (Frontend)          │
└─────────────────────┘
         │
         │ ✅ Pass
         ▼
┌─────────────────────┐
│ Check Room          │ ◄── Rule: Room not used by other program
│ Exclusivity         │     at same time
│ (Frontend)          │
└─────────────────────┘
         │
         │ ✅ Pass
         ▼
┌─────────────────────┐
│ Submit Booking      │
│ (API Call)          │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Database Insert     │ ◄── Transaction:
│ (Backend)           │     1. Insert booking
│                     │     2. Increment current_students
└─────────────────────┘
         │
         │ ✅ Success
         ▼
┌─────────────────────┐
│ Return Success      │
│ + Refresh UI        │
└─────────────────────┘
```

### Week Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  WEEK MANAGEMENT SYSTEM                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   Database       │
│   settings       │
│   current_week   │ ◄─────────────┐
└──────────────────┘                │
         ▲                          │
         │                          │
         │ fetch                    │ update
         │                          │
         ▼                          │
┌──────────────────┐         ┌─────────────────┐
│  WeekContext     │         │  Auto Increment │
│  (Frontend)      │         │  (GitHub Actions)│
└──────────────────┘         └─────────────────┘
         │                          ▲
         │                          │
         ▼                          │
┌──────────────────┐                │
│  All Components  │         Every Monday 00:01 WIB
│  - AdminDashboard│
│  - BookingSystem │
│  - Attendance    │
└──────────────────┘

Manual Increment:
Admin → Next Week Button → incrementWeek() → Database

Auto Increment:
GitHub Actions (Cron) → API Function → Database

Reset Batch:
Admin → Reset Batch → reset_batch() → Week = 1
```

---

## 🎨 UI/UX Design

### Component Hierarchy

```
App
├── AuthContext
│   └── WeekContext
│       └── ThemeContext
│           ├── Login
│           │   ├── AdminLogin
│           │   ├── StudentLogin
│           │   └── TeacherLogin
│           │
│           ├── AdminDashboard
│           │   ├── Header (with Next Week button)
│           │   ├── StatsCards
│           │   ├── StudentManagement
│           │   │   ├── StudentList
│           │   │   ├── CreateStudent
│           │   │   └── EditStudent
│           │   ├── TeacherManagement
│           │   ├── ScheduleManagement
│           │   ├── AttendanceReporting
│           │   │   └── ExcelExport
│           │   └── BulkOperations
│           │       ├── BulkImportStudents
│           │       └── BulkImportAttendance
│           │
│           ├── StudentDashboard
│           │   ├── Header
│           │   ├── NewBooking
│           │   │   ├── ProgramSelector
│           │   │   ├── LevelSelector
│           │   │   ├── ScheduleList
│           │   │   └── BookButton
│           │   └── MyBookings
│           │       ├── BookingCard
│           │       └── CancelButton
│           │
│           └── TeacherDashboard
│               ├── Header
│               └── AttendanceManager
│                   ├── ScheduleSelector
│                   ├── StudentList
│                   ├── AttendanceToggle
│                   └── SubmitButton
```

### Design Patterns

#### 1. Context API Pattern
```javascript
// WeekContext.jsx
export const WeekContext = createContext();

export const WeekProvider = ({ children }) => {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentWeek();
  }, []);

  const fetchCurrentWeek = async () => {
    const week = await getCurrentWeek();
    setCurrentWeek(week);
    setLoading(false);
  };

  const incrementWeek = async () => {
    await incrementCurrentWeek();
    await fetchCurrentWeek();
  };

  return (
    <WeekContext.Provider value={{ currentWeek, loading, incrementWeek }}>
      {children}
    </WeekContext.Provider>
  );
};

export const useWeek = () => useContext(WeekContext);
```

#### 2. Custom Hook Pattern
```javascript
// useModalScrollLock.js
export const useModalScrollLock = (isOpen) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
};
```

#### 3. Error Boundary Pattern
```javascript
// ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

---

## 📊 Data Flow Design

### Booking Flow

```
┌─────────────┐
│   Student   │
│   (UI)      │
└─────────────┘
       │
       │ 1. Select schedule
       ▼
┌─────────────┐
│  Validation │
│  (Frontend) │
└─────────────┘
       │
       │ 2. Check rules
       ▼
┌─────────────┐
│  API Call   │
│  (Supabase) │
└─────────────┘
       │
       │ 3. Insert booking
       ▼
┌─────────────┐
│  Database   │
│  Transaction│
└─────────────┘
       │
       │ 4. Update counter
       ▼
┌─────────────┐
│  Response   │
│  (Success)  │
└─────────────┘
       │
       │ 5. Refresh UI
       ▼
┌─────────────┐
│  My Bookings│
│  (Updated)  │
└─────────────┘
```

### Attendance Flow

```
┌─────────────┐
│   Teacher   │
│   (UI)      │
└─────────────┘
       │
       │ 1. Select schedule
       ▼
┌─────────────┐
│  Fetch      │
│  Students   │
└─────────────┘
       │
       │ 2. Display list
       ▼
┌─────────────┐
│  Mark       │
│  Attendance │
└─────────────┘
       │
       │ 3. Submit
       ▼
┌─────────────┐
│  Validation │
│  (All marked)│
└─────────────┘
       │
       │ 4. Batch insert
       ▼
┌─────────────┐
│  Database   │
│  (Attendance)│
└─────────────┘
       │
       │ 5. Success
       ▼
┌─────────────┐
│  Admin      │
│  Report     │
└─────────────┘
```

---

## 🚀 Deployment Design

### CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT PIPELINE                       │
└─────────────────────────────────────────────────────────────┘

Developer
    │
    │ git push
    ▼
┌─────────────┐
│   GitHub    │
│   Repo      │
└─────────────┘
    │
    │ webhook
    ▼
┌─────────────┐
│   Netlify   │
│   Build     │
└─────────────┘
    │
    │ 1. npm install
    │ 2. npm run build
    │ 3. Deploy dist/
    ▼
┌─────────────┐
│  Production │
│   (Live)    │
└─────────────┘

Parallel:
┌─────────────┐
│   GitHub    │
│   Actions   │
└─────────────┘
    │
    │ Cron: Mon 00:01 WIB
    ▼
┌─────────────┐
│  Supabase   │
│  API Call   │
└─────────────┘
    │
    │ increment_week()
    ▼
┌─────────────┐
│  Database   │
│  (Updated)  │
└─────────────┘
```

### Environment Configuration

#### Development
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
NODE_ENV=development
```

#### Production
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
NODE_ENV=production
```

#### GitHub Secrets
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_API_KEY=your-secret-api-key
```

---

## 🔧 Technical Decisions

### Why React + Vite?
- Fast development with HMR
- Modern build tool
- Better performance than CRA
- Smaller bundle size

### Why Supabase?
- PostgreSQL (powerful relational DB)
- Built-in authentication
- Row Level Security (RLS)
- Real-time subscriptions
- Free tier generous
- Easy to use

### Why Context API (not Redux)?
- Simpler for small-medium apps
- No additional dependencies
- Built-in React feature
- Sufficient for our use case

### Why GitHub Actions (not pg_cron)?
- FREE (pg_cron requires Pro plan $25/month)
- Easy to setup
- Reliable
- Good logging
- Can run manual tests

### Why Netlify?
- FREE for static sites
- Auto-deploy from GitHub
- CDN included
- Easy custom domain
- Good performance

---

## 📈 Scalability Considerations

### Current Capacity
- Students: ~500 per batch
- Schedules: ~100 per week
- Bookings: ~500 per week
- Attendance: ~500 per week

### Future Scaling
If system grows beyond current capacity:

1. **Database Optimization**
   - Add indexes on frequently queried columns
   - Implement database partitioning
   - Use materialized views for reports

2. **Caching**
   - Implement Redis for frequently accessed data
   - Cache schedule availability
   - Cache attendance reports

3. **Load Balancing**
   - Use Supabase connection pooling
   - Implement rate limiting
   - Use CDN for static assets

4. **Monitoring**
   - Setup error tracking (Sentry)
   - Monitor database performance
   - Track API response times

---

## 🧪 Testing Strategy

### Unit Tests
- Test individual functions
- Test validation logic
- Test business rules
- Coverage target: 80%

### Integration Tests
- Test API calls
- Test database operations
- Test authentication flow
- Coverage target: 70%

### E2E Tests
- Test complete user journeys
- Test critical paths
- Test error scenarios
- Coverage target: 60%

### Manual Testing
- QA testing with real users
- User acceptance testing
- Exploratory testing
- Bug bash sessions

**Reference:** `QA_TESTING_COMPREHENSIVE_GUIDE.md`

---

## 📝 Design Principles

### 1. Simplicity
- Keep UI clean and intuitive
- Minimize clicks to complete tasks
- Clear error messages
- Consistent design patterns

### 2. Performance
- Fast page loads
- Optimized database queries
- Lazy loading components
- Efficient state management

### 3. Security
- Input validation
- SQL injection prevention
- XSS prevention
- CSRF protection
- Secure authentication

### 4. Maintainability
- Clean code structure
- Component reusability
- Clear naming conventions
- Comprehensive documentation

### 5. Accessibility
- Keyboard navigation
- Screen reader support
- Color contrast
- Responsive design

---

## 🎯 Success Metrics

### User Metrics
- Login success rate > 99%
- Booking success rate > 95%
- Attendance submission rate > 90%
- User satisfaction score > 4/5

### Technical Metrics
- Page load time < 2s
- API response time < 500ms
- Error rate < 1%
- Uptime > 99.9%

### Business Metrics
- Student enrollment growth
- Class utilization rate
- Attendance rate
- Admin time saved

---

**Document Owner:** Development Team  
**Last Updated:** March 28, 2026  
**Status:** Living Document
