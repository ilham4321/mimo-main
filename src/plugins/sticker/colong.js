import { addExif } from '../../lib/converter.js';

export default {
    cmd: ['colong', 'ambil'],
    tags: ['sticker'],
    limit: false,
    run: async (sock, m, { prefix, command, args }) => {
        
        if (!m.quoted) {
            return m.reply(`📌 *Cara Penggunaan:*\nReply stiker dengan perintah *${prefix + command}*\n\nContoh: ${prefix + command} (reply ke stiker orang)\n\n🎀 *Custom packname & author:*\n${prefix + command} <packname> <author>`);
        }

        const hasMedia = m.quoted.type === 'stickerMessage';
        
        if (!hasMedia) {
            return m.reply(`❌ *Format Salah!*\nHarap reply ke stiker.`);
        }

        await m.react('⏳');

        try {
            const mediaBuffer = await m.quoted.download();
            
            if (!mediaBuffer) {
                throw new Error('Gagal mendownload stiker');
            }

            // Ambil packname dan author dari args
            let packname = global.packname || 'Mimosa Bot';
            let author = global.author || 'Mimosa-chan';
            
            if (args.length > 0) {
                const custom = args.join(' ').split('|');
                if (custom[0]) packname = custom[0];
                if (custom[1]) author = custom[1];
            }

            // Tambah EXIF ke stiker
            const stickerBuffer = await addExif(mediaBuffer, packname, author);

            await sock.sendMessage(m.key.remoteJid, {
                sticker: stickerBuffer
            }, { quoted: m });

            await m.react('✅');

        } catch (error) {
            console.error('Colong error:', error);
            await m.react('❌');
            m.reply(`❌ *Gagal mengambil stiker*\n\nDetail: ${error.message}`);
        }
    }
};
