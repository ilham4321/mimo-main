let timeout = 180000;
let poin = 500;

global.gameBomb = global.gameBomb || {};

export default {
    cmd: ['bomb', 'nyerah'],
    tags: ['game'],
    limit: false,

    run: async (sock, m, { user, command }) => {
        const chatId = m.key.remoteJid;
        
        if (command === 'nyerah') {
            if (global.gameBomb && global.gameBomb[chatId]) {
                const bomPos = global.gameBomb[chatId].bomPosition;
                clearTimeout(global.gameBomb[chatId].timer);
                await sock.sendMessage(chatId, { text: `😔 *NYERAH!*\n\nBom berada di kotak nomor *${bomPos}*.` }, { quoted: global.fVerif });
                delete global.gameBomb[chatId];
            } else {
                await sock.sendMessage(chatId, { text: `❌ *Tidak ada game yang sedang berjalan!*` }, { quoted: global.fVerif });
            }
            return;
        }
        
        if (command === 'bomb') {
            if (global.gameBomb[chatId]) {
                return sock.sendMessage(chatId, { text: `❌ *Masih ada game yang sedang berjalan!*` }, { quoted: global.fVerif });
            }
            
            const bom = ['💥', '✅', '✅', '✅', '✅', '✅', '✅', '✅', '✅'];
            for (let i = bom.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [bom[i], bom[j]] = [bom[j], bom[i]];
            }
            
            const number = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
            
            const boxes = bom.map((v, i) => ({
                emot: v,
                number: number[i],
                position: i + 1,
                opened: false
            }));
            
            global.gameBomb[chatId] = {
                boxes: boxes,
                timer: null,
                aktif: true,
                bomPosition: boxes.find(b => b.emot === '💥').position,
                timerStart: Date.now()
            };
            
            let displayBoard = '';
            for (let i = 0; i < boxes.length; i += 3) {
                const row = boxes.slice(i, i + 3);
                displayBoard += `${row.map(v => v.number).join(' ')}\n`;
            }
            
            await sock.sendMessage(chatId, { text: `💣 *BOMB*\n\n📦 Papan Kotak:\n${displayBoard}\n⏰ Timeout: 3 menit\n💡 Kirim angka 1-9 untuk membuka kotak!\n😔 Nyerah: ketik "nyerah"` }, { quoted: global.fVerif });
            
            const timer = setTimeout(async () => {
                if (global.gameBomb[chatId] && global.gameBomb[chatId].aktif) {
                    const bomPos = global.gameBomb[chatId].bomPosition;
                    await sock.sendMessage(chatId, { text: `⏰ *WAKTU HABIS!*\n\nBom berada di kotak nomor *${bomPos}*.` }, { quoted: global.fVerif });
                    delete global.gameBomb[chatId];
                }
            }, timeout);
            
            global.gameBomb[chatId].timer = timer;
            return;
        }
    },
    
    all: async (sock, m, { isGroup, user }) => {
        if (!isGroup) return;
        
        const chatId = m.key.remoteJid;
        
        if (!global.gameBomb || !global.gameBomb[chatId]) return;
        if (!global.gameBomb[chatId].aktif) return;
        
        let pesan = '';
        if (m.message?.conversation) pesan = m.message.conversation;
        else if (m.msg?.text) pesan = m.msg.text;
        else return;
        
        if (pesan.startsWith('.') || pesan.startsWith('#')) return;
        
        if (pesan.toLowerCase().trim() === 'nyerah') {
            const bomPos = global.gameBomb[chatId].bomPosition;
            clearTimeout(global.gameBomb[chatId].timer);
            await sock.sendMessage(chatId, { text: `😔 *NYERAH!*\n\nBom berada di kotak nomor *${bomPos}*.` }, { quoted: global.fVerif });
            delete global.gameBomb[chatId];
            return;
        }
        
        const boxNumber = parseInt(pesan);
        
        if (isNaN(boxNumber) || boxNumber < 1 || boxNumber > 9) return;
        
        const game = global.gameBomb[chatId];
        const boxes = game.boxes;
        const selectedBox = boxes[boxNumber - 1];
        
        if (selectedBox.opened) {
            await sock.sendMessage(chatId, { text: `⚠️ *Kotak ${boxNumber} sudah dibuka!* Pilih kotak lain.` }, { quoted: global.fVerif });
            return;
        }
        
        selectedBox.opened = true;
        
        let displayBoard = '';
        for (let i = 0; i < boxes.length; i += 3) {
            const row = boxes.slice(i, i + 3);
            displayBoard += `${row.map(v => v.opened ? v.emot : v.number).join(' ')}\n`;
        }
        
        if (selectedBox.emot === '💥') {
            clearTimeout(game.timer);
            
            const penalty = poin;
            if (user && user.rpg) {
                user.rpg.exp = (user.rpg.exp || 0) - penalty;
                await user.save();
            }
            
            await sock.sendMessage(chatId, { text: `💥 *BOM MELEDAK!*\n\n📦 Papan:\n${displayBoard}\n😔 Kamu kehilangan ${penalty} XP!` }, { quoted: global.fVerif });
            delete global.gameBomb[chatId];
        } else {
            const remaining = boxes.filter(b => !b.opened && b.emot === '✅').length;
            
            if (remaining === 0) {
                clearTimeout(game.timer);
                
                if (user && user.rpg) {
                    user.rpg.exp = (user.rpg.exp || 0) + poin;
                    await user.save();
                }
                
                await sock.sendMessage(chatId, { text: `🎉 *SELAMAT!*\n\n📦 Papan:\n${displayBoard}\n🎁 Kamu mendapat +${poin} XP!` }, { quoted: global.fVerif });
                delete global.gameBomb[chatId];
            } else {
                await sock.sendMessage(chatId, { text: `✅ *AMAN!*\n\nKotak ${boxNumber} tidak berisi bom.\n\n📦 Papan:\n${displayBoard}\n📦 Sisa kotak aman: ${remaining}` }, { quoted: global.fVerif });
            }
        }
    }
};