# Email Integration System: OpenCode Refactoring Instructions

## Objective
Refactor the Email Integration setup in `client/src/Dashboard.jsx` and `server/services/emailService.js` to replace the forced Resend API Key modal with a **Frictionless 3-Tier Email Integration System**.

---

## 1. UX & Frontend Directives (`client/src/Dashboard.jsx`)

### **Remove Forced Resend Modal**
- Do **NOT** force users to enter a Resend API key or verified domain before using email scheduling.
- Email scheduling must be **active out-of-the-box** by default.

### **The 3 Email Integration Modes in UI**

When a user clicks on Email Integration settings or configures Email:

1. **Mode 1: Default Zero-Setup (Active By Default)**
   - Display a badge or text: `🟢 Email Ready (Default Server Engine)`.
   - Users can immediately schedule emails without filling in any fields.

2. **Mode 2: 1-Click "Connect Gmail Account" (Gmail / Google Workspace)**
   - Add a prominent button: **"🔗 Connect Gmail Account"**.
   - Trigger Google OAuth flow (`/api/auth/google`).
   - When connected, display: `🟢 Connected as user@gmail.com`.

3. **Mode 3: Advanced Technical Mode (Custom Resend Key)**
   - Below the Gmail button, add a small, subtle link: *"Advanced: Use Custom Resend API Key & Domain"*.
   - Clicking this opens the existing modal with **Resend API Key** and **From Email Address** fields for power users who want to use their own Resend account.

---

## 2. Backend Dispatcher Refactoring (`server/services/emailService.js`)

Update `server/services/emailService.js` to handle all 3 modes dynamically when an email schedule fires:

```javascript
const { Resend } = require('resend');
const { google } = require('googleapis');

const defaultResend = new Resend(process.env.RESEND_API_KEY);

async function sendScheduleEmail(schedule, user, supabaseAdmin) {
  // Fetch user integrations
  const { data: integrations } = await supabaseAdmin
    .from('user_integrations')
    .select('*')
    .eq('user_id', schedule.user_id)
    .eq('status', 'connected');

  const customResend = integrations?.find(i => i.provider === 'resend');
  const gmailOAuth = integrations?.find(i => i.provider === 'gmail_oauth');

  // Mode 3: Technical Mode (Custom Resend API Key)
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

  // Mode 1: Default Zero-Setup Email (App Server Resend Engine)
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

## 3. Implementation Steps for OpenCode

1. **Update `client/src/Dashboard.jsx`**:
   - Make Email active out-of-the-box (no forced Resend modal).
   - Render the **"Connect Gmail Account"** OAuth button.
   - Move the Resend API Key modal behind an *"Advanced: Custom Resend API Key"* trigger link.
2. **Update `server/services/emailService.js`**:
   - Export `sendScheduleEmail` supporting the 3-tier fallback logic.
3. **Verify Execution**:
   - Schedule an email without connecting anything $\rightarrow$ Verify it sends via Mode 1 (Resend default).
