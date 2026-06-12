import { toMP3 } from '../../lib/converter.js';
import { fileTypeFromBuffer } from 'file-type';

export default {
    cmd: ['tomp3'],
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
            
            const resultBuffer = await toMP3(mediaBuffer, ext);

            await sock.sendMessage(m.key.remoteJid, {
                audio: resultBuffer,
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: m });

            await m.react('✅');

        } catch (error) {
            console.error('Convert to MP3 error:', error);
            await m.react('❌');
            m.reply(`❌ *Gagal konversi ke MP3*\n\nDetail: ${error.message}`);
        }
    }
};
