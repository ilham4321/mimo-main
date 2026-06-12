import axios from 'axios';

export default {
    cmd: ['apkmody'],
    tags: ['search'],

    run: async (sock, m, { args }) => {
        try {
            if (!args[0]) {
                return sock.sendMessage(
                    m.key.remoteJid,
                    { text: 'Mau cari apk apa?\nContoh: *.apkmody free fire*' },
                    { quoted: m }
                );
            }

            const query = args.join(' ');

            const { data } = await axios.get(
                'https://api.siputzx.my.id/api/apk/apkmody',
                {
                    params: { search: query },
                    timeout: 20000
                }
            );

            if (!data?.status || !data.data?.length) {
                return sock.sendMessage(
                    m.key.remoteJid,
                    { text: 'Apknya gak ketemu 😅 coba kata lain.' },
                    { quoted: m }
                );
            }

            let text = `📦 *Hasil pencarian APKMODY*\n`;
            text += `🔎 *Keyword:* ${query}\n\n`;

            data.data.slice(0, 5).forEach((apk, i) => {
                text +=
                    `*${i + 1}. ${apk.title}*\n` +
                    `📌 Versi: ${apk.version || '-'}\n` +
                    `🎮 Genre: ${apk.genre || '-'}\n` +
                    `✨ Fitur: ${apk.features || '-'}\n` +
                    `⭐ Rating: ${apk.rating?.stars || 0} (${apk.rating?.percentage || 0}%)\n` +
                    `🔗 Link: ${apk.link}\n\n`;
            });

            text += `_Note: Download lewat browser ya._`;

            await sock.sendMessage(
                m.key.remoteJid,
                { text },
                { quoted: m }
            );

        } catch (err) {
            console.error('[APKMODY ERROR]', err.message);
            await sock.sendMessage(
                m.key.remoteJid,
                { text: 'Lagi error 😵 coba lagi nanti.' },
                { quoted: m }
            );
        }
    }
};