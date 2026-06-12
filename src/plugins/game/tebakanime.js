import fetch from 'node-fetch';

let timeout = 60000;
let poin = 500;

global.gameTebakAnime = global.gameTebakAnime || {};

export default {
    cmd: ['tebakanime', 'nyerah', 'animehint'],
    tags: ['game'],
    limit: false,
    group: true,

    run: async (sock, m, { user, prefix, command }) => {
        const chatId = m.key.remoteJid;
        
        if (command === 'nyerah') {
            if (global.gameTebakAnime && global.gameTebakAnime[chatId]) {
                const jawaban = global.gameTebakAnime[chatId].jawaban;
                clearTimeout(global.gameTebakAnime[chatId].timer);
                
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
                
                delete global.gameTebakAnime[chatId];
            } else {
                await sock.sendMessage(chatId, {
                    text: `❌ *Tidak ada game yang sedang berjalan!*\n\nKetik .tebakanime untuk memulai.`
                }, { quoted: global.fVerif });
            }
            return;
        }
        
        if (command === 'animehint') {
            if (!global.gameTebakAnime || !global.gameTebakAnime[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Tidak ada game yang sedang berjalan!*\n\nKetik .tebakanime untuk memulai.`
                }, { quoted: global.fVerif });
            }
            
            const jawaban = global.gameTebakAnime[chatId].jawaban;
            let hint = '';
            for (let i = 0; i < jawaban.length; i++) {
                if (i === 0 || i === jawaban.length - 1) {
                    hint += jawaban[i];
                } else {
                    hint += '*';
                }
            }
            
            await sock.sendMessage(chatId, {
                text: `💡 *HINT:* ${hint}\n📏 *Panjang:* ${jawaban.length} huruf`,
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
        
        if (command === 'tebakanime') {
            if (global.gameTebakAnime[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Masih ada pertanyaan yang belum dijawab!*\nKetik *nyerah* untuk mengakhiri.`
                }, { quoted: global.fVerif });
            }
            
            try {
                const res = await fetch('https://raw.githubusercontent.com/unx21/ngetezz/main/src/data/nyenyenye.json');
                const data = await res.json();
                
                const validData = data.filter(item => item.img && item.img !== 'https://images.app.goo.gl/QpKCkpNfidT85zJU6' && item.jawaban);
                
                const randomIndex = Math.floor(Math.random() * validData.length);
                const gameData = validData[randomIndex];
                
                global.gameTebakAnime[chatId] = {
                    jawaban: gameData.jawaban.toLowerCase(),
                    img: gameData.img,
                    aktif: true,
                    timer: null
                };
                
                const text = `╭─────────────────┈ ⊹
│  🎌 *T E B A K   A N I M E* 🎌
│
├─ ❏ 🖼️ *Gambar di atas adalah anime apa?*
│
├─ ❏ ⏰ *Timeout:* 60 detik
├─ ❏ 💡 *Hint:* ${prefix}animehint
├─ ❏ 🎁 *Bonus:* ${poin} XP
├─ ❏ 😔 *Nyerah:* ketik "nyerah"
│
├─ ❏ 💬 *Ketik judul anime!*
│
╰─────────────────┈ ⊹`;
                
                try {
                    await sock.sendMessage(chatId, {
                        image: { url: gameData.img },
                        caption: text,
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
                } catch (imgErr) {
                    await sock.sendMessage(chatId, {
                        text: `❌ *Gagal memuat gambar!*\n\n${text}`,
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
                
                const timer = setTimeout(async () => {
                    if (global.gameTebakAnime[chatId] && global.gameTebakAnime[chatId].aktif) {
                        const jawaban = global.gameTebakAnime[chatId].jawaban;
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
                        delete global.gameTebakAnime[chatId];
                    }
                }, timeout);
                
                global.gameTebakAnime[chatId].timer = timer;
                
            } catch (err) {
                console.error('[TEBAK ANIME ERROR]', err);
                delete global.gameTebakAnime[chatId];
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
        
        if (!global.gameTebakAnime || !global.gameTebakAnime[chatId]) return;
        if (!global.gameTebakAnime[chatId].aktif) return;
        
        let pesan = '';
        if (m.message?.conversation) pesan = m.message.conversation;
        else if (m.msg?.text) pesan = m.msg.text;
        else return;
        
        if (pesan.startsWith('.') || pesan.startsWith('#')) return;
        
        if (pesan.toLowerCase().trim() === 'nyerah') {
            const jawaban = global.gameTebakAnime[chatId].jawaban;
            clearTimeout(global.gameTebakAnime[chatId].timer);
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
            delete global.gameTebakAnime[chatId];
            return;
        }
        
        const jawabanBenar = global.gameTebakAnime[chatId].jawaban;
        
        if (pesan.toLowerCase().trim() === jawabanBenar) {
            clearTimeout(global.gameTebakAnime[chatId].timer);
            
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
            
            delete global.gameTebakAnime[chatId];
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