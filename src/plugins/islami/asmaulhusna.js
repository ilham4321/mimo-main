import fetch from 'node-fetch';

export default {
    cmd: ['asmaulhusna', 'asmaul'],
    tags: ['islami'],
    limit: false,
    group: false,

    run: async (sock, m, { prefix, command, text }) => {
        const chatId = m.key.remoteJid;

        try {
            const res = await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/religi/asmaulhusna.json');
            const data = await res.json();
            
            let gameData;
            let titleMenu = '';

            if (text && !isNaN(text)) {
                const indexQuery = parseInt(text);
                if (indexQuery < 1 || indexQuery > 99) {
                    return sock.sendMessage(chatId, {
                        text: `❌ *Nomor urutan tidak valid!*\n\nSilahkan masukkan angka antara *1 sampai 99*.\nContoh: \`${prefix}${command} 5\``
                    }, { quoted: global.fVerif });
                }
                gameData = data.find(item => item.index === indexQuery);
                titleMenu = `🕌 *A S M A U L   H U S N A* (Urutan Ke-${indexQuery})`;
            } else {
                const randomIndex = Math.floor(Math.random() * data.length);
                gameData = data[randomIndex];
                titleMenu = `🕌 *A S M A U L   H U S N A* (Random)`;
            }

            if (!gameData) {
                return sock.sendMessage(chatId, { text: `❌ Data Asmaul Husna tidak ditemukan.` }, { quoted: global.fVerif });
            }

            const responText = `╭─────────────────┈ ⊹
│ ${titleMenu}
│
├─ ❏ 🔢 *No. Urutan:* ${gameData.index}
├─ ❏ 🔤 *Nama Latin:* *${gameData.latin}*
│
├─ ❏ 🕋 *Tulisan Arab:* 
│     👉  ${gameData.arabic}  👈
│
├─ ❏ 🇮🇩 *Arti (Indonesia):*
│     _"${gameData.translation_id}"_
│
├─ ❏ 🇬🇧 *Arti (English):*
│     _"${gameData.translation_en}"_
│
╰─────────────────┈ ⊹
💡 _Ketik *${prefix}${command} [1-99]* untuk mencari urutan tertentu._`;

            await sock.sendMessage(chatId, {
                text: responText,
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

        } catch (err) {
            console.error('[ASMAUL HUSNA MENU ERROR]', err);
            await sock.sendMessage(chatId, {
                text: `❌ *Gagal memuat data Islami!*\n\nError: ${err.message}`
            }, { quoted: global.fVerif });
        }
    }
};
