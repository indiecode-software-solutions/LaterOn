# Implementation Plan - Personal Reminders Feature (Native & Browser Notifications)

This plan details the implementation of a lightweight, self-contained Personal Reminders feature. Reminders are created by the user for themselves and are delivered using device-native notification mechanisms (Capacitor Local Notifications on mobile and HTML5 Notification API on desktop).

## Proposed System Architecture

### 1. Database Model
We will create a new, independent table `reminders` in Supabase/PostgreSQL.

```sql
CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  recurrence VARCHAR(50) DEFAULT 'none', -- 'none', 'daily', 'weekly', 'monthly'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'triggered'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reminders"
ON reminders FOR ALL
USING (auth.uid() = user_id);
```

---

### 2. Notification Delivery Mechanisms

#### A. Mobile (Capacitor Local Notifications)
We will install and use the `@capacitor/local-notifications` plugin:
- When a reminder is created, updated, or synced, the frontend schedules it locally on the mobile OS.
- Mobile OS triggers the notification at the scheduled time even if the app is closed.

#### B. Desktop (HTML5 Notification API)
- Request notification permission upon desktop dashboard load.
- If the browser tab is active, run a periodic scheduler (e.g., every 30 seconds) to check for pending reminders and show a browser notification `new Notification(...)` when the time arrives.

---

### 3. Backend Modifications

#### [NEW] [005_create_reminders_table.sql](file:///Users/pranavpatil/Downloads/LaterOn-main/server/migrations/005_create_reminders_table.sql)
- Database migration script to create the `reminders` table and enable RLS policies.

#### [MODIFY] [server/index.js](file:///Users/pranavpatil/Downloads/LaterOn-main/server/index.js)
- Add API endpoints for managing reminders:
  - `GET /api/reminders`: Fetch all reminders for the authenticated user.
  - `POST /api/reminders`: Create a new reminder.
  - `PUT /api/reminders/:id`: Update an existing reminder.
  - `DELETE /api/reminders/:id`: Delete a reminder.
- Note: The background worker does NOT need to process these for external channels. It only acts as an backup status updater or is bypassed entirely because notification dispatch is handled natively on the client device.

---

### 4. Frontend Modifications

#### [MODIFY] [client/package.json](file:///Users/pranavpatil/Downloads/LaterOn-main/client/package.json)
- Add `@capacitor/local-notifications` dependency.

#### [MODIFY] [client/src/Dashboard.jsx](file:///Users/pranavpatil/Downloads/LaterOn-main/client/src/Dashboard.jsx)
1. **Interactive Form:**
   - Replace the static placeholder list with a dynamic reminders view under `channel === 'reminders'`.
   - Render a simple creation form:
     - Title (text input)
     - Description (textarea, optional)
     - Date & Time selector
     - Repeat option (None, Daily, Weekly, Monthly)
     - Submit button ("Create Reminder")
2. **Scheduling Engine:**
   - Implement `scheduleLocalNotification(reminder)` to schedule Capacitor notifications on mobile.
   - Implement HTML5 notification request and trigger helper for desktop users.
   - Sync scheduled alerts on initial load by fetching active reminders from `/api/reminders` and updating local notification queues.

---

## Verification Plan

### Manual Verification
1. Switch to the **Reminders** view.
2. Request notification permissions (accept browser prompt).
3. Create a reminder set for 1 minute in the future.
4. Verify the browser triggers a native notification stating `🔔 LaterOn Reminder: [Title]` at the scheduled time.
5. Build the Android app and verify the local notification triggers even when the app is minimized or closed.
