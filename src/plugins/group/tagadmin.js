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
    cmd: ['tagadmin'],
    tags: ['group'],
    groupOnly: true,

    run: async (sock, m, { text, groupMetadata, participants }) => {
        const thumbnail = getThumbnail();
        const groupId = m.key.remoteJid;
        
        const groupAdmins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
        const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || groupId.split('-')[0] + '@s.whatsapp.net';
        
        if (groupAdmins.length === 0) {
            return sock.sendMessage(groupId, {
                text: `❌ *Tidak ada admin di grup ini!*`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Tag Admin',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n');
        
        const message = text || '📢 *PENTING!* Admin dimohon untuk segera merespon.';
        
        const finalText = `╭─────────────────┈ ⊹
│  👑 *T A G   A D M I N* 👑
│
├─ ❏ 💬 *Pesan:*
│     ${message}
│
├─ ❏ 👥 *Daftar Admin:*
${listAdmin}
│
├─ ❏ 👤 *Pemilik Grup:*
│     @${owner.split('@')[0]}
│
╰─────────────────┈ ⊹`;
        
        const mentions = [...groupAdmins.map(v => v.id), owner];
        
        let ppUser = null;
        try {
            ppUser = await sock.profilePictureUrl(groupId, 'image');
        } catch {
            ppUser = null;
        }
        
        if (ppUser) {
            await sock.sendMessage(groupId, {
                image: { url: ppUser },
                caption: finalText,
                mentions: mentions,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Tag Admin',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        } else {
            await sock.sendMessage(groupId, {
                text: finalText,
                mentions: mentions,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Tag Admin',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
    }
};