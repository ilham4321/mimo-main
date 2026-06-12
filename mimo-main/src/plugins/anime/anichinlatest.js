import axios from 'axios';
import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['anichinlatest', 'latestanichin'],
    tags: ['anime'],
    run: async (sock, m, { prefix, command }) => {
        await m.react('⏳');

        try {
            // 1. Ambil Data dari API Latest Anime
            const response = await axios.get(`https://api.siputzx.my.id/api/anime/anichin-latest`);
            const res = response.data;

            if (!res.status || !res.data || res.data.length === 0) {
                await m.react('❌');
                return m.reply(toSmallCaps('❌ daftar anime terbaru tidak ditemukan.'));
            }

            // 2. Susun Pesan Teks (Maksimal 15 terbaru)
            let caption = `🎬 *${toSmallCaps('anichin latest update')}*\n\n`;
            
            const latest = res.data.slice(0, 15);
            latest.forEach((ani) => {
                caption += `📌 *${toSmallCaps('title')}* : ${ani.title}\n`;
                caption += `┌  🌀 ${toSmallCaps('type')} : ${ani.type}\n`;
                caption += `│  🎞️ ${toSmallCaps('episode')} : ${ani.episode}\n`;
                caption += `└  🔗 ${toSmallCaps('link')} : ${ani.url}\n\n`;
            });

            caption += `*_© ${toSmallCaps('mimosa multi-device')}_*`;

            // 3. Kirim Pesan dengan Thumbnail dari API
            await sock.sendMessage(m.key.remoteJid, {
                text: caption,
                contextInfo: {
                    externalAdReply: {
                        title: toSmallCaps("anichin latest release"),
                        body: `menampilkan ${latest.length} update terbaru`,
                        // Menggunakan thumbnail dari respon API hasil pertama
                        thumbnailUrl: latest[0].thumbnail,
                        sourceUrl: "https://anichin.cafe/",
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