import fetch from 'node-fetch';

let timeout = 120000;
let poin = 4999;

global.gameAsahOtak = global.gameAsahOtak || {};

export default {
    cmd: ['asahotak', 'hasa', 'nyerah'],
    tags: ['game'],
    limit: false,

    run: async (sock, m, { user, args, command, prefix }) => {
        const chatId = m.key.remoteJid;
        
        if (command === 'nyerah') {
            if (global.gameAsahOtak && global.gameAsahOtak[chatId]) {
                const jawaban = global.gameAsahOtak[chatId].jawaban;
                clearTimeout(global.gameAsahOtak[chatId].timer);
                
                await sock.sendMessage(chatId, {
                    text: `😔 *NYERAH!*\n\nJawabannya adalah *${jawaban}*\n\nKetik .asahotak untuk bermain lagi.`,
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
                
                delete global.gameAsahOtak[chatId];
            } else {
                await sock.sendMessage(chatId, {
                    text: `❌ *Tidak ada game yang sedang berjalan!*\n\nKetik .asahotak untuk memulai.`
                }, { quoted: global.fVerif });
            }
            return;
        }
        
        if (command === 'hasa') {
            if (!global.gameAsahOtak || !global.gameAsahOtak[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Tidak ada game yang sedang berjalan!*\n\nKetik .asahotak untuk memulai.`
                }, { quoted: global.fVerif });
            }
            
            const jawaban = global.gameAsahOtak[chatId].jawaban;
            
            let hint = '';
            for (let i = 0; i < jawaban.length; i++) {
                if (i === 0 || i === jawaban.length - 1) {
                    hint += jawaban[i];
                } else {
                    hint += '*';
                }
            }
            
            await sock.sendMessage(chatId, {
                text: `💡 *HINT:* ${hint}\n\n📏 *Panjang:* ${jawaban.length} huruf`,
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
        
        if (command === 'asahotak') {
            if (global.gameAsahOtak[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Masih ada game yang sedang berjalan!*\nSelesaikan dulu atau ketik *nyerah*.`
                }, { quoted: global.fVerif });
            }
            
            try {
                const res = await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/games/asahotak.json');
                const src = await res.json();
                const gameData = src[Math.floor(Math.random() * src.length)];
                
                global.gameAsahOtak[chatId] = {
                    data: gameData,
                    soal: gameData.soal,
                    jawaban: gameData.jawaban.toLowerCase(),
                    timer: null,
                    aktif: true
                };
                
                const caption = `╭─────────────────┈ ⊹
│  🧠 *A S A H   O T A K* 🧠
│
├─ ❏ ❓ *Soal:*
│     ${gameData.soal}
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
                    text: caption,
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
                    if (global.gameAsahOtak[chatId] && global.gameAsahOtak[chatId].aktif) {
                        const jawaban = global.gameAsahOtak[chatId].jawaban;
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
                        delete global.gameAsahOtak[chatId];
                    }
                }, timeout);
                
                global.gameAsahOtak[chatId].timer = timer;
                
            } catch (err) {
                console.error('[ASAH OTAK ERROR]', err);
                delete global.gameAsahOtak[chatId];
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
        
        if (!global.gameAsahOtak || !global.gameAsahOtak[chatId]) return;
        if (!global.gameAsahOtak[chatId].aktif) return;
        
        let pesan = '';
        if (m.message?.conversation) pesan = m.message.conversation;
        else if (m.msg?.text) pesan = m.msg.text;
        else return;
        
        if (pesan.startsWith('.') || pesan.startsWith('#')) return;
        
        if (pesan.toLowerCase().trim() === 'nyerah') {
            const jawaban = global.gameAsahOtak[chatId].jawaban;
            clearTimeout(global.gameAsahOtak[chatId].timer);
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
            delete global.gameAsahOtak[chatId];
            return;
        }
        
        const jawabanBenar = global.gameAsahOtak[chatId].jawaban;
        
        if (pesan.toLowerCase().trim() === jawabanBenar) {
            clearTimeout(global.gameAsahOtak[chatId].timer);
            
            if (user && user.rpg) {
                user.rpg.exp = (user.rpg.exp || 0) + poin;
                user.rpg.money = (user.rpg.money || 0) + poin;
                await user.save();
            }
            
            await sock.sendMessage(chatId, {
                text: `✅ *BENAR!*\n\n🎉 Selamat! Jawaban *${jawabanBenar}* benar!\n✨ +${poin} XP\n💰 +${poin} Money`,
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
            
            delete global.gameAsahOtak[chatId];
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