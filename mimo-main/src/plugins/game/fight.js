// plugins/game/fight.js
import { User } from '../../database/schema.js';

global.gameFight = global.gameFight || {};

export default {
    cmd: ['fight', 'bertarung'],
    tags: ['game'],
    limit: false,
    group: true,

    run: async (sock, m, { user, args, command }) => {
        const chatId = m.key.remoteJid;
        const senderId = m.key.participant || m.sender || m.key.remoteJid;
        const senderNumber = senderId.split('@')[0];
        
        let opponent = null;
        let opponentId = null;
        
        if (m.quoted) {
            opponentId = m.quoted.sender;
            opponent = opponentId.split('@')[0];
        } else if (args[0]) {
            opponent = args[0].replace(/[^0-9]/g, '');
            opponentId = opponent + '@s.whatsapp.net';
        } else if (m.mentionedJid && m.mentionedJid[0]) {
            opponentId = m.mentionedJid[0];
            opponent = opponentId.split('@')[0];
        }
        
        if (!opponent) {
            return sock.sendMessage(chatId, {
                text: `❌ *Contoh:* ${command} @user\nAtau reply pesan target`,
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
        
        if (opponentId === senderId) {
            return sock.sendMessage(chatId, {
                text: `❌ *Tidak bisa bertarung dengan diri sendiri!*`,
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
        
        let opponentUser = await User.findOne({ jid: opponentId });
        if (!opponentUser) {
            opponentUser = new User({
                jid: opponentId,
                phoneNumber: opponent,
                name: opponent,
                warning: 0,
                lastFight: 0
            });
            await opponentUser.save().catch(async (err) => {
                if (err.code === 11000) {
                    opponentUser = await User.findOne({ jid: opponentId });
                }
            });
        }
        
        const now = Date.now();
        const lastFight = user.lastFight || 0;
        const cooldown = 10000;
        
        if (lastFight !== 0 && (now - lastFight) < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastFight)) / 1000);
            return sock.sendMessage(chatId, {
                text: `⏰ *COOLDOWN!* Tunggu ${remaining} detik lagi.`,
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
        
        const userMoney = user.rpg?.money || 0;
        const maxBet = Math.min(userMoney, 10000000);
        const minBet = Math.min(10000, maxBet);
        
        const betAmount = Math.floor(Math.random() * (maxBet - minBet + 1)) + minBet;
        
        if (userMoney < 10000) {
            return sock.sendMessage(chatId, {
                text: `❌ *Uang kamu tidak cukup untuk bertarung!*\n💰 Uang: Rp${userMoney.toLocaleString()}\n🎲 Minimal taruhan: Rp10.000`,
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
        
        user.rpg.money = userMoney - betAmount;
        await user.save();
        
        const initialText = `⚔️ *ARENA BERTARUNG* ⚔️\n\n👤 @${senderNumber} vs 👤 @${opponent}\n\n💰 *Taruhan:* Rp${betAmount.toLocaleString()}\n\n⏳ Mempersiapkan arena...`;
        
        const msg = await sock.sendMessage(chatId, {
            text: initialText,
            mentions: [senderId, opponentId],
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
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await sock.sendMessage(chatId, {
            text: `🎯 *MENCARI ARENA...*\n\nMencari lokasi pertarungan yang cocok...`,
            edit: msg.key,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363369878409989@newsletter',
                    serverMessageId: Math.floor(Math.random() * 1000),
                    newsletterName: '✨ Mimosa Multi-Device »'
                }
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await sock.sendMessage(chatId, {
            text: `💥 *BERTARUNG!*\n\n👤 @${senderNumber} vs 👤 @${opponent}\n\n💰 *Taruhan:* Rp${betAmount.toLocaleString()}\n\nKeduanya saling menyerang dengan hebat!`,
            edit: msg.key,
            mentions: [senderId, opponentId],
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363369878409989@newsletter',
                    serverMessageId: Math.floor(Math.random() * 1000),
                    newsletterName: '✨ Mimosa Multi-Device »'
                }
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const playerWin = Math.random() >= 0.5;
        
        const alasanMenang = [
            'kamu berhasil menggunakan kekuatan elemental untuk menghancurkan pertahanan lawan',
            'kamu berhasil melancarkan serangan mematikan dengan gerakan akrobatik',
            'kamu berhasil menang karena strategi yang brilian',
            'kamu berhasil mengalahkan lawan dengan pukulan telak',
            'kamu berhasil menang karena semangat juang yang tinggi',
            'kamu berhasil melancarkan kombo serangan yang mematikan'
        ];
        
        const alasanKalah = [
            'kamu kurang beruntung dalam pertarungan ini',
            'lawan berhasil membacah semua gerakanmu',
            'kamu kecapekan setelah serangan bertubi-tubi',
            'kamu gagal menghindari serangan pamungkas lawan',
            'lawan memiliki kekuatan yang lebih besar',
            'kamu kurang fokus dalam bertarung'
        ];
        
        let resultText = '';
        
        if (playerWin) {
            const winAmount = betAmount * 2;
            user.rpg.money = (user.rpg.money || 0) + winAmount;
            if (!opponentUser.rpg) opponentUser.rpg = {};
            opponentUser.rpg.money = (opponentUser.rpg.money || 0) - betAmount;
            await user.save();
            await opponentUser.save();
            
            const alasan = alasanMenang[Math.floor(Math.random() * alasanMenang.length)];
            
            resultText = `╭─────────────────┈ ⊹
│  🏆 *V I C T O R Y !* 🏆
│
├─ ❏ 👤 *Pemenang:* @${senderNumber}
├─ ❏ 👤 *Kalah:* @${opponent}
│
├─ ❏ 💥 ${alasan}
│
├─ ❏ 💰 *Menang:* +Rp${winAmount.toLocaleString()}
├─ ❏ 💸 *Sisa uang:* Rp${(user.rpg.money || 0).toLocaleString()}
│
╰─────────────────┈ ⊹`;
        } else {
            if (!opponentUser.rpg) opponentUser.rpg = {};
            opponentUser.rpg.money = (opponentUser.rpg.money || 0) + betAmount;
            await opponentUser.save();
            
            const alasan = alasanKalah[Math.floor(Math.random() * alasanKalah.length)];
            
            resultText = `╭─────────────────┈ ⊹
│  💀 *D E F E A T !* 💀
│
├─ ❏ 👤 *Kalah:* @${senderNumber}
├─ ❏ 👤 *Pemenang:* @${opponent}
│
├─ ❏ 💥 ${alasan}
│
├─ ❏ 💸 *Kalah:* -Rp${betAmount.toLocaleString()}
├─ ❏ 💰 *Sisa uang:* Rp${(user.rpg.money || 0).toLocaleString()}
│
╰─────────────────┈ ⊹`;
        }
        
        // KIRIM PESAN HASIL TERPISAH (JANGAN DI EDIT)
        await sock.sendMessage(chatId, {
            text: resultText,
            mentions: [senderId, opponentId],
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
        
        user.lastFight = now;
        await user.save();
        
        await sock.sendMessage(chatId, {
            text: `⏰ *Cooldown 10 detik!* Kamu bisa bertarung lagi pukul ${new Date(now + cooldown).toLocaleTimeString()}.`,
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