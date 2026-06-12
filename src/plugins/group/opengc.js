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

export default {
    cmd: ['opengc', 'bukagc'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,

    run: async (sock, m) => {
        const groupId = m.key.remoteJid;
        const thumbnail = getThumbnail();
        
        try {
            // Semua anggota bisa mengirim pesan
            await sock.groupSettingUpdate(groupId, "not_announcement");
            
            const groupMetadata = await sock.groupMetadata(groupId);
            const allMembers = groupMetadata.participants.map(p => p.id);
            
            await sock.sendMessage(groupId, { 
                text: `🔓 *GRUP DIBUKA!*\n\n┌─❖\n│ Semua anggota sekarang bisa\n│ mengirim pesan kembali.\n╰─────────────────`,
                mentions: allMembers,
                contextInfo: {
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Group Opened',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fkon });
            
        } catch (err) {
            m.reply(`❌ *Gagal membuka grup!*\n\nError: ${err.message}`);
        }
    }
};