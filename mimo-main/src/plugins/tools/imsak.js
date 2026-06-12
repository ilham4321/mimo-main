import axios from 'axios';
import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['imsak', 'jadwalsholat'],
    tags: ['tools'],
    run: async (sock, m, { text, prefix, command }) => {
        if (!text) return m.reply(toSmallCaps(`*${toSmallCaps('format salah')}!*\n${toSmallCaps('contoh')}: ${prefix + command} london, uk`));

        await m.react('⏳');

        try {
            // Menggunakan API Aladhan untuk cakupan seluruh dunia
            const response = await axios.get(`https://api.aladhan.com/v1/timingsByAddress?address=${encodeURIComponent(text)}`);
            
            if (response.data.code !== 200) {
                await m.react('❌');
                return m.reply(toSmallCaps('❌ kota tidak ditemukan. pastikan ejaan benar (contoh: tokyo, japan).'));
            }

            const data = response.data.data;
            const t = data.timings;
            const meta = data.meta;
            const date = data.date;

            let caption = `🌍 *${toSmallCaps('global prayer times')}*\n\n`;
            caption += `📍 *${toSmallCaps('location')}* : ${text}\n`;
            caption += `📅 *${toSmallCaps('date')}* : ${date.readable}\n`;
            caption += `🕒 *${toSmallCaps('timezone')}* : ${meta.timezone}\n\n`;

            caption += `┌  🕒 *${toSmallCaps('imsak')}* : ${t.Imsak}\n`;
            caption += `│  🕋 *${toSmallCaps('fajr')}* : ${t.Fajr}\n`;
            caption += `│  ☀️ *${toSmallCaps('sunrise')}* : ${t.Sunrise}\n`;
            caption += `│  🕛 *${toSmallCaps('dhuhr')}* : ${t.Dhuhr}\n`;
            caption += `│  🕒 *${toSmallCaps('asr')}* : ${t.Asr}\n`;
            caption += `│  🌆 *${toSmallCaps('maghrib')}* : ${t.Maghrib}\n`;
            caption += `└  🌙 *${toSmallCaps('isha')}* : ${t.Isha}\n\n`;

            caption += `*_© ${toSmallCaps('mimosa multi-device')}_*`;

            await m.reply(caption);
            await m.react('✅');

        } catch (e) {
            console.error(e);
            await m.react('❌');
            m.reply(toSmallCaps(`❌ ${toSmallCaps('terjadi kesalahan')}: ${e.message}`));
        }
    }
};