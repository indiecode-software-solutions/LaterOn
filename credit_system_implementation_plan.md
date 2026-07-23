Here's a concise product-spec prompt you can give Antigravity:

---

**Implement a Credit-Based Usage System**

We are replacing the traditional subscription/trial model with a **credit-based system**.

### Credit Rules
- Every new user receives **500 free credits every month**.
- Later Credits reset monthly (unused free credits do not roll over).
- Purchased Later Credits (to be added later) should never expire.

### Credit Consumption
- **Text-only automation** (WhatsApp, Email, or Meeting): **5 credits**
- **Automation with any attachment** (image, video, document, voice, etc.): **7 credits**
- **Each AI action** (rewrite, improve, translate, etc.): **+3 credits**

**Examples:**
- WhatsApp Text → 5 Later credits
- Email → 5 Later credits
- Meeting Invite → 5 Later credits
- WhatsApp + attachment(any) → 7 Later credits
- Email + attachment(any) → 7 Later credits
- Every AI action (rewrite, improve, translate, etc.) → +3 Later credits
- WhatsApp + attachment(any) + AI action (any) → 10 Later credits

NOTE : We should also have a credit refunds system so suppose if the message has failed to deliver, then those credits should be given back to the user.

### System Behavior
- Before scheduling, calculate the total credits required and display it clearly near the **Schedule** button (e.g., **"Credits Required: 10"**).

- Prevent scheduling if the user has insufficient credits and show a friendly **"Buy Credits"** prompt.

- Deduct Later credits only after the automation is successfully created.

- Add a **Later Credits** section to the user profile/dashboard showing:
  - Current credit balance
  - Free credits remaining
  - Next monthly refill date
  - Credit usage history (prepare backend structure even if UI comes later)

Design the system so that adding purchasable Later Credit packs in the future requires minimal changes.



Extra Later Credits Purchase Plans :

| Plan | Credits | Price |
|------|---------:|------:|
| 🎁 Free Monthly | 500 | Free |
| 🌱 Mini | 250 | ₹19 |
| 🚀 Starter | 750 | ₹49 |
| ⭐ Popular | 1,800 | ₹99 |
| 💎 Pro | 4,000 | ₹199 |
| 🏢 Business | 12,000 | ₹499 |
| 🏭 Enterprise | 30,000+ | Contact Sales |

