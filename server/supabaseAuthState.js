const { proto } = require('@whiskeysockets/baileys');
const { Curve, signedKeyPair } = require('@whiskeysockets/baileys/lib/Utils/crypto');
const { randomBytes } = require('crypto');

/**
 * Custom Auth State for Baileys using Supabase
 */
// Global in-memory cache to avoid redundant Supabase network requests during E2EE key reads
const sessionCaches = new Map();

function getSessionCache(userId) {
    if (!sessionCaches.has(userId)) {
        sessionCaches.set(userId, new Map());
    }
    return sessionCaches.get(userId);
}

/**
 * Custom Auth State for Baileys using Supabase
 */
// Global in-memory cache maps to track the aggregated auth state packages
const packageCaches = new Map();
const packageSaveTimeouts = new Map();

/**
 * Custom Auth State for Baileys using Supabase
 */
const useSupabaseAuthState = async (supabase, userId) => {
    // Load or initialize the in-memory cache for this user
    if (!packageCaches.has(userId)) {
        packageCaches.set(userId, new Map());
    }
    const cache = packageCaches.get(userId);

    // Initial load: fetch the consolidated package from Supabase
    let packageLoaded = cache.size > 0;
    if (!packageLoaded) {
        try {
            const { data, error } = await supabase
                .from('whatsapp_sessions')
                .select('data')
                .eq('user_id', userId)
                .eq('file_id', 'auth-state-package')
                .maybeSingle();

            if (!error && data && data.data) {
                const parsed = JSON.parse(JSON.stringify(data.data), BufferJSON.reviver);
                for (const [k, v] of Object.entries(parsed)) {
                    cache.set(k, v);
                }
                packageLoaded = true;
                console.log(`[Auth] Loaded consolidated auth-state-package for ${userId} (${cache.size} keys)`);
            }
        } catch (err) {
            console.error('[Auth] Failed to load consolidated auth state:', err.message);
        }

        // Fallback: If no consolidated package exists, load any existing individual rows (legacy migration)
        if (!packageLoaded) {
            try {
                const { data, error } = await supabase
                    .from('whatsapp_sessions')
                    .select('file_id, data')
                    .eq('user_id', userId)
                    .neq('file_id', 'workspace-phone');

                if (!error && data && data.length > 0) {
                    data.forEach(row => {
                        const parsed = JSON.parse(JSON.stringify(row.data), BufferJSON.reviver);
                        cache.set(row.file_id, parsed);
                    });
                    console.log(`[Auth] Migrated ${data.length} legacy session rows to memory for ${userId}`);
                }
            } catch (err) {
                console.error('[Auth] Legacy migration error:', err.message);
            }
        }
    }

    // Debounced function to persist the package back to Supabase
    const scheduleSave = () => {
        if (packageSaveTimeouts.has(userId)) {
            clearTimeout(packageSaveTimeouts.get(userId));
        }

        const timeout = setTimeout(async () => {
            packageSaveTimeouts.delete(userId);
            try {
                const packageObj = {};
                for (const [k, v] of cache.entries()) {
                    // Do not save temporary workspace metadata or creds in the package (creds are saved separately)
                    if (k !== 'creds' && k !== 'workspace-phone') {
                        packageObj[k] = v;
                    }
                }

                await supabase
                    .from('whatsapp_sessions')
                    .upsert({
                        user_id: userId,
                        file_id: 'auth-state-package',
                        data: JSON.parse(JSON.stringify(packageObj, BufferJSON.replacer))
                    }, { onConflict: 'user_id,file_id' });
            } catch (err) {
                console.error('[Auth] Failed to auto-save consolidated package:', err.message);
            }
        }, 1500); // 1.5 second debounce

        packageSaveTimeouts.set(userId, timeout);
    };

    const writeData = async (data, fileId) => {
        cache.set(fileId, data);
        
        // Critical: write 'creds' immediately since they track login/credentials
        if (fileId === 'creds') {
            try {
                await supabase
                    .from('whatsapp_sessions')
                    .upsert({
                        user_id: userId,
                        file_id: 'creds',
                        data: JSON.parse(JSON.stringify(data, BufferJSON.replacer))
                    }, { onConflict: 'user_id,file_id' });
            } catch (err) {
                console.error(`[Auth] Failed to write critical creds:`, err.message);
            }
        } else {
            // Queue debounced save for non-creds keys
            scheduleSave();
        }
    };

    const readData = async (fileId) => {
        // Read directly from the consolidated memory cache
        if (cache.has(fileId)) {
            return cache.get(fileId);
        }
        
        // Secondary fallback for creds
        if (fileId === 'creds') {
            try {
                const { data, error } = await supabase
                    .from('whatsapp_sessions')
                    .select('data')
                    .eq('user_id', userId)
                    .eq('file_id', 'creds')
                    .maybeSingle();

                if (!error && data && data.data) {
                    const parsed = JSON.parse(JSON.stringify(data.data), BufferJSON.reviver);
                    cache.set('creds', parsed);
                    return parsed;
                }
            } catch (e) {}
        }
        return null;
    };

    const removeData = async (fileId) => {
        cache.delete(fileId);
        if (fileId === 'creds') {
            try {
                await supabase
                    .from('whatsapp_sessions')
                    .delete()
                    .eq('user_id', userId)
                    .eq('file_id', 'creds');
            } catch (e) {}
        } else {
            scheduleSave();
        }
    };

    const creds = await readData('creds') || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    ids.forEach((id) => {
                        const fileId = `${type}-${id}`;
                        let value = cache.get(fileId) || null;
                        if (type === 'app-state-sync-key' && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    });
                    return data;
                },
                set: async (data) => {
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const fileId = `${category}-${id}`;
                            if (value) {
                                cache.set(fileId, value);
                            } else {
                                cache.delete(fileId);
                            }
                        }
                    }
                    scheduleSave();
                }
            }
        },
        saveCreds: () => writeData(creds, 'creds')
    };
};

// Baileys Buffer JSON helper
const BufferJSON = {
    replacer: (k, v) => {
        if (Buffer.isBuffer(v) || v instanceof Uint8Array || v?.type === 'Buffer') {
            return {
                type: 'Buffer',
                data: Buffer.from(v?.data || v).toString('base64')
            };
        }
        return v;
    },
    reviver: (k, v) => {
        if (v && typeof v === 'object' && v.type === 'Buffer' && typeof v.data === 'string') {
            return Buffer.from(v.data, 'base64');
        }
        return v;
    }
};

const initAuthCreds = () => {
    const identityKey = Curve.generateKeyPair();
    return {
        noiseKey: Curve.generateKeyPair(),
        pairingEphemeralKeyPair: Curve.generateKeyPair(),
        signedIdentityKey: identityKey,
        signedPreKey: signedKeyPair(identityKey, 1),
        registrationId: Uint16Array.from(randomBytes(2))[0] & 16383,
        advSecretKey: randomBytes(32).toString('base64'),
        processedHistoryMessages: [],
        nextPreKeyId: 1,
        firstUnuploadedPreKeyId: 1,
        accountSyncCounter: 0,
        accountSettings: { unarchiveChats: false },
        registered: false,
        pairingCode: undefined,
        lastPropHash: undefined,
        routingInfo: undefined,
        additionalData: undefined
    };
};

module.exports = { useSupabaseAuthState };
