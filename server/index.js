require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const {
    default: makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
    Browsers
} = require('@whiskeysockets/baileys');
const { useSupabaseAuthState } = require('./supabaseAuthState');
// Stable Pairing Flow Version - c2402ba
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const cors = require('cors');
const pino = require('pino');
const multer = require('multer');
const axios = require('axios');
const { addDays, addWeeks, addMonths, addYears } = require('date-fns');
const { sendScheduleEmail } = require('./services/emailService');
const { calculateCredits, getUserCredits, maybeRefillCredits, deductCredits, refundCredits } = require('./services/creditService');
const { normalizeWhatsAppJid, isSocketReadyForMessaging } = require('./services/whatsappScheduler');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.Razorpay_live,
    key_secret: process.env.Razorpay_secret,
});

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3001;
const GOOGLE_MEET_PENDING_TEXT = 'Google Meet link will be generated after saving';

io.on('connection', (socket) => {
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their socket room`);
        
        // Only connect if not already connected
        if (!userSockets[userId] || (userSockets[userId].ws && userSockets[userId].ws.readyState === WebSocket.CLOSED)) {
            connectToWhatsApp(userId);
        } else {
            // Already active, send current status immediately to prevent UI flicker
            const sock = userSockets[userId];
            if (sock.user) {
                const phone = jidNormalizedUser(sock.user.id).split('@')[0];
                saveWhatsAppWorkspacePhone(userId, phone);
                socket.emit('status', 'connected');
                socket.emit('user-info', { 
                    id: phone, 
                    name: sock.user.name 
                });
            } else {
                const connectionState = userConnectionStates[userId];
                if (connectionState?.status) {
                    if (connectionState.qr) socket.emit('qr', connectionState.qr);
                    socket.emit('status', connectionState.status);
                } else {
                    socket.emit('status', 'connecting');
                }
            }
        }
    });

    socket.on('request-pairing-code', async ({ userId, phone, countryCode = '91' }) => {
        if (!phone) return;
        const cleanPhone = normalizePairingPhone(phone, countryCode);

        if (!cleanPhone) {
            io.to(userId).emit('error', 'Please enter a valid phone number with country code.');
            return;
        }
        
        console.log(`[Pairing] Request for ${userId} with phone ${cleanPhone}`);
        connectToWhatsApp(userId, cleanPhone, true);
    });
});
// Local sessions removed for scalability
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    transport: WebSocket
  }
});

// Middleware to verify Supabase Token
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(403).json({ message: 'No token provided' });

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) return res.status(401).json({ message: 'Unauthorized' });
    
    req.userId = user.id;
    next();
};

// No local auth session directory needed

// Auth Routes removed as they are handled by Supabase client-side

// Map to store active sockets per user
const userSockets = {};
const userConnectionStates = {}; // Tracks 'connecting', 'qr', 'qr-scanned', 'connected', 'disconnected'
const socketConnectionStatus = {}; // Tracks actual 'open'/'close' connection event state
const connectingUsers = new Set();
const processedMessages = new Map(); // Map<userId, Set<msgId>>
const lastGroupFetch = {}; // Map<userId, timestamp>
const pendingContactHistory = new Map(); // Map<userId, { contacts, chats, receivedAt }>

function normalizePairingPhone(phone, defaultCountryCode = '91') {
    const rawPhone = String(phone || '').trim();
    const rawCountryCode = String(defaultCountryCode || '91').trim();
    const countryCode = rawCountryCode.replace(/\D/g, '') || '91';
    const userIncludedCountryCode = rawPhone.startsWith('+') || rawPhone.startsWith('00');
    let digits = rawPhone.replace(/\D/g, '');

    if (rawPhone.startsWith('00')) digits = digits.replace(/^00/, '');

    if (!userIncludedCountryCode) {
        digits = digits.replace(/^0+/, '');
        if (!digits.startsWith(countryCode)) {
            digits = `${countryCode}${digits}`;
        }
    }

    if (digits.length < 7 || digits.length > 15) return null;
    return digits;
}

function setUserConnectionState(userId, status, data = {}) {
    const previous = userConnectionStates[userId] || {};
    userConnectionStates[userId] = {
        ...previous,
        ...data,
        status,
        updatedAt: Date.now()
    };
    io.to(userId).emit('status', status);
}

async function hasSavedWhatsAppSession(userId) {
    const { data, error } = await supabaseAdmin
        .from('whatsapp_sessions')
        .select('file_id')
        .eq('user_id', userId)
        .eq('file_id', 'creds')
        .limit(1);

    if (error) {
        console.error(`[WA] Failed to check saved session for ${userId}:`, error.message);
        return false;
    }

    return (data || []).length > 0;
}

function getSocketPhone(userId) {
    const sock = userSockets[userId];
    return sock?.user?.id ? jidNormalizedUser(sock.user.id).split('@')[0] : null;
}

async function saveWhatsAppWorkspacePhone(userId, phone) {
    if (!phone) return;
    const { error } = await supabaseAdmin
        .from('whatsapp_sessions')
        .upsert({
            user_id: userId,
            file_id: 'workspace-phone',
            data: { phone }
        }, { onConflict: 'user_id,file_id' });

    if (error) console.error(`[WA] Failed to save workspace phone for ${userId}:`, error.message);
}

async function getSavedWorkspacePhone(userId) {
    const { data, error } = await supabaseAdmin
        .from('whatsapp_sessions')
        .select('data')
        .eq('user_id', userId)
        .eq('file_id', 'workspace-phone')
        .maybeSingle();

    if (error) {
        console.error(`[WA] Failed to read workspace phone for ${userId}:`, error.message);
        return null;
    }

    return data?.data?.phone || null;
}

async function getWorkspacePhone(userId) {
    return getSocketPhone(userId) || await getSavedWorkspacePhone(userId);
}

async function getWorkspaceUserIds(userId) {
    const phone = await getWorkspacePhone(userId);
    if (!phone) return [userId];

    const { data, error } = await supabaseAdmin
        .from('whatsapp_sessions')
        .select('user_id')
        .eq('file_id', 'workspace-phone')
        .contains('data', { phone });

    if (error) {
        console.error(`[WA] Failed to resolve workspace users for ${userId}:`, error.message);
        return [userId];
    }

    return [...new Set([userId, ...(data || []).map(row => row.user_id)])];
}

async function getWorkspaceSocket(userId) {
    if (userSockets[userId]) return userSockets[userId];

    const phone = await getWorkspacePhone(userId);
    if (!phone) return null;

    const ownerId = Object.keys(userSockets).find(id => getSocketPhone(id) === phone);
    return ownerId ? userSockets[ownerId] : null;
}

// Helper to clean masked names like "+91........41" or "+91********41".
function isPlaceholderContactName(name, waId = '') {
    const text = String(name ?? '').replace(/[\u200e\u200f\u202a-\u202e]/g, '').trim();
    const idDigits = String(waId ?? '').replace(/\D/g, '');

    if (!text) return true;
    if (idDigits && text.replace(/\D/g, '') === idDigits) return true;

    const compact = text.replace(/\s+/g, '');
    const maskCount = (compact.match(/[.*\u2022\u2219]/g) || []).length;

    if (/^[.*\u2022\u2219]+$/.test(compact)) return true;
    if (/^\+?\d{1,3}[.*\u2022\u2219-]+\d{1,4}$/.test(compact)) return true;
    if (compact.startsWith('+') && maskCount >= 3 && compact.replace(/\D/g, '').length <= 6) return true;

    return false;
}

function cleanName(name, waId) {
    if (isPlaceholderContactName(name, waId)) return null;
    return String(name).trim();
}

function isLikelyPhoneWaId(waId) {
    const digits = String(waId || '').replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) return false;
    if (/^0+$/.test(digits)) return false;
    return digits === String(waId || '');
}

function getPrivatePhoneWaId(jid) {
    if (!jid || (!jid.endsWith('@s.whatsapp.net') && !jid.endsWith('@c.us'))) return null;
    const waId = jid.split('@')[0];
    return isLikelyPhoneWaId(waId) ? waId : null;
}

function shouldExposeContact(contact) {
    const waId = String(contact?.wa_id || '');
    const name = cleanName(contact?.name, waId);
    return isLikelyPhoneWaId(waId) && Boolean(name);
}

async function processWhatsAppContacts(userId, sock, history = {}, { syncPhotos = false, photoLimit = 50 } = {}) {
    const newContacts = history.contacts || [];
    const chats = history.chats || [];
    const contactNames = new Map();

    for (const contact of newContacts) {
        const waId = getPrivatePhoneWaId(contact.id);
        if (!waId) continue;

        const savedName = cleanName(contact.notify || contact.name || contact.verifiedName, waId);
        if (savedName) contactNames.set(waId, savedName);
    }

    for (const chat of chats) {
        const waId = getPrivatePhoneWaId(chat.id);
        if (!waId || contactNames.has(waId)) continue;

        const chatName = cleanName(chat.name || chat.notify || chat.verifiedName, waId);
        if (chatName) contactNames.set(waId, chatName);
    }

    const contactsToUpsert = [...contactNames.entries()].map(([waId, name]) => ({
        user_id: userId,
        wa_id: waId,
        name
    }));

    if (contactsToUpsert.length > 0) {
        const { error } = await supabaseAdmin
            .from('contacts')
            .upsert(contactsToUpsert, { onConflict: 'user_id,wa_id' });
        if (error) throw error;
    }

    let photosSynced = 0;
    if (syncPhotos && sock) {
        photosSynced = await syncContactPhotos(userId, sock, photoLimit);
    }

    return { contactsSynced: contactsToUpsert.length, photosSynced };
}

async function syncContactPhotos(userId, sock, limit = 50) {
    const check = await supabaseAdmin.from('contacts').select('wa_id, profile_photo_url').limit(1);
    if (check.error) return 0;

    const { data: contacts, error } = await supabaseAdmin
        .from('contacts')
        .select('wa_id, name')
        .eq('user_id', userId)
        .is('profile_photo_url', null)
        .limit(limit);

    if (error) throw error;

    let synced = 0;
    for (const contact of contacts || []) {
        if (!shouldExposeContact(contact)) continue;

        try {
            const jid = `${contact.wa_id}@s.whatsapp.net`;
            const url = await sock.profilePictureUrl(jid, 'image');
            if (!url) continue;

            await supabaseAdmin.from('contacts')
                .update({ profile_photo_url: url })
                .eq('user_id', userId)
                .eq('wa_id', contact.wa_id);
            synced++;
        } catch (err) {
            // Missing photos and privacy-restricted contacts are expected.
        }

        await new Promise(resolve => setTimeout(resolve, 250));
    }

    return synced;
}

// Group data storage could also be moved to DB for full scalability
const getGroupFilePath = (userId) => path.join(__dirname, 'groups', `${userId}.json`);
if (!fs.existsSync(path.join(__dirname, 'groups'))) fs.mkdirSync(path.join(__dirname, 'groups'));

async function fetchGroups(userId) {
    const sock = userSockets[userId];
    if (!sock) return;
    try {
        const allGroups = await sock.groupFetchAllParticipating();
        const groups = {};
        Object.values(allGroups).forEach(group => {
            groups[group.id] = group.subject;
        });
        // Store groups in the user's auth directory
        const groupsFile = getGroupFilePath(userId);
        fs.writeFileSync(groupsFile, JSON.stringify(groups, null, 2));
        io.to(userId).emit('groups-updated', groups);
    } catch (err) {
        console.error(`[Groups] Failed for ${userId}:`, err.message);
    }
}

async function connectToWhatsApp(userId, pairingPhone = null, forceRestart = false) {
    if (connectingUsers.has(userId)) {
        if (forceRestart) {
            console.log(`[WA] Restarting in-progress connection for ${userId} in pairing-code mode.`);
            if (userSockets[userId]) {
                try { userSockets[userId].ws.close(); } catch (e) { }
                try { userSockets[userId].ev.removeAllListeners(); } catch (e) { }
            }
            delete userSockets[userId];
            connectingUsers.delete(userId);
        } else {
            console.log(`[WA] Connection for ${userId} already in progress. Skipping.`);
            return;
        }
    }
    connectingUsers.add(userId);
    setUserConnectionState(userId, 'connecting', { qr: null });

    console.log(`--- Connecting User: ${userId}${pairingPhone ? ` (Pairing: ${pairingPhone})` : ''} ---`);

    if (pairingPhone && forceRestart) {
        await supabaseAdmin.from('whatsapp_sessions').delete().eq('user_id', userId);
    }

    const { state, saveCreds } = await useSupabaseAuthState(supabaseAdmin, userId);
    const { version } = await fetchLatestBaileysVersion();

    if (userSockets[userId]) {
        try { userSockets[userId].ws.close(); } catch (e) { }
        try { userSockets[userId].ev.removeAllListeners(); } catch (e) { }
    }

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu("Chrome"),
        countryCode: "IN",
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 15000,
    });

    userSockets[userId] = sock;

    let pairingCodeRequested = false;
    let newLoginDetected = false;

    sock.ev.on('creds.update', saveCreds);

    const isCurrentSocket = () => userSockets[userId] === sock;

    const requestPairingCodeOnce = async () => {
        if (!isCurrentSocket() || !pairingPhone || sock.authState.creds.registered || pairingCodeRequested) return;

        pairingCodeRequested = true;
        try {
            const code = await sock.requestPairingCode(pairingPhone);
            if (!isCurrentSocket()) return;
            console.log(`[Pairing] Code generated for ${userId}: ${code}`);
            io.to(userId).emit('pairing-code', { code, phone: pairingPhone });
        } catch (err) {
            if (!isCurrentSocket()) return;
            pairingCodeRequested = false;
            console.error(`[Pairing] Failed for ${userId}:`, err.message);
            io.to(userId).emit('error', 'Failed to generate pairing code. Please try again.');
        }
    };

    sock.ev.on('connection.update', async (update) => {
        if (!isCurrentSocket()) return;
        const { connection, lastDisconnect, qr } = update;
        
        // Track the actual connection status from the 'connection' event
        if (connection === 'open') {
            socketConnectionStatus[userId] = 'open';
        } else if (connection === 'close') {
            socketConnectionStatus[userId] = 'close';
        }
        
        if (qr) {
            if (pairingPhone) {
                await requestPairingCodeOnce();
            } else if (!pairingPhone) {
                const url = await qrcode.toDataURL(qr);
                io.to(userId).emit('qr', url);
                setUserConnectionState(userId, 'qr', { qr: url });
            }
        }

        // Baileys emits isNewLogin on pair-success, before the socket reaches "open".
        // That is the earliest reliable signal that the phone scanned/accepted the QR.
        if (!qr && !connection && update.isNewLogin) {
            newLoginDetected = true;
            console.log(`[WA] QR scanned by ${userId} - waiting for open...`);
            setUserConnectionState(userId, 'qr-scanned', { qr: null });
        }

        if (update.receivedPendingNotifications) {
            // Keep showing qr-scanned/syncing state rather than reverting
            const currentStatus = userSockets[userId]?.user ? 'connected' : 'syncing';
            setUserConnectionState(userId, currentStatus, { qr: null });
        }

        if (connection === 'close') {
            connectingUsers.delete(userId);
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            if (statusCode === DisconnectReason.loggedOut) {
                console.log(`[WA] User ${userId} logged out. Clearing all session data...`);
                await supabaseAdmin.from('whatsapp_sessions').delete().eq('user_id', userId);
                setUserConnectionState(userId, 'disconnected', { qr: null });
            } else if (shouldReconnect) {
                console.log(`[WA] Connection closed for ${userId}. Reconnecting in 5s...`);
                setUserConnectionState(userId, 'connecting', { qr: null });
                setTimeout(() => {
                    if (userSockets[userId] === sock) connectToWhatsApp(userId);
                }, 5000);
            }
        } else if (connection === 'open') {
            connectingUsers.delete(userId);
            
            // Emit qr-scanned first if it wasn't already (new login path)
            if (newLoginDetected) {
                setUserConnectionState(userId, 'qr-scanned', { qr: null });
            }
            
            let photo = null;
            try {
                photo = await sock.profilePictureUrl(sock.user.id, 'image');
            } catch (e) {}

            const connectedPhone = jidNormalizedUser(sock.user.id).split('@')[0];
            await saveWhatsAppWorkspacePhone(userId, connectedPhone);

            // Small delay lets the qr-scanned animation play before switching to connected
            const loginDelay = newLoginDetected ? 1200 : 0;
            setTimeout(() => {
                if (!isCurrentSocket()) return;
                setUserConnectionState(userId, 'connected', { qr: null });
                io.to(userId).emit('user-info', { 
                    id: connectedPhone, 
                    name: sock.user.name,
                    photo: photo
                });
            }, loginDelay);
            
            // Debounced fetch groups to avoid rate-limiting
            const now = Date.now();
            if (!lastGroupFetch[userId] || now - lastGroupFetch[userId] > 300000) {
                lastGroupFetch[userId] = now;
                fetchGroups(userId);
            }

        }
    });

    sock.ev.on('messaging-history.set', async ({ contacts: newContacts, chats }) => {
        try {
            console.log(`[WA] messaging-history.set received: ${newContacts?.length || 0} contacts, ${chats?.length || 0} chats`);
            pendingContactHistory.set(userId, {
                contacts: newContacts || [],
                chats: chats || [],
                receivedAt: Date.now()
            });
            io.to(userId).emit('contacts-sync-ready');
        } catch (err) {
            console.error('[WA] messaging-history.set error:', err.message, err.stack);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        if (!processedMessages.has(userId)) processedMessages.set(userId, new Set());
        const userProcessed = processedMessages.get(userId);

        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;
            if (userProcessed.has(msg.key.id)) continue;
            userProcessed.add(msg.key.id);

            const jid = msg.key.remoteJid;
            const waId = getPrivatePhoneWaId(jid);
            
            // Deep text extraction helper
            const extractText = (m) => {
                if (!m) return '';
                if (m.conversation) return m.conversation;
                if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
                if (m.imageMessage?.caption) return m.imageMessage.caption;
                if (m.videoMessage?.caption) return m.videoMessage.caption;
                
                // Recursively check common wrappers
                const wrapped = m.ephemeralMessage?.message || m.viewOnceMessage?.message || m.viewOnceMessageV2?.message || m.documentWithCaptionMessage?.message;
                if (wrapped) return extractText(wrapped);
                
                return '';
            };

            const text = extractText(msg.message).toLowerCase().trim();
            console.log(`[Incoming] From: ${waId || jid}, Text: "${text}"`);

            // 1. Update contact tracking and LID linking
            try {
                const isPrivateChat = Boolean(waId);
                
                if (isPrivateChat) {
                    // Update contact record
                    try {
                        const cleanedName = cleanName(msg.pushName, waId);
                        const contactUpdate = { 
                            user_id: userId,
                            wa_id: waId,
                            last_incoming_at: new Date().toISOString(),
                            last_message_text: text 
                        };
                        if (cleanedName) contactUpdate.name = cleanedName;

                        await supabaseAdmin.from('contacts').upsert(contactUpdate, { onConflict: 'user_id,wa_id' });
                    } catch (err) {
                        console.error(`[Incoming] Contact tracking error:`, err.message);
                    }

                    // LID linking for active drip campaigns
                    const { data: activeEnrolls } = await supabaseAdmin
                        .from('drip_enrollments')
                        .select('id, contact_id')
                        .eq('user_id', userId)
                        .eq('status', 'active');

                    if (activeEnrolls) {
                        for (const enroll of activeEnrolls) {
                            const enrollPhone = enroll.contact_id.split('@')[0];
                            const senderLast10 = waId.slice(-10);
                            const enrollLast10 = enrollPhone.slice(-10);
                            
                            if (!enroll.contact_id.includes('@') && senderLast10 === enrollLast10) {
                                console.log(`[Drip Engine] Linking enrollment ${enroll.id}: ${enrollPhone} → ${jid}`);
                                await supabaseAdmin.from('drip_enrollments').update({ contact_id: jid }).eq('id', enroll.id);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`[Incoming] Processing error:`, err.message);
            }

            // 2. Handle Auto-Replies (OPTIONAL)
            try {
                const { data: replies } = await supabaseAdmin
                    .from('auto_replies')
                    .select('*')
                    .eq('user_id', userId);
                
                if (replies) {
                    const match = replies.find(r => r.keyword.toLowerCase().trim() === text);
                    if (match) {
                        await sock.sendMessage(jid, { text: match.reply });
                    } else {
                        // AI Assistant: Check for special '*' keyword
                        const aiConfig = replies.find(r => r.keyword === '*');
                        if (aiConfig && aiConfig.reply) {
                            console.log(`[AI Assistant] Triggered for: "${text}"`);
                            try {
                                const aiResponse = await generateAiReply(text, aiConfig.reply);
                                if (aiResponse) {
                                    await sock.sendMessage(jid, { text: aiResponse });
                                }
                            } catch (aiErr) {
                                console.error(`[AI Assistant] Generation failed:`, aiErr.message);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`[Auto-Reply] Error:`, err.message);
            }

            // --- AUTO-ENROLLMENT LOGIC ---
            console.log(`[Auto-Enroll] Fetching sequences for user ${userId}...`);
            const { data: triggerSeqs, error: seqError } = await supabaseAdmin
                .from('drip_sequences')
                .select('*')
                .eq('user_id', userId)
                .neq('trigger_type', 'manual');

            if (seqError) {
                console.error(`[Auto-Enroll] DATABASE ERROR:`, seqError.message);
                if (seqError.message.includes('rate')) {
                    console.error(`[Auto-Enroll] CRITICAL: You are being rate-limited by Supabase. Please wait a few minutes.`);
                }
            }
            
            if (waId && triggerSeqs && triggerSeqs.length > 0) {
                console.log(`[Auto-Enroll] Found ${triggerSeqs.length} sequences. Checking match for "${text}"...`);
                for (const seq of triggerSeqs) {
                    const cleanTrigger = (seq.trigger_value || '').toLowerCase().trim();
                    console.log(`[Auto-Enroll] Comparing "${text}" against sequence "${seq.name}" (Trigger: "${cleanTrigger}")`);
                    
                    let shouldEnroll = false;
                    if (seq.trigger_type === 'keyword' && text.includes(cleanTrigger) && cleanTrigger.length > 0) {
                        console.log(`[Auto-Enroll] MATCH FOUND! Triggering sequence...`);
                        shouldEnroll = true;
                    } else if (seq.trigger_type === 'new_contact') {
                        shouldEnroll = true; 
                    }

                    if (shouldEnroll) {
                        console.log(`[Auto-Enroll] Checking if ${waId} is already enrolled...`);
                        const { data: existing, error: existErr } = await supabaseAdmin
                            .from('drip_enrollments')
                            .select('id')
                            .eq('sequence_id', seq.id)
                            .or(`contact_id.eq.${waId},contact_id.eq.${jid}`)
                            .maybeSingle();
                        
                        if (existErr) console.error(`[Auto-Enroll] Existing check error:`, existErr.message);
                        console.log(`[Auto-Enroll] Already enrolled: ${!!existing}`);

                                if (!existing) {
                                    try {
                                        console.log(`[Auto-Enroll] Enrolling ${jid} into ${seq.name}`);
                                        const { data: enrollment, error: enrollError } = await supabaseAdmin.from('drip_enrollments').insert({
                                            user_id: userId,
                                            sequence_id: seq.id,
                                            contact_id: jid,
                                            current_step_index: -1, // Engine will pick up step 0
                                            last_sent_at: new Date().toISOString(),
                                            status: 'active'
                                        }).select().single();

                                        if (enrollError) throw new Error(`Enrollment failed: ${enrollError.message}`);
                                        
                                        // The background engine will now pick this up within 30 seconds
                                        console.log(`[Auto-Enroll] SUCCESS: Enrolled ${jid} into ${seq.name}`);
                                    } catch (err) {
                                        console.error(`[Auto-Enroll] CRITICAL ERROR:`, err.message);
                                    }
                                }
                    }
                }
            }

        }
    });

    sock.ev.on('messages.update', async (updates) => {
        for (const update of updates) {
            const { key, update: msgUpdate } = update;
            if (!key.fromMe || !msgUpdate.status) continue;
            let newStatus = null;
            if (msgUpdate.status === 3 || msgUpdate.status === 4) {
                newStatus = 'read';
            } else if (msgUpdate.status === 2) {
                newStatus = 'delivered';
            }

            if (newStatus) {
                await supabaseAdmin
                    .from('schedules')
                    .update({ status: newStatus })
                    .eq('wa_message_id', key.id);
            }
        }
    });
    sock.ev.on('message-receipt.update', async (updates) => {
        for (const update of updates) {
            const { key, receipt } = update;
            let newStatus = receipt.type === 'read' ? 'read' : 'delivered';
            
            await supabaseAdmin
                .from('schedules')
                .update({ status: newStatus })
                .eq('wa_message_id', key.id);
        }
    });
}

// Integration Endpoints (Resend, Google Calendar, etc.)
app.get('/api/integrations', verifyToken, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('user_integrations')
        .select('*')
        .eq('user_id', req.userId);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
});

app.post('/api/integrations', verifyToken, async (req, res) => {
    const { provider, emailAddress, apiKey } = req.body;
    if (!provider) return res.status(400).json({ error: 'Provider is required' });

    const { data, error } = await supabaseAdmin
        .from('user_integrations')
        .upsert({
            user_id: req.userId,
            provider,
            email_address: emailAddress,
            api_key: apiKey,
            status: 'connected'
        }, { onConflict: 'user_id,provider' })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.delete('/api/integrations/:provider', verifyToken, async (req, res) => {
    const { error } = await supabaseAdmin
        .from('user_integrations')
        .delete()
        .eq('user_id', req.userId)
        .eq('provider', req.params.provider);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// Google OAuth Flow Endpoints
app.get('/api/auth/google', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).send('userId is required');

    // Build redirection URI dynamically based on request host
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email openid')}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${userId}`;

    res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
    const { code, state: userId } = req.query;
    if (!code || !userId) return res.status(400).send('Missing code or userId');

    const host = req.headers['x-forwarded-host'] || req.get('host');
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    try {
        // Exchange auth code for tokens
        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        });

        const { access_token, refresh_token } = tokenRes.data;

        // Fetch user profile email
        const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const emailAddress = userRes.data.email;

        // Fetch existing integration details to preserve refresh token if re-authorizing
        const { data: existingIntegration } = await supabaseAdmin
            .from('user_integrations')
            .select('refresh_token')
            .eq('user_id', userId)
            .eq('provider', 'gmail_oauth')
            .maybeSingle();

        const tokenToSave = refresh_token || (existingIntegration ? existingIntegration.refresh_token : null);

        // Upsert Google connection details
        const { error } = await supabaseAdmin
            .from('user_integrations')
            .upsert({
                user_id: userId,
                provider: 'gmail_oauth',
                email_address: emailAddress,
                refresh_token: tokenToSave,
                status: 'connected'
            }, { onConflict: 'user_id,provider' });

        if (error) throw error;

        // Redirect back to frontend dashboard
        res.redirect(`${protocol}://${host}/`);
    } catch (err) {
        console.error('[Google OAuth Callback Error]:', err.response?.data || err.message);
        const detailedError = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        res.status(500).send(`Failed to authenticate with Google: ${err.message}. Details: ${detailedError}`);
    }
});

// Public Health Check
// Reusable AI Generation Helper
async function generateAiReply(userMessage, context) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-001",
            messages: [
                {
                    role: "system",
                    content: `You are a helpful business assistant for a WhatsApp account. Use the following context to answer the user's question. \n\nCONTEXT:\n${context}\n\nINSTRUCTIONS:\n- Be concise and friendly.\n- Use WhatsApp formatting (*bold*).\n- If you don't know the answer based on the context, politely say you'll have a human get back to them.\n- DO NOT invent facts.`
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://lateron.indiecode.in',
                'X-Title': 'LaterOn AI Assistant'
            }
        });

        return response.data.choices[0].message.content;
    } catch (err) {
        console.error('[AI Helper] Error:', err.message);
        return null;
    }
}

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// AI Message Generation (OpenRouter)
app.post('/api/ai/generate', async (req, res) => {
    const { prompt, context } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'OpenRouter API key is not configured on the server.' });
    }

    try {
        const messages = [
            {
                role: "system",
                content: "You are a professional WhatsApp message assistant. Your goal is to write highly engaging and readable messages. \n\nCRITICAL INSTRUCTIONS:\n1. ONLY RETURN THE MESSAGE CONTENT. Do not include any introductory text, filler, or conclusions like 'Here is your message' or 'Okay, here is...'. Start the response immediately with the message text.\n2. Use WhatsApp formatting: Use *bold* for important terms or headers. Use _italics_ for subtle emphasis.\n3. Structure: Use proper line breaks and spacing. Never return a single block of text.\n4. Personality: Use relevant emojis to make it professional and engaging."
            }
        ];

        if (context) {
            messages.push({
                role: "user",
                content: `CURRENT MESSAGE: "${context}"\n\nINSTRUCTION: ${prompt || 'Improve this message, fix grammar, and make it sound more professional while keeping it friendly.'}`
            });
        } else {
            messages.push({
                role: "user",
                content: prompt
            });
        }

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-001",
            messages: messages,
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://lateron.indiecode.in',
                'X-Title': 'LaterOn WhatsApp Automation',
                'Content-Type': 'application/json'
            }
        });

        const generatedText = response.data.choices[0].message.content;
        res.json({ text: generatedText });
    } catch (error) {
        console.error('OpenRouter AI Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to generate message with AI.' });
    }
});

// API Endpoints
app.post('/api/logout', verifyToken, async (req, res) => {
    const { userId } = req;
    const sock = userSockets[userId];
    if (sock) {
        try {
            await sock.logout();
        } catch (err) {
            console.error(`[WA] Logout failed for ${userId}:`, err.message);
        }
        delete userSockets[userId];
    }
    connectingUsers.delete(userId);
    setUserConnectionState(userId, 'disconnected', { qr: null });
    await supabaseAdmin.from('whatsapp_sessions').delete().eq('user_id', userId);
    res.json({ success: true });
});

app.get('/api/contacts', verifyToken, async (req, res) => {
    const { userId } = req;
    try {
        // Try selecting with profile_photo_url first
        let { data, error } = await supabaseAdmin
            .from('contacts')
            .select('wa_id, name, profile_photo_url')
            .eq('user_id', userId);
        
        // If it fails with a 400 (likely column doesn't exist), fallback to basic select
        if (error && error.code === 'PGRST204' || (error && error.message && error.message.includes('profile_photo_url'))) {
            const fallback = await supabaseAdmin
                .from('contacts')
                .select('wa_id, name')
                .eq('user_id', userId);
            data = fallback.data;
            error = fallback.error;
        }

        if (error) throw error;
        
        const contactsMap = {};
        (data || []).forEach(c => {
            if (!shouldExposeContact(c)) return;
            contactsMap[c.wa_id] = {
                name: cleanName(c.name, c.wa_id) || c.wa_id,
                photo: c.profile_photo_url
            };
        });
        res.json(contactsMap);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/profile-photo/:jid', verifyToken, async (req, res) => {
    const { userId } = req;
    const { jid } = req.params;
    const sock = userSockets[userId];
    if (!sock) return res.status(404).json({ error: 'WhatsApp not connected' });

    try {
        const fullJid = jid.includes('@') ? jid : `${jid}@s.whatsapp.net`;
        const url = await sock.profilePictureUrl(fullJid, 'image');
        
        // Optionally cache it in DB, handle if column doesn't exist
        try {
            await supabaseAdmin.from('contacts')
                .update({ profile_photo_url: url })
                .eq('user_id', userId)
                .eq('wa_id', jid.split('@')[0]);
        } catch (e) {
            console.error('Failed to update profile photo in DB:', e.message);
        }

        res.json({ url });
    } catch (err) {
        res.json({ url: null });
    }
});

app.post('/api/contacts/sync', verifyToken, async (req, res) => {
    const { userId } = req;
    const sock = userSockets[userId];
    if (!sock) return res.status(404).json({ error: 'WhatsApp not connected' });

    try {
        const history = pendingContactHistory.get(userId);
        const historyResult = history
            ? await processWhatsAppContacts(userId, sock, history, { syncPhotos: false })
            : { contactsSynced: 0, photosSynced: 0 };

        const photosSynced = await syncContactPhotos(userId, sock, 75);

        const { data: existingContacts } = await supabaseAdmin
            .from('contacts')
            .select('wa_id, name')
            .eq('user_id', userId);

        const invalidIds = (existingContacts || [])
            .filter(contact => !shouldExposeContact(contact))
            .map(contact => contact.wa_id);

        if (invalidIds.length > 0) {
            await supabaseAdmin
                .from('contacts')
                .delete()
                .eq('user_id', userId)
                .in('wa_id', invalidIds);
        }

        io.to(userId).emit('contacts-updated');
        res.json({
            success: true,
            contactsSynced: historyResult.contactsSynced,
            photosSynced,
            removedInvalid: invalidIds.length,
            hasFreshHistory: Boolean(history)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/contacts/sync-photos', verifyToken, async (req, res) => {
    const { userId } = req;
    const sock = userSockets[userId];
    if (!sock) return res.status(404).json({ error: 'WhatsApp not connected' });

    try {
        const photosSynced = await syncContactPhotos(userId, sock, 75);
        io.to(userId).emit('contacts-updated');
        res.json({ success: true, synced: photosSynced });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/groups', verifyToken, async (req, res) => {
    const { userId } = req;
    const groupsFile = getGroupFilePath(userId);
    
    if (fs.existsSync(groupsFile)) {
        const groups = JSON.parse(fs.readFileSync(groupsFile));
        res.json(groups);
    } else {
        res.json({});
    }
});

app.get('/api/schedules', verifyToken, async (req, res) => {
    const workspaceUserIds = await getWorkspaceUserIds(req.userId);
    const { data, error } = await supabaseAdmin
        .from('schedules')
        .select('*')
        .in('user_id', workspaceUserIds)
        .order('scheduled_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
});

async function hasGoogleIntegration(userId, supabaseAdmin) {
    const { data } = await supabaseAdmin
        .from('user_integrations')
        .select('refresh_token')
        .eq('user_id', userId)
        .eq('provider', 'gmail_oauth')
        .maybeSingle();
    return !!(data && data.refresh_token);
}

function getGoogleMeetLinkFromEvent(event) {
    if (event?.hangoutLink) return event.hangoutLink;

    const videoEntryPoint = event?.conferenceData?.entryPoints?.find(point => point.entryPointType === 'video' && point.uri);
    return videoEntryPoint?.uri || null;
}

function getGoogleApiErrorMessage(err) {
    const apiError = err.response?.data?.error;
    if (apiError?.message) return apiError.message;
    if (err.response?.data?.error_description) return err.response.data.error_description;
    return err.message;
}

function injectGoogleMeetLink(message, realMeetLink) {
    const text = String(message || '');
    if (!text) return `Join Link: ${realMeetLink}`;

    if (text.includes(GOOGLE_MEET_PENDING_TEXT)) {
        return text.replaceAll(GOOGLE_MEET_PENDING_TEXT, realMeetLink);
    }

    if (/https?:\/\/meet\.google\.com\/[a-z-]+/i.test(text)) {
        return text.replace(/https?:\/\/meet\.google\.com\/[a-z-]+/gi, realMeetLink);
    }

    return `${text}\nJoin Link: ${realMeetLink}`;
}

// Helper to create Google Calendar Event with Google Meet
async function createGoogleMeetEvent(userId, { title, startTimeStr, durationMinutes, attendeeEmail, description }) {
    try {
        const { data: integration, error: intError } = await supabaseAdmin
            .from('user_integrations')
            .select('*')
            .eq('user_id', userId)
            .eq('provider', 'gmail_oauth')
            .maybeSingle();

        if (intError || !integration || !integration.refresh_token) {
            throw new Error('Google Calendar is not connected. Reconnect Google from Email Settings and allow Calendar access.');
        }

        // Exchange refresh token for new access token
        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: integration.refresh_token,
            grant_type: 'refresh_token'
        });

        const accessToken = tokenRes.data.access_token;

        const startTime = new Date(startTimeStr);
        const endTime = new Date(startTime.getTime() + (durationMinutes || 30) * 60 * 1000);
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

        const eventPayload = {
            summary: title,
            description: description || 'Meeting scheduled via LaterOn',
            start: {
                dateTime: startTime.toISOString(),
                timeZone: timezone
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: timezone
            },
            conferenceData: {
                createRequest: {
                    requestId: `lateron-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            }
        };

        if (attendeeEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeEmail)) {
            eventPayload.attendees = [{ email: attendeeEmail }];
        }

        const calendarRes = await axios.post(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?${new URLSearchParams({
                conferenceDataVersion: '1',
                sendUpdates: attendeeEmail ? 'all' : 'none'
            }).toString()}`,
            eventPayload,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        let calendarEvent = calendarRes.data;
        let meetLink = getGoogleMeetLinkFromEvent(calendarEvent);

        for (let attempt = 0; !meetLink && attempt < 10; attempt++) {
            const status = calendarEvent?.conferenceData?.createRequest?.status?.statusCode;
            if (status === 'failure') {
                throw new Error('Google Calendar created the event, but Google Meet conference creation failed.');
            }

            await new Promise(resolve => setTimeout(resolve, 800));

            const eventRes = await axios.get(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(calendarEvent.id)}?conferenceDataVersion=1`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            calendarEvent = eventRes.data;
            meetLink = getGoogleMeetLinkFromEvent(calendarEvent);
        }

        if (!meetLink) {
            throw new Error('Google Meet link is still pending. Please try creating the meeting again.');
        }

        return {
            meetingUrl: meetLink,
            calendarEventId: calendarEvent.id,
            calendarHtmlLink: calendarEvent.htmlLink
        };
    } catch (err) {
        console.error('[Google Meet API Error]:', err.response?.data || err.message);
        throw new Error(getGoogleApiErrorMessage(err));
    }
}

// GET /api/credits — return user credit balance and recent transactions
app.get('/api/credits', verifyToken, async (req, res) => {
    const { userId } = req;
    try {
        const { data: credits, error: credErr } = await getUserCredits(supabaseAdmin, userId);
        if (credErr) return res.status(500).json({ error: credErr.message });

        // Check for monthly refill
        await maybeRefillCredits(supabaseAdmin, userId, credits);

        const { data: transactions } = await supabaseAdmin
            .from('credit_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        res.json({
            free_balance: credits.free_balance,
            purchased_balance: credits.purchased_balance,
            total_balance: credits.free_balance + credits.purchased_balance,
            next_refill_date: credits.next_refill_date,
            transactions: transactions || []
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/schedules', verifyToken, async (req, res) => {
    const { userId } = req;
    let { phone, phones, message, scheduledAt, recurrence, mediaUrl, mediaType, isVoiceNote, channel, emailTo, emailSubject, metadata, usedAi } = req.body;
    emailTo = emailTo || req.body.email_to || null;
    emailSubject = emailSubject || req.body.email_subject || null;
    metadata = metadata || {};

    // --- CREDIT CHECK ---
    const creditsRequired = calculateCredits({ mediaUrl: mediaUrl || null, usedAi: !!usedAi });
    const { data: creditRecord, error: creditFetchErr } = await getUserCredits(supabaseAdmin, userId);
    if (creditFetchErr) return res.status(500).json({ error: 'Could not verify credit balance.' });
    await maybeRefillCredits(supabaseAdmin, userId, creditRecord);
    const totalBalance = creditRecord.free_balance + creditRecord.purchased_balance;
    if (totalBalance < creditsRequired) {
        return res.status(402).json({
            error: 'insufficient_credits',
            message: `You need ${creditsRequired} credits to schedule this, but you only have ${totalBalance}.`,
            credits_required: creditsRequired,
            credits_available: totalBalance
        });
    }

    // Handle Google Meet automatic event creation
    if (channel === 'calendar' && metadata?.platform === 'google_meet') {
        const title = metadata.title || 'Meeting';
        const duration = Number(metadata.duration) || 30;
        const isConnected = await hasGoogleIntegration(userId, supabaseAdmin);

        if (isConnected && !metadata.calendarEventId) {
            try {
                const meetEvent = await createGoogleMeetEvent(userId, {
                    title,
                    startTimeStr: scheduledAt,
                    durationMinutes: duration,
                    attendeeEmail: emailTo,
                    description: message
                });

                metadata.meetingUrl = meetEvent.meetingUrl;
                metadata.calendarEventId = meetEvent.calendarEventId;
                metadata.calendarHtmlLink = meetEvent.calendarHtmlLink;
                message = injectGoogleMeetLink(message, meetEvent.meetingUrl);
            } catch (err) {
                return res.status(400).json({
                    error: `Could not create Google Meet link: ${err.message}`
                });
            }
        } else {
            const existingMeetLink = String(metadata.meetingUrl || '').trim();
            if (existingMeetLink && (existingMeetLink.startsWith('https://meet.google.com/') || existingMeetLink.startsWith('https://zoom.us/') || existingMeetLink.startsWith('http'))) {
                message = injectGoogleMeetLink(message, existingMeetLink);
            }
        }
    }

    const phoneList = phones || [phone];
    const newSchedules = phoneList.map(p => ({
        user_id: userId,
        phone: p || emailTo || '',
        message,
        scheduled_at: scheduledAt,
        recurrence: recurrence || 'none',
        status: 'pending',
        media_url: mediaUrl,
        media_type: mediaType,
        channel: channel || 'whatsapp',
        email_to: emailTo || null,
        email_subject: emailSubject || null,
        metadata,
        credits_charged: creditsRequired
    }));

    const { data, error } = await supabaseAdmin
        .from('schedules')
        .insert(newSchedules)
        .select();

    if (error) return res.status(500).json({ error: error.message });

    // --- DEDUCT CREDITS (after successful schedule insert) ---
    const scheduleIds = data.map(s => s.id).join(', ');
    const channelLabel = channel === 'email' ? 'Email' : channel === 'calendar' ? 'Meeting' : 'WhatsApp';
    await deductCredits(
        supabaseAdmin,
        userId,
        creditsRequired,
        `Scheduled ${channelLabel} message${mediaUrl ? ' with attachment' : ''}${usedAi ? ' + AI' : ''}`,
        data[0]?.id || null
    );

    checkAndSendMessages();
    res.json(data);
});

app.put('/api/schedules/:id', verifyToken, async (req, res) => {
    const workspaceUserIds = await getWorkspaceUserIds(req.userId);
    const { id } = req.params;
    const { phone, scheduledAt, recurrence, mediaUrl, mediaType, status, channel } = req.body;
    let { message, emailTo, emailSubject, metadata } = req.body;
    emailTo = emailTo || req.body.email_to || null;
    emailSubject = emailSubject || req.body.email_subject || null;
    metadata = metadata || {};

    if (channel === 'calendar' && metadata?.platform === 'google_meet') {
        const isConnected = await hasGoogleIntegration(req.userId, supabaseAdmin);

        if (isConnected && !metadata.calendarEventId) {
            try {
                const meetEvent = await createGoogleMeetEvent(req.userId, {
                    title: metadata.title || 'Meeting',
                    startTimeStr: scheduledAt,
                    durationMinutes: Number(metadata.duration) || 30,
                    attendeeEmail: emailTo,
                    description: message
                });
                metadata.meetingUrl = meetEvent.meetingUrl;
                metadata.calendarEventId = meetEvent.calendarEventId;
                metadata.calendarHtmlLink = meetEvent.calendarHtmlLink;
                message = injectGoogleMeetLink(message, meetEvent.meetingUrl);
            } catch (err) {
                return res.status(400).json({
                    error: `Could not create Google Meet link: ${err.message}`
                });
            }
        } else {
            const existingMeetLink = String(metadata.meetingUrl || '').trim();
            if (existingMeetLink && (existingMeetLink.startsWith('https://meet.google.com/') || existingMeetLink.startsWith('https://zoom.us/') || existingMeetLink.startsWith('http'))) {
                message = injectGoogleMeetLink(message, existingMeetLink);
            }
        }
    }

    const { data, error } = await supabaseAdmin
        .from('schedules')
        .update({
            phone,
            message,
            scheduled_at: scheduledAt,
            recurrence,
            media_url: mediaUrl || null,
            media_type: mediaType || null,
            status: status || 'pending',
            channel: channel || 'whatsapp',
            email_to: emailTo || null,
            email_subject: emailSubject || null,
            metadata
        })
        .eq('id', id)
        .in('user_id', workspaceUserIds)
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.patch('/api/schedules/:id', verifyToken, async (req, res) => {
    const workspaceUserIds = await getWorkspaceUserIds(req.userId);
    const { id } = req.params;
    const update = {};

    if (req.body.scheduledAt !== undefined) update.scheduled_at = req.body.scheduledAt;
    if (req.body.status !== undefined) update.status = req.body.status;

    const { data, error } = await supabaseAdmin
        .from('schedules')
        .update(update)
        .eq('id', id)
        .in('user_id', workspaceUserIds)
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.delete('/api/schedules/history', verifyToken, async (req, res) => {
    const workspaceUserIds = await getWorkspaceUserIds(req.userId);
    const { error } = await supabaseAdmin
        .from('schedules')
        .delete()
        .neq('status', 'pending')
        .in('user_id', workspaceUserIds);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.delete('/api/schedules/:id', verifyToken, async (req, res) => {
    const workspaceUserIds = await getWorkspaceUserIds(req.userId);
    const { id } = req.params;
    const { error } = await supabaseAdmin
        .from('schedules')
        .delete()
        .eq('id', id)
        .in('user_id', workspaceUserIds);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.post('/api/bulk/retry-failed', verifyToken, async (req, res) => {
    const workspaceUserIds = await getWorkspaceUserIds(req.userId);
    const { error } = await supabaseAdmin
        .from('schedules')
        .update({ status: 'pending', scheduled_at: new Date().toISOString() })
        .eq('status', 'failed')
        .in('user_id', workspaceUserIds);

    if (error) return res.status(500).json({ error: error.message });
    checkAndSendMessages();
    res.json({ success: true });
});

// Drip Campaign Endpoints
app.get('/api/drip/sequences', verifyToken, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('drip_sequences')
        .select('*, steps:drip_steps(*)')
        .eq('user_id', req.userId)
        .order('created_at', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/drip/sequences', verifyToken, async (req, res) => {
    const { name, trigger, triggerValue, steps } = req.body;
    
    // Create sequence
    const { data: sequence, error: seqError } = await supabaseAdmin
        .from('drip_sequences')
        .insert({ 
            user_id: req.userId, 
            name,
            trigger_type: trigger || 'manual',
            trigger_value: triggerValue
        })
        .select()
        .single();
    
    if (seqError) return res.status(500).json({ error: seqError.message });

    // Create steps
    const stepsToInsert = steps.map((step, index) => ({
        sequence_id: sequence.id,
        message: step.message,
        delay_days: step.delay,
        condition: step.condition || 'none',
        condition_value: step.conditionValue,
        step_order: index
    }));

    const { error: stepsError } = await supabaseAdmin
        .from('drip_steps')
        .insert(stepsToInsert);
    
    if (stepsError) return res.status(500).json({ error: stepsError.message });

    res.json(sequence);
});

app.put('/api/drip/sequences/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { name, trigger, triggerValue, steps } = req.body;

    // Update sequence
    const { error: seqError } = await supabaseAdmin
        .from('drip_sequences')
        .update({ 
            name, 
            trigger_type: trigger, 
            trigger_value: triggerValue 
        })
        .eq('id', id)
        .eq('user_id', req.userId);

    if (seqError) return res.status(500).json({ error: seqError.message });

    // Delete old steps
    await supabaseAdmin.from('drip_steps').delete().eq('sequence_id', id);

    // Insert new steps
    const stepsToInsert = steps.map((step, index) => ({
        sequence_id: id,
        message: step.message,
        delay_days: step.delay,
        condition: step.condition || 'none',
        condition_value: step.conditionValue,
        step_order: index
    }));

    const { error: stepsError } = await supabaseAdmin
        .from('drip_steps')
        .insert(stepsToInsert);

    if (stepsError) return res.status(500).json({ error: stepsError.message });

    res.json({ success: true });
});

app.delete('/api/drip/sequences/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { error } = await supabaseAdmin
        .from('drip_sequences')
        .delete()
        .eq('id', id)
        .eq('user_id', req.userId);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.post('/api/drip/enroll', verifyToken, async (req, res) => {
    const { sequenceId, phone } = req.body;
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if sequence exists
    const { data: steps, error: stepsError } = await supabaseAdmin
        .from('drip_steps')
        .select('*')
        .eq('sequence_id', sequenceId)
        .order('step_order', { ascending: true });

    if (stepsError || !steps.length) return res.status(400).json({ error: 'Sequence not found or has no steps' });

    // Cancel ALL previous active enrollments for this sequence (regardless of contact_id format)
    // This prevents duplicates from previous test runs or format mismatches
    const { data: cancelled, error: cancelErr } = await supabaseAdmin
        .from('drip_enrollments')
        .update({ status: 'cancelled' })
        .eq('user_id', req.userId)
        .eq('sequence_id', sequenceId)
        .eq('status', 'active')
        .select('id');

    if (cancelled && cancelled.length > 0) {
        console.log(`[Enroll] Cancelled ${cancelled.length} stale enrollment(s) for sequence ${sequenceId} before re-enrolling ${cleanPhone}`);
    }

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabaseAdmin
        .from('drip_enrollments')
        .insert({
            user_id: req.userId,
            sequence_id: sequenceId,
            contact_id: cleanPhone,
            current_step_index: -1,
            status: 'active',
            last_sent_at: new Date().toISOString()
        })
        .select()
        .single();

    if (enrollError) return res.status(500).json({ error: enrollError.message });

    // Trigger processDripCampaigns immediately for better UX
    processDripCampaigns();

    res.json(enrollment);
});


app.get('/api/status', verifyToken, async (req, res) => {
    const sock = userSockets[req.userId];
    const connectionState = userConnectionStates[req.userId];
    const isOpen = socketConnectionStatus[req.userId] === 'open';
    let status = sock
        ? (sock.user && isOpen ? 'connected' : (connectionState?.status || 'connecting'))
        : 'disconnected';

    if (!sock && connectingUsers.has(req.userId)) {
        status = 'connecting';
    } else if (!sock && await hasSavedWhatsAppSession(req.userId)) {
        status = 'connecting';
        connectToWhatsApp(req.userId);
    }

    let userInfo = null;
    if (sock && sock.user) {
        let photo = null;
        try {
            photo = await sock.profilePictureUrl(sock.user.id, 'image');
        } catch (e) {}
        const phone = jidNormalizedUser(sock.user.id).split('@')[0];
        await saveWhatsAppWorkspacePhone(req.userId, phone);
        
        userInfo = { 
            name: sock.user.name, 
            id: phone,
            photo: photo
        };
    }
    res.json({
        status,
        qr: status === 'qr' ? connectionState?.qr || null : null,
        userInfo
    });
});

function getNextOccurrence(date, recurrence) {
    let nextDate = new Date(date);
    const now = new Date();

    const increment = (d) => {
        if (recurrence === 'daily') return addDays(d, 1);
        if (recurrence === 'weekly') return addWeeks(d, 1);
        if (recurrence === 'monthly') return addMonths(d, 1);
        if (recurrence === 'yearly') return addYears(d, 1);
        
        if (recurrence.startsWith('custom:')) {
            const days = recurrence.split(':')[1].split(',').map(Number);
            if (days.length === 0) return null;
            let checkDate = new Date(d);
            for (let i = 1; i <= 7; i++) {
                checkDate.setDate(checkDate.getDate() + 1);
                if (days.includes(checkDate.getDay())) return checkDate;
            }
        }
        return null;
    };

    // Keep incrementing until we find a date in the future
    while (nextDate <= now) {
        const next = increment(nextDate);
        if (!next || next <= nextDate) break; // Prevent infinite loops
        nextDate = next;
    }

    return nextDate > now ? nextDate.toISOString() : null;
}

// Headless session restore — called by scheduler when no live socket exists.
// Returns the ready socket, or null if session data is missing / restore times out.
const sessionRestoreInProgress = new Set();
async function ensureSocketReady(userId, timeoutMs = 18000) {
    // Already in memory and authenticated?
    const existing = await getWorkspaceSocket(userId);
    if (existing && existing.user) return existing;

    // Avoid duplicate restores running concurrently for the same user.
    if (sessionRestoreInProgress.has(userId)) {
        // Wait out the timeout for the other call to finish.
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            await new Promise(r => setTimeout(r, 500));
            const s = await getWorkspaceSocket(userId);
            if (s && s.user) return s;
        }
        return null;
    }

    // Only attempt restore if saved creds exist.
    const hasCreds = await hasSavedWhatsAppSession(userId);
    if (!hasCreds) return null;

    console.log(`[Scheduler] No live socket for ${userId} — restoring session headlessly…`);
    sessionRestoreInProgress.add(userId);
    try {
        connectToWhatsApp(userId); // non-blocking, mutates userSockets when ready

        // Poll until connected or timeout.
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            await new Promise(r => setTimeout(r, 600));
            const s = await getWorkspaceSocket(userId);
            if (s && s.user) {
                console.log(`[Scheduler] Headless session ready for ${userId}`);
                return s;
            }
        }
        console.warn(`[Scheduler] Headless restore timed out for ${userId}`);
        return null;
    } finally {
        sessionRestoreInProgress.delete(userId);
    }
}

async function checkAndSendMessages() {
    const now = new Date().toISOString();
    
    const { data: pendingSchedules, error } = await supabaseAdmin
        .from('schedules')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', now);

    if (error || !pendingSchedules) return;

    for (const schedule of pendingSchedules) {
        const userId = schedule.user_id;

        // Email channel handling
        if (schedule.channel === 'email') {
            try {
                const { data: user } = await supabaseAdmin
                    .from('users')
                    .select('*')
                    .eq('id', schedule.user_id)
                    .single();

                await sendScheduleEmail(schedule, user || {}, supabaseAdmin);

                await supabaseAdmin
                    .from('schedules')
                    .update({ status: 'sent' })
                    .eq('id', schedule.id);

                console.log(`[Email Sent] Schedule #${schedule.id} delivered to ${schedule.email_to}`);
            } catch (err) {
                console.error(`[Email Failed] Schedule #${schedule.id}:`, err.message);
                await supabaseAdmin
                    .from('schedules')
                    .update({ status: 'failed' })
                    .eq('id', schedule.id);
                // Refund credits for failed delivery
                if (schedule.credits_charged > 0) {
                    await refundCredits(supabaseAdmin, schedule.user_id, schedule.credits_charged, schedule.id);
                    console.log(`[Credits] Refunded ${schedule.credits_charged} credits to user ${schedule.user_id} for failed email #${schedule.id}`);
                }
            }
            continue;
        }

        const sock = await ensureSocketReady(userId);

        if (!isSocketReadyForMessaging(sock, socketConnectionStatus[userId])) {
            console.log(`[Scheduler] WhatsApp socket is not ready for ${userId} — skipping schedule ${schedule.id} this tick.`);
            continue;
        }

        const jid = normalizeWhatsAppJid(schedule.phone);
        if (!jid) {
            console.warn(`[Scheduler] Invalid recipient for schedule ${schedule.id}: ${schedule.phone}`);
            await supabaseAdmin
                .from('schedules')
                .update({ status: 'failed' })
                .eq('id', schedule.id);
            continue;
        }

        try {
            let sentMsg;
            if (schedule.media_url) {
                const mediaContent = { url: schedule.media_url };
                const options = { caption: schedule.message };

                if (schedule.media_type.startsWith('image/')) {
                    sentMsg = await sock.sendMessage(jid, { image: mediaContent, ...options });
                } else if (schedule.media_type.startsWith('video/')) {
                    sentMsg = await sock.sendMessage(jid, { video: mediaContent, ...options });
                } else if (schedule.media_type.startsWith('audio/')) {
                    sentMsg = await sock.sendMessage(jid, {
                        audio: mediaContent,
                        mimetype: schedule.media_type,
                        ptt: schedule.media_type.includes('audio/ogg') // or based on metadata
                    });
                } else {
                    sentMsg = await sock.sendMessage(jid, {
                        document: mediaContent,
                        mimetype: schedule.media_type,
                        fileName: path.basename(schedule.media_url),
                        caption: schedule.message
                    });
                }
            } else {
                sentMsg = await sock.sendMessage(jid, { text: schedule.message });
            }

            // Update status to sent
            await supabaseAdmin
                .from('schedules')
                .update({ 
                    status: 'sent', 
                    wa_message_id: sentMsg.key.id 
                })
                .eq('id', schedule.id);

            // Handle Recurrence
            if (schedule.recurrence && schedule.recurrence !== 'none') {
                const nextDate = getNextOccurrence(schedule.scheduled_at, schedule.recurrence);
                if (nextDate) {
                    await supabaseAdmin.from('schedules').insert({
                        ...schedule,
                        id: undefined, // Let Supabase generate new UUID
                        scheduled_at: nextDate,
                        status: 'pending',
                        wa_message_id: null,
                        created_at: new Date().toISOString()
                    });
                }
            }
        } catch (error) {
            console.error(`[Scheduler] Failed for ${schedule.id}:`, error.message);
            await supabaseAdmin
                .from('schedules')
                .update({ status: 'failed' })
                .eq('id', schedule.id);
            // Refund credits for failed delivery
            if (schedule.credits_charged > 0) {
                await refundCredits(supabaseAdmin, schedule.user_id, schedule.credits_charged, schedule.id);
                console.log(`[Credits] Refunded ${schedule.credits_charged} credits to user ${schedule.user_id} for failed WA #${schedule.id}`);
            }
        }
    }

    // Emit once after processing all messages for a user
    const processedUserIds = new Set();
    for (const schedule of pendingSchedules) {
        // We only consider it processed if it didn't hit the 'continue' for missing socket
        const userId = schedule.user_id;
        const sock = await getWorkspaceSocket(userId);
        if (sock && sock.user) {
            processedUserIds.add(userId);
        }
    }

    for (const userId of processedUserIds) {
        io.to(userId).emit('schedules-updated');
        const workspaceUserIds = await getWorkspaceUserIds(userId);
        workspaceUserIds.forEach(workspaceUserId => io.to(workspaceUserId).emit('schedules-updated'));
    }
}

let isDripProcessing = false;

async function processDripCampaigns() {
    if (isDripProcessing) {
        console.log('[Drip Engine] Already running, skipping concurrent call.');
        return;
    }
    isDripProcessing = true;
    try {
    const { data: enrollments, error } = await supabaseAdmin
        .from('drip_enrollments')
        .select('*, sequence:drip_sequences(*)')
        .eq('status', 'active');

    if (error || !enrollments) return;

    for (const enrollment of enrollments) {
        const { data: steps } = await supabaseAdmin
            .from('drip_steps')
            .select('*')
            .eq('sequence_id', enrollment.sequence_id)
            .order('step_order', { ascending: true });

        if (!steps || steps.length <= enrollment.current_step_index + 1) {
            // Sequence completed
            await supabaseAdmin.from('drip_enrollments').update({ status: 'completed' }).eq('id', enrollment.id);
            continue;
        }

        const nextStep = steps[enrollment.current_step_index + 1];
        const lastSent = new Date(enrollment.last_sent_at);
        const now = new Date();
        
        // Check if delay has passed
        const diffDays = (now - lastSent) / (1000 * 60 * 60 * 24);
        if (diffDays < nextStep.delay_days) continue;

        // Shortcut: if condition is 'none', skip contact lookup
        let hasReplied = null;
        if (nextStep.condition !== 'none') {
            const contactWaId = enrollment.contact_id.split('@')[0];
            const { data: contact } = await supabaseAdmin
                .from('contacts')
                .select('last_incoming_at, last_message_text')
                .eq('user_id', enrollment.user_id)
                .eq('wa_id', contactWaId)
                .single();
            
            hasReplied = contact && contact.last_incoming_at && new Date(contact.last_incoming_at) >= lastSent;
        }

        console.log(`[Drip Engine] Checking Enrollment ${enrollment.id} (Contact: ${enrollment.contact_id})`);
        console.log(`[Drip Engine] Next Step: ${enrollment.current_step_index + 1}, Condition: ${nextStep.condition}, Has Replied: ${hasReplied}, diffDays: ${diffDays.toFixed(4)}`);

        if (nextStep.condition === 'no-reply' && hasReplied) {
            console.log(`[Drip Engine] Stopping sequence for ${enrollment.contact_id} due to reply.`);
            await supabaseAdmin.from('drip_enrollments').update({ status: 'stopped_by_reply' }).eq('id', enrollment.id);
            continue;
        }

        if (nextStep.condition === 'replied' && !hasReplied) {
            console.log(`[Drip Engine] Waiting for reply from ${enrollment.contact_id}...`);
            continue;
        }

        if (nextStep.condition === 'contains') {
            if (!hasReplied) {
                console.log(`[Drip Engine] Waiting for reply with keyword from ${enrollment.contact_id}...`);
                continue;
            }
            const { data: contactForKeyword } = await supabaseAdmin
                .from('contacts')
                .select('last_message_text')
                .eq('user_id', enrollment.user_id)
                .eq('wa_id', enrollment.contact_id.split('@')[0])
                .single();
            const keywords = (nextStep.condition_value || '').toLowerCase().split(',').map(k => k.trim()).filter(k => k);
            const lastText = (contactForKeyword?.last_message_text || '').toLowerCase().trim();
            
            const found = keywords.some(k => lastText.includes(k));
            if (!found) {
                console.log(`[Drip Engine] Keyword match failed for ${enrollment.contact_id}. Text: "${lastText}"`);
                continue;
            }
        }

        // Send the message
        const sock = userSockets[enrollment.user_id];
        if (sock) {
            console.log(`[Drip Engine] Found socket for ${enrollment.user_id}. Proceeding...`);
            try {
                const rawId = enrollment.contact_id.split('@')[0];
                let jid;
                if (enrollment.contact_id.includes('@')) {
                    jid = enrollment.contact_id; // already has @lid or @s.whatsapp.net
                } else if (/^\d{13,}$/.test(rawId)) {
                    // Very long numeric IDs are LIDs
                    jid = `${rawId}@lid`;
                } else {
                    jid = `${rawId}@s.whatsapp.net`;
                }
                console.log(`[Drip Engine] Sending message to ${jid}`);
                await sock.sendMessage(jid, { text: nextStep.message });

                // Update enrollment
                await supabaseAdmin
                    .from('drip_enrollments')
                    .update({
                        current_step_index: enrollment.current_step_index + 1,
                        last_sent_at: new Date().toISOString()
                    })
                    .eq('id', enrollment.id);
            } catch (err) {
                console.error(`[Drip Engine] Failed:`, err.message);
            }
        } else {
            console.log(`[Drip Engine] No socket found for ${enrollment.user_id}`);
        }
    }
    } finally {
        isDripProcessing = false;
    }
}

// Global background tasks
cron.schedule('*/10 * * * * *', checkAndSendMessages);
cron.schedule('*/30 * * * * *', processDripCampaigns); // Every 30 seconds for snappier drip triggers


// ── Razorpay: Create Order ───────────────────────────────────────────────────
app.post('/api/credits/order', async (req, res) => {
    const { amount, credits, packageName } = req.body; // amount in paise
    if (!amount || !credits) return res.status(400).json({ error: 'amount and credits required' });
    try {
        const order = await razorpay.orders.create({
            amount: amount, // already in paise from client
            currency: 'INR',
            receipt: `credits_${Date.now()}`,
            notes: { credits, packageName }
        });
        res.json({ orderId: order.id, amount: order.amount, currency: order.currency, key: process.env.Razorpay_live });
    } catch (err) {
        console.error('[Razorpay] order creation failed:', err);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
});

// ── Razorpay: Verify Payment & Credit Account ─────────────────────────────────
app.post('/api/credits/verify', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, credits, packageName } = req.body;

    // Verify HMAC signature
    const expectedSig = crypto
        .createHmac('sha256', process.env.Razorpay_secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (expectedSig !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    try {
        // Decode user from Supabase JWT
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

        const userId = user.id;
        const creditsToAdd = parseInt(credits, 10);

        // Add purchased credits (never expire)
        const { data: existing } = await supabase
            .from('user_credits')
            .select('purchased_balance')
            .eq('user_id', userId)
            .single();

        if (existing) {
            await supabase
                .from('user_credits')
                .update({ purchased_balance: existing.purchased_balance + creditsToAdd })
                .eq('user_id', userId);
        } else {
            await supabase
                .from('user_credits')
                .insert({ user_id: userId, purchased_balance: creditsToAdd });
        }

        // Log transaction
        await supabase.from('credit_transactions').insert({
            user_id: userId,
            type: 'purchase',
            amount: creditsToAdd,
            description: `Purchased ${packageName} pack (${creditsToAdd} credits) — ${razorpay_payment_id}`
        });

        res.json({ success: true, credits_added: creditsToAdd });
    } catch (err) {
        console.error('[Razorpay] verify error:', err);
        res.status(500).json({ error: 'Credit update failed' });
    }
});

// Serve Frontend
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));

    // Explicit APK download — must come BEFORE the SPA catch-all so the
    // wildcard `app.get(/.*/)` doesn't intercept binary downloads.
    const apkPublicPath = path.join(__dirname, '../client/public/LaterOn.apk');
    app.get('/LaterOn.apk', (req, res) => {
        if (fs.existsSync(apkPublicPath)) {
            res.setHeader('Content-Type', 'application/vnd.android.package-archive');
            res.setHeader('Content-Disposition', 'attachment; filename="LaterOn.apk"');
            res.sendFile(apkPublicPath);
        } else {
            res.status(404).send('APK not found');
        }
    });

    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Graceful shutdown — ensures nodemon restarts don't cause EADDRINUSE
const shutdown = () => {
    server.close(() => {
        console.log('[Server] Closed gracefully.');
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 3000); // Force exit if close hangs
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
