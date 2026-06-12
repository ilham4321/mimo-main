import axios from 'axios';
import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['anichinsearch', 'anisearch'],
    tags: ['anime'],
    run: async (sock, m, { text, prefix, command }) => {
        // 1. Validasi Input
        if (!text) return m.reply(toSmallCaps(`*${toSmallCaps('format salah')}!*\n${toSmallCaps('contoh')}: ${prefix + command} naga`));

        await m.react('⏳');

        try {
            // 2. Ambil Data dari API Search Anime
            const response = await axios.get(`https://api.siputzx.my.id/api/anime/anichin-search?query=${encodeURIComponent(text)}`);
            const res = response.data;

            if (!res.status || !res.data || res.data.length === 0) {
                await m.react('❌');
                return m.reply(toSmallCaps('❌ anime tidak ditemukan.'));
            }

            // 3. Susun Pesan Teks (Maksimal 15 hasil)
            let caption = `🔍 *${toSmallCaps('anichin search result')}*\n\n`;
            
            const results = res.data.slice(0, 15);
            results.forEach((ani) => {
                caption += `📌 *${toSmallCaps('title')}* : ${ani.title}\n`;
                caption += `┌  🌀 ${toSmallCaps('type')} : ${ani.type}\n`;
                caption += `│  📊 ${toSmallCaps('status')} : ${ani.status}\n`;
                caption += `└  🔗 ${toSmallCaps('link')} : ${ani.link}\n\n`;
            });

            caption += `*_© ${toSmallCaps('mimosa multi-device')}_*`;

            // 4. Kirim Pesan dengan Thumbnail dari API
            await sock.sendMessage(m.key.remoteJid, {
                text: caption,
                contextInfo: {
                    externalAdReply: {
                        title: toSmallCaps("anichin anime search"),
                        body: `menampilkan ${results.length} hasil untuk: ${text}`,
                        // Menggunakan thumbnail dari respon API hasil pertama
                        thumbnailUrl: results[0].image,
                        sourceUrl: results[0].link,
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