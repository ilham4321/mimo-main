import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mimosaPath = path.join(__dirname, '../../mimosa.png');

const getThumbnail = () => {
    try {
        return fs.readFileSync(mimosaPath);
    } catch {
        return null;
    }
};

export default {
    cmd: ['mute', 'unmute', 'mutetime'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,

    run: async (sock, m, { args, command }) => {
        const { Group } = await import('../../database/schema.js');
        const groupId = m.key.remoteJid;
        
        let groupData = await Group.findOne({ id: groupId });
        if (!groupData) {
            groupData = new Group({ id: groupId });
            await groupData.save();
        }
        
        if (command === 'mutetime' || (command === 'mute' && args[0] && !isNaN(args[0]))) {
            let duration = parseInt(args[0]);
            let unit = args[1] || 'm';
            
            if (unit === 'h') duration = duration * 60 * 60 * 1000;
            else if (unit === 'm') duration = duration * 60 * 1000;
            else if (unit === 's') duration = duration * 1000;
            else duration = duration * 60 * 1000;
            
            if (duration <= 0) return m.reply('❌ Durasi tidak valid!');
            
            groupData.mute = true;
            groupData.muteUntil = Date.now() + duration;
            await groupData.save();
            
            const durationText = `${args[0]} ${unit === 'h' ? 'jam' : unit === 'm' ? 'menit' : 'detik'}`;
            const thumbnail = getThumbnail();
            
            await sock.sendMessage(groupId, { 
                text: `🔇 *GRUP DI MUTE!*\n\n┌─❖\n│ ⏰ Durasi: ${durationText}\n│ 👥 Hanya admin bisa chat\n│\n├─❖\n│ *Akan unmute otomatis*\n│ setelah waktu habis.\n╰─────────────────`,
                contextInfo: {
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: `Muted for ${durationText}`,
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fkon });
            
            setTimeout(async () => {
                const checkGroup = await Group.findOne({ id: groupId });
                if (checkGroup && checkGroup.mute && checkGroup.muteUntil <= Date.now()) {
                    checkGroup.mute = false;
                    checkGroup.muteUntil = null;
                    await checkGroup.save();
                    
                    await sock.sendMessage(groupId, { 
                        text: `🔊 *GRUP DI UNMUTE OTOMATIS!*\n\n┌─❖\n│ Waktu mute telah habis.\n│ Semua anggota bisa chat kembali.\n╰─────────────────`,
                        contextInfo: {
                            externalAdReply: {
                                title: 'MIMOSA BOT',
                                body: 'Auto Unmuted',
                                thumbnail: thumbnail,
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: global.fkon });
                }
            }, duration);
        }
        
        else if (command === 'mute') {
            if (groupData.mute && !groupData.muteUntil) {
                return m.reply(`🔇 *Grup sudah dalam keadaan MUTE!*`);
            }
            
            groupData.mute = true;
            groupData.muteUntil = null;
            await groupData.save();
            
            const thumbnail = getThumbnail();
            
            await sock.sendMessage(groupId, { 
                text: `🔇 *GRUP DI MUTE!*\n\n┌─❖\n│ Semua anggota NON-ADMIN\n│ tidak bisa mengirim pesan.\n│\n├─❖\n│ *Untuk mengaktifkan:*\n│ └─ .unmute\n╰─────────────────`,
                contextInfo: {
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Group Muted',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fkon });
        } 
        
        else if (command === 'unmute') {
            if (!groupData.mute) {
                return m.reply(`🔊 *Grup sudah dalam keadaan UNMUTE!*`);
            }
            
            groupData.mute = false;
            groupData.muteUntil = null;
            await groupData.save();
            
            const thumbnail = getThumbnail();
            
            await sock.sendMessage(groupId, { 
                text: `🔊 *GRUP DI UNMUTE!*\n\n┌─❖\n│ Semua anggota sudah bisa\n│ mengirim pesan kembali.\n╰─────────────────`,
                contextInfo: {
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Group Unmuted',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fkon });
        }
    },
    
    all: async (sock, m, { isGroup, isAdmin, isBotAdmin }) => {
        if (!isGroup) return;
        if (isAdmin) return;
        
        const { Group } = await import('../../database/schema.js');
        const groupId = m.key.remoteJid;
        
        const groupData = await Group.findOne({ id: groupId });
        if (!groupData || !groupData.mute) return;
        
        if (groupData.muteUntil && groupData.muteUntil <= Date.now()) {
            groupData.mute = false;
            groupData.muteUntil = null;
            await groupData.save();
            return;
        }
        
        if (!isBotAdmin) return;
        
        await sock.sendMessage(groupId, { delete: m.key });
        await sock.sendMessage(groupId, { 
            text: `🔇 *Grup sedang MUTE!*\n@${m.sender.split('@')[0]} tidak bisa mengirim pesan.`,
            mentions: [m.sender]
        }, { quoted: global.fkon });
    }
};