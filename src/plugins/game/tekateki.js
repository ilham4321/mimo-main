import fetch from 'node-fetch';

let timeout = 60000;
let poin = 500;

global.gameTekaTeki = global.gameTekaTeki || {};

export default {
    cmd: ['tekateki', 'nyerah', 'tekihint'],
    tags: ['game'],
    limit: false,
    group: true,

    run: async (sock, m, { user, prefix, command }) => {
        const chatId = m.key.remoteJid;
        
        if (command === 'nyerah') {
            if (global.gameTekaTeki && global.gameTekaTeki[chatId]) {
                const jawaban = global.gameTekaTeki[chatId].jawaban;
                clearTimeout(global.gameTekaTeki[chatId].timer);
                
                await sock.sendMessage(chatId, {
                    text: `😔 *NYERAH!*\n\nJawabannya adalah *${jawaban}*`,
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
                
                delete global.gameTekaTeki[chatId];
            } else {
                await sock.sendMessage(chatId, {
                    text: `❌ *Tidak ada game yang sedang berjalan!*\n\nKetik ${prefix}tekateki untuk memulai.`
                }, { quoted: global.fVerif });
            }
            return;
        }
        
        if (command === 'tekihint') {
            if (!global.gameTekaTeki || !global.gameTekaTeki[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Tidak ada game yang sedang berjalan!*\n\nKetik ${prefix}tekateki untuk memulai.`
                }, { quoted: global.fVerif });
            }
            
            const jawaban = global.gameTekaTeki[chatId].jawaban;
            let hint = '';
            for (let i = 0; i < jawaban.length; i++) {
                if (i === 0 || i === jawaban.length - 1) {
                    hint += jawaban[i];
                } else if (jawaban[i] === ' ') {
                    hint += ' ';
                } else {
                    hint += '*';
                }
            }
            
            await sock.sendMessage(chatId, {
                text: `💡 *HINT:* ${hint}\n📏 *Panjang:* ${jawaban.length} karakter`,
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
            return;
        }
        
        if (command === 'tekateki') {
            if (global.gameTekaTeki[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Masih ada pertanyaan yang belum dijawab!*\nKetik *nyerah* untuk mengakhiri.`
                }, { quoted: global.fVerif });
            }
            
            try {
                const res = await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/games/tekateki.json');
                const data = await res.json();
                const randomIndex = Math.floor(Math.random() * data.length);
                const gameData = data[randomIndex];
                
                global.gameTekaTeki[chatId] = {
                    jawaban: gameData.jawaban.toLowerCase().trim(),
                    soal: gameData.soal,
                    aktif: true,
                    timer: null
                };
                
                const text = `╭─────────────────┈ ⊹
│  🧩 *T E K A   T E K I* 🧩
│
├─ ❏ 📝 *Pertanyaan:*
│     ${gameData.soal}
│
├─ ❏ ❓ *Apakah jawabannya?*
│
├─ ❏ ⏰ *Timeout:* 60 detik
├─ ❏ 💡 *Hint:* ${prefix}tekihint
├─ ❏ 🎁 *Bonus:* ${poin} XP
├─ ❏ 😔 *Nyerah:* ketik "nyerah"
│
├─ ❏ 💬 *Ketik jawaban langsung!*
│
╰─────────────────┈ ⊹`;
                
                await sock.sendMessage(chatId, {
                    text: text,
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
                    if (global.gameTekaTeki[chatId] && global.gameTekaTeki[chatId].aktif) {
                        const jawaban = global.gameTekaTeki[chatId].jawaban;
                        await sock.sendMessage(chatId, {
                            text: `⏰ *WAKTU HABIS!*\n\nJawabannya adalah *${jawaban}*`,
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
                        delete global.gameTekaTeki[chatId];
                    }
                }, timeout);
                
                global.gameTekaTeki[chatId].timer = timer;
                
            } catch (err) {
                console.error('[TEKA TEKI ERROR]', err);
                delete global.gameTekaTeki[chatId];
                await sock.sendMessage(chatId, {
                    text: `❌ *Gagal memulai game!*\n\nError: ${err.message}`
                }, { quoted: global.fVerif });
            }
            return;
        }
    },
    
    all: async (sock, m, { isGroup, user }) => {
        if (!isGroup) return;
        
        const chatId = m.key.remoteJid;
        
        if (!global.gameTekaTeki || !global.gameTekaTeki[chatId]) return;
        if (!global.gameTekaTeki[chatId].aktif) return;
        
        let pesan = '';
        if (m.message?.conversation) pesan = m.message.conversation;
        else if (m.msg?.text) pesan = m.msg.text;
        else return;
        
        if (pesan.startsWith('.') || pesan.startsWith('#')) return;
        
        if (pesan.toLowerCase().trim() === 'nyerah') {
            const jawaban = global.gameTekaTeki[chatId].jawaban;
            clearTimeout(global.gameTekaTeki[chatId].timer);
            await sock.sendMessage(chatId, {
                text: `😔 *NYERAH!*\n\nJawabannya adalah *${jawaban}*`,
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
            delete global.gameTekaTeki[chatId];
            return;
        }
        
        const jawabanBenar = global.gameTekaTeki[chatId].jawaban;
        
        if (pesan.toLowerCase().trim() === jawabanBenar) {
            clearTimeout(global.gameTekaTeki[chatId].timer);
            
            if (user && user.rpg) {
                user.rpg.exp = (user.rpg.exp || 0) + poin;
                user.rpg.money = (user.rpg.money || 0) + poin;
                await user.save();
            }
            
            await sock.sendMessage(chatId, {
                text: `✅ *BENAR!*\n\n🎉 Jawaban *${jawabanBenar}* benar!\n✨ +${poin} XP\n💰 +${poin} Money`,
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
            
            delete global.gameTekaTeki[chatId];
        } else {
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
    }
};
