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
    cmd: ['listonline', 'online', 'whoisonline'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,

    run: async (sock, m, { groupMetadata, user }) => {
        const thumbnail = getThumbnail();
        const groupId = m.key.remoteJid;
        const { User } = await import('../../database/schema.js');
        
        const participants = groupMetadata.participants || [];
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        const oneHour = 60 * 60 * 1000;
        
        let onlineMembers = [];
        let recentlyActive = [];
        let offlineMembers = [];
        
        for (const participant of participants) {
            const jid = participant.id;
            const userData = await User.findOne({ jid: jid });
            const lastSeen = userData?.lastseen || 0;
            const timeDiff = now - lastSeen;
            
            if (timeDiff <= fiveMinutes) {
                onlineMembers.push({ jid, lastSeen });
            } else if (timeDiff <= oneHour) {
                recentlyActive.push({ jid, lastSeen });
            } else {
                offlineMembers.push({ jid, lastSeen });
            }
        }
        
        const totalMembers = participants.length;
        const onlineCount = onlineMembers.length;
        const recentCount = recentlyActive.length;
        const offlineCount = offlineMembers.length;
        const onlinePercent = totalMembers > 0 ? Math.round((onlineCount / totalMembers) * 100) : 0;
        
        let onlineList = '';
        for (let i = 0; i < Math.min(onlineMembers.length, 30); i++) {
            const number = onlineMembers[i].jid.split('@')[0];
            onlineList += `${i + 1}. @${number}\n`;
        }
        
        let recentList = '';
        for (let i = 0; i < Math.min(recentlyActive.length, 15); i++) {
            const number = recentlyActive[i].jid.split('@')[0];
            const lastSeenTime = recentlyActive[i].lastSeen;
            const minutesAgo = Math.floor((now - lastSeenTime) / 60000);
            recentList += `${i + 1}. @${number} (${minutesAgo} menit lalu)\n`;
        }
        
        const text = `╭─────────────────┈ ⊹
│  🟢 *O N L I N E* 🟢
│
├─ ❏ 📛 *Grup:* ${groupMetadata.subject || 'Tidak ada nama'}
├─ ❏ 👥 *Total:* ${totalMembers} anggota
├─ ❏ 🟢 *Online:* ${onlineCount} (${onlinePercent}%)
├─ ❏ 🟡 *Baru Aktif:* ${recentCount}
├─ ❏ ⚫ *Offline:* ${offlineCount}
│
├─ ❏ 🟢 *Online (5 menit terakhir):*
${onlineList || '│     Tidak ada anggota online'}
│
${recentCount > 0 ? `├─ ❏ 🟡 *Baru Aktif (1 jam terakhir):*
${recentList}
` : ''}
├─ ❏ 💡 *Keterangan:*
│     🟢 Online: Aktif 5 menit terakhir
│     🟡 Baru Aktif: 5-60 menit lalu
│     ⚫ Offline: >60 menit
│
╰─────────────────┈ ⊹`;

        const mentionList = onlineMembers.map(m => m.jid);
        
        await sock.sendMessage(groupId, {
            text: text,
            mentions: mentionList,
            contextInfo: {
                ...newsletterConfig,
                externalAdReply: {
                    title: 'MIMOSA BOT',
                    body: 'List Online Members',
                    thumbnail: thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: global.fVerif });
    }
};