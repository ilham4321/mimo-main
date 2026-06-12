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
    cmd: ['admin', 'report', 'lapor'],
    tags: ['group'],
    groupOnly: true,

    run: async (sock, m, { text, groupMetadata }) => {
        const thumbnail = getThumbnail();
        const groupId = m.key.remoteJid;
        
        let reportText = '';
        let targetJid = null;
        
        if (m.quoted) {
            reportText = m.quoted.text || 'Tidak ada pesan';
            targetJid = m.quoted.sender;
        } else if (text) {
            reportText = text;
        } else {
            return sock.sendMessage(groupId, { 
                text: `❌ *Mau lapor apa?*\n\n*Cara penggunaan:*\n1. Reply pesan yang ingin dilaporkan lalu ketik *.report*\n2. Atau ketik *.report alasan laporan*`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Report Message',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        if (!targetJid && !m.quoted) {
            return sock.sendMessage(groupId, { 
                text: `❌ *Reply pesan yang ingin dilaporkan!*\n\nReply pesan target lalu ketik *.report*`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Report Message',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        const admins = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id);
        
        if (admins.length === 0) {
            return sock.sendMessage(groupId, { 
                text: `❌ *Tidak ada admin di grup ini!*`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Report Message',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        const senderJid = m.key.participant || m.key.remoteJid;
        const reporterNumber = senderJid.includes('@g.us') ? senderJid.split('@')[0] : senderJid.split('@')[0];
        const targetNumber = targetJid ? targetJid.split('@')[0] : 'Unknown';
        
        await sock.sendMessage(groupId, { 
            text: `╭─────────────────┈ ⊹
│  📢 *L A P O R A N* 📢
│
├─ ❏ 👤 *Pelapor:* @${reporterNumber}
├─ ❏ 👤 *Terlapor:* @${targetNumber}
├─ ❏ 📝 *Alasan:* ${reportText}
│
├─ ❏ 📨 *Laporan dikirim ke*
│     ${admins.length} Admin
│
╰─────────────────┈ ⊹`,
            mentions: [senderJid, targetJid].filter(Boolean),
            contextInfo: {
                ...newsletterConfig,
                externalAdReply: {
                    title: 'MIMOSA BOT',
                    body: 'Report Sent',
                    thumbnail: thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: global.fVerif });
        
        for (const admin of admins) {
            try {
                await sock.sendMessage(admin, { 
                    text: `╭─────────────────┈ ⊹
│  📋 *L A P O R A N* 📋
│
├─ ❏ 👤 *Pelapor:* @${reporterNumber}
├─ ❏ 👤 *Terlapor:* @${targetNumber}
├─ ❏ 📝 *Alasan:* ${reportText}
│
├─ ❏ 🌐 *Grup:* ${groupMetadata.subject}
├─ ❏ 🆔 *ID Grup:* ${groupId}
│
├─ ❏ 💡 *Silakan cek grup*
│     untuk ditindaklanjuti
│
╰─────────────────┈ ⊹`,
                    mentions: [senderJid, targetJid].filter(Boolean),
                    contextInfo: {
                        ...newsletterConfig,
                        externalAdReply: {
                            title: 'MIMOSA BOT',
                            body: 'Report Message',
                            thumbnail: thumbnail,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: global.fVerif });
                
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
                console.error(`Failed to send report to admin: ${admin}`, err);
            }
        }
    }
};