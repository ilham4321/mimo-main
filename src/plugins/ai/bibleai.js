import axios from 'axios';
import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['bible', 'bibleai'],
    tags: ['ai'],
    run: async (sock, m, { text, prefix, command }) => {
        // 1. Jika format salah atau tanpa teks, tampilkan daftar lengkap
        if (!text || !text.includes('|')) {
            let helpText = `📖 *${toSmallCaps('bible ai assistant')}*\n\n`;
            helpText += `*${toSmallCaps('format')}* : ${prefix + command} ${toSmallCaps('pertanyaan')}|${toSmallCaps('kode')}\n`;
            helpText += `*${toSmallCaps('contoh')}* : ${prefix + command} what is faith?|ESV\n\n`;
            
            helpText += `*${toSmallCaps('daftar versi tersedia')}* :\n`;
            helpText += `◦ ${toSmallCaps('irvben, cuv, nld1939, nbg, esv')}\n`;
            helpText += `◦ ${toSmallCaps('nasb20, asv14, kjv11, lsg, lut')}\n`;
            helpText += `◦ ${toSmallCaps('irvhin, paba, tb, db1885, nr06')}\n`;
            helpText += `◦ ${toSmallCaps('polubg, aa, rvr09, skb, sv1917')}\n`;
            helpText += `◦ ${toSmallCaps('kjv, irvurd, dgv, ervvi')}\n\n`;
            
            helpText += `*_© ${toSmallCaps('mimosa multi-device')}_*`;
            
            return m.reply(helpText);
        }

        // 2. Parsing input
        const [query, version] = text.split('|');
        if (!version) return m.reply(toSmallCaps(`*format salah!* gunakan pemisah | untuk kode versi.`));

        await m.react('⏳');

        try {
            // 3. Panggil API
            const response = await axios.get(`https://api.siputzx.my.id/api/ai/bibleai?question=${encodeURIComponent(query)}&translation=${version.trim()}`);
            const res = response.data;

            if (!res.status || !res.data) {
                await m.react('❌');
                return m.reply(toSmallCaps('❌ maaf, jawaban tidak ditemukan untuk versi tersebut.'));
            }

            // 4. Susun Respon
            const { question, translation, results } = res.data;
            let caption = `📖 *${toSmallCaps('bible ai response')}*\n\n`;
            caption += `❓ *${toSmallCaps('question')}* : ${question}\n`;
            caption += `📚 *${toSmallCaps('version')}* : ${translation}\n\n`;
            caption += `📝 *${toSmallCaps('answer')}* :\n${results.answer}\n\n`;
            
            if (results.sources && results.sources.length > 0) {
                caption += `📍 *${toSmallCaps('sources')}* :\n`;
                results.sources.forEach((src, i) => {
                    caption += `${i + 1}. ${src.text}\n`;
                });
            }

            caption += `\n*_© ${toSmallCaps('mimosa multi-device')}_*`;

            // 5. Kirim Pesan
            await sock.sendMessage(m.key.remoteJid, {
                text: caption,
                contextInfo: {
                    externalAdReply: {
                        title: toSmallCaps("bible ai assistant"),
                        body: `translation: ${translation}`,
                        thumbnailUrl: "https://files.catbox.moe/2mq5qq.png", 
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
            m.reply(toSmallCaps(`❌ terjadi kesalahan: ${e.message}`));
        }
    }
};