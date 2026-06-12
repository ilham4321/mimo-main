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
    cmd: ['totag', 'tag'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,

    run: async (sock, m, { participants, groupMetadata }) => {
        const thumbnail = getThumbnail();
        const groupId = m.key.remoteJid;
        
        // Ambil sender JID yang benar
        const senderJid = m.key.participant || m.sender || m.key.remoteJid;
        const senderNumber = senderJid.split('@')[0];
        
        if (!m.quoted) {
            const textMsg = `╭─────────────────┈ ⊹
│  📢 *T O T A G* 📢
│
├─ ❏ 📝 *Cara Penggunaan:*
│     Reply pesan yang ingin
│     diteruskan ke semua member
│
├─ ❏ 📌 *Contoh:*
│     Reply pesan lalu ketik .totag
│
├─ ❏ ⚠️ *Catatan:*
│     • Hanya admin yang bisa
│     • Pesan akan di-mention ke
│       semua anggota grup
│
╰─────────────────┈ ⊹`;
            
            return sock.sendMessage(groupId, {
                text: textMsg,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Tag All with Message',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        const users = participants.map(u => u.id);
        const groupName = groupMetadata.subject || 'Grup';
        
        const quotedMessage = m.quoted;
        let quotedText = '';
        
        if (quotedMessage.text) {
            quotedText = quotedMessage.text;
        } else if (quotedMessage.message?.conversation) {
            quotedText = quotedMessage.message.conversation;
        } else if (quotedMessage.message?.extendedTextMessage?.text) {
            quotedText = quotedMessage.message.extendedTextMessage.text;
        } else {
            quotedText = 'Pesan tidak memiliki teks';
        }
        
        const warningText = `╭─────────────────┈ ⊹
│  📢 *P E S A N   D A R I   A D M I N* 📢
│
├─ ❏ 📛 *Grup:* ${groupName}
├─ ❏ 👤 *Admin:* @${senderNumber}
│
├─ ❏ 💬 *Pesan:*
│     ${quotedText}
│
├─ ❏ 👥 *Diteruskan ke semua member*
│
╰─────────────────┈ ⊹`;
        
        try {
            await sock.sendMessage(groupId, {
                text: warningText,
                mentions: users,
                contextInfo: {
                    ...newsletterConfig,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363369878409989@newsletter',
                        serverMessageId: Math.floor(Math.random() * 1000),
                        newsletterName: '✨ Mimosa Multi-Device »'
                    },
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Tag All',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
            
        } catch (err) {
            console.error('[TOTAG ERROR]', err);
            
            await sock.sendMessage(groupId, {
                text: `❌ *Gagal mengirim pesan!*\n\n*Error:* ${err.message}`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Tag All Failed',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
    }
};