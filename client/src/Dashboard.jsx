import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { format } from 'date-fns';
import { triggerSelection } from './haptics';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { App } from '@capacitor/app';

// Native Razorpay plugin — only available on Android
const RazorpayNative = registerPlugin('RazorpayPlugin');
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Send,
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  QrCode,
  Wifi,
  WifiOff,
  Plus,
  MoreVertical,
  ListFilter,
  Search,
  Check,
  CheckCheck,
  Paperclip,
  Image as ImageIcon,
  File as FileIcon,
  Video as VideoIcon,
  Mic,
  X,
  Users,
  User,
  UserPlus,
  Repeat,
  Bot,
  Zap,
  Sparkles,
  RefreshCcw,
  Edit2,
  Download,
  LogOut,
  LayoutList,
  Mail,
  ExternalLink,
  Link as LinkIcon,
  ArrowLeft,
  ArrowRight,
  Home,
  Smile,
  Coins,
  Bell,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CalendarView from './CalendarView';
import { formatPhone, getContactDisplayName, isPlaceholderContactName } from './contactUtils';
import { supabase } from './supabaseClient';
import EmojiPicker from './EmojiPicker';

const WABusinessIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 6.477 2 12C2 13.825 2.484 15.537 3.332 17.011L2 22L7.126 20.668C8.514 21.517 10.182 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" fill={color === 'var(--primary-dark)' ? '#25D366' : '#54656f'} />
    <path d="M9 8H12C13.105 8 14 8.895 14 10V11C14 11.552 13.552 12 13 12C13.552 12 14 12.448 14 13V14C14 15.105 13.105 16 12 16H9V8ZM10.5 9.5V11.5H12C12.276 11.5 12.5 11.276 12.5 11V10C12.5 9.724 12.276 9.5 12 9.5H10.5ZM10.5 12.5V14.5H12C12.276 14.5 12.5 14.276 12.5 14V13C12.5 12.724 12.276 12.5 12 12.5H10.5V12.5Z" fill="white" />
  </svg>
);

const WhatsAppIcon = ({ size = 18, color = '#25D366' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const InstagramIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TelegramIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);


const API_URL = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' && !navigator.userAgent.includes('Android') && !navigator.userAgent.includes('iPhone')
    ? 'http://localhost:3001'
    : 'https://lateron.indiecode.in');
const socket = io(API_URL);
const GOOGLE_MEET_PENDING_TEXT = 'Google Meet link will be generated after saving';

function generateMeetingLink(platform, userPhone, customLink, personalGoogleLink, personalZoomLink) {
  if (platform === 'google_meet') {
    if (personalGoogleLink && personalGoogleLink.trim().startsWith('http')) {
      return personalGoogleLink.trim();
    }
    return GOOGLE_MEET_PENDING_TEXT;
  }
  if (platform === 'zoom') {
    if (personalZoomLink && personalZoomLink.trim().startsWith('http')) {
      return personalZoomLink.trim();
    }
    if (customLink && customLink.includes('zoom.us')) return customLink;
    const randNum = Math.floor(100000000 + Math.random() * 900000000);
    return `https://zoom.us/j/${randNum}?pwd=${Math.random().toString(36).slice(-8)}`;
  }
  if (platform === 'whatsapp_call') {
    const cleanPhone = (userPhone || '').replace(/\D/g, '');
    return cleanPhone ? `https://wa.me/${cleanPhone}?text=Hi,%20joining%20our%20scheduled%20call!` : 'WhatsApp Call';
  }
  if (platform === 'phone') {
    return userPhone ? `tel:+${userPhone.replace(/\D/g, '')}` : 'Phone Call';
  }
  return customLink || 'Online Meeting';
}

const CONNECTION_STATUS_RANK = {
  disconnected: 0,
  connecting: 1,
  qr: 2,
  'qr-scanned': 3,
  syncing: 4,
  connected: 5
};

const shouldIgnoreOlderConnectionStatus = (currentStatus, nextStatus) => {
  // If currently connected, always accept any state change (since it means we lost connection)
  if (currentStatus === 'connected') return false;
  // Always accept disconnected, connecting, or qr states to ensure the UI updates instantly
  if (nextStatus === 'disconnected' || nextStatus === 'connecting' || nextStatus === 'qr') return false;

  const currentRank = CONNECTION_STATUS_RANK[currentStatus] ?? 0;
  const nextRank = CONNECTION_STATUS_RANK[nextStatus] ?? 0;
  return currentRank >= CONNECTION_STATUS_RANK['qr-scanned'] && nextRank < currentRank;
};

// ── Instagram Sidebar ── proper component to respect Rules of Hooks ──────────
// ── Instagram Sidebar ── proper component to respect Rules of Hooks ──────────
function InstagramSidebar({ token, channel, fetchSchedules, instagramStatus, fetchInstagramStatus, setInstagramStatus }) {
  const [igTab, setIgTab] = React.useState('schedule');
  const [igRules, setIgRules] = React.useState([]);
  const [scheduledDate, setScheduledDate] = React.useState(new Date());
  const [igPostForm, setIgPostForm] = React.useState({ caption: '', image_urls_raw: '' });
  const [igRuleForm, setIgRuleForm] = React.useState({ rule_type: 'dm', trigger_type: 'keyword', trigger_keyword: '', reply_message: '' });
  const [igLoading, setIgLoading] = React.useState(false);
  const [igConnecting, setIgConnecting] = React.useState(false);
  const [igStatusLoading, setIgStatusLoading] = React.useState(true);

  const authToken = token;

  const CustomDateInput = React.forwardRef(({ value, onClick }, ref) => (
    <button type="button" className="datepicker-custom-input" onClick={onClick} ref={ref} style={{ border: '1px solid var(--border)', color: 'var(--text-main)' }}>
      <Calendar size={18} />
      {value}
    </button>
  ));

  React.useEffect(() => {
    setIgStatusLoading(true);
    fetch(`${API_URL}/api/instagram/status`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(r => r.json()).then(d => { setInstagramStatus(d); setIgStatusLoading(false); })
      .catch(() => setIgStatusLoading(false));
  }, [channel]);

  React.useEffect(() => {
    if (instagramStatus?.status !== 'connected') return;
    fetch(`${API_URL}/api/instagram/auto-rules`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setIgRules(d); }).catch(() => { });
  }, [instagramStatus]);

  const handleIgConnect = async () => {
    setIgConnecting(true);
    try {
      const r = await fetch(`${API_URL}/api/instagram/auth-url`, { headers: { Authorization: `Bearer ${authToken}` } });
      const { url, error } = await r.json();
      if (error) { alert(error); setIgConnecting(false); return; }
      window.open(url, '_blank', 'width=600,height=700');
      const poll = setInterval(async () => {
        const sr = await fetch(`${API_URL}/api/instagram/status`, { headers: { Authorization: `Bearer ${authToken}` } });
        const sd = await sr.json();
        if (sd.status === 'connected') { setInstagramStatus(sd); clearInterval(poll); setIgConnecting(false); }
      }, 2000);
      setTimeout(() => { clearInterval(poll); setIgConnecting(false); }, 120000);
    } catch (e) { alert(e.message); setIgConnecting(false); }
  };

  const handleIgDisconnect = async () => {
    if (!confirm('Disconnect Instagram?')) return;
    await fetch(`${API_URL}/api/instagram/disconnect`, { method: 'DELETE', headers: { Authorization: `Bearer ${authToken}` } });
    setInstagramStatus({ status: 'disconnected' });
    setIgRules([]);
  };

  const handleSchedulePost = async (e) => {
    e.preventDefault();
    const urls = igPostForm.image_urls_raw.split('\n').map(u => u.trim()).filter(Boolean);
    if (!urls.length) return alert('Add at least one image URL');

    // Convert selected date to UTC ISO string
    const utcScheduledAt = scheduledDate.toISOString();

    setIgLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/instagram/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ caption: igPostForm.caption, image_urls: urls, scheduled_at: utcScheduledAt })
      });
      const d = await r.json();
      if (d.error) return alert(d.error);
      if (fetchSchedules) fetchSchedules();
      setIgPostForm({ caption: '', image_urls_raw: '' });
      setScheduledDate(new Date());
    } catch (e) { alert(e.message); } finally { setIgLoading(false); }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!igRuleForm.reply_message.trim()) return alert('Reply message is required');
    if (igRuleForm.trigger_type === 'keyword' && !igRuleForm.trigger_keyword.trim()) return alert('Keyword is required');
    setIgLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/instagram/auto-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(igRuleForm)
      });
      const d = await r.json();
      if (d.error) return alert(d.error);
      setIgRules(prev => [d, ...prev]);
      setIgRuleForm({ rule_type: 'dm', trigger_type: 'keyword', trigger_keyword: '', reply_message: '' });
    } catch (e) { alert(e.message); } finally { setIgLoading(false); }
  };

  const toggleRule = async (rule) => {
    await fetch(`${API_URL}/api/instagram/auto-rules/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ is_active: !rule.is_active })
    });
    setIgRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
  };

  const deleteRule = async (id) => {
    if (!confirm('Delete this rule?')) return;
    await fetch(`${API_URL}/api/instagram/auto-rules/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${authToken}` } });
    setIgRules(prev => prev.filter(r => r.id !== id));
  };

  if (igStatusLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px', gap: '10px' }}>
      <div className="spin" style={{ width: 28, height: 28, border: '3px solid #f3f3f3', borderTop: '3px solid #e1306c', borderRadius: '50%' }} />
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>Checking connection...</p>
    </div>
  );

  if (instagramStatus?.status !== 'connected') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ padding: '20px', background: 'linear-gradient(135deg, #e1306c, #f77737)', borderRadius: '6px', textAlign: 'center', color: 'white' }}>
        <InstagramIcon size={32} color="white" />
        <p style={{ fontWeight: 800, fontSize: '1rem', margin: '8px 0 4px 0' }}>Connect Instagram</p>
        <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.9 }}>Business or Creator account required</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '0 4px' }}>
        {[
          { n: '1', text: 'Make sure your Instagram account is set to Business or Creator (Settings -> Account type).' },
          { n: '2', text: 'Click Connect Instagram below and log in with your credentials.' },
          { n: '3', text: 'Approve the requested permissions so LaterOn can post on your behalf.' },
          { n: '4', text: 'You will be redirected back automatically once connected.' }
        ].map(s => (
          <div key={s.n} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{ minWidth: 22, height: 22, borderRadius: '50%', background: '#e1306c', color: 'white', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.n}</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{s.text}</p>
          </div>
        ))}
      </div>
      <button onClick={handleIgConnect} disabled={igConnecting} style={{ width: '100%', padding: '14px', background: '#e1306c', color: 'white', fontWeight: 800, fontSize: '0.88rem', border: 'none', borderRadius: '6px', cursor: igConnecting ? 'not-allowed' : 'pointer', opacity: igConnecting ? 0.7 : 1, letterSpacing: '0.4px' }}>
        {igConnecting ? 'Waiting for login...' : 'Connect Instagram'}
      </button>
    </div>
  );

  const cfg = instagramStatus.config || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Tab switcher */}
      <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
        {[{ k: 'schedule', label: 'Schedule Post' }, { k: 'rules', label: 'Auto-Replies' }].map(t => (
          <button key={t.k} onClick={() => setIgTab(t.k)} style={{ flex: 1, padding: '9px 4px', fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: igTab === t.k ? '#e1306c' : 'white', color: igTab === t.k ? 'white' : 'var(--text-muted)', transition: 'all 0.2s' }}>{t.label}</button>
        ))}
      </div>

      {/* Schedule Post tab */}
      {igTab === 'schedule' && (
        <form onSubmit={handleSchedulePost} style={{ display: 'flex', flexDirection: 'column' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e1306c', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Image URL(s)</label>
            <textarea
              placeholder={'Paste image URL(s), one per line. Up to 10 for a carousel.'}
              value={igPostForm.image_urls_raw}
              onChange={e => setIgPostForm(p => ({ ...p, image_urls_raw: e.target.value }))}
              rows={3}
              style={{ width: '100%', padding: '14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.88rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e1306c', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Caption</label>
            <textarea
              placeholder="Write your caption with hashtags..."
              value={igPostForm.caption}
              onChange={e => setIgPostForm(p => ({ ...p, caption: e.target.value }))}
              rows={3}
              style={{ width: '100%', padding: '14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.88rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <div className="input-group">
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e1306c', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Schedule For</label>
            <DatePicker
              selected={scheduledDate}
              onChange={(date) => setScheduledDate(date)}
              showTimeSelect
              timeFormat="h:mm aa"
              timeIntervals={1}
              timeCaption="Time"
              dateFormat="MMMM d, yyyy h:mm aa"
              customInput={<CustomDateInput />}
              minDate={new Date()}
            />
          </div>
          <button type="submit" disabled={igLoading} style={{ padding: '14px', background: '#e1306c', color: 'white', fontWeight: 800, fontSize: '0.88rem', border: 'none', borderRadius: '6px', cursor: igLoading ? 'not-allowed' : 'pointer', opacity: igLoading ? 0.7 : 1 }}>
            {igLoading ? 'Scheduling...' : 'Schedule Post'}
          </button>
        </form>
      )}

      {/* Auto-Rules tab */}
      {igTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <form onSubmit={handleAddRule} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: '#fff0f5', border: '1px solid #f7c6d8', borderRadius: '6px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e1306c', margin: 0, textTransform: 'uppercase' }}>New Auto-Reply Rule</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Reply to</label>
                <select value={igRuleForm.rule_type} onChange={e => setIgRuleForm(p => ({ ...p, rule_type: e.target.value }))} style={{ width: '100%', padding: '7px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.78rem', outline: 'none' }}>
                  <option value="dm">💬 DMs</option>
                  <option value="comment">🖼 Comments</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Trigger</label>
                <select value={igRuleForm.trigger_type} onChange={e => setIgRuleForm(p => ({ ...p, trigger_type: e.target.value }))} style={{ width: '100%', padding: '7px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.78rem', outline: 'none' }}>
                  <option value="keyword">Keyword match</option>
                  <option value="any">Any message</option>
                </select>
              </div>
            </div>
            {igRuleForm.trigger_type === 'keyword' && (
              <input
                placeholder="Trigger keyword (e.g. price, info)"
                value={igRuleForm.trigger_keyword}
                onChange={e => setIgRuleForm(p => ({ ...p, trigger_keyword: e.target.value }))}
                style={{ width: '100%', padding: '7px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
              />
            )}
            <textarea
              placeholder="Auto-reply message…"
              value={igRuleForm.reply_message}
              onChange={e => setIgRuleForm(p => ({ ...p, reply_message: e.target.value }))}
              rows={2}
              style={{ width: '100%', padding: '7px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <button type="submit" disabled={igLoading} style={{ padding: '9px', background: 'linear-gradient(135deg, #e1306c, #f77737)', color: 'white', fontWeight: 800, fontSize: '0.8rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              {igLoading ? 'Adding…' : '+ Add Rule'}
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
            {igRules.length === 0 && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No rules yet. Add your first auto-reply above.</p>}
            {igRules.map(rule => (
              <div key={rule.id} style={{ padding: '10px 12px', border: `1px solid ${rule.is_active ? '#f7c6d8' : 'var(--border)'}`, background: rule.is_active ? '#fff0f5' : '#f8fafc', borderRadius: '6px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 700, background: rule.rule_type === 'dm' ? '#dbeafe' : '#fef9c3', color: rule.rule_type === 'dm' ? '#1d4ed8' : '#854d0e' }}>{rule.rule_type === 'dm' ? '💬 DM' : '🖼 Comment'}</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 700, background: '#f1f5f9', color: 'var(--text-muted)' }}>{rule.trigger_type === 'any' ? 'Any message' : `"${rule.trigger_keyword}"`}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-main)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rule.reply_message}</p>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button onClick={() => toggleRule(rule)} style={{ fontSize: '0.65rem', padding: '3px 7px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', background: rule.is_active ? '#d1fae5' : '#fee2e2', color: rule.is_active ? '#059669' : '#dc2626', fontWeight: 700 }}>{rule.is_active ? 'ON' : 'OFF'}</button>
                  <button onClick={() => deleteRule(rule.id)} style={{ fontSize: '0.65rem', padding: '3px 7px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', background: 'white', color: '#dc2626' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Set global axios auth header
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const [status, setStatus] = useState('connecting');
  const [statusLoading, setStatusLoading] = useState(true);
  const statusRef = useRef('connecting');
  const pairingCodeTimeoutRef = useRef(null);
  const [qrCode, setQrCode] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [contacts, setContacts] = useState({});
  const [groups, setGroups] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sidebarStep, setSidebarStep] = useState(1);
  const [stepChangedAt, setStepChangedAt] = useState(0);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [formData, setFormData] = useState({
    phone: '',
    message: '',
    recurrence: 'none',
    customDays: [],
    customLink: ''
  });
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isVoiceNote, setIsVoiceNote] = useState(false);
  const [activeView, setActiveView] = useState('scheduler'); // 'scheduler' or 'business'
  const [currentBusinessTool, setCurrentBusinessTool] = useState(null); // null, 'auto-reply', 'drip'
  const getDefaultCountryCode = () => {
    const wsPhone = userInfo?.id || user?.phone;
    if (wsPhone && wsPhone.length > 10) {
      return wsPhone.slice(0, wsPhone.length - 10);
    }
    return '91';
  };

  const [autoReplies, setAutoReplies] = useState([]);
  const [replyFormData, setReplyFormData] = useState({ keyword: '', reply: '' });
  const [editingId, setEditingId] = useState(null);
  const [queueTab, setQueueTab] = useState('upcoming'); // 'upcoming' or 'history'
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'sent', 'delivered', 'read'
  const [showMenu, setShowMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSocialDropdown, setShowSocialDropdown] = useState(false);
  const [showWhatsAppManage, setShowWhatsAppManage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [usePairingCode, setUsePairingCode] = useState(() => window.innerWidth <= 768);
  const [pairingCountryCode, setPairingCountryCode] = useState('91');
  const [pairingPhone, setPairingPhone] = useState('');
  const [pairingCode, setPairingCode] = useState(null);
  const [pairingCodePhone, setPairingCodePhone] = useState('');
  const [pairingLoading, setPairingLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isContactSyncing, setIsContactSyncing] = useState(false);
  const [contactSyncMessage, setContactSyncMessage] = useState('');
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [activeEmojiPicker, setActiveEmojiPicker] = useState(null);
  const [credits, setCredits] = useState({ free_balance: 0, purchased_balance: 0, total_balance: 0, next_refill_date: null, transactions: [], subscription_id: null, subscription_pack: null, subscription_credits: null, subscription_status: null, subscription_period: 'monthly' });
  const [txnFilter, setTxnFilter] = useState('all');
  const [txnPage, setTxnPage] = useState(1);
  const TXN_PER_PAGE = 10;
  const [showCalModal, setShowCalModal] = useState(false);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [paymentSuccessModal, setPaymentSuccessModal] = useState(null);
  const [purchasingPack, setPurchasingPack] = useState(null);

  const [isAiUsed, setIsAiUsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [is24Hour, setIs24Hour] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const backStateRef = useRef({});
  const [hoveredSchedule, setHoveredSchedule] = useState(null);
  const [editingSequenceId, setEditingSequenceId] = useState(null);
  const [aiContext, setAiContext] = useState('');
  const [reminders, setReminders] = useState([]);
  const [reminderForm, setReminderForm] = useState({ title: '', description: '', scheduled_at: new Date(), recurrence: 'none' });
  const [reminderNotifPermission, setReminderNotifPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default');
  const [isSubmittingReminder, setIsSubmittingReminder] = useState(false);

  // Telegram Integration States
  const [telegramStatus, setTelegramStatus] = useState({ provider: 'telegram', status: 'disconnected', config: {} });

  // Instagram Integration States
  const [instagramStatus, setInstagramStatus] = useState({ provider: 'instagram', status: 'disconnected', config: {} });
  const [isInstagramStatusLoading, setIsInstagramStatusLoading] = useState(true);
  const [igMobileForm, setIgMobileForm] = useState({ image_urls_raw: '', caption: '' });
  const [igMobileDate, setIgMobileDate] = useState(new Date());
  const [igMobileLoading, setIgMobileLoading] = useState(false);
  const fetchInstagramStatus = async () => {
    try {
      setIsInstagramStatusLoading(true);
      const res = await axios.get(`${API_URL}/api/instagram/status`);
      setInstagramStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch Instagram status:', err.message);
    } finally {
      setIsInstagramStatusLoading(false);
    }
  };
  const [showTelegramConfig, setShowTelegramConfig] = useState(false);
  const [customTelegramToken, setCustomTelegramToken] = useState('');
  const [isTestingTelegramBot, setIsTestingTelegramBot] = useState(false);
  const [telegramTestBotResult, setTelegramTestBotResult] = useState(null);
  const [selectedTelegramChat, setSelectedTelegramChat] = useState('');
  const [telegramNewChatId, setTelegramNewChatId] = useState('');
  const [telegramNewChatTitle, setTelegramNewChatTitle] = useState('');
  const [isSavingTelegramChat, setIsSavingTelegramChat] = useState(false);
  const [showTelegramAddChat, setShowTelegramAddChat] = useState(false);
  const [isTelegramStatusLoading, setIsTelegramStatusLoading] = useState(true);

  const fetchTelegramStatus = async () => {
    try {
      setIsTelegramStatusLoading(true);
      const res = await axios.get(`${API_URL}/api/telegram/status`);
      setTelegramStatus(res.data);
      if (res.data.api_key) {
        setCustomTelegramToken(res.data.api_key);
      }
      if (res.data.config?.chats?.length > 0) {
        setSelectedTelegramChat(res.data.config.chats[0].id);
      } else if (res.data.config?.chat_id) {
        setSelectedTelegramChat(res.data.config.chat_id);
      }
    } catch (err) {
      console.error('Failed to fetch Telegram status:', err.message);
    } finally {
      setIsTelegramStatusLoading(false);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/integrations`);
      setIntegrations(res.data || []);
      const hasResend = (res.data || []).find(i => i.provider === 'resend');
      if (hasResend) {
        setEmailApiKey(hasResend.api_key || '');
        setEmailFromAddress(hasResend.email_address || '');
      }
      await fetchTelegramStatus();
      await fetchInstagramStatus();
    } catch (err) {
      console.error('Failed to fetch integrations:', err.message);
    }
  };
  const [selectedBroadcastContacts, setSelectedBroadcastContacts] = useState([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  const applyConnectionStatus = (nextStatus) => {
    if (shouldIgnoreOlderConnectionStatus(statusRef.current, nextStatus)) {
      return statusRef.current;
    }
    statusRef.current = nextStatus;
    setStatus(nextStatus);
    return nextStatus;
  };

  const clearPairingCodeTimeout = () => {
    if (!pairingCodeTimeoutRef.current) return;
    clearTimeout(pairingCodeTimeoutRef.current);
    pairingCodeTimeoutRef.current = null;
  };

  const getNormalizedPairingPhone = () => {
    const rawPhone = pairingPhone.trim();
    const countryCode = pairingCountryCode.replace(/\D/g, '') || '91';
    const userIncludedCountryCode = rawPhone.startsWith('+') || rawPhone.startsWith('00');
    let digits = rawPhone.replace(/\D/g, '');

    if (rawPhone.startsWith('00')) digits = digits.replace(/^00/, '');

    if (!userIncludedCountryCode) {
      digits = digits.replace(/^0+/, '');
      if (!digits.startsWith(countryCode)) {
        digits = `${countryCode}${digits}`;
      }
    }

    return digits;
  };

  // Drip Campaign States
  const [channel, setChannel] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [integrations, setIntegrations] = useState([]);
  const [showServiceSelector, setShowServiceSelector] = useState(true);
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [emailApiKey, setEmailApiKey] = useState('');
  const [emailFromAddress, setEmailFromAddress] = useState('');
  const [configSaving, setConfigSaving] = useState(false);

  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingPlatform, setMeetingPlatform] = useState('google_meet');
  const [meetingDuration, setMeetingDuration] = useState(30);
  const [meetingNotifyWhatsApp, setMeetingNotifyWhatsApp] = useState(true);
  const [meetingNotifyEmail, setMeetingNotifyEmail] = useState(true);
  const [meetingReminderTiming, setMeetingReminderTiming] = useState('24h');
  const [personalMeetLink, setPersonalMeetLink] = useState(localStorage.getItem('personal_google_meet_link') || '');
  const [personalZoomLink, setPersonalZoomLink] = useState(localStorage.getItem('personal_zoom_link') || '');

  const [dripSequences, setDripSequences] = useState([]);
  const [isCreatingSequence, setIsCreatingSequence] = useState(false);
  const [newSequence, setNewSequence] = useState({
    name: '',
    trigger: 'manual',
    triggerValue: '',
    steps: [{ message: '', delay: 0, condition: 'none' }]
  });

  useEffect(() => {
    // Reset editor states when switching tools or views to avoid getting stuck
    setIsCreatingSequence(false);
    setEditingSequenceId(null);
    setNewSequence({
      name: '',
      trigger: 'manual',
      triggerValue: '',
      steps: [{ message: '', delay: 0, condition: 'none' }]
    });
  }, [currentBusinessTool, activeView]);


  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keep ref up to date for back button handler
  backStateRef.current = {
    channel, showMobileForm, showSocialDropdown, showWhatsAppManage,
    showMenu, showFilterMenu, showDisconnectModal, showSignOutModal,
    showClearHistoryModal, paymentSuccessModal, showContactModal,
    showEmailConfig, showTelegramConfig, showAiPrompt, showServiceSelector
  };

  // Android back button — navigate within the app instead of exiting
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle;
    (async () => {
      try {
        handle = await App.addListener('backButton', () => {
          const s = backStateRef.current;
          if (s.showMobileForm) { setShowMobileForm(false); return; }
          if (s.showSocialDropdown) { setShowSocialDropdown(false); return; }
          if (s.showWhatsAppManage) { setShowWhatsAppManage(false); return; }
          if (s.showMenu) { setShowMenu(false); return; }
          if (s.showFilterMenu) { setShowFilterMenu(false); return; }
          if (s.showDisconnectModal) { setShowDisconnectModal(false); return; }
          if (s.showSignOutModal) { setShowSignOutModal(false); return; }
          if (s.showClearHistoryModal) { setShowClearHistoryModal(false); return; }
          if (s.paymentSuccessModal) { setPaymentSuccessModal(null); return; }
          if (s.showContactModal) { setShowContactModal(false); return; }
          if (s.showEmailConfig) { setShowEmailConfig(false); return; }
          if (s.showTelegramConfig) { setShowTelegramConfig(false); return; }
          if (s.showAiPrompt) { setShowAiPrompt(false); return; }
          if (!s.showServiceSelector && s.channel) { setShowServiceSelector(true); return; }
          App.exitApp();
        });
      } catch (e) {
        console.warn('Back button listener failed:', e);
      }
    })();
    return () => { if (handle) handle.remove(); };
  }, []);

  useEffect(() => {
    if (user.id) {
      socket.emit('join', user.id);
    }
  }, [user.id]);

  useEffect(() => {
    fetchStatus();
    fetchSchedules();
    fetchCredits();
    fetchContacts();
    fetchGroups();
    fetchReplies();
    fetchIntegrations();
    fetchReminders();
    requestNotifPermission();
    registerPushNotifications();

    socket.on('status', (newStatus) => {
      const appliedStatus = applyConnectionStatus(newStatus);
      setStatusLoading(false);
      if (appliedStatus !== newStatus) return;
      if (appliedStatus === 'connected') {
        setQrCode(null);
        setPairingCode(null);
        setPairingLoading(false);
        clearPairingCodeTimeout();
        fetchContacts();
      }
      if (appliedStatus === 'qr-scanned' || appliedStatus === 'syncing') {
        setQrCode(null); // Hide QR immediately
        setPairingLoading(false);
        clearPairingCodeTimeout();
      }
      if (appliedStatus === 'disconnected') setUserInfo(null);
    });

    socket.on('qr', (qr) => {
      if (shouldIgnoreOlderConnectionStatus(statusRef.current, 'qr')) return;
      setQrCode(qr);
      applyConnectionStatus('qr');
    });

    socket.on('user-info', (info) => {
      setUserInfo(info);
      fetchContacts();
    });

    socket.on('schedules-updated', () => {
      fetchSchedules();
    });

    socket.on('contacts-updated', () => {
      fetchContacts();
    });

    socket.on('contacts-sync-ready', () => {
      setContactSyncMessage('New WhatsApp contacts are ready to sync.');
    });

    socket.on('groups-updated', (newGroups) => {
      setGroups(newGroups);
    });

    socket.on('pairing-code', (payload) => {
      const code = typeof payload === 'string' ? payload : payload?.code;
      const phone = typeof payload === 'string' ? getNormalizedPairingPhone() : payload?.phone;
      setPairingCode(code);
      setPairingCodePhone(phone || '');
      setPairingLoading(false);
      setUsePairingCode(true);
      clearPairingCodeTimeout();
    });

    socket.on('error', (msg) => {
      alert(msg);
      setPairingLoading(false);
      clearPairingCodeTimeout();
    });

    const handleClickOutside = (e) => {
      if (!e.target.closest('.phone-input-container')) {
        setShowSuggestions(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      socket.off('status');
      socket.off('qr');
      socket.off('user-info');
      socket.off('schedules-updated');
      socket.off('contacts-updated');
      socket.off('contacts-sync-ready');
      socket.off('groups-updated');
      socket.off('pairing-code');
      socket.off('error');
      window.removeEventListener('mousedown', handleClickOutside);
      clearPairingCodeTimeout();
    };
  }, [user.id]);

  useEffect(() => {
    const aiReply = autoReplies.find(r => r.keyword === '*' || r.keyword === '*DISABLED');
    if (aiReply && !aiContext) {
      setAiContext(aiReply.reply);
    }
  }, [autoReplies]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [channel]);

  useEffect(() => {
    const triggered = new Set();
    const interval = setInterval(() => {
      const now = Date.now();
      reminders.forEach(r => {
        if (r.status !== 'pending') return;
        if (triggered.has(r.id)) return;
        const scheduledAt = new Date(r.scheduled_at).getTime();
        if (scheduledAt <= now) {
          triggered.add(r.id);
          showBrowserNotification(r);
          scheduleCapacitorNotification(r);
          axios.put(`${API_URL}/api/reminders/${r.id}`, { status: 'triggered' }).catch(() => { });
          setReminders(prev => prev.map(p => p.id === r.id ? { ...p, status: 'triggered' } : p));
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [reminders]);

  const isRealPhoneNumber = (waId) => {
    const value = String(waId || '');
    const clean = value.replace(/\D/g, '');
    return clean.length >= 7 && clean.length <= 15 && clean === value;
  };

  const getContactName = (waId) => {
    return getContactDisplayName(contacts, waId);
  };


  const fetchContacts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/contacts`);
      setContacts(res.data || {});
    } catch (err) {
      console.error('Failed to fetch contacts:', err.message);
    }
  };

  const handleSyncContacts = async () => {
    triggerSelection();
    if (status !== 'connected') {
      triggerSelection();
      alert('Connect WhatsApp before syncing contacts.');
      return;
    }

    setIsContactSyncing(true);
    setContactSyncMessage('Syncing saved WhatsApp contacts and photos...');

    try {
      const res = await axios.post(`${API_URL}/api/contacts/sync`);
      await fetchContacts();
      const synced = res.data?.contactsSynced || 0;
      const photos = res.data?.photosSynced || 0;
      const removed = res.data?.removedInvalid || 0;
      const parts = [];
      if (synced) parts.push(`${synced} contacts`);
      if (photos) parts.push(`${photos} photos`);
      if (removed) parts.push(`${removed} invalid entries cleaned`);
      setContactSyncMessage(parts.length ? `Synced ${parts.join(', ')}.` : 'Contacts are already up to date.');
      triggerSelection();
    } catch (err) {
      triggerSelection();
      setContactSyncMessage('');
      alert(err.response?.data?.error || 'Failed to sync contacts');
    } finally {
      setIsContactSyncing(false);
    }
  };





  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/groups`);
      setGroups(res.data);
    } catch (err) {
      console.error('Failed to fetch groups');
    }
  };

  const fetchStatus = async () => {
    try {
      setStatusLoading(true);
      const res = await axios.get(`${API_URL}/api/status`);
      const nextStatus = res.data.status || 'disconnected';
      const currentStatus = statusRef.current;
      if (shouldIgnoreOlderConnectionStatus(currentStatus, nextStatus)) return;

      applyConnectionStatus(nextStatus);
      setQrCode(res.data.qr || null);
      setUserInfo(res.data.userInfo || null);
    } catch (err) {
      applyConnectionStatus('disconnected');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleRequestPairingCode = () => {
    const normalizedPhone = getNormalizedPairingPhone();
    if (normalizedPhone.length < 7 || normalizedPhone.length > 15) {
      alert('Please enter a valid phone number with country code');
      return;
    }
    clearPairingCodeTimeout();
    setUsePairingCode(true);
    setPairingLoading(true);
    setPairingCode(null);
    setPairingCodePhone(normalizedPhone);
    socket.emit('request-pairing-code', { userId: user.id, phone: pairingPhone, countryCode: pairingCountryCode });
    pairingCodeTimeoutRef.current = setTimeout(() => {
      setPairingLoading(false);
      pairingCodeTimeoutRef.current = null;
      alert('Pairing code took too long to generate. Please check the number and try again.');
    }, 45000);
  };

  const handleCopyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleAddRecipient = () => {
    if (!formData.phone.trim()) return;

    let clean = formData.phone.replace(/\D/g, '');
    if (!formData.phone.includes('@g.us')) {
      if (clean.length === 10) clean = `${getDefaultCountryCode()}${clean}`;
    } else {
      clean = formData.phone; // Group ID
    }

    if (clean && !selectedRecipients.includes(clean)) {
      setSelectedRecipients([...selectedRecipients, clean]);
      setFormData({ ...formData, phone: '' });
      setShowSuggestions(false);
    }
  };

  // Custom Input for DatePicker
  const CustomDateInput = React.forwardRef(({ value, onClick }, ref) => (
    <button type="button" className="datepicker-custom-input" onClick={onClick} ref={ref}>
      <Calendar size={18} />
      {value}
    </button>
  ));

  const fetchSchedules = async () => {
    try {
      setSchedulesLoading(true);
      const res = await axios.get(`${API_URL}/api/schedules`);
      const data = res.data || [];

      // Functional update with equality check to prevent flickering
      setSchedules(prev => {
        if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
        return data;
      });
    } catch (err) {
      console.error('Failed to fetch schedules:', err.message);
    } finally {
      setSchedulesLoading(false);
    }
  };

  const fetchCredits = async () => {
    try {
      setCreditsLoading(true);
      const res = await axios.get(`${API_URL}/api/credits`);
      setCredits(res.data);
    } catch (err) {
      console.error('Failed to fetch credits:', err.message);
    } finally {
      setCreditsLoading(false);
    }
  };

  const handleGenerateAiMessage = async (customPrompt) => {
    const promptToUse = customPrompt || aiPrompt;
    if (!promptToUse.trim() && !formData.message.trim()) return;

    setIsAiGenerating(true);
    try {
      const res = await axios.post(`${API_URL}/api/ai/generate`, {
        prompt: promptToUse,
        context: formData.message
      });
      setFormData({ ...formData, message: res.data.text });
      setIsAiUsed(true); // mark that AI was used for credit calculation
      setShowAiPrompt(false);
      setAiPrompt('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate AI message');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const fetchReplies = async () => {
    try {
      const { data, error } = await supabase
        .from('auto_replies')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setAutoReplies(data);
    } catch (err) {
      console.error('Failed to fetch auto-replies:', err.message);
    }
  };

  const getFileCategory = (file) => {
    if (file.type.startsWith('image/')) return 'images';
    if (file.type.startsWith('video/')) return 'videos';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'documents';
  };

  const fetchAutoReplies = async () => {
    const { data, error } = await supabase.from('auto_replies').select('*');
    if (!error) setAutoReplies(data);
  };

  const fetchReminders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/reminders`);
      const data = res.data || [];
      setReminders(data);
      if (Capacitor.isNativePlatform()) {
        const now = Date.now();
        data.forEach(r => {
          if (r.status === 'pending' && new Date(r.scheduled_at).getTime() > now) {
            scheduleCapacitorNotification(r);
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch reminders:', err.message);
    }
  };

  const pushRegisteredRef = React.useRef(false);

  const registerPushNotifications = async () => {
    if (Capacitor.isNativePlatform()) {
      if (pushRegisteredRef.current) return; // Already registered this session
      try {
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive !== 'granted') {
          console.warn('[Push] Push notifications permission was denied');
          return;
        }

        // Remove all existing listeners before adding new ones to prevent duplicates
        await PushNotifications.removeAllListeners();

        PushNotifications.addListener('registration', async (token) => {
          console.log('[Push] Native device registered, token:', token.value);
          try {
            await axios.post(`${API_URL}/api/devices/register`, {
              device_token: token.value,
              device_type: Capacitor.getPlatform()
            }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            pushRegisteredRef.current = true;
          } catch (err) {
            console.error('[Push] Failed to register native device token with backend:', err.message);
          }
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.error('[Push] Native registration error:', err.error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[Push] Notification received in foreground:', notification);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('[Push] Notification action performed:', notification);
        });

        await PushNotifications.register();
      } catch (err) {
        console.error('[Push] Failed to initialize native push notifications:', err.message);
      }
    } else {
      // Browser: use Firebase JS SDK for real FCM web push token
      try {
        if (!('Notification' in window)) return;
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('[Push] Browser notifications permission was denied');
          return;
        }

        const { initializeApp, getApps } = await import('firebase/app');
        const { getMessaging, getToken } = await import('firebase/messaging');

        const firebaseConfig = {
          apiKey: 'AIzaSyDjrsBB0wLBh3NyUFHwMPD3fpgntHiWuYI',
          projectId: 'lateron-63dee',
          messagingSenderId: '648957702030',
          appId: '1:648957702030:web:a89199756655681ccf7edf'
        };

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const messaging = getMessaging(app);

        // Explicitly register the service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('[Push] Service worker registered successfully:', registration);

        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration
        });

        if (token) {
          console.log('[Push] Browser FCM token:', token);
          await axios.post(`${API_URL}/api/devices/register`, {
            device_token: token,
            device_type: 'web'
          }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          pushRegisteredRef.current = true;
        }
      } catch (err) {
        console.error('[Push] Failed to initialize browser push notifications:', err.message);
      }
    }
  };

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setReminderNotifPermission(result);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (isSubmittingReminder) return;
    triggerSelection();
    if (!reminderForm.title.trim()) {
      triggerSelection();
      alert('Please enter a reminder title');
      return;
    }
    setIsSubmittingReminder(true);
    try {
      const res = await axios.post(`${API_URL}/api/reminders`, {
        title: reminderForm.title,
        description: reminderForm.description,
        scheduled_at: reminderForm.scheduled_at.toISOString(),
        recurrence: reminderForm.recurrence
      });
      const newReminder = res.data;
      setReminderForm({ title: '', description: '', scheduled_at: new Date(), recurrence: 'none' });
      fetchReminders();
      triggerSelection();
      if (newReminder && new Date(newReminder.scheduled_at).getTime() > Date.now()) {
        scheduleCapacitorNotification(newReminder);
      }
    } catch (err) {
      triggerSelection();
      alert('Failed to create reminder: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmittingReminder(false);
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/reminders/${id}`);
      fetchReminders();
      // Cancel any local scheduled notification
      if (Capacitor.isNativePlatform()) {
        try {
          const notifId = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
          await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
        } catch (e) { /* ignore */ }
      }
    } catch (err) {
      alert('Failed to delete reminder');
    }
  };

  const scheduleCapacitorNotification = async (reminder) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const notifId = reminder.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      await LocalNotifications.schedule({
        notifications: [{
          title: 'LaterOn Reminder',
          body: reminder.title,
          id: notifId,
          schedule: { at: new Date(reminder.scheduled_at) },
          extra: { reminderId: reminder.id }
        }]
      });
    } catch (err) {
      console.error('Failed to schedule capacitor notification:', err);
    }
  };

  const showBrowserNotification = (reminder) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const n = new Notification('LaterOn Reminder', {
        body: reminder.title,
        icon: '/favicon.ico',
        tag: reminder.id
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
      setTimeout(() => n.close(), 10000);
    } catch (err) {
      console.error('Failed to show browser notification:', err);
    }
  };

  const fetchSequences = async () => {
    try {
      const response = await fetch(`${API_URL}/api/drip/sequences`, {
        headers: { 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) setDripSequences(data);
    } catch (err) {
      console.error('Failed to fetch sequences:', err);
    }
  };

  useEffect(() => {
    if (activeView === 'business') {
      fetchAutoReplies();
      fetchSequences();
    }
  }, [activeView]);

  const uploadFileToSupabase = async (file) => {
    const category = getFileCategory(file);
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = `${user.id}/${category}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    triggerSelection();
    setLoading(true);

    try {
      let mediaUrl = null;
      let mediaType = null;

      if (selectedFile) {
        mediaUrl = await uploadFileToSupabase(selectedFile);
        mediaType = selectedFile.type;
      } else if (filePreview && filePreview.url && filePreview.url.startsWith('http')) {
        mediaUrl = filePreview.url;
        mediaType = filePreview.rawType;
      }

      const scheduledAt = scheduledDate.toISOString();
      let finalRecurrence = formData.recurrence === 'custom'
        ? `custom:${formData.customDays.sort().join(',')}`
        : formData.recurrence;

      if (channel === 'calendar') {
        if (!meetingTitle.trim()) {
          triggerSelection();
          alert('Please fill in meeting title');
          setLoading(false);
          return;
        }
        const startTime = scheduledDate;
        const endTime = new Date(startTime.getTime() + meetingDuration * 60000);
        const userPhone = userInfo?.id || user?.phone || formData.phone || '';
        const customLinkVal = meetingPlatform === 'custom' ? (formData.customLink || '') : '';
        const meetingLink = generateMeetingLink(meetingPlatform, userPhone, customLinkVal, personalMeetLink, personalZoomLink);
        const metadata = {
          title: meetingTitle,
          platform: meetingPlatform,
          custom_link: customLinkVal,
          meetingUrl: meetingLink,
          duration: meetingDuration,
          notify_whatsapp: meetingNotifyWhatsApp,
          notify_email: meetingNotifyEmail,
          reminder_timing: meetingReminderTiming,
          end_time: endTime.toISOString()
        };
        const platformLabel = { google_meet: 'Google Meet', zoom: 'Zoom Call', whatsapp_call: 'WhatsApp Call', phone: 'Phone Call', custom: 'Online Call' }[meetingPlatform] || 'Online Call';
        const defaultMessage = formData.message || `You're invited to: ${meetingTitle}
Date & Time: ${format(startTime, 'MMMM d, yyyy h:mm aa')}
Platform: ${platformLabel}
Join Link: ${meetingLink}

Looking forward to connecting!`;
        const recipientPhone = formData.phone?.trim() || (formData.emailTo?.trim() ? formData.emailTo.trim() : 'Client Meeting');
        const scheduleData = {
          phone: recipientPhone,
          emailTo: formData.emailTo?.trim() || null,
          message: defaultMessage,
          scheduledAt: startTime.toISOString(),
          recurrence: 'none',
          channel: 'calendar',
          metadata,
          usedAi: isAiUsed
        };
        if (editingId) {
          await axios.put(`${API_URL}/api/schedules/${editingId}`, scheduleData);
          setEditingId(null);
        } else {
          await axios.post(`${API_URL}/api/schedules`, scheduleData);
        }
        setIsAiUsed(false);
        setMeetingTitle('');
        setMeetingPlatform('google_meet');
        setMeetingDuration(30);
        setMeetingNotifyWhatsApp(true);
        setMeetingNotifyEmail(true);
        setMeetingReminderTiming('24h');
        setFormData({ phone: '', message: '', recurrence: 'none', customDays: [], customLink: '' });
        setScheduledDate(new Date());
        setSelectedFile(null);
        setFilePreview(null);
        setSidebarStep(1);
        fetchSchedules();
        fetchCredits();
        setLoading(false);
        triggerSelection();
        return;
      }

      if (channel === 'email') {
        const targetEmail = (formData.emailTo || emailTo || '').trim();
        const targetSubject = (formData.emailSubject || emailSubject || '').trim();
        if (!targetEmail || !targetSubject) {
          triggerSelection();
          alert('Please fill in email recipient and subject');
          setLoading(false);
          return;
        }
        const scheduleData = {
          phones: [targetEmail],
          message: formData.message,
          scheduledAt,
          recurrence: finalRecurrence,
          channel: 'email',
          emailTo: targetEmail,
          emailSubject: targetSubject,
          usedAi: isAiUsed
        };

        if (editingId) {
          await axios.put(`${API_URL}/api/schedules/${editingId}`, {
            phone: targetEmail,
            message: formData.message,
            scheduledAt,
            recurrence: finalRecurrence,
            channel: 'email',
            emailTo: targetEmail,
            emailSubject: targetSubject
          });
          setEditingId(null);
        } else {
          await axios.post(`${API_URL}/api/schedules`, scheduleData);
        }

        setIsAiUsed(false);
        setFormData({ phone: '', message: '', recurrence: 'none', customDays: [] });
        setSelectedRecipients([]);
        setEmailTo('');
        setEmailSubject('');
        setScheduledDate(new Date());
        setSelectedFile(null);
        setFilePreview(null);
        setSidebarStep(1);
        fetchSchedules();
        fetchCredits();
        setLoading(false);
        triggerSelection();
        return;
      }

      if (channel === 'telegram') {
        const targetChat = selectedTelegramChat || telegramStatus.config?.chat_id || 'telegram_chat';
        const scheduleData = {
          phones: [targetChat],
          phone: targetChat,
          message: formData.message,
          scheduledAt,
          recurrence: finalRecurrence,
          channel: 'telegram',
          usedAi: isAiUsed
        };

        if (editingId) {
          await axios.put(`${API_URL}/api/schedules/${editingId}`, {
            phone: targetChat,
            message: formData.message,
            scheduledAt,
            recurrence: finalRecurrence,
            channel: 'telegram'
          });
          setEditingId(null);
        } else {
          await axios.post(`${API_URL}/api/schedules`, scheduleData);
        }

        setIsAiUsed(false);
        setFormData({ phone: '', message: '', recurrence: 'none', customDays: [] });
        setScheduledDate(new Date());
        setSelectedFile(null);
        setFilePreview(null);
        setSidebarStep(1);
        fetchSchedules();
        fetchCredits();
        setLoading(false);
        triggerSelection();
        return;
      }

      let cleanPhone = formData.phone.replace(/\D/g, '');
      let finalPhone = cleanPhone;

      if (!formData.phone.includes('@g.us')) {
        const countryCode = getDefaultCountryCode();
        if (cleanPhone.length === 10) finalPhone = `${countryCode}${cleanPhone}`;
        else if (cleanPhone.length === (10 + countryCode.length) && cleanPhone.startsWith(countryCode)) finalPhone = cleanPhone;
      } else {
        finalPhone = formData.phone;
      }

      // Handle multiple recipients
      const recipientsToProcess = [...selectedRecipients];
      // Add current typing phone if it's valid and not already in list
      if (formData.phone.trim()) {
        let clean = formData.phone.replace(/\D/g, '');
        if (!formData.phone.includes('@g.us')) {
          if (clean.length === 10) clean = `${getDefaultCountryCode()}${clean}`;
        }
        if (!recipientsToProcess.includes(clean)) recipientsToProcess.push(clean);
      }

      if (recipientsToProcess.length === 0) {
        triggerSelection();
        alert('Please add at least one recipient');
        setLoading(false);
        return;
      }

      const scheduleData = {
        phones: recipientsToProcess,
        message: formData.message,
        scheduledAt: scheduledAt,
        recurrence: finalRecurrence,
        mediaUrl: mediaUrl,
        mediaType: mediaType || (selectedFile ? selectedFile.type : null),
        isVoiceNote: isVoiceNote,
        channel: 'whatsapp',
        usedAi: isAiUsed
      };

      if (editingId) {
        await axios.put(`${API_URL}/api/schedules/${editingId}`, {
          phone: recipientsToProcess[0],
          message: formData.message,
          scheduledAt,
          recurrence: finalRecurrence,
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
          status: 'pending',
          channel: 'whatsapp'
        });
        setEditingId(null);
      } else {
        await axios.post(`${API_URL}/api/schedules`, scheduleData);
      }

      setIsAiUsed(false);
      setFormData({ phone: '', message: '', recurrence: 'none', customDays: [] });
      setSelectedRecipients([]);
      setScheduledDate(new Date());
      setSelectedFile(null);
      setFilePreview(null);
      setIsVoiceNote(false);
      setSidebarStep(1);
      fetchSchedules();
      fetchCredits();
      triggerSelection();
    } catch (err) {
      triggerSelection();
      if (err.response?.status === 402) {
        const d = err.response.data;
        alert(`⚠️ Not enough Later Credits!\n\nYou need ${d.credits_required} credits but have ${d.credits_available}.\n\nPlease purchase more credits from the Credits section.`);
      } else {
        alert('Failed to save message: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, asVoiceNote = false) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 16 * 1024 * 1024) {
      alert('File size exceeds 16MB limit');
      return;
    }

    setSelectedFile(file);
    setIsVoiceNote(asVoiceNote);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview({ type: 'image', url: reader.result });
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      setFilePreview({ type: 'video', url: URL.createObjectURL(file) });
    } else if (file.type.startsWith('audio/')) {
      setFilePreview({ type: 'audio', name: file.name });
    } else {
      setFilePreview({ type: 'file', name: file.name });
    }
  };

  const handleDisconnectWhatsApp = () => {
    setShowDisconnectModal(true);
  };

  const confirmDisconnect = async () => {
    setShowDisconnectModal(false);
    try {
      await axios.post(`${API_URL}/api/logout`);
      setUserInfo(null);
      setQrCode(null);
      setPairingCode(null);
      setPairingCodePhone('');
      setPairingLoading(false);
      applyConnectionStatus('disconnected');
      setUsePairingCode(isMobile);
      socket.emit('join', user.id);
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  const handleSignOut = () => {
    setShowSignOutModal(true);
  };

  const confirmSignOut = async () => {
    setShowSignOutModal(false);
    try {
      // Just sign out of Supabase and clear local session
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }
  };
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');

  const handleSaveContact = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      alert('Please enter a valid 10-digit number first');
      return;
    }
    setShowSaveModal(true);
  };

  const submitSaveContact = async () => {
    if (!newContactName) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .upsert({
          user_id: user.id,
          wa_id: formData.phone,
          name: newContactName
        }, { onConflict: 'user_id,wa_id' });

      if (error) throw error;

      fetchContacts();
      setShowSaveModal(false);
      setNewContactName('');
    } catch (err) {
      alert('Failed to save contact');
    }
  };

  const deleteSchedule = async (itemOrId) => {
    const isObject = typeof itemOrId === 'object' && itemOrId !== null;
    const id = isObject ? itemOrId.id : itemOrId;
    const isInstagram = isObject && itemOrId.channel === 'instagram';

    try {
      if (isInstagram) {
        await axios.delete(`${API_URL}/api/instagram/posts/${id}`);
      } else {
        await axios.delete(`${API_URL}/api/schedules/${id}`);
      }
      fetchSchedules();
    } catch (err) {
      alert('Failed to delete schedule');
    }
  };

  const handleClearHistory = () => {
    setShowClearHistoryModal(true);
  };

  const confirmClearHistory = async () => {
    setShowClearHistoryModal(false);
    try {
      await axios.delete(`${API_URL}/api/schedules/history`);
      fetchSchedules();
    } catch (err) {
      alert('Failed to clear history');
    }
  };

  const handleEdit = (schedule) => {
    const isCustom = schedule.recurrence && schedule.recurrence.startsWith('custom:');
    setFormData({
      phone: schedule.phone.startsWith('91') ? schedule.phone.slice(2) : schedule.phone,
      message: schedule.message,
      recurrence: schedule.recurrence || 'none',
      customDays: isCustom ? schedule.recurrence.split(':')[1].split(',').map(Number) : []
    });
    setScheduledDate(new Date(schedule.scheduled_at));
    setEditingId(schedule.id);

    // Populate media preview if exists
    const mUrl = schedule.media_url || schedule.mediaUrl;
    if (mUrl) {
      const mType = schedule.media_type || schedule.mediaType || '';
      let type = 'file';
      if (mType.startsWith('image/')) type = 'image';
      else if (mType.startsWith('video/')) type = 'video';
      else if (mType.startsWith('audio/')) type = 'audio';

      setFilePreview({
        url: mUrl,
        type: type,
        name: 'Existing Attachment',
        rawType: mType
      });
      setIsVoiceNote(schedule.is_voice_note || schedule.isVoiceNote || false);
      setSelectedFile(null); // It's an existing file, not a new upload yet
    } else {
      setFilePreview(null);
      setSelectedFile(null);
      setIsVoiceNote(false);
    }

    document.querySelector('.sidebar').scrollTop = 0;
    setSidebarStep(1);
    if (isMobile) setShowMobileForm(true);
  };

  const handleCalendarEventDrop = async (id, newDate) => {
    try {
      await axios.patch(`${API_URL}/api/schedules/${id}`, { scheduledAt: newDate, status: 'pending' });
      fetchSchedules();
    } catch (err) {
      alert('Failed to reschedule: ' + err.message);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('auto_replies')
        .insert({
          user_id: user.id,
          keyword: replyFormData.keyword,
          reply: replyFormData.reply
        });

      if (error) throw error;

      setReplyFormData({ keyword: '', reply: '' });
      fetchReplies();
    } catch (err) {
      alert('Failed to save auto-reply');
    }
  };


  const handleRetryFailed = async () => {
    try {
      await axios.post(`${API_URL}/api/bulk/retry-failed`);
      fetchSchedules();
      setShowMenu(false);
    } catch (err) {
      alert('Failed to retry messages');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'To', 'Message', 'Scheduled At', 'Status', 'Recurrence'];
    const rows = schedules.map(s => [
      s.id,
      s.phone,
      s.message.replace(/,/g, ' '),
      s.scheduled_at || s.scheduledAt,
      s.status,
      s.recurrence || 'none'
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lateron_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    setShowMenu(false);
  };

  const deleteReply = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/replies/${id}`);
      fetchReplies();
    } catch (err) {
      alert('Failed to delete auto-reply');
    }
  };

  const insertEmoji = (emoji) => {
    setFormData(prev => ({
      ...prev,
      message: (prev.message || '') + emoji
    }));
  };

  const getEstimatedCredits = () => {
    if (channel === 'reminders') return 0;
    const hasAttachment = !!(selectedFile || filePreview);
    const base = hasAttachment ? 7 : 5;
    const aiCost = isAiUsed ? 3 : 0;
    return base + aiCost;
  };

  return (
    <div className={`dashboard-container channel-${channel}`}>
      <div className="right-channel-dock">
        <button
          className={`channel-strip ${channel === 'whatsapp' ? 'active' : ''}`}
          style={{ '--strip-accent': '#25d366' }}
          onClick={() => { setChannel('whatsapp'); }}
        >
          <span className="strip-label">WhatsApp</span>
          <span className="strip-icon"><WhatsAppIcon size={18} color="#25D366" /></span>
        </button>
        <button
          className={`channel-strip ${channel === 'email' ? 'active' : ''}`}
          style={{ '--strip-accent': '#ea4335' }}
          onClick={() => { setChannel('email'); setActiveView('scheduler'); }}
        >
          <span className="strip-label">Email</span>
          <span className="strip-icon"><Mail size={18} /></span>
        </button>
        <button
          className={`channel-strip ${channel === 'calendar' ? 'active' : ''}`}
          style={{ '--strip-accent': '#4285f4' }}
          onClick={() => { setChannel('calendar'); setActiveView('scheduler'); }}
        >
          <span className="strip-label">Meetings</span>
          <span className="strip-icon"><Calendar size={18} /></span>
        </button>
        <button
          className={`channel-strip ${channel === 'telegram' ? 'active' : ''}`}
          style={{ '--strip-accent': '#0088cc' }}
          onClick={() => { setChannel('telegram'); setActiveView('scheduler'); }}
        >
          <span className="strip-label">Telegram</span>
          <span className="strip-icon"><TelegramIcon size={18} /></span>
        </button>
        <button
          className={`channel-strip ${channel === 'instagram' ? 'active' : ''}`}
          style={{ '--strip-accent': '#e1306c' }}
          onClick={() => { setChannel('instagram'); setActiveView('scheduler'); }}
        >
          <span className="strip-label">Instagram</span>
          <span className="strip-icon"><InstagramIcon size={18} /></span>
        </button>
        <button
          className={`channel-strip ${channel === 'reminders' ? 'active' : ''}`}
          style={{ '--strip-accent': '#f59e0b' }}
          onClick={() => { setChannel('reminders'); setActiveView('scheduler'); }}
        >
          <span className="strip-label">Reminders</span>
          <span className="strip-icon"><Bell size={18} /></span>
        </button>
      </div>
      <div className="brand-tagline">Messages, Scheduled.</div>
      <div className="app-wrapper">
        {/* Left Sidebar */}
        <aside className={`sidebar${isMobile && showServiceSelector ? ' sidebar-fullscreen' : ''}`}>
          <header className="header">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1 style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '1px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'baseline'
              }}>
                <span style={{ color: channel === 'email' ? '#a52a2a' : (channel === 'calendar' ? '#1a73e8' : 'var(--primary-dark)'), transition: 'color 0.3s' }}>Later</span>
                <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>On</span>
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!showServiceSelector && (
                <button
                  className="btn-icon"
                  onClick={() => {
                    triggerSelection();
                    setShowServiceSelector(true);
                    setSidebarStep(1);
                    setActiveView('scheduler');
                  }}
                  title="Switch Service / Channel"
                >
                  <Home size={18} color={channel === 'email' ? '#ea4335' : (channel === 'calendar' ? '#1a73e8' : '#25d366')} />
                </button>
              )}
              {!showServiceSelector && (
                <button
                  className={`btn-icon ${activeView === 'credits' ? 'active' : ''}`}
                  onClick={() => {
                    triggerSelection();
                    setActiveView(activeView === 'credits' ? 'scheduler' : 'credits');
                  }}
                  style={{
                    background: activeView === 'credits' ? 'rgba(26, 115, 232, 0.1)' : 'transparent'
                  }}
                  title="Later Credits Balance & Pricing"
                >
                  <Coins size={18} color="var(--primary)" />
                </button>
              )}
              {!showServiceSelector && channel === 'whatsapp' && (
                <button
                  className={`btn-icon ${activeView === 'business' ? 'active' : ''}`}
                  onClick={() => {
                    triggerSelection();
                    setActiveView(activeView === 'scheduler' ? 'business' : 'scheduler');
                    setCurrentBusinessTool(null);
                    setSidebarStep(1);
                  }}
                  title={activeView === 'scheduler' ? "Switch to Business Tools" : "Switch to LaterOn"}
                >
                  {activeView === 'scheduler' ? <WABusinessIcon size={22} /> : <Calendar size={20} color="var(--primary-dark)" />}
                </button>
              )}

              {!showServiceSelector && channel === 'whatsapp' && (
                <button className="btn-icon" onClick={() => { triggerSelection(); fetchStatus(); }} title="Refresh Connection Status">
                  <RefreshCcw size={18} color={status === 'connected' ? '#25d366' : '#667781'} />
                </button>
              )}
              {showServiceSelector && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Credit Balance Badge */}
                  <div
                    onClick={() => { triggerSelection(); setActiveView('credits'); setShowServiceSelector(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#f1f5f9',
                      padding: '6px 12px',
                      borderRadius: '100px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      border: '1px solid var(--border)'
                    }}
                    title="View Later Credits Balance"
                  >
                    <Coins size={14} color="var(--primary)" />
                    {creditsLoading ? <span className="skeleton-text" style={{ width: '30px', height: '0.8rem' }} /> : <span>{credits.total_balance}</span>}
                  </div>

                  {/* Profile Photo or Initials */}
                  {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                    <img
                      src={user.user_metadata.avatar_url || user.user_metadata.picture}
                      alt="User Profile"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '1.5px solid var(--border)',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--primary-light)',
                      color: 'var(--primary-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      border: '1.5px solid var(--border)'
                    }}>
                      {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Mobile Profile Strip — visible on mobile when a channel is active */}
          {isMobile && !showServiceSelector && !showMobileForm && channel && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: channel === 'email' ? '#fdf2f2' : (channel === 'calendar' ? '#f4f8ff' : (channel === 'telegram' ? '#e6f3ff' : (channel === 'instagram' ? '#fff0f5' : (channel === 'reminders' ? '#fffbeb' : '#f8fafc')))), display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: channel === 'email' ? '#ea4335' : (channel === 'calendar' ? '#1a73e8' : (channel === 'telegram' ? '#0088cc' : (channel === 'instagram' ? '#e1306c' : (channel === 'reminders' ? '#f59e0b' : 'var(--primary)')))), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', overflow: 'hidden', flexShrink: 0 }}>
                {channel === 'email' ? <Mail size={16} /> : channel === 'calendar' ? <Calendar size={16} /> : channel === 'telegram' ? <TelegramIcon size={16} color="white" /> : channel === 'instagram' ? <InstagramIcon size={16} color="white" /> : channel === 'reminders' ? <Bell size={16} /> : userInfo?.photo ? <img src={userInfo.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Check size={16} strokeWidth={3} />}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                  {channel === 'email' ? 'Email' : channel === 'calendar' ? 'Meetings' : channel === 'telegram' ? 'Telegram' : channel === 'instagram' ? (instagramStatus.config?.name || 'Instagram') : channel === 'reminders' ? 'Reminders' : (userInfo?.name || 'WhatsApp')}
                </p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>
                  {channel === 'email' ? (user?.email || 'Active') : channel === 'calendar' ? 'Event Sync Active' : channel === 'telegram' ? (telegramStatus.status === 'connected' ? `@${telegramStatus.config?.bot_username || 'bot'}` : 'Ready to Connect') : channel === 'instagram' ? (instagramStatus.status === 'connected' ? `@${instagramStatus.config?.username || 'account'}` : 'Ready to Connect') : channel === 'reminders' ? 'Reminders Active' : (status === 'connected' ? (userInfo?.id ? `+${userInfo.id}` : 'Connected') : 'Reconnecting...')}
                </p>
              </div>
              {channel === 'whatsapp' && status === 'connected' && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowWhatsAppManage(prev => !prev)}
                    style={{ height: '28px', padding: '0 8px', border: '1px solid var(--border)', background: 'white', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', flexShrink: 0, fontSize: '0.65rem', fontWeight: 700, borderRadius: '6px' }}
                  >
                    <Settings size={12} />
                    Manage
                  </button>
                  {showWhatsAppManage && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowWhatsAppManage(false)} />
                      <div style={{ position: 'absolute', bottom: '100%', right: 0, zIndex: 100, background: 'white', border: '1px solid var(--border)', boxShadow: '0 -4px 16px rgba(0,0,0,0.1)', minWidth: '160px', padding: '6px', marginBottom: '4px' }}>
                        <div onClick={() => { handleSyncContacts(); setShowWhatsAppManage(false); }} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: isContactSyncing ? 'wait' : 'pointer', fontSize: '0.75rem', fontWeight: 600, color: isContactSyncing ? 'var(--primary)' : 'var(--text)' }}>
                          <RefreshCcw size={13} className={isContactSyncing ? 'spin' : ''} />
                          Sync Contacts
                        </div>
                        <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                        <div onClick={() => { setShowWhatsAppManage(false); handleDisconnectWhatsApp(); }} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: '#ef4444' }}>
                          <WifiOff size={13} />
                          Disconnect
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Connection & Form Area */}
          <div className="sidebar-form-container" style={{
            flex: 1,
            display: (isMobile && (showMobileForm || (!showServiceSelector && (
              (channel !== 'whatsapp' && channel !== 'telegram' && channel !== 'instagram') ||
              (channel === 'whatsapp' && status === 'connected') ||
              (channel === 'telegram' && telegramStatus.status === 'connected') ||
              (channel === 'instagram' && instagramStatus.status === 'connected')
            )))) ? 'none' : 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
          }}>
            {hoveredSchedule ? (
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    background: 'white',
                    padding: '24px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a73e8' }}>
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 2px 0' }}>Message Details</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Quick Preview</p>
                    </div>
                  </div>

                  <div style={{
                    background: '#f8f9fa',
                    padding: '16px',
                    border: '1px solid var(--border)',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {hoveredSchedule.message}
                  </div>

                  {(hoveredSchedule.media_url || hoveredSchedule.mediaUrl) && (
                    <div style={{ border: '1px solid var(--border)', overflow: 'hidden', maxHeight: '150px' }}>
                      {(hoveredSchedule.media_type || hoveredSchedule.mediaType)?.startsWith('image/') ? (
                        <img src={hoveredSchedule.media_url || hoveredSchedule.mediaUrl} alt="Preview" style={{ width: '100%', display: 'block' }} />
                      ) : (hoveredSchedule.media_type || hoveredSchedule.mediaType)?.startsWith('video/') ? (
                        <video src={hoveredSchedule.media_url || hoveredSchedule.mediaUrl} style={{ width: '100%', display: 'block' }} />
                      ) : (
                        <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <Paperclip size={14} />
                          <span>Attachment</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-main)', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={14} color="var(--text-muted)" />
                      <span style={{ fontWeight: 700 }}>{getContactName(hoveredSchedule.phone)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} color="var(--text-muted)" />
                      <span>{format(new Date(hoveredSchedule.scheduled_at || hoveredSchedule.scheduledAt), 'PPp')}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      color: hoveredSchedule.status === 'pending' ? 'var(--primary-dark)' : 'var(--text-muted)'
                    }}>
                      <Zap size={14} />
                      <span>Status: {hoveredSchedule.status}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '4px 0 0 0', textAlign: 'center' }}>
                    Click to edit this message
                  </p>
                </motion.div>
              </div>
            ) : showServiceSelector ? (
              <div style={{ padding: isMobile ? '16px' : '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {isMobile && <div style={{ textAlign: 'center', marginBottom: '12px' }}><h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', fontWeight: 800 }}>Select a Service</h2></div>}
                <div className="service-grid">
                  {/* WhatsApp Card */}
                  <div className={channel === 'whatsapp' ? 'active' : ''} style={{ borderColor: channel === 'whatsapp' ? '#25d366' : 'var(--border)', background: channel === 'whatsapp' ? '#f0fff4' : 'white' }}
                    onClick={() => { triggerSelection(); setChannel('whatsapp'); setShowServiceSelector(false); setActiveView('scheduler'); if (isMobile && status === 'connected') { setFormStep(1); setShowMobileForm(true); } }}
                    onMouseOver={e => { if (channel !== 'whatsapp') e.currentTarget.style.borderColor = '#25d366'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = channel === 'whatsapp' ? '#25d366' : 'var(--border)'; }}
                  >
                    <div style={{ background: '#25d366' }}>
                      <WhatsAppIcon size={24} color="white" />
                    </div>
                    <div>
                      <h4 style={{ color: '#1a5c3e' }}>WhatsApp</h4>
                      <p style={{ color: '#4a7c62' }}>
                        {statusLoading ? <span className="skeleton-text" style={{ width: '140px' }} /> : (userInfo ? 'Connected' : 'Connect QR / Pairing Code')}
                      </p>
                    </div>
                  </div>

                  {/* Email Card */}
                  <div className={channel === 'email' ? 'active' : ''} style={{ borderColor: channel === 'email' ? '#ea4335' : 'var(--border)', background: channel === 'email' ? '#fdf2f2' : 'white' }}
                    onClick={() => { triggerSelection(); setChannel('email'); setShowServiceSelector(false); setActiveView('scheduler'); if (isMobile) { setFormStep(1); setShowMobileForm(true); } }}
                    onMouseOver={e => { if (channel !== 'email') e.currentTarget.style.borderColor = '#ea4335'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = channel === 'email' ? '#ea4335' : 'var(--border)'; }}
                  >
                    <div style={{ background: '#ea4335', color: 'white' }}>
                      <Mail size={24} />
                    </div>
                    <div>
                      <h4 style={{ color: '#b91c1c' }}>Email</h4>
                      <p style={{ color: '#dc2626' }}>Connected</p>
                    </div>
                  </div>

                  {/* Google Calendar Card */}
                  <div className={channel === 'calendar' ? 'active' : ''} style={{ borderColor: channel === 'calendar' ? '#1a73e8' : 'var(--border)', background: channel === 'calendar' ? '#e8f0fe' : 'white' }}
                    onClick={() => { triggerSelection(); setChannel('calendar'); setShowServiceSelector(false); setActiveView('scheduler'); if (isMobile) { setFormStep(1); setShowMobileForm(true); } }}
                    onMouseOver={e => { if (channel !== 'calendar') e.currentTarget.style.borderColor = '#1a73e8'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = channel === 'calendar' ? '#1a73e8' : 'var(--border)'; }}
                  >
                    <div style={{ background: '#1a73e8' }}>
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h4 style={{ color: '#174ea6' }}>Meetings</h4>
                      <p style={{ color: '#1a73e8' }}>
                        {integrations.some(i => i.provider === 'gmail_oauth') ? 'Connected' : 'Configure Google Meet'}
                      </p>
                    </div>
                  </div>

                  {/* Telegram Card */}
                  <div className={channel === 'telegram' ? 'active' : ''} style={{ borderColor: channel === 'telegram' ? '#0088cc' : 'var(--border)', background: channel === 'telegram' ? '#e6f3ff' : 'white' }}
                    onClick={() => { triggerSelection(); setChannel('telegram'); setShowServiceSelector(false); setActiveView('scheduler'); if (isMobile && telegramStatus.status === 'connected') { setFormStep(1); setShowMobileForm(true); } }}
                    onMouseOver={e => { if (channel !== 'telegram') e.currentTarget.style.borderColor = '#0088cc'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = channel === 'telegram' ? '#0088cc' : 'var(--border)'; }}
                  >
                    <div style={{ background: '#0088cc' }}>
                      <TelegramIcon size={24} color="white" />
                    </div>
                    <div>
                      <h4 style={{ color: '#005f9e' }}>Telegram</h4>
                      <p style={{ color: '#0088cc' }}>
                        {isTelegramStatusLoading ? <span className="skeleton-text" style={{ width: '100px' }} /> : (telegramStatus.status === 'connected' ? 'Connected' : 'Not Connected')}
                      </p>
                    </div>
                  </div>

                  {/* Instagram Card */}
                  <div className={channel === 'instagram' ? 'active' : ''} style={{ borderColor: channel === 'instagram' ? '#e1306c' : 'var(--border)', background: channel === 'instagram' ? '#fff0f5' : 'white' }}
                    onClick={() => { triggerSelection(); setChannel('instagram'); setShowServiceSelector(false); setActiveView('scheduler'); if (isMobile && instagramStatus.status === 'connected') { setFormStep(1); setShowMobileForm(true); } }}
                    onMouseOver={e => { if (channel !== 'instagram') e.currentTarget.style.borderColor = '#e1306c'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = channel === 'instagram' ? '#e1306c' : 'var(--border)'; }}
                  >
                    <div style={{ background: '#e1306c' }}>
                      <InstagramIcon size={24} color="white" />
                    </div>
                    <div>
                      <h4 style={{ color: '#a81c4e' }}>Instagram</h4>
                      <p style={{ color: '#e1306c' }}>
                        {isInstagramStatusLoading ? <span className="skeleton-text" style={{ width: '100px' }} /> : (instagramStatus.status === 'connected' ? 'Connected' : 'Not Connected')}
                      </p>
                    </div>
                  </div>

                  {/* Personal Reminders Card */}
                  <div className={channel === 'reminders' ? 'active' : ''} style={{ borderColor: channel === 'reminders' ? '#f59e0b' : 'var(--border)', background: channel === 'reminders' ? '#fffbeb' : 'white' }}
                    onClick={() => { triggerSelection(); setChannel('reminders'); setShowServiceSelector(false); setActiveView('scheduler'); if (isMobile) { setFormStep(1); setShowMobileForm(true); } }}
                    onMouseOver={e => { if (channel !== 'reminders') e.currentTarget.style.borderColor = '#f59e0b'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = channel === 'reminders' ? '#f59e0b' : 'var(--border)'; }}
                  >
                    <div style={{ background: '#f59e0b' }}>
                      <Bell size={24} />
                    </div>
                    <div>
                      <h4 style={{ color: '#b45309' }}>Personal Reminders</h4>
                      <p style={{ color: '#d97706' }}>Never Forget</p>
                    </div>
                  </div>
                </div>

                {/* Free Consultation */}
                <div
                  onClick={() => setShowCalModal(true)}
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    gridColumn: '1 / -1',
                    marginTop: '16px'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#222'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#1a1a1a'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🎙️</span>
                    <div>
                      <div style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>Book a Free Support Call</div>
                      <div style={{ color: '#ccc', marginTop: '4px', fontSize: '0.72rem' }}>15 min — Get help with LaterOn</div>
                    </div>
                  </div>
                  <span style={{
                    padding: '5px 12px',
                    background: 'white',
                    color: '#1a1a1a',
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}>
                    Book
                  </span>
                </div>
                {isMobile && (
                  <div style={{
                    textAlign: 'center',
                    padding: '24px 0 0 0',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    borderTop: '1px solid var(--border)',
                    marginTop: '20px'
                  }}>
                    App Version 1.0.0
                  </div>
                )}
              </div>
            ) : (channel === 'whatsapp' && !userInfo && status !== 'connected') ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                textAlign: 'center'
              }}>
                {((status === 'qr' && qrCode) || (['connecting', 'disconnected', 'qr'].includes(status) && (usePairingCode || pairingLoading || pairingCode))) ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Link your WhatsApp</h3>

                    {!usePairingCode ? (
                      <>
                        <div style={{
                          background: 'white',
                          padding: '24px',
                          borderRadius: '6px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                          marginBottom: '24px',
                          display: 'inline-block',
                          border: '1px solid var(--border)'
                        }}>
                          <img src={qrCode} alt="QR" style={{ width: '220px', height: '220px', display: 'block' }} />
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '20px' }}>
                          Open WhatsApp on your phone,<br />
                          tap Menu or Settings and select<br />
                          <strong>Linked Devices</strong>.
                        </p>
                      </>
                    ) : (
                      <div style={{ marginBottom: '24px', width: '100%', maxWidth: '280px', margin: '0 auto 24px' }}>
                        {!pairingCode ? (
                          <div style={{ background: 'white', padding: '24px', borderRadius: '6px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-dark)', display: 'block', textAlign: 'left', marginBottom: '8px' }}>ENTER PHONE NUMBER</label>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', background: '#f0f2f5', borderRadius: '6px', border: '1px solid var(--border)', padding: '0 8px', minWidth: '76px' }}>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.9rem' }}>+</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={pairingCountryCode}
                                  onChange={e => setPairingCountryCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                  style={{ width: '42px', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)' }}
                                  aria-label="Country code"
                                />
                              </div>
                              <input
                                type="text"
                                inputMode="tel"
                                placeholder="Phone number"
                                value={pairingPhone}
                                onChange={e => setPairingPhone(e.target.value)}
                                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
                              />
                            </div>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'left', margin: '-8px 0 16px', lineHeight: '1.4' }}>
                              Use the same country code and phone number as your WhatsApp account.
                            </p>
                            <button
                              onClick={handleRequestPairingCode}
                              disabled={pairingLoading}
                              className="btn-primary"
                              style={{ width: '100%', padding: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                              {pairingLoading ? <RefreshCcw size={16} className="spin" /> : <Zap size={16} />}
                              {pairingLoading ? 'Generating...' : 'Get Pairing Code'}
                            </button>
                          </div>
                        ) : (
                          <div style={{ background: 'white', padding: '24px', borderRadius: '6px', border: '2px solid var(--primary)', boxShadow: '0 8px 30px rgba(37, 211, 102, 0.15)' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '12px' }}>YOUR PAIRING CODE</p>
                            {pairingCodePhone && (
                              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                                For WhatsApp number <strong style={{ color: 'var(--text)' }}>+{pairingCodePhone}</strong>
                              </p>
                            )}
                            <div
                              onClick={handleCopyCode}
                              style={{
                                fontSize: '2rem',
                                fontWeight: 900,
                                letterSpacing: '4px',
                                color: 'var(--primary-dark)',
                                fontFamily: 'monospace',
                                background: '#f0fff4',
                                padding: '16px',
                                borderRadius: '6px',
                                border: '1px dashed var(--primary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                position: 'relative'
                              }}
                              title="Click to copy"
                            >
                              {pairingCode}
                              {codeCopied && (
                                <div style={{
                                  position: 'absolute',
                                  top: '-12px',
                                  right: '-12px',
                                  background: 'var(--text)',
                                  color: 'white',
                                  fontSize: '0.6rem',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  letterSpacing: 'normal',
                                  fontWeight: 600
                                }}>
                                  Copied!
                                </div>
                              )}
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '16px', lineHeight: '1.4' }}>
                              Open WhatsApp &rarr; Linked Devices &rarr; <strong>Link with Phone Number</strong> and enter this code.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => setUsePairingCode(!usePairingCode)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-dark)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}
                    >
                      {usePairingCode ? <QrCode size={16} /> : <Phone size={16} />}
                      {usePairingCode ? 'Switch to QR Code' : 'Link with Phone Number'}
                    </button>
                  </motion.div>

                ) : (status === 'qr-scanned' || status === 'syncing') ? (
                  <motion.div
                    key="qr-scanned"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="wa-linking-panel"
                  >
                    <div className="wa-connection-stage" aria-hidden="true">
                      <div className="wa-device-node">
                        <Phone size={24} strokeWidth={2.2} />
                      </div>

                      <div className="wa-signal-track">
                        <span className="wa-signal-line" />
                        <span className="wa-signal-packet packet-one" />
                        <span className="wa-signal-packet packet-two" />
                      </div>

                      <div className="wa-whatsapp-node">
                        <div className="wa-node-glow" />
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.825.484 3.537 1.332 5.011L2 22l5.126-1.332A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="white" opacity="0.3" />
                          <path d="M17 14.5c-.3-.15-1.76-.87-2.03-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07a8.18 8.18 0 01-2.4-1.48 9.02 9.02 0 01-1.66-2.07c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.64-.93-2.25-.24-.59-.49-.51-.68-.52l-.57-.01c-.2 0-.52.07-.79.37-.28.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.34z" fill="white" />
                        </svg>
                      </div>
                    </div>

                    <div className="wa-linking-copy">
                      <h3>
                        {status === 'syncing' ? 'Syncing WhatsApp...' : 'Connecting to WhatsApp...'}
                      </h3>
                      <p>
                        {status === 'syncing'
                          ? 'Finalising secure WhatsApp session.'
                          : 'QR scanned. Securing the session.'}
                      </p>
                    </div>

                    <div className="wa-linking-steps">
                      <div className="wa-linking-step is-complete">
                        <Check size={12} strokeWidth={3} />
                        <span>Scanned</span>
                      </div>
                      <div className={`wa-linking-step ${status === 'syncing' ? 'is-complete' : 'is-active'}`}>
                        {status === 'syncing' ? <Check size={12} strokeWidth={3} /> : <span className="wa-step-spinner" />}
                        <span>Authorising</span>
                      </div>
                      <div className={`wa-linking-step ${status === 'syncing' ? 'is-active' : ''}`}>
                        <span className={status === 'syncing' ? 'wa-step-spinner' : 'wa-step-dot'} />
                        <span>Syncing</span>
                      </div>
                    </div>

                    <div className="wa-secure-chip">
                      <span className="wa-secure-orbit" aria-hidden="true" />
                      <span>{status === 'syncing' ? 'Syncing encrypted data' : 'Establishing secure link'}</span>
                      <span className="wa-secure-bars" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                      </span>
                    </div>
                  </motion.div>

                ) : (status === 'connecting' || (status === 'qr' && !qrCode)) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div className="loader"></div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Starting encrypted session...</p>
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <WifiOff size={40} color="#ef4444" style={{ marginBottom: '12px' }} />
                    <h4 style={{ fontWeight: 700 }}>Connection Lost</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Reconnecting to WhatsApp server...</p>
                    <button onClick={fetchStatus} className="btn-primary" style={{ padding: '8px 20px', borderRadius: '6px' }}>Retry Now</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* User Connected Profile Strip */}
                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: channel === 'email' ? '#fdf2f2' : (channel === 'calendar' ? '#f4f8ff' : (channel === 'telegram' ? '#e6f3ff' : (channel === 'instagram' ? '#fff0f5' : (channel === 'reminders' ? '#fffbeb' : '#f8fafc')))), display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    background: channel === 'email' ? '#ea4335' : (channel === 'calendar' ? '#1a73e8' : (channel === 'telegram' ? '#0088cc' : (channel === 'instagram' ? '#e1306c' : (channel === 'reminders' ? '#f59e0b' : (status === 'connected' ? 'var(--primary)' : '#e2e8f0'))))),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    overflow: 'hidden'
                  }}>
                    {channel === 'email' ? (
                      <Mail size={18} />
                    ) : channel === 'calendar' ? (
                      <Calendar size={18} />
                    ) : channel === 'telegram' ? (
                      <TelegramIcon size={18} color="white" />
                    ) : channel === 'instagram' ? (
                      instagramStatus.status === 'connected' && instagramStatus.config?.profile_picture_url ? (
                        <img src={instagramStatus.config.profile_picture_url} alt={instagramStatus.config.username} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                      ) : (
                        <InstagramIcon size={18} color="white" />
                      )
                    ) : channel === 'reminders' ? (
                      <Bell size={18} />
                    ) : status === 'connected' ? (
                      userInfo?.photo ? (
                        <img src={userInfo.photo} alt={userInfo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Check size={18} strokeWidth={3} />
                      )
                    ) : (
                      <RefreshCcw size={16} className="spin" />
                    )}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {channel === 'email' ? (user?.name || 'Email Service') : (channel === 'calendar' ? 'Meetings' : (channel === 'telegram' ? 'Telegram Companion' : (channel === 'instagram' ? (instagramStatus.status === 'connected' ? (instagramStatus.config?.name || 'Instagram') : 'Instagram') : (channel === 'reminders' ? 'Reminders' : (userInfo?.name || 'Active Account')))))}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {channel === 'email'
                        ? (user?.email || 'notifications@lateron.in')
                        : channel === 'calendar'
                          ? 'Event Sync Active'
                          : channel === 'telegram'
                            ? (telegramStatus.status === 'connected' ? `@${telegramStatus.config?.bot_username || 'custom_bot'}` : 'Ready to Connect')
                            : channel === 'instagram'
                              ? (instagramStatus.status === 'connected'
                                ? <>{`@${instagramStatus.config?.username || 'instagram_account'}`}{instagramStatus.config?.followers_count ? <span style={{ marginLeft: '6px', fontWeight: 600, color: '#e1306c' }}>{instagramStatus.config.followers_count.toLocaleString()} followers</span> : null}</>
                                : 'Ready to Connect')
                              : channel === 'reminders'
                                ? 'Reminders Active'
                                : (status === 'connected' ? `+${userInfo?.id}` : 'Reconnecting...')}
                    </p>
                  </div>
                  {channel === 'email' ? (
                    <button
                      onClick={() => setShowEmailConfig(true)}
                      style={{
                        height: '32px',
                        padding: '0 10px',
                        border: '1px solid #f8d7da',
                        background: 'white',
                        color: '#a52a2a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        borderRadius: '6px'
                      }}
                    >
                      <Mail size={14} />
                      Settings
                    </button>
                  ) : status === 'connected' && channel === 'whatsapp' && (
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setShowWhatsAppManage(prev => !prev)}
                        style={{
                          height: '32px',
                          padding: '0 10px',
                          border: '1px solid var(--border)',
                          background: 'white',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          flexShrink: 0,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          borderRadius: '6px'
                        }}
                      >
                        <Settings size={14} />
                        Manage
                      </button>
                      {showWhatsAppManage && (
                        <>
                          <div
                            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                            onClick={() => setShowWhatsAppManage(false)}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            zIndex: 100,
                            background: 'white',
                            border: '1px solid var(--border)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            minWidth: '180px',
                            padding: '6px',
                            marginTop: '4px'
                          }}>
                            <div
                              onClick={() => { handleSyncContacts(); setShowWhatsAppManage(false); }}
                              style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: isContactSyncing ? 'wait' : 'pointer', fontSize: '0.8rem', fontWeight: 600, color: isContactSyncing ? 'var(--primary)' : 'var(--text)' }}
                            >
                              <RefreshCcw size={15} className={isContactSyncing ? 'spin' : ''} />
                              Sync Contacts
                            </div>
                            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                            <div
                              onClick={() => { setShowWhatsAppManage(false); handleDisconnectWhatsApp(); }}
                              style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#ef4444' }}
                            >
                              <WifiOff size={15} />
                              Disconnect
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {channel === 'whatsapp' && status !== 'connected' && (
                    <div className="pulse" style={{ width: '8px', height: '8px', background: '#eab308', borderRadius: '50%', position: 'absolute', top: '12px', right: '12px' }} />
                  )}
                </div>

                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                  {status === 'connected' && contactSyncMessage && (
                    <div style={{ marginBottom: '16px', padding: '10px 12px', border: '1px solid #dbe7e2', background: '#f6fbf8', color: '#42645a', fontSize: '0.75rem', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isContactSyncing ? <RefreshCcw size={14} className="spin" /> : <CheckCircle2 size={14} color="var(--primary-dark)" />}
                      <span>{contactSyncMessage}</span>
                    </div>
                  )}
                  {activeView === 'scheduler' ? (
                    <>
                      {hoveredSchedule ? (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          style={{
                            background: 'white',
                            padding: '24px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            marginBottom: '20px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '6px',
                              background: '#e7f3ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#0057b7'
                            }}>
                              <MessageSquare size={20} />
                            </div>
                            <div>
                              <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>Message Details</h4>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Preview</p>
                            </div>
                          </div>

                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
                            <p style={{ fontSize: '0.85rem', color: '#111b21', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                              {hoveredSchedule.message}
                            </p>

                            {(hoveredSchedule.media_url || hoveredSchedule.mediaUrl) && (
                              <div style={{ marginTop: '12px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                {(hoveredSchedule.media_type || hoveredSchedule.mediaType)?.startsWith('image/') ? (
                                  <img src={hoveredSchedule.media_url || hoveredSchedule.mediaUrl} alt="Preview" style={{ width: '100%', display: 'block' }} />
                                ) : (hoveredSchedule.media_type || hoveredSchedule.mediaType)?.startsWith('video/') ? (
                                  <video src={hoveredSchedule.media_url || hoveredSchedule.mediaUrl} style={{ width: '100%', display: 'block' }} />
                                ) : (
                                  <div style={{ padding: '10px', background: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                                    <FileIcon size={16} /> Document Attachment
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Phone size={14} color="var(--text-muted)" />
                              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                {getContactName(hoveredSchedule.phone)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Clock size={14} color="var(--text-muted)" />
                              <span style={{ fontSize: '0.85rem' }}>
                                {format(new Date(hoveredSchedule.scheduled_at || hoveredSchedule.scheduledAt), 'PPp')}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Zap size={14} color="var(--text-muted)" />
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                color: hoveredSchedule.status === 'pending' ? 'var(--primary-dark)' : 'var(--text-muted)'
                              }}>
                                Status: {hoveredSchedule.status}
                              </span>
                            </div>
                          </div>

                          <p style={{ marginTop: '20px', fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Click to edit this message
                          </p>
                        </motion.div>
                      ) : null}

                      {['telegram', 'instagram', 'reminders'].includes(channel) ? (
                        <>
                          {channel === 'telegram' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                              {isTelegramStatusLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '200px', gap: '12px' }}>
                                  <RefreshCcw size={24} className="spin" color="#0088cc" />
                                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Loading bot details...</p>
                                </div>
                              ) : telegramStatus.status !== 'connected' ? (
                                <>
                                  {/* Step 1: Connect Bot Token */}
                                  <div style={{
                                    background: '#f8fafc',
                                    padding: '16px',
                                    border: '1px solid var(--border)'
                                  }}>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: 800, color: '#0088cc', textTransform: 'uppercase' }}>
                                      1. Connect Bot Token
                                    </h4>
                                    <ol style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '16px', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                                      <li style={{ marginBottom: '4px' }}>
                                        Search for <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" style={{ color: '#0088cc', fontWeight: 700 }}>@BotFather</a> on Telegram.
                                        <div style={{ margin: '8px 0 12px 0', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', maxWidth: '100%' }}>
                                          <img
                                            src="https://miro.medium.com/v2/resize:fit:1400/1*DIdtNFdMj2QovbC7NXAvTw.png"
                                            alt="Search BotFather on Telegram"
                                            style={{ width: '100%', height: 'auto', display: 'block' }}
                                          />
                                        </div>
                                      </li>
                                      <li style={{ marginBottom: '4px' }}>Send the command <strong style={{ color: 'var(--text-main)', background: '#e2e8f0', padding: '1px 5px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '0.8rem' }}>/newbot</strong> to start creating your bot.</li>
                                      <li style={{ marginBottom: '4px' }}>Choose a display name for your bot (e.g. <code>LaterOn Companion</code>).</li>
                                      <li style={{ marginBottom: '4px' }}>Choose a unique username for your bot ending in <code>bot</code> (e.g. <code>MyLaterOnBot</code>).</li>
                                      <li>Copy the <strong style={{ color: 'var(--text-main)', background: '#e2e8f0', padding: '1px 5px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '0.8rem' }}>HTTP API Token</strong> provided by BotFather and paste it below:</li>
                                    </ol>

                                    <input
                                      type="password"
                                      placeholder="e.g. 123456789:ABCdef..."
                                      value={customTelegramToken}
                                      onChange={e => setCustomTelegramToken(e.target.value)}
                                      style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '8px', boxSizing: 'border-box' }}
                                    />

                                    {telegramTestBotResult && (
                                      <div style={{
                                        padding: '8px 12px', marginBottom: '8px',
                                        background: telegramTestBotResult.success ? '#f0fdf4' : '#fef2f2',
                                        border: telegramTestBotResult.success ? '1px solid #bbf7d0' : '1px solid #fecaca',
                                        fontSize: '0.75rem', color: telegramTestBotResult.success ? '#166534' : '#991b1b'
                                      }}>
                                        {telegramTestBotResult.success
                                          ? `✓ Connected: @${telegramTestBotResult.username}`
                                          : `✗ Error: ${telegramTestBotResult.error}`}
                                      </div>
                                    )}

                                    <button
                                      onClick={async () => {
                                        if (!customTelegramToken.trim()) return alert('Please enter your bot API token');
                                        setIsTestingTelegramBot(true);
                                        setTelegramTestBotResult(null);
                                        try {
                                          const testRes = await axios.post(`${API_URL}/api/telegram/test-custom-bot`, { customBotToken: customTelegramToken });
                                          if (testRes.data.success) {
                                            setTelegramTestBotResult({ success: true, username: testRes.data.username });
                                            await axios.post(`${API_URL}/api/telegram/config`, {
                                              customBotToken: customTelegramToken,
                                              botUsername: testRes.data.username
                                            });
                                            await fetchTelegramStatus();
                                          }
                                        } catch (err) {
                                          setTelegramTestBotResult({ success: false, error: err.response?.data?.error || err.message });
                                        } finally {
                                          setIsTestingTelegramBot(false);
                                        }
                                      }}
                                      disabled={isTestingTelegramBot}
                                      style={{
                                        width: '100%', padding: '12px', background: '#0088cc', color: 'white', border: 'none',
                                        fontWeight: 800, fontSize: '0.85rem', cursor: isTestingTelegramBot ? 'not-allowed' : 'pointer',
                                        textTransform: 'uppercase', letterSpacing: '0.5px'
                                      }}
                                    >
                                      {isTestingTelegramBot ? 'Connecting Bot...' : 'Verify & Save Bot'}
                                    </button>
                                  </div>
                                </>
                              ) : !telegramStatus.config?.chats || telegramStatus.config.chats.length === 0 ? (
                                <>
                                  {/* Step 2: Register a Target Chat */}
                                  <div style={{
                                    background: '#f8fafc',
                                    padding: '16px',
                                    border: '1px solid var(--border)'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                      <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#0088cc', textTransform: 'uppercase' }}>
                                        2. Connect Chat target
                                      </h4>
                                      <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 800 }}>✓ Bot Online</span>
                                    </div>
                                    <ol style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '16px', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                                      <li style={{ marginBottom: '4px' }}>Add your bot <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>@{telegramStatus.config?.bot_username || 'your_bot_username'}</span> to your chat or group.</li>
                                      <li style={{ marginBottom: '4px' }}>Get your chat ID (e.g. forward any message to <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" style={{ color: '#0088cc' }}>@userinfobot</a>).</li>
                                      <li>Enter chat parameters below:</li>
                                    </ol>

                                    <div className="input-group" style={{ marginBottom: '8px' }}>
                                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>TELEGRAM CHAT ID</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. 5625755071 or -1001234567"
                                        value={telegramNewChatId}
                                        onChange={e => setTelegramNewChatId(e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                      />
                                    </div>

                                    <div className="input-group" style={{ marginBottom: '12px' }}>
                                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>CHAT NAME / LABEL</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. My Personal Chat or Dev Group"
                                        value={telegramNewChatTitle}
                                        onChange={e => setTelegramNewChatTitle(e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                      />
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button
                                        onClick={async () => {
                                          if (!telegramNewChatId.trim() || !telegramNewChatTitle.trim()) {
                                            return alert('Please fill in Chat ID and Name');
                                          }
                                          setIsSavingTelegramChat(true);
                                          try {
                                            await axios.post(`${API_URL}/api/telegram/chats`, {
                                              chatId: telegramNewChatId.trim(),
                                              chatTitle: telegramNewChatTitle.trim()
                                            });
                                            setTelegramNewChatId('');
                                            setTelegramNewChatTitle('');
                                            await fetchTelegramStatus();
                                          } catch (err) {
                                            alert('Failed to register chat target');
                                          } finally {
                                            setIsSavingTelegramChat(false);
                                          }
                                        }}
                                        disabled={isSavingTelegramChat}
                                        style={{
                                          flex: 2, padding: '12px', background: '#0088cc', color: 'white', border: 'none',
                                          fontWeight: 800, fontSize: '0.85rem', cursor: isSavingTelegramChat ? 'not-allowed' : 'pointer',
                                          textTransform: 'uppercase', letterSpacing: '0.5px'
                                        }}
                                      >
                                        {isSavingTelegramChat ? 'Adding Chat...' : 'Add Chat target'}
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (window.confirm('Disconnect this Telegram bot and token?')) {
                                            try {
                                              await axios.delete(`${API_URL}/api/integrations/telegram`);
                                              await fetchTelegramStatus();
                                            } catch (err) {
                                              alert('Failed to disconnect');
                                            }
                                          }
                                        }}
                                        style={{
                                          flex: 1, padding: '12px', background: 'none', border: '1px solid #ef4444', color: '#ef4444',
                                          fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                                          textTransform: 'uppercase', letterSpacing: '0.5px'
                                        }}
                                      >
                                        Reset
                                      </button>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* Active Scheduler for Telegram */}
                                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div className="input-group" style={{ marginBottom: '8px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0088cc', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>TARGET CHAT</label>
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        <select
                                          value={selectedTelegramChat}
                                          onChange={e => setSelectedTelegramChat(e.target.value)}
                                          style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                                        >
                                          {(telegramStatus.config?.chats || []).map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                          ))}
                                        </select>
                                        <button
                                          type="button"
                                          onClick={() => setShowTelegramAddChat(!showTelegramAddChat)}
                                          title="Add new chat target"
                                          style={{ padding: '10px', background: 'white', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#0088cc' }}
                                        >
                                          {showTelegramAddChat ? '✕' : '+ Chat'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (window.confirm('Disconnect this Telegram bot and token?')) {
                                              try {
                                                await axios.delete(`${API_URL}/api/integrations/telegram`);
                                                await fetchTelegramStatus();
                                              } catch (err) {
                                                alert('Failed to disconnect');
                                              }
                                            }
                                          }}
                                          title="Disconnect bot"
                                          style={{ padding: '10px', background: 'white', border: '1px solid #ef4444', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}
                                        >
                                          Reset
                                        </button>
                                      </div>
                                    </div>

                                    {showTelegramAddChat && (
                                      <div style={{
                                        background: '#f8fafc',
                                        padding: '12px',
                                        border: '1px solid var(--border)',
                                        marginBottom: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                      }}>
                                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Connect New Chat target</p>
                                        <ol style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '12px', margin: 0, lineHeight: '1.3' }}>
                                          <li>Add bot <b>@{telegramStatus.config?.bot_username}</b> to group/chat.</li>
                                          <li>Forward a message to <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" style={{ color: '#0088cc' }}>@userinfobot</a> to get ID.</li>
                                        </ol>
                                        <input
                                          type="text"
                                          placeholder="Chat ID (e.g. 5625755071)"
                                          value={telegramNewChatId}
                                          onChange={e => setTelegramNewChatId(e.target.value)}
                                          style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                        />
                                        <input
                                          type="text"
                                          placeholder="Friendly Name (e.g. Support Group)"
                                          value={telegramNewChatTitle}
                                          onChange={e => setTelegramNewChatTitle(e.target.value)}
                                          style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                        />
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (!telegramNewChatId.trim() || !telegramNewChatTitle.trim()) {
                                              return alert('Please fill in Chat ID and Name');
                                            }
                                            try {
                                              await axios.post(`${API_URL}/api/telegram/chats`, {
                                                chatId: telegramNewChatId.trim(),
                                                chatTitle: telegramNewChatTitle.trim()
                                              });
                                              setTelegramNewChatId('');
                                              setTelegramNewChatTitle('');
                                              setShowTelegramAddChat(false);
                                              await fetchTelegramStatus();
                                            } catch (err) {
                                              alert('Failed to register chat target');
                                            }
                                          }}
                                          style={{ padding: '8px', background: '#0088cc', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                                        >
                                          Save Chat
                                        </button>
                                      </div>
                                    )}

                                    <div className="input-group" style={{ marginBottom: '8px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0088cc', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>MESSAGE</label>
                                      <textarea
                                        placeholder="Write your telegram message here..."
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        rows={4}
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', resize: 'vertical' }}
                                        required
                                      />
                                    </div>

                                    <div className="input-group" style={{ marginBottom: '8px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0088cc', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>SCHEDULE FOR</label>
                                      <DatePicker
                                        selected={scheduledDate}
                                        onChange={(date) => setScheduledDate(date)}
                                        showTimeSelect
                                        timeFormat="h:mm aa"
                                        timeIntervals={1}
                                        timeCaption="Time"
                                        dateFormat="MMMM d, yyyy h:mm aa"
                                        customInput={<CustomDateInput />}
                                        minDate={new Date()}
                                      />
                                    </div>

                                    <div className="input-group" style={{ marginBottom: '8px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0088cc', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>REPEAT CYCLE</label>
                                      <select
                                        value={formData.recurrence}
                                        onChange={e => setFormData({ ...formData, recurrence: e.target.value })}
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                                      >
                                        <option value="none">Does not repeat</option>
                                        <option value="daily">Every day</option>
                                        <option value="weekly">Every week</option>
                                        <option value="monthly">Every month</option>
                                      </select>
                                    </div>

                                    <button
                                      type="submit"
                                      disabled={loading}
                                      style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: '#0088cc',
                                        color: 'white',
                                        fontWeight: 800,
                                        fontSize: '0.9rem',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginTop: '12px'
                                      }}
                                    >
                                      {loading ? 'Scheduling...' : 'Schedule Telegram Message'}
                                    </button>
                                  </form>
                                </>
                              )}
                            </div>
                          )}

                          {channel === 'instagram' && (
                            <InstagramSidebar
                              token={token}
                              channel={channel}
                              fetchSchedules={fetchSchedules}
                              instagramStatus={instagramStatus}
                              fetchInstagramStatus={fetchInstagramStatus}
                              setInstagramStatus={setInstagramStatus}
                            />
                          )}

                          {channel === 'reminders' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <form onSubmit={handleCreateReminder} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div className="input-group" style={{ marginBottom: '8px' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>TITLE</label>
                                  <input
                                    type="text"
                                    placeholder="Reminder title"
                                    value={reminderForm.title}
                                    onChange={e => setReminderForm({ ...reminderForm, title: e.target.value })}
                                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none', fontSize: '0.85rem' }}
                                  />
                                </div>

                                <div className="input-group" style={{ marginBottom: '8px' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>DESCRIPTION (OPTIONAL)</label>
                                  <textarea
                                    placeholder="What is this reminder about?"
                                    value={reminderForm.description}
                                    onChange={e => setReminderForm({ ...reminderForm, description: e.target.value })}
                                    rows={2}
                                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', resize: 'vertical' }}
                                  />
                                </div>

                                <div className="input-group" style={{ marginBottom: '8px' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>SCHEDULE FOR</label>
                                  <DatePicker
                                    selected={reminderForm.scheduled_at}
                                    onChange={(date) => setReminderForm({ ...reminderForm, scheduled_at: date })}
                                    showTimeSelect
                                    timeFormat="h:mm aa"
                                    timeIntervals={1}
                                    timeCaption="Time"
                                    dateFormat="MMMM d, yyyy h:mm aa"
                                    customInput={<CustomDateInput />}
                                    minDate={new Date()}
                                  />
                                </div>

                                <div className="input-group" style={{ marginBottom: '8px' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>REPEAT CYCLE</label>
                                  <select
                                    value={reminderForm.recurrence}
                                    onChange={e => setReminderForm({ ...reminderForm, recurrence: e.target.value })}
                                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                                  >
                                    <option value="none">Does not repeat</option>
                                    <option value="daily">Every day</option>
                                    <option value="weekly">Every week</option>
                                    <option value="monthly">Every month</option>
                                  </select>
                                </div>

                                <div style={{ paddingTop: '5px' }}>
                                  <button
                                    type="submit"
                                    disabled={isSubmittingReminder}
                                    style={{
                                      width: '100%',
                                      padding: '16px',
                                      background: isSubmittingReminder ? '#d97706' : '#f59e0b',
                                      color: 'white',
                                      fontWeight: 800,
                                      fontSize: '1rem',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: isSubmittingReminder ? 'not-allowed' : 'pointer',
                                      transition: 'all 0.2s',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      opacity: isSubmittingReminder ? 0.8 : 1
                                    }}
                                    onMouseOver={e => { if (!isSubmittingReminder) e.currentTarget.style.background = '#d97706'; }}
                                    onMouseOut={e => { if (!isSubmittingReminder) e.currentTarget.style.background = '#f59e0b'; }}
                                  >
                                    {isSubmittingReminder ? 'Scheduling...' : 'Create Reminder'}
                                  </button>
                                </div>
                              </form>

                              {reminderNotifPermission === 'default' && (
                                <div style={{
                                  padding: '12px',
                                  border: '1px dashed #f59e0b',
                                  background: '#fffbeb',
                                  textAlign: 'center',
                                  fontSize: '0.75rem',
                                  color: '#92400e'
                                }}>
                                  <button
                                    type="button"
                                    onClick={requestNotifPermission}
                                    style={{
                                      background: '#f59e0b',
                                      color: 'white',
                                      border: 'none',
                                      padding: '8px 16px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    Enable Desktop Notifications
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <form onSubmit={handleSubmit} style={{ display: hoveredSchedule ? 'none' : 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
                          {/* Desktop Step Indicator */}
                          {!isMobile && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '20px',
                              background: channel === 'email' ? '#fdf2f2' : (channel === 'calendar' ? '#f4f8ff' : '#f8fafc'),
                              padding: '10px 16px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)'
                            }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: channel === 'email' ? '#a52a2a' : (channel === 'calendar' ? '#1a73e8' : 'var(--primary-dark)'), textTransform: 'uppercase' }}>
                                {channel === 'calendar'
                                  ? (sidebarStep === 1 ? '1. Recipient Details' : sidebarStep === 2 ? '2. Meeting Settings' : '3. Preview & Confirm')
                                  : (sidebarStep === 1 ? '1. Scheduling' : '2. Message')}
                              </span>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <div style={{ width: channel === 'calendar' ? '16px' : '24px', height: '4px', borderRadius: '6px', background: sidebarStep >= 1 ? (channel === 'email' ? '#a52a2a' : (channel === 'calendar' ? '#1a73e8' : 'var(--primary)')) : 'var(--border)' }} />
                                <div style={{ width: channel === 'calendar' ? '16px' : '24px', height: '4px', borderRadius: '6px', background: sidebarStep >= 2 ? (channel === 'email' ? '#a52a2a' : (channel === 'calendar' ? '#1a73e8' : 'var(--primary)')) : 'var(--border)' }} />
                                {channel === 'calendar' && (
                                  <div style={{ width: '16px', height: '4px', borderRadius: '0px', background: sidebarStep >= 3 ? '#1a73e8' : 'var(--border)' }} />
                                )}
                              </div>
                            </div>
                          )}

                          <AnimatePresence mode="wait">
                            {sidebarStep === 1 ? (
                              <motion.div
                                key="sidebar-step-1"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                              >
                                {channel === 'calendar' ? (
                                  <>
                                    <div className="input-group phone-input-container">
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1a73e8', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>RECIPIENT CONTACT (WHATSAPP)</label>
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{
                                          padding: '12px 16px',
                                          background: '#f0f2f5',
                                          border: '1px solid var(--border)',
                                          borderRadius: '6px',
                                          fontSize: '0.9rem',
                                          fontWeight: 600,
                                          color: '#54656f',
                                          display: 'flex',
                                          alignItems: 'center'
                                        }}>
                                          +91
                                        </div>
                                        <div style={{
                                          position: 'relative',
                                          flex: 1,
                                          display: 'flex',
                                          alignItems: 'center',
                                          background: 'white',
                                          border: '1px solid var(--border)',
                                          borderRadius: '6px',
                                          padding: '0 12px',
                                          gap: '8px',
                                          transition: 'border-color 0.2s',
                                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                        }}
                                          onFocusCapture={(e) => e.currentTarget.style.borderColor = '#1a73e8'}
                                          onBlurCapture={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                                        >
                                          <Phone size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />

                                          {(getContactName(formData.phone) !== formatPhone(formData.phone) || groups[formData.phone]) && (
                                            <div style={{
                                              background: groups[formData.phone] ? '#e8f0fe' : '#e8f0fe',
                                              color: '#1a73e8',
                                              padding: '2px 8px',
                                              borderRadius: '6px',
                                              fontSize: '0.8rem',
                                              fontWeight: 700,
                                              whiteSpace: 'nowrap',
                                              flexShrink: 0
                                            }}>
                                              {groups[formData.phone] || getContactName(formData.phone)}
                                            </div>
                                          )}

                                          <input
                                            type="text"
                                            placeholder="e.g. 9122500000"
                                            style={{
                                              border: 'none',
                                              padding: '12px 0',
                                              background: 'transparent',
                                              width: '100%',
                                              outline: 'none',
                                              boxShadow: 'none',
                                              fontSize: '1rem',
                                              WebkitAppearance: 'none'
                                            }}
                                            value={formData.phone}
                                            onFocus={() => setShowSuggestions(true)}
                                            onChange={e => {
                                              const val = e.target.value;
                                              setFormData({ ...formData, phone: val });
                                              setShowSuggestions(true);
                                            }}
                                          />

                                          {showSuggestions && (
                                            <div style={{
                                              position: 'absolute',
                                              top: '105%',
                                              left: 0,
                                              right: 0,
                                              background: 'white',
                                              borderRadius: '6px',
                                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                              zIndex: 100,
                                              maxHeight: '250px',
                                              overflowY: 'auto',
                                              border: '1px solid var(--border)'
                                            }}>
                                              {schedules.length > 0 && (
                                                <div style={{ padding: '8px 12px', background: '#f0f2f5', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>RECENT</div>
                                              )}
                                              {[...new Set(schedules.map(s => s.phone))].slice(0, 3).map(num => (
                                                <div
                                                  key={num}
                                                  onClick={() => {
                                                    setFormData({ ...formData, phone: num.startsWith('91') ? num.slice(2) : num });
                                                    setShowSuggestions(false);
                                                  }}
                                                  style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f2f5', fontSize: '0.9rem' }}
                                                  onMouseDown={e => e.preventDefault()}
                                                >
                                                  <p style={{ fontWeight: 600 }}>{getContactName(num.startsWith('91') ? num.slice(2) : num)}</p>
                                                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatPhone(num)}</p>
                                                </div>
                                              ))}

                                              <div style={{ padding: '8px 12px', background: '#f0f2f5', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>ALL CONTACTS</div>
                                              {Object.entries(contacts)
                                                .filter(([id, contact]) => {
                                                  if (!isRealPhoneNumber(id)) return false;
                                                  const name = typeof contact === 'object' ? contact.name : contact;
                                                  const displayName = isPlaceholderContactName(name, id) ? '' : String(name || '');
                                                  return displayName.toLowerCase().includes(formData.phone.toLowerCase()) || id.includes(formData.phone);
                                                })
                                                .slice(0, 20)
                                                .map(([id]) => (
                                                  <div
                                                    key={id}
                                                    onClick={() => {
                                                      setFormData({ ...formData, phone: id.startsWith('91') ? id.slice(2) : id });
                                                      setShowSuggestions(false);
                                                    }}
                                                    style={{
                                                      padding: '10px 12px',
                                                      cursor: 'pointer',
                                                      borderBottom: '1px solid #f0f2f5',
                                                      fontSize: '0.9rem'
                                                    }}
                                                    onMouseDown={e => e.preventDefault()}
                                                  >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f0f2f5', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        {contacts[id]?.photo ? (
                                                          <img src={contacts[id].photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                          <User size={16} color="var(--text-muted)" />
                                                        )}
                                                      </div>
                                                      <div>
                                                        <p style={{ fontWeight: 600, margin: 0 }}>{getContactName(id)}</p>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{formatPhone(id)}</p>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))
                                              }
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="input-group">
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1a73e8', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>RECIPIENT EMAIL (OPTIONAL)</label>
                                      <input
                                        type="email"
                                        placeholder="client@example.com"
                                        value={formData.emailTo || ''}
                                        onChange={e => setFormData({ ...formData, emailTo: e.target.value })}
                                        style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '0px', outline: 'none' }}
                                      />
                                    </div>
                                  </>
                                ) : channel === 'email' ? (
                                  <>
                                    <div className="input-group">
                                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a52a2a' }}>TO (EMAIL)</label>
                                      <input
                                        type="email"
                                        placeholder="user@example.com"
                                        value={formData.emailTo || ''}
                                        onChange={e => setFormData({ ...formData, emailTo: e.target.value })}
                                        style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '0px', outline: 'none' }}
                                      />
                                    </div>
                                    <div className="input-group">
                                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a52a2a' }}>SUBJECT</label>
                                      <input
                                        type="text"
                                        placeholder="Subject line"
                                        value={formData.emailSubject || ''}
                                        onChange={e => setFormData({ ...formData, emailSubject: e.target.value })}
                                        style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '0px', outline: 'none' }}
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <div className="input-group phone-input-container">
                                    <label>Phone Number</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <div style={{
                                        padding: '12px 16px',
                                        background: '#f0f2f5',
                                        border: '1px solid var(--border)',
                                        borderRadius: '0px',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: '#54656f',
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}>
                                        +91
                                      </div>
                                      <div style={{
                                        position: 'relative',
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'white',
                                        border: '1px solid var(--border)',
                                        borderRadius: '0px',
                                        padding: '0 12px',
                                        gap: '8px',
                                        transition: 'border-color 0.2s',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                      }}
                                        onFocusCapture={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                                        onBlurCapture={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                                      >
                                        <Phone size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />

                                        {(getContactName(formData.phone) !== formatPhone(formData.phone) || groups[formData.phone]) && (
                                          <div style={{
                                            background: groups[formData.phone] ? '#e7f3ff' : '#dcf8c6',
                                            color: groups[formData.phone] ? '#0057b7' : '#075e54',
                                            padding: '2px 8px',
                                            borderRadius: '0px',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0
                                          }}>
                                            {groups[formData.phone] || getContactName(formData.phone)}
                                          </div>
                                        )}

                                        <input
                                          type="text"
                                          placeholder="e.g. 9122500000"
                                          style={{
                                            border: 'none',
                                            padding: '12px 0',
                                            background: 'transparent',
                                            width: '100%',
                                            outline: 'none',
                                            boxShadow: 'none',
                                            fontSize: '1rem',
                                            WebkitAppearance: 'none'
                                          }}
                                          value={formData.phone}
                                          onFocus={() => setShowSuggestions(true)}
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              handleAddRecipient();
                                            }
                                          }}
                                          onChange={e => {
                                            const val = e.target.value;
                                            setFormData({ ...formData, phone: val });
                                            setShowSuggestions(true);
                                          }}
                                        />
                                        {formData.phone.trim() && (
                                          <button
                                            type="button"
                                            onClick={handleAddRecipient}
                                            style={{
                                              background: 'var(--primary)',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '0px',
                                              width: '32px',
                                              height: '32px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              cursor: 'pointer',
                                              flexShrink: 0,
                                              marginLeft: '8px'
                                            }}
                                          >
                                            <Plus size={18} />
                                          </button>
                                        )}

                                        {showSuggestions && (
                                          <div style={{
                                            position: 'absolute',
                                            top: '105%',
                                            left: 0,
                                            right: 0,
                                            background: 'white',
                                            borderRadius: '0px',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                            zIndex: 100,
                                            maxHeight: '250px',
                                            overflowY: 'auto',
                                            border: '1px solid var(--border)'
                                          }}>
                                            {schedules.length > 0 && (
                                              <div style={{ padding: '8px 12px', background: '#f0f2f5', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>RECENT</div>
                                            )}
                                            {[...new Set(schedules.map(s => s.phone))].slice(0, 3).map(num => (
                                              <div
                                                key={num}
                                                onClick={() => {
                                                  setFormData({ ...formData, phone: num.startsWith('91') ? num.slice(2) : num });
                                                  setShowSuggestions(false);
                                                }}
                                                style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f2f5', fontSize: '0.9rem' }}
                                                onMouseDown={e => e.preventDefault()}
                                              >
                                                <p style={{ fontWeight: 600 }}>{getContactName(num.startsWith('91') ? num.slice(2) : num)}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatPhone(num)}</p>
                                              </div>
                                            ))}


                                            {/* All Contacts — filter out LID/garbage IDs */}
                                            <div style={{ padding: '8px 12px', background: '#f0f2f5', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>ALL CONTACTS</div>
                                            {Object.entries(contacts)
                                              .filter(([id, contact]) => {
                                                // Skip LID-style long numeric IDs and group numbers
                                                if (!isRealPhoneNumber(id)) return false;
                                                const name = typeof contact === 'object' ? contact.name : contact;
                                                const displayName = isPlaceholderContactName(name, id) ? '' : String(name || '');
                                                return displayName.toLowerCase().includes(formData.phone.toLowerCase()) || id.includes(formData.phone);
                                              })
                                              .slice(0, 20)
                                              .map(([id]) => (
                                                <div
                                                  key={id}
                                                  onClick={() => {
                                                    if (!selectedRecipients.includes(id)) {
                                                      setSelectedRecipients([...selectedRecipients, id]);
                                                    }
                                                    setFormData({ ...formData, phone: '' });
                                                    setShowSuggestions(false);
                                                  }}
                                                  style={{
                                                    padding: '10px 12px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #f0f2f5',
                                                    fontSize: '0.9rem',
                                                    background: selectedRecipients.includes(id) ? '#f0f9ff' : 'transparent'
                                                  }}
                                                  onMouseDown={e => e.preventDefault()}
                                                >
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f0f2f5', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        {contacts[id]?.photo ? (
                                                          <img src={contacts[id].photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                          <User size={16} color="var(--text-muted)" />
                                                        )}
                                                      </div>
                                                      <div>
                                                        <p style={{ fontWeight: 600, margin: 0 }}>{getContactName(id)}</p>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{formatPhone(id)}</p>
                                                      </div>
                                                    </div>
                                                    {selectedRecipients.includes(id) && <Check size={14} color="var(--primary)" />}
                                                  </div>
                                                </div>
                                              ))
                                            }

                                            {/* Groups */}
                                            {Object.keys(groups).length > 0 && (
                                              <div style={{ padding: '8px 12px', background: '#f0f2f5', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>GROUPS</div>
                                            )}
                                            {Object.entries(groups)
                                              .filter(([, name]) =>
                                                name.toLowerCase().includes(formData.phone.toLowerCase())
                                              )
                                              .slice(0, 10)
                                              .map(([id, name]) => (
                                                <div
                                                  key={id}
                                                  onClick={() => {
                                                    if (!selectedRecipients.includes(id)) {
                                                      setSelectedRecipients([...selectedRecipients, id]);
                                                    }
                                                    setFormData({ ...formData, phone: '' });
                                                    setShowSuggestions(false);
                                                  }}
                                                  style={{
                                                    padding: '10px 12px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #f0f2f5',
                                                    fontSize: '0.9rem',
                                                    background: selectedRecipients.includes(id) ? '#f0f9ff' : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                  }}
                                                  onMouseDown={e => e.preventDefault()}
                                                >
                                                  <Users size={16} color="var(--primary-dark)" />
                                                  <div style={{ flex: 1 }}>
                                                    <p style={{ fontWeight: 600 }}>{name}</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Group Chat</p>
                                                  </div>
                                                  {selectedRecipients.includes(id) && <Check size={14} color="var(--primary)" />}
                                                </div>
                                              ))
                                            }
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Recipient Chips Area */}
                                    {selectedRecipients.length > 0 && (
                                      <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '6px',
                                        marginTop: '10px',
                                        padding: '8px',
                                        background: '#f8fafc',
                                        border: '1px dashed var(--border)'
                                      }}>
                                        {selectedRecipients.map(phone => (
                                          <div
                                            key={phone}
                                            style={{
                                              background: 'white',
                                              border: '1px solid var(--border)',
                                              padding: '4px 8px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '6px',
                                              fontSize: '0.75rem',
                                              fontWeight: 700
                                            }}
                                          >
                                            <span>{groups[phone] || getContactName(phone)}</span>
                                            <X
                                              size={12}
                                              style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                                              onClick={() => setSelectedRecipients(selectedRecipients.filter(p => p !== phone))}
                                            />
                                          </div>
                                        ))}
                                        <button
                                          type="button"
                                          onClick={() => setSelectedRecipients([])}
                                          style={{
                                            fontSize: '0.7rem',
                                            color: '#ef4444',
                                            background: 'none',
                                            border: 'none',
                                            textDecoration: 'underline',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          Clear All
                                        </button>
                                      </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        Sending to India (+91) by default
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {channel !== 'calendar' && (
                                  <>
                                    <div className="input-group">
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: channel === 'email' ? '#a52a2a' : 'var(--primary-dark)', margin: 0, display: 'block' }}>SCHEDULE FOR</label>
                                        <button
                                          type="button"
                                          onClick={() => setIs24Hour(!is24Hour)}
                                          style={{
                                            fontSize: '0.65rem',
                                            padding: '2px 8px',
                                            borderRadius: '0px',
                                            background: '#f0f2f5',
                                            border: '1px solid var(--border)',
                                            fontWeight: 700,
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          {is24Hour ? '24H' : '12H'}
                                        </button>
                                      </div>
                                      <DatePicker
                                        selected={scheduledDate}
                                        onChange={(date) => setScheduledDate(date)}
                                        showTimeSelect
                                        timeFormat={is24Hour ? "HH:mm" : "h:mm aa"}
                                        timeIntervals={5}
                                        timeCaption="Time"
                                        dateFormat={is24Hour ? "MMMM d, yyyy HH:mm" : "MMMM d, yyyy h:mm aa"}
                                        customInput={<CustomDateInput />}
                                      />
                                    </div>

                                    <div className="input-group">
                                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: channel === 'email' ? '#a52a2a' : 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Repeat size={14} /> REPEAT CYCLE
                                      </label>
                                      <select
                                        value={formData.recurrence}
                                        onChange={e => setFormData({ ...formData, recurrence: e.target.value })}
                                        style={{
                                          width: '100%',
                                          padding: '12px 16px',
                                          borderRadius: '0px',
                                          border: '1px solid var(--border)',
                                          background: 'white',
                                          fontSize: '0.9rem',
                                          outline: 'none',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <option value="none">Does not repeat</option>
                                        <option value="daily">Every day</option>
                                        <option value="weekly">Every week</option>
                                        <option value="monthly">Every month</option>
                                        <option value="yearly">Every year / Birthday</option>
                                        <option value="custom">Custom (Select Days)</option>
                                      </select>
                                    </div>

                                    {formData.recurrence === 'custom' && (
                                      <div className="input-group">
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SELECT DAYS</label>
                                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                                          {[
                                            { l: 'M', v: 1 }, { l: 'T', v: 2 }, { l: 'W', v: 3 },
                                            { l: 'T', v: 4 }, { l: 'F', v: 5 }, { l: 'S', v: 6 }, { l: 'S', v: 0 }
                                          ].map(day => (
                                            <button
                                              key={day.v}
                                              type="button"
                                              onClick={() => {
                                                const newDays = formData.customDays.includes(day.v)
                                                  ? formData.customDays.filter(d => d !== day.v)
                                                  : [...formData.customDays, day.v];
                                                setFormData({ ...formData, customDays: newDays });
                                              }}
                                              style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '0px',
                                                border: '1px solid var(--border)',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s ease',
                                                background: formData.customDays.includes(day.v) ? 'var(--primary)' : 'white',
                                                color: formData.customDays.includes(day.v) ? 'white' : 'var(--text-main)',
                                                borderColor: formData.customDays.includes(day.v) ? 'var(--primary)' : 'var(--border)'
                                              }}
                                            >
                                              {day.l}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}

                                <button
                                  type="button"
                                  className="btn"
                                  onClick={() => {
                                    triggerSelection();
                                    if (channel === 'calendar') {
                                      if (!formData.phone?.trim() && !formData.emailTo?.trim()) {
                                        triggerSelection();
                                        alert('Please enter a recipient phone number or email address');
                                        return;
                                      }
                                      setSidebarStep(2);
                                      return;
                                    } else if (channel === 'email') {
                                      const targetEmail = formData.emailTo || emailTo;
                                      if (!targetEmail || !targetEmail.trim() || !targetEmail.includes('@')) {
                                        triggerSelection();
                                        alert('Please enter a valid recipient email address');
                                        return;
                                      }
                                      const targetSubject = formData.emailSubject || emailSubject;
                                      if (!targetSubject || !targetSubject.trim()) {
                                        triggerSelection();
                                        alert('Please enter an email subject');
                                        return;
                                      }
                                    } else {
                                      if (selectedRecipients.length === 0 && (!formData.phone || formData.phone.length < 10)) {
                                        triggerSelection();
                                        alert('Please enter a valid phone number');
                                        return;
                                      }
                                    }
                                    setSidebarStep(2);
                                  }}
                                  style={{
                                    width: '100%',
                                    marginTop: '12px',
                                    marginBottom: '12px',
                                    borderRadius: '0px',
                                    background: channel === 'email' ? '#a52a2a' : (channel === 'calendar' ? '#1a73e8' : 'var(--primary)'),
                                    color: 'white',
                                    fontWeight: 800,
                                    border: 'none',
                                    padding: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                  }}
                                >
                                  {channel === 'calendar' ? (
                                    <>
                                      <span>Next: Meeting Settings</span>
                                      <ArrowRight size={16} />
                                    </>
                                  ) : (
                                    <>
                                      <span>Next: Message Content</span>
                                      <Send size={16} />
                                    </>
                                  )}
                                </button>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="sidebar-step-2"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}
                              >
                                {channel === 'calendar' && sidebarStep === 2 ? (
                                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div className="input-group">
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1a73e8', marginBottom: '6px', display: 'block' }}>MEETING TITLE</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. 30-Min Strategy Call"
                                        value={meetingTitle}
                                        onChange={e => setMeetingTitle(e.target.value)}
                                        style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '0px', outline: 'none' }}
                                      />
                                    </div>
                                    <div className="input-group">
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1a73e8', marginBottom: '6px', display: 'block', letterSpacing: '0.5px' }}>PLATFORM</label>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {meetingPlatform !== 'custom' ? (
                                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                            <button
                                              type="button"
                                              onClick={() => setMeetingPlatform('google_meet')}
                                              style={{
                                                padding: '10px 12px',
                                                border: meetingPlatform === 'google_meet' ? '1px solid #1a73e8' : '1px solid var(--border)',
                                                borderRadius: '0px',
                                                background: meetingPlatform === 'google_meet' ? '#e8f0fe' : 'white',
                                                color: meetingPlatform === 'google_meet' ? '#1a73e8' : 'var(--text-main)',
                                                fontWeight: 700,
                                                fontSize: '0.78rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                justifyContent: 'center'
                                              }}
                                            >
                                              <VideoIcon size={16} color="#1a73e8" />
                                              <span>Google Meet</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setMeetingPlatform('custom')}
                                              style={{
                                                padding: '10px 12px',
                                                border: '1px solid var(--border)',
                                                borderRadius: '0px',
                                                background: 'white',
                                                color: 'var(--text-main)',
                                                fontWeight: 700,
                                                fontSize: '0.78rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                justifyContent: 'center'
                                              }}
                                            >
                                              <LinkIcon size={16} color="#667781" />
                                              <span>Custom Link</span>
                                            </button>
                                          </div>
                                        ) : (
                                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                                            <input
                                              type="url"
                                              placeholder="i have a meeting link"
                                              value={formData.customLink || ''}
                                              onChange={e => setFormData({ ...formData, customLink: e.target.value })}
                                              style={{
                                                width: '100%',
                                                padding: '12px 40px 12px 12px',
                                                border: '1px solid #1a73e8',
                                                borderRadius: '0px',
                                                outline: 'none',
                                                fontSize: '0.85rem'
                                              }}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setMeetingPlatform('google_meet');
                                                setFormData({ ...formData, customLink: '' });
                                              }}
                                              style={{
                                                position: 'absolute',
                                                right: '12px',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '50%'
                                              }}
                                              onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                                              onMouseOut={e => e.currentTarget.style.background = 'none'}
                                            >
                                              <X size={16} color="#667781" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="input-group">
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1a73e8' }}>SCHEDULE FOR</label>
                                      <DatePicker
                                        selected={scheduledDate}
                                        onChange={date => setScheduledDate(date)}
                                        showTimeSelect
                                        dateFormat="MMMM d, yyyy h:mm aa"
                                        minDate={new Date()}
                                        customInput={<CustomDateInput color="#1a73e8" />}
                                      />
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', marginBottom: '20px' }}>
                                      <button
                                        type="button"
                                        onClick={() => { triggerSelection(); setSidebarStep(1); }}
                                        style={{
                                          padding: '12px 16px',
                                          background: '#f0f2f5',
                                          color: '#54656f',
                                          border: '1px solid var(--border)',
                                          borderRadius: '0px',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px'
                                        }}
                                      >
                                        <ArrowLeft size={16} />
                                        <span>Back</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn"
                                        onClick={() => {
                                          triggerSelection();
                                          if (!meetingTitle.trim()) {
                                            triggerSelection();
                                            alert('Please enter a meeting title');
                                            return;
                                          }
                                          if (meetingPlatform === 'custom' && !formData.customLink?.trim()) {
                                            triggerSelection();
                                            alert('Please enter a meeting link');
                                            return;
                                          }
                                          if (!formData.message?.trim()) {
                                            const userPhone = userInfo?.id || user?.phone || formData.phone || '';
                                            const customLinkVal = meetingPlatform === 'custom' ? (formData.customLink || '') : '';
                                            const meetingLink = generateMeetingLink(meetingPlatform, userPhone, customLinkVal, personalMeetLink, personalZoomLink);
                                            const platformLabel = { google_meet: 'Google Meet', zoom: 'Zoom Call', whatsapp_call: 'WhatsApp Call', phone: 'Phone Call', custom: 'Online Call' }[meetingPlatform] || 'Online Call';
                                            const invitation = `You're invited to: ${meetingTitle}
Date & Time: ${format(scheduledDate, 'MMMM d, yyyy h:mm aa')}
Platform: ${platformLabel}
Join Link: ${meetingLink}

Looking forward to connecting!`;
                                            setFormData({ ...formData, message: invitation });
                                          }
                                          setStepChangedAt(Date.now());
                                          setSidebarStep(3);
                                        }}
                                        style={{
                                          flex: 1,
                                          borderRadius: '0px',
                                          background: '#1a73e8',
                                          color: 'white',
                                          fontWeight: 800,
                                          border: 'none',
                                          padding: '12px',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '8px'
                                        }}
                                      >
                                        <span>Next: Preview</span>
                                        <ArrowRight size={16} />
                                      </button>
                                    </div>
                                  </div>
                                ) : channel === 'calendar' && sidebarStep === 3 ? (
                                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div className="input-group">
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1a73e8', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>NOTIFICATIONS</label>
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                          type="button"
                                          onClick={() => setMeetingNotifyWhatsApp(!meetingNotifyWhatsApp)}
                                          style={{
                                            flex: 1,
                                            padding: '10px 12px',
                                            borderRadius: '0px',
                                            border: meetingNotifyWhatsApp ? '1px solid #25d366' : '1px solid var(--border)',
                                            background: meetingNotifyWhatsApp ? '#f0fdf4' : 'white',
                                            color: meetingNotifyWhatsApp ? '#128c7e' : 'var(--text-muted)',
                                            fontWeight: 700,
                                            fontSize: '0.78rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                          }}
                                        >
                                          <WhatsAppIcon size={16} color={meetingNotifyWhatsApp ? '#25d366' : '#94a3b8'} />
                                          WhatsApp
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setMeetingNotifyEmail(!meetingNotifyEmail)}
                                          style={{
                                            flex: 1,
                                            padding: '10px 12px',
                                            borderRadius: '0px',
                                            border: meetingNotifyEmail ? '1px solid #ea4335' : '1px solid var(--border)',
                                            background: meetingNotifyEmail ? '#fdf2f2' : 'white',
                                            color: meetingNotifyEmail ? '#d93025' : 'var(--text-muted)',
                                            fontWeight: 700,
                                            fontSize: '0.78rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                          }}
                                        >
                                          <Mail size={16} color={meetingNotifyEmail ? '#ea4335' : '#94a3b8'} />
                                          Email
                                        </button>
                                      </div>
                                    </div>

                                    <div className="input-group">
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1a73e8', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>REMINDERS</label>
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        {[
                                          { value: '24h', label: '24h Before' },
                                          { value: '1h', label: '1h Before' },
                                          { value: '15m', label: '15m Before' }
                                        ].map(r => (
                                          <button
                                            key={r.value}
                                            type="button"
                                            onClick={() => setMeetingReminderTiming(r.value)}
                                            style={{
                                              flex: 1,
                                              padding: '10px 4px',
                                              borderRadius: '0px',
                                              border: meetingReminderTiming === r.value ? '1px solid #1a73e8' : '1px solid var(--border)',
                                              background: meetingReminderTiming === r.value ? '#e8f0fe' : 'white',
                                              color: meetingReminderTiming === r.value ? '#1a73e8' : 'var(--text-muted)',
                                              fontWeight: 700,
                                              fontSize: '0.75rem',
                                              cursor: 'pointer',
                                              textAlign: 'center'
                                            }}
                                          >
                                            {r.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="input-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                      <label style={{ margin: 0, fontWeight: 800, fontSize: '0.75rem', color: '#1a73e8', letterSpacing: '0.5px', marginBottom: '8px' }}>INVITATION PREVIEW</label>
                                      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <textarea
                                          value={formData.message}
                                          onChange={e => setFormData({ ...formData, message: e.target.value })}
                                          rows={5}
                                          style={{
                                            width: '100%',
                                            flex: 1,
                                            padding: '12px',
                                            paddingBottom: '40px',
                                            border: '1px solid var(--border)',
                                            borderRadius: '0px',
                                            outline: 'none',
                                            fontSize: '0.88rem',
                                            lineHeight: '1.5',
                                            resize: 'none'
                                          }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => { triggerSelection(); setActiveEmojiPicker(activeEmojiPicker === 'meeting_desktop' ? null : 'meeting_desktop'); }}
                                          style={{
                                            position: 'absolute',
                                            bottom: '10px',
                                            right: '10px',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-muted)',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 5
                                          }}
                                        >
                                          <Smile size={18} />
                                        </button>
                                        {activeEmojiPicker === 'meeting_desktop' && (
                                          <EmojiPicker
                                            onSelect={insertEmoji}
                                            onClose={() => setActiveEmojiPicker(null)}
                                          />
                                        )}
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                      <button
                                        type="button"
                                        onClick={() => setSidebarStep(2)}
                                        style={{
                                          padding: '12px 16px',
                                          background: '#f0f2f5',
                                          color: '#54656f',
                                          border: '1px solid var(--border)',
                                          borderRadius: '0px',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px'
                                        }}
                                      >
                                        <ArrowLeft size={16} />
                                        <span>Back</span>
                                      </button>
                                      <button
                                        type="submit"
                                        disabled={loading || (Date.now() - stepChangedAt < 400)}
                                        style={{
                                          flex: 1,
                                          padding: '12px',
                                          background: '#1a73e8',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '0px',
                                          fontWeight: 800,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '8px'
                                        }}
                                      >
                                        <Calendar size={16} />
                                        <span>{loading ? 'Scheduling...' : 'Create Meeting'}</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="input-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '200px', position: 'relative' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                        <label style={{ margin: 0, fontWeight: 800, fontSize: '0.75rem', color: 'var(--primary-dark)', letterSpacing: '0.5px' }}>MESSAGE CONTENT</label>
                                        <button
                                          type="button"
                                          onClick={() => setShowAiPrompt(!showAiPrompt)}
                                          className="gemini-ai-btn"
                                          style={{ padding: '6px 12px !important' }}
                                        >
                                          <Sparkles size={14} /> AI MAGIC
                                        </button>
                                      </div>

                                      <div style={{ flex: 1, position: 'relative', border: '1px solid var(--border)', background: 'white', display: 'flex', flexDirection: 'column' }}>
                                        <AnimatePresence>
                                          {showAiPrompt && (
                                            <motion.div
                                              initial={{ y: -10, opacity: 0 }}
                                              animate={{ y: 0, opacity: 1 }}
                                              exit={{ y: -10, opacity: 0 }}
                                              style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                zIndex: 10,
                                                background: 'rgba(255, 255, 255, 0.95)',
                                                backdropFilter: 'blur(10px)',
                                                borderBottom: '1px solid var(--primary-light)',
                                                padding: '12px'
                                              }}
                                            >
                                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                                                {[
                                                  { l: '✨ Improve', p: 'Improve this message and make it sound better' },
                                                  { l: '👔 Professional', p: 'Make this message sound more professional and corporate' },
                                                  { l: '🏃 Shorter', p: 'Make this message concise and short' },
                                                  { l: '😊 Add Emojis', p: 'Add relevant emojis to this message' }
                                                ].map(chip => (
                                                  <button
                                                    key={chip.l}
                                                    type="button"
                                                    onClick={() => {
                                                      setAiPrompt(chip.p);
                                                      handleGenerateAiMessage(chip.p);
                                                    }}
                                                    style={{
                                                      fontSize: '0.65rem',
                                                      padding: '4px 10px',
                                                      background: 'white',
                                                      border: '1px solid #e2e8f0',
                                                      borderRadius: '0px',
                                                      cursor: 'pointer',
                                                      fontWeight: 600,
                                                      color: 'var(--text-muted)'
                                                    }}
                                                  >
                                                    {chip.l}
                                                  </button>
                                                ))}
                                              </div>
                                              <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                  type="text"
                                                  placeholder="Or type custom instruction..."
                                                  value={aiPrompt}
                                                  onChange={e => setAiPrompt(e.target.value)}
                                                  onKeyPress={e => e.key === 'Enter' && handleGenerateAiMessage()}
                                                  style={{
                                                    flex: 1,
                                                    padding: '8px 12px',
                                                    borderRadius: '0px',
                                                    border: '1px solid var(--border)',
                                                    fontSize: '0.85rem',
                                                    outline: 'none'
                                                  }}
                                                />
                                                <button
                                                  type="button"
                                                  disabled={isAiGenerating}
                                                  onClick={() => handleGenerateAiMessage()}
                                                  className="gemini-ai-btn"
                                                  style={{ padding: '4px 12px !important' }}
                                                >
                                                  {isAiGenerating ? '...' : 'GO'}
                                                </button>
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>

                                        <textarea
                                          placeholder="Type your message here, then use AI Magic to refine it..."
                                          value={formData.message}
                                          onChange={e => setFormData({ ...formData, message: e.target.value })}
                                          required={!selectedFile}
                                          style={{
                                            flex: 1,
                                            width: '100%',
                                            border: 'none',
                                            padding: '15px',
                                            paddingBottom: '45px',
                                            fontSize: '0.95rem',
                                            outline: 'none',
                                            resize: 'none',
                                            background: 'transparent'
                                          }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => { triggerSelection(); setActiveEmojiPicker(activeEmojiPicker === 'schedule_desktop' ? null : 'schedule_desktop'); }}
                                          style={{
                                            position: 'absolute',
                                            bottom: '10px',
                                            right: '10px',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-muted)',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 5
                                          }}
                                        >
                                          <Smile size={18} />
                                        </button>
                                        {activeEmojiPicker === 'schedule_desktop' && (
                                          <EmojiPicker
                                            onSelect={insertEmoji}
                                            onClose={() => setActiveEmojiPicker(null)}
                                          />
                                        )}
                                      </div>
                                    </div>

                                    {/* Media Upload Section */}
                                    <div className="media-upload-area">
                                      {!selectedFile && !filePreview ? (
                                        <div className="media-buttons">
                                          <label className="media-btn" title="Image">
                                            <ImageIcon size={20} />
                                            <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                                          </label>
                                          <label className="media-btn" title="Video">
                                            <VideoIcon size={20} />
                                            <input type="file" accept="video/*" onChange={handleFileChange} hidden />
                                          </label>
                                          <label className="media-btn" title="Document">
                                            <FileIcon size={20} />
                                            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileChange} hidden />
                                          </label>
                                          <label className="media-btn" title="Voice Note">
                                            <Mic size={20} />
                                            <input type="file" accept="audio/*" onChange={e => handleFileChange(e, true)} hidden />
                                          </label>
                                        </div>
                                      ) : (
                                        <div className="media-preview-container">
                                          {filePreview?.type === 'image' && <img src={filePreview.url} alt="Preview" />}
                                          {filePreview?.type === 'video' && <video src={filePreview.url} controls={false} />}
                                          {(filePreview?.type === 'file' || filePreview?.type === 'audio') && (
                                            <div className="file-preview-icon">
                                              {filePreview.type === 'audio' ? <Mic size={24} /> : <FileIcon size={24} />}
                                              <span>{filePreview.name}</span>
                                            </div>
                                          )}
                                          <button
                                            type="button"
                                            className="remove-media"
                                            onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                                          >
                                            <X size={14} />
                                          </button>
                                          {isVoiceNote && <div className="vn-badge">Voice Note</div>}
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}

                                {channel !== 'calendar' && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '20px' }}>
                                    {/* Credit Balance & Requirement Badge */}
                                    <div style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      background: '#f8fafc',
                                      padding: '8px 12px',
                                      border: '1px solid var(--border)',
                                      fontSize: '0.8rem',
                                      fontWeight: 700
                                    }}>
                                      <span style={{ color: 'var(--text-muted)' }}>
                                        Credits Required: <span style={{ color: 'var(--primary-dark)' }}>{getEstimatedCredits()}</span>
                                      </span>
                                      <span style={{ color: credits.total_balance < getEstimatedCredits() ? '#ea4335' : '#2e7d32' }}>
                                        Your Balance: {credits.total_balance}
                                      </span>
                                    </div>

                                    {credits.total_balance < getEstimatedCredits() && (
                                      <div style={{
                                        fontSize: '0.75rem',
                                        color: '#ea4335',
                                        fontWeight: 600,
                                        textAlign: 'center',
                                        background: '#fdf2f2',
                                        padding: '6px',
                                        border: '1px solid #f9d5d3'
                                      }}>
                                        ⚠️ Insufficient credits. Please recharge your account.
                                      </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                      <button
                                        type="button"
                                        className="btn"
                                        onClick={() => { triggerSelection(); setSidebarStep(1); }}
                                        style={{ flex: 1, background: '#f0f2f5', color: 'var(--text-muted)', borderRadius: '0px' }}
                                      >
                                        Back
                                      </button>
                                      <button
                                        type="submit"
                                        className="btn"
                                        style={{
                                          flex: 1,
                                          opacity: (((channel === 'whatsapp' ? status === 'connected' : true) && !loading && credits.total_balance >= getEstimatedCredits()) ? 1 : 0.5),
                                          cursor: (((channel === 'whatsapp' ? status === 'connected' : true) && !loading && credits.total_balance >= getEstimatedCredits()) ? 'pointer' : 'not-allowed'),
                                          background: editingId ? '#0057b7' : (channel === 'email' ? '#a52a2a' : (channel === 'calendar' ? '#1a73e8' : 'var(--primary)')),
                                          color: 'white',
                                          fontWeight: 800,
                                          border: 'none',
                                          height: '42px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '8px',
                                          borderRadius: '0px'
                                        }}
                                        disabled={(channel === 'whatsapp' && status !== 'connected') || loading || credits.total_balance < getEstimatedCredits()}
                                      >
                                        {loading ? (
                                          <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                            style={{ display: 'flex', alignItems: 'center' }}
                                          >
                                            <RefreshCcw size={18} />
                                          </motion.div>
                                        ) : (
                                          <>
                                            {editingId ? <Edit2 size={18} /> : <Calendar size={18} />}
                                            {editingId ? 'Update Meeting' : (channel === 'calendar' ? 'Create Meeting' : 'Schedule Now')}
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {editingId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(null);
                                      setFormData({ phone: '', message: '', recurrence: 'none', customDays: [] });
                                      setScheduledDate(new Date());
                                      setSidebarStep(1);
                                    }}
                                    style={{ width: '100%', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}
                                  >
                                    Cancel Edit
                                  </button>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </form>
                      )}
                    </>
                  ) : activeView === 'credits' ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Later Credits</p>

                      <div style={{
                        background: 'white',
                        border: '1px solid var(--border)',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                      }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>System Credit Rules</h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem', color: '#4a5568', lineHeight: '1.4' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                            <span>Plain Text Message</span>
                            <strong style={{ color: 'var(--primary-dark)' }}>5 credits</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                            <span>Message with Attachment</span>
                            <strong style={{ color: 'var(--primary-dark)' }}>7 credits</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                            <span>Using AI Generation</span>
                            <strong style={{ color: 'var(--primary-dark)' }}>+3 credits</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                            <span>Failed Delivery</span>
                            <strong style={{ color: '#2e7d32' }}>Refunded</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{
                        background: 'rgba(26, 115, 232, 0.05)',
                        border: '1px dashed #1a73e8',
                        padding: '16px',
                        fontSize: '0.8rem',
                        color: '#1a73e8',
                        fontWeight: 600,
                        lineHeight: '1.5'
                      }}>
                        💡 Refills happen monthly automatically. Purchased credits do not expire and will only be consumed after free credits run out.
                      </div>
                    </div>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {currentBusinessTool ? (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <button
                            onClick={() => setCurrentBusinessTool(null)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: 'none',
                              border: 'none',
                              color: 'var(--primary-dark)',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              marginBottom: '20px',
                              padding: 0,
                              textTransform: 'uppercase'
                            }}
                          >
                            &larr; Back to Tools
                          </button>

                          {currentBusinessTool === 'auto-reply' ? (
                            <>
                              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>Auto Reply Bot</h3>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Configure instant replies based on keywords.</p>

                              <form onSubmit={handleReplySubmit}>
                                <div className="input-group">
                                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-dark)' }}>TRIGGER KEYWORD</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. price, hello, help"
                                    value={replyFormData.keyword}
                                    onChange={e => setReplyFormData({ ...replyFormData, keyword: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '0px' }}
                                  />
                                </div>
                                <div className="input-group">
                                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-dark)' }}>BOT RESPONSE</label>
                                  <textarea
                                    rows="5"
                                    placeholder="Enter the message to reply with..."
                                    value={replyFormData.reply}
                                    onChange={e => setReplyFormData({ ...replyFormData, reply: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '0px', resize: 'none' }}
                                  />
                                </div>
                                <button
                                  type="submit"
                                  className="btn btn-primary"
                                  style={{ width: '100%', marginTop: '8px', borderRadius: '0px' }}
                                >
                                  <Sparkles size={18} /> Create Auto-Reply
                                </button>
                              </form>
                            </>
                          ) : currentBusinessTool === 'drip' ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Content Drip</h3>
                                {!isCreatingSequence && (
                                  <button
                                    onClick={() => setIsCreatingSequence(true)}
                                    style={{ padding: '4px 8px', background: 'var(--primary)', color: 'white', border: 'none', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    NEW SEQUENCE
                                  </button>
                                )}
                              </div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Build automated message sequences.</p>

                              {isCreatingSequence ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                  <div className="input-group">
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>SEQUENCE NAME</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Onboarding Flow"
                                      value={newSequence.name}
                                      onChange={e => setNewSequence({ ...newSequence, name: e.target.value })}
                                      style={{ width: '100%', padding: '10px', border: '1px solid var(--border)' }}
                                    />
                                  </div>
                                  {/* Trigger Settings (Premium Design) */}
                                  <div style={{ marginBottom: '24px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-dark)', display: 'block', marginBottom: '12px', letterSpacing: '0.5px' }}>AUTO-ENROLL TRIGGER</label>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                      {[
                                        { id: 'manual', label: 'Manual', sub: 'Buttons only', icon: <User size={18} /> },
                                        { id: 'new_contact', label: 'Welcome', sub: 'New contacts', icon: <UserPlus size={18} /> },
                                        { id: 'keyword', label: 'Keyword', sub: 'Auto-trigger', icon: <Zap size={18} /> }
                                      ].map(option => (
                                        <div
                                          key={option.id}
                                          onClick={() => setNewSequence({ ...newSequence, trigger: option.id })}
                                          style={{
                                            padding: '12px 8px',
                                            background: newSequence.trigger === option.id ? '#f0fff4' : 'white',
                                            border: newSequence.trigger === option.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                                            borderRadius: '0px',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '6px',
                                            boxShadow: newSequence.trigger === option.id ? '0 4px 12px rgba(37, 211, 102, 0.1)' : 'none'
                                          }}
                                        >
                                          <div style={{ color: newSequence.trigger === option.id ? 'var(--primary)' : 'var(--text-muted)' }}>
                                            {option.icon}
                                          </div>
                                          <div>
                                            <p style={{ fontSize: '0.75rem', fontWeight: 800, margin: 0, color: newSequence.trigger === option.id ? 'var(--primary-dark)' : 'var(--text)' }}>
                                              {option.label}
                                            </p>
                                            <p style={{ fontSize: '0.6rem', margin: 0, color: 'var(--text-muted)', fontWeight: 500 }}>
                                              {option.sub}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {newSequence.trigger === 'keyword' && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{ marginTop: '12px', padding: '12px', background: 'white', border: '1px solid var(--primary)', borderLeft: '4px solid var(--primary)' }}
                                      >
                                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary-dark)', display: 'block', marginBottom: '8px' }}>TRIGGER WORD</label>
                                        <input
                                          type="text"
                                          placeholder="e.g. START, INFO"
                                          value={newSequence.triggerValue || ''}
                                          onChange={e => setNewSequence({ ...newSequence, triggerValue: e.target.value.toUpperCase() })}
                                          style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', fontSize: '0.9rem', background: 'white', fontWeight: 800, letterSpacing: '1px' }}
                                        />
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>Tip: Use a simple, uppercase word like "INFO"</p>
                                      </motion.div>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>SEQUENCE STEPS</label>
                                    {newSequence.steps.map((step, index) => (
                                      <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={index}
                                        style={{ padding: '12px', background: '#f8fafc', border: '1px solid var(--border)', position: 'relative' }}
                                      >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-dark)' }}>STEP {index + 1}</span>
                                          {newSequence.steps.length > 1 && (
                                            <button
                                              onClick={() => {
                                                const steps = newSequence.steps.filter((_, i) => i !== index);
                                                setNewSequence({ ...newSequence, steps });
                                              }}
                                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                          <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>WAIT TIME</label>
                                            <input
                                              type="number"
                                              min="0"
                                              value={step.delay}
                                              onChange={e => {
                                                const steps = [...newSequence.steps];
                                                steps[index].delay = parseInt(e.target.value) || 0;
                                                setNewSequence({ ...newSequence, steps });
                                              }}
                                              style={{ width: '100%', padding: '6px', border: '1px solid var(--border)', fontSize: '0.8rem', background: 'white' }}
                                            />
                                            <div style={{ fontSize: '0.6rem', color: 'var(--primary-dark)', marginTop: '2px', fontStyle: 'italic', fontWeight: 600 }}>
                                              {step.delay === 0 ? 'Sends immediately' :
                                                step.delay === 1 ? 'Sends tomorrow' :
                                                  `Sends in ${step.delay} days`}
                                            </div>
                                          </div>
                                          <div style={{ flex: 2 }}>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>SEND CONDITION</label>
                                            <select
                                              value={step.condition}
                                              onChange={e => {
                                                const steps = [...newSequence.steps];
                                                steps[index].condition = e.target.value;
                                                setNewSequence({ ...newSequence, steps });
                                              }}
                                              style={{ width: '100%', padding: '6px', border: '1px solid var(--border)', fontSize: '0.8rem', background: 'white' }}
                                            >
                                              <option value="none">Always send (Ignore replies)</option>
                                              <option value="no-reply">Only if NO reply received</option>
                                              <option value="replied">Only IF user replied</option>
                                              <option value="contains">If reply contains keyword...</option>
                                            </select>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>
                                              {step.condition === 'none' ? 'Will send even if they text you' :
                                                step.condition === 'no-reply' ? 'Sends only if they stay silent' :
                                                  step.condition === 'replied' ? 'Sends only if they have replied' :
                                                    `Sends only if reply contains "${step.conditionValue || '...'}"`}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Keyword Input (Full Width) */}
                                        {step.condition === 'contains' && (
                                          <div style={{ marginBottom: '8px' }}>
                                            <input
                                              type="text"
                                              placeholder="e.g. price, cost, help (comma separated)"
                                              value={step.conditionValue || ''}
                                              onChange={e => {
                                                const steps = [...newSequence.steps];
                                                steps[index].conditionValue = e.target.value;
                                                setNewSequence({ ...newSequence, steps });
                                              }}
                                              style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', fontSize: '0.8rem', background: 'white' }}
                                            />
                                          </div>
                                        )}

                                        <textarea
                                          placeholder="Message content..."
                                          value={step.message}
                                          onChange={e => {
                                            const steps = [...newSequence.steps];
                                            steps[index].message = e.target.value;
                                            setNewSequence({ ...newSequence, steps });
                                          }}
                                          style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', resize: 'none', height: '60px' }}
                                        />
                                      </motion.div>
                                    ))}
                                  </div>

                                  <button
                                    onClick={() => {
                                      setNewSequence({
                                        ...newSequence,
                                        steps: [...newSequence.steps, { message: '', delay: 1, condition: 'none' }]
                                      });
                                    }}
                                    style={{ padding: '8px', border: '1px dashed var(--primary)', color: 'var(--primary-dark)', background: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    + ADD NEXT STEP
                                  </button>

                                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                    <button
                                      onClick={() => {
                                        setIsCreatingSequence(false);
                                        setEditingSequenceId(null);
                                        setNewSequence({ name: '', trigger: 'manual', triggerValue: '', steps: [{ message: '', delay: 0, condition: 'none' }] });
                                      }}
                                      className="btn-secondary"
                                      style={{ flex: 1, padding: '12px', borderRadius: '0px' }}
                                    >
                                      Back
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (!newSequence.name) return alert('Please enter a sequence name');
                                        try {
                                          const method = editingSequenceId ? 'PUT' : 'POST';
                                          const url = editingSequenceId
                                            ? `${API_URL}/api/drip/sequences/${editingSequenceId}`
                                            : `${API_URL}/api/drip/sequences`;

                                          const response = await fetch(url, {
                                            method,
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`
                                            },
                                            body: JSON.stringify(newSequence)
                                          });
                                          if (response.ok) {
                                            setIsCreatingSequence(false);
                                            setEditingSequenceId(null);
                                            setNewSequence({
                                              name: '',
                                              trigger: 'manual',
                                              triggerValue: '',
                                              steps: [{ message: '', delay: 0, condition: 'none' }]
                                            });
                                            fetchSequences();
                                          }
                                        } catch (err) {
                                          console.error('Failed to save sequence:', err);
                                        }
                                      }}
                                      className="btn-primary"
                                      style={{ flex: 2, padding: '12px', borderRadius: '0px' }}
                                    >
                                      {editingSequenceId ? 'Update Sequence' : 'Save Sequence'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {dripSequences.map(seq => (
                                    <div
                                      key={seq.id}
                                      style={{
                                        padding: '12px',
                                        background: 'white',
                                        border: '1px solid var(--border)',
                                        cursor: 'pointer'
                                      }}
                                      onClick={() => {
                                        // Could show enrollment stats or steps
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{seq.name}</h4>
                                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: '#f1f5f9', color: 'var(--text-muted)', fontWeight: 700 }}>
                                              {seq.steps?.length || 0} STEPS
                                            </span>
                                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: seq.trigger_type === 'manual' ? '#f1f5f9' : '#dcfce7', color: seq.trigger_type === 'manual' ? 'var(--text-muted)' : 'var(--primary-dark)', fontWeight: 700, textTransform: 'uppercase' }}>
                                              {seq.trigger_type === 'new_contact' ? 'WELCOME' : seq.trigger_type === 'keyword' ? `KEYWORD: ${seq.trigger_value}` : 'MANUAL'}
                                            </span>
                                          </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingSequenceId(seq.id);
                                              setNewSequence({
                                                name: seq.name,
                                                trigger: seq.trigger_type,
                                                triggerValue: seq.trigger_value,
                                                steps: seq.steps.map(s => ({
                                                  message: s.message,
                                                  delay: s.delay_days,
                                                  condition: s.condition,
                                                  conditionValue: s.condition_value
                                                }))
                                              });
                                              setIsCreatingSequence(true);
                                            }}
                                            className="btn-icon"
                                            style={{ padding: '6px' }}
                                          >
                                            <Edit2 size={14} />
                                          </button>
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              if (window.confirm('Are you sure you want to delete this sequence?')) {
                                                try {
                                                  await axios.delete(`/api/drip/sequences/${seq.id}`, {
                                                    headers: { 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}` }
                                                  });
                                                  fetchSequences();
                                                } catch (err) {
                                                  console.error('Failed to delete sequence:', err);
                                                }
                                              }
                                            }}
                                            className="btn-icon"
                                            style={{ padding: '6px', color: '#ef4444' }}
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {dripSequences.length === 0 && (
                                    <div style={{
                                      background: '#f8fafc',
                                      border: '1px dashed var(--border)',
                                      padding: '24px',
                                      textAlign: 'center',
                                      marginBottom: '20px'
                                    }}>
                                      <LayoutList size={32} color="var(--border)" style={{ marginBottom: '12px' }} />
                                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No sequences created yet.</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : currentBusinessTool === 'ai-assistant' ? (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                <div>
                                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--primary-dark)' }}>AI Assistant</h3>
                                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {autoReplies.find(r => r.keyword === '*') ? 'Active • Responding to queries' : 'Inactive • Manual mode'}
                                  </p>
                                </div>
                                <div
                                  onClick={async () => {
                                    const existing = autoReplies.find(r => r.keyword === '*' || r.keyword === '*DISABLED');
                                    if (!existing) return;
                                    const newKeyword = existing.keyword === '*' ? '*DISABLED' : '*';
                                    try {
                                      await supabase.from('auto_replies').update({ keyword: newKeyword }).eq('id', existing.id);
                                      fetchReplies();
                                    } catch (err) {
                                      console.error('Toggle failed:', err);
                                    }
                                  }}
                                  style={{
                                    width: '40px',
                                    height: '20px',
                                    background: autoReplies.find(r => r.keyword === '*') ? 'var(--primary)' : '#e2e8f0',
                                    borderRadius: '20px',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    marginTop: '4px'
                                  }}
                                >
                                  <div style={{
                                    width: '14px',
                                    height: '14px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: '3px',
                                    left: autoReplies.find(r => r.keyword === '*') ? '23px' : '3px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                  }}></div>
                                </div>
                              </div>

                              <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'block' }}>Business Knowledge Base</label>
                                <textarea
                                  placeholder="Describe your business, pricing, and FAQs here. The AI will use this to answer customers..."
                                  value={aiContext}
                                  onChange={(e) => setAiContext(e.target.value)}
                                  onBlur={async () => {
                                    if (!aiContext.trim()) return;
                                    const existing = autoReplies.find(r => r.keyword === '*' || r.keyword === '*DISABLED');
                                    try {
                                      if (existing) {
                                        await supabase.from('auto_replies').update({ reply: aiContext }).eq('id', existing.id);
                                      } else {
                                        await supabase.from('auto_replies').insert({ user_id: user.id, keyword: '*', reply: aiContext });
                                      }
                                      fetchReplies();
                                    } catch (err) {
                                      console.error('Failed to save AI context:', err);
                                    }
                                  }}
                                  style={{
                                    width: '100%',
                                    minHeight: '280px',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    fontSize: '0.9rem',
                                    lineHeight: 1.6,
                                    outline: 'none',
                                    background: '#fcfcfc',
                                    resize: 'none',
                                    transition: 'border-color 0.2s',
                                    fontFamily: 'inherit'
                                  }}
                                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                />
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '12px', fontStyle: 'italic', lineHeight: 1.4 }}>
                                  Tip: Include your hours, pricing, and services. Keyword-based replies will still take priority over AI.
                                </p>
                              </div>
                            </>
                          ) : currentBusinessTool === 'broadcast' ? (
                            <>
                              <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--primary-dark)' }}>Broadcast Center</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  Send a one-time announcement to your entire database.
                                </p>
                              </div>

                              <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'block' }}>
                                  Recipients
                                </label>

                                <div
                                  onClick={() => setShowContactModal(true)}
                                  style={{
                                    padding: '16px',
                                    background: '#f8fafc',
                                    border: '1px dashed var(--border)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                                >
                                  <Users size={24} color={selectedBroadcastContacts.length > 0 ? 'var(--primary)' : 'var(--text-muted)'} />
                                  <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: selectedBroadcastContacts.length > 0 ? 'var(--primary-dark)' : 'var(--text)' }}>
                                      {selectedBroadcastContacts.length > 0 ? `${selectedBroadcastContacts.length} contacts selected` : 'Select Contacts'}
                                    </p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                                      {selectedBroadcastContacts.length > 0 ? 'Tap to change selection' : 'Choose who receives this broadcast'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'block' }}>Announcement Message</label>
                                <textarea
                                  placeholder="Type your broadcast message here..."
                                  value={formData.message}
                                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                  style={{
                                    width: '100%',
                                    minHeight: '180px',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    fontSize: '0.9rem',
                                    lineHeight: 1.6,
                                    outline: 'none',
                                    background: '#fcfcfc',
                                    resize: 'none',
                                    transition: 'border-color 0.2s',
                                    fontFamily: 'inherit'
                                  }}
                                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                />
                              </div>

                              <button
                                onClick={async () => {
                                  if (!formData.message.trim()) return alert('Please type a message');
                                  if (selectedBroadcastContacts.length === 0) return alert('Please select at least one contact.');

                                  const confirm = window.confirm(`Send this announcement to ${selectedBroadcastContacts.length} selected contacts?`);
                                  if (!confirm) return;

                                  setLoading(true);
                                  try {
                                    await axios.post(`${API_URL}/api/schedules`, {
                                      phones: selectedBroadcastContacts,
                                      message: formData.message,
                                      scheduledAt: new Date().toISOString(),
                                      recurrence: 'none'
                                    });
                                    alert('Broadcast successfully queued!');
                                    setFormData({ ...formData, message: '' });
                                    setSelectedBroadcastContacts([]);
                                  } catch (err) {
                                    alert('Broadcast failed');
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                disabled={loading || selectedBroadcastContacts.length === 0}
                                style={{
                                  width: '100%',
                                  padding: '16px',
                                  background: 'var(--primary-dark)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '12px',
                                  fontWeight: 800,
                                  fontSize: '0.9rem',
                                  cursor: loading ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '10px',
                                  opacity: (loading || Object.keys(contacts).length === 0) ? 0.7 : 1
                                }}
                              >
                                {loading ? 'Queueing Messages...' : <><Send size={18} /> LAUNCH BROADCAST</>}
                              </button>

                              <div style={{ marginTop: '24px', padding: '16px', background: '#f0fdf4', border: '1px solid #bcf0da', borderRadius: '12px' }}>
                                <h4 style={{ fontSize: '0.75rem', fontWeight: 800, margin: '0 0 4px 0', color: '#166534' }}>How it works:</h4>
                                <p style={{ fontSize: '0.7rem', color: '#166534', margin: 0, lineHeight: 1.5 }}>
                                  Messages are queued and sent individually with a random 5-15 second delay between each one. This ensures your account remains safe and compliant with WhatsApp's anti-spam policies.
                                </p>
                              </div>
                            </>
                          ) : null}

                          {/* Contact Selection Modal */}
                          <AnimatePresence>
                            {showContactModal && (
                              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                                <motion.div
                                  initial={{ scale: 0.9, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.9, opacity: 0 }}
                                  style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                                >
                                  <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Select Recipients</h3>
                                    <button onClick={() => setShowContactModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                      <X size={20} />
                                    </button>
                                  </div>

                                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ position: 'relative' }}>
                                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                      <input
                                        type="text"
                                        placeholder="Search contacts..."
                                        value={contactSearch}
                                        onChange={(e) => setContactSearch(e.target.value)}
                                        style={{ width: '100%', padding: '10px 10px 10px 36px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                                      />
                                    </div>
                                  </div>

                                  <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '8px' }}>
                                    <div
                                      onClick={() => {
                                        const allPhones = Object.keys(contacts);
                                        if (selectedBroadcastContacts.length === allPhones.length) {
                                          setSelectedBroadcastContacts([]);
                                        } else {
                                          setSelectedBroadcastContacts(allPhones);
                                        }
                                      }}
                                      style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderRadius: '8px', background: '#f8fafc', marginBottom: '8px' }}
                                    >
                                      <div style={{ width: '20px', height: '20px', border: '2px solid var(--primary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedBroadcastContacts.length === Object.keys(contacts).length ? 'var(--primary)' : 'transparent' }}>
                                        {selectedBroadcastContacts.length === Object.keys(contacts).length && <Check size={14} color="white" />}
                                      </div>
                                      <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Select All ({Object.keys(contacts).length})</span>
                                    </div>

                                    {Object.entries(contacts)
                                      .filter(([phone, contact]) => {
                                        // Skip garbage IDs — only show real phone numbers
                                        if (!isRealPhoneNumber(phone)) return false;
                                        const name = typeof contact === 'object' ? contact.name : contact;
                                        const search = contactSearch.toLowerCase();
                                        const displayName = isPlaceholderContactName(name, phone) ? '' : name;
                                        return formatPhone(phone).includes(contactSearch) || displayName.toLowerCase().includes(search) || phone.includes(contactSearch);
                                      })
                                      .map(([phone]) => {
                                        const isSelected = selectedBroadcastContacts.includes(phone);
                                        const contactName = getContactName(phone);
                                        const hasName = contactName !== formatPhone(phone);

                                        const displayName = contactName;
                                        const initial = hasName ? contactName[0].toUpperCase() : '#';
                                        return (
                                          <div
                                            key={phone}
                                            onClick={() => {
                                              if (isSelected) {
                                                setSelectedBroadcastContacts(selectedBroadcastContacts.filter(p => p !== phone));
                                              } else {
                                                setSelectedBroadcastContacts([...selectedBroadcastContacts, phone]);
                                              }
                                            }}
                                            style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
                                            onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                          >
                                            <div style={{ width: '20px', height: '20px', border: '2px solid var(--border)', borderRadius: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'var(--primary)' : 'transparent', borderColor: isSelected ? 'var(--primary)' : 'var(--border)' }}>
                                              {isSelected && <Check size={14} color="white" />}
                                            </div>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isSelected ? 'var(--primary)' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                              {contacts[phone]?.photo ? (
                                                <img src={contacts[phone].photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                              ) : (
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isSelected ? 'white' : 'var(--text-muted)' }}>{initial}</span>
                                              )}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                              <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
                                              {hasName && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatPhone(phone)}</div>}
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>

                                  <div style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid var(--border)' }}>
                                    <button
                                      onClick={() => setShowContactModal(false)}
                                      style={{ width: '100%', padding: '12px', background: 'var(--primary-dark)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}
                                    >
                                      DONE ({selectedBroadcastContacts.length} SELECTED)
                                    </button>
                                  </div>
                                </motion.div>
                              </div>
                            )}
                          </AnimatePresence>



                        </motion.div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Business Tools</p>

                          <motion.div
                            whileHover={{ x: 5 }}
                            onClick={() => setCurrentBusinessTool('auto-reply')}
                            style={{
                              padding: '16px',
                              background: 'white',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              cursor: 'pointer',
                              transition: 'border-color 0.2s'
                            }}
                          >
                            <div style={{ width: '40px', height: '40px', background: '#e7f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0057b7' }}>
                              <Zap size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Auto Reply</h4>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Instant replies to keywords</p>
                            </div>
                          </motion.div>

                          <motion.div
                            whileHover={{ x: 5 }}
                            onClick={() => setCurrentBusinessTool('broadcast')}
                            style={{
                              padding: '16px',
                              background: 'white',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              cursor: 'pointer',
                              transition: 'border-color 0.2s'
                            }}
                          >
                            <div style={{ width: '40px', height: '40px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                              <Send size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Broadcast</h4>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Send to all contacts at once</p>
                            </div>
                          </motion.div>

                          <motion.div
                            whileHover={{ x: 5 }}
                            onClick={() => setCurrentBusinessTool('drip')}
                            style={{
                              padding: '16px',
                              background: 'white',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              cursor: 'pointer',
                              transition: 'border-color 0.2s'
                            }}
                          >
                            <div style={{ width: '40px', height: '40px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1' }}>
                              <LayoutList size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Content Drip</h4>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Automated drip sequences</p>
                            </div>
                          </motion.div>

                          <motion.div
                            whileHover={{ x: 5 }}
                            onClick={() => setCurrentBusinessTool('ai-assistant')}
                            style={{
                              padding: '16px',
                              background: 'white',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              cursor: 'pointer',
                              transition: 'border-color 0.2s',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 8px', background: 'var(--primary-dark)', color: 'white', fontSize: '0.5rem', fontWeight: 900, textTransform: 'uppercase' }}>New</div>
                            <div style={{ width: '40px', height: '40px', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                              <Bot size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>AI Assistant</h4>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Smart AI auto-responder</p>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content" style={{ display: (isMobile && ((channel === 'whatsapp' ? status !== 'connected' : false) || showServiceSelector)) ? 'none' : undefined }}>
          <header className="header" style={{
            padding: '0px 24px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isSearching ? '#f0f2f5' : 'white',
            gap: '16px'
          }}>
            {isSearching ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                <Search size={18} color="var(--primary-dark)" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search by name, phone or message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    width: '100%',
                    fontSize: '0.95rem',
                    outline: 'none',
                    padding: '8px 0'
                  }}
                />
                <X
                  size={20}
                  style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => {
                    setIsSearching(false);
                    setSearchQuery('');
                  }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '32px', height: '100%', flex: 1 }}>
                {activeView === 'scheduler' ? (
                  <>
                    <div
                      onClick={() => { triggerSelection(); setQueueTab('upcoming'); }}
                      style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        borderBottom: queueTab === 'upcoming' ? '3px solid var(--primary-dark)' : '3px solid transparent',
                        color: queueTab === 'upcoming' ? 'var(--primary-dark)' : 'var(--text-muted)',
                        fontWeight: 700,
                        fontSize: '0.9rem'
                      }}
                    >
                      Upcoming ({channel === 'reminders' ? reminders.filter(r => r.status === 'pending').length : schedules.filter(s => (showServiceSelector || s.channel === channel) && (s.status === 'pending' || s.status === 'scheduled')).length})
                    </div>
                    <div
                      onClick={() => { triggerSelection(); setQueueTab('history'); }}
                      style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        borderBottom: queueTab === 'history' ? '3px solid var(--primary-dark)' : '3px solid transparent',
                        color: queueTab === 'history' ? 'var(--primary-dark)' : 'var(--text-muted)',
                        fontWeight: 700,
                        fontSize: '0.9rem'
                      }}
                    >
                      {showServiceSelector ? 'All History' : 'History'} ({channel === 'reminders' ? reminders.filter(r => r.status !== 'pending').length : schedules.filter(s => (showServiceSelector || s.channel === channel) && s.status !== 'pending' && s.status !== 'scheduled').length})
                    </div>
                  </>
                ) : (
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--primary-dark)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {activeView === 'credits' ? 'Later Credits' :
                      (currentBusinessTool === 'auto-reply' ? 'Auto-Reply Manager' :
                        currentBusinessTool === 'drip' ? 'Drip Campaign Builder' :
                          'Business Tools')}
                  </div>
                )}


              </div>
            )}


            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Search
                size={20}
                color="#54656f"
                style={{ cursor: 'pointer' }}
                onClick={() => { triggerSelection(); setIsSearching(true); }}
              />
              <div style={{ position: 'relative' }}>
                <MoreVertical
                  size={20}
                  color="#54656f"
                  style={{ cursor: 'pointer' }}
                  onClick={() => { triggerSelection(); setShowMenu(!showMenu); }}
                />

                <AnimatePresence>
                  {showMenu && (
                    <>
                      <div
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                        onClick={() => setShowMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: '8px',
                          background: 'white',
                          borderRadius: '0px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                          padding: '8px 0',
                          zIndex: 1000,
                          width: '180px',
                          border: '1px solid var(--border)',
                          transformOrigin: 'top right'
                        }}
                      >
                        {activeView === 'scheduler' && (
                          <>
                            {queueTab === 'calendar' ? (
                              <div
                                onClick={() => { triggerSelection(); setQueueTab('upcoming'); setShowMenu(false); }}
                                style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem' }}
                              >
                                <LayoutList size={14} /> Switch to List View
                              </div>
                            ) : (
                              <div
                                onClick={() => { triggerSelection(); setQueueTab('calendar'); setShowMenu(false); }}
                                style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem' }}
                              >
                                <Calendar size={14} /> Switch to Calendar View
                              </div>
                            )}
                            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                          </>
                        )}
                        <div
                          onClick={() => { triggerSelection(); handleRetryFailed(); setShowMenu(false); }}
                          style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          <RefreshCcw size={14} /> Retry All Failed
                        </div>
                        <div
                          onClick={() => { triggerSelection(); handleExportCSV(); setShowMenu(false); }}
                          style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          <Download size={14} /> Export CSV
                        </div>
                        <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                        <div
                          onClick={() => { triggerSelection(); handleClearHistory(); setShowMenu(false); }}
                          style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', color: '#ef4444' }}
                        >
                          <Trash2 size={14} /> Clear History
                        </div>
                        <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                        <div
                          onClick={() => { triggerSelection(); handleSignOut(); setShowMenu(false); }}
                          style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', color: '#ef4444' }}
                        >
                          <LogOut size={14} /> Sign Out
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {activeView === 'scheduler' && queueTab === 'history' && (
                <div style={{ position: 'relative' }}>
                  <ListFilter
                    size={20}
                    color="#54656f"
                    style={{ cursor: 'pointer' }}
                    onClick={() => { triggerSelection(); triggerSelection(); setShowFilterMenu(!showFilterMenu); }}
                  />

                  <AnimatePresence>
                    {showFilterMenu && (
                      <>
                        <div
                          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                          onClick={() => setShowFilterMenu(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '8px',
                            background: 'white',
                            borderRadius: '0px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            padding: '8px 0',
                            zIndex: 1000,
                            width: '150px',
                            border: '1px solid var(--border)',
                            transformOrigin: 'top right'
                          }}
                        >
                          {['all', 'sent', 'delivered', 'read'].map(f => (
                            <div
                              key={f}
                              onClick={() => { triggerSelection(); setHistoryFilter(f); setShowFilterMenu(false); }}
                              style={{
                                padding: '10px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                background: historyFilter === f ? '#f0f2f5' : 'transparent',
                                fontWeight: historyFilter === f ? 'bold' : 'normal'
                              }}
                            >
                              {f === 'all' ? 'All Status' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </div>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </header>


          <div style={{ flex: 1, overflowY: 'auto', padding: queueTab === 'calendar' ? '0' : '30px 5%' }}>
            {activeView === 'credits' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', flex: 1, paddingBottom: '40px' }}>
                {/* Balance Cards Header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>

                  {/* Total Balance Card */}
                  <div style={{
                    background: 'linear-gradient(135deg, var(--primary-dark), #0057b7)',
                    color: 'white',
                    padding: '28px',
                    borderRadius: '0px',
                    boxShadow: '0 8px 30px rgba(26, 115, 232, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      right: '-20px',
                      bottom: '-20px',
                      opacity: 0.12,
                      transform: 'rotate(-15deg)'
                    }}>
                      <Coins size={140} color="white" />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>Total Later Credits</span>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '3rem', fontWeight: 800, margin: '8px 0' }}>
                      {creditsLoading ? <span className="skeleton-text" style={{ width: '80px', height: '3rem', borderRadius: '8px' }} /> : credits.total_balance}
                    </span>
                    <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>Available to use across all automations</span>
                    {credits.next_refill_date && (
                      <span style={{ fontSize: '0.8rem', opacity: 0.75, marginTop: '8px', fontWeight: 600 }}>
                        🔄 Next free refill: {new Date(credits.next_refill_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Purchased Credits Card */}
                  <div style={{
                    background: 'white',
                    border: '1px solid var(--border)',
                    padding: '28px',
                    borderRadius: '0px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Purchased Credits</span>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.5rem', fontWeight: 800, color: 'var(--text)', margin: '8px 0' }}>
                      {creditsLoading ? <span className="skeleton-text" style={{ width: '60px', height: '2.5rem', borderRadius: '8px' }} /> : credits.purchased_balance}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#2e7d32', fontWeight: 700 }}>
                      ✓ Never expires
                    </span>
                  </div>

                </div>

                {/* Active Subscription Card */}
                {credits.subscription_status === 'active' && credits.subscription_pack && (
                  <div style={{
                    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                    color: 'white',
                    border: '1px solid var(--border)',
                    padding: '24px 28px',
                    borderRadius: '0px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem'
                      }}>
                        🔄
                      </div>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 800 }}>Active Subscription — {credits.subscription_pack}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '2px' }}>
                          {credits.subscription_credits?.toLocaleString()} credits auto-added every month
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm('Cancel your monthly subscription? You will not be charged again.')) return;
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          const token = session?.access_token || '';
                          const res = await fetch(`${API_URL}/api/credits/subscription/cancel`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                          });
                          if (res.ok) {
                            fetchCredits();
                            alert('Subscription cancelled successfully.');
                          } else {
                            alert('Failed to cancel subscription.');
                          }
                        } catch (err) {
                          alert('Network error. Please try again.');
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '0px',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
                      onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                    >
                      Cancel Subscription
                    </button>
                  </div>
                )}

                {/* Pricing / Recharge Packs Section */}
                <div style={{ background: 'white', border: '1px solid var(--border)', padding: '30px', borderRadius: '0px' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Recharge Later Credits</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '4px 0px 18px' }}>Need more automations? Purchase high-speed credit packs that never expire.</p>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '20px'
                  }}>
                    {[
                      { name: 'Mini', credits: 250, price: '₹79', desc: 'Perfect for quick testing', subscriptionId: 'sub_TIVP0KoRcCkwj6' },
                      { name: 'Starter', credits: 600, price: '₹149', desc: 'Casual users setup', subscriptionId: 'sub_TIVRzRGcPJ5wOh' },
                      { name: 'Popular', credits: 1500, price: '₹299', desc: 'Most cost-effective pack', popular: true, subscriptionId: 'sub_TIVXsqL2KIWBuK' },
                      { name: 'Pro', credits: 4000, price: '₹699', desc: 'Growing businesses', subscriptionId: 'sub_TIVXSrlnOK0hz0' },
                      { name: 'Business', credits: 12000, price: '₹1,499', desc: 'Power automation suite', subscriptionId: 'sub_TIVYIKsHm5heEt' },
                      { name: 'Enterprise', credits: '30,000+', price: 'Custom', desc: 'Custom volume options' }
                    ].map(pkg => (
                      <div
                        key={pkg.name}
                        style={{
                          border: pkg.popular ? '2px solid var(--primary)' : '1px solid var(--border)',
                          borderRadius: '0px',
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          background: pkg.popular ? '#fbfdff' : 'white',
                          boxShadow: pkg.popular ? '0 4px 20px rgba(26, 115, 232, 0.08)' : 'none'
                        }}
                      >
                        {pkg.popular && (
                          <span style={{
                            position: 'absolute',
                            top: '-12px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'var(--primary)',
                            color: 'white',
                            padding: '4px 12px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            borderRadius: '0px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Best Value
                          </span>
                        )}

                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{pkg.name}</span>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '12px 0 6px 0' }}>
                          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, color: 'var(--text)' }}>
                            {pkg.credits.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>credits</span>
                        </div>

                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{pkg.price}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', flex: 1 }}>{pkg.desc}</span>

                        <button
                          className={`pay-btn ${pkg.popular ? 'popular-btn' : ''}`}
                          disabled={purchasingPack === pkg.name}
                          onClick={async () => {
                            if (pkg.name === 'Enterprise') {
                              alert('Please email support at sales@indiecode.in to configure high volume enterprise custom pricing.');
                              return;
                            }

                            setPurchasingPack(pkg.name);
                            const priceStr = pkg.price.replace('₹', '').replace(',', '');
                            const amountPaise = Math.max(100, parseInt(priceStr, 10) * 100);

                            try {
                              const { data: { session } } = await supabase.auth.getSession();
                              const token = session?.access_token || '';

                              let subData;
                              try {
                                const subRes = await fetch(`${API_URL}/api/credits/subscription`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                  body: JSON.stringify({ packageName: pkg.name, credits: pkg.credits, amountPaise })
                                });
                                subData = await subRes.json();
                                if (!subRes.ok) throw new Error(subData.error || 'Subscription creation failed');
                              } catch (subErr) {
                                console.error('[Subscription Error]', subErr);
                                alert('Could not initiate subscription. Please check network connection.');
                                setPurchasingPack(null);
                                return;
                              }

                              const periodLabel = 'Monthly';

                              const verifySubscription = async (response) => {
                                try {
                                  const verifyRes = await fetch(`${API_URL}/api/credits/subscription/verify`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({
                                      razorpay_payment_id: response.razorpay_payment_id,
                                      razorpay_subscription_id: response.razorpay_subscription_id,
                                      razorpay_signature: response.razorpay_signature,
                                      credits: pkg.credits,
                                      packageName: pkg.name
                                    })
                                  });
                                  const result = await verifyRes.json();
                                  if (verifyRes.ok) {
                                    triggerSelection();
                                    setPaymentSuccessModal({ credits: result.credits_added, packageName: `${pkg.name} (Monthly)`, subscription: true });
                                    fetchCredits();
                                  } else {
                                    alert('⚠️ Payment received but subscription activation failed. Contact support@indiecode.in with payment ID: ' + response.razorpay_payment_id);
                                  }
                                } catch (vErr) {
                                  console.error('[Subscription Verify Error]', vErr);
                                  alert('⚠️ Payment processed but verification failed. Your credits will update shortly.');
                                } finally {
                                  setPurchasingPack(null);
                                }
                              };

                              if (Capacitor.isNativePlatform()) {
                                try {
                                  const response = await RazorpayNative.openCheckout({
                                    subscriptionId: subData.subscriptionId,
                                    key: subData.key,
                                    name: 'LaterOn',
                                    description: `${pkg.name} ${periodLabel} — ${pkg.credits} credits`
                                  });
                                  if (response && response.razorpay_payment_id) {
                                    await verifySubscription(response);
                                  } else {
                                    setPurchasingPack(null);
                                  }
                                } catch (nativeErr) {
                                  setPurchasingPack(null);
                                  const errMsg = (nativeErr?.message || '').toLowerCase();
                                  if (!errMsg.includes('cancel') && !errMsg.includes('closed') && !errMsg.includes('back')) {
                                    console.error('[Native Razorpay Error]', nativeErr);
                                  }
                                }
                              } else {
                                if (!window.Razorpay) {
                                  await new Promise((resolve, reject) => {
                                    const s = document.createElement('script');
                                    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
                                    s.onload = resolve;
                                    s.onerror = reject;
                                    document.body.appendChild(s);
                                  });
                                }
                                const rzp = new window.Razorpay({
                                  key: subData.key,
                                  subscription_id: subData.subscriptionId,
                                  name: 'LaterOn',
                                  description: `${pkg.name} ${periodLabel} — ${pkg.credits} credits`,
                                  theme: { color: '#1a73e8' },
                                  handler: verifySubscription,
                                  modal: { ondismiss: () => setPurchasingPack(null) }
                                });
                                rzp.open();
                              }
                            } catch (err) {
                              console.error('[Purchase Error]', err);
                              setPurchasingPack(null);
                            }
                          }}
                        >
                          <span className="btn-text">
                            {purchasingPack === pkg.name ? 'Opening Checkout...' : (pkg.name === 'Enterprise' ? 'Contact Sales' : 'Subscribe Monthly')}
                          </span>
                          <div className="icon-container">
                            {purchasingPack === pkg.name ? (
                              <Loader2 size={18} className="spin" style={{ color: 'white' }} />
                            ) : (
                              <>
                                <svg viewBox="0 0 24 24" className="icon card-icon">
                                  <path d="M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18C2,19.11 2.89,20 4,20H20C21.11,20 22,19.11 22,18V6C22,4.89 21.11,4 20,4Z" fill="currentColor"></path>
                                </svg>
                                <svg viewBox="0 0 24 24" className="icon payment-icon">
                                  <path d="M2,17H22V21H2V17M6.25,7H9V6H6V3H18V6H15V7H17.75L19,17H5L6.25,7M9,10H15V8H9V10M9,13H15V11H9V13Z" fill="currentColor"></path>
                                </svg>
                                <svg viewBox="0 0 24 24" className="icon dollar-icon">
                                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="currentColor"></path>
                                </svg>
                                <svg viewBox="0 0 24 24" className="icon wallet-icon default-icon">
                                  <path d="M21,18V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V6H12C10.89,6 10,6.9 10,8V16A2,2 0 0,0 12,18M12,16H22V8H12M16,13.5A1.5,1.5 0 0,1 14.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,12A1.5,1.5 0 0,1 16,13.5Z" fill="currentColor"></path>
                                </svg>
                                <svg viewBox="0 0 24 24" className="icon check-icon">
                                  <path d="M9,16.17L4.83,12L3.41,13.41L9,19L21,7L19.59,5.59L9,16.17Z" fill="currentColor"></path>
                                </svg>
                              </>
                            )}
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transaction History Section */}
                <div style={{ background: 'white', border: '1px solid var(--border)', padding: '30px', borderRadius: '0px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Usage & Transaction History</h3>
                    {credits.transactions.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {['all', 'purchase', 'subscription_purchase', 'deduction', 'refund'].map(f => (
                          <button
                            key={f}
                            onClick={() => { setTxnFilter(f); setTxnPage(1); }}
                            style={{
                              padding: '4px 12px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'capitalize',
                              border: txnFilter === f ? '2px solid var(--primary)' : '1px solid var(--border)',
                              background: txnFilter === f ? '#eaf2ff' : 'white',
                              color: txnFilter === f ? 'var(--primary)' : 'var(--text-muted)',
                              borderRadius: '0px',
                              cursor: 'pointer'
                            }}
                          >
                            {f === 'all' ? 'All' : f === 'subscription_purchase' ? 'Subscribed' : f}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {(() => {
                    const filtered = credits.transactions.filter(tx => txnFilter === 'all' || tx.type === txnFilter);
                    const totalPages = Math.max(1, Math.ceil(filtered.length / TXN_PER_PAGE));
                    const page = Math.min(txnPage, totalPages);
                    const start = (page - 1) * TXN_PER_PAGE;
                    const pageRows = filtered.slice(start, start + TXN_PER_PAGE);

                    return filtered.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {credits.transactions.length === 0 ? 'No credit transactions recorded yet.' : 'No transactions match this filter.'}
                      </div>
                    ) : (
                      <>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left', fontWeight: 700 }}>
                                <th style={{ padding: '12px 8px' }}>Date</th>
                                <th style={{ padding: '12px 8px' }}>Transaction Details</th>
                                <th style={{ padding: '12px 8px' }}>Type</th>
                                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Credits</th>
                                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Amount Paid</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageRows.map(tx => {
                                const isPositive = tx.amount > 0;
                                let amountPaidText = '—';
                                if (tx.type === 'purchase') {
                                  if ((tx.description || '').includes('Mini')) amountPaidText = '₹79';
                                  else if ((tx.description || '').includes('Starter')) amountPaidText = '₹149';
                                  else if ((tx.description || '').includes('Popular')) amountPaidText = '₹299';
                                  else if ((tx.description || '').includes('Pro')) amountPaidText = '₹699';
                                  else if ((tx.description || '').includes('Business')) amountPaidText = '₹1,499';
                                  else amountPaidText = 'Paid';
                                } else if (tx.type === 'subscription_purchase' || tx.type === 'subscription_charge') {
                                  amountPaidText = 'Subscription';
                                } else if (tx.type === 'monthly_refill') {
                                  amountPaidText = 'Free';
                                }

                                return (
                                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                                      {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text)' }}>
                                      {tx.description || 'Automation Transaction'}
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                      <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        padding: '2px 8px',
                                        background: tx.type === 'deduction' ? '#fbf3f2' : tx.type === 'refund' ? '#e2f4e3' : '#eaf2ff',
                                        color: tx.type === 'deduction' ? '#ea4335' : tx.type === 'refund' ? '#2e7d32' : '#1a73e8'
                                      }}>
                                        {tx.type === 'subscription_purchase' ? 'subscribed' : tx.type === 'subscription_charge' ? 'auto-charge' : tx.type}
                                      </span>
                                    </td>
                                    <td style={{
                                      padding: '12px 8px',
                                      textAlign: 'right',
                                      fontWeight: 800,
                                      color: isPositive ? '#2e7d32' : '#ea4335'
                                    }}>
                                      {isPositive ? `+${tx.amount} credits` : `${tx.amount} credits`}
                                    </td>
                                    <td style={{
                                      padding: '12px 8px',
                                      textAlign: 'right',
                                      fontWeight: 700,
                                      color: tx.type === 'purchase' || tx.type === 'subscription_purchase' ? 'var(--primary-dark)' : 'var(--text-muted)'
                                    }}>
                                      {amountPaidText}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {totalPages > 1 && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                            <button
                              disabled={page <= 1}
                              onClick={() => setTxnPage(page - 1)}
                              style={{
                                padding: '6px 14px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                border: '1px solid var(--border)',
                                background: page <= 1 ? '#f5f5f5' : 'white',
                                color: page <= 1 ? '#ccc' : 'var(--text)',
                                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                                borderRadius: '0px'
                              }}
                            >← Prev</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                              <button
                                key={p}
                                onClick={() => setTxnPage(p)}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  border: p === page ? '2px solid var(--primary)' : '1px solid var(--border)',
                                  background: p === page ? '#eaf2ff' : 'white',
                                  color: p === page ? 'var(--primary)' : 'var(--text)',
                                  cursor: 'pointer',
                                  borderRadius: '0px'
                                }}
                              >{p}</button>
                            ))}
                            <button
                              disabled={page >= totalPages}
                              onClick={() => setTxnPage(page + 1)}
                              style={{
                                padding: '6px 14px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                border: '1px solid var(--border)',
                                background: page >= totalPages ? '#f5f5f5' : 'white',
                                color: page >= totalPages ? '#ccc' : 'var(--text)',
                                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                                borderRadius: '0px'
                              }}
                            >Next →</button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

              </div>
            ) : activeView === 'scheduler' ? (
              queueTab === 'calendar' ? (
                <CalendarView
                  schedules={schedules}
                  contacts={contacts}
                  onEventDrop={handleCalendarEventDrop}
                  onEventClick={handleEdit}
                  onEventHover={setHoveredSchedule}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <AnimatePresence>
                    {channel === 'reminders' ? (
                      // Render reminders list on mobile
                      reminders.filter(r => {
                        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.description || '').toLowerCase().includes(searchQuery.toLowerCase());
                        if (!matchesSearch) return false;
                        if (queueTab === 'upcoming') return r.status === 'pending';
                        return r.status !== 'pending';
                      }).length === 0 ? (
                        <motion.div
                          key="empty-reminders"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          style={{
                            textAlign: 'center',
                            background: 'rgba(255, 255, 255, 0.9)',
                            padding: '40px',
                            borderRadius: '0px',
                            boxShadow: 'var(--shadow)',
                            margin: '100px auto',
                            maxWidth: '400px'
                          }}>
                          <div style={{
                            width: '64px',
                            height: '64px',
                            background: '#fffbeb',
                            borderRadius: '0px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            color: '#f59e0b'
                          }}>
                            <Bell size={32} />
                          </div>
                          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
                            {searchQuery ? 'No matching reminders' : queueTab === 'upcoming' ? 'No Upcoming Reminders' : 'No Past Reminders'}
                          </h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {searchQuery ? `We couldn't find anything matching "${searchQuery}"` : queueTab === 'upcoming'
                              ? 'Your personal reminders will appear here.'
                              : 'Once your reminders trigger, they will move to history.'}
                          </p>
                        </motion.div>
                      ) : (
                        reminders
                          .filter(r => {
                            const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (r.description || '').toLowerCase().includes(searchQuery.toLowerCase());
                            if (!matchesSearch) return false;
                            if (queueTab === 'upcoming') return r.status === 'pending';
                            return r.status !== 'pending';
                          })
                          .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))
                          .map(item => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, x: -20 }}
                              layout
                              style={{
                                alignSelf: 'center',
                                width: '100%',
                                maxWidth: '600px',
                                background: item.status === 'pending' ? 'white' : '#fffbeb',
                                border: '1px solid #fef3c7',
                                borderLeft: `4px solid ${item.status === 'pending' ? '#f59e0b' : '#d97706'}`,
                                padding: '12px 16px',
                                borderRadius: '0px',
                                boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                                position: 'relative'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#92400e', margin: '0 0 4px 0', wordBreak: 'break-word', textAlign: 'left' }}>
                                    {item.title}
                                  </h4>
                                  {item.description && (
                                    <p style={{ fontSize: '0.8rem', color: '#b45309', margin: '0 0 6px 0', wordBreak: 'break-word', textAlign: 'left' }}>
                                      {item.description}
                                    </p>
                                  )}
                                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    <Clock size={12} />
                                    <span>{format(new Date(item.scheduled_at), 'PPP h:mm aa')}</span>
                                    {item.recurrence !== 'none' && (
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#f59e0b', fontWeight: 700 }}>
                                        <Repeat size={10} /> {item.recurrence}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReminder(item.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </motion.div>
                          ))
                      )
                    ) : schedules.filter(s => {
                      if (!showServiceSelector && s.channel !== channel) return false;
                      const matchesSearch = (s.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (s.message || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        getContactName((s.phone || '').split('@')[0]).toLowerCase().includes(searchQuery.toLowerCase());
                      if (!matchesSearch) return false;
                      if (queueTab === 'upcoming') return s.status === 'pending' || s.status === 'scheduled';
                      if (historyFilter !== 'all' && s.status !== historyFilter) return false;
                      return s.status !== 'pending' && s.status !== 'scheduled';
                    }).length === 0 ? (
                      <>
                        {schedulesLoading ? (
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 240px)', width: '100%' }}>
                            <svg height="128px" width="128px" viewBox="0 0 128 128" className="pl1">
                              <defs>
                                <linearGradient y2="1" x2="1" y1="0" x1="0" id="pl-grad">
                                  <stop stopColor="#000" offset="0%" />
                                  <stop stopColor="#fff" offset="100%" />
                                </linearGradient>
                                <mask id="pl-mask">
                                  <rect fill="url(#pl-grad)" height="128" width="128" y="0" x="0" />
                                </mask>
                              </defs>
                              <g fill="var(--primary)">
                                <g className="pl1__g">
                                  <g transform="translate(20,20) rotate(0,44,44)">
                                    <g className="pl1__rect-g">
                                      <rect height="40" width="40" ry="8" rx="8" className="pl1__rect" />
                                      <rect transform="translate(0,48)" height="40" width="40" ry="8" rx="8" className="pl1__rect" />
                                    </g>
                                    <g transform="rotate(180,44,44)" className="pl1__rect-g">
                                      <rect height="40" width="40" ry="8" rx="8" className="pl1__rect" />
                                      <rect transform="translate(0,48)" height="40" width="40" ry="8" rx="8" className="pl1__rect" />
                                    </g>
                                  </g>
                                </g>
                              </g>
                              <g mask="url(#pl-mask)" fill="#e1306c">
                                <g className="pl1__g">
                                  <g transform="translate(20,20) rotate(0,44,44)">
                                    <g className="pl1__rect-g">
                                      <rect height="40" width="40" ry="8" rx="8" className="pl1__rect" />
                                      <rect transform="translate(0,48)" height="40" width="40" ry="8" rx="8" className="pl1__rect" />
                                    </g>
                                    <g transform="rotate(180,44,44)" className="pl1__rect-g">
                                      <rect height="40" width="40" ry="8" rx="8" className="pl1__rect" />
                                      <rect transform="translate(0,48)" height="40" width="40" ry="8" rx="8" className="pl1__rect" />
                                    </g>
                                  </g>
                                </g>
                              </g>
                            </svg>
                          </div>
                        ) : (
                          <>
                            <motion.div
                              key="empty-state"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              style={{
                                textAlign: 'center',
                                background: 'rgba(255, 255, 255, 0.9)',
                                padding: '40px',
                                borderRadius: '6px',
                                boxShadow: 'var(--shadow)',
                                margin: '80px auto',
                                maxWidth: '400px'
                              }}>
                              <div style={{
                                width: '64px',
                                height: '64px',
                                background: '#f0f2f5',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px'
                              }}>
                                <MessageSquare size={32} color="#bac0c4" />
                              </div>
                              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
                                {searchQuery ? 'No matching messages' : queueTab === 'upcoming' ? 'No Upcoming Messages' : `No ${historyFilter} messages`}
                              </h3>
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {searchQuery ? `We couldn't find anything matching "${searchQuery}"` : queueTab === 'upcoming'
                                  ? 'Your scheduled messages will appear here.'
                                  : historyFilter === 'all'
                                    ? 'Once messages are sent, they will move to history.'
                                    : `You don't have any messages with the status "${historyFilter}" yet.`}
                              </p>
                            </motion.div>

                            {/* Recent Activity Mini-Section */}
                            {queueTab === 'upcoming' && !searchQuery && schedules.filter(s => (showServiceSelector || s.channel === channel) && s.status !== 'pending' && s.status !== 'failed').length > 0 && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}
                              >
                                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', textAlign: 'center' }}>Recent Activity</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {schedules
                                    .filter(s => (showServiceSelector || s.channel === channel) && s.status !== 'pending' && s.status !== 'failed')
                                    .sort((a, b) => new Date(b.scheduled_at || b.scheduledAt) - new Date(a.scheduled_at || a.scheduledAt))
                                    .slice(0, 3)
                                    .map(msg => (
                                      <div key={msg.id} style={{ background: 'white', padding: '10px 15px', borderRadius: '0px', boxShadow: '0 2px 5px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border)' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f0f2f5', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                          {contacts[msg.phone.split('@')[0]]?.photo ? (
                                            <img src={contacts[msg.phone.split('@')[0]].photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                          ) : (
                                            msg.phone.includes('@g.us') ? <Users size={14} color="#0057b7" /> : <User size={14} color="var(--text-muted)" />
                                          )}
                                        </div>
                                        <div style={{ overflow: 'hidden', flex: 1, textAlign: 'left' }}>
                                          <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {groups[msg.phone] || getContactName(msg.phone.split('@')[0])}
                                          </p>
                                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.message}</p>
                                        </div>
                                        <div style={{ textAlign: 'right', minWidth: '70px', marginLeft: '12px' }}>
                                          <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>SENT</p>
                                          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>{format(new Date(msg.scheduled_at || msg.scheduledAt), 'h:mm a')}</p>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                                <button
                                  onClick={() => setQueueTab('history')}
                                  style={{
                                    marginTop: '12px',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary-dark)',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'block',
                                    margin: '12px auto 0',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}
                                >
                                  View Full History &rarr;
                                </button>
                              </motion.div>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      schedules
                        .filter(s => {
                          if (!showServiceSelector && s.channel !== channel) return false;
                          const matchesSearch = (s.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (s.message || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            getContactName((s.phone || '').split('@')[0]).toLowerCase().includes(searchQuery.toLowerCase());
                          if (!matchesSearch) return false;
                          if (queueTab === 'upcoming') return s.status === 'pending' || s.status === 'scheduled';
                          // history tab — exclude pending/scheduled, then apply status filter
                          if (s.status === 'pending' || s.status === 'scheduled') return false;
                          if (historyFilter !== 'all' && s.status !== historyFilter) return false;
                          return true;
                        })
                        .sort((a, b) => new Date(b.scheduled_at || b.scheduledAt) - new Date(a.scheduled_at || a.scheduledAt))
                        .map(item => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, x: -20 }}
                            layout
                            style={{
                              alignSelf: 'center',
                              width: '100%',
                              maxWidth: '600px',
                              background: item.channel === 'calendar'
                                ? '#ffffff'
                                : (item.channel === 'email'
                                  ? '#ffffff'
                                  : (item.channel === 'instagram'
                                    ? '#ffffff'
                                    : ((item.status === 'pending' || item.status === 'failed') ? 'white' : '#dcf8c6'))),
                              border: item.channel === 'calendar' ? '1px solid #d2e3fc' : (item.channel === 'email' ? '1px solid #fee2e2' : (item.channel === 'instagram' ? '1px solid #f7c6d8' : 'none')),
                              borderLeft: item.channel === 'calendar' ? '4px solid #1a73e8' : (item.channel === 'email' ? '4px solid #a52a2a' : (item.channel === 'instagram' ? '4px solid #e1306c' : 'none')),
                              padding: '12px 16px',
                              borderRadius: '0px',
                              boxShadow: item.channel === 'calendar' ? '0 2px 8px rgba(26, 115, 232, 0.08)' : (item.channel === 'email' ? '0 2px 8px rgba(165, 42, 42, 0.08)' : (item.channel === 'instagram' ? '0 2px 8px rgba(225, 48, 108, 0.08)' : '0 1px 0.5px rgba(0,0,0,0.13)')),
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: item.channel === 'email' || item.channel === 'calendar' ? '0px' : '50%',
                                  background: item.channel === 'calendar' ? '#e8f0fe' : (item.channel === 'email' ? '#fdf2f2' : (item.channel === 'instagram' ? '#fff0f5' : '#f0f2f5')),
                                  overflow: 'hidden',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  border: item.channel === 'calendar' ? '1px solid #d2e3fc' : (item.channel === 'email' ? '1px solid #f8d7da' : (item.channel === 'instagram' ? '1px solid #f7c6d8' : '1px solid rgba(0,0,0,0.05)'))
                                }}>
                                  {item.channel === 'calendar' ? (
                                    <Calendar size={14} color="#1a73e8" />
                                  ) : item.channel === 'email' ? (
                                    <Mail size={14} color="#a52a2a" />
                                  ) : item.channel === 'instagram' ? (
                                    <InstagramIcon size={14} color="#e1306c" />
                                  ) : contacts[item.phone.split('@')[0]]?.photo ? (
                                    <img src={contacts[item.phone.split('@')[0]].photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : item.phone.includes('@g.us') ? (
                                    <Users size={12} color="#0057b7" />
                                  ) : (
                                    <User size={12} color="var(--text-muted)" />
                                  )}
                                </div>
                                {item.channel === 'calendar' && (
                                  <span style={{
                                    fontSize: '0.65rem',
                                    padding: '2px 6px',
                                    background: '#e8f0fe',
                                    color: '#1a73e8',
                                    border: '1px solid #d2e3fc',
                                    fontWeight: 800,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    borderRadius: '0px'
                                  }}>
                                    MEETING
                                  </span>
                                )}
                                {item.channel === 'instagram' && (
                                  <span style={{
                                    fontSize: '0.65rem',
                                    padding: '2px 6px',
                                    background: '#fff0f5',
                                    color: '#e1306c',
                                    border: '1px solid #f7c6d8',
                                    fontWeight: 800,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    borderRadius: '0px'
                                  }}>
                                    INSTAGRAM
                                  </span>
                                )}
                                {item.channel === 'email' && (
                                  <span style={{
                                    fontSize: '0.65rem',
                                    padding: '2px 6px',
                                    background: '#fdf2f2',
                                    color: '#a52a2a',
                                    border: '1px solid #f8d7da',
                                    fontWeight: 800,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    borderRadius: '0px'
                                  }}>
                                    EMAIL
                                  </span>
                                )}
                                <span style={{
                                  fontWeight: 700,
                                  color: item.channel === 'calendar' ? '#1a73e8' : (item.channel === 'email' ? '#a52a2a' : (item.channel === 'instagram' ? '#e1306c' : (item.phone.includes('@g.us') ? '#0057b7' : '#075e54'))),
                                  fontSize: '0.9rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  {item.channel === 'calendar' ? (item.metadata?.title || 'Untitled Meeting') : (item.channel === 'email' ? `To: ${item.email_to || item.phone}` : (item.channel === 'instagram' ? 'To: Instagram Feed' : `To: ${groups[item.phone] || getContactName(item.phone.split('@')[0])}`))}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: '#667781', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '0px' }}>
                                  {format(new Date(item.scheduled_at || item.scheduledAt), 'MMM d, h:mm a')}
                                </span>
                                {item.recurrence && item.recurrence !== 'none' && (
                                  <span style={{
                                    fontSize: '0.65rem',
                                    color: item.channel === 'email' ? '#a52a2a' : '#075e54',
                                    background: item.channel === 'email' ? '#fdf2f2' : '#dcf8c6',
                                    padding: '2px 6px',
                                    borderRadius: '0px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase'
                                  }}>
                                    <Repeat size={10} /> {item.recurrence}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {(item.status === 'pending' || item.status === 'failed') && item.channel !== 'instagram' && (
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className="btn-icon"
                                    style={{
                                      padding: '6px',
                                      background: item.channel === 'calendar' ? '#e8f0fe' : (item.channel === 'email' ? '#fdf2f2' : '#e7f3ff'),
                                      color: item.channel === 'calendar' ? '#1a73e8' : (item.channel === 'email' ? '#a52a2a' : '#0057b7'),
                                      border: item.channel === 'calendar' ? '1px solid #d2e3fc' : (item.channel === 'email' ? '1px solid #f8d7da' : '1px solid #d0e7ff'),
                                      borderRadius: '0px'
                                    }}
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                )}
                                {item.status === 'read' ? (
                                  <CheckCheck size={16} color="#34b7f1" />
                                ) : item.status === 'delivered' ? (
                                  <CheckCheck size={16} color="#667781" />
                                ) : item.status === 'sent' ? (
                                  item.channel === 'email' ? <CheckCheck size={16} color="#a52a2a" /> : <Check size={16} color="#667781" />
                                ) : item.status === 'failed' ? (
                                  <AlertCircle size={16} color="#ef4444" />
                                ) : (
                                  <Clock size={16} color="#667781" />
                                )}
                                <button onClick={() => deleteSchedule(item)} className="btn-icon" style={{ padding: '4px 5px' }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {item.channel === 'calendar' && (
                              <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '6px',
                                marginBottom: '10px'
                              }}>
                                <span style={{
                                  fontSize: '0.7rem',
                                  padding: '3px 8px',
                                  background: '#e8f0fe',
                                  color: '#1a73e8',
                                  fontWeight: 700,
                                  borderRadius: '0px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  {item.metadata?.platform === 'whatsapp_call' ? (
                                    <WhatsAppIcon size={12} color="#25D366" />
                                  ) : item.metadata?.platform === 'phone' ? (
                                    <Phone size={12} color="#0057b7" />
                                  ) : (
                                    <VideoIcon size={12} color="#1a73e8" />
                                  )}
                                  {{ google_meet: 'Google Meet', zoom: 'Zoom Call', whatsapp_call: 'WhatsApp Call', phone: 'Phone Call', custom: 'Online Call' }[item.metadata?.platform] || item.metadata?.platform || 'Meeting'}
                                </span>
                                {item.metadata?.duration && (
                                  <span style={{
                                    fontSize: '0.7rem',
                                    padding: '3px 8px',
                                    background: '#f0f2f5',
                                    color: '#667781',
                                    fontWeight: 700,
                                    borderRadius: '0px'
                                  }}>
                                    {item.metadata?.duration} min
                                  </span>
                                )}
                                <span style={{
                                  fontSize: '0.7rem',
                                  padding: '3px 8px',
                                  background: '#f0f2f5',
                                  color: '#667781',
                                  fontWeight: 700,
                                  borderRadius: '0px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <Clock size={11} />
                                  {format(new Date(item.scheduled_at || item.scheduledAt), 'h:mm a')}
                                </span>
                              </div>
                            )}
                            {item.channel === 'email' && item.email_subject && (
                              <div style={{
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: '#a52a2a',
                                marginBottom: '8px',
                                padding: '6px 10px',
                                background: '#fdf2f2',
                                borderLeft: '3px solid #a52a2a',
                                borderRadius: '0px'
                              }}>
                                <span style={{ color: '#7f1d1d', fontWeight: 800 }}>Subject:</span> {item.email_subject}
                              </div>
                            )}
                            {item.channel === 'instagram' && item.metadata?.image_urls?.length > 0 && (
                              <div style={{
                                display: 'flex',
                                gap: '8px',
                                overflowX: 'auto',
                                paddingBottom: '10px',
                                marginBottom: '10px',
                                maxWidth: '100%',
                                scrollbarWidth: 'thin'
                              }}>
                                {item.metadata.image_urls.map((url, idx) => (
                                  <img
                                    key={idx}
                                    src={url}
                                    alt=""
                                    style={{
                                      width: '100px',
                                      height: '100px',
                                      objectFit: 'cover',
                                      borderRadius: '4px',
                                      border: '1px solid #f7c6d8',
                                      flexShrink: 0
                                    }}
                                    onError={e => { e.target.style.display = 'none'; }}
                                  />
                                ))}
                              </div>
                            )}
                            <div style={{
                              fontSize: '0.95rem',
                              lineHeight: '1.5',
                              color: '#111b21',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {item.message}
                            </div>

                            {item.channel === 'calendar' && (item.metadata?.meetingUrl || item.metadata?.meeting_url) && (
                              <a
                                href={(() => {
                                  const rawUrl = item.metadata?.meetingUrl || item.metadata?.meeting_url || '';
                                  if (rawUrl.startsWith('http') || rawUrl.startsWith('tel:')) return rawUrl;
                                  if (item.metadata?.platform === 'whatsapp_call') {
                                    const cleanPhone = (item.phone || '').replace(/\D/g, '');
                                    return cleanPhone ? `https://wa.me/${cleanPhone}` : 'https://wa.me';
                                  }
                                  return '#';
                                })()}
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
                                <VideoIcon size={14} /> Join {item.metadata?.platform === 'google_meet' ? 'Google Meet' : item.metadata?.platform === 'zoom' ? 'Zoom' : 'Meeting'} &rarr;
                              </a>
                            )}

                            {(item.media_url || item.mediaUrl) && (
                              <div className="queue-media-preview" style={{ marginTop: '10px' }}>
                                {(item.media_type || item.mediaType)?.startsWith('image/') ? (
                                  <img
                                    src={item.media_url || item.mediaUrl}
                                    alt="Media"
                                    style={{ maxWidth: '100%', borderRadius: '0px', border: '1px solid rgba(0,0,0,0.1)' }}
                                  />
                                ) : (item.media_type || item.mediaType)?.startsWith('video/') ? (
                                  <video
                                    src={item.media_url || item.mediaUrl}
                                    controls
                                    style={{ maxWidth: '100%', borderRadius: '0px' }}
                                  />
                                ) : (item.media_type || item.mediaType)?.startsWith('audio/') || item.is_voice_note || item.isVoiceNote ? (
                                  <audio
                                    src={item.media_url || item.mediaUrl}
                                    controls
                                    style={{ width: '100%', height: '32px' }}
                                  />
                                ) : (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px',
                                    background: 'rgba(0,0,0,0.05)',
                                    borderRadius: '0px',
                                    fontSize: '0.85rem'
                                  }}>
                                    <FileIcon size={18} />
                                    <span>Document Attachment</span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div style={{
                              textAlign: 'right',
                              fontSize: '0.65rem',
                              color: '#667781',
                              marginTop: '4px',
                              fontWeight: 600,
                              textTransform: 'uppercase'
                            }}>
                              {item.status}
                            </div>
                          </motion.div>
                        ))
                    )}
                  </AnimatePresence>
                </div>
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                {currentBusinessTool === 'drip' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{
                      background: 'white',
                      padding: '24px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px'
                    }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Enroll Contacts</h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Start a drip campaign for a specific phone number.</p>

                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-dark)' }}>PHONE NUMBER</label>
                          <input
                            type="text"
                            placeholder="9122500000"
                            id="enroll-phone"
                            style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', marginTop: '4px' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-dark)' }}>SELECT SEQUENCE</label>
                          <select id="enroll-sequence" style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', marginTop: '4px', background: 'white' }}>
                            <option value="">Choose a sequence...</option>
                            {dripSequences.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <button
                          className="btn btn-primary"
                          style={{ height: '45px', padding: '0 24px' }}
                          onClick={async () => {
                            const phone = document.getElementById('enroll-phone').value;
                            const sequenceId = document.getElementById('enroll-sequence').value;
                            if (!phone || !sequenceId) return alert('Fill all fields');

                            // Clean and prefix phone number
                            let cleanPhone = phone.replace(/\D/g, '');
                            if (cleanPhone.length === 10) cleanPhone = `${getDefaultCountryCode()}${cleanPhone}`;

                            try {
                              const response = await fetch(`${API_URL}/api/drip/enroll`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`
                                },
                                body: JSON.stringify({ sequenceId, phone: cleanPhone })
                              });
                              if (response.ok) {
                                alert('Contact enrolled successfully!');
                                document.getElementById('enroll-phone').value = '';
                              } else {
                                const err = await response.json();
                                alert('Enrollment failed: ' + (err.error || 'Unknown error'));
                              }
                            } catch (err) {
                              console.error('Enrollment failed:', err);
                              alert('Enrollment failed. Please try again.');
                            }
                          }}
                        >
                          Enroll Now
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                      {dripSequences.map(seq => (
                        <motion.div
                          key={seq.id}
                          whileHover={{ y: -2 }}
                          style={{
                            background: 'white',
                            padding: '24px',
                            border: '1px solid var(--border)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ width: '40px', height: '40px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1' }}>
                              <LayoutList size={20} />
                            </div>
                            <h4 style={{ margin: 0, fontWeight: 800 }}>{seq.name}</h4>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {seq.steps?.map((step, i) => (
                              <div key={i} style={{ fontSize: '0.85rem', display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
                                <span style={{ fontWeight: 700 }}>+{step.delay_days}d:</span>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{step.message}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (

                  <AnimatePresence>
                    {autoReplies.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        background: 'rgba(255, 255, 255, 0.9)',
                        padding: '60px 40px',
                        borderRadius: '0px',
                        boxShadow: 'var(--shadow)',
                        margin: '60px auto',
                        maxWidth: '450px'
                      }}>
                        <div style={{
                          width: '80px',
                          height: '80px',
                          background: '#e7f3ff',
                          borderRadius: '0px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 24px',
                          color: '#0057b7'
                        }}>
                          <Zap size={40} />
                        </div>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '12px', fontWeight: 700 }}>Your Bot is Quiet</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                          Create your first auto-reply rule using the tool on the left.
                        </p>
                      </div>
                    ) : (

                      autoReplies.map(rule => (
                        <motion.div
                          key={rule.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          style={{
                            alignSelf: 'center',
                            width: '100%',
                            maxWidth: '700px',
                            background: 'white',
                            borderRadius: '0px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            border: '1px solid var(--border)'
                          }}
                        >
                          <div style={{ display: 'flex' }}>
                            <div style={{
                              width: '6px',
                              background: 'linear-gradient(to bottom, #0057b7, #34b7f1)'
                            }} />
                            <div style={{ flex: 1, padding: '20px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{
                                    background: '#e7f3ff',
                                    color: '#0057b7',
                                    padding: '4px 12px',
                                    borderRadius: '0px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    border: '1px solid #d0e7ff'
                                  }}>
                                    Keyword: "{rule.keyword}"
                                  </span>
                                </div>
                                <button
                                  onClick={() => deleteReply(rule.id)}
                                  className="btn-icon"
                                  style={{ color: '#ef4444', background: '#fef2f2' }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <div style={{
                                background: '#f8fafc',
                                padding: '16px',
                                borderRadius: '0px',
                                fontSize: '0.95rem',
                                color: '#334155',
                                lineHeight: '1.6',
                                border: '1px solid #edf2f7'
                              }}>
                                {rule.reply}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                )
                }
              </div>
            )}
          </div>
        </main>






        {/* Email Configuration Modal */}
        <AnimatePresence>
          {showEmailConfig && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(11, 20, 26, 0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000, backdropFilter: 'blur(4px)', padding: '20px'
            }}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                  background: 'white', padding: '32px', borderRadius: '0px',
                  width: '100%', maxWidth: '440px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#ea4335', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={20} color="white" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#b31412' }}>Email Integration</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Choose how to send emails</p>
                  </div>
                </div>

                {/* Mode 1: Default Zero-Setup */}
                <div style={{
                  padding: '16px', marginBottom: '16px',
                  border: '2px solid #16a34a', background: '#f0fdf4',
                  borderRadius: '0px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', background: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={16} color="white" />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#166534', margin: 0 }}>Email Ready (Default Server Engine)</p>
                      <p style={{ fontSize: '0.7rem', color: '#16a34a', margin: '2px 0 0' }}>
                        Active by default — no setup needed
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mode 2: Gmail OAuth */}
                <div style={{
                  padding: '16px', marginBottom: '16px',
                  border: '1px solid var(--border)', background: 'white',
                  borderRadius: '0px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', background: '#1a73e8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1a73e8', margin: 0 }}>Connect Gmail Account</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                        {integrations.find(i => i.provider === 'gmail_oauth')
                          ? `Connected as ${integrations.find(i => i.provider === 'gmail_oauth').email_address}`
                          : 'Send from your personal Gmail'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const gmailInt = integrations.find(i => i.provider === 'gmail_oauth');
                        if (gmailInt) {
                          axios.delete(`${API_URL}/api/integrations/gmail_oauth`).then(() => fetchIntegrations());
                        } else {
                          window.location.href = `${API_URL}/api/auth/google?userId=${user.id}`;
                        }
                      }}
                      style={{
                        padding: '8px 16px', border: '1px solid #1a73e8', background: 'white',
                        color: '#1a73e8', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                        borderRadius: '0px', whiteSpace: 'nowrap', flexShrink: 0
                      }}
                    >
                      {integrations.find(i => i.provider === 'gmail_oauth') ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                </div>

                {/* Mode 3: Advanced Custom Resend */}
                <details style={{ marginBottom: '20px' }}>
                  <summary style={{
                    fontSize: '0.75rem', color: '#ea4335', fontWeight: 600, cursor: 'pointer',
                    padding: '8px 0', userSelect: 'none'
                  }}>
                    Advanced: Use Custom Resend API Key &amp; Domain
                  </summary>
                  <div style={{ marginTop: '16px', padding: '16px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <div className="input-group" style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b31412' }}>RESEND API KEY</label>
                      <input
                        type="password"
                        placeholder="re_xxxxxxxxxxxx"
                        value={emailApiKey}
                        onChange={e => setEmailApiKey(e.target.value)}
                        style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '0px', fontSize: '0.9rem' }}
                      />
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Get your API key from <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: '#ea4335' }}>resend.com/api-keys</a>
                      </p>
                    </div>

                    <div className="input-group" style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b31412' }}>FROM EMAIL ADDRESS</label>
                      <input
                        type="email"
                        placeholder="you@yourdomain.com"
                        value={emailFromAddress}
                        onChange={e => setEmailFromAddress(e.target.value)}
                        style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '0px', fontSize: '0.9rem' }}
                      />
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Must be a verified domain in Resend.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={async () => {
                          if (!emailApiKey) return alert('Please enter your Resend API key');
                          setConfigSaving(true);
                          try {
                            await axios.post(`${API_URL}/api/integrations`, {
                              provider: 'resend',
                              apiKey: emailApiKey,
                              emailAddress: emailFromAddress
                            });
                            await fetchIntegrations();
                          } catch (err) {
                            alert('Failed to save: ' + (err.response?.data?.error || err.message));
                          } finally {
                            setConfigSaving(false);
                          }
                        }}
                        disabled={configSaving}
                        style={{
                          flex: 1, padding: '10px', background: '#ea4335', color: 'white', border: 'none',
                          borderRadius: '0px', fontWeight: 700, cursor: configSaving ? 'not-allowed' : 'pointer',
                          opacity: configSaving ? 0.7 : 1
                        }}
                      >
                        {configSaving ? 'Saving...' : 'Save Custom Key'}
                      </button>
                      {integrations.find(i => i.provider === 'resend') && (
                        <button
                          onClick={async () => {
                            try {
                              await axios.delete(`${API_URL}/api/integrations/resend`);
                              setEmailApiKey('');
                              setEmailFromAddress('');
                              await fetchIntegrations();
                            } catch (err) {
                              alert('Failed to remove');
                            }
                          }}
                          style={{ flex: 1, padding: '10px', background: 'none', border: '1px solid #ef4444', color: '#ef4444', fontWeight: 700, cursor: 'pointer', borderRadius: '0px' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </details>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowEmailConfig(false)}
                    className="btn"
                    style={{ flex: 1, background: '#f0f2f5', color: 'var(--text)', borderRadius: '0px' }}
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Custom Save Contact Modal */}
        <AnimatePresence>
          {showSaveModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(11, 20, 26, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              backdropFilter: 'blur(4px)'
            }}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '0px',
                  width: '100%',
                  maxWidth: '380px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}
              >
                <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', fontWeight: 700 }}>Save Contact</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                  Enter a name for <strong>+91 {formData.phone}</strong>
                </p>

                <div className="input-group">
                  <input
                    type="text"
                    placeholder="e.g. Test 2:25"
                    autoFocus
                    value={newContactName}
                    onChange={e => setNewContactName(e.target.value)}
                    style={{ fontSize: '1rem', padding: '12px 16px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="btn"
                    style={{ flex: 1, background: '#f0f2f5', color: 'var(--text)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitSaveContact}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={!newContactName}
                  >
                    Save Contact
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Disconnect Confirmation Modal */}
        <AnimatePresence>
          {showDisconnectModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(11, 20, 26, 0.85)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '20px'
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{
                  background: 'white',
                  borderRadius: '0px',
                  padding: '32px',
                  maxWidth: '440px',
                  width: '100%',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: '#fff5f5',
                  borderRadius: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: '#ff4d4f'
                }}>
                  <WifiOff size={40} />
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px', color: '#111b21' }}>
                  Disconnect WhatsApp?
                </h2>

                <p style={{ color: '#667781', lineHeight: '1.6', fontSize: '1rem', marginBottom: '32px' }}>
                  Disconnecting will <strong>immediately stop</strong> all your active automations, scheduled messages, and auto-replies. You will also be logged out.
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowDisconnectModal(false)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '0px',
                      border: '1px solid #e9edef',
                      background: 'white',
                      color: '#111b21',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Keep Connected
                  </button>
                  <button
                    onClick={confirmDisconnect}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '0px',
                      border: 'none',
                      background: '#ff4d4f',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)'
                    }}
                  >
                    Yes, Disconnect
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Sign Out Confirmation Modal */}
        <AnimatePresence>
          {showSignOutModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(11, 20, 26, 0.85)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '20px'
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{
                  background: 'white',
                  borderRadius: '0px',
                  padding: '32px',
                  maxWidth: '440px',
                  width: '100%',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: '#e7f3ff',
                  borderRadius: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: '#0057b7'
                }}>
                  <LogOut size={40} />
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px', color: '#111b21' }}>
                  Sign Out?
                </h2>

                <p style={{ color: '#667781', lineHeight: '1.6', fontSize: '1rem', marginBottom: '32px' }}>
                  You will be safely signed out. Don't worry—your <strong>automations and scheduled messages will keep running</strong> in the background! 🚀
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowSignOutModal(false)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '0px',
                      border: '1px solid #e9edef',
                      background: 'white',
                      color: '#111b21',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Stay Logged In
                  </button>
                  <button
                    onClick={confirmSignOut}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '0px',
                      border: 'none',
                      background: '#0057b7',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0, 87, 183, 0.3)'
                    }}
                  >
                    Yes, Sign Out
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Clear History Confirmation Modal */}
        <AnimatePresence>
          {showClearHistoryModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(11, 20, 26, 0.85)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '20px'
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{
                  background: 'white',
                  borderRadius: '0px',
                  padding: '32px',
                  maxWidth: '440px',
                  width: '100%',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: '#fff7ed',
                  borderRadius: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: '#f97316'
                }}>
                  <Trash2 size={40} />
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px', color: '#111b21' }}>
                  Clear All History?
                </h2>

                <p style={{ color: '#667781', lineHeight: '1.6', fontSize: '1rem', marginBottom: '32px' }}>
                  This will permanently delete all <strong>sent, delivered, read, and failed</strong> messages. This action cannot be undone.
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowClearHistoryModal(false)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '0px',
                      border: '1px solid #e9edef',
                      background: 'white',
                      color: '#111b21',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Keep History
                  </button>
                  <button
                    onClick={confirmClearHistory}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '0px',
                      border: 'none',
                      background: '#f97316',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
                    }}
                  >
                    Yes, Clear All
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Multi-Step Wizard Modal */}
        <AnimatePresence>
          {showMobileForm && (
            <motion.div
              className="mobile-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={() => setShowMobileForm(false)}
            >
              <motion.div
                className="mobile-modal-content"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                onClick={e => e.stopPropagation()}
              >
                {/* Wizard Header */}
                <div className="wizard-header">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                      {channel === 'email' ? 'Schedule Email' : (channel === 'calendar' ? 'Schedule Meeting' : (channel === 'reminders' ? 'Create Reminder' : (channel === 'telegram' ? 'Schedule Telegram Message' : (channel === 'instagram' ? 'Schedule Instagram Post' : 'Schedule Message'))))}
                    </h2>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Step {formStep} of {['reminders', 'telegram', 'instagram'].includes(channel) ? 2 : 3}</span>
                  </div>
                  <div className="wizard-step-indicator">
                    <div className={`step-dot ${formStep >= 1 ? 'active' : ''}`} />
                    <div className={`step-dot ${formStep >= 2 ? 'active' : ''}`} />
                    {!['reminders', 'telegram', 'instagram'].includes(channel) && <div className={`step-dot ${formStep >= 3 ? 'active' : ''}`} />}
                  </div>
                  <button
                    onClick={() => setShowMobileForm(false)}
                    className="btn-icon"
                    style={{ background: '#f0f2f5', borderRadius: '0px' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Wizard Body */}
                <div className="wizard-body">
                  <AnimatePresence mode="wait">
                    {formStep === 1 && (
                      <motion.div
                        key="step1"
                        className="wizard-stage"
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                      >
                        {channel === 'email' ? (
                          <>
                            <div>
                              <h3 className="stage-title">Who are we emailing?</h3>
                              <p className="stage-desc">Enter the recipient email and subject line.</p>
                            </div>
                            <div className="input-group">
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea4335', marginBottom: '8px', display: 'block' }}>TO (EMAIL)</label>
                              <input
                                type="email"
                                placeholder="user@example.com"
                                value={formData.emailTo || ''}
                                onChange={e => setFormData({ ...formData, emailTo: e.target.value })}
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '0px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none' }}
                              />
                            </div>
                            <div className="input-group">
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea4335', marginBottom: '8px', display: 'block' }}>SUBJECT</label>
                              <input
                                type="text"
                                placeholder="Subject line"
                                value={formData.emailSubject || ''}
                                onChange={e => setFormData({ ...formData, emailSubject: e.target.value })}
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '0px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none' }}
                              />
                            </div>
                          </>
                        ) : channel === 'calendar' ? (
                          <>
                            <div>
                              <h3 className="stage-title">Meeting Recipient</h3>
                              <p className="stage-desc">Who is this meeting with?</p>
                            </div>
                            <div className="input-group">
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1a73e8', marginBottom: '8px', display: 'block' }}>RECIPIENT CONTACT (WHATSAPP)</label>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ padding: '12px 16px', background: '#f0f2f5', border: '1px solid var(--border)', fontSize: '1rem', fontWeight: 800, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center' }}>+91</div>
                                <input
                                  type="text"
                                  placeholder="e.g. 9122500000"
                                  value={formData.phone}
                                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                  style={{ flex: 1, padding: '12px 16px', borderRadius: '0px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none' }}
                                />
                              </div>
                            </div>
                            <div className="input-group">
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1a73e8', marginBottom: '8px', display: 'block' }}>RECIPIENT EMAIL (OPTIONAL)</label>
                              <input
                                type="email"
                                placeholder="client@example.com"
                                value={formData.emailTo || ''}
                                onChange={e => setFormData({ ...formData, emailTo: e.target.value })}
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '0px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none' }}
                              />
                            </div>
                          </>
                        ) : channel === 'reminders' ? (
                          <>
                            <div>
                              <h3 className="stage-title">What's your reminder?</h3>
                              <p className="stage-desc">Give your reminder a title and optional description.</p>
                            </div>
                            <div className="input-group">
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', marginBottom: '8px', display: 'block' }}>REMINDER TITLE</label>
                              <input
                                type="text"
                                placeholder="e.g. Buy groceries"
                                value={reminderForm.title}
                                onChange={e => setReminderForm({ ...reminderForm, title: e.target.value })}
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '0px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none' }}
                              />
                            </div>
                            <div className="input-group">
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', marginBottom: '8px', display: 'block' }}>DESCRIPTION (OPTIONAL)</label>
                              <textarea
                                placeholder="Add details..."
                                value={reminderForm.description}
                                onChange={e => setReminderForm({ ...reminderForm, description: e.target.value })}
                                rows={3}
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '0px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none', resize: 'vertical' }}
                              />
                            </div>
                          </>
                        ) : channel === 'telegram' ? (
                          <>
                            {isTelegramStatusLoading ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '12px' }}>
                                <RefreshCcw size={24} className="spin" color="#0088cc" />
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Loading bot details...</p>
                              </div>
                            ) : telegramStatus.status !== 'connected' ? (
                              <div style={{ background: '#f8fafc', padding: '16px', border: '1px solid var(--border)' }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: 800, color: '#0088cc', textTransform: 'uppercase' }}>1. Connect Bot Token</h4>
                                <ol style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '16px', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                                  <li style={{ marginBottom: '4px' }}>
                                    Search for <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" style={{ color: '#0088cc', fontWeight: 700 }}>@BotFather</a> on Telegram.
                                    <div style={{ margin: '8px 0 12px 0', border: '1px solid var(--border)', borderRadius: '0px', overflow: 'hidden' }}>
                                      <img src="https://miro.medium.com/v2/resize:fit:1400/1*DIdtNFdMj2QovbC7NXAvTw.png" alt="BotFather Guide" style={{ width: '100%', height: 'auto', display: 'block' }} />
                                    </div>
                                  </li>
                                  <li style={{ marginBottom: '4px' }}>Send the command <strong style={{ color: 'var(--text-main)', background: '#e2e8f0', padding: '1px 5px', borderRadius: '3px', fontFamily: 'monospace' }}>/newbot</strong> to start.</li>
                                  <li style={{ marginBottom: '4px' }}>Name and select a username ending in <code>bot</code>.</li>
                                  <li>Copy the <strong style={{ color: 'var(--text-main)', background: '#e2e8f0', padding: '1px 5px', borderRadius: '3px', fontFamily: 'monospace' }}>HTTP API Token</strong> and paste below:</li>
                                </ol>
                                <input
                                  type="password"
                                  placeholder="e.g. 123456789:ABCdef..."
                                  value={customTelegramToken}
                                  onChange={e => setCustomTelegramToken(e.target.value)}
                                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', fontSize: '0.9rem', marginBottom: '8px', boxSizing: 'border-box' }}
                                />
                                {telegramTestBotResult && (
                                  <div style={{ padding: '8px 12px', marginBottom: '8px', background: telegramTestBotResult.success ? '#f0fdf4' : '#fef2f2', border: telegramTestBotResult.success ? '1px solid #bbf7d0' : '1px solid #fecaca', fontSize: '0.75rem', color: telegramTestBotResult.success ? '#166534' : '#991b1b' }}>
                                    {telegramTestBotResult.success ? `✓ Connected: @${telegramTestBotResult.username}` : `✗ Error: ${telegramTestBotResult.error}`}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!customTelegramToken.trim()) return alert('Please enter your bot API token');
                                    setIsTestingTelegramBot(true);
                                    setTelegramTestBotResult(null);
                                    try {
                                      const testRes = await axios.post(`${API_URL}/api/telegram/test-custom-bot`, { customBotToken: customTelegramToken });
                                      if (testRes.data.success) {
                                        setTelegramTestBotResult({ success: true, username: testRes.data.username });
                                        await axios.post(`${API_URL}/api/telegram/config`, { customBotToken: customTelegramToken, botUsername: testRes.data.username });
                                        await fetchTelegramStatus();
                                      }
                                    } catch (err) {
                                      setTelegramTestBotResult({ success: false, error: err.response?.data?.error || err.message });
                                    } finally {
                                      setIsTestingTelegramBot(false);
                                    }
                                  }}
                                  disabled={isTestingTelegramBot}
                                  style={{ width: '100%', padding: '12px', background: '#0088cc', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                                >
                                  {isTestingTelegramBot ? 'Connecting Bot...' : 'Verify & Save Bot'}
                                </button>
                              </div>
                            ) : !telegramStatus.config?.chats || telegramStatus.config.chats.length === 0 ? (
                              <div style={{ background: '#f8fafc', padding: '16px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#0088cc', textTransform: 'uppercase' }}>2. Connect Chat target</h4>
                                  <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 800 }}>✓ Bot Online</span>
                                </div>
                                <ol style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '16px', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                                  <li style={{ marginBottom: '4px' }}>Add your bot <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>@{telegramStatus.config?.bot_username || 'your_bot_username'}</span> to your chat or group.</li>
                                  <li style={{ marginBottom: '4px' }}>Get your chat ID (e.g. forward any message to <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" style={{ color: '#0088cc' }}>@userinfobot</a>).</li>
                                  <li>Enter chat parameters below:</li>
                                </ol>
                                <div className="input-group" style={{ marginBottom: '8px' }}>
                                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>TELEGRAM CHAT ID</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. 5625755071 or -1001234567"
                                    value={telegramNewChatId}
                                    onChange={e => setTelegramNewChatId(e.target.value)}
                                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                  />
                                </div>
                                <div className="input-group" style={{ marginBottom: '12px' }}>
                                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>CHAT NAME / LABEL</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. My Personal Chat or Dev Group"
                                    value={telegramNewChatTitle}
                                    onChange={e => setTelegramNewChatTitle(e.target.value)}
                                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                  />
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!telegramNewChatId.trim() || !telegramNewChatTitle.trim()) return alert('Please fill in Chat ID and Name');
                                      setIsSavingTelegramChat(true);
                                      try {
                                        await axios.post(`${API_URL}/api/telegram/chats`, { chatId: telegramNewChatId.trim(), chatTitle: telegramNewChatTitle.trim() });
                                        setTelegramNewChatId('');
                                        setTelegramNewChatTitle('');
                                        await fetchTelegramStatus();
                                      } catch (err) {
                                        alert('Failed to register chat target');
                                      } finally {
                                        setIsSavingTelegramChat(false);
                                      }
                                    }}
                                    disabled={isSavingTelegramChat}
                                    style={{ flex: 2, padding: '12px', background: '#0088cc', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                                  >
                                    {isSavingTelegramChat ? 'Adding Chat...' : 'Add Chat target'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (window.confirm('Disconnect this Telegram bot?')) {
                                        await axios.delete(`${API_URL}/api/integrations/telegram`);
                                        await fetchTelegramStatus();
                                      }
                                    }}
                                    style={{ flex: 1, padding: '12px', background: 'none', border: '1px solid #ef4444', color: '#ef4444', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                                  >
                                    Reset
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <h3 className="stage-title">Configure Telegram Message</h3>
                                  <p className="stage-desc">Write your scheduled message and select target chat.</p>
                                </div>
                                <div className="input-group">
                                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0088cc', marginBottom: '8px', display: 'block' }}>TARGET CHAT</label>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <select
                                      value={selectedTelegramChat}
                                      onChange={e => setSelectedTelegramChat(e.target.value)}
                                      style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', borderRadius: '0px', background: 'white', fontSize: '1rem' }}
                                    >
                                      {(telegramStatus.config?.chats || []).map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => setShowTelegramAddChat(!showTelegramAddChat)}
                                      style={{ padding: '10px 14px', background: 'white', border: '1px solid var(--border)', color: '#0088cc', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                      {showTelegramAddChat ? '✕' : '+ Chat'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (window.confirm('Disconnect this bot?')) {
                                          await axios.delete(`${API_URL}/api/integrations/telegram`);
                                          await fetchTelegramStatus();
                                        }
                                      }}
                                      style={{ padding: '10px 14px', background: 'white', border: '1px solid #ef4444', color: '#ef4444', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                      Reset
                                    </button>
                                  </div>
                                </div>

                                {showTelegramAddChat && (
                                  <div style={{ background: '#f8fafc', padding: '12px', border: '1px solid var(--border)', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <input
                                      type="text"
                                      placeholder="Chat ID (e.g. 5625755071)"
                                      value={telegramNewChatId}
                                      onChange={e => setTelegramNewChatId(e.target.value)}
                                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                                    />
                                    <input
                                      type="text"
                                      placeholder="Friendly Name (e.g. My Personal Chat)"
                                      value={telegramNewChatTitle}
                                      onChange={e => setTelegramNewChatTitle(e.target.value)}
                                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (!telegramNewChatId.trim() || !telegramNewChatTitle.trim()) return alert('Please enter ID and label');
                                        try {
                                          await axios.post(`${API_URL}/api/telegram/chats`, { chatId: telegramNewChatId.trim(), chatTitle: telegramNewChatTitle.trim() });
                                          setTelegramNewChatId('');
                                          setTelegramNewChatTitle('');
                                          setShowTelegramAddChat(false);
                                          await fetchTelegramStatus();
                                        } catch (err) {
                                          alert('Failed to register chat target');
                                        }
                                      }}
                                      style={{ padding: '8px', background: '#0088cc', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                                    >
                                      Save Chat
                                    </button>
                                  </div>
                                )}

                                <div className="input-group">
                                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0088cc', marginBottom: '8px', display: 'block' }}>MESSAGE</label>
                                  <textarea
                                    placeholder="Write your telegram message here..."
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    rows={4}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '0px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none', resize: 'vertical' }}
                                    required
                                  />
                                </div>
                              </>
                            )}
                          </>
                        ) : channel === 'instagram' ? (
                          <>
                            {instagramStatus.status !== 'connected' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0', textAlign: 'center' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #e1306c, #f77737)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <InstagramIcon size={28} color="white" />
                                </div>
                                <div>
                                  <h3 style={{ fontWeight: 800, fontSize: '1rem', margin: '0 0 6px 0' }}>Connect Instagram First</h3>
                                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>You need a Business or Creator account to schedule posts.</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => { setShowMobileForm(false); }}
                                  style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #e1306c, #f77737)', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', width: '100%' }}
                                >
                                  Go to Instagram Settings
                                </button>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <h3 className="stage-title">Post Content</h3>
                                  <p className="stage-desc">Add your image URL(s) and caption.</p>
                                </div>
                                <div className="input-group">
                                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e1306c', marginBottom: '8px', display: 'block' }}>IMAGE URL(S)</label>
                                  <textarea
                                    placeholder="Paste image URL(s), one per line. Up to 10 for a carousel."
                                    value={igMobileForm.image_urls_raw}
                                    onChange={e => setIgMobileForm(p => ({ ...p, image_urls_raw: e.target.value }))}
                                    rows={3}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '0px', border: '1px solid var(--border)', fontSize: '0.88rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                                  />
                                </div>
                                <div className="input-group">
                                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e1306c', marginBottom: '8px', display: 'block' }}>CAPTION</label>
                                  <textarea
                                    placeholder="Write your caption with hashtags..."
                                    value={igMobileForm.caption}
                                    onChange={e => setIgMobileForm(p => ({ ...p, caption: e.target.value }))}
                                    rows={4}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '0px', border: '1px solid var(--border)', fontSize: '0.88rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                                  />
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <div>
                              <h3 className="stage-title">Who are we messaging?</h3>
                              <p className="stage-desc">Enter a phone number or select a contact.</p>
                            </div>

                            <div className="input-group">
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{
                                  padding: '12px 16px',
                                  background: 'white',
                                  borderRadius: '0px',
                                  border: '1px solid var(--border)',
                                  fontSize: '1rem',
                                  fontWeight: 800,
                                  color: 'var(--primary-dark)',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}>+91</div>
                                <input
                                  type="text"
                                  placeholder="Enter phone number..."
                                  value={formData.phone}
                                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                  style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: '0px',
                                    border: '1px solid var(--border)',
                                    fontSize: '1rem',
                                    outline: 'none'
                                  }}
                                />
                              </div>
                            </div>

                            <div style={{ marginTop: '10px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Recent Contacts</label>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {Object.entries(contacts).slice(0, 5).map(([id, name]) => {
                                  const displayName = getContactName(id);
                                  const hasSavedName = !isPlaceholderContactName(name, id);
                                  return (
                                    <button
                                      key={id}
                                      onClick={() => setFormData({ ...formData, phone: id })}
                                      style={{
                                        padding: '12px 16px',
                                        background: 'white',
                                        borderRadius: '0px',
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                      }}
                                    >
                                      <div style={{ width: '32px', height: '32px', borderRadius: '0px', background: 'var(--primary-light)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                                        {hasSavedName ? displayName[0].toUpperCase() : '#'}
                                      </div>
                                      <span style={{ fontWeight: 600 }}>{displayName}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}

                    {formStep === 2 && (
                      <motion.div
                        key="step2"
                        className="wizard-stage"
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                      >
                        {channel === 'calendar' ? (
                          <>
                            <div>
                              <h3 className="stage-title">Meeting Settings</h3>
                              <p className="stage-desc">Configure meeting details, platform, and date.</p>
                            </div>
                            <div className="input-group">
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1a73e8', marginBottom: '6px', display: 'block' }}>MEETING TITLE</label>
                              <input
                                type="text"
                                placeholder="e.g. 30-Min Strategy Call"
                                value={meetingTitle}
                                onChange={e => setMeetingTitle(e.target.value)}
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '0px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none' }}
                              />
                            </div>
                            <div className="input-group">
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1a73e8', marginBottom: '6px', display: 'block' }}>PLATFORM</label>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '10px' }}>
                                <button
                                  type="button"
                                  onClick={() => setMeetingPlatform('google_meet')}
                                  style={{
                                    padding: '10px 12px',
                                    border: meetingPlatform === 'google_meet' ? '1px solid #1a73e8' : '1px solid var(--border)',
                                    borderRadius: '0px',
                                    background: meetingPlatform === 'google_meet' ? '#e8f0fe' : 'white',
                                    color: meetingPlatform === 'google_meet' ? '#1a73e8' : 'var(--text-main)',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Google Meet
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setMeetingPlatform('custom')}
                                  style={{
                                    padding: '10px 12px',
                                    border: meetingPlatform === 'custom' ? '1px solid #1a73e8' : '1px solid var(--border)',
                                    borderRadius: '0px',
                                    background: meetingPlatform === 'custom' ? '#e8f0fe' : 'white',
                                    color: meetingPlatform === 'custom' ? '#1a73e8' : 'var(--text-main)',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Custom Link
                                </button>
                              </div>
                              {meetingPlatform === 'custom' && (
                                <input
                                  type="url"
                                  placeholder="i have a meeting link"
                                  value={formData.customLink || ''}
                                  onChange={e => setFormData({ ...formData, customLink: e.target.value })}
                                  style={{ width: '100%', padding: '12px 16px', borderRadius: '0px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none' }}
                                />
                              )}
                            </div>
                            <div className="input-group">
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1a73e8', marginBottom: '6px', display: 'block' }}>PICK DATE & TIME</label>
                              <DatePicker
                                selected={scheduledDate}
                                onChange={(date) => setScheduledDate(date)}
                                showTimeSelect
                                timeFormat={is24Hour ? "HH:mm" : "h:mm aa"}
                                timeIntervals={15}
                                timeCaption="Time"
                                dateFormat={is24Hour ? "MMMM d, yyyy HH:mm" : "MMMM d, yyyy h:mm aa"}
                                customInput={<CustomDateInput />}
                                minDate={new Date()}
                              />
                            </div>
                            <div className="input-group">
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1a73e8', marginBottom: '6px', display: 'block' }}>DURATION (MINUTES)</label>
                              <select
                                value={meetingDuration}
                                onChange={e => setMeetingDuration(parseInt(e.target.value))}
                                style={{ width: '100%', padding: '14px', borderRadius: '0px', border: '1px solid var(--border)', background: 'white', fontSize: '1rem' }}
                              >
                                <option value={15}>15 Minutes</option>
                                <option value={30}>30 Minutes</option>
                                <option value={45}>45 Minutes</option>
                                <option value={60}>60 Minutes</option>
                              </select>
                            </div>
                          </>
                        ) : channel === 'instagram' ? (
                          <>
                            <div>
                              <h3 className="stage-title">When should it go out?</h3>
                              <p className="stage-desc">Pick a date and time for your post.</p>
                            </div>
                            <div className="input-group">
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e1306c', marginBottom: '8px', display: 'block' }}>PICK DATE & TIME</label>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input
                                  type="date"
                                  value={igMobileDate ? (() => {
                                    const d = new Date(igMobileDate);
                                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                  })() : ''}
                                  min={(() => {
                                    const t = new Date();
                                    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
                                  })()}
                                  onChange={e => {
                                    const [y, m, d] = e.target.value.split('-');
                                    const prev = igMobileDate ? new Date(igMobileDate) : new Date();
                                    prev.setFullYear(Number(y), Number(m) - 1, Number(d));
                                    setIgMobileDate(new Date(prev));
                                  }}
                                  style={{ width: '100%', padding: '14px', borderRadius: '0px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                                />
                                <input
                                  type="time"
                                  value={igMobileDate ? (() => {
                                    const d = new Date(igMobileDate);
                                    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                  })() : ''}
                                  onChange={e => {
                                    const [h, min] = e.target.value.split(':');
                                    const prev = igMobileDate ? new Date(igMobileDate) : new Date();
                                    prev.setHours(Number(h), Number(min), 0, 0);
                                    setIgMobileDate(new Date(prev));
                                  }}
                                  style={{ width: '100%', padding: '14px', borderRadius: '0px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <h3 className="stage-title">When should it go out?</h3>
                              <p className="stage-desc">Pick a date and time for your schedule.</p>
                            </div>

                            <div className="input-group">
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: channel === 'reminders' ? '#f59e0b' : (channel === 'email' ? '#ea4335' : 'var(--primary-dark)'), marginBottom: '8px', display: 'block' }}>
                                {channel === 'reminders' ? 'REMINDER DATE & TIME' : 'PICK DATE & TIME'}
                              </label>
                              {channel === 'reminders' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <input
                                    type="date"
                                    value={reminderForm.scheduled_at ? (() => {
                                      const d = new Date(reminderForm.scheduled_at);
                                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                    })() : ''}
                                    min={(() => {
                                      const t = new Date();
                                      return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
                                    })()}
                                    onChange={e => {
                                      const [y, m, d] = e.target.value.split('-');
                                      const prev = reminderForm.scheduled_at ? new Date(reminderForm.scheduled_at) : new Date();
                                      prev.setFullYear(Number(y), Number(m) - 1, Number(d));
                                      setReminderForm({ ...reminderForm, scheduled_at: new Date(prev) });
                                    }}
                                    style={{ width: '100%', padding: '14px', borderRadius: '0px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                                  />
                                  <input
                                    type="time"
                                    value={reminderForm.scheduled_at ? (() => {
                                      const d = new Date(reminderForm.scheduled_at);
                                      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                    })() : ''}
                                    onChange={e => {
                                      const [h, min] = e.target.value.split(':');
                                      const prev = reminderForm.scheduled_at ? new Date(reminderForm.scheduled_at) : new Date();
                                      prev.setHours(Number(h), Number(min), 0, 0);
                                      setReminderForm({ ...reminderForm, scheduled_at: new Date(prev) });
                                    }}
                                    style={{ width: '100%', padding: '14px', borderRadius: '0px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                                  />
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <input
                                    type="date"
                                    value={scheduledDate ? (() => {
                                      const d = new Date(scheduledDate);
                                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                    })() : ''}
                                    min={(() => {
                                      const t = new Date();
                                      return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
                                    })()}
                                    onChange={e => {
                                      const [y, m, d] = e.target.value.split('-');
                                      const prev = scheduledDate ? new Date(scheduledDate) : new Date();
                                      prev.setFullYear(Number(y), Number(m) - 1, Number(d));
                                      setScheduledDate(new Date(prev));
                                    }}
                                    style={{ width: '100%', padding: '14px', borderRadius: '0px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                                  />
                                  <input
                                    type="time"
                                    value={scheduledDate ? (() => {
                                      const d = new Date(scheduledDate);
                                      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                    })() : ''}
                                    onChange={e => {
                                      const [h, min] = e.target.value.split(':');
                                      const prev = scheduledDate ? new Date(scheduledDate) : new Date();
                                      prev.setHours(Number(h), Number(min), 0, 0);
                                      setScheduledDate(new Date(prev));
                                    }}
                                    style={{ width: '100%', padding: '14px', borderRadius: '0px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                                  />
                                </div>
                              )}
                            </div>

                            {channel === 'reminders' && (
                              <div className="input-group">
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', marginBottom: '8px', display: 'block' }}>REPEAT</label>
                                <select
                                  value={reminderForm.recurrence}
                                  onChange={e => setReminderForm({ ...reminderForm, recurrence: e.target.value })}
                                  style={{ width: '100%', padding: '14px', borderRadius: '0px', border: '1px solid var(--border)', background: 'white', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}
                                >
                                  <option value="none">Does not repeat</option>
                                  <option value="daily">Every day</option>
                                  <option value="weekly">Every week</option>
                                  <option value="monthly">Every month</option>
                                </select>
                              </div>
                            )}

                            {channel !== 'reminders' && (
                              <div className="input-group">
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}><Repeat size={14} /> REPEAT CYCLE</label>
                                <select
                                  value={formData.recurrence}
                                  onChange={e => setFormData({ ...formData, recurrence: e.target.value })}
                                  style={{ width: '100%', padding: '14px', borderRadius: '0px', border: '1px solid var(--border)', background: 'white', fontSize: '1rem' }}
                                >
                                  <option value="none">Does not repeat</option>
                                  <option value="daily">Daily</option>
                                  <option value="weekly">Weekly</option>
                                  <option value="monthly">Monthly</option>
                                </select>
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}

                    {formStep === 3 && (
                      <motion.div
                        key="step3"
                        className="wizard-stage"
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                      >
                        {channel === 'calendar' ? (
                          <>
                            <div>
                              <h3 className="stage-title">Invite Message Preview</h3>
                              <p className="stage-desc">Review the invitation message that will be scheduled.</p>
                            </div>
                            <div className="input-group">
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1a73e8', marginBottom: '8px', display: 'block' }}>ADDITIONAL NOTES / CUSTOM MESSAGE</label>
                              <div style={{ position: 'relative', width: '100%' }}>
                                <textarea
                                  placeholder="Type any custom meeting details..."
                                  value={formData.message}
                                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                                  style={{ width: '100%', border: '1px solid var(--border)', padding: '16px', paddingBottom: '45px', fontSize: '1rem', minHeight: '120px', outline: 'none', resize: 'none', background: 'white' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => { triggerSelection(); setActiveEmojiPicker(activeEmojiPicker === 'meeting_mobile' ? null : 'meeting_mobile'); }}
                                  style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    right: '10px',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 5
                                  }}
                                >
                                  <Smile size={18} />
                                </button>
                                {activeEmojiPicker === 'meeting_mobile' && (
                                  <EmojiPicker
                                    onSelect={insertEmoji}
                                    onClose={() => setActiveEmojiPicker(null)}
                                  />
                                )}
                              </div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '16px', border: '1px solid var(--border)', fontSize: '0.85rem', color: '#111b21', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                              <strong>Invitation Preview:</strong>
                              {"\n\n"}
                              {`You're invited to: ${meetingTitle || 'Meeting'}
Date & Time: ${format(scheduledDate, 'MMMM d, yyyy h:mm aa')}
Platform: ${meetingPlatform === 'google_meet' ? 'Google Meet' : 'Online Call'}
Join Link: [Auto-generated after scheduling]`}
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <h3 className="stage-title">{channel === 'email' ? 'The Email Body' : 'The Message'}</h3>
                              <p className="stage-desc">What do you want to say?</p>
                            </div>

                            <div className="input-group">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <p className="stage-desc" style={{ margin: 0, fontWeight: 700 }}>Craft your message</p>
                                <button
                                  type="button"
                                  onClick={() => setShowAiPrompt(!showAiPrompt)}
                                  className="gemini-ai-btn"
                                  style={{
                                    borderColor: channel === 'email' ? '#ea4335' : 'var(--primary-light)',
                                    color: channel === 'email' ? '#ea4335' : 'var(--primary-dark)'
                                  }}
                                >
                                  <Sparkles size={16} /> AI WRITE
                                </button>
                              </div>

                              <div style={{ position: 'relative', border: '1px solid var(--border)', background: 'white' }}>
                                <AnimatePresence>
                                  {showAiPrompt && (
                                    <motion.div
                                      initial={{ y: -10, opacity: 0 }}
                                      animate={{ y: 0, opacity: 1 }}
                                      exit={{ y: -10, opacity: 0 }}
                                      style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        zIndex: 10,
                                        background: 'rgba(255, 255, 255, 0.98)',
                                        backdropFilter: 'blur(10px)',
                                        borderBottom: channel === 'email' ? '1px solid #f9d5d3' : '1px solid var(--primary-light)',
                                        padding: '15px'
                                      }}
                                    >
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                                        {[
                                          { l: '✨ Improve', p: 'Improve this message' },
                                          { l: '👔 Professional', p: 'Make professional' },
                                          { l: '🏃 Shorter', p: 'Make shorter' },
                                          { l: '😊 Emojis', p: 'Add emojis' }
                                        ].map(chip => (
                                          <button
                                            key={chip.l}
                                            type="button"
                                            onClick={() => handleGenerateAiMessage(chip.p)}
                                            style={{
                                              fontSize: '0.75rem',
                                              padding: '6px 12px',
                                              background: 'white',
                                              border: '1px solid #e2e8f0',
                                              borderRadius: '0px',
                                              fontWeight: 600
                                            }}
                                          >
                                            {chip.l}
                                          </button>
                                        ))}
                                      </div>
                                      <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                          type="text"
                                          placeholder="Or type instruction..."
                                          value={aiPrompt}
                                          onChange={e => setAiPrompt(e.target.value)}
                                          style={{
                                            flex: 1,
                                            padding: '12px',
                                            borderRadius: '0px',
                                            border: '1px solid var(--border)',
                                            fontSize: '1rem',
                                            outline: 'none'
                                          }}
                                        />
                                        <button
                                          onClick={() => handleGenerateAiMessage()}
                                          disabled={isAiGenerating}
                                          className="gemini-ai-btn"
                                          style={{
                                            padding: '8px 16px !important',
                                            borderColor: channel === 'email' ? '#ea4335' : 'var(--primary-light)',
                                            color: channel === 'email' ? '#ea4335' : 'var(--primary-dark)'
                                          }}
                                        >
                                          {isAiGenerating ? '...' : 'GO'}
                                        </button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                <textarea
                                  placeholder={channel === 'email' ? "Type your email content here..." : "Type your message here, then use AI Magic to refine it..."}
                                  value={formData.message}
                                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                                  style={{
                                    width: '100%',
                                    border: 'none',
                                    padding: '16px',
                                    paddingBottom: '45px',
                                    fontSize: '1.05rem',
                                    minHeight: '180px',
                                    outline: 'none',
                                    background: 'transparent',
                                    resize: 'none'
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => { triggerSelection(); setActiveEmojiPicker(activeEmojiPicker === 'schedule_mobile' ? null : 'schedule_mobile'); }}
                                  style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    right: '10px',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 5
                                  }}
                                >
                                  <Smile size={18} />
                                </button>
                                {activeEmojiPicker === 'schedule_mobile' && (
                                  <EmojiPicker
                                    onSelect={insertEmoji}
                                    onClose={() => setActiveEmojiPicker(null)}
                                  />
                                )}
                              </div>
                            </div>

                            {channel === 'whatsapp' && (
                              <>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                  <button
                                    onClick={() => document.getElementById('wizard-media').click()}
                                    style={{
                                      flex: 1,
                                      padding: '12px',
                                      borderRadius: '0px',
                                      border: '1px solid var(--border)',
                                      background: 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '8px',
                                      fontWeight: 600
                                    }}
                                  >
                                    <ImageIcon size={18} /> {selectedFile ? 'Change Media' : 'Add Media'}
                                  </button>
                                  <input
                                    id="wizard-media"
                                    type="file"
                                    style={{ display: 'none' }}
                                    onChange={e => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        setSelectedFile(file);
                                        setFilePreview(URL.createObjectURL(file));
                                      }
                                    }}
                                  />
                                </div>

                                {filePreview && (
                                  <div style={{ position: 'relative', marginTop: '12px' }}>
                                    <img src={filePreview} alt="Preview" style={{ width: '100%', maxHeight: '100px', objectFit: 'cover', borderRadius: '0px' }} />
                                    <button
                                      onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                                      style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--text)', color: 'white', border: 'none', borderRadius: '0px', padding: '4px' }}
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Wizard Footer */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: '#f8fafc', borderTop: '1px solid var(--border)' }}>
                  {/* Credit Balance & Requirement Badge — hidden for reminders and telegram (free) */}
                  {channel !== 'reminders' && channel !== 'telegram' && (
                    <>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}>
                        <span style={{ color: 'var(--text-muted)' }}>
                          Credits Required: <span style={{ color: 'var(--primary-dark)' }}>{getEstimatedCredits()}</span>
                        </span>
                        <span style={{ color: credits.total_balance < getEstimatedCredits() ? '#ea4335' : '#2e7d32' }}>
                          Your Balance: {credits.total_balance}
                        </span>
                      </div>

                      {credits.total_balance < getEstimatedCredits() && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#ea4335',
                          fontWeight: 600,
                          textAlign: 'center',
                          background: '#fdf2f2',
                          padding: '6px',
                          border: '1px solid #f9d5d3'
                        }}>
                          ⚠️ Insufficient credits. Please recharge your account.
                        </div>
                      )}
                    </>
                  )}

                  <div className="wizard-footer" style={{ borderTop: 'none', padding: 0, marginTop: '8px' }}>
                    {formStep > 1 && (
                      <button
                        onClick={() => { triggerSelection(); setFormStep(prev => prev - 1); }}
                        className="btn-secondary"
                        style={{ flex: 1, padding: '16px', borderRadius: '0px', fontWeight: 800 }}
                      >
                        Back
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        triggerSelection();
                        if (formStep === 1) {
                          if (channel === 'reminders' && !reminderForm.title.trim()) {
                            triggerSelection();
                            alert('Please enter a reminder title');
                            return;
                          }
                          if (channel === 'whatsapp' && !formData.phone.trim()) {
                            triggerSelection();
                            alert('Please enter a phone number');
                            return;
                          }
                          if (channel === 'email' && !(formData.emailTo || '').trim()) {
                            triggerSelection();
                            alert('Please enter recipient email');
                            return;
                          }
                          if (channel === 'email' && !(formData.emailSubject || '').trim()) {
                            triggerSelection();
                            alert('Please enter subject line');
                            return;
                          }
                          if (channel === 'calendar' && !formData.phone.trim()) {
                            triggerSelection();
                            alert('Please enter recipient phone number');
                            return;
                          }
                          if (channel === 'telegram') {
                            if (telegramStatus.status !== 'connected') {
                              triggerSelection();
                              alert('Please connect your Telegram Bot first');
                              return;
                            }
                            if (!telegramStatus.config?.chats?.length) {
                              triggerSelection();
                              alert('Please add at least one chat target first');
                              return;
                            }
                            if (!formData.message.trim()) {
                              triggerSelection();
                              alert('Please write your message');
                              return;
                            }
                          }
                          if (channel === 'instagram') {
                            if (instagramStatus.status !== 'connected') {
                              triggerSelection();
                              alert('Please connect your Instagram account first');
                              return;
                            }
                            const urls = igMobileForm.image_urls_raw.split('\n').map(u => u.trim()).filter(Boolean);
                            if (!urls.length) {
                              triggerSelection();
                              alert('Please add at least one image URL');
                              return;
                            }
                          }
                          setFormStep(2);
                        } else if (formStep === 2) {
                          if (channel === 'calendar' && !meetingTitle.trim()) {
                            triggerSelection();
                            alert('Please enter meeting title');
                            return;
                          }
                          if (channel === 'reminders') {
                            if (!reminderForm.title.trim()) {
                              triggerSelection();
                              alert('Please enter a reminder title');
                              return;
                            }
                            await handleCreateReminder({ preventDefault: () => { } });
                            setShowMobileForm(false);
                            return;
                          }
                          if (channel === 'telegram') {
                            if (credits.total_balance < getEstimatedCredits()) {
                              alert('⚠️ Insufficient credits to schedule this automation.');
                              return;
                            }
                            await handleSubmit({ preventDefault: () => { } });
                            setShowMobileForm(false);
                            return;
                          }
                          if (channel === 'instagram') {
                            const urls = igMobileForm.image_urls_raw.split('\n').map(u => u.trim()).filter(Boolean);
                            if (!igMobileDate) { triggerSelection(); alert('Please pick a date and time'); return; }
                            setIgMobileLoading(true);
                            try {
                              const r = await fetch(`${API_URL}/api/instagram/posts`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ caption: igMobileForm.caption, image_urls: urls, scheduled_at: igMobileDate.toISOString() })
                              });
                              const d = await r.json();
                              if (d.error) { alert(d.error); return; }
                              if (fetchSchedules) fetchSchedules();
                              setIgMobileForm({ image_urls_raw: '', caption: '' });
                              setIgMobileDate(new Date());
                              setShowMobileForm(false);
                              setFormStep(1);
                            } catch (e) { alert(e.message); } finally { setIgMobileLoading(false); }
                            return;
                          }
                          setFormStep(3);
                        } else {
                          // Validate final step inputs
                          if (channel === 'whatsapp' && !formData.phone.trim()) {
                            triggerSelection();
                            alert('Please enter a phone number');
                            return;
                          }
                          if (channel === 'email' && (!(formData.emailTo || '').trim() || !(formData.emailSubject || '').trim())) {
                            triggerSelection();
                            alert('Please fill in email recipient and subject');
                            return;
                          }
                          if (channel === 'calendar' && !meetingTitle.trim()) {
                            triggerSelection();
                            alert('Please fill in meeting title');
                            return;
                          }
                          if (credits.total_balance < getEstimatedCredits()) {
                            alert('⚠️ Insufficient credits to schedule this automation.');
                            return;
                          }
                          await handleSubmit({ preventDefault: () => { } });
                          setShowMobileForm(false);
                        }
                      }}
                      className="btn-primary"
                      style={{
                        flex: 2,
                        padding: '16px',
                        borderRadius: '0px',
                        fontWeight: 800,
                        background: channel === 'email' ? '#ea4335' : (channel === 'calendar' ? '#1a73e8' : (channel === 'reminders' ? '#f59e0b' : (channel === 'telegram' ? '#0088cc' : (channel === 'instagram' ? '#e1306c' : 'var(--primary)')))),
                        color: 'white',
                        border: 'none',
                        opacity: credits.total_balance < getEstimatedCredits() && formStep === 3 && !['reminders', 'telegram', 'instagram'].includes(channel) ? 0.5 : 1
                      }}
                      disabled={isSubmittingReminder || igMobileLoading || (credits.total_balance < getEstimatedCredits() && formStep === 3 && !['reminders', 'telegram', 'instagram'].includes(channel))}
                    >
                      {(isSubmittingReminder || igMobileLoading)
                        ? 'Scheduling...'
                        : (['reminders', 'telegram', 'instagram'].includes(channel)
                          ? (formStep === 1 ? 'Next Step' : (channel === 'telegram' ? 'Schedule Message' : (channel === 'instagram' ? 'Schedule Post' : 'Create Reminder')))
                          : (formStep === 3 ? 'Schedule Now' : 'Next Step'))}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PAYMENT SUCCESS MODAL ────────────────────────────────────── */}
        <AnimatePresence>
          {paymentSuccessModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={() => setPaymentSuccessModal(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                onClick={e => e.stopPropagation()}
                style={{
                  background: 'white',
                  borderRadius: '0px',
                  padding: '36px 30px',
                  maxWidth: '420px',
                  width: '100%',
                  textAlign: 'center',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border)',
                  position: 'relative'
                }}
              >
                {/* Animated green check badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 220, delay: 0.1 }}
                  style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2e7d32, #4caf50)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px auto',
                    boxShadow: '0 10px 25px rgba(46, 125, 50, 0.35)'
                  }}
                >
                  <CheckCircle2 size={44} />
                </motion.div>

                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text)' }}>
                  {paymentSuccessModal.subscription ? 'Subscription Active! 🎉' : 'Payment Successful! 🎉'}
                </h3>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                  {paymentSuccessModal.subscription
                    ? <>You&apos;re now subscribed to <strong>{paymentSuccessModal.packageName}</strong>. <strong>{(paymentSuccessModal.credits || 0).toLocaleString()} credits</strong> added &amp; auto-renewed every month.</>
                    : <>Your payment was verified. <strong>{(paymentSuccessModal.credits || 0).toLocaleString()} credits</strong> have been added to your account.</>
                  }
                </p>

                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  padding: '16px 20px',
                  borderRadius: '0px',
                  marginBottom: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534' }}>Credits Added</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#15803d' }}>
                    +{(paymentSuccessModal.credits || 0).toLocaleString()}
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'var(--primary-dark)' }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { triggerSelection(); setPaymentSuccessModal(null); }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    borderRadius: '0px',
                    boxShadow: '0 4px 14px rgba(26, 115, 232, 0.25)'
                  }}
                >
                  Got It, Continue →
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cal.com Booking Modal */}
        <AnimatePresence>
          {showCalModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={() => setShowCalModal(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                onClick={e => e.stopPropagation()}
                style={{
                  background: 'white',
                  borderRadius: '0px',
                  width: '100%',
                  maxWidth: '720px',
                  height: '85vh',
                  maxHeight: '700px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: '#1a1a1a'
                }}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>Book a Free Support Call</span>
                  <button
                    onClick={() => setShowCalModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#888',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
                <iframe
                  src="https://cal.com/pranavscalendar/free-lateron-consultation?embed=true"
                  style={{ flex: 1, width: '100%', border: 'none' }}
                  title="Book a Consultation"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation Bar (Mobile) — hidden when service selector is open */}
        {isMobile && !showServiceSelector && (
          <>
            {/* Backdrop for social dropdown */}
            {showSocialDropdown && (
              <div className="bottom-nav-backdrop" onClick={() => setShowSocialDropdown(false)} />
            )}

            {/* Social Dropdown */}
            <AnimatePresence>
              {showSocialDropdown && (
                <motion.div
                  className="social-dropdown"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <button
                    className={`social-dropdown-item ${channel === 'whatsapp' ? 'active' : ''}`}
                    onClick={() => { triggerSelection(); setChannel('whatsapp'); setActiveView('scheduler'); setShowSocialDropdown(false); setShowServiceSelector(false); if (status === 'connected') { setFormStep(1); setShowMobileForm(true); } }}
                  >
                    <WhatsAppIcon size={18} color="#25D366" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    className={`social-dropdown-item ${channel === 'instagram' ? 'active' : ''}`}
                    onClick={() => { triggerSelection(); setChannel('instagram'); setActiveView('scheduler'); setShowSocialDropdown(false); setShowServiceSelector(false); if (instagramStatus.status === 'connected') { setFormStep(1); setShowMobileForm(true); } }}
                  >
                    <InstagramIcon size={18} color="#e1306c" />
                    <span>Instagram</span>
                  </button>
                  <button
                    className={`social-dropdown-item ${channel === 'telegram' ? 'active' : ''}`}
                    onClick={() => { triggerSelection(); setChannel('telegram'); setActiveView('scheduler'); setShowSocialDropdown(false); setShowServiceSelector(false); if (telegramStatus.status === 'connected') { setFormStep(1); setShowMobileForm(true); } }}
                  >
                    <TelegramIcon size={18} color="#0088cc" />
                    <span>Telegram</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Nav */}
            <nav className="bottom-nav">
              {/* Social */}
              <button
                className={`bottom-nav-item ${['whatsapp', 'instagram', 'telegram'].includes(channel) ? 'active' : ''}`}
                onClick={() => setShowSocialDropdown(prev => !prev)}
              >
                <MessageSquare size={20} />
                <span className="nav-label">{channel === 'whatsapp' ? 'WhatsApp' : channel === 'instagram' ? 'Instagram' : channel === 'telegram' ? 'Telegram' : 'Social'}</span>
              </button>

              {/* Emails */}
              <button
                className={`bottom-nav-item ${channel === 'email' ? 'active' : ''}`}
                onClick={() => { triggerSelection(); setChannel('email'); setActiveView('scheduler'); setShowServiceSelector(false); setFormStep(1); setShowMobileForm(true); }}
              >
                <Mail size={20} />
                <span className="nav-label">Emails</span>
              </button>

              {/* Plus Button */}
              <button
                className="bottom-nav-plus"
                style={{
                  background: channel === 'email' ? '#ea4335' : (channel === 'calendar' ? '#1a73e8' : (channel === 'reminders' ? '#f59e0b' : 'var(--primary)')),
                  boxShadow: channel === 'email' ? '0 4px 16px rgba(234, 67, 53, 0.4)' : (channel === 'calendar' ? '0 4px 16px rgba(26, 115, 230, 0.4)' : (channel === 'reminders' ? '0 4px 16px rgba(245, 158, 11, 0.4)' : '0 4px 16px rgba(37, 211, 102, 0.4)'))
                }}
                onClick={() => {
                  triggerSelection();
                  setFormStep(1);
                  setShowMobileForm(true);
                }}
              >
                <Plus size={28} />
              </button>

              {/* Meetings */}
              <button
                className={`bottom-nav-item ${channel === 'calendar' ? 'active' : ''}`}
                onClick={() => { triggerSelection(); setChannel('calendar'); setActiveView('scheduler'); setShowServiceSelector(false); setFormStep(1); setShowMobileForm(true); }}
              >
                <Calendar size={20} />
                <span className="nav-label">Meetings</span>
              </button>

              {/* Personal Reminders */}
              <button
                className={`bottom-nav-item ${channel === 'reminders' ? 'active' : ''}`}
                onClick={() => { triggerSelection(); setChannel('reminders'); setActiveView('scheduler'); setShowServiceSelector(false); setFormStep(1); setShowMobileForm(true); }}
              >
                <Bell size={20} />
                <span className="nav-label">Reminders</span>
              </button>
            </nav>
          </>
        )}

      </div>
    </div>
  );
}

export default Dashboard;
