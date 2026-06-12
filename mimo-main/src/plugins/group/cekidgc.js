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
    cmd: ['cekid', 'idgc', 'gcid'],
    tags: ['group'],
    groupOnly: true,
    ownerOnly: true,

    run: async (sock, m, { groupMetadata }) => {
        const groupId = groupMetadata.id || m.key.remoteJid;
        const thumbnail = getThumbnail();
        
        const text = `📋 *INFO ID GRUP*\n\n┌─❖\n│ 🔖 *ID Grup:*\n│ ${groupId}\n│\n├─❖\n│ 📛 *Nama Grup:*\n│ ${groupMetadata.subject || 'Tidak diketahui'}\n│\n├─❖\n│ 👥 *Jumlah Anggota:*\n│ ${groupMetadata.participants?.length || 0}\n│\n╰─────────────────`;
        
        await sock.sendMessage(m.key.remoteJid, { 
            text: text,
            contextInfo: {
                externalAdReply: {
                    title: 'MIMOSA BOT',
                    body: 'Group ID Info',
                    thumbnail: thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: global.fVerif });
    }
};