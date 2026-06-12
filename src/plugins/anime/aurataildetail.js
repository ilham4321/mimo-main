import axios from 'axios';
import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['auratail', 'aurataildetail'],
    tags: ['anime'],
    run: async (sock, m, { text, prefix, command }) => {
        // 1. Validasi Input
        if (!text) return m.reply(toSmallCaps(`*${toSmallCaps('format salah')}!*\n${toSmallCaps('contoh')}: ${prefix + command} https://auratail.vip/the-war-of-cards/`));

        await m.react('⏳');

        try {
            // 2. Ambil Data dari API Auratail Detail
            const response = await axios.get(`https://api.siputzx.my.id/api/anime/auratail-detail?url=${encodeURIComponent(text)}`);
            const res = response.data;

            if (!res.status || !res.data) {
                await m.react('❌');
                return m.reply(toSmallCaps('❌ data anime tidak ditemukan.'));
            }

            const d = res.data;

            // 3. Susun Pesan Teks (Smallcaps)
            let caption = `🎬 *${toSmallCaps('auratail anime detail')}*\n\n`;
            caption += `📌 *${toSmallCaps('title')}* : ${d.title}\n`;
            caption += `📊 *${toSmallCaps('status')}* : ${d.status}\n`;
            caption += `🏢 *${toSmallCaps('studio')}* : ${d.studio || '-'}\n`;
            caption += `🎞️ *${toSmallCaps('episodes')}* : ${d.episodes}\n`;
            caption += `🌀 *${toSmallCaps('type')}* : ${d.type}\n`;
            caption += `📅 *${toSmallCaps('released')}* : ${d.releaseYear}\n`;
            caption += `🎭 *${toSmallCaps('genres')}* : ${d.genres}\n\n`;
            
            caption += `📝 *${toSmallCaps('synopsis')}* :\n${d.synopsis}\n\n`;
            caption += `*_© ${toSmallCaps('mimosa multi-device')}_*`;

            // 4. Kirim Pesan dengan Thumbnail dari API
            await sock.sendMessage(m.key.remoteJid, {
                text: caption,
                contextInfo: {
                    externalAdReply: {
                        title: toSmallCaps(d.title),
                        body: `status: ${d.status} | year: ${d.releaseYear}`,
                        // Menggunakan thumbnail dari respon API
                        thumbnailUrl: d.image,
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