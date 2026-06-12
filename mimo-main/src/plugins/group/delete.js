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
    cmd: ['del', 'delete', 'hapus'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,

    run: async (sock, m) => {
        const thumbnail = getThumbnail();
        
        if (!m.quoted) {
            return sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Reply pesan yang ingin dihapus!*\n\nContoh: .del (sambil reply pesan)`,
                contextInfo: {
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Delete Message',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fkon });
        }
        
        try {
            // Coba hapus dengan metode pertama
            const bilek = m.message?.extendedTextMessage?.contextInfo?.participant;
            const banh = m.message?.extendedTextMessage?.contextInfo?.stanzaId;
            
            if (bilek && banh) {
                await sock.sendMessage(m.key.remoteJid, { 
                    delete: { 
                        remoteJid: m.key.remoteJid, 
                        fromMe: false, 
                        id: banh, 
                        participant: bilek 
                    }
                });
            } else {
                // Fallback: hapus dengan metode quoted
                await sock.sendMessage(m.key.remoteJid, { delete: m.quoted.key });
            }
            
            await m.react('✅');
            
        } catch (err) {
            console.error('[DELETE ERROR]', err);
            
            // Coba metode terakhir
            try {
                await sock.sendMessage(m.key.remoteJid, { delete: m.quoted.key });
                await m.react('✅');
            } catch (err2) {
                await sock.sendMessage(m.key.remoteJid, { 
                    text: `❌ *Gagal menghapus pesan!*\n\nError: ${err2.message}`,
                    contextInfo: {
                        externalAdReply: {
                            title: 'MIMOSA BOT',
                            body: 'Delete Failed',
                            thumbnail: thumbnail,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: global.fkon });
                await m.react('❌');
            }
        }
    }
};