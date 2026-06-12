import fetch from 'node-fetch';

let timeout = 90000;
let poinPerJawaban = 100;

global.gameFamily100 = global.gameFamily100 || {};

export default {
    cmd: ['family100', 'famili100', 'nyerah'],
    tags: ['game'],
    limit: false,

    run: async (sock, m, { user, prefix, command }) => {
        const chatId = m.key.remoteJid;
        
        if (command === 'nyerah') {
            if (global.gameFamily100 && global.gameFamily100[chatId]) {
                const soal = global.gameFamily100[chatId].soal;
                const jawaban = global.gameFamily100[chatId].jawaban;
                const ditemukan = global.gameFamily100[chatId].ditemukan;
                const belumDitemukan = jawaban.filter((_, i) => !ditemukan[i]);
                
                clearTimeout(global.gameFamily100[chatId].timer);
                
                let text = `😔 *NYERAH!*\n\n📋 *Soal:* ${soal}\n\n`;
                text += `┌─❖ *Jawaban yang benar:*\n`;
                for (let j of jawaban) {
                    text += `│  • ${j}\n`;
                }
                if (belumDitemukan.length > 0) {
                    text += `│\n├─❖ *Jawaban belum ditemukan:* ${belumDitemukan.length}\n`;
                    for (let j of belumDitemukan) {
                        text += `│  • ${j}\n`;
                    }
                }
                text += `╰─────────────────`;
                
                await sock.sendMessage(chatId, { text: text }, { quoted: global.fVerif });
                delete global.gameFamily100[chatId];
            } else {
                await sock.sendMessage(chatId, { text: `❌ *Tidak ada game yang sedang berjalan!*` }, { quoted: global.fVerif });
            }
            return;
        }
        
        if (command === 'family100' || command === 'famili100') {
            if (global.gameFamily100[chatId]) {
                return sock.sendMessage(chatId, { text: `❌ *Masih ada game yang sedang berjalan!*\nKetik *nyerah* untuk mengakhiri.` }, { quoted: global.fVerif });
            }
            
            try {
                const res = await fetch('https://raw.githubusercontent.com/irwanx/database/master/games/family100.json');
                const data = await res.json();
                const randomIndex = Math.floor(Math.random() * data.length);
                const gameData = data[randomIndex];
                
                const jawabanNormalized = gameData.jawaban.filter(j => j && j.trim() !== '');
                
                global.gameFamily100[chatId] = {
                    soal: gameData.soal,
                    jawaban: jawabanNormalized,
                    ditemukan: new Array(jawabanNormalized.length).fill(false),
                    timer: null,
                    aktif: true,
                    totalJawaban: jawabanNormalized.length,
                    ditemukanCount: 0
                };
                
                const text = `╭─────────────────┈ ⊹
│  👨‍👩‍👧‍👦 *F A M I L Y   1 0 0* 👨‍👩‍👧‍👦
│
├─ ❏ ❓ *Soal:*
│     ${gameData.soal}
│
├─ ❏ 📊 *Total Jawaban:* ${jawabanNormalized.length}
├─ ❏ 💰 *Poin per jawaban:* ${poinPerJawaban} XP
├─ ❏ ⏰ *Timeout:* 90 detik
├─ ❏ 😔 *Nyerah:* ketik "nyerah"
│
├─ ❏ 💬 *Ketik jawaban langsung*
│     di chat ini!
│
╰─────────────────┈ ⊹`;
                
                await sock.sendMessage(chatId, { text: text }, { quoted: global.fVerif });
                
                const timer = setTimeout(async () => {
                    if (global.gameFamily100[chatId] && global.gameFamily100[chatId].aktif) {
                        const soal = global.gameFamily100[chatId].soal;
                        const jawaban = global.gameFamily100[chatId].jawaban;
                        const ditemukan = global.gameFamily100[chatId].ditemukan;
                        const belumDitemukan = jawaban.filter((_, i) => !ditemukan[i]);
                        
                        let textEnd = `⏰ *WAKTU HABIS!*\n\n📋 *Soal:* ${soal}\n\n`;
                        textEnd += `┌─❖ *Jawaban yang benar:*\n`;
                        for (let j of jawaban) {
                            textEnd += `│  • ${j}\n`;
                        }
                        if (belumDitemukan.length > 0) {
                            textEnd += `│\n├─❖ *Jawaban belum ditemukan:* ${belumDitemukan.length}\n`;
                            for (let j of belumDitemukan) {
                                textEnd += `│  • ${j}\n`;
                            }
                        }
                        textEnd += `╰─────────────────`;
                        
                        await sock.sendMessage(chatId, { text: textEnd }, { quoted: global.fVerif });
                        delete global.gameFamily100[chatId];
                    }
                }, timeout);
                
                global.gameFamily100[chatId].timer = timer;
                
            } catch (err) {
                console.error('[FAMILY100 ERROR]', err);
                delete global.gameFamily100[chatId];
                await sock.sendMessage(chatId, { text: `❌ *Gagal memulai game!*\n\nError: ${err.message}` }, { quoted: global.fVerif });
            }
            return;
        }
    },
    
    all: async (sock, m, { isGroup, user }) => {
        if (!isGroup) return;
        
        const chatId = m.key.remoteJid;
        
        if (!global.gameFamily100 || !global.gameFamily100[chatId]) return;
        if (!global.gameFamily100[chatId].aktif) return;
        
        let pesan = '';
        if (m.message?.conversation) pesan = m.message.conversation;
        else if (m.msg?.text) pesan = m.msg.text;
        else return;
        
        if (pesan.startsWith('.') || pesan.startsWith('#')) return;
        
        if (pesan.toLowerCase().trim() === 'nyerah') {
            const soal = global.gameFamily100[chatId].soal;
            const jawaban = global.gameFamily100[chatId].jawaban;
            const ditemukan = global.gameFamily100[chatId].ditemukan;
            const belumDitemukan = jawaban.filter((_, i) => !ditemukan[i]);
            
            clearTimeout(global.gameFamily100[chatId].timer);
            
            let text = `😔 *NYERAH!*\n\n📋 *Soal:* ${soal}\n\n`;
            text += `┌─❖ *Jawaban yang benar:*\n`;
            for (let j of jawaban) {
                text += `│  • ${j}\n`;
            }
            if (belumDitemukan.length > 0) {
                text += `│\n├─❖ *Jawaban belum ditemukan:* ${belumDitemukan.length}\n`;
                for (let j of belumDitemukan) {
                    text += `│  • ${j}\n`;
                }
            }
            text += `╰─────────────────`;
            
            await sock.sendMessage(chatId, { text: text }, { quoted: global.fVerif });
            delete global.gameFamily100[chatId];
            return;
        }
        
        const jawabanUser = pesan.toLowerCase().trim();
        const game = global.gameFamily100[chatId];
        
        let foundIndex = -1;
        for (let i = 0; i < game.jawaban.length; i++) {
            if (game.ditemukan[i]) continue;
            if (game.jawaban[i].toLowerCase() === jawabanUser) {
                foundIndex = i;
                break;
            }
        }
        
        if (foundIndex !== -1) {
            game.ditemukan[foundIndex] = true;
            game.ditemukanCount++;
            
            const poin = poinPerJawaban;
            if (user && user.rpg) {
                user.rpg.exp = (user.rpg.exp || 0) + poin;
                await user.save();
            }
            
            const sisa = game.totalJawaban - game.ditemukanCount;
            
            let text = `✅ *BENAR!*\n\n🎉 Jawaban *${game.jawaban[foundIndex]}* benar!\n✨ +${poin} XP\n\n`;
            text += `📊 *Progress:* ${game.ditemukanCount}/${game.totalJawaban} jawaban ditemukan\n`;
            
            if (sisa === 0) {
                clearTimeout(game.timer);
                
                const bonus = game.totalJawaban * poinPerJawaban;
                if (user && user.rpg) {
                    user.rpg.exp = (user.rpg.exp || 0) + bonus;
                    await user.save();
                }
                
                text += `🎉 *SELAMAT!* Semua jawaban berhasil ditemukan!\n✨ *Bonus:* +${bonus} XP\n\n`;
                text += `📋 *Soal:* ${game.soal}\n`;
                text += `┌─❖ *Semua jawaban:*\n`;
                for (let j of game.jawaban) {
                    text += `│  • ${j}\n`;
                }
                text += `╰─────────────────`;
                
                await sock.sendMessage(chatId, { text: text }, { quoted: global.fVerif });
                delete global.gameFamily100[chatId];
            } else {
                text += `💡 *Sisa jawaban:* ${sisa} lagi\n`;
                text += `📝 *Terus tebak!*`;
                
                await sock.sendMessage(chatId, { text: text }, { quoted: global.fVerif });
            }
        } else {
            let sudahDijawab = false;
            for (let i = 0; i < game.jawaban.length; i++) {
                if (game.jawaban[i].toLowerCase() === jawabanUser && game.ditemukan[i]) {
                    sudahDijawab = true;
                    break;
                }
            }
            
            if (sudahDijawab) {
                await sock.sendMessage(chatId, { 
                    text: `⚠️ *Jawaban sudah disebutkan!*\n\n📝 *${jawabanUser}* sudah ada dalam daftar.\n💡 Coba jawaban lain!`,
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
            } else {
                await sock.sendMessage(chatId, { 
                    text: `❌ *SALAH!*\n\nJawaban *${pesan}* tidak ada dalam daftar.\n💡 Coba lagi!`,
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
        }
    }
};