# DeepFocus Mode & Record Cards - Complete Logic Documentation

This document provides a comprehensive breakdown of all working logics and mechanisms from the "Focus" app for reuse in a new application.

---

## Table of Contents
1. [DeepFocus Mode](#deepfocus-mode)
2. [Record Cards (Dashboard)](#record-cards-dashboard)
   - [TodayChart Card](#1-todaychart-card)
   - [WeekChart Card](#2-weekchart-card)
   - [MonthChart Card](#3-monthchart-card)
   - [OverallChart Card](#4-overallchart-card)
   - [RecentActivityCard](#5-recentactivitycard)
   - [StatsCards](#6-statscards)
   - [AddFocusRecordDialog](#7-addfocusrecorddialog)
3. [Core Timer Logic](#core-timer-logic)
4. [Session Recording Logic](#session-recording-logic)
5. [Data Models](#data-models)

---

## DeepFocus Mode

DeepFocus is an immersive fullscreen timer mode designed to minimize distractions.

### Entry Mechanism
```typescript
// Trigger from dashboard page
const handleEnterDeepFocus = () => {
  const element = document.documentElement;
  if (element.requestFullscreen) {
    element.requestFullscreen()
      .then(() => setDeepFocus(true))
      .catch(err => {
        console.error(`Fullscreen failed: ${err.message}`);
        setDeepFocus(true); // Fallback - enter without fullscreen
      });
  } else {
    setDeepFocus(true);
  }
};
```

### Exit Mechanism
```typescript
// Exit on Escape key or Back button
useEffect(() => {
  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      setDeepFocus(false);
    }
  };
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
}, []);

// Exit function
const handleExit = useCallback(() => {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(err => console.error(err));
  }
}, []);
```

### Key Features

#### 1. Wake Lock (Prevents Screen Sleep)
```typescript
// use-wakelock.ts
export const useWakeLock = () => {
  const [isSupported, setIsSupported] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  const request = useCallback(async () => {
    if (!isSupported || wakeLockRef.current) return;
    try {
      const lock = await navigator.wakeLock.request('screen');
      wakeLockRef.current = lock;
      lock.addEventListener('release', () => {
        wakeLockRef.current = null;
      });
    } catch (err: any) {
      console.warn(`Wake Lock request failed: ${err.message}`);
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    if (!wakeLockRef.current) return;
    await wakeLockRef.current.release();
    wakeLockRef.current = null;
  }, []);

  // Re-request on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (wakeLockRef.current && document.visibilityState === 'visible') {
        request();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [request]);

  return { isSupported, isLocked: !!wakeLockRef.current, request, release };
};
```

#### 2. Anti-Burn-In (Pixel Shifting)
```typescript
// Prevents OLED burn-in by slightly moving the display every 60 seconds
useEffect(() => {
  if (!antiBurnIn) return;
  const shiftPixel = () => {
    const maxJitter = window.innerWidth > 480 ? 20 : 10;
    const x = Math.floor(Math.random() * (maxJitter * 2 + 1)) - maxJitter;
    const y = Math.floor(Math.random() * (maxJitter * 2 + 1)) - maxJitter;
    pixelShiftControls.start({ x, y, transition: { duration: 1, ease: 'easeOut' } });
  };
  pixelShiftControls.set({ x: 0, y: 0 });
  const intervalId = setInterval(shiftPixel, 60000);
  return () => clearInterval(intervalId);
}, [pixelShiftControls, antiBurnIn]);
```

#### 3. Auto-Hiding Controls
```typescript
// use-floating-timer.ts
export const useFloatingTimer = (controlsAnimation: AnimationControls) => {
  const [controlsVisible, setControlsVisible] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dimTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showControls = useCallback(() => {
    setIsDimmed(false);
    setControlsVisible(true);
    controlsAnimation.start({ opacity: 1, y: 0 });
    
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (dimTimeoutRef.current) clearTimeout(dimTimeoutRef.current);

    // Hide controls after 3 seconds
    controlsTimeoutRef.current = setTimeout(() => {
      controlsAnimation.start({ opacity: 0, y: 10 })
        .then(() => setControlsVisible(false));
    }, 3000);

    // Dim display after 20 seconds
    dimTimeoutRef.current = setTimeout(() => {
      setIsDimmed(true);
    }, 20000);
  }, [controlsAnimation]);

  return { controlsVisible, isDimmed, showControls, handleExit };
};
```

#### 4. Keyboard Controls
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    showControls();
    if (e.key === ' ') { 
      e.preventDefault(); 
      isActive ? pause() : start(); 
    }
    if (e.key === 'Escape') { 
      handleExitWrapper(); 
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [showControls, isActive, pause, start]);
```

#### 5. Timer Display with Progress Ring
```typescript
// SVG path-based progress indicator
const progress = sessionDuration > 0 ? (sessionDuration - timeLeft) / sessionDuration : 0;
const strokeDashoffset = pathLength > 0 ? pathLength * (1 - progress) : 0;

// Time formatting
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${String(hours)}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
```

#### 6. Goal Progress Display
```typescript
// Shows daily goal progress in DeepFocus mode
const totalMinutes = todayRecord?.totalFocusMinutes || 0;
const goal = dailyGoal || 120;
const goalProgress = Math.min((totalMinutes / goal) * 100, 100);
```

---

## Record Cards (Dashboard)

### 1. TodayChart Card

**Purpose**: Displays today's focus activity with hourly breakdown.

**Key Logic**:
```typescript
// Data processing - aggregate sessions by hour
const hourlyChartData = useMemo(() => {
  const hourlyFocus = Array.from({ length: 24 }, (_, i) => ({
    time: `${String(i).padStart(2, '0')}:00`,
    minutes: 0,
  }));

  if (sessions) {
    sessions.forEach(session => {
      if (session.startTime && typeof session.duration === 'number') {
        const start = safeParseDate(session.startTime);
        const hour = start.getHours();
        hourlyFocus[hour].minutes += session.duration;
      }
    });
  }
  return hourlyFocus;
}, [sessions]);
```

**Features**:
- Editable daily goal via popover
- Bar chart with 24-hour breakdown
- Reference line for hourly goal target
- Stats cards (Today, This Week, Daily Goal %)

---

### 2. WeekChart Card

**Purpose**: Displays weekly focus activity with configurable week start day.

**Key Logic**:
```typescript
const weeklyRecords = useMemo(() => {
  if (!allRecords) return [];
  return allRecords.filter(r => {
    try {
      return isWithinInterval(safeParseDate(r.date), dateRanges.week);
    } catch {
      return false;
    }
  });
}, [allRecords, dateRanges.week]);

const weeklyTotal = useMemo(() => {
  return weeklyRecords.reduce((acc, record) => acc + (record.totalFocusMinutes || 0), 0);
}, [weeklyRecords]);

const dailyAverage = useMemo(() => {
  const daysWithData = weeklyRecords.filter(r => r.totalFocusMinutes > 0).length;
  return daysWithData > 0 ? Math.round(weeklyTotal / daysWithData) : 0;
}, [weeklyRecords, weeklyTotal]);
```

**Features**:
- Week start day selector (Sun-Sat pills)
- Total weekly hours and daily average
- Bar chart with goal reference line
- Gradient header with blue theme

---

### 3. MonthChart Card

**Purpose**: Displays monthly focus activity.

**Key Logic**:
```typescript
const monthlyRecords = useMemo(() => {
  if (!allRecords) return [];
  return allRecords.filter(r => {
    try {
      return isWithinInterval(safeParseDate(r.date), dateRanges.month);
    } catch {
      return false;
    }
  });
}, [allRecords, dateRanges.month]);

const monthlyTotal = useMemo(() => {
  return monthlyRecords.reduce((acc, record) => acc + (record.totalFocusMinutes || 0), 0);
}, [monthlyRecords]);
```

**Features**:
- Current month display (e.g., "December 2025")
- Total and daily average stats
- Bar chart with day-by-day breakdown
- Purple gradient header theme

---

### 4. OverallChart Card

**Purpose**: Lifetime statistics with customizable date range filter.

**Key Logic**:
```typescript
const [dateRange, setDateRange] = useState<DateRange | undefined>({
  from: subMonths(new Date(), 1),
  to: new Date(),
});

const { chartData, totalMinutesInRange, totalPomosInRange } = useMemo(() => {
  if (!allRecords) return { chartData: [], totalMinutesInRange: 0, totalPomosInRange: 0 };

  if (!dateRange || !dateRange.from || !dateRange.to) {
    const totalMinutes = allRecords.reduce((acc, r) => acc + (r.totalFocusMinutes || 0), 0);
    const totalPomos = allRecords.reduce((acc, r) => acc + (r.totalPomos || 0), 0);
    return { chartData: allRecords, totalMinutesInRange: totalMinutes, totalPomosInRange: totalPomos };
  }

  const filteredData = allRecords.filter(record => {
    try {
      return isWithinInterval(safeParseDate(record.date), { start: dateRange.from!, end: dateRange.to! });
    } catch {
      return false;
    }
  });

  return { 
    chartData: filteredData, 
    totalMinutesInRange: filteredData.reduce((acc, r) => acc + (r.totalFocusMinutes || 0), 0),
    totalPomosInRange: filteredData.reduce((acc, r) => acc + (r.totalPomos || 0), 0)
  };
}, [allRecords, dateRange]);

const lifetimeTotals = useMemo(() => {
  if (!allRecords) return { totalMinutes: 0, totalPomos: 0 };
  return {
    totalMinutes: allRecords.reduce((acc, r) => acc + r.totalFocusMinutes, 0),
    totalPomos: allRecords.reduce((acc, r) => acc + (r.totalPomos || 0), 0)
  };
}, [allRecords]);
```

**Features**:
- Date range picker
- Lifetime totals (focus time + pomodoros)
- Range-filtered stats
- Combined bar + scatter chart (minutes + pomos)
- Cyan-blue-purple gradient header

---

### 5. RecentActivityCard

**Purpose**: Shows the 5 most recent focus sessions for today.

**Key Logic**:
```typescript
function getSessionIcon(type: string) {
  if (type === 'manual') return Timer;
  if (type === 'pomodoro' || type === 'focusBlock') return Flame;
  return Clock;
}

function getSessionColor(type: string) {
  if (type === 'manual') return 'text-blue-500 bg-blue-500/10';
  if (type === 'pomodoro' || type === 'focusBlock') return 'text-orange-500 bg-orange-500/10';
  return 'text-primary bg-primary/10';
}

// Display each session
{sessions.slice(0, 5).map((session, index) => {
  const Icon = getSessionIcon(session.type);
  const colorClass = getSessionColor(session.type);
  return (
    <div className="...">
      <Icon className="w-4 h-4" />
      <p>{session.type === 'manual' ? 'Manual Entry' : session.type === 'focusBlock' ? 'Focus Block' : 'Pomodoro'}</p>
      <p>{formatDistanceToNow(safeParseDate(session.startTime), { addSuffix: true })}</p>
      <div>{Math.round(session.duration)}m</div>
    </div>
  );
})}
```

**Features**:
- Session type icons (Timer for manual, Flame for pomodoro)
- Color coding by type
- Relative time display ("2 hours ago")
- "Log" button to add manual sessions
- Empty state with call-to-action
- Green gradient header

---

### 6. StatsCards

**Purpose**: Summary statistics grid showing Today, This Week, and Daily Goal.

**Key Logic**:
```typescript
const totalMinutes = todayRecord?.totalFocusMinutes || 0;
const goal = dailyGoal || 120;
const goalProgress = Math.min((totalMinutes / goal) * 100, 100);

// Calculate Weekly Focus
const now = new Date();
const weekStart = startOfWeek(now, { weekStartsOn: 1 });
const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

const weeklyMinutes = allRecords.reduce((acc, record) => {
  const recordDate = parseISO(record.id);
  if (isWithinInterval(recordDate, { start: weekStart, end: weekEnd })) {
    return acc + (record.totalFocusMinutes || 0);
  }
  return acc;
}, 0);

// Duration formatter
const formatDuration = (minutes: number) => {
  if (isNaN(minutes) || minutes < 0) return '0h 0m';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
};
```

**Features**:
- 3-column responsive grid
- Icon-labeled stat items
- Color-coded icons (blue for today, purple for week, green for goal)
- Hover effects with subtle animations

---

### 7. AddFocusRecordDialog

**Purpose**: Modal for manually logging focus sessions.

**Key Logic**:
```typescript
// Form Schema (Zod)
const addRecordSchema = z.object({
  date: z.date(),
  hour: z.number().min(1).max(12),
  minute: z.number().min(0).max(59),
  ampm: z.enum(['am', 'pm']),
  duration: z.number().min(5).max(180),
});

// Quick duration presets
const QUICK_DURATIONS = [15, 25, 30, 45, 60, 90];

// Firebase transaction for atomic writes
async function logFocusRecord(data: AddRecordFormValues) {
  let hour24 = data.hour;
  if (data.ampm === 'pm' && data.hour < 12) hour24 += 12;
  if (data.ampm === 'am' && data.hour === 12) hour24 = 0;

  const dateWithTime = set(data.date, { hours: hour24, minutes: data.minute, seconds: 0 });
  const dateString = format(dateWithTime, 'yyyy-MM-dd');

  await runTransaction(firestore, async (transaction) => {
    const recordSnap = await transaction.get(focusRecordRef);
    const currentData = recordSnap.data() || { totalFocusMinutes: 0, totalPomos: 0 };
    const newTotalFocusMinutes = currentData.totalFocusMinutes + data.duration;
    const isPomodoro = data.duration >= 25;
    const newTotalPomos = currentData.totalPomos + (isPomodoro ? 1 : 0);

    // Create session document
    transaction.set(newSessionRef, {
      id: newSessionRef.id,
      focusRecordId: focusRecordRef.id,
      startTime: Timestamp.fromDate(dateWithTime),
      endTime: Timestamp.fromDate(new Date(dateWithTime.getTime() + data.duration * 60000)),
      duration: data.duration,
      type: 'manual',
      completed: true,
    });

    // Update daily totals
    transaction.set(focusRecordRef, {
      id: dateString,
      date: dateString,
      userId: user.uid,
      totalFocusMinutes: newTotalFocusMinutes,
      totalPomos: newTotalPomos
    }, { merge: true });
  });
}
```

**Features**:
- Date picker (can't select future dates)
- 12-hour time picker with AM/PM toggle
- Quick duration buttons (15, 25, 30, 45, 60, 90 min)
- Duration slider (5-180 minutes, 5-min steps)
- +/- buttons for fine adjustment
- Loading state during submission
- Toast notifications for success/error

---

## Core Timer Logic

### Timer State (Zustand Store)
```typescript
type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

type TimerState = {
  mode: TimerMode;
  timeLeft: number;
  isActive: boolean;
  pomodorosCompleted: number;
  sessionStartTime: number | null;
  sessionDuration: number;
  isSaving: boolean;
  pomodoroDuration: number;     // default 25 * 60
  shortBreakDuration: number;   // default 5 * 60
  longBreakDuration: number;    // default 15 * 60
  antiBurnIn: boolean;
};
```

### Timer Actions
```typescript
const actions = {
  setMode: (mode) => {
    const initialTime = getInitialTime(mode);
    set({ mode, isActive: false, timeLeft: initialTime, sessionDuration: initialTime, sessionStartTime: null });
  },
  
  start: (startTime) => set(state => ({ 
    isActive: true, 
    sessionStartTime: state.sessionStartTime ?? startTime 
  })),
  
  pause: () => set({ isActive: false }),
  
  reset: () => set(state => {
    const initialTime = getInitialTime(state.mode);
    return { isActive: false, timeLeft: initialTime, sessionDuration: initialTime, sessionStartTime: null };
  }),
  
  tick: (decrement) => set(state => ({ 
    timeLeft: Math.max(0, state.timeLeft - decrement) 
  })),
  
  completeCycle: () => {
    const { mode, pomodorosCompleted } = get();
    if (mode === 'pomodoro') {
      const newPomos = pomodorosCompleted + 1;
      set({ pomodorosCompleted: newPomos, isActive: false });
      get().setMode(newPomos % 4 === 0 ? 'longBreak' : 'shortBreak');
    } else {
      set({ isActive: false });
      get().setMode('pomodoro');
    }
  },
  
  addTime: (seconds) => set(state => ({ 
    timeLeft: state.timeLeft + seconds, 
    sessionDuration: state.sessionDuration + seconds 
  })),
  
  subtractTime: (seconds) => set(state => ({ 
    timeLeft: Math.max(0, state.timeLeft - seconds), 
    sessionDuration: Math.max(0, state.sessionDuration - seconds) 
  })),
  
  setSessionTime: (seconds) => set({ timeLeft: seconds, sessionDuration: seconds }),
};
```

### Timer Hook with requestAnimationFrame
```typescript
export const useTimer = () => {
  const lastTickTimeRef = useRef<number | null>(null);
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      lastTickTimeRef.current = null;
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
      return;
    }

    const runTick = (timestamp: number) => {
      if (!lastTickTimeRef.current) lastTickTimeRef.current = timestamp;
      const elapsed = timestamp - lastTickTimeRef.current;

      if (elapsed >= 1000) {
        const secondsElapsed = Math.floor(elapsed / 1000);
        tick(secondsElapsed);
        lastTickTimeRef.current = timestamp - (elapsed % 1000);
      }

      const state = useTimerStore.getState();
      if (state.timeLeft > 0 && state.isActive) {
        frameIdRef.current = requestAnimationFrame(runTick);
      }
    };

    if (timeLeft > 0) frameIdRef.current = requestAnimationFrame(runTick);
    return () => { if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current); };
  }, [isActive, tick, timeLeft]);
};
```

---

## Session Recording Logic

### Record Session to Firebase
```typescript
const recordSession = useCallback(async (sessionStartTime, mode, isCompletion) => {
  if (!user || user.isAnonymous || !firestore || !sessionStartTime) return false;

  const durationInMinutes = (Date.now() - sessionStartTime) / (1000 * 60);
  if (durationInMinutes < 0.1) return false; // Skip very short sessions

  // Offline support - queue for later
  if (!navigator.onLine) {
    addPendingSession({
      userId: user.uid,
      sessionStartTime,
      endTime: Date.now(),
      durationMinutes: durationInMinutes,
      type: mode,
      completed: isCompletion,
    });
    return true;
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const batch = writeBatch(firestore);

  // Create session document
  batch.set(newSessionRef, {
    id: newSessionRef.id,
    focusRecordId: focusRecordRef.id,
    startTime: Timestamp.fromDate(new Date(sessionStartTime)),
    endTime: Timestamp.fromDate(new Date()),
    duration: durationInMinutes,
    type: mode,
    completed: isCompletion,
  });

  // Update daily totals with atomic increment
  const updateData = {
    id: today,
    date: today,
    userId: user.uid,
  };
  if (mode === 'pomodoro') {
    updateData.totalFocusMinutes = increment(durationInMinutes);
    if (isCompletion) {
      updateData.totalPomos = increment(1);
    }
  }
  batch.set(focusRecordRef, updateData, { merge: true });

  await batch.commit();
  return true;
}, [user, firestore]);
```

---

## Data Models

### Firestore Structure
```
users/
  {userId}/
    focusRecords/
      {dateString}/           # e.g., "2025-12-30"
        id: string
        date: string
        userId: string
        totalFocusMinutes: number
        totalPomos: number
        
        sessions/
          {sessionId}/
            id: string
            focusRecordId: string
            startTime: Timestamp
            endTime: Timestamp
            duration: number      # in minutes
            type: 'pomodoro' | 'shortBreak' | 'longBreak' | 'manual'
            completed: boolean
```

### Utility Function: Safe Date Parsing
```typescript
function safeParseDate(date: any): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'string') return parseISO(date);
  if (date.toDate && typeof date.toDate === 'function') return date.toDate();
  if (date.seconds) return new Date(date.seconds * 1000);
  return new Date();
}
```

### Utility Function: Duration Formatting
```typescript
function formatDuration(minutes: number) {
  if (isNaN(minutes) || minutes < 0) return '0h 0m';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}
```

---

## Key Dependencies Used

| Package | Purpose |
|---------|---------|
| `zustand` | Timer state management |
| `framer-motion` | Animations (controls fade, pixel shift) |
| `date-fns` | Date manipulation and formatting |
| `recharts` | Charts (Bar, Composed, CartesianGrid) |
| `react-hook-form` | Form handling (AddFocusRecord) |
| `zod` | Form validation schema |
| `firebase/firestore` | Data storage |
| `lucide-react` | Icons |

---

> **Note**: All code snippets are extracted from the original Focus app and simplified for documentation purposes. Adapt as needed for your new application's architecture.
