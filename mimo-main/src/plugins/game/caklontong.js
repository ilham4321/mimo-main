import fetch from 'node-fetch';

let timeout = 60000;
let poin = 500;

global.gameCaklontong = global.gameCaklontong || {};

export default {
    cmd: ['caklontong', 'nyerah', 'clues'],
    tags: ['game'],
    limit: false,

    run: async (sock, m, { user, prefix, command }) => {
        const chatId = m.key.remoteJid;
        
        if (command === 'nyerah') {
            if (global.gameCaklontong && global.gameCaklontong[chatId]) {
                const jawaban = global.gameCaklontong[chatId].jawaban;
                const deskripsi = global.gameCaklontong[chatId].deskripsi;
                clearTimeout(global.gameCaklontong[chatId].timer);
                await sock.sendMessage(chatId, { text: `😔 *NYERAH!*\n\nJawabannya adalah *${jawaban}*\n📝 *Deskripsi:* ${deskripsi}` }, { quoted: global.fVerif });
                delete global.gameCaklontong[chatId];
            } else {
                await sock.sendMessage(chatId, { text: `❌ *Tidak ada game yang sedang berjalan!*` }, { quoted: global.fVerif });
            }
            return;
        }
        
        if (command === 'clues') {
            if (!global.gameCaklontong || !global.gameCaklontong[chatId]) {
                return sock.sendMessage(chatId, { text: `❌ *Tidak ada game yang sedang berjalan!*` }, { quoted: global.fVerif });
            }
            const jawaban = global.gameCaklontong[chatId].jawaban;
            let clue = jawaban[0] + '*'.repeat(jawaban.length - 2) + jawaban[jawaban.length - 1];
            await sock.sendMessage(chatId, { text: `💡 *CLUE:* ${clue}\n📏 *Panjang:* ${jawaban.length} huruf` }, { quoted: global.fVerif });
            return;
        }
        
        if (command === 'caklontong') {
            if (global.gameCaklontong[chatId]) {
                return sock.sendMessage(chatId, { text: `❌ *Masih ada game yang sedang berjalan!*` }, { quoted: global.fVerif });
            }
            
            try {
                const res = await fetch('https://raw.githubusercontent.com/nazedev/database/refs/heads/master/games/caklontong.json');
                const data = await res.json();
                const randomIndex = Math.floor(Math.random() * data.length);
                const gameData = data[randomIndex];
                
                global.gameCaklontong[chatId] = {
                    soal: gameData.soal,
                    jawaban: gameData.jawaban.toLowerCase(),
                    deskripsi: gameData.deskripsi,
                    timer: null,
                    aktif: true
                };
                
                await sock.sendMessage(chatId, { text: `🧠 *CAKLONTONG*\n\n❓ *Soal:* ${gameData.soal}\n\n⏰ Timeout: 60 detik\n💡 Clue: clues\n😔 Nyerah: ketik "nyerah"\n\n💬 Ketik jawaban langsung!` }, { quoted: global.fVerif });
                
                const timer = setTimeout(async () => {
                    if (global.gameCaklontong[chatId] && global.gameCaklontong[chatId].aktif) {
                        const jawaban = global.gameCaklontong[chatId].jawaban;
                        const deskripsi = global.gameCaklontong[chatId].deskripsi;
                        await sock.sendMessage(chatId, { text: `⏰ *WAKTU HABIS!*\n\nJawabannya adalah *${jawaban}*\n📝 *Deskripsi:* ${deskripsi}` }, { quoted: global.fVerif });
                        delete global.gameCaklontong[chatId];
                    }
                }, timeout);
                
                global.gameCaklontong[chatId].timer = timer;
                
            } catch (err) {
                console.error('[CAKLONTONG ERROR]', err);
                delete global.gameCaklontong[chatId];
                await sock.sendMessage(chatId, { text: `❌ *Gagal memulai game!*` }, { quoted: global.fVerif });
            }
            return;
        }
    },
    
    all: async (sock, m, { isGroup, user }) => {
        if (!isGroup) return;
        
        const chatId = m.key.remoteJid;
        
        if (!global.gameCaklontong || !global.gameCaklontong[chatId]) return;
        if (!global.gameCaklontong[chatId].aktif) return;
        
        let pesan = '';
        if (m.message?.conversation) pesan = m.message.conversation;
        else if (m.msg?.text) pesan = m.msg.text;
        else return;
        
        if (pesan.startsWith('.') || pesan.startsWith('#')) return;
        
        if (pesan.toLowerCase().trim() === 'nyerah') {
            const jawaban = global.gameCaklontong[chatId].jawaban;
            const deskripsi = global.gameCaklontong[chatId].deskripsi;
            clearTimeout(global.gameCaklontong[chatId].timer);
            await sock.sendMessage(chatId, { text: `😔 *NYERAH!*\n\nJawabannya adalah *${jawaban}*\n📝 *Deskripsi:* ${deskripsi}` }, { quoted: global.fVerif });
            delete global.gameCaklontong[chatId];
            return;
        }
        
        if (pesan.toLowerCase().trim() === global.gameCaklontong[chatId].jawaban) {
            clearTimeout(global.gameCaklontong[chatId].timer);
            
            if (user && user.rpg) {
                user.rpg.exp = (user.rpg.exp || 0) + poin;
                user.rpg.money = (user.rpg.money || 0) + poin;
                await user.save();
            }
            
            await sock.sendMessage(chatId, { text: `✅ *BENAR!*\n\n🎉 Jawaban *${global.gameCaklontong[chatId].jawaban}* benar!\n📝 *Deskripsi:* ${global.gameCaklontong[chatId].deskripsi}\n✨ +${poin} XP\n💰 +${poin} Money` }, { quoted: global.fVerif });
            delete global.gameCaklontong[chatId];
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