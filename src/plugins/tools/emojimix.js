import axios from 'axios';
import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['emojimix', 'mixemoji'],
    tags: ['tools'],
    run: async (sock, m, { text, prefix, command }) => {
        if (!text || !text.includes('+')) {
            return m.reply(toSmallCaps(`*${toSmallCaps('format salah')}!*\n${toSmallCaps('contoh')}: ${prefix + command} 🥰+😎`));
        }

        const [emoji1, emoji2] = text.split('+').map(e => e.trim());
        await m.react('⏳');

        try {
            const apiUrl = `https://www.ditss.biz.id/api/tools/emojimix?emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}`;
            
            // Mengambil buffer gambar agar stiker dapat terbaca dengan benar
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'utf-8');

            await sock.sendMessage(m.key.remoteJid, {
                sticker: buffer,
                contextInfo: {
                    externalAdReply: {
                        title: toSmallCaps("emojimix assistant"),
                        body: `${emoji1} + ${emoji2} = ✨`,
                        thumbnailUrl: "https://files.catbox.moe/2mq5qq.png", 
                        sourceUrl: "https://whatsapp.com/channel/0029VaFqS8I5Ui2TjO7d9W2L",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });

            await m.react('✅');

        } catch (e) {
            console.error(e);
            await m.react('❌');
            m.reply(toSmallCaps(`❌ ${toSmallCaps('terjadi kesalahan')}: ${e.message}`));
        }
    }
};