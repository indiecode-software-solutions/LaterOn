# Right-Center Floating Channel Dock Instructions for OpenCode

## Objective
Remove the inline `[WhatsApp] | [Email]` tab toggle from inside the sidebar form in `client/src/Dashboard.jsx` and replace it with a **Floating Channel Dock/Strips** fixed on the **right-center edge** of the app interface.

---

## 1. Remove Inline Channel Toggle (`client/src/Dashboard.jsx`)
- Locate the inline channel tab toggle inside the sidebar form (around lines ~1480–1520).
- Remove the inline buttons (`[WhatsApp] | [Email]`) from inside the form container so the sidebar form stays clean and focused purely on inputs.

---

## 2. Implement Right-Center Edge Channel Strips (`client/src/Dashboard.jsx` & `client/src/index.css`)

### **A. Component Placement & Layout**
Create a fixed container placed on the right-center edge of the viewport:
```jsx
<div className="right-channel-dock">
  {/* WhatsApp Strip */}
  <button 
    className={`channel-strip wa-strip ${channel === 'whatsapp' ? 'active' : ''}`}
    onClick={() => setChannel('whatsapp')}
  >
    <MessageSquare size={18} />
    <span className="strip-label">WhatsApp</span>
  </button>

  {/* Email Strip */}
  <button 
    className={`channel-strip email-strip ${channel === 'email' ? 'active' : ''}`}
    onClick={() => setChannel('email')}
  >
    <Mail size={18} />
    <span className="strip-label">Email</span>
  </button>

  {/* Calendar Strip */}
  <button 
    className={`channel-strip cal-strip ${channel === 'calendar' ? 'active' : ''}`}
    onClick={() => setChannel('calendar')}
  >
    <Calendar size={18} />
    <span className="strip-label">Google Calendar</span>
  </button>
</div>
```

---

## 3. CSS Styling Directives (`client/src/index.css`)

Add the following CSS rules to `client/src/index.css`:

```css
/* Floating Channel Dock (Right-Center Edge) */
.right-channel-dock {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.channel-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: white;
  border: 1px solid var(--border);
  border-right: none;
  border-radius: 0px; /* Sharp Cornerism */
  cursor: pointer;
  box-shadow: -4px 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  white-space: nowrap;
  color: var(--text-muted);
}

.channel-strip .strip-label {
  max-width: 0;
  opacity: 0;
  font-size: 0.85rem;
  font-weight: 700;
  transition: max-width 0.3s ease, opacity 0.25s ease;
}

/* Hover Slide-Out Animation */
.channel-strip:hover {
  padding-left: 18px;
  box-shadow: -6px 6px 18px rgba(0, 0, 0, 0.12);
}

.channel-strip:hover .strip-label {
  max-width: 140px;
  opacity: 1;
}

/* Channel Color Variations */
.channel-strip.wa-strip.active,
.channel-strip.wa-strip:hover {
  color: #128c7e;
  border-left: 3px solid #25d366;
  background: #f0fdf4;
}

.channel-strip.email-strip.active,
.channel-strip.email-strip:hover {
  color: #d93025;
  border-left: 3px solid #ea4335;
  background: #fce8e6;
}

.channel-strip.cal-strip.active,
.channel-strip.cal-strip:hover {
  color: #1a73e8;
  border-left: 3px solid #1a73e8;
  background: #e8f0fe;
}
```

---

## 4. Verification & Testing
1. Confirm the inline `[WhatsApp] | [Email]` tab is removed from the sidebar form.
2. Confirm the 3 channel strips (WhatsApp, Email, Google Calendar) appear fixed on the right-center edge.
3. Hover over each strip $\rightarrow$ verify it smoothly expands to the left showing the channel label.
4. Click each strip $\rightarrow$ verify it sets `channel` state and updates sidebar form inputs.
