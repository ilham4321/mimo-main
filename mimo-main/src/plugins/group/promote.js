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
    cmd: ['promote', 'jadikanadmin'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,

    run: async (sock, m, { args, isBotAdmin, isOwner, groupMetadata }) => {
        const thumbnail = getThumbnail();
        const groupId = m.key.remoteJid;
        
        // Ambil sender JID
        const senderJid = m.key.participant || m.key.remoteJid;
        const senderNumber = senderJid.split('@')[0];
        
        if (!isBotAdmin && !isOwner) {
            return sock.sendMessage(groupId, { 
                text: `❌ *Bot harus menjadi admin terlebih dahulu!*`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Promote Member',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        let target = null;
        let targetJid = null;
        
        if (m.quoted) {
            targetJid = m.quoted.sender;
            target = targetJid.split('@')[0];
        } else if (args[0]) {
            target = args[0].replace(/[^0-9]/g, '');
            targetJid = target + '@s.whatsapp.net';
        } else if (m.mentionedJid && m.mentionedJid[0]) {
            targetJid = m.mentionedJid[0];
            target = targetJid.split('@')[0];
        }
        
        if (!target) {
            return sock.sendMessage(groupId, { 
                text: `❌ *Tag atau reply target!*\n\n*Contoh:* .promote @user`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Promote Member',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        // Cari JID yang benar dari participants
        let realTargetJid = null;
        for (const p of groupMetadata.participants) {
            if (p.id === targetJid || p.id.includes(target)) {
                realTargetJid = p.id;
                break;
            }
        }
        
        if (!realTargetJid) {
            return sock.sendMessage(groupId, { 
                text: `❌ *Target tidak ditemukan di grup!*\n\n@${target} tidak ada di grup ini.`,
                mentions: [targetJid],
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Promote Failed',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        // Cek apakah target sudah admin
        let isAlreadyAdmin = false;
        for (const p of groupMetadata.participants) {
            if (p.id === realTargetJid) {
                if (p.admin === 'admin' || p.admin === 'superadmin') {
                    isAlreadyAdmin = true;
                }
                break;
            }
        }
        
        if (isAlreadyAdmin) {
            return sock.sendMessage(groupId, { 
                text: `⚠️ *@${target} sudah menjadi admin!*`,
                mentions: [realTargetJid],
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Promote Failed',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        await m.react('⏳');
        
        try {
            await sock.groupParticipantsUpdate(groupId, [realTargetJid], 'promote');
            
            await sock.sendMessage(groupId, { 
                text: `👑 *BERHASIL DIJADIKAN ADMIN!*\n\n┌─❖\n│ 👤 @${target}\n│ └─ Sekarang menjadi admin grup\n│\n├─❖\n│ *Oleh:* @${senderNumber}\n╰─────────────────`,
                mentions: [realTargetJid, senderJid],
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Promote Success',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
            
            await m.react('✅');
            
        } catch (err) {
            console.error('[PROMOTE ERROR]', err);
            
            let errorMsg = err.message;
            if (errorMsg.includes('405')) {
                errorMsg = 'Bot tidak memiliki izin! Pastikan bot adalah admin.';
            } else if (errorMsg.includes('409')) {
                errorMsg = 'Target sudah menjadi admin!';
            } else if (errorMsg.includes('500')) {
                errorMsg = 'Internal server error. Coba lagi nanti.';
            }
            
            await sock.sendMessage(groupId, { 
                text: `❌ *GAGAL MENJADIKAN ADMIN!*\n\n┌─❖\n│ 👤 @${target}\n│\n├─❖\n│ *Error:* ${errorMsg}\n╰─────────────────`,
                mentions: [realTargetJid],
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Promote Failed',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
            
            await m.react('❌');
        }
    }
};