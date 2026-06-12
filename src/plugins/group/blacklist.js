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

// Ekstrak nomor dari JID (apapun formatnya)
const extractNumber = (jid) => {
    if (!jid) return null;
    if (typeof jid !== 'string') return null;
    // Hapus device ID :XX@
    let cleaned = jid.replace(/:\d+@/, '@');
    // Ambil angka sebelum @
    let number = cleaned.split('@')[0];
    // Hanya angka
    number = number.replace(/[^0-9]/g, '');
    return number;
};

export default {
    cmd: ['blacklist', 'unblacklist', 'listbl', 'listblacklist'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,

    run: async (sock, m, { args, command, groupMetadata }) => {
        const { Group } = await import('../../database/schema.js');
        const groupId = m.key.remoteJid;
        const thumbnail = getThumbnail();
        
        let groupData = await Group.findOne({ id: groupId });
        if (!groupData) {
            groupData = new Group({ id: groupId });
            await groupData.save();
        }
        
        let blacklist = groupData.blacklist || [];
        
        let targetNumber = null;
        let targetJid = null;
        
        if (m.quoted) {
            targetJid = m.quoted.sender;
            targetNumber = extractNumber(targetJid);
        } else if (args[0]) {
            targetNumber = args[0].replace(/[^0-9]/g, '');
            targetJid = targetNumber + '@s.whatsapp.net';
        } else if (m.mentionedJid && m.mentionedJid[0]) {
            targetJid = m.mentionedJid[0];
            targetNumber = extractNumber(targetJid);
        }
        
        const allMembers = groupMetadata.participants.map(p => p.id);
        
        // BLACKLIST
        if (command === 'blacklist') {
            if (!targetNumber) {
                return sock.sendMessage(groupId, { 
                    text: `❌ *Tag atau reply target!*\n\nContoh: .blacklist @user`,
                    mentions: allMembers,
                    contextInfo: {
                        externalAdReply: {
                            title: 'MIMOSA BOT',
                            body: 'Blacklist Member',
                            thumbnail: thumbnail,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: global.fVerif });
            }
            
            const alreadyBlacklist = blacklist.find(v => v.number === targetNumber);
            if (alreadyBlacklist) {
                return sock.sendMessage(groupId, { 
                    text: `⚠️ @${targetNumber} *sudah ada di blacklist!*`,
                    mentions: [targetJid],
                    contextInfo: {
                        externalAdReply: {
                            title: 'MIMOSA BOT',
                            body: 'Blacklist Member',
                            thumbnail: thumbnail,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: global.fVerif });
            }
            
            blacklist.unshift({ number: targetNumber, jid: targetJid, time: Date.now() });
            groupData.blacklist = blacklist;
            await groupData.save();
            
            await sock.sendMessage(groupId, { 
                text: `✅ @${targetNumber} *ditambahkan ke blacklist!*\n\nMember ini tidak bisa mengirim pesan di grup.`,
                mentions: [targetJid],
                contextInfo: {
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Blacklist Added',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        // UNBLACKLIST
        else if (command === 'unblacklist') {
            if (!targetNumber) {
                return sock.sendMessage(groupId, { 
                    text: `❌ *Tag atau reply target!*\n\nContoh: .unblacklist @user`,
                    mentions: allMembers,
                    contextInfo: {
                        externalAdReply: {
                            title: 'MIMOSA BOT',
                            body: 'Unblacklist Member',
                            thumbnail: thumbnail,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: global.fVerif });
            }
            
            const findIndex = blacklist.findIndex(v => v.number === targetNumber);
            if (findIndex === -1) {
                return sock.sendMessage(groupId, { 
                    text: `⚠️ @${targetNumber} *tidak ada di blacklist!*`,
                    mentions: [targetJid],
                    contextInfo: {
                        externalAdReply: {
                            title: 'MIMOSA BOT',
                            body: 'Unblacklist Member',
                            thumbnail: thumbnail,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: global.fVerif });
            }
            
            blacklist.splice(findIndex, 1);
            groupData.blacklist = blacklist;
            await groupData.save();
            
            await sock.sendMessage(groupId, { 
                text: `✅ @${targetNumber} *dihapus dari blacklist!*\n\nMember sekarang bisa mengirim pesan lagi.`,
                mentions: [targetJid],
                contextInfo: {
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Unblacklist Success',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        // LIST BLACKLIST
        else if (command === 'listbl' || command === 'listblacklist') {
            if (blacklist.length === 0) {
                return sock.sendMessage(groupId, { 
                    text: `📋 *BLACKLIST EMPTY*\n\nTidak ada member yang diblacklist di grup ini.`,
                    contextInfo: {
                        externalAdReply: {
                            title: 'MIMOSA BOT',
                            body: 'Blacklist List',
                            thumbnail: thumbnail,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: global.fVerif });
            }
            
            let txt = `📋 *DAFTAR BLACKLIST*\n\n┌─❖\n│ *Total:* ${blacklist.length}\n│\n`;
            for (let i of blacklist) {
                const date = new Date(i.time);
                const waktu = `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`;
                txt += `├─ @${i.number}\n│  └─ Sejak: ${waktu}\n`;
            }
            txt += `╰─────────────────`;
            
            const mentionList = blacklist.map(v => v.jid || v.number + '@s.whatsapp.net');
            
            await sock.sendMessage(groupId, { 
                text: txt,
                mentions: mentionList,
                contextInfo: {
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Blacklist Members',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
    },
    
    // Cek pesan dari member yang di-blacklist
    all: async (sock, m, { isGroup, isAdmin, isOwner }) => {
        if (!isGroup) {
            return;
        }
        
        if (isAdmin || isOwner) {
            return;
        }
        
        const { Group } = await import('../../database/schema.js');
        const groupId = m.key.remoteJid;
        
        const senderJidRaw = m.key.participant || m.sender || m.key.remoteJid;
        if (!senderJidRaw || senderJidRaw.includes('@g.us')) {
            return;
        }
        
        const senderNumber = extractNumber(senderJidRaw);
        
        const groupData = await Group.findOne({ id: groupId });
        if (!groupData) {
            return;
        }
        
        const blacklist = groupData.blacklist || [];
        const isBlacklisted = blacklist.find(v => v.number === senderNumber);
        
        if (isBlacklisted) {
            try {
                await sock.sendMessage(groupId, { delete: m.key });
                await sock.sendMessage(groupId, { 
                    text: `🚫 *ANDA DIBLACKLIST!*\n\n@${senderNumber} tidak bisa mengirim pesan di grup ini.\n\nHubungi admin untuk di-unblacklist.`,
                    mentions: [senderJidRaw]
                }, { quoted: global.fVerif });
            } catch (err) {
                console.error('[BLACKLIST] Error:', err);
            }
        }
    }
};