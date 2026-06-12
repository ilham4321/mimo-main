import fetch from 'node-fetch';
import fs from 'fs';

export default {
    cmd: ['gempa', 'gempaterkini', 'gempadirasakan'],
    tags: ['info'],
    limit: false,
    group: false,

    run: async (sock, m, { prefix, command }) => {
        const chatId = m.key.remoteJid;
        const imagePath = './src/gempa.png';

        try {
            if (!fs.existsSync(imagePath)) {
                return sock.sendMessage(chatId, { text: `❌ File gambar tidak ditemukan di path: ${imagePath}` }, { quoted: global.fVerif });
            }

            const imageBuffer = fs.readFileSync(imagePath);

            if (command === 'gempa' || command === 'gempaterkini') {
                let response = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json');
                let resJson = await response.json();
                let gempaList = resJson?.Infogempa?.gempa;

                if (!gempaList || gempaList.length === 0) {
                    return sock.sendMessage(chatId, { text: `❌ Gagal mengambil data gempa terkini dari server BMKG.` }, { quoted: global.fVerif });
                }

                let dataGempa = gempaList.slice(0, 5);
                let teks = `╭─────────────────┈ ⊹\n│ 🌋 *G E M P A   T E R K I N I* 🌋\n│\n`;
                
                dataGempa.forEach((g, idx) => {
                    teks += `├─ ❏ *[ ${idx + 1} ] M ${g.Magnitude}*\n`;
                    teks += `│  📍 *Wilayah:* ${g.Wilayah}\n`;
                    teks += `│  ⏰ *Waktu:* ${g.Tanggal} - ${g.Jam}\n`;
                    teks += `│  📉 *Kedalaman:* ${g.Kedalaman}\n`;
                    teks += `│  🧭 *Koordinat:* ${g.Coordinates}\n`;
                    teks += `│  ⚠️ *Potensi:* ${g.Potensi}\n`;
                    if (idx < dataGempa.length - 1) teks += `│\n`;
                });
                teks += `╰─────────────────┈ ⊹\n💡 _Ketik *${prefix}gempadirasakan* untuk info gempa yang dirasakan._`;

                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: teks,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363369878409989@newsletter',
                            serverMessageId: Math.floor(Math.random() * 1000),
                            newsletterName: '✨ Mimosa Multi-Device »'
                        }
                    }
                }, { quoted: global.fVerif });
                return;
            }

            if (command === 'gempadirasakan') {
                let response = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json');
                let resJson = await response.json();
                let gempaList = resJson?.Infogempa?.gempa;

                if (!gempaList || gempaList.length === 0) {
                    return sock.sendMessage(chatId, { text: `❌ Gagal mengambil data gempa dirasakan dari server BMKG.` }, { quoted: global.fVerif });
                }

                let dataGempa = gempaList.slice(0, 5);
                let teks = `╭─────────────────┈ ⊹\n│ ⚠️ *G E M P A   D I R A S A K A N* ⚠️\n│\n`;
                
                dataGempa.forEach((g, idx) => {
                    teks += `├─ ❏ *[ ${idx + 1} ] M ${g.Magnitude}*\n`;
                    teks += `│  📍 *Pusat Gempa:* ${g.Wilayah}\n`;
                    teks += `│  ⏰ *Waktu:* ${g.Tanggal} - ${g.Jam}\n`;
                    teks += `│  📉 *Kedalaman:* ${g.Kedalaman}\n`;
                    teks += `│  🧭 *Koordinat:* ${g.Coordinates}\n`;
                    teks += `│  📢 *Dirasakan (MMI):* ${g.Dirasakan}\n`;
                    if (idx < dataGempa.length - 1) teks += `│\n`;
                });
                teks += `╰─────────────────┈ ⊹`;

                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: teks,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363369878409989@newsletter',
                            serverMessageId: Math.floor(Math.random() * 1000),
                            newsletterName: '✨ Mimosa Multi-Device »'
                        }
                    }
                }, { quoted: global.fVerif });
                return;
            }

        } catch (err) {
            console.error('[GEMPA MENU ERROR]', err);
            await sock.sendMessage(chatId, {
                text: `❌ *Gagal mengambil info gempa!*\n\nError: ${err.message}`
            }, { quoted: global.fVerif });
        }
    }
};