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
    cmd: ['setdesc', 'sdesc', 'setdeskripsi'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,

    run: async (sock, m, { text, groupMetadata }) => {
        const thumbnail = getThumbnail();
        const groupId = m.key.remoteJid;
        
        if (!text) {
            const currentDesc = groupMetadata.desc || 'Tidak ada deskripsi';
            
            const textMsg = `╭─────────────────┈ ⊹
│  📝 *S E T   D E S C* 📝
│
├─ ❏ 📛 *Grup:* ${groupMetadata.subject || 'Tidak ada nama'}
│
├─ ❏ 📋 *Deskripsi saat ini:*
│     ${currentDesc}
│
├─ ❏ 📝 *Cara Mengubah:*
│     .setdesc <deskripsi baru>
│
├─ ❏ 📌 *Contoh:*
│     .setdesc Grup untuk berbagi informasi
│     .setdesc Welcome to our group!
│
╰─────────────────┈ ⊹`;
            
            return sock.sendMessage(groupId, {
                text: textMsg,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Set Description',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        try {
            await sock.groupUpdateDescription(groupId, text);
            
            const successMsg = `╭─────────────────┈ ⊹
│  ✅ *B E R H A S I L* ✅
│
├─ ❏ 📛 *Grup:* ${groupMetadata.subject || 'Tidak ada nama'}
│
├─ ❏ 📝 *Deskripsi baru:*
│     ${text}
│
├─ ❏ 💡 *Deskripsi grup telah diperbarui*
│
╰─────────────────┈ ⊹`;
            
            await sock.sendMessage(groupId, {
                text: successMsg,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Description Updated',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
            
        } catch (err) {
            await sock.sendMessage(groupId, {
                text: `❌ *Gagal mengubah deskripsi!*\n\n*Error:* ${err.message}`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Set Description Failed',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
    }
};