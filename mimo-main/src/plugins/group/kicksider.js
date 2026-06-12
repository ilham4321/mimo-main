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

function msToDate(ms) {
    if (isNaN(ms)) return 'Tidak diketahui';
    const d = Math.floor(ms / 86400000);
    const h = Math.floor(ms / 3600000) % 24;
    if (d === 0 && h === 0) return 'Baru saja';
    if (d === 0) return `${h} jam`;
    return `${d} hari ${h} jam`;
}

export default {
    cmd: ['kicksider', 'sider', 'hapussider'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,

    run: async (sock, m, { args, text, groupMetadata, isOwner, user }) => {
        const thumbnail = getThumbnail();
        const groupId = m.key.remoteJid;
        const lama = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        
        const members = groupMetadata.participants.map(v => v.id);
        const message = text || 'Mohon aktif di grup karena akan ada pembersihan anggota sider.';
        
        let siderList = [];
        
        for (const member of members) {
            const participant = groupMetadata.participants.find(u => u.id === member);
            const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
            
            if (isAdmin) continue;
            
            const userData = await User.findOne({ jid: member });
            const lastSeen = userData?.lastseen || 0;
            const isInactive = (now - lastSeen) > lama;
            
            if (isInactive || !userData) {
                siderList.push(member);
            }
        }
        
        if (siderList.length === 0) {
            return sock.sendMessage(groupId, { 
                text: `📋 *TIDAK ADA SIDER*\n\n┌─❖\n│ ✅ Semua member aktif!\n│ 👥 Total: ${members.length} anggota\n╰─────────────────`,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Kick Sider',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        const msg = await sock.sendMessage(groupId, { 
            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃     🔥 KICK SIDER 🔥
┣━━━━━━━━━━━━━━━━━━━━┫
┃ 📊 *Total Sider:* ${siderList.length}/${members.length}
┃ 📛 *Grup:* ${groupMetadata.subject}
┃
┃ 📝 *Alasan:*
┃ 1. Tidak aktif > 7 hari
┃ 2. Belum pernah chat
┃
┃ 💬 *Pesan:* ${message}
┃
┃ 👤 *Daftar Sider:*
${siderList.map(v => `┃    • @${v.split('@')[0]}`).join('\n')}
┣━━━━━━━━━━━━━━━━━━━━┫
┃ ⏰ *Akan dikick dalam 10 detik*
┗━━━━━━━━━━━━━━━━━━━━┛`,
            mentions: siderList,
            contextInfo: {
                ...newsletterConfig,
                externalAdReply: {
                    title: 'MIMOSA BOT',
                    body: 'Kick Sider',
                    thumbnail: thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: global.fVerif });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        await sock.sendMessage(groupId, { 
            text: `⏰ *10 detik lagi...*`,
            edit: msg.key
        });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        let kicked = 0;
        let failed = 0;
        
        for (const sid of siderList) {
            try {
                await sock.groupParticipantsUpdate(groupId, [sid], 'remove');
                kicked++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
                failed++;
            }
        }
        
        await sock.sendMessage(groupId, { 
            text: `┏━━━━━━━━━━━━━━━━━━━━┓
┃     ✅ KICK SIDER
┣━━━━━━━━━━━━━━━━━━━━┫
┃ ✅ *Berhasil dikick:* ${kicked}
┃ ❌ *Gagal:* ${failed}
┃
┃ 📛 *Grup:* ${groupMetadata.subject}
┗━━━━━━━━━━━━━━━━━━━━┛`,
            contextInfo: {
                ...newsletterConfig,
                externalAdReply: {
                    title: 'MIMOSA BOT',
                    body: 'Kick Sider Complete',
                    thumbnail: thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: global.fVerif });
    }
};