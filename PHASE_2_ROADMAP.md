# LaterOn: Phase 2 Technical Context & Implementation Roadmap

## 1. Executive Summary & Goal
**LaterOn Phase 2** transforms LaterOn from a WhatsApp-only scheduler into a **Multi-Channel Automation Engine**.

In Phase 2, we introduce:
1. **Service Selector & Flexible Onboarding Hub**: Post-login service selector so users can choose to set up Email, WhatsApp, or Google Calendar without being forced into WhatsApp QR setup.
2. **Flexible 3-Tier Email Integration System**:
   - **Mode 1 (Default - Zero Setup)**: Sends via app backend Resend API (`notifications@lateron.in`) with user's name signature and `Reply-To: user@email.com`. Zero setup required!
   - **Mode 2 (1-Click Gmail Connect)**: Connect via Google OAuth for sending directly from `user@gmail.com` or Google Workspace domains.
   - **Mode 3 (Advanced Technical Mode)**: For power users/developers who want to provide their own custom Resend API Key (`re_xxxx`) & verified domain (`you@yourdomain.com`).
3. **Google Calendar Integration** (OAuth 2.0 + Automatic pre/post meeting reminder triggers).
4. **Multi-Channel Architecture** in database, backend workers, and frontend UI.
5. **Unified UI & Design Language**: Preserving the sharp "cornerism" aesthetic (`borderRadius: '0px'`) and "frame-in-a-frame" interface while integrating Gmail red accents (`#ea4335`).

---

## 2. 3-Tier Email Integration Options & UX Architecture

```
+-----------------------------------------------------------------------+
|  🔴 CHOOSE YOUR EMAIL SENDING METHOD                                   |
|                                                                       |
|  [⚡ Mode 1: Default (Zero Setup)]                                    |
|  Send out-of-the-box via LaterOn engine (Reply-To: your email).      |
|  Status: 🟢 Ready instantly!                                          |
|                                                                       |
|  [🔗 Mode 2: Connect Gmail Account]                                   |
|  1-Click Google OAuth to send directly from your @gmail address.     |
|  [ Connect Gmail Account ]                                            |
|                                                                       |
|  [⚙️ Mode 3: Advanced / Technical Setup]                              |
|  Provide your custom Resend API Key & Verified Domain.               |
|  [ Configure Resend API Key ]                                         |
+-----------------------------------------------------------------------+
```

### **A. Mode 1: Zero-Setup Default Email (Active Out-Of-The-Box)**
- **How it works**: Uses app server global `RESEND_API_KEY` defined in `server/.env`.
- **User Action**: **NONE!** Users can immediately compose and schedule emails.
- **Email Delivery**:
  - `From`: `User Name via LaterOn <notifications@lateron.in>`
  - `Reply-To`: `user.email@example.com`

### **B. Mode 2: 1-Click "Connect Gmail Account" (Gmail & Google Workspace Only)**
- **How it works**: Uses official Google OAuth 2.0 (`https://www.googleapis.com/auth/gmail.send`).
- **User Action**: Click **"🔗 Connect Gmail Account"** $\rightarrow$ Google consent popup $\rightarrow$ Click **Allow**.
- **Email Delivery**:
  - `From`: `user@gmail.com` or `user@company.com`

### **C. Mode 3: Advanced / Technical Setup (Custom Resend API Key)**
- **How it works**: User enters their own Resend API Key (`re_xxxx`) & Custom Domain (`you@yourdomain.com`).
- **User Action**: Click **"Configure Custom Resend Key"** $\rightarrow$ Save to `user_integrations`.
- **Email Delivery**:
  - `From`: `you@yourdomain.com` (Sent using user's own Resend API key).

---

## 3. Design System & UI/UX Directives (Strict Rules)

### **A. Sharp "Cornerism" Aesthetic**
- **Zero Border Radius Constraint**: Maintain `borderRadius: '0px'` across all new buttons, cards, modals, input fields, badges, and chips.
- **Consistent Borders & Shadows**: Use `1px solid var(--border)` (`#e9edef` or `#dadce0`) with crisp, low-blur elevation shadows (`box-shadow: 0 2px 5px rgba(0,0,0,0.06)`).

### **B. Channel Color Scheme Strategy**
- **WhatsApp Channel**: Signature WhatsApp green palette (`--primary: #25d366`, `--primary-dark: #128c7e`, `#dcf8c6` message bubbles).
- **Email / Gmail Channel**: Gmail red & Google Material Slate accent palette:
  - Email Primary: `#ea4335` (Gmail Red)
  - Email Dark / Hover: `#d93025`
  - Email Light / Soft Background: `#fce8e6` or `#f8fafc`
  - Email Text Accent: `#b31412`
- **Google Calendar Channel**:
  - Event Accent: `#1a73e8` (Google Blue)
  - Soft Event Highlight: `#e8f0fe`

### **C. Unified "Frame-in-a-Frame" Desktop Interface**
- Maintain `.dashboard-container`, `.sidebar-form-container`, `.queue-container` frame structure.
- When composing an email, inner preview renders as a clean Gmail draft window frame.

---

## 4. Database Schema (Supabase Migration)

```sql
-- 1. Add channel support to schedules table (Safe migration: default is 'whatsapp')
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS channel VARCHAR(20) DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS email_to VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_subject VARCHAR(255),
ADD COLUMN IF NOT EXISTS calendar_event_id VARCHAR(255);

-- Create index for faster background worker queries
CREATE INDEX IF NOT EXISTS idx_schedules_pending_channel 
ON schedules (status, scheduled_at, channel);

-- 2. User integrations table for storing OAuth tokens & custom Resend keys
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'gmail_oauth', 'resend', 'google_calendar'
  email_address VARCHAR(255),
  api_key TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'connected',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- RLS Security Rules for user_integrations
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own integrations" 
ON user_integrations 
FOR ALL 
USING (auth.uid() = user_id);
```

---

## 5. Email Dispatcher Implementation (`server/services/emailService.js`)

```javascript
const { Resend } = require('resend');
const { google } = require('googleapis');

const defaultResend = new Resend(process.env.RESEND_API_KEY);

async function sendScheduleEmail(schedule, user, supabaseAdmin) {
  // Check user integrations
  const { data: integrations } = await supabaseAdmin
    .from('user_integrations')
    .select('*')
    .eq('user_id', schedule.user_id)
    .eq('status', 'connected');

  const customResend = integrations?.find(i => i.provider === 'resend');
  const gmailOAuth = integrations?.find(i => i.provider === 'gmail_oauth');

  // Mode 3: Technical Mode (User's custom Resend API Key)
  if (customResend && customResend.api_key) {
    const userResend = new Resend(customResend.api_key);
    return await userResend.emails.send({
      from: customResend.email_address || `${user.name} <notifications@lateron.in>`,
      to: [schedule.email_to],
      subject: schedule.email_subject,
      html: schedule.message,
    });
  }

  // Mode 2: Gmail OAuth Mode
  if (gmailOAuth && gmailOAuth.refresh_token) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: gmailOAuth.refresh_token });
    const accessToken = await oauth2Client.getAccessToken();

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: gmailOAuth.email_address,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: gmailOAuth.refresh_token,
        accessToken: accessToken.token,
      },
    });

    return await transporter.sendMail({
      from: `"${user.name || 'LaterOn User'}" <${gmailOAuth.email_address}>`,
      to: schedule.email_to,
      subject: schedule.email_subject,
      html: schedule.message,
    });
  }

  // Mode 1: Default Zero-Setup Email (App Resend Engine)
  const senderName = user.name || 'LaterOn User';
  const userEmail = user.email || 'user@lateron.in';

  return await defaultResend.emails.send({
    from: `${senderName} via LaterOn <notifications@lateron.in>`,
    replyTo: userEmail,
    to: [schedule.email_to],
    subject: schedule.email_subject,
    html: schedule.message,
  });
}

module.exports = { sendScheduleEmail };
```

---

## 6. Step-by-Step Execution Plan for OpenCode

1. **Step 1: Default Zero-Setup**: Enable immediate email scheduling out-of-the-box using server `RESEND_API_KEY`.
2. **Step 2: 1-Click Gmail Button**: Add a **"Connect Gmail Account"** OAuth button.
3. **Step 3: Advanced Technical Modal**: Keep an optional **"Advanced: Custom Resend API Key"** link that opens the modal for technical users who want to use their own domain & key.
4. **Step 4: Multi-mode Dispatcher**: Update `server/services/emailService.js` to handle all 3 modes dynamically.
