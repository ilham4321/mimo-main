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
    cmd: ['linkgc'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,

    run: async (sock, m, { groupMetadata, isBotAdmin }) => {
        const thumbnail = getThumbnail();
        
        if (!isBotAdmin) {
            return sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Bot harus menjadi admin grup!*\n\nJadikan bot sebagai admin terlebih dahulu.`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Link Group',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        try {
            const groupId = m.key.remoteJid;
            const inviteCode = await sock.groupInviteCode(groupId);
            const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
            const groupName = groupMetadata.subject || 'Grup';
            const memberCount = groupMetadata.participants.length;
            
            const text = `✨ *L I N K   G R U P* ✨

┌───────────────────
│ 📛 *Nama Grup:* ${groupName}
│ 👥 *Member:* ${memberCount}
│
│ 🔗 *Link Undangan:*
│ ${inviteLink}
│
│ ⚠️ *Catatan:*
│ • Link ini bisa dibagikan
│ • Kapan saja bisa di-reset
└───────────────────`;
            
            await sock.sendMessage(m.key.remoteJid, {
                text: text,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Group Invite Link',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
            
        } catch (err) {
            console.error('[LINK GC ERROR]', err);
            
            let errorMsg = err.message;
            if (errorMsg.includes('405')) {
                errorMsg = 'Bot tidak memiliki izin! Pastikan bot adalah admin.';
            } else if (errorMsg.includes('404')) {
                errorMsg = 'Grup tidak ditemukan!';
            } else if (errorMsg.includes('group')) {
                errorMsg = 'Gagal mendapatkan link. Coba lagi nanti.';
            }
            
            await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Gagal membuat link undangan!*\n\n*Error:* ${errorMsg}`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Link Group',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
    }
};