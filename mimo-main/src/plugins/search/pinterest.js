import axios from 'axios';
import * as cheerio from 'cheerio';
import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['pin', 'pinterest'],
    tags: ['search'],
    run: async (sock, m, { text, prefix, command }) => {
        if (!text) return m.reply(toSmallCaps(`*${toSmallCaps('format salah')}!*\n${toSmallCaps('contoh')}: ${prefix + command} anime girl`));

        await m.react('⏳');

        try {
            // Melakukan scraping langsung ke Pinterest
            const { data } = await axios.get(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(text)}`, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
                }
            });

            const $ = cheerio.load(data);
            const images = [];

            // Mencari URL gambar di dalam tag img
            $('img').each((i, el) => {
                const url = $(el).attr('src');
                if (url && url.includes('originals') || url?.includes('736x')) {
                    images.push(url.replace(/236x/, '736x')); // Mengambil kualitas lebih tinggi
                } else if (url) {
                    images.push(url);
                }
            });

            if (images.length === 0) {
                await m.react('❌');
                return m.reply(toSmallCaps('❌ tidak ada gambar yang ditemukan.'));
            }

            // Pilih gambar secara acak
            const result = images[Math.floor(Math.random() * images.length)];

            await sock.sendMessage(m.key.remoteJid, {
                image: { url: result },
                caption: `✨ *${toSmallCaps('pinterest search')}*\n🔎 *${toSmallCaps('query')}*: ${text}\n\n*_© ${toSmallCaps('mimosa multi-device')}_*`,
                contextInfo: {
                    externalAdReply: {
                        title: toSmallCaps("pinterest scraper"),
                        body: `result for: ${text}`,
                        thumbnailUrl: result,
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