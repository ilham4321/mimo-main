import { toPTT } from '../../lib/converter.js';
import { fileTypeFromBuffer } from 'file-type';

export default {
    cmd: ['tovn', 'tovoice', 'topt'],
    tags: ['converter'],
    limit: true,
    run: async (sock, m, { prefix, command }) => {
        
        if (!m.quoted) {
            return m.reply(`📌 *Cara Penggunaan:*\nReply video/audio dengan perintah *${prefix + command}*\n\nContoh: ${prefix + command} (reply ke video atau audio)`);
        }

        const mediaTypes = ['videoMessage', 'audioMessage'];
        const hasMedia = mediaTypes.includes(m.quoted.type);
        
        if (!hasMedia) {
            return m.reply(`❌ *Format Salah!*\nHarap reply ke video atau audio.`);
        }

        await m.react('⏳');

        try {
            const mediaBuffer = await m.quoted.download();
            
            if (!mediaBuffer) {
                throw new Error('Gagal mendownload media');
            }

            const fileType = await fileTypeFromBuffer(mediaBuffer);
            const ext = fileType?.ext || 'mp4';
            
            const resultBuffer = await toPTT(mediaBuffer, ext);

            await sock.sendMessage(m.key.remoteJid, {
                audio: resultBuffer,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true
            }, { quoted: m });

            await m.react('✅');

        } catch (error) {
            console.error('Convert to Voice Note error:', error);
            await m.react('❌');
            m.reply(`❌ *Gagal konversi ke Voice Note*\n\nDetail: ${error.message}`);
        }
    }
};
