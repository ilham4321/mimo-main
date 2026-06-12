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
    cmd: ['setppgc', 'setppgrup', 'setfotogc', 'setppgroup'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,

    run: async (sock, m, { prefix, command, groupMetadata }) => {
        const thumbnail = getThumbnail();
        const groupId = m.key.remoteJid;
        
        const quoted = m.quoted;
        
        if (!quoted) {
            const textMsg = `╭─────────────────┈ ⊹
│  🖼️ *S E T   P P   G C* 🖼️
│
├─ ❏ 📛 *Grup:* ${groupMetadata.subject || 'Tidak ada nama'}
│
├─ ❏ 📝 *Cara Mengubah:*
│     Reply gambar dengan caption
│     ${prefix}${command}
│
├─ ❏ 📌 *Contoh:*
│     Kirim gambar lalu reply
│     ketik .setppgc
│
├─ ❏ ⚠️ *Catatan:*
│     • Bot harus menjadi admin
│     • Gambar akan di-crop otomatis
│
╰─────────────────┈ ⊹`;
            
            return sock.sendMessage(groupId, {
                text: textMsg,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Set Group Photo',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        let buffer = null;
        
        try {
            if (quoted.message?.imageMessage) {
                buffer = await quoted.download();
            } else if (quoted.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                const deepQuoted = quoted.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
                const stream = await downloadContentFromMessage(deepQuoted, 'image');
                let chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                buffer = Buffer.concat(chunks);
            } else {
                throw new Error('Bukan gambar!');
            }
        } catch (err) {
            await sock.sendMessage(groupId, {
                text: `❌ *Gagal mengunduh gambar!*\n\nPastikan Anda mengirim gambar yang valid.`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Set Group Photo',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
            return;
        }
        
        if (!buffer) {
            return sock.sendMessage(groupId, {
                text: `❌ *Gagal mengunduh gambar!*`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Set Group Photo',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        try {
            await sock.updateProfilePicture(groupId, buffer);
            
            const successMsg = `╭─────────────────┈ ⊹
│  ✅ *B E R H A S I L* ✅
│
├─ ❏ 📛 *Grup:* ${groupMetadata.subject || 'Tidak ada nama'}
│
├─ ❏ 🖼️ *Foto profil grup telah diperbarui!*
│
├─ ❏ 💡 *Perubahan akan terlihat*
│     dalam beberapa saat
│
╰─────────────────┈ ⊹`;
            
            await sock.sendMessage(groupId, {
                text: successMsg,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Group Photo Updated',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
            
        } catch (err) {
            await sock.sendMessage(groupId, {
                text: `❌ *Gagal mengubah foto profil grup!*\n\n*Error:* ${err.message}`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Set Group Photo Failed',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
    }
};