import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mimosaPath = path.join(__dirname, '../../mimosa.png');

const getThumbnail = () => {
    try {
        return fs.readFileSync(mimosaPath);
    } catch {
        return null;
    }
};

const newsletterConfig = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363369878409989@newsletter',
        serverMessageId: Math.floor(Math.random() * 1000),
        newsletterName: '✨ Mimosa Multi-Device »'
    }
};

export default {
    cmd: ['warn', 'unwarn'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,

    run: async (sock, m, { args, command, participants, groupMetadata }) => {
        const thumbnail = getThumbnail();
        const groupId = m.key.remoteJid;
        const { User } = await import('../../database/schema.js');
        
        let targetJid = null;
        
        if (m.quoted) {
            targetJid = m.quoted.sender;
        } else if (m.mentionedJid && m.mentionedJid[0]) {
            targetJid = m.mentionedJid[0];
        } else if (args[0]) {
            let nomor = args[0].replace(/[^0-9]/g, '');
            targetJid = nomor + '@s.whatsapp.net';
        }
        
        if (!targetJid) {
            const textMsg = `╭─────────────────┈ ⊹
│  ⚠️ *W A R N* ⚠️
│
├─ ❏ 📝 *Cara Penggunaan:*
│     .warn @user
│     .unwarn @user
│
├─ ❏ 📌 *Contoh:*
│     .warn @user
│     .unwarn @user
│
├─ ❏ ⚠️ *Catatan:*
│     • Jika warn mencapai 5
│     • User akan otomatis di-kick
│
╰─────────────────┈ ⊹`;
            
            return sock.sendMessage(groupId, {
                text: textMsg,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Warn System',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        const targetNumber = targetJid.split('@')[0];
        
        let user = await User.findOne({ jid: targetJid });
        if (!user) {
            user = new User({
                jid: targetJid,
                phoneNumber: targetNumber,
                name: targetNumber,
                warning: 0
            });
            await user.save();
        }
        
        const currentWarn = user.warning || 0;
        
        if (command === 'warn') {
            const newWarn = currentWarn + 1;
            
            if (newWarn >= 5) {
                try {
                    await sock.groupParticipantsUpdate(groupId, [targetJid], 'remove');
                    
                    const kickText = `╭─────────────────┈ ⊹
│  🔨 *K I C K* 🔨
│
├─ ❏ 👤 @${targetNumber}
├─ ❏ ⚠️ *Warn mencapai 5/5*
│
├─ ❏ 📝 *Otomatis dikeluarkan*
│     dari grup!
│
╰─────────────────┈ ⊹`;
                    
                    await sock.sendMessage(groupId, {
                        text: kickText,
                        mentions: [targetJid],
                        contextInfo: {
                            ...newsletterConfig,
                            externalAdReply: {
                                title: 'MIMOSA BOT',
                                body: 'Auto Kick',
                                thumbnail: thumbnail,
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: global.fVerif });
                    
                    user.warning = 0;
                    await user.save();
                    
                } catch (err) {
                    await sock.sendMessage(groupId, {
                        text: `❌ *Gagal mengeluarkan @${targetNumber}!\n\nError: ${err.message}`,
                        mentions: [targetJid],
                        contextInfo: {
                            ...newsletterConfig,
                            externalAdReply: {
                                title: 'MIMOSA BOT',
                                body: 'Kick Failed',
                                thumbnail: thumbnail,
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: global.fVerif });
                }
            } else {
                user.warning = newWarn;
                await user.save();
                
                const warnText = `╭─────────────────┈ ⊹
│  ⚠️ *W A R N* ⚠️
│
├─ ❏ 👤 @${targetNumber}
├─ ❏ 📊 *Warn: ${newWarn}/5*
│
├─ ❏ 💡 *Jika sudah 5/5*
│     akan otomatis dikeluarkan
│
╰─────────────────┈ ⊹`;
                
                await sock.sendMessage(groupId, {
                    text: warnText,
                    mentions: [targetJid],
                    contextInfo: {
                        ...newsletterConfig,
                        externalAdReply: {
                            title: 'MIMOSA BOT',
                            body: 'Warning Added',
                            thumbnail: thumbnail,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: global.fVerif });
            }
        }
        
        else if (command === 'unwarn') {
            if (currentWarn <= 0) {
                return sock.sendMessage(groupId, {
                    text: `⚠️ @${targetNumber} *tidak memiliki warn!*`,
                    mentions: [targetJid],
                    contextInfo: {
                        ...newsletterConfig,
                        externalAdReply: {
                            title: 'MIMOSA BOT',
                            body: 'Unwarn',
                            thumbnail: thumbnail,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: global.fVerif });
            }
            
            const newWarn = currentWarn - 1;
            user.warning = newWarn;
            await user.save();
            
            const unwarnText = `╭─────────────────┈ ⊹
│  ✅ *U N W A R N* ✅
│
├─ ❏ 👤 @${targetNumber}
├─ ❏ 📊 *Warn: ${newWarn}/5*
│
╰─────────────────┈ ⊹`;
            
            await sock.sendMessage(groupId, {
                text: unwarnText,
                mentions: [targetJid],
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Warning Removed',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
    }
};