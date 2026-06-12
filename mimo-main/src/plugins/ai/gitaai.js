import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['gita'],
    tags: ['ai'],
    run: async (sock, m, { text, prefix, command }) => {
        // 1. Validasi Input
        if (!text) return m.reply(toSmallCaps(`*${toSmallCaps('format salah')}!*\n${toSmallCaps('contoh')}: ${prefix + command} apa itu karma?`));

        await m.react('⏳');

        // 2. Setup Gambar Lokal
        const thumbPath = path.join(process.cwd(), 'src', 'mimosa.png');
        let thumbBuffer;
        try {
            thumbBuffer = fs.readFileSync(thumbPath);
        } catch (err) {
            thumbBuffer = null; 
        }

        try {
            // 3. Ambil Data dari API Gita AI
            const response = await axios.get(`https://api.siputzx.my.id/api/ai/gita?q=${encodeURIComponent(text)}`);
            const res = response.data;

            if (!res.status || !res.data) {
                await m.react('❌');
                return m.reply(toSmallCaps('❌ maaf, tidak ada jawaban dari gita ai.'));
            }

            // 4. Susun Pesan
            let caption = `✨ *${toSmallCaps('gita ai assistant')}*\n\n`;
            caption += `❓ *${toSmallCaps('question')}* : ${text}\n\n`;
            caption += `📝 *${toSmallCaps('answer')}* :\n${res.data}\n\n`;
            caption += `*_© ${toSmallCaps('mimosa multi-device')}_*`;

            // 5. Kirim Pesan dengan Gambar Lokal
            await sock.sendMessage(m.key.remoteJid, {
                text: caption,
                contextInfo: {
                    externalAdReply: {
                        title: toSmallCaps("gita ai assistant"),
                        body: "wisdom & spiritual guidance",
                        thumbnail: thumbBuffer,
                        sourceUrl: "https://whatsapp.com/channel/0029VaFqS8I5Ui2TjO7d9W2L",
                        mediaType: 1,
                        renderLargerThumbnail: true
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