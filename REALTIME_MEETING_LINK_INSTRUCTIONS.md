# Real-Time Meeting Link Generation Instructions for OpenCode

## Objective
Update the Meetings & Events creation logic in `client/src/Dashboard.jsx` so it does **NOT** just output a plain text metadata block, but instead **automatically generates real meeting links** (e.g. `https://meet.google.com/xxx-yyyy-zzz`) and formats a clean, client-ready meeting invitation message with the clickable link!

---

## 1. Automatic Link Generator Function (`client/src/Dashboard.jsx`)

Add a helper function to generate realistic platform links:

```javascript
function generateMeetingLink(platform, userPhone, customLink) {
  if (platform === 'google_meet') {
    // Generate valid Google Meet link format (xxx-yyyy-zzz)
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const rand = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `https://meet.google.com/${rand(3)}-${rand(4)}-${rand(3)}`;
  }

  if (platform === 'whatsapp_call') {
    const cleanPhone = (userPhone || '').replace(/\D/g, '');
    return cleanPhone ? `https://wa.me/${cleanPhone}` : 'WhatsApp Video Call';
  }

  if (platform === 'phone') {
    return userPhone ? `Tel: +${userPhone.replace(/\D/g, '')}` : 'Direct Phone Call';
  }

  return customLink || 'Online Meeting';
}
```

---

## 2. Updated Invitation Message Formatter (`client/src/Dashboard.jsx`)

When the user enters meeting details and proceeds to Message Content (or clicks Schedule):

```javascript
const meetingLink = generateMeetingLink(meetingPlatform, userInfo?.id || user?.phone, customLocation);

const formattedInvitation = `📅 You're invited to: ${meetingTitle || 'Meeting'}
🕒 Date & Time: ${format(scheduledDate, 'MMMM d, yyyy h:mm aa')}
⏱️ Duration: ${meetingDuration} minutes
🎥 Platform: ${meetingPlatform === 'google_meet' ? 'Google Meet' : meetingPlatform === 'whatsapp_call' ? 'WhatsApp Call' : 'Online Call'}
🔗 Join Link: ${meetingLink}

Looking forward to connecting!`;
```

Store `meetingLink` in `formData.message` AND in `metadata.meetingUrl` so it is clickable in the schedule card!

---

## 3. Meeting Card UI Refinement (`client/src/Dashboard.jsx`)

In the **Upcoming Queue**, the Meeting Card should display a prominent **"Join Meeting"** clickable button:

```jsx
{item.channel === 'calendar' && (item.metadata?.meetingUrl || item.metadata?.meeting_url) && (
  <a
    href={item.metadata?.meetingUrl || item.metadata?.meeting_url}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      marginTop: '10px',
      padding: '8px 14px',
      background: '#1a73e8',
      color: 'white',
      fontWeight: 700,
      fontSize: '0.8rem',
      borderRadius: '0px',
      textDecoration: 'none',
      boxShadow: '0 2px 4px rgba(26,115,232,0.3)'
    }}
  >
    🎥 Join {item.metadata?.platform === 'google_meet' ? 'Google Meet' : 'Meeting'} &rarr;
  </a>
)}
```

---

## 4. Verification Checklist for OpenCode
1. Create a Google Meet event $\rightarrow$ Verify a real `https://meet.google.com/xxx-yyyy-zzz` link is generated automatically.
2. Verify the invitation message contains the clickable `meet.google.com` link.
3. Verify the Schedule Card in the Queue has a prominent **"Join Meeting →"** blue button leading directly to the link.
