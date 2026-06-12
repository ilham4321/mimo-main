import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['anichindetail'],
    tags: ['anime'],
    run: async (sock, m, { text, prefix, command }) => {
        if (!text) return m.reply(toSmallCaps(`*${toSmallCaps('format salah')}!*\n${toSmallCaps('contoh')}: ${prefix + command} https://anichin.cafe/renegade-immortal-episode-69-subtitle-indonesia/`));

        await m.react('⏳');

        try {
            const response = await axios.get(`https://api.siputzx.my.id/api/anime/anichin-detail?url=${encodeURIComponent(text)}`);
            const res = response.data;

            if (!res.status || !res.data) {
                await m.react('❌');
                return m.reply(toSmallCaps('❌ data anime tidak ditemukan.'));
            }

            const d = res.data;
            let caption = `🎬 *${toSmallCaps('anichin anime detail')}*\n\n`;
            caption += `📌 *${toSmallCaps('title')}* : ${d.title}\n`;
            caption += `⭐ *${toSmallCaps('rating')}* : ${d.rating}\n`;
            caption += `🎭 *${toSmallCaps('genres')}* : ${d.genres.join(', ')}\n`;
            caption += `📅 *${toSmallCaps('released')}* : ${d.released}\n`;
            caption += `🏢 *${toSmallCaps('studio')}* : ${d.studio}\n`;
            caption += `🕒 *${toSmallCaps('duration')}* : ${d.duration}\n`;
            caption += `🌏 *${toSmallCaps('country')}* : ${d.country}\n`;
            caption += `🌀 *${toSmallCaps('type')}* : ${d.type}\n`;
            caption += `📊 *${toSmallCaps('status')}* : ${d.status}\n\n`;
            
            if (d.alternativeTitles) {
                caption += `📝 *${toSmallCaps('alias')}* : ${d.alternativeTitles}\n\n`;
            }

            caption += `*_© ${toSmallCaps('mimosa multi-device')}_*`;

            await sock.sendMessage(m.key.remoteJid, {
                text: caption,
                contextInfo: {
                    externalAdReply: {
                        title: toSmallCaps(d.title),
                        body: `status: ${d.status} | type: ${d.type}`,
                        thumbnailUrl: d.thumbnail,
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