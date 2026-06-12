import { sticker } from '../../lib/converter.js';

export default {
    cmd: ['s', 'sticker', 'stiker', 'sgif', 'sfull'],
    tags: ['sticker'],
    limit: true,
    run: async (sock, m, { prefix, command }) => {
        
        if (!m.quoted) {
            return m.reply(`📌 *Cara Penggunaan:*\nReply gambar/video/sticker dengan perintah *${prefix + command}*\n\nContoh: ${prefix + command} (reply ke media)`);
        }

        const mediaTypes = ['imageMessage', 'videoMessage', 'stickerMessage'];
        const hasMedia = mediaTypes.includes(m.quoted.type);
        
        if (!hasMedia) {
            return m.reply(`❌ *Format Salah!*\nHarap reply ke gambar, video, atau stiker.`);
        }

        await m.react('⏳');

        try {
            let mediaBuffer = await m.quoted.download();
            
            if (!mediaBuffer) {
                throw new Error('Gagal mendownload media');
            }

            let isVideo = false;
            let isSticker = false;
            
            // Cek tipe media
            if (m.quoted.type === 'videoMessage') {
                isVideo = true;
            } else if (m.quoted.type === 'stickerMessage') {
                isSticker = true;
                // Stiker sudah dalam format webp, langsung tambah exif saja
            }
            
            const packname = global.packname || 'Mimosa Bot';
            const author = global.author || 'Mimosa-chan';
            
            let stickerBuffer;
            
            if (isSticker) {
                // Stiker ke stiker (ganti metadata)
                const { addExif } = await import('../lib/converter.js');
                stickerBuffer = await addExif(mediaBuffer, packname, author);
            } else {
                // Gambar/Video ke stiker
                stickerBuffer = await sticker(mediaBuffer, packname, author, isVideo);
            }

            await sock.sendMessage(m.key.remoteJid, {
                sticker: stickerBuffer
            }, { quoted: m });

            await m.react('✅');

            // Hapus pesan perintah (opsional)
            // await sock.sendMessage(m.key.remoteJid, { delete: m.key });

        } catch (error) {
            console.error('Sticker error:', error);
            await m.react('❌');
            m.reply(`❌ *Gagal membuat stiker*\n\nDetail: ${error.message}`);
        }
    }
};