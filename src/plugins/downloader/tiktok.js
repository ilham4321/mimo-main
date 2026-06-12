import axios from 'axios';
import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['tiktok', 'tt', 'ttdl'],
    tags: ['downloader'],
    run: async (sock, m, { text, prefix, command }) => {
        // 1. Validasi Input
        if (!text) return m.reply(toSmallCaps(`*${toSmallCaps('format salah')}!*\n${toSmallCaps('contoh')}: ${prefix + command} https://vt.tiktok.com/ZSjXNEnbC/`));

        await m.react('⏳');

        try {
            // 2. Ambil Data dari API TikTok Downloader
            const response = await axios.get(`https://api.siputzx.my.id/api/d/tiktok/v2?url=${encodeURIComponent(text)}`);
            const res = response.data;

            if (!res.status || !res.data) {
                await m.react('❌');
                return m.reply(toSmallCaps('❌ video tidak ditemukan atau link tidak valid.'));
            }

            const d = res.data;

            // 3. Susun Informasi Video (Smallcaps)
            let caption = `🎬 *${toSmallCaps('tiktok downloader')}*\n\n`;
            caption += `👤 *${toSmallCaps('nickname')}* : ${d.author_nickname || '-'}\n`;
            caption += `❤️ *${toSmallCaps('like')}* : ${d.like_count}\n`;
            caption += `💬 *${toSmallCaps('comment')}* : ${d.comment_count}\n`;
            caption += `🔁 *${toSmallCaps('share')}* : ${d.share_count}\n`;
            caption += `▶️ *${toSmallCaps('play')}* : ${d.play_count}\n\n`;
            caption += `*_© ${toSmallCaps('mimosa multi-device')}_*`;

            // 4. Kirim Video Tanpa Watermark
            await sock.sendMessage(m.key.remoteJid, {
                video: { url: d.no_watermark_link_hd || d.no_watermark_link },
                caption: caption,
                contextInfo: {
                    externalAdReply: {
                        title: toSmallCaps(d.author_nickname || "tiktok video"),
                        body: toSmallCaps("no watermark downloader"),
                        // Menggunakan thumbnail cover dari respon API
                        thumbnailUrl: d.cover_link,
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
};