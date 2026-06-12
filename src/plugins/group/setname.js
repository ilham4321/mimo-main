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
    cmd: ['setnamagc', 'setname', 'setnamagrup', 'renamegc'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,

    run: async (sock, m, { args, text, groupMetadata }) => {
        const thumbnail = getThumbnail();
        const groupId = m.key.remoteJid;
        
        if (!text) {
            const currentName = groupMetadata.subject || 'Tidak ada nama';
            
            const textMsg = `╭─────────────────┈ ⊹
│  📝 *S E T   N A M E* 📝
│
├─ ❏ 📛 *Nama saat ini:*
│     ${currentName}
│
├─ ❏ 📝 *Cara Mengubah:*
│     .setname <nama baru>
│
├─ ❏ 📌 *Contoh:*
│     .setname Grup Kita
│     .setname Family Group
│
╰─────────────────┈ ⊹`;
            
            return sock.sendMessage(groupId, {
                text: textMsg,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Set Group Name',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        try {
            await sock.groupUpdateSubject(groupId, text);
            
            const successMsg = `╭─────────────────┈ ⊹
│  ✅ *B E R H A S I L* ✅
│
├─ ❏ 📛 *Nama baru:*
│     ${text}
│
├─ ❏ 💡 *Nama grup telah diperbarui*
│
╰─────────────────┈ ⊹`;
            
            await sock.sendMessage(groupId, {
                text: successMsg,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Group Name Updated',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
            
        } catch (err) {
            await sock.sendMessage(groupId, {
                text: `❌ *Gagal mengubah nama grup!*\n\n*Error:* ${err.message}`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Set Name Failed',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
    }
};