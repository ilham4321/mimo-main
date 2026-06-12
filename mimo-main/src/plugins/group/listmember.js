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
    cmd: ['listmember', 'memberlist', 'allmember', 'listanggota'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,

    run: async (sock, m, { groupMetadata, isBotAdmin }) => {
        const thumbnail = getThumbnail();
        const groupId = m.key.remoteJid;
        
        const participants = groupMetadata.participants || [];
        const totalMembers = participants.length;
        
        const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
        const members = participants.filter(p => !p.admin);
        
        let adminList = '';
        let memberList = '';
        let adminCount = 0;
        let memberCount = 0;
        
        for (let i = 0; i < admins.length; i++) {
            const admin = admins[i];
            const number = admin.id.split('@')[0];
            adminList += `${i + 1}. @${number}\n`;
            adminCount++;
        }
        
        for (let i = 0; i < Math.min(members.length, 50); i++) {
            const member = members[i];
            const number = member.id.split('@')[0];
            memberList += `${i + 1}. @${number}\n`;
            memberCount++;
        }
        
        let text = `👥 *L I S T   M E M B E R* 👥

┌───────────────────
│ 📛 *Grup:* ${groupMetadata.subject || 'Tidak ada nama'}
│ 👥 *Total:* ${totalMembers} anggota
│ 👑 *Admin:* ${adminCount}
│ 👤 *Member:* ${memberCount}
└───────────────────

👑 *Daftar Admin:*
${adminList || '  Tidak ada admin'}

👤 *Daftar Member (${memberCount}):*
${memberList || '  Tidak ada member'}

${members.length > 50 ? `\n📌 *Catatan:* Hanya menampilkan 50 member pertama dari total ${members.length} member.\n` : ''}
💡 *Ketik .tagall untuk mention semua member*`;

        const mentionList = participants.map(p => p.id);
        
        if (totalMembers <= 100) {
            await sock.sendMessage(groupId, {
                text: text,
                mentions: mentionList,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'List Member',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        } else {
            await sock.sendMessage(groupId, {
                text: text,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'List Member',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
            
            await sock.sendMessage(groupId, {
                text: `📋 *Mention semua member dikirim terpisah karena jumlah member terlalu banyak.*`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'List Member',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
    }
};