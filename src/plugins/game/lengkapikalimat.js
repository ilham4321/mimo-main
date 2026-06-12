import fetch from 'node-fetch';

let timeout = 60000;
let poin = 500;

global.gameLengkapKalimat = global.gameLengkapKalimat || {};

export default {
    cmd: ['lengkapikalimat', 'lengkapin', 'lk', 'nyerah', 'hintlk'],
    tags: ['game'],
    limit: false,
    group: true,

    run: async (sock, m, { user, prefix, command }) => {
        const chatId = m.key.remoteJid;
        
        if (command === 'nyerah') {
            if (global.gameLengkapKalimat && global.gameLengkapKalimat[chatId]) {
                const jawaban = global.gameLengkapKalimat[chatId].jawaban;
                clearTimeout(global.gameLengkapKalimat[chatId].timer);
                
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
                
                delete global.gameLengkapKalimat[chatId];
            } else {
                await sock.sendMessage(chatId, {
                    text: `❌ *Tidak ada game yang sedang berjalan!*\n\nKetik .lengkapikalimat untuk memulai.`
                }, { quoted: global.fVerif });
            }
            return;
        }
        
        if (command === 'hintlk') {
            if (!global.gameLengkapKalimat || !global.gameLengkapKalimat[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Tidak ada game yang sedang berjalan!*\n\nKetik .lengkapikalimat untuk memulai.`
                }, { quoted: global.fVerif });
            }
            
            const jawaban = global.gameLengkapKalimat[chatId].jawaban;
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
        
        if (command === 'lengkapikalimat' || command === 'lengkapin' || command === 'lk') {
            if (global.gameLengkapKalimat[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Masih ada pertanyaan yang belum dijawab!*\nKetik *nyerah* untuk mengakhiri.`
                }, { quoted: global.fVerif });
            }
            
            try {
                const res = await fetch('https://raw.githubusercontent.com/qisyana/scrape/main/lengkapikalimat.json');
                const data = await res.json();
                const randomIndex = Math.floor(Math.random() * data.length);
                const gameData = data[randomIndex];
                
                global.gameLengkapKalimat[chatId] = {
                    jawaban: gameData.jawaban.toLowerCase(),
                    soal: gameData.pertanyaan,
                    aktif: true,
                    timer: null
                };
                
                const text = `╭─────────────────┈ ⊹
│  ✏️ *L E N G K A P I   K A L I M A T* ✏️
│
├─ ❏ ❓ *Soal:*
│     ${gameData.pertanyaan}
│
├─ ❏ ⏰ *Timeout:* 60 detik
├─ ❏ 💡 *Hint:* ${prefix}hintlk
├─ ❏ 🎁 *Bonus:* ${poin} XP
├─ ❏ 😔 *Nyerah:* ketik "nyerah"
│
├─ ❏ 💬 *Ketik kata yang hilang!*
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
                    if (global.gameLengkapKalimat[chatId] && global.gameLengkapKalimat[chatId].aktif) {
                        const jawaban = global.gameLengkapKalimat[chatId].jawaban;
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
                        delete global.gameLengkapKalimat[chatId];
                    }
                }, timeout);
                
                global.gameLengkapKalimat[chatId].timer = timer;
                
            } catch (err) {
                console.error('[LENGKAPI KALIMAT ERROR]', err);
                delete global.gameLengkapKalimat[chatId];
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
        
        if (!global.gameLengkapKalimat || !global.gameLengkapKalimat[chatId]) return;
        if (!global.gameLengkapKalimat[chatId].aktif) return;
        
        let pesan = '';
        if (m.message?.conversation) pesan = m.message.conversation;
        else if (m.msg?.text) pesan = m.msg.text;
        else return;
        
        if (pesan.startsWith('.') || pesan.startsWith('#')) return;
        
        if (pesan.toLowerCase().trim() === 'nyerah') {
            const jawaban = global.gameLengkapKalimat[chatId].jawaban;
            clearTimeout(global.gameLengkapKalimat[chatId].timer);
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
            delete global.gameLengkapKalimat[chatId];
            return;
        }
        
        const jawabanBenar = global.gameLengkapKalimat[chatId].jawaban;
        
        if (pesan.toLowerCase().trim() === jawabanBenar) {
            clearTimeout(global.gameLengkapKalimat[chatId].timer);
            
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
            
            delete global.gameLengkapKalimat[chatId];
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