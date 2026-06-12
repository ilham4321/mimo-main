let timeout = 60000;
let poinExp = 100;
let poinMoney = 1000;

global.gameTebakAngka = global.gameTebakAngka || {};

export default {
    cmd: ['tebakangka', 'nyerah'],
    tags: ['game'],
    limit: false,

    run: async (sock, m, { user, args, command }) => {
        const chatId = m.key.remoteJid;
        
        if (command === 'nyerah') {
            if (global.gameTebakAngka && global.gameTebakAngka[chatId]) {
                const target = global.gameTebakAngka[chatId].target;
                clearTimeout(global.gameTebakAngka[chatId].timer);
                await sock.sendMessage(chatId, { text: `😔 *NYERAH!*\n\nAngka yang benar adalah *${target}*` }, { quoted: global.fVerif });
                delete global.gameTebakAngka[chatId];
            } else {
                await sock.sendMessage(chatId, { text: `❌ *Tidak ada game yang sedang berjalan!*` }, { quoted: global.fVerif });
            }
            return;
        }
        
        if (command === 'tebakangka') {
            if (global.gameTebakAngka[chatId]) {
                if (!args[0]) {
                    return sock.sendMessage(chatId, { text: `❌ *Masukkan angka tebakan!*\n\nContoh: .tebakangka 50` }, { quoted: global.fVerif });
                }
                
                let userGuess = parseInt(args[0]);
                
                if (isNaN(userGuess)) {
                    return sock.sendMessage(chatId, { text: `❌ *Masukkan angka yang valid!*` }, { quoted: global.fVerif });
                }
                
                if (userGuess < 1 || userGuess > 100) {
                    return sock.sendMessage(chatId, { text: `❌ *Angka harus antara 1 - 100!*` }, { quoted: global.fVerif });
                }
                
                const targetNumber = global.gameTebakAngka[chatId].target;
                
                if (userGuess === targetNumber) {
                    clearTimeout(global.gameTebakAngka[chatId].timer);
                    
                    const bonusExp = Math.floor(Math.random() * poinExp) + 50;
                    const bonusMoney = Math.floor(Math.random() * poinMoney) + 500;
                    
                    if (user && user.rpg) {
                        user.rpg.exp = (user.rpg.exp || 0) + bonusExp;
                        user.rpg.money = (user.rpg.money || 0) + bonusMoney;
                        await user.save();
                    }
                    
                    await sock.sendMessage(chatId, { text: `✅ *SELAMAT!*\n\n🎉 Tebakanmu *${userGuess}* BENAR!\n✨ +${bonusExp} XP\n💰 +Rp${bonusMoney}` }, { quoted: global.fVerif });
                    delete global.gameTebakAngka[chatId];
                } else {
                    const clue = userGuess < targetNumber ? '📈 *Lebih besar*' : '📉 *Lebih kecil*';
                    await sock.sendMessage(chatId, { text: `❌ *SALAH!*\n\nAngka *${userGuess}* bukan jawabannya.\n${clue}\n\n💡 Coba lagi!` }, { quoted: global.fVerif });
                }
                return;
            }
            
            const targetNumber = Math.floor(Math.random() * 100) + 1;
            
            global.gameTebakAngka[chatId] = {
                target: targetNumber,
                timer: null,
                aktif: true
            };
            
            await sock.sendMessage(chatId, { text: `🔢 *TEBAK ANGKA*\n\nSaya sudah memikirkan angka antara 1 - 100.\n⏰ Timeout: 60 detik\n💡 Langsung ketik angka!\n😔 Nyerah: ketik "nyerah"` }, { quoted: global.fVerif });
            
            const timer = setTimeout(async () => {
                if (global.gameTebakAngka[chatId] && global.gameTebakAngka[chatId].aktif) {
                    const target = global.gameTebakAngka[chatId].target;
                    await sock.sendMessage(chatId, { text: `⏰ *WAKTU HABIS!*\n\nAngka yang benar adalah *${target}*` }, { quoted: global.fVerif });
                    delete global.gameTebakAngka[chatId];
                }
            }, timeout);
            
            global.gameTebakAngka[chatId].timer = timer;
            return;
        }
    },
    
    all: async (sock, m, { isGroup, user }) => {
        if (!isGroup) return;
        
        const chatId = m.key.remoteJid;
        
        if (!global.gameTebakAngka || !global.gameTebakAngka[chatId]) return;
        if (!global.gameTebakAngka[chatId].aktif) return;
        
        let pesan = '';
        if (m.message?.conversation) pesan = m.message.conversation;
        else if (m.msg?.text) pesan = m.msg.text;
        else return;
        
        if (pesan.startsWith('.') || pesan.startsWith('#')) return;
        
        if (pesan.toLowerCase().trim() === 'nyerah') {
            const target = global.gameTebakAngka[chatId].target;
            clearTimeout(global.gameTebakAngka[chatId].timer);
            await sock.sendMessage(chatId, { text: `😔 *NYERAH!*\n\nAngka yang benar adalah *${target}*` }, { quoted: global.fVerif });
            delete global.gameTebakAngka[chatId];
            return;
        }
        
        let userGuess = parseInt(pesan);
        
        if (isNaN(userGuess)) return;
        if (userGuess < 1 || userGuess > 100) {
            await sock.sendMessage(chatId, { text: `❌ *Angka harus antara 1 - 100!*` }, { quoted: global.fVerif });
            return;
        }
        
        const targetNumber = global.gameTebakAngka[chatId].target;
        
        if (userGuess === targetNumber) {
            clearTimeout(global.gameTebakAngka[chatId].timer);
            
            const bonusExp = Math.floor(Math.random() * poinExp) + 50;
            const bonusMoney = Math.floor(Math.random() * poinMoney) + 500;
            
            if (user && user.rpg) {
                user.rpg.exp = (user.rpg.exp || 0) + bonusExp;
                user.rpg.money = (user.rpg.money || 0) + bonusMoney;
                await user.save();
            }
            
            await sock.sendMessage(chatId, { text: `✅ *SELAMAT!*\n\n🎉 Tebakan *${userGuess}* BENAR!\n✨ +${bonusExp} XP\n💰 +Rp${bonusMoney}` }, { quoted: global.fVerif });
            delete global.gameTebakAngka[chatId];
        } else {
            const clue = userGuess < targetNumber ? '📈 *Lebih besar*' : '📉 *Lebih kecil*';
            await sock.sendMessage(chatId, { text: `❌ *SALAH!*\n\nAngka *${userGuess}* bukan jawabannya.\n${clue}\n\n💡 Coba lagi!` }, { quoted: global.fVerif });
        }
    }
};