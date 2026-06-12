import fetch from 'node-fetch';

let timeout = 60000;
let poin = 500;

global.gameTebakKimia = global.gameTebakKimia || {};

export default {
    cmd: ['tebakkimia', 'nyerah', 'kimiahint'],
    tags: ['game'],
    limit: false,
    group: true,

    run: async (sock, m, { user, prefix, command }) => {
        const chatId = m.key.remoteJid;
        
        if (command === 'nyerah') {
            if (global.gameTebakKimia && global.gameTebakKimia[chatId]) {
                const jawaban = global.gameTebakKimia[chatId].jawaban;
                clearTimeout(global.gameTebakKimia[chatId].timer);
                
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
                
                delete global.gameTebakKimia[chatId];
            } else {
                await sock.sendMessage(chatId, {
                    text: `❌ *Tidak ada game yang sedang berjalan!*\n\nKetik ${prefix}tebakkimia untuk memulai.`
                }, { quoted: global.fVerif });
            }
            return;
        }
        
        if (command === 'kimiahint') {
            if (!global.gameTebakKimia || !global.gameTebakKimia[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Tidak ada game yang sedang berjalan!*\n\nKetik ${prefix}tebakkimia untuk memulai.`
                }, { quoted: global.fVerif });
            }
            
            const jawaban = global.gameTebakKimia[chatId].jawaban;
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
        
        if (command === 'tebakkimia') {
            if (global.gameTebakKimia[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Masih ada pertanyaan yang belum dijawab!*\nKetik *nyerah* untuk mengakhiri.`
                }, { quoted: global.fVerif });
            }
            
            try {
                const res = await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakkimia.json');
                const data = await res.json();
                const randomIndex = Math.floor(Math.random() * data.length);
                const gameData = data[randomIndex];
                
                // Menyesuaikan dengan struktur asli JSON: "unsur" dan "lambang"
                const namaUnsur = gameData.unsur;
                const lambangUnsur = gameData.lambang;

                global.gameTebakKimia[chatId] = {
                    jawaban: namaUnsur.toLowerCase().trim(),
                    lambang: lambangUnsur,
                    aktif: true,
                    timer: null
                };
                
                const text = `╭─────────────────┈ ⊹
│  🧪 *T E B A K   K I M I A* 🧪
│
├─ ❏ 📝 *Nama unsur dari lambang:*
│     👉 *${lambangUnsur}*
│
├─ ❏ ❓ *Apakah nama unsur tersebut?*
│
├─ ❏ ⏰ *Timeout:* 60 detik
├─ ❏ 💡 *Hint:* ${prefix}kimiahint
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
                    if (global.gameTebakKimia[chatId] && global.gameTebakKimia[chatId].aktif) {
                        const jawaban = global.gameTebakKimia[chatId].jawaban;
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
                        delete global.gameTebakKimia[chatId];
                    }
                }, timeout);
                
                global.gameTebakKimia[chatId].timer = timer;
                
            } catch (err) {
                console.error('[TEBAK KIMIA ERROR]', err);
                delete global.gameTebakKimia[chatId];
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
        
        if (!global.gameTebakKimia || !global.gameTebakKimia[chatId]) return;
        if (!global.gameTebakKimia[chatId].aktif) return;
        
        let pesan = '';
        if (m.message?.conversation) pesan = m.message.conversation;
        else if (m.msg?.text) pesan = m.msg.text;
        else return;
        
        if (pesan.startsWith('.') || pesan.startsWith('#')) return;
        
        if (pesan.toLowerCase().trim() === 'nyerah') {
            const jawaban = global.gameTebakKimia[chatId].jawaban;
            clearTimeout(global.gameTebakKimia[chatId].timer);
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
            delete global.gameTebakKimia[chatId];
            return;
        }
        
        const jawabanBenar = global.gameTebakKimia[chatId].jawaban;
        
        if (pesan.toLowerCase().trim() === jawabanBenar) {
            clearTimeout(global.gameTebakKimia[chatId].timer);
            
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
            
            delete global.gameTebakKimia[chatId];
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
