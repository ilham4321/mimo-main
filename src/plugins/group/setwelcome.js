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
    cmd: ['setwelcome', 'setwelcome', 'setjoin'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,

    run: async (sock, m, { args, text, groupMetadata }) => {
        const thumbnail = getThumbnail();
        const groupId = m.key.remoteJid;
        const { Group } = await import('../../database/schema.js');
        
        let groupData = await Group.findOne({ id: groupId });
        if (!groupData) {
            groupData = new Group({
                id: groupId,
                welcome: true,
                welcomeMessage: '👋 Selamat datang @user di grup @group',
                leaveMessage: '👋 Selamat tinggal @user'
            });
            await groupData.save();
        }
        
        if (!text) {
            const currentMessage = groupData.welcomeMessage || '👋 Selamat datang @user di grup @group';
            
            const textMsg = `╭─────────────────┈ ⊹
│  📝 *S E T   W E L C O M E* 📝
│
├─ ❏ 📛 *Grup:* ${groupMetadata.subject || 'Tidak ada nama'}
│
├─ ❏ 💬 *Pesan Welcome saat ini:*
│     ${currentMessage}
│
├─ ❏ 📝 *Cara Mengubah:*
│     .setwelcome <pesan>
│
├─ ❏ 🔤 *Variabel yang bisa digunakan:*
│     • @user - Mention user baru
│     • @group - Nama grup
│     • @count - Jumlah member
│
├─ ❏ 📌 *Contoh:*
│     .setwelcome 👋 @user bergabung di @group
│     .setwelcome Welcome @user! Total member @count
│
├─ ❏ 💡 *Untuk mengaktifkan/menonaktifkan:*
│     .welcome on / .welcome off
│
╰─────────────────┈ ⊹`;
            
            return sock.sendMessage(groupId, {
                text: textMsg,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Set Welcome Message',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        groupData.welcomeMessage = text;
        await groupData.save();
        
        if (!groupData.welcome) {
            groupData.welcome = true;
            await groupData.save();
        }
        
        const successMsg = `╭─────────────────┈ ⊹
│  ✅ *B E R H A S I L* ✅
│
├─ ❏ 💬 *Pesan Welcome baru:*
│     ${text}
│
├─ ❏ 📛 *Grup:* ${groupMetadata.subject || 'Tidak ada nama'}
│
├─ ❏ ✅ *Welcome status: AKTIF*
│
├─ ❏ 💡 *Pesan akan otomatis terkirim*
│     saat ada member baru bergabung
│
╰─────────────────┈ ⊹`;
        
        await sock.sendMessage(groupId, {
            text: successMsg,
            contextInfo: {
                ...newsletterConfig,
                externalAdReply: {
                    title: 'MIMOSA BOT',
                    body: 'Welcome Message Updated',
                    thumbnail: thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: global.fVerif });
    }
};