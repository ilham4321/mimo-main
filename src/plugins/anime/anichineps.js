import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['anichineps'],
    tags: ['anime'],
    run: async (sock, m, { text, prefix, command }) => {
        // 1. Validasi Input
        if (!text) return m.reply(toSmallCaps(`*${toSmallCaps('format salah')}!*\n${toSmallCaps('contoh')}: ${prefix + command} https://anichin.cafe/renegade-immortal/`));

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
            // 3. Ambil Data dari API
            const response = await axios.get(`https://api.siputzx.my.id/api/anime/anichin-episode?url=${encodeURIComponent(text)}`);
            const res = response.data;

            if (!res.status || !res.data || res.data.length === 0) {
                await m.react('❌');
                return m.reply(toSmallCaps('❌ daftar episode tidak ditemukan.'));
            }

            // 4. Susun Pesan Teks (Maksimal 20 episode terbaru agar tidak terlalu panjang)
            let caption = `🎬 *${toSmallCaps('anichin episode list')}*\n\n`;
            
            const episodes = res.data.slice(0, 20);
            episodes.forEach((eps) => {
                caption += `*${toSmallCaps('episode')}* ${eps.episodeNumber}\n`;
                caption += `┌  📝 ${toSmallCaps('status')} : ${eps.subStatus}\n`;
                caption += `│  📅 ${toSmallCaps('release')} : ${eps.releaseDate}\n`;
                caption += `└  🔗 ${toSmallCaps('link')} : ${eps.link}\n\n`;
            });

            caption += `*_© ${toSmallCaps('mimosa multi-device')}_*`;

            // 5. Kirim Pesan dengan Gambar Lokal
            await sock.sendMessage(m.key.remoteJid, {
                text: caption,
                contextInfo: {
                    externalAdReply: {
                        title: toSmallCaps("anichin episode assistant"),
                        body: `menampilkan ${episodes.length} episode terbaru`,
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