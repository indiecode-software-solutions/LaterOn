const { Resend } = require('resend');

function getDefaultResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

async function sendScheduleEmail(schedule, user, supabaseAdmin) {
  const { data: integrations } = await supabaseAdmin
    .from('user_integrations')
    .select('*')
    .eq('user_id', schedule.user_id)
    .eq('status', 'connected');

  const customResend = integrations?.find(i => i.provider === 'resend');
  const gmailOAuth = integrations?.find(i => i.provider === 'gmail_oauth');

  const emailHtml = schedule.message.includes('<')
    ? schedule.message
    : schedule.message.replace(/\n/g, '<br>');

  // Mode 3: Technical Mode (Custom Resend API Key)
  if (customResend && customResend.api_key) {
    const userResend = new Resend(customResend.api_key);
    const response = await userResend.emails.send({
      from: customResend.email_address || `${user.email || 'user'} <notifications@lateron.in>`,
      to: [schedule.email_to],
      subject: schedule.email_subject,
      html: emailHtml,
    });
    if (response.error) throw new Error(response.error.message);
    return response.data;
  }

  // Mode 2: Gmail OAuth Mode
  if (gmailOAuth && gmailOAuth.refresh_token) {
    let nodemailer;
    try {
      nodemailer = require('nodemailer');
    } catch {
      throw new Error('Gmail sending requires nodemailer. Run: npm install nodemailer');
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: gmailOAuth.email_address,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: gmailOAuth.refresh_token,
      },
    });

    return await transporter.sendMail({
      from: `"${user.name || 'LaterOn User'}" <${gmailOAuth.email_address}>`,
      to: schedule.email_to,
      subject: schedule.email_subject,
      html: emailHtml,
    });
  }

  // Mode 1: Default Zero-Setup Email (App Server Resend Engine)
  const defaultResend = getDefaultResend();
  if (!defaultResend) {
    throw new Error('Email delivery not configured. Set RESEND_API_KEY in server .env or configure a custom integration.');
  }

  const senderName = user.name || 'LaterOn User';
  const userEmail = user.email || 'user@lateron.in';

  const response = await defaultResend.emails.send({
    from: `${senderName} via LaterOn <notifications@lateron.in>`,
    replyTo: userEmail,
    to: [schedule.email_to],
    subject: schedule.email_subject,
    html: emailHtml,
  });

  if (response.error) throw new Error(response.error.message);
  return response.data;
}

module.exports = { sendScheduleEmail };
