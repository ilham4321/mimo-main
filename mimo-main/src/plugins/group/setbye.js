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
    cmd: ['setbye', 'setleave', 'setgoodbye'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,

    run: async (sock, m, { args, text, groupMetadata }) => {
        const thumbnail = getThumbnail();
        const groupId = m.key.remoteJid;
        const { Group } = await import('../../database/schema.js');
        
        let groupData = await Group.findOne({ id: groupId });
        if (!groupData) {
            groupData = new Group({ id: groupId });
            await groupData.save();
        }
        
        if (!text) {
            const currentMessage = groupData.leaveMessage || '👋 Selamat tinggal @user';
            
            const textMsg = `╭─────────────────┈ ⊹
│  📝 *S E T   B Y E* 📝
│
├─ ❏ 📛 *Grup:* ${groupMetadata.subject || 'Tidak ada nama'}
│
├─ ❏ 💬 *Pesan Bye saat ini:*
│     ${currentMessage}
│
├─ ❏ 📝 *Cara Mengubah:*
│     .setbye <pesan>
│
├─ ❏ 🔤 *Variabel yang bisa digunakan:*
│     • @user - Mention user yang keluar
│     • @group - Nama grup
│
├─ ❏ 📌 *Contoh:*
│     .setbye 👋 @user telah keluar dari @group
│     .setbye Sayonara @user
│
╰─────────────────┈ ⊹`;
            
            return sock.sendMessage(groupId, {
                text: textMsg,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Set Leave Message',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        groupData.leaveMessage = text;
        await groupData.save();
        
        const successMsg = `╭─────────────────┈ ⊹
│  ✅ *B E R H A S I L* ✅
│
├─ ❏ 💬 *Pesan Bye baru:*
│     ${text}
│
├─ ❏ 📛 *Grup:* ${groupMetadata.subject || 'Tidak ada nama'}
│
├─ ❏ 💡 *Pesan akan otomatis terkirim*
│     saat ada member keluar
│
╰─────────────────┈ ⊹`;
        
        await sock.sendMessage(groupId, {
            text: successMsg,
            contextInfo: {
                ...newsletterConfig,
                externalAdReply: {
                    title: 'MIMOSA BOT',
                    body: 'Leave Message Updated',
                    thumbnail: thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: global.fVerif });
    }
};