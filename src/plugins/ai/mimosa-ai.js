import axios from 'axios';
import fs from 'fs';
import path from 'path';

// ===============================
// SESSION STORAGE
// ===============================
const sessions = new Map();
const activeUsers = new Set();

const imagePath = path.resolve('./src/mimosa.png');
const MAX_HISTORY = 6;

// ===============================
// COOKIE ROTATOR
// ===============================
const COOKIE_FILE = './cookie_state.json';
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

function loadCookieState() {
    if (fs.existsSync(COOKIE_FILE)) {
        return JSON.parse(fs.readFileSync(COOKIE_FILE));
    }
    return {
        level: 1,
        index: Math.floor(Math.random() * ALPHABET.length)
    };
}

function saveCookieState(state) {
    fs.writeFileSync(COOKIE_FILE, JSON.stringify(state, null, 2));
}

function generateCookie(state) {
    if (state.level === 1) {
        return ALPHABET[state.index];
    }
    const a = ALPHABET[state.index];
    const b = ALPHABET[(state.index + 1) % ALPHABET.length];
    return a + b;
}

function rotateCookie() {
    const state = loadCookieState();
    state.index++;
    if (state.index >= ALPHABET.length) {
        state.index = 0;
        state.level++;
    }
    saveCookieState(state);
    return generateCookie(state);
}

function getCookie() {
    return generateCookie(loadCookieState());
}

// ===============================
// HELPER SESSION
// ===============================
function getSession(sender) {
    let session = sessions.get(sender);
    if (!session) {
        session = {
            history: [],
            lastActive: Date.now()
        };
        sessions.set(sender, session);
    }
    session.lastActive = Date.now();
    return session;
}

// ===============================
// EXPORT PLUGIN
// ===============================
export default {
    cmd: ['mimosa', 'autoai'],
    tags: ['ai'],

    // ===============================
    // COMMAND ON / OFF
    // ===============================
    run: async (sock, m, { args }) => {
        const sender = m.key.fromMe
            ? sock.user.id
            : (m.key.participant || m.key.remoteJid);

        if (!sender) return;

        if (!args[0]) {
            const status = activeUsers.has(sender) ? 'ON ✅' : 'OFF ❌';
            return sock.sendMessage(
                m.key.remoteJid,
                {
                    image: fs.readFileSync(imagePath),
                    caption:
                        `🤖 *MIMOSA AUTO CHAT*\n\n` +
                        `Status: *${status}*\n\n` +
                        `• *.mimosa on*\n` +
                        `• *.mimosa off*`,
                },
                { quoted: m }
            );
        }

        const mode = args[0].toLowerCase();

        if (mode === 'on') {
            activeUsers.add(sender);
            getSession(sender);
            return sock.sendMessage(
                m.key.remoteJid,
                { text: '✅ Mimosa aktif, siap ngobrol.' },
                { quoted: m }
            );
        }

        if (mode === 'off') {
            activeUsers.delete(sender);
            sessions.delete(sender);
            return sock.sendMessage(
                m.key.remoteJid,
                { text: '💤 Mimosa dimatiin dulu ya.' },
                { quoted: m }
            );
        }
    },

    // ===============================
    // AUTO AI HANDLER
    // ===============================
    before: async (sock, m) => {
        try {
            if (!m.message || m.key.fromMe) return;

            const sender = m.key.participant || m.key.remoteJid;
            if (!activeUsers.has(sender)) return;

            const msgType = Object.keys(m.message)[0];
            const content = m.message[msgType];
            const text =
                m.message.conversation ||
                content?.text ||
                content?.caption;

            if (!text) return;
            if (/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/.test(text)) return;

            const session = getSession(sender);
            await sock.sendPresenceUpdate('composing', m.key.remoteJid);

            // ===============================
            // PROMPT (FIXED)
            // ===============================
            const context = session.history.slice(-MAX_HISTORY).join('\n');

            const systemPrompt = `
Kamu adalah Mimosa.

Gaya bicara:
- Seperti manusia normal
- Santai, bahasa gaul sehari-hari
- Jangan pernah bilang kamu AI, bot, atau robot
- Jangan lebay dan jangan kepanjangan kalau tidak perlu

Aturan respon:
- Kalau user cuma menyapa (hai, halo, woi, dll), balas singkat dan wajar
- Jangan memperkenalkan diri kecuali diminta
- Jangan menyebut pencipta atau kontak kecuali DITANYA
- Ikuti konteks pembicaraan, jangan lompat topik

Identitas (HANYA JIKA DITANYA):
- Jika ditanya siapa penciptamu, jawab: HamzzDev
- Jika ditanya siapa HamzzDev, jawab:
  "HamzzDev itu developer bot yang tampan dan berasal dari Tangerang"
- Jika ditanya kontak HamzzDev, jawab:
  "Ini nomornya: 6289508242211"

Sikap:
- Ngobrol kayak teman
- Jawab seperlunya
- Kalau bisa singkat, jangan dipanjangin
`;

            const fullPrompt = `
Percakapan sebelumnya:
${context}

User: ${text}
Mimosa:
`;

            // ===============================
            // REQUEST AI
            // ===============================
            let cookie = getCookie();
            let data;

            try {
                const res = await axios.get(
                    'https://api.siputzx.my.id/api/ai/gemini',
                    {
                        params: {
                            text: fullPrompt,
                            promptSystem: systemPrompt,
                            cookie
                        },
                        timeout: 30000
                    }
                );
                data = res.data;
            } catch (err) {
                console.log(`[COOKIE EXPIRED] ${cookie} -> rotating`);
                cookie = rotateCookie();

                const res = await axios.get(
                    'https://api.siputzx.my.id/api/ai/gemini',
                    {
                        params: {
                            text: fullPrompt,
                            promptSystem: systemPrompt,
                            cookie
                        },
                        timeout: 30000
                    }
                );
                data = res.data;
            }

            if (!data?.status || !data?.data?.response) return;

            const reply = data.data.response.trim();
            if (!reply) return;

            await sock.sendMessage(
                m.key.remoteJid,
                { text: reply },
                { quoted: m }
            );

            session.history.push(`User: ${text}\nMimosa: ${reply}`);
            if (session.history.length > MAX_HISTORY * 2) {
                session.history.splice(0, session.history.length - MAX_HISTORY * 2);
            }

            return true;
        } catch (err) {
            console.error('[MIMOSA ERROR]', err.message);
        }
    }
};