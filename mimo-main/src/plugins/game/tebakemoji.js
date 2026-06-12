import fetch from 'node-fetch';

let timeout = 60000;
let poin = 500;

global.gameTebakEmoji = global.gameTebakEmoji || {};

export default {
    cmd: ['tebakemoji', 'nyerah', 'hemo'],
    tags: ['game'],
    limit: false,

    run: async (sock, m, { user, prefix, command }) => {
        const chatId = m.key.remoteJid;
        
        if (command === 'nyerah') {
            if (global.gameTebakEmoji && global.gameTebakEmoji[chatId]) {
                const jawaban = global.gameTebakEmoji[chatId].jawaban;
                clearTimeout(global.gameTebakEmoji[chatId].timer);
                await sock.sendMessage(chatId, { text: `😔 *NYERAH!*\n\nJawabannya adalah *${jawaban}*` }, { quoted: global.fVerif });
                delete global.gameTebakEmoji[chatId];
            } else {
                await sock.sendMessage(chatId, { text: `❌ *Tidak ada game yang sedang berjalan!*` }, { quoted: global.fVerif });
            }
            return;
        }
        
        if (command === 'hemo') {
            if (!global.gameTebakEmoji || !global.gameTebakEmoji[chatId]) {
                return sock.sendMessage(chatId, { text: `❌ *Tidak ada game yang sedang berjalan!*` }, { quoted: global.fVerif });
            }
            const jawaban = global.gameTebakEmoji[chatId].jawaban;
            let hint = jawaban[0] + '*'.repeat(jawaban.length - 2) + jawaban[jawaban.length - 1];
            await sock.sendMessage(chatId, { text: `💡 *HINT:* ${hint}\n📏 *Panjang:* ${jawaban.length} huruf` }, { quoted: global.fVerif });
            return;
        }
        
        if (command === 'tebakemoji') {
            if (global.gameTebakEmoji[chatId]) {
                return sock.sendMessage(chatId, { text: `❌ *Masih ada game yang sedang berjalan!*` }, { quoted: global.fVerif });
            }
            
            try {
                const res = await fetch('https://emoji-api.com/emojis?access_key=b4ffa498efe78f58a01079e1c5fe516913f92a5a');
                const data = await res.json();
                const randomIndex = Math.floor(Math.random() * data.length);
                const gameData = data[randomIndex];
                
                global.gameTebakEmoji[chatId] = {
                    emoji: gameData.character,
                    jawaban: gameData.unicodeName.toLowerCase(),
                    codePoint: gameData.codePoint,
                    timer: null,
                    aktif: true
                };
                
                await sock.sendMessage(chatId, { text: `😀 *TEBAK EMOJI*\n\n❓ Emoji: ${gameData.character}\n\n⏰ Timeout: 60 detik\n💡 Hint: hemo\n😔 Nyerah: ketik "nyerah"\n\n💬 Ketik nama emoji!` }, { quoted: global.fVerif });
                
                const timer = setTimeout(async () => {
                    if (global.gameTebakEmoji[chatId] && global.gameTebakEmoji[chatId].aktif) {
                        const jawaban = global.gameTebakEmoji[chatId].jawaban;
                        await sock.sendMessage(chatId, { text: `⏰ *WAKTU HABIS!*\n\nJawabannya adalah *${jawaban}*` }, { quoted: global.fVerif });
                        delete global.gameTebakEmoji[chatId];
                    }
                }, timeout);
                
                global.gameTebakEmoji[chatId].timer = timer;
                
            } catch (err) {
                console.error('[TEBAK EMOJI ERROR]', err);
                delete global.gameTebakEmoji[chatId];
                await sock.sendMessage(chatId, { text: `❌ *Gagal memulai game!*` }, { quoted: global.fVerif });
            }
            return;
        }
    },
    
    all: async (sock, m, { isGroup, user }) => {
        if (!isGroup) return;
        
        const chatId = m.key.remoteJid;
        
        if (!global.gameTebakEmoji || !global.gameTebakEmoji[chatId]) return;
        if (!global.gameTebakEmoji[chatId].aktif) return;
        
        let pesan = '';
        if (m.message?.conversation) pesan = m.message.conversation;
        else if (m.msg?.text) pesan = m.msg.text;
        else return;
        
        if (pesan.startsWith('.') || pesan.startsWith('#')) return;
        
        if (pesan.toLowerCase().trim() === 'nyerah') {
            const jawaban = global.gameTebakEmoji[chatId].jawaban;
            clearTimeout(global.gameTebakEmoji[chatId].timer);
            await sock.sendMessage(chatId, { text: `😔 *NYERAH!*\n\nJawabannya adalah *${jawaban}*` }, { quoted: global.fVerif });
            delete global.gameTebakEmoji[chatId];
            return;
        }
        
        if (pesan.toLowerCase().trim() === global.gameTebakEmoji[chatId].jawaban) {
            clearTimeout(global.gameTebakEmoji[chatId].timer);
            
            if (user && user.rpg) {
                user.rpg.exp = (user.rpg.exp || 0) + poin;
                user.rpg.money = (user.rpg.money || 0) + poin;
                await user.save();
            }
            
            await sock.sendMessage(chatId, { text: `✅ *BENAR!*\n\n🎉 Jawaban *${global.gameTebakEmoji[chatId].jawaban}* benar!\n✨ +${poin} XP\n💰 +${poin} Money` }, { quoted: global.fVerif });
            delete global.gameTebakEmoji[chatId];
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