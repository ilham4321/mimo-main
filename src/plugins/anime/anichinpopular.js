import axios from 'axios';
import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['anichinpopular', 'popularanichin'],
    tags: ['anime'],
    run: async (sock, m, { prefix, command }) => {
        await m.react('⏳');

        try {
            // 1. Ambil Data dari API Popular Anime
            const response = await axios.get(`https://api.siputzx.my.id/api/anime/anichin-popular`);
            const res = response.data;

            if (!res.status || !res.data || !res.data.weekly) {
                await m.react('❌');
                return m.reply(toSmallCaps('❌ daftar anime populer tidak ditemukan.'));
            }

            // 2. Susun Pesan Teks (Daftar Mingguan)
            let caption = `🎬 *${toSmallCaps('anichin weekly popular')}*\n\n`;
            
            const weekly = res.data.weekly.slice(0, 15);
            weekly.forEach((ani) => {
                caption += `🏆 *${toSmallCaps('rank')}* : ${ani.rank}\n`;
                caption += `📌 *${toSmallCaps('title')}* : ${ani.title}\n`;
                caption += `⭐ *${toSmallCaps('rating')}* : ${ani.rating}\n`;
                caption += `🎭 *${toSmallCaps('genres')}* : ${ani.genres.join(', ')}\n`;
                caption += `🔗 *${toSmallCaps('link')}* : ${ani.link}\n\n`;
            });

            caption += `*_© ${toSmallCaps('mimosa multi-device')}_*`;

            // 3. Kirim Pesan dengan Thumbnail dari API
            await sock.sendMessage(m.key.remoteJid, {
                text: caption,
                contextInfo: {
                    externalAdReply: {
                        title: toSmallCaps("anichin popular anime"),
                        body: `menampilkan ${weekly.length} anime terpopuler minggu ini`,
                        // Menggunakan thumbnail dari respon API hasil peringkat pertama
                        thumbnailUrl: weekly[0].image,
                        sourceUrl: "https://anichin.watch/",
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