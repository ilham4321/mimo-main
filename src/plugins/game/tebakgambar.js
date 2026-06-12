import axios from 'axios';

let timeout = 60000;
let poinMoney = 5000;
let poinLimit = 10;

if (!global.gameTebakGambar) global.gameTebakGambar = {};

async function loadGameData() {
    if (global.gameDataTebakGambar) return global.gameDataTebakGambar;
    try {
        const url = 'https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar.json';
        const response = await axios.get(url);
        global.gameDataTebakGambar = response.data;
        console.log(`Loaded ${global.gameDataTebakGambar.length} tebak gambar questions`);
        return global.gameDataTebakGambar;
    } catch (error) {
        console.error('Failed to load tebak gambar data:', error);
        throw new Error('Gagal memuat database game');
    }
}

export default {
    cmd: ['tebakgambar', 'tg', 'tebakgambar'],
    tags: ['game'],
    limit: false,
    group: true,

    run: async (sock, m, { user, prefix, command, args }) => {
        const chatId = m.key.remoteJid;
        
        if (command === 'nyerah') {
            if (global.gameTebakGambar && global.gameTebakGambar[chatId]) {
                const jawaban = global.gameTebakGambar[chatId].jawaban;
                const deskripsi = global.gameTebakGambar[chatId].deskripsi;
                clearTimeout(global.gameTebakGambar[chatId].timer);
                await sock.sendMessage(chatId, { 
                    text: `😔 *NYERAH!*\n\nJawabannya adalah *${jawaban}*\n📝 *Deskripsi:* ${deskripsi}\n\n✨ Ketik *.tebakgambar* untuk bermain lagi!` 
                }, { quoted: global.fVerif });
                delete global.gameTebakGambar[chatId];
            } else {
                await sock.sendMessage(chatId, { 
                    text: `❌ *Tidak ada game yang sedang berjalan!*\n\nKetik *.tebakgambar* untuk memulai.` 
                }, { quoted: global.fVerif });
            }
            return;
        }
        
        if (command === 'hint' || command === 'clues') {
            if (!global.gameTebakGambar || !global.gameTebakGambar[chatId]) {
                return sock.sendMessage(chatId, { 
                    text: `❌ *Tidak ada game yang sedang berjalan!*` 
                }, { quoted: global.fVerif });
            }
            const jawaban = global.gameTebakGambar[chatId].jawaban;
            const panjang = jawaban.length;
            const hurufVokal = jawaban.match(/[AIUEO]/gi) || [];
            let clue = jawaban[0] + '*'.repeat(panjang - 2) + jawaban[panjang - 1];
            await sock.sendMessage(chatId, { 
                text: `💡 *HINT / CLUE*\n\n🔍 Petunjuk: ${clue}\n📏 Panjang: ${panjang} huruf\n🔊 Huruf vokal: ${hurufVokal.length} buah\n💬 3 huruf pertama: ${jawaban.substring(0, 3)}` 
            }, { quoted: global.fVerif });
            return;
        }
        
        if (command === 'tebakgambar' || command === 'tg') {
            if (global.gameTebakGambar[chatId]) {
                return sock.sendMessage(chatId, { 
                    text: `❌ *Masih ada game yang sedang berjalan!*\n\nKetik *nyerah* untuk menyerah atau *hint* untuk petunjuk.` 
                }, { quoted: global.fVerif });
            }
            
            try {
                await m.react('⏳');
                
                const data = await loadGameData();
                const randomIndex = Math.floor(Math.random() * data.length);
                const gameData = data[randomIndex];
                const level = Math.floor(randomIndex / 20) + 1;
                
                global.gameTebakGambar[chatId] = {
                    soal: gameData,
                    jawaban: gameData.jawaban,
                    deskripsi: gameData.deskripsi,
                    level: level,
                    timer: null,
                    aktif: true
                };
                
                const caption = `🎮 *TEBAK GAMBAR*
                
🔍 *Level:* ${level}
⏰ *Waktu:* 60 detik
💰 *Hadiah:* Rp${poinMoney.toLocaleString()} + ${poinLimit} limit

💡 *Ketik "hint" untuk petunjuk*
😔 *Ketik "nyerah" untuk menyerah*

📌 *Kirim jawaban langsung!*`;
                
                await sock.sendMessage(chatId, {
                    image: { url: gameData.img },
                    caption: caption
                }, { quoted: global.fVerif });
                
                const timer = setTimeout(async () => {
                    if (global.gameTebakGambar[chatId] && global.gameTebakGambar[chatId].aktif) {
                        const jawaban = global.gameTebakGambar[chatId].jawaban;
                        const deskripsi = global.gameTebakGambar[chatId].deskripsi;
                        await sock.sendMessage(chatId, { 
                            text: `⏰ *WAKTU HABIS!*\n\nJawabannya adalah *${jawaban}*\n📝 *Deskripsi:* ${deskripsi}\n\n✨ Ketik *.tebakgambar* untuk bermain lagi!` 
                        }, { quoted: global.fVerif });
                        delete global.gameTebakGambar[chatId];
                    }
                }, timeout);
                
                global.gameTebakGambar[chatId].timer = timer;
                await m.react('✅');
                
            } catch (err) {
                console.error('[TEBAK GAMBAR ERROR]', err);
                delete global.gameTebakGambar[chatId];
                await sock.sendMessage(chatId, { 
                    text: `❌ *Gagal memulai game!*\n\nSilakan coba lagi.` 
                }, { quoted: global.fVerif });
                await m.react('❌');
            }
            return;
        }
    },
    
    all: async (sock, m, { isGroup, user }) => {
        if (!isGroup) return;
        
        const chatId = m.key.remoteJid;
        
        if (!global.gameTebakGambar || !global.gameTebakGambar[chatId]) return;
        if (!global.gameTebakGambar[chatId].aktif) return;
        
        let pesan = '';
        if (m.message?.conversation) pesan = m.message.conversation;
        else if (m.msg?.text) pesan = m.msg.text;
        else return;
        
        if (pesan.startsWith('.') || pesan.startsWith('#') || pesan.startsWith('!')) return;
        
        const pesanLower = pesan.toLowerCase().trim();
        const jawabanBenar = global.gameTebakGambar[chatId].jawaban.toLowerCase();
        
        if (pesanLower === 'nyerah') {
            const jawaban = global.gameTebakGambar[chatId].jawaban;
            const deskripsi = global.gameTebakGambar[chatId].deskripsi;
            clearTimeout(global.gameTebakGambar[chatId].timer);
            await sock.sendMessage(chatId, { 
                text: `😔 *NYERAH!*\n\nJawabannya adalah *${jawaban}*\n📝 *Deskripsi:* ${deskripsi}\n\n✨ Ketik *.tebakgambar* untuk bermain lagi!` 
            }, { quoted: global.fVerif });
            delete global.gameTebakGambar[chatId];
            return;
        }
        
        if (pesanLower === 'hint' || pesanLower === 'clues') {
            const jawaban = global.gameTebakGambar[chatId].jawaban;
            const panjang = jawaban.length;
            const hurufVokal = jawaban.match(/[AIUEO]/gi) || [];
            let clue = jawaban[0] + '*'.repeat(panjang - 2) + jawaban[panjang - 1];
            await sock.sendMessage(chatId, { 
                text: `💡 *HINT / CLUE*\n\n🔍 Petunjuk: ${clue}\n📏 Panjang: ${panjang} huruf\n🔊 Huruf vokal: ${hurufVokal.length} buah\n💬 3 huruf pertama: ${jawaban.substring(0, 3)}` 
            }, { quoted: global.fVerif });
            return;
        }
        
        if (pesanLower === jawabanBenar) {
            clearTimeout(global.gameTebakGambar[chatId].timer);
            
            if (user && user.rpg) {
                user.rpg.money = (user.rpg.money || 0) + poinMoney;
                user.limit = (user.limit || 0) + poinLimit;
                await user.save();
            }
            
            await sock.sendMessage(chatId, { 
                text: `✅ *BENAR!* 🎉
                
🎯 Jawaban *${global.gameTebakGambar[chatId].jawaban}* benar!
📝 *Deskripsi:* ${global.gameTebakGambar[chatId].deskripsi}

🏆 *Kamu mendapatkan:*
💰 +${poinMoney.toLocaleString()} uang
🎫 +${poinLimit} limit

✨ Ketik *.tebakgambar* untuk bermain lagi!` 
            }, { quoted: global.fVerif });
            delete global.gameTebakGambar[chatId];
            return;
        }
        
        await sock.sendMessage(chatId, { 
            text: `❌ *SALAH!*\n\nJawaban *${pesan}* tidak tepat.\n💡 Coba lagi atau ketik *hint* untuk petunjuk.\n😔 Ketik *nyerah* untuk menyerah.`
        }, { quoted: global.fVerif });
    }
};