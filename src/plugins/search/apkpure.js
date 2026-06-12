import axios from 'axios';
import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['apkpure'],
    tags: ['search'],
    run: async (sock, m, { text, prefix, command }) => {
        // 1. Validasi Input
        if (!text) return m.reply(toSmallCaps(`*Format Salah!*\nContoh: ${prefix + command} free fire`));

        await m.react('⏳');

        try {
            // 2. Ambil Data dari API
            const response = await axios.get(`https://api.siputzx.my.id/api/apk/apkpure?search=${encodeURIComponent(text)}`);
            const res = response.data;

            if (!res.status || !res.data || res.data.length === 0) {
                await m.react('❌');
                return m.reply(toSmallCaps('❌ aplikasi tidak ditemukan.'));
            }

            // 3. Susun Pesan Teks
            let caption = `🔍 ${toSmallCaps(`pencarian apkpure: ${text}`)}\n\n`;

            res.data.slice(0, 10).forEach((app, i) => {
                caption += `*${i + 1}. ${app.title.toUpperCase()}*\n`;
                caption += `┌  👤 ${toSmallCaps(`Dev`)} : ${app.developer}\n`;
                caption += `│  ⭐ ${toSmallCaps(`Rating`)} : ${app.rating.score}\n`;
                caption += `└  🔗 ${toSmallCaps(`Link`)} : ${app.link}\n\n`;
            });

            caption += `*_© ${toSmallCaps('mimosa multi-device')}_*`;

            // 4. Kirim Pesan dengan Gambar Fallback
            await sock.sendMessage(m.key.remoteJid, {
                text: caption,
                contextInfo: {
                    externalAdReply: {
                        title: toSmallCaps("apkpure downloader"),
                        body: `hasil pencarian untuk ${text}`,
                        thumbnailUrl: res.data[0].icon, // Menggunakan icon hasil pertama sebagai thumbnail
                        sourceUrl: res.data[0].link,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

            await m.react('✅');

        } catch (e) {
            console.error(e);
            await m.react('❌');
            m.reply(toSmallCaps(`❌ terjadi kesalahan: ${e.message}`));
        }
    }
};