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
const useSupabaseAuthState = async (supabase, userId) => {
    const cache = getSessionCache(userId);
    
    const writeData = async (data, fileId, retries = 3) => {
        // Update in-memory cache immediately
        cache.set(fileId, data);

        for (let attempt = 1; attempt <= retries; attempt++) {
            const { error } = await supabase
                .from('whatsapp_sessions')
                .upsert({
                    user_id: userId,
                    file_id: fileId,
                    data: JSON.parse(JSON.stringify(data, BufferJSON.replacer))
                }, { onConflict: 'user_id,file_id' });
            
            if (!error) return;
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, 200 * attempt));
            } else {
                console.error(`[Auth] Error writing ${fileId} after ${retries} attempts:`, error.message);
            }
        }
    };

    const readData = async (fileId) => {
        // Serve from memory cache if available
        if (cache.has(fileId)) {
            return cache.get(fileId);
        }

        try {
            const { data, error } = await supabase
                .from('whatsapp_sessions')
                .select('data')
                .eq('user_id', userId)
                .eq('file_id', fileId)
                .single();

            if (error || !data) {
                cache.set(fileId, null);
                return null;
            }

            const parsed = JSON.parse(JSON.stringify(data.data), BufferJSON.reviver);
            cache.set(fileId, parsed);
            return parsed;
        } catch (error) {
            return null;
        }
    };

    const removeData = async (fileId) => {
        cache.delete(fileId);
        const { error } = await supabase
            .from('whatsapp_sessions')
            .delete()
            .eq('user_id', userId)
            .eq('file_id', fileId);
        
        if (error) console.error(`[Auth] Error removing ${fileId}:`, error.message);
    };

    const creds = await readData('creds') || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const fileId = `${category}-${id}`;
                            tasks.push({ fileId, value });
                        }
                    }

                    // Execute in batches of 5 to avoid overwhelming Supabase connection pool
                    const BATCH_SIZE = 5;
                    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
                        const batch = tasks.slice(i, i + BATCH_SIZE);
                        await Promise.all(
                            batch.map(({ fileId, value }) =>
                                value ? writeData(value, fileId) : removeData(fileId)
                            )
                        );
                    }
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
