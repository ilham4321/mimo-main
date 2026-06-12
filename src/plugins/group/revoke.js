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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
    cmd: ['revoke', 'resetlink', 'refreshlink'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,

    run: async (sock, m, { groupMetadata, isBotAdmin }) => {
        const thumbnail = getThumbnail();
        const groupId = m.key.remoteJid;
        
        // Ambil sender JID yang benar
        const senderJid = m.key.participant || m.sender || m.key.remoteJid;
        
        if (!isBotAdmin) {
            return sock.sendMessage(groupId, { 
                text: `❌ *Bot harus menjadi admin grup!*`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Revoke Link',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        try {
            await sock.groupRevokeInvite(groupId);
            
            await sock.sendMessage(groupId, { 
                text: `╭─────────────────┈ ⊹
│  🔄 *R E V O K E* 🔄
│
├─ ❏ ✅ *Link grup berhasil direset!*
│
├─ ❏ 🔗 *Link baru telah dikirim*
│     ke chat pribadi kamu.
│
├─ ❏ ⚠️ *Catatan:*
│     Link lama sudah tidak berlaku
│
╰─────────────────┈ ⊹`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Revoke Success',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
            
            await delay(1000);
            
            const inviteCode = await sock.groupInviteCode(groupId);
            const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
            const groupName = groupMetadata.subject || 'Grup';
            
            // Kirim ke sender (bisa grup atau private)
            if (senderJid && !senderJid.includes('@g.us')) {
                await sock.sendMessage(senderJid, { 
                    text: `╭─────────────────┈ ⊹
│  🔗 *L I N K   B A R U* 🔗
│
├─ ❏ 📛 *Grup:* ${groupName}
├─ ❏ 🔗 *Link:* ${inviteLink}
│
├─ ❏ ⚠️ *Catatan:*
│     • Link ini bisa dibagikan
│     • Hanya admin yang bisa reset
│
╰─────────────────┈ ⊹`,
                    contextInfo: {
                        ...newsletterConfig,
                        externalAdReply: {
                            title: 'MIMOSA BOT',
                            body: 'New Group Link',
                            thumbnail: thumbnail,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: global.fVerif });
            } else {
                // Jika sender tidak valid, kirim ke grup
                await sock.sendMessage(groupId, { 
                    text: `🔗 *Link baru:* ${inviteLink}`,
                    contextInfo: {
                        ...newsletterConfig,
                        externalAdReply: {
                            title: 'MIMOSA BOT',
                            body: 'New Group Link',
                            thumbnail: thumbnail,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: global.fVerif });
            }
            
        } catch (err) {
            console.error('[REVOKE ERROR]', err);
            
            let errorMsg = err.message;
            if (errorMsg.includes('destructure')) {
                errorMsg = 'Link berhasil direset, tetapi gagal mengirim link ke chat pribadi. Cek manual di info grup.';
            }
            
            await sock.sendMessage(groupId, { 
                text: `⚠️ *Link berhasil direset!*\n\n${errorMsg}`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Revoke Success',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
    }
};