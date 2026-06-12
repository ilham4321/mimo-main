import axios from 'axios';

export default {
    cmd: ['an1'],
    tags: ['search'],

    run: async (sock, m, { args }) => {
        try {
            if (!args[0]) {
                return sock.sendMessage(
                    m.key.remoteJid,
                    { text: 'Ketik nama apk yang mau dicari.\nContoh: *.an1 pou*' },
                    { quoted: m }
                );
            }

            const query = args.join(' ');

            const { data } = await axios.get(
                'https://api.siputzx.my.id/api/apk/an1',
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

            let text = `📦 *Hasil pencarian AN1*\n`;
            text += `🔎 *Keyword:* ${query}\n\n`;

            data.data.slice(0, 5).forEach((apk, i) => {
                text +=
                    `*${i + 1}. ${apk.title}*\n` +
                    `👨‍💻 Developer: ${apk.developer || '-'}\n` +
                    `⭐ Rating: ${apk.rating?.value || '-'} (${apk.rating?.percentage || 0}%)\n` +
                    `🧩 Tipe: ${apk.type || 'APK'}\n` +
                    `🔗 Link: ${apk.link}\n\n`;
            });

            text += `_Note: Download lewat browser ya._`;

            await sock.sendMessage(
                m.key.remoteJid,
                { text },
                { quoted: m }
            );

        } catch (err) {
            console.error('[AN1 ERROR]', err.message);
            await sock.sendMessage(
                m.key.remoteJid,
                { text: 'Lagi error 😵 coba lagi nanti.' },
                { quoted: m }
            );
        }
    }
};