import fetch from 'node-fetch';

let timeout = 120000;
let poin = 4999;

global.gameTebakLogo = global.gameTebakLogo || {};

export default {
    cmd: ['tebaklogo', 'nyerah', 'hlog'],
    tags: ['game'],
    limit: false,

    run: async (sock, m, { user, prefix, command }) => {
        const chatId = m.key.remoteJid;
        
        if (command === 'nyerah') {
            if (!global.gameTebakLogo || !global.gameTebakLogo[chatId]) {
                return sock.sendMessage(chatId, { text: `❌ *Tidak ada game yang sedang berjalan!*` }, { quoted: global.fVerif });
            }
            const jawaban = global.gameTebakLogo[chatId].data.data.jawaban;
            clearTimeout(global.gameTebakLogo[chatId].timer);
            await sock.sendMessage(chatId, { text: `😔 *NYERAH!*\n\nJawabannya adalah *${jawaban}*` }, { quoted: global.fVerif });
            delete global.gameTebakLogo[chatId];
            return;
        }
        
        if (command === 'hlog') {
            if (!global.gameTebakLogo || !global.gameTebakLogo[chatId]) {
                return sock.sendMessage(chatId, { text: `❌ *Tidak ada game yang sedang berjalan!*` }, { quoted: global.fVerif });
            }
            const jawaban = global.gameTebakLogo[chatId].jawaban;
            let hint = jawaban[0] + '*'.repeat(jawaban.length - 2) + jawaban[jawaban.length - 1];
            await sock.sendMessage(chatId, { text: `💡 *HINT:* ${hint}\n📏 *Panjang:* ${jawaban.length} huruf` }, { quoted: global.fVerif });
            return;
        }
        
        if (command === 'tebaklogo') {
            if (global.gameTebakLogo[chatId]) {
                return sock.sendMessage(chatId, { text: `❌ *Masih ada game yang sedang berjalan!*` }, { quoted: global.fVerif });
            }
            
            try {
                const res = await fetch('https://raw.githubusercontent.com/orderku/db/main/dbbot/game/tebakapp.json');
                const src = await res.json();
                
                let gameData = null;
                let attempts = 0;
                const maxAttempts = 15;
                
                while (!gameData && attempts < maxAttempts) {
                    const randomIndex = Math.floor(Math.random() * src.length);
                    const candidate = src[randomIndex];
                    const imageUrl = candidate.data.image;
                    
                    try {
                        const checkRes = await fetch(imageUrl, { method: 'HEAD' });
                        if (checkRes.ok) {
                            gameData = candidate;
                            break;
                        }
                    } catch (err) {}
                    attempts++;
                }
                
                if (!gameData) {
                    throw new Error('Tidak ada soal valid. Coba lagi nanti.');
                }
                
                global.gameTebakLogo[chatId] = {
                    data: gameData,
                    timer: null,
                    jawaban: gameData.data.jawaban.toLowerCase(),
                    aktif: true
                };
                
                const caption = `╭─────────────────┈ ⊹
│  🎮 *T E B A K   L O G O* 🎮
│
├─ ❏ ❓ *Logo apakah ini?*
│
├─ ❏ ⏰ *Timeout:* ${(timeout / 1000).toFixed(2)} detik
├─ ❏ 💡 *Hint:* hemo
├─ ❏ 🎁 *Bonus:* ${poin} XP
├─ ❏ 😔 *Nyerah:* ketik "nyerah"
│
├─ ❏ 💬 *Ketik jawaban langsung*
│     di chat ini!
│
╰─────────────────┈ ⊹`;
                
                await sock.sendMessage(chatId, {
                    image: { url: gameData.data.image },
                    caption: caption,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363369878409989@newsletter',
                            serverMessageId: Math.floor(Math.random() * 1000),
                            newsletterName: '✨ Mimosa Multi-Device »'
                        }
                    }
                }, { quoted: global.fVerif });
                
                const timer = setTimeout(async () => {
                    if (global.gameTebakLogo[chatId] && global.gameTebakLogo[chatId].aktif) {
                        const jawaban = global.gameTebakLogo[chatId].data.data.jawaban;
                        await sock.sendMessage(chatId, { text: `⏰ *WAKTU HABIS!*\n\nJawabannya adalah *${jawaban}*` }, { quoted: global.fVerif });
                        delete global.gameTebakLogo[chatId];
                    }
                }, timeout);
                
                global.gameTebakLogo[chatId].timer = timer;
                
            } catch (err) {
                console.error('[GAME ERROR]', err);
                delete global.gameTebakLogo[chatId];
                await sock.sendMessage(chatId, { text: `❌ *Gagal memulai game!*\n\nError: ${err.message}` }, { quoted: global.fVerif });
            }
            return;
        }
    },
    
    all: async (sock, m, { isGroup, user }) => {
        if (!isGroup) return;
        
        const chatId = m.key.remoteJid;
        
        if (!global.gameTebakLogo || !global.gameTebakLogo[chatId]) return;
        if (!global.gameTebakLogo[chatId].aktif) return;
        
        let pesan = '';
        if (m.message?.conversation) pesan = m.message.conversation;
        else if (m.msg?.text) pesan = m.msg.text;
        else return;
        
        if (pesan.startsWith('.') || pesan.startsWith('#')) return;
        
        if (pesan.toLowerCase().trim() === 'nyerah') {
            const jawaban = global.gameTebakLogo[chatId].data.data.jawaban;
            clearTimeout(global.gameTebakLogo[chatId].timer);
            await sock.sendMessage(chatId, { text: `😔 *NYERAH!*\n\nJawabannya adalah *${jawaban}*` }, { quoted: global.fVerif });
            delete global.gameTebakLogo[chatId];
            return;
        }
        
        if (pesan.toLowerCase().trim() === global.gameTebakLogo[chatId].jawaban) {
            clearTimeout(global.gameTebakLogo[chatId].timer);
            
            if (user && user.rpg) {
                user.rpg.exp = (user.rpg.exp || 0) + poin;
                user.rpg.money = (user.rpg.money || 0) + poin;
                await user.save();
            }
            
            await sock.sendMessage(chatId, { text: `✅ *BENAR!*\n\n🎉 Jawaban *${global.gameTebakLogo[chatId].jawaban}* benar!\n✨ +${poin} XP\n💰 +${poin} Money` }, { quoted: global.fVerif });
            delete global.gameTebakLogo[chatId];
            return;
        }
        
        await sock.sendMessage(chatId, { 
            text: `❌ *SALAH!*\n\nJawaban *${pesan}* tidak tepat.\n💡 Coba lagi atau ketik *nyerah* untuk menyerah.`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363369878409989@newsletter',
                    serverMessageId: Math.floor(Math.random() * 1000),
                    newsletterName: '✨ Mimosa Multi-Device »'
                }
            }
        }, { quoted: global.fVerif });
    }
};