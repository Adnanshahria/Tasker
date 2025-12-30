# FocusFlow App - Complete Feature Extraction

This document comprehensively lists all features from the Focus app (micro to macro level) for integration into your new app with Firebase and login authentication.

---

## 🏗️ Architecture Overview

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15.3 (App Router) |
| State Management | Zustand with persist middleware |
| Backend | Firebase (Auth, Firestore) |
| Styling | Tailwind CSS + Radix UI |
| Animations | Framer Motion |
| Charts | Recharts |
| Audio | Tone.js |
| AI | Genkit + Google GenAI |
| Forms | React Hook Form + Zod |

---

## 🎯 Core Features (Macro Level)

### 1. Pomodoro & Countdown Timer Engine
**Files**: `src/hooks/use-timer.ts`, `src/store/timer-store.ts`, `src/store/timer-actions.ts`

| Feature | Description |
|---------|-------------|
| Timer Modes | Pomodoro (focus), Short Break, Long Break |
| Custom Durations | Configurable pomodoro/break durations |
| Add/Subtract Time | On-the-fly time adjustment (±3 min) |
| Custom Session Time | Set arbitrary timer duration |
| Auto Cycle | After 4 pomodoros → long break, else → short break |
| requestAnimationFrame | High-precision tick using RAF loop |
| Optimistic Updates | UI resets instantly, background Firestore write |
| State Persistence | Zustand persist to localStorage |

```typescript
// Key state properties
mode: 'pomodoro' | 'shortBreak' | 'longBreak'
timeLeft: number // seconds
isActive: boolean
pomodorosCompleted: number
sessionStartTime: number | null
sessionDuration: number
```

---

### 2. Floating Timer / Deep Focus Mode (Anti-Burn-in)
**Files**: `src/components/timer/floating-timer.tsx`, `src/hooks/use-floating-timer.ts`

| Feature | Description |
|---------|-------------|
| Fullscreen Mode | `document.requestFullscreen()` for distraction-free focus |
| Anti-Burn-in Pixel Shift | Timer position shifts randomly every 60s (±20px) |
| Auto-dimming | Timer dims to 30% opacity after 20s of inactivity |
| Auto-hide Controls | Controls fade out after 3s, reappear on interaction |
| Keyboard Shortcuts | Space = play/pause, Escape = exit |
| Wake Lock API | Screen stays on during focus session |
| AMOLED Black Background | Pure `#000000` for energy efficiency |

---

### 3. Wake Lock (Screen Keep-Alive)
**File**: `src/hooks/use-wakelock.ts`

| Feature | Description |
|---------|-------------|
| Screen Wake Lock API | Prevents screen from sleeping |
| Auto Re-acquire | Re-requests lock when tab becomes visible |
| Browser Support Check | Graceful fallback if unsupported |

---

### 4. Audio Alerts
**File**: `src/hooks/use-audio-alert.ts`

| Feature | Description |
|---------|-------------|
| Synthesized Beep | Uses Tone.js (no audio file needed) |
| Sine Wave at C5 | Clean, non-intrusive sound |
| 3-second Fade Out | Gentle release envelope |
| User Gesture Unlock | `Tone.start()` on first interaction |

---

### 5. Session Recording & Analytics
**File**: `src/hooks/use-session-recorder.ts`

| Feature | Description |
|---------|-------------|
| Automatic Recording | Sessions saved on completion or manual stop |
| Firestore Batch Write | Atomic write of session + daily totals |
| Duration Tracking | Start time, end time, duration in minutes |
| Session Type | `'pomodoro'`, `'shortBreak'`, `'longBreak'`, `'manual'` |
| Completion Status | Whether timer ran to zero or stopped early |
| Daily Aggregates | `totalFocusMinutes`, `totalPomos` with atomic increment |
| Minimum Duration Filter | Ignores sessions < 0.1 min (accidental) |

**Firestore Schema**:
```
users/{userId}/focusRecords/{YYYY-MM-DD}/
  ├── id, date, userId
  ├── totalFocusMinutes
  ├── totalPomos
  └── sessions/{sessionId}/
      ├── startTime, endTime (Timestamp)
      ├── duration (minutes)
      ├── type, completed
```

---

### 6. Offline-First with Pending Sync
**Files**: `src/hooks/use-offline-status.ts`, `src/hooks/use-pending-sync.ts`, `src/lib/pending-sessions.ts`

| Feature | Description |
|---------|-------------|
| Network Detection | `navigator.onLine` + event listeners |
| Offline Indicator UI | Visual feedback when offline |
| Session Queuing | Queue sessions in localStorage when offline |
| Auto Sync on Reconnect | Syncs pending sessions after 1s stability |
| Per-User Queue | Filters sessions by userId before sync |
| Graceful Fallback | If write fails mid-request, queue for later |

---

### 7. User Preferences (Settings)
**File**: `src/hooks/use-user-preferences.tsx`

| Setting | Type | Default |
|---------|------|---------|
| Pomodoro Duration | seconds | 1500 (25 min) |
| Short Break Duration | seconds | 300 (5 min) |
| Long Break Duration | seconds | 900 (15 min) |
| Week Starts On | 0-6 | 1 (Monday) |
| Daily Goal | minutes | 120 (2 hours) |
| Anti-Burn-in | boolean | true |
| Theme | 'light' / 'dark' | - |

| Feature | Description |
|---------|-------------|
| Local-First | Always saves to localStorage first |
| Firestore Sync | Non-blocking write to Firestore for logged-in users |
| Auth Prompt | Shows login dialog if anonymous user tries to save |
| Merge Strategy | Firestore values merged with localStorage on load |

---

### 8. Firebase Authentication
**Files**: `src/firebase/provider.tsx`, `src/firebase/non-breaking-login.tsx`, `src/components/auth/`

| Feature | Description |
|---------|-------------|
| Email/Password Auth | Standard Firebase Auth |
| Anonymous Sign-in | Auto-signs in anonymous users on first load |
| Password Reset | Forgot password flow via email |
| Auth Context | React context for `user`, `auth`, `firestore` |
| Protected Features | Settings sync requires login (prompts dialog) |
| User Profile | Display name and email in settings |

---

### 9. Analytics Dashboard
**Files**: `src/components/dashboard/`, `src/app/dashboard/`

#### Stats Cards
| Metric | Description |
|--------|-------------|
| Today's Focus | Total minutes today |
| This Week | Total minutes this week (Mon-Sun) |
| Daily Goal Progress | Percentage toward daily goal |

#### Charts
| Chart | Description |
|-------|-------------|
| Today Chart | Hourly breakdown of today's focus time |
| Week Chart | Daily bars for the current week |
| Month Chart | Daily bars for the current month |
| Overall Chart | Custom date range with area chart |
| Historical Focus | All-time trends |

| Feature | Description |
|---------|-------------|
| Date Range Picker | Select custom from/to dates |
| Recharts Integration | Bar charts, area charts |
| Loading Skeletons | Graceful loading states |
| Firestore Timestamps | Safe parsing (Date, string, Timestamp) |

---

### 10. Manual Session Logging
**File**: `src/components/dashboard/add-focus-record.tsx`

| Feature | Description |
|---------|-------------|
| Add Past Sessions | Log focus time retroactively |
| Date Picker | Select date for the session |
| Time Input | Start time, end time, or duration |
| Session Type | Pomodoro, Focus Block, Manual |
| Form Validation | Zod schema validation |

---

### 11. AI Break Time Recommender
**File**: `src/ai/flows/optimal-break-time-recommender.ts`

| Feature | Description |
|---------|-------------|
| Genkit + Google GenAI | LLM integration |
| Input | Focus history summary, current activity |
| Output | Recommended break duration + reasoning |
| Server Action | `'use server'` for secure API calls |
| Zod Schema Validation | Input/output type safety |

---

## 🔧 Micro-Level Features

### UI/UX Features
- **Glassmorphism Panels**: `bg-white/5`, `backdrop-blur-xl`, `border-white/10`
- **Progress Ring**: Circular timer display with animated progress
- **Framer Motion Animations**: Page transitions, hover effects, scale on tap
- **Radix UI Components**: Dialog, Popover, Accordion, Tabs, Toast, etc.
- **Dark/Light Theme**: next-themes integration
- **Custom Scrollbars**: `.custom-scrollbar` CSS class
- **Loading Skeletons**: Consistent loading states

### Timer Display Features
- **Time Format**: `MM:SS` display
- **Mode Indicator**: Visual distinction for focus/break modes
- **Today's Progress Ring**: Mini progress toward daily goal

### Settings Features
- **Accordion Sections**: Collapsible settings groups
- **Visual Settings**: Anti-burn-in toggle
- **App Guide**: Built-in help documentation
- **Build Log**: Version and changelog display

### PWA Features
- **Manifest**: `src/app/manifest.ts` with icons 
- **Service Worker**: Registration in `pwa-register.tsx`
- **Offline Support**: Works offline with queued syncs

### Performance Optimizations
- **Selective Zustand Subscriptions**: Only subscribe to needed state slices
- **useMemoFirebase**: Memoized Firestore doc references
- **Non-blocking Writes**: Fire-and-forget Firestore updates
- **Optimistic UI**: Instant UI feedback, background persistence

---

## 📁 Key Files to Copy/Adapt

### Hooks (Most Reusable)
| File | Purpose |
|------|---------|
| `use-timer.ts` | Core timer logic |
| `use-floating-timer.ts` | Deep focus mode logic |
| `use-session-recorder.ts` | Session persistence |
| `use-user-preferences.tsx` | Settings management |
| `use-audio-alert.ts` | Sound notifications |
| `use-wakelock.ts` | Screen keep-alive |
| `use-offline-status.ts` | Network detection |
| `use-pending-sync.ts` | Offline queue sync |
| `use-timer-persistence.ts` | Timer state recovery |

### Store
| File | Purpose |
|------|---------|
| `timer-store.ts` | Zustand store with persist |
| `timer-actions.ts` | Timer actions/reducers |
| `timer-state.ts` | TypeScript types |

### Firebase
| File | Purpose |
|------|---------|
| `provider.tsx` | Firebase context provider |
| `non-blocking-updates.tsx` | Async Firestore writes |
| `firestore/use-doc.ts` | Firestore document hook |

### Components
| Folder | Purpose |
|--------|---------|
| `timer/` | Timer UI components |
| `dashboard/` | Analytics & stats |
| `settings/` | User preferences |
| `auth/` | Login/signup forms |
| `ui/` | Radix UI wrappers |

---

## 🔄 Integration Recommendations

Since your new app already has Firebase Auth:

1. **Reuse Hooks Directly**: The hooks are framework-agnostic React hooks
2. **Adapt Firebase Context**: Merge with your existing Firebase provider
3. **Keep Zustand Store**: Timer state management is self-contained
4. **Firestore Schema**: Use the same `users/{userId}/focusRecords/` structure
5. **Offline Strategy**: The pending sync pattern works with any Firestore setup
6. **AI Integration**: Genkit setup requires server-side config

---

## 📦 Required Dependencies

```json
{
  "zustand": "^4.5.4",
  "framer-motion": "^11.3.2",
  "recharts": "^2.15.1",
  "tone": "^15.0.4",
  "date-fns": "^3.6.0",
  "react-hook-form": "^7.54.2",
  "zod": "^3.24.2",
  "@hookform/resolvers": "^4.1.3",
  "@genkit-ai/google-genai": "^1.20.0",
  "genkit": "^1.20.0"
}
```

---

*This extraction covers all 40+ files analyzed from the FocusFlow codebase.*
