# LaterOn Meetings & Events Roadmap

## Objective
Expand LaterOn from message scheduling into a **Native Meeting Scheduler & Event Automation Platform** (combining Cal.com/Calendly functionality with built-in multi-channel WhatsApp and Email notifications).

---

## 1. Feature Architecture Overview

### **A. Meeting Creation & Setup (LaterOn Dashboard)**
When the **Calendar / Events** channel strip is active:
- **Meeting Type Title**: e.g., *"30-Min Strategy Call"*, *"1-on-1 Consultation"*.
- **Platform Selector**:
  - 🎥 **Google Meet** (Auto-generates Google Meet link via Google Calendar API).
  - 📞 **WhatsApp Audio / Video Call**.
  - 📱 **Direct Phone Call**.
  - 💻 **Zoom / Custom Link**.
- **Multi-Channel Notification Checkboxes** (Multiple Allowed):
  - `[x] Notify via WhatsApp` (Sends instant confirmation + reminder to client's WhatsApp).
  - `[x] Notify via Email` (Sends calendar invite `.ics` + confirmation email).
- **Reminder Timing Options**:
  - `[x] 24 Hours Before`
  - `[x] 1 Hour Before`
  - `[x] 15 Minutes Before`

---

### **B. Client Booking Experience (Public Booking Page)**
- Public link: `lateron.in/book/:username/:meetingSlug`
- Client selects available date & time slot.
- Client enters:
  - **Name**
  - **WhatsApp Number**
  - **Email Address**
  - **Notes / Meeting Agenda**
- On Submit $\rightarrow$ Triggers real-time booking workflow:
  1. Google Calendar event created.
  2. Multi-channel confirmation sent immediately.
  3. Pre-meeting reminders queued in LaterOn DB.

---

### **C. Dedicated "Meeting Card" Design in Upcoming Queue**
When a client books a meeting or an event is created, it appears in LaterOn's **Upcoming Queue** as a specialized **Meeting Card**:

```
+-------------------------------------------------------------------------+
| 🗓️  30-Min Strategy Call with Rohan Maviskar                            |
| 📅  Jul 22, 2026 at 4:00 PM (30 mins)                                   |
| 🎥  Google Meet: meet.google.com/xyz-abc                                |
|                                                                         |
|  [💬 WhatsApp Reminder: Queued 3:30 PM]  [✉️ Email Invite: Sent]         |
|                                                                         |
|  [ Join Meeting ]                                       [ Cancel / Reschedule ] |
+-------------------------------------------------------------------------+
```

- **Card Styling**: Google Blue accent (`#1a73e8` left border), crisp white background, platform badge, and multi-channel notification status indicators.

---

## 2. Database Schema Migrations

```sql
-- Create meeting_types table
CREATE TABLE IF NOT EXISTS meeting_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  duration INT DEFAULT 30, -- minutes
  platform VARCHAR(50) DEFAULT 'google_meet',
  custom_location TEXT,
  notify_whatsapp BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT true,
  reminder_timing VARCHAR(50) DEFAULT '30_min_before',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_type_id UUID REFERENCES meeting_types(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  client_email VARCHAR(255),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  meeting_url TEXT,
  status VARCHAR(20) DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

---

## 3. Step-by-Step Implementation Strategy for OpenCode

1. **Step 1: Frontend Meeting Form in `client/src/Dashboard.jsx`**
   - Render Meeting Creation form when `channel === 'calendar'`.
   - Add Platform selector & `[x] Notify via WhatsApp` / `[x] Notify via Email` checkboxes.
2. **Step 2: Meeting Card UI Component**
   - Create specialized `MeetingCard` component rendered in the Upcoming Queue.
3. **Step 3: Public Booking Route**
   - Create `/book/:userId/:slug` route for client self-service booking.
4. **Step 4: Real-time Multi-Channel Dispatcher**
   - Integrate Google Calendar API for Meet URL generation + dispatch WhatsApp & Email reminders.
