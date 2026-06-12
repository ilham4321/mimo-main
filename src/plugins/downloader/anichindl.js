import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['anichindl'],
    tags: ['downloader'],
    run: async (sock, m, { text, prefix, command }) => {
        if (!text) return m.reply(toSmallCaps(`*${toSmallCaps('format salah')}!*\n${toSmallCaps('contoh')}: ${prefix + command} https://anichin.cafe/renegade-immortal-episode-69-subtitle-indonesia/`));

        await m.react('⏳');

        // Setup Gambar Lokal
        const thumbPath = path.join(process.cwd(), 'src', 'mimosa.png');
        let thumbBuffer;
        try {
            thumbBuffer = fs.readFileSync(thumbPath);
        } catch (err) {
            thumbBuffer = null;
        }

        try {
            const response = await axios.get(`https://api.siputzx.my.id/api/anime/anichin-download?url=${encodeURIComponent(text)}`);
            const res = response.data;

            if (!res.status || !res.data || res.data.length === 0) {
                await m.react('❌');
                return m.reply(toSmallCaps('❌ link unduhan tidak ditemukan.'));
            }

            // Susun Teks
            let caption = `📥 *${toSmallCaps('anichin downloader')}*\n\n`;
            
            res.data.forEach((item) => {
                caption += `📺 *${toSmallCaps('resolution')}* : ${item.resolution}\n`;
                item.links.forEach((dl) => {
                    caption += `◦ ${toSmallCaps(dl.host)} : ${dl.link}\n`;
                });
                caption += `\n`;
            });

            caption += `*_© ${toSmallCaps('mimosa multi-device')}_*`;

            // Kirim Pesan dengan Gambar Lokal
            await sock.sendMessage(m.key.remoteJid, {
                text: caption,
                contextInfo: {
                    externalAdReply: {
                        title: toSmallCaps("anichin download list"),
                        body: "simple. fast. secure.",
                        thumbnail: thumbBuffer,
                        sourceUrl: text,
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
}