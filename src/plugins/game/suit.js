import { User } from '../../database/schema.js';

let poin = 1000;

global.gameSuit = global.gameSuit || {};

const normalizeJid = (jid) => {
    if (!jid) return null;
    return jid.replace(/:\d+@/, '@');
};

const getPnFromLid = async (sock, lidJid) => {
    if (!lidJid) return null;
    const normalizedLid = normalizeJid(lidJid);
    if (!normalizedLid.includes('@lid')) return normalizedLid;
    try {
        const pn = await sock.signalRepository?.lidMapping?.getPNForLID(normalizedLid);
        if (pn) return normalizeJid(pn);
    } catch (err) {}
    return normalizedLid;
};

const getLidFromPn = async (sock, pnJid) => {
    if (!pnJid) return null;
    const normalizedPn = normalizeJid(pnJid);
    if (!normalizedPn.includes('@s.whatsapp.net')) return normalizedPn;
    try {
        const lid = await sock.signalRepository?.lidMapping?.getLIDForPN(normalizedPn);
        if (lid) return normalizeJid(lid);
    } catch (err) {}
    return normalizedPn;
};

const getJidFromGroup = async (sock, groupId, targetJid) => {
    try {
        const metadata = await sock.groupMetadata(groupId);
        const targetNumber = targetJid.split('@')[0].replace(/[^0-9]/g, '');
        const participant = metadata.participants.find(p => {
            const pNumber = p.id.split('@')[0].replace(/[^0-9]/g, '');
            return pNumber === targetNumber;
        });
        if (participant) return participant.id;
    } catch (err) {}
    return targetJid;
};

const isSameJid = async (sock, jid1, jid2) => {
    if (!jid1 || !jid2) return false;
    
    const norm1 = normalizeJid(jid1);
    const norm2 = normalizeJid(jid2);
    
    if (norm1 === norm2) return true;
    
    const pn1 = await getPnFromLid(sock, norm1);
    const pn2 = await getPnFromLid(sock, norm2);
    if (pn1 && pn2 && normalizeJid(pn1) === normalizeJid(pn2)) return true;
    
    const lid1 = await getLidFromPn(sock, norm1);
    const lid2 = await getLidFromPn(sock, norm2);
    if (lid1 && lid2 && normalizeJid(lid1) === normalizeJid(lid2)) return true;
    
    const extractNumber = (jid) => {
        const normalized = normalizeJid(jid);
        return normalized.split('@')[0].replace(/[^0-9]/g, '');
    };
    
    const num1 = extractNumber(norm1);
    const num2 = extractNumber(norm2);
    if (num1 && num2 && num1 === num2) return true;
    
    return false;
};

export default {
    cmd: ['suit', 'suitpvp'],
    tags: ['game'],
    limit: false,
    group: true,

    run: async (sock, m, { user, args, command, prefix }) => {
        const chatId = m.key.remoteJid;
        const rawSenderId = m.key.participant || m.sender || m.key.remoteJid;
        const senderId = normalizeJid(rawSenderId);
        const senderNumber = senderId.split('@')[0];
        
        if (command === 'suitpvp') {
            let opponent = null;
            let opponentId = null;
            
            if (m.quoted) {
                opponentId = normalizeJid(m.quoted.sender);
                opponent = opponentId.split('@')[0];
            } else if (args[0]) {
                opponent = args[0].replace(/[^0-9]/g, '');
                opponentId = opponent + '@s.whatsapp.net';
                opponentId = normalizeJid(opponentId);
            } else if (m.mentionedJid && m.mentionedJid[0]) {
                opponentId = normalizeJid(m.mentionedJid[0]);
                opponent = opponentId.split('@')[0];
            }
            
            if (!opponent) {
                return sock.sendMessage(chatId, {
                    text: `╭─────────────────┈ ⊹
│  ✂️ *S U I T   P V P* ✂️
│
├─ ❏ 📝 Cara: ${prefix}suitpvp @user
├─ ❏ 🎁 Hadiah: +${poin} Money
│
╰─────────────────┈ ⊹`
                }, { quoted: global.fVerif });
            }
            
            const isSelf = await isSameJid(sock, opponentId, senderId);
            if (isSelf) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Tidak bisa dengan diri sendiri!*`
                }, { quoted: global.fVerif });
            }
            
            if (global.gameSuit[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Masih ada permainan!* Tunggu selesai.`
                }, { quoted: global.fVerif });
            }
            
            let opponentUser = await User.findOne({ jid: opponentId });
            if (!opponentUser) {
                opponentUser = new User({
                    jid: opponentId,
                    phoneNumber: opponent,
                    name: opponent,
                    warning: 0
                });
                await opponentUser.save();
            }
            
            const player1RealJid = await getJidFromGroup(sock, chatId, senderId);
            const player2RealJid = await getJidFromGroup(sock, chatId, opponentId);
            
            const player1Lid = await getLidFromPn(sock, player1RealJid) || player1RealJid;
            const player2Lid = await getLidFromPn(sock, player2RealJid) || player2RealJid;
            
            global.gameSuit[chatId] = {
                player1: player1Lid,
                player2: player2Lid,
                player1Choice: null,
                player2Choice: null,
                step: 'waiting_confirmation',
                timer: null
            };
            
            await sock.sendMessage(chatId, {
                text: `╭─────────────────┈ ⊹
│  ✂️ *S U I T   P V P* ✂️
│
├─ ❏ 👤 *P1:* @${senderNumber}
├─ ❏ 👤 *P2:* @${opponent}
│
├─ ❏ 📝 *@${opponent}, terima tantangan?*
│
├─ ❏ ✅ *Terima:* ${prefix}suit terima
├─ ❏ ❌ *Tolak:* ${prefix}suit tolak
│
├─ ❏ ⏰ *Timeout:* 30 detik
│
╰─────────────────┈ ⊹`,
                mentions: [player1Lid, player2Lid],
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
                if (global.gameSuit[chatId]) {
                    await sock.sendMessage(chatId, {
                        text: `⏰ *WAKTU HABIS!*\nTantangan dibatalkan.`
                    }, { quoted: global.fVerif });
                    delete global.gameSuit[chatId];
                }
            }, 30000);
            
            global.gameSuit[chatId].timer = timer;
            return;
        }
        
        if (command === 'suit' && args[0] === 'terima') {
            if (!global.gameSuit[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Tidak ada tantangan aktif!*`
                }, { quoted: global.fVerif });
            }
            
            const game = global.gameSuit[chatId];
            const rawSender = m.key.participant || m.sender || m.key.remoteJid;
            const senderNorm = normalizeJid(rawSender);
            const senderLid = await getLidFromPn(sock, senderNorm) || senderNorm;
            
            const isPlayer2 = await isSameJid(sock, senderLid, game.player2);
            
            if (!isPlayer2) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Tantangan ini bukan untukmu!*`
                }, { quoted: global.fVerif });
            }
            
            if (game.step !== 'waiting_confirmation') {
                return sock.sendMessage(chatId, {
                    text: `❌ *Tantangan sudah diproses!*`
                }, { quoted: global.fVerif });
            }
            
            clearTimeout(game.timer);
            game.step = 'waiting_both';
            
            await sock.sendMessage(chatId, {
                text: `✅ *@${game.player2.split('@')[0]} menerima tantangan!*\n\n🎮 Game dimulai! Kirim pilihan via PC.`,
                mentions: [game.player2],
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
            
            try {
                await sock.sendMessage(game.player1, {
                    text: `╭─────────────────┈ ⊹
│  ✂️ *S U I T   P V P* ✂️
│
├─ ❏ 👤 *Lawan:* @${game.player2.split('@')[0]}
├─ ❏ 💰 *Taruhan:* ${poin} Money
│
├─ ❏ 📝 *Kirim pilihan ke PC ini:*
│     batu / gunting / kertas
│
├─ ❏ ⏰ *Timeout:* 30 detik
│
╰─────────────────┈ ⊹`
                }, { quoted: global.fVerif });
            } catch (err) {
                console.log('[SUIT] Gagal kirim ke player1:', err.message);
            }
            
            try {
                await sock.sendMessage(game.player2, {
                    text: `╭─────────────────┈ ⊹
│  ✂️ *S U I T   P V P* ✂️
│
├─ ❏ 👤 *Lawan:* @${game.player1.split('@')[0]}
├─ ❏ 💰 *Taruhan:* ${poin} Money
│
├─ ❏ 📝 *Kirim pilihan ke PC ini:*
│     batu / gunting / kertas
│
├─ ❏ ⏰ *Timeout:* 30 detik
│
╰─────────────────┈ ⊹`
                }, { quoted: global.fVerif });
            } catch (err) {
                console.log('[SUIT] Gagal kirim ke player2:', err.message);
                await sock.sendMessage(chatId, {
                    text: `⚠️ *@${game.player2.split('@')[0]}*, bot tidak bisa mengirim pesan ke PC kamu!\n\nSilakan kirim pilihan langsung di grup ini:\n*batu* / *gunting* / *kertas*\n\n⏰ Timeout: 30 detik`,
                    mentions: [game.player2],
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
                if (global.gameSuit[chatId] && global.gameSuit[chatId].step === 'waiting_both') {
                    await sock.sendMessage(chatId, {
                        text: `⏰ *WAKTU HABIS!*\nGame dibatalkan karena tidak ada pilihan.`
                    }, { quoted: global.fVerif });
                    delete global.gameSuit[chatId];
                }
            }, 30000);
            
            game.timer = timer;
            return;
        }
        
        if (command === 'suit' && args[0] === 'tolak') {
            if (!global.gameSuit[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Tidak ada tantangan aktif!*`
                }, { quoted: global.fVerif });
            }
            
            const game = global.gameSuit[chatId];
            const rawSender = m.key.participant || m.sender || m.key.remoteJid;
            const senderNorm = normalizeJid(rawSender);
            const senderLid = await getLidFromPn(sock, senderNorm) || senderNorm;
            
            const isPlayer2 = await isSameJid(sock, senderLid, game.player2);
            
            if (!isPlayer2) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Tantangan ini bukan untukmu!*`
                }, { quoted: global.fVerif });
            }
            
            clearTimeout(game.timer);
            
            await sock.sendMessage(chatId, {
                text: `❌ *@${game.player2.split('@')[0]} menolak tantangan!*\nGame dibatalkan.`,
                mentions: [game.player2],
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
            
            delete global.gameSuit[chatId];
            return;
        }
        
        if (command === 'suit') {
            if (!args[0]) {
                return sock.sendMessage(chatId, {
                    text: `╭─────────────────┈ ⊹
│  ✂️ *S U I T* ✂️
│
├─ ❏ 📝 Pilihan: gunting, kertas, batu
├─ ❏ 📌 Contoh: ${prefix}suit batu
├─ ❏ 🎁 Hadiah: +${poin} Money
├─ ❏ 👥 PVP: ${prefix}suitpvp @user
│
╰─────────────────┈ ⊹`
                }, { quoted: global.fVerif });
            }
            
            let pilihan = args[0].toLowerCase();
            
            if (pilihan !== 'gunting' && pilihan !== 'kertas' && pilihan !== 'batu') {
                return sock.sendMessage(chatId, {
                    text: `❌ *Pilihan tidak valid!*\nPilihan: gunting, kertas, batu`
                }, { quoted: global.fVerif });
            }
            
            const random = Math.random();
            let botChoice;
            
            if (random < 0.34) {
                botChoice = 'batu';
            } else if (random > 0.34 && random < 0.67) {
                botChoice = 'gunting';
            } else {
                botChoice = 'kertas';
            }
            
            let win = false;
            
            if (pilihan === botChoice) {
                win = null;
            } else if (pilihan === 'batu') {
                win = botChoice === 'gunting';
            } else if (pilihan === 'gunting') {
                win = botChoice === 'kertas';
            } else if (pilihan === 'kertas') {
                win = botChoice === 'batu';
            }
            
            if (win === true) {
                if (!user.rpg) user.rpg = {};
                user.rpg.money = (user.rpg.money || 0) + poin;
                await user.save();
                
                await sock.sendMessage(chatId, {
                    text: `🎉 *KAMU MENANG!*\n🎲 Kamu: ${pilihan}\n🤖 Bot: ${botChoice}\n💰 +Rp${poin.toLocaleString()}`
                }, { quoted: global.fVerif });
            } else if (win === false) {
                await sock.sendMessage(chatId, {
                    text: `💀 *KAMU KALAH!*\n🎲 Kamu: ${pilihan}\n🤖 Bot: ${botChoice}`
                }, { quoted: global.fVerif });
            } else {
                await sock.sendMessage(chatId, {
                    text: `🤝 *SERI!*\n🎲 Kamu: ${pilihan}\n🤖 Bot: ${botChoice}`
                }, { quoted: global.fVerif });
            }
            return;
        }
    },
    
    all: async (sock, m) => {
        const rawSenderId = m.key.participant || m.sender || m.key.remoteJid;
        const senderId = normalizeJid(rawSenderId);
        const senderLid = await getLidFromPn(sock, senderId) || senderId;
        
        let pesan = '';
        if (m.message?.conversation) pesan = m.message.conversation;
        else if (m.msg?.text) pesan = m.msg.text;
        else return;
        
        const pilihan = pesan.trim().toLowerCase();
        
        if (pilihan !== 'batu' && pilihan !== 'gunting' && pilihan !== 'kertas') return;
        if (pesan.startsWith('.') || pesan.startsWith('#')) return;
        
        for (const [groupId, game] of Object.entries(global.gameSuit || {})) {
            if (game.step !== 'waiting_both') continue;
            
            const isPlayer1 = await isSameJid(sock, senderLid, game.player1);
            const isPlayer2 = await isSameJid(sock, senderLid, game.player2);
            
            if (!isPlayer1 && !isPlayer2) continue;
            
            if (isPlayer1) {
                if (game.player1Choice !== null) {
                    await sock.sendMessage(senderId, {
                        text: `⚠️ *Kamu sudah mengirim pilihan!* Tunggu lawan.`
                    }, { quoted: global.fVerif });
                    return;
                }
                game.player1Choice = pilihan;
                await sock.sendMessage(senderId, {
                    text: `✅ *Pilihan "${pilihan}" diterima!*\nMenunggu pilihan lawan...`
                }, { quoted: global.fVerif });
            } else if (isPlayer2) {
                if (game.player2Choice !== null) {
                    await sock.sendMessage(senderId, {
                        text: `⚠️ *Kamu sudah mengirim pilihan!* Tunggu lawan.`
                    }, { quoted: global.fVerif });
                    return;
                }
                game.player2Choice = pilihan;
                await sock.sendMessage(senderId, {
                    text: `✅ *Pilihan "${pilihan}" diterima!*\nMenunggu pilihan lawan...`
                }, { quoted: global.fVerif });
            }
            
            if (game.player1Choice !== null && game.player2Choice !== null) {
                clearTimeout(game.timer);
                
                let result = '';
                let winner = null;
                
                if (game.player1Choice === game.player2Choice) {
                    result = 'SERI!';
                    winner = null;
                } else if (game.player1Choice === 'batu') {
                    if (game.player2Choice === 'gunting') {
                        result = 'PEMAIN 1 MENANG!';
                        winner = game.player1;
                    } else {
                        result = 'PEMAIN 2 MENANG!';
                        winner = game.player2;
                    }
                } else if (game.player1Choice === 'gunting') {
                    if (game.player2Choice === 'kertas') {
                        result = 'PEMAIN 1 MENANG!';
                        winner = game.player1;
                    } else {
                        result = 'PEMAIN 2 MENANG!';
                        winner = game.player2;
                    }
                } else if (game.player1Choice === 'kertas') {
                    if (game.player2Choice === 'batu') {
                        result = 'PEMAIN 1 MENANG!';
                        winner = game.player1;
                    } else {
                        result = 'PEMAIN 2 MENANG!';
                        winner = game.player2;
                    }
                }
                
                const winnerPn = winner ? await getPnFromLid(sock, winner) : null;
                const winnerNumber = winnerPn ? winnerPn.split('@')[0] : (winner ? winner.split('@')[0] : null);
                
                let text = `╭─────────────────┈ ⊹
│  ✂️ *S U I T   P V P* ✂️
│
├─ ❏ 👤 P1: ${game.player1Choice}
├─ ❏ 👤 P2: ${game.player2Choice}
│
├─ ❏ 📊 *Hasil: ${result}*
│
╰─────────────────┈ ⊹`;
                
                if (winner) {
                    const winnerUser = await User.findOne({ jid: winner });
                    
                    if (winnerUser) {
                        if (!winnerUser.rpg) winnerUser.rpg = {};
                        winnerUser.rpg.money = (winnerUser.rpg.money || 0) + poin;
                        await winnerUser.save();
                    }
                    
                    text = `╭─────────────────┈ ⊹
│  ✂️ *S U I T   P V P* ✂️
│
├─ ❏ 👤 P1: ${game.player1Choice}
├─ ❏ 👤 P2: ${game.player2Choice}
│
├─ ❏ 🎉 *${result}*
├─ ❏ 👑 Pemenang: @${winnerNumber}
├─ ❏ 💰 Hadiah: +Rp${poin.toLocaleString()}
│
╰─────────────────┈ ⊹`;
                }
                
                const mentionList = [game.player1, game.player2].filter(Boolean);
                
                await sock.sendMessage(groupId, {
                    text: text,
                    mentions: mentionList,
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
                
                delete global.gameSuit[groupId];
            }
        }
    }
};