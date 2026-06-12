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
    cmd: ['infogrup', 'groupinfo', 'infogc', 'gcinfo'],
    tags: ['group'],
    groupOnly: true,

    run: async (sock, m, { groupMetadata, participants, isAdmin, isOwner }) => {
        const thumbnail = getThumbnail();
        
        let ppUrl = null;
        try {
            ppUrl = await sock.profilePictureUrl(m.key.remoteJid, 'image');
        } catch {
            ppUrl = null;
        }
        
        const groupAdmins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
        const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n│  ');
        
        const ownerJid = groupMetadata.owner || (groupAdmins.find(p => p.admin === 'superadmin')?.id) || m.key.remoteJid.split('-')[0] + '@s.whatsapp.net';
        
        const totalMembers = participants.length;
        const totalAdmins = groupAdmins.length;
        
        const chatMode = groupMetadata.announce ? '🔒 HANYA ADMIN' : '🔓 SEMUA ANGGOTA';
        const editMode = groupMetadata.restrict ? '🔒 HANYA ADMIN' : '🔓 SEMUA ANGGOTA';
        
        let text = `╭─────────────────┈ ⊹ 📋
│  ✨ *I N F O   G R U P* ✨
│
├─ ❏ 🆔 *ID Grup:*
│     ${groupMetadata.id}
│
├─ ❏ 📛 *Nama Grup:*
│     ${groupMetadata.subject || 'Tidak ada nama'}
│
├─ ❏ 📝 *Deskripsi:*
│     ${(groupMetadata.desc?.toString() || 'Tidak ada deskripsi').substring(0, 50)}${(groupMetadata.desc?.toString()?.length > 50) ? '...' : ''}
│
├─ ❏ 👥 *Total Member:* ${totalMembers}
│  ❏ 👑 *Total Admin:* ${totalAdmins}
│
├─ ❏ 👤 *Pemilik Grup:*
│     @${ownerJid.split('@')[0]}
│
├─ ❏ 👮 *Daftar Admin:*
│     ${listAdmin || '     Tidak ada admin'}
│
├─ ❏ ⚙️ *Pengaturan Grup:*
│     💬 *Chat:* ${chatMode}
│     ✏️ *Edit Info:* ${editMode}
│
├─ ❏ 📅 *Dibuat:*
│     ${groupMetadata.creation ? new Date(groupMetadata.creation * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tidak diketahui'}
│
╰─────────────────┈ ⊹`;

        const mentions = [...groupAdmins.map(v => v.id), ownerJid];
        
        if (ppUrl) {
            await sock.sendMessage(m.key.remoteJid, {
                image: { url: ppUrl },
                caption: text,
                mentions: mentions,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Group Information',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        } else {
            await sock.sendMessage(m.key.remoteJid, {
                text: text,
                mentions: mentions,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Group Information',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
    }
};