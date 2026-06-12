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
    cmd: ['tagall', 'mentionall', 'everyone', 'all'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,

    run: async (sock, m, { groupMetadata, isBotAdmin, text, args }) => {
        const thumbnail = getThumbnail();
        const groupId = m.key.remoteJid;
        
        if (!isBotAdmin) {
            return sock.sendMessage(groupId, { 
                text: `❌ *Bot harus menjadi admin grup!*\n\nJadikan bot sebagai admin terlebih dahulu.`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Tag All',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        const participants = groupMetadata.participants || [];
        const totalMembers = participants.length;
        
        let pesan = text || '📢 *PENGUMUMAN PENTING!*';
        
        const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
        const members = participants.filter(p => !p.admin);
        
        let adminList = '';
        for (const admin of admins) {
            adminList += `@${admin.id.split('@')[0]} `;
        }
        
        let memberList = '';
        for (const member of members) {
            memberList += `@${member.id.split('@')[0]} `;
        }
        
        const allMentions = participants.map(p => p.id);
        
        const textMessage = `╭─────────────────┈ ⊹
│  📢 *T A G   A L L* 📢
│
├─ ❏ 💬 *Pesan:* 
│     ${pesan}
│
├─ ❏ 👑 *Admin:* ${admins.length}
│     ${adminList}
│
├─ ❏ 👤 *Member:* ${members.length}
│     ${memberList}
│
├─ ❏ 👥 *Total:* ${totalMembers} anggota
│
╰─────────────────┈ ⊹`;
        
        await sock.sendMessage(groupId, {
            text: textMessage,
            mentions: allMentions,
            contextInfo: {
                ...newsletterConfig,
                externalAdReply: {
                    title: 'MIMOSA BOT',
                    body: 'Tag All Members',
                    thumbnail: thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: global.fVerif });
    }
};