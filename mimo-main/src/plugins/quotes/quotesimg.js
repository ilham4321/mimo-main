import axios from 'axios';

let cacheQuoted = null;
let lastFetch = 0;
const CACHE_DURATION = 3600000;

async function getQuotedList() {
    const now = Date.now();
    if (cacheQuoted && (now - lastFetch) < CACHE_DURATION) {
        return cacheQuoted;
    }
    
    try {
        const url = 'https://raw.githubusercontent.com/BochilTeam/database/master/kata-kata/renungan.json';
        const response = await axios.get(url);
        cacheQuoted = response.data;
        lastFetch = now;
        console.log(`Loaded ${cacheQuoted.length} quotes images`);
        return cacheQuoted;
    } catch (error) {
        console.error('Failed to load quotes data:', error);
        return [
            "https://telegra.ph/file/f52f8d6312f3ac2590727.jpg",
            "https://telegra.ph/file/35cb9decc525a3453ba87.jpg",
            "https://telegra.ph/file/5996566cb5cd615f60f51.jpg"
        ];
    }
}

function getRandomMessage() {
    const messages = [
        "🌸 *Jadilah seperti bunga yang mekar meski terik matahari menyengat*",
        "💫 *Kegagalan hanyalah pelajaran menuju kesuksesan yang lebih besar*",
        "🌻 *Hidup bukan tentang siapa yang tercepat, tapi siapa yang terus melangkah*",
        "🍃 *Jangan bandingkan perjalananmu dengan orang lain*",
        "✨ *Setiap pagi adalah kesempatan untuk memulai kembali*",
        "🌙 *Istirahat yang cukup adalah bentuk cinta pada diri sendiri*",
        "⭐ *Hari ini mungkin berat, tapi kamu masih bisa tersenyum*",
        "💐 *Kebaikan sekecil apapun akan kembali padamu*",
        "🦋 *Jangan takut berubah, karena kupu-kupu pun melewati masa kepompong*",
        "🌊 *Seperti ombak yang selalu kembali ke laut, kesedihan pasti akan berlalu*",
        "🎋 *Bambu melengkung namun tak pernah patah, begitulah seharusnya kita*",
        "🌟 *Cahaya terkecil pun bisa menerangi kegelapan*",
        "🍀 *Hari ini adalah hadiah, itulah kenapa disebut 'present'*"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

export default {
    cmd: ['quotesimg', 'qimg', 'kataimg'],
    tags: ['quotes'],
    limit: false,
    
    run: async (sock, m) => {
        await m.react('⏳');
        
        try {
            const quotesList = await getQuotedList();
            const randomIndex = Math.floor(Math.random() * quotesList.length);
            const imageUrl = quotesList[randomIndex];
            
            const randomMsg = getRandomMessage();
            
            const caption = `*══✿══ kata hari ini ══✿══*
            
> ${randomMsg}

_© HamzzDev_`;

            await sock.sendMessage(m.key.remoteJid, {
                image: { url: imageUrl },
                caption: caption,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363369878409989@newsletter',
                        serverMessageId: Math.floor(Math.random() * 1000),
                        newsletterName: '✨ Mimosa Multi-Device »'
                    },
                }
            }, { quoted: global.fkon });
            
            await m.react('✅');
            
        } catch (error) {
            console.error('Quotes image error:', error);
            await m.react('❌');
            m.reply(`❌ *Gagal mengambil kata renungan*\n\nSilakan coba lagi nanti.`);
        }
    }
};