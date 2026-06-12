import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { toSmallCaps } from '../../font.js';
import { webpToImage } from '../../lib/converter.js';

export default {
    cmd: ['toimage', 'toimg'],
    tags: ['sticker'],
    limit: true,
    premium: false,
    groupOnly: false,
    run: async (sock, m, { user, isOwner, prefix }) => {
        try {
            // Cek apakah ada quoted message (sticker yang direply)
            const quoted = m.quoted;
            
            if (!quoted) {
                return m.reply(toSmallCaps('❌ *Balas sticker yang ingin dijadikan gambar!*'));
            }
            
            // Cek apakah yang direply adalah sticker
            if (quoted.type !== 'stickerMessage') {
                return m.reply(toSmallCaps('❌ *Yang kamu balas bukan sticker!*'));
            }
            
            await m.react('⏳');
            
            // Download sticker
            let buffer;
            try {
                buffer = await quoted.download();
                if (!buffer) throw new Error('Gagal download sticker');
            } catch (err) {
                // Fallback download manual
                const msg = quoted.message || quoted;
                const type = Object.keys(msg)[0];
                const stream = await downloadContentFromMessage(msg[type], 'sticker');
                buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
            }
            
            // Validasi buffer
            if (!buffer || buffer.length === 0) {
                throw new Error('Buffer sticker kosong');
            }
            
            // Konversi webp ke gambar (png)
            const imageBuffer = await webpToImage(buffer, 'png');
            
            if (!imageBuffer || imageBuffer.length === 0) {
                throw new Error('Gagal mengkonversi sticker ke gambar');
            }
            
            // Kirim gambar dengan global.fVerif sebagai quoted (tanpa adreply)
            await sock.sendMessage(m.key.remoteJid, {
                image: imageBuffer,
                caption: toSmallCaps('✅ *Berhasil convert sticker ke gambar*')
            }, { quoted: global.fVerif });
            
            await m.react('✅');
            
        } catch (e) {
            console.error('ToImage Error:', e);
            await m.react('❌');
            m.reply(toSmallCaps(`❌ *Error:* ${e.message}`));
        }
    }
};