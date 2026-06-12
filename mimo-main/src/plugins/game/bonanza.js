export default {
    cmd: ['bonanza', 'fruitspin'],
    tags: ['game'],
    limit: false,
    group: true,

    run: async (sock, m, { user, args, command, prefix }) => {
        const chatId = m.key.remoteJid;
        
        if (!args[0] || !args[1]) {
            return sock.sendMessage(chatId, {
                text: `╭─────────────────┈ ⊹
│  🎰 *F R U I T   S P I N* 🎰
│
├─ ❏ 📝 *Cara Bermain:*
│     ${prefix}bonanza <taruhan> <spin>
│
├─ ❏ 📌 *Contoh:*
│     ${prefix}bonanza 1000 5
│
├─ ❏ 🎁 *Hadiah Jackpot:*
│     🍌🍌🍌🍌🍌 = x10
│     🍎🍎🍎🍎🍎 = x8
│     🍇🍇🍇🍇🍇 = x6
│     🍊🍊🍊🍊🍊 = x5
│     🥭🥭🥭🥭🥭 = x4
│
├─ ❏ ⚠️ *Aturan:*
│     • Hanya baris penuh yang menang
│     • Minimal 3 buah sama
│
╰─────────────────┈ ⊹`
            }, { quoted: global.fVerif });
        }
        
        let betAmount = parseInt(args[0]);
        let spinCount = parseInt(args[1]);
        
        if (isNaN(betAmount) || betAmount < 100) {
            return sock.sendMessage(chatId, {
                text: `❌ *Taruhan minimal Rp100!*`
            }, { quoted: global.fVerif });
        }
        
        if (isNaN(spinCount) || spinCount < 1 || spinCount > 50) {
            return sock.sendMessage(chatId, {
                text: `❌ *Spin maksimal 50 kali!*`
            }, { quoted: global.fVerif });
        }
        
        if (!user.rpg) user.rpg = {};
        if ((user.rpg.money || 0) < betAmount * spinCount) {
            return sock.sendMessage(chatId, {
                text: `❌ *Uang kamu tidak cukup!*\n💰 Uang: Rp${(user.rpg.money || 0).toLocaleString()}\n🎲 Dibutuhkan: Rp${(betAmount * spinCount).toLocaleString()}`
            }, { quoted: global.fVerif });
        }
        
        let totalBet = betAmount * spinCount;
        user.rpg.money -= totalBet;
        await user.save();
        
        let fruits = ['🍌', '🍎', '🍇', '🍊', '🥭'];
        let fruitValues = {
            '🍌': { 3: 3, 4: 5, 5: 10 },
            '🍎': { 3: 2, 4: 4, 5: 8 },
            '🍇': { 3: 1.5, 4: 3, 5: 6 },
            '🍊': { 3: 1.2, 4: 2.5, 5: 5 },
            '🥭': { 3: 1, 4: 2, 5: 4 }
        };
        
        let wins = 0;
        let losses = 0;
        let totalWinAmount = 0;
        let winDetails = [];
        
        const generateSpinResult = () => {
            let result = [];
            for (let i = 0; i < 3; i++) {
                let row = [];
                for (let j = 0; j < 5; j++) {
                    row.push(fruits[Math.floor(Math.random() * fruits.length)]);
                }
                result.push(row);
            }
            return result;
        };
        
        const checkWin = (result) => {
            let winAmount = 0;
            let winInfo = [];
            
            for (let row of result) {
                let counts = {};
                for (let fruit of row) {
                    counts[fruit] = (counts[fruit] || 0) + 1;
                }
                
                for (let [fruit, count] of Object.entries(counts)) {
                    if (count >= 3) {
                        let multiplier = fruitValues[fruit][count] || 0;
                        let won = betAmount * multiplier;
                        winAmount += won;
                        winInfo.push(`${fruit} x${count} = x${multiplier} (+${won.toLocaleString()})`);
                    }
                }
            }
            
            if (winAmount > 0) {
                wins++;
                totalWinAmount += winAmount;
                return { status: 'Win', amount: winAmount, info: winInfo.join(', ') };
            } else {
                losses++;
                return { status: 'Lose', amount: 0, info: 'Tidak ada kombinasi menang' };
            }
        };
        
        const senderJid = m.key.participant || m.sender || m.key.remoteJid;
        const senderNumber = senderJid.split('@')[0];
        
        let initialMessage = `╭─────────────────┈ ⊹
│  🎰 *F R U I T   S P I N* 🎰
│
├─ ❏ 👤 *Player:* @${senderNumber}
├─ ❏ 🎲 *Spin:* ${spinCount}
├─ ❏ 💰 *Taruhan per spin:* Rp${betAmount.toLocaleString()}
├─ ❏ 💸 *Total Taruhan:* Rp${totalBet.toLocaleString()}
│
╰─────────────────┈ ⊹`;
        
        const msg = await sock.sendMessage(chatId, {
            text: initialMessage,
            mentions: [senderJid],
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
        
        for (let i = 0; i < spinCount; i++) {
            let spinResult = generateSpinResult();
            let spinText = spinResult.map(row => `│  ${row.join('  ')}  │`).join('\n');
            let result = checkWin(spinResult);
            
            let statusEmoji = result.status === 'Win' ? '✅' : '❌';
            let statusText = result.status === 'Win' ? `MENANG +${result.amount.toLocaleString()}` : 'KALAH';
            
            let updateMessage = `╭─────────────────┈ ⊹
│  🎰 *F R U I T   S P I N* 🎰
│
├─ ❏ 👤 *Player:* @${senderNumber}
├─ ❏ 🎲 *Spin:* ${i + 1}/${spinCount}
├─ ❏ 💰 *Taruhan:* Rp${betAmount.toLocaleString()}
│
├─ ❏ 🎰 *Hasil Spin ${i + 1}:*
│
${spinText}
│
├─ ❏ ${statusEmoji} *${statusText}*
${result.status === 'Win' ? `│\n├─ ❏ 📊 *Detail:* ${result.info}` : ''}
│
╰─────────────────┈ ⊹`;
            
            await sock.sendMessage(chatId, {
                text: updateMessage,
                mentions: [senderJid],
                edit: msg.key,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363369878409989@newsletter',
                        serverMessageId: Math.floor(Math.random() * 1000),
                        newsletterName: '✨ Mimosa Multi-Device »'
                    }
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        user.rpg.money += totalWinAmount;
        await user.save();
        
        let winRate = spinCount > 0 ? Math.round((wins / spinCount) * 100) : 0;
        let netAmount = totalWinAmount - totalBet;
        let netEmoji = netAmount >= 0 ? '✅' : '❌';
        
        let resultText = `╭─────────────────┈ ⊹
│  🎰 *F R U I T   S P I N* 🎰
│
├─ ❏ 👤 *Player:* @${senderNumber}
│
├─ ❏ 📊 *HASIL AKHIR:*
│
├─ ❏ ✅ *Menang:* ${wins}x
├─ ❏ ❌ *Kalah:* ${losses}x
├─ ❏ 📈 *Winrate:* ${winRate}%
│
├─ ❏ 💰 *Total Menang:* Rp${totalWinAmount.toLocaleString()}
├─ ❏ 💸 *Total Taruhan:* Rp${totalBet.toLocaleString()}
│
├─ ❏ ${netEmoji} *Net:* Rp${netAmount.toLocaleString()}
│
╰─────────────────┈ ⊹`;
        
        if (user.rpg) {
            let expGain = Math.floor(Math.abs(netAmount) / 100);
            if (netAmount > 0) {
                user.rpg.exp = (user.rpg.exp || 0) + expGain;
            } else if (netAmount < 0) {
                user.rpg.exp = Math.max(0, (user.rpg.exp || 0) - expGain);
            }
            await user.save();
        }
        
        await sock.sendMessage(chatId, {
            text: resultText,
            mentions: [senderJid],
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
    }
};

/*// plugins/game/bonanza.js
let poin = 500;

global.gameBonanza = global.gameBonanza || {};

export default {
    cmd: ['bonanza', 'fruitspin'],
    tags: ['game'],
    limit: true,
    group: true,

    run: async (sock, m, { user, args, command, prefix }) => {
        const chatId = m.key.remoteJid;
        
        if (!args[0] || !args[1]) {
            return sock.sendMessage(chatId, {
                text: `╭─────────────────┈ ⊹
│  🎰 *F R U I T   S P I N* 🎰
│
├─ ❏ 📝 *Cara Bermain:*
│     ${prefix}bonanza <taruhan> <spin>
│
├─ ❏ 📌 *Contoh:*
│     ${prefix}bonanza 1000 5
│
├─ ❏ ⚠️ *Aturan:*
│     • Taruhan minimal 100
│     • Spin maksimal 20
│
╰─────────────────┈ ⊹`
            }, { quoted: global.fVerif });
        }
        
        let betAmount = parseInt(args[0]);
        let spinCount = parseInt(args[1]);
        
        if (isNaN(betAmount) || betAmount <= 0) {
            return sock.sendMessage(chatId, {
                text: `❌ *Jumlah taruhan tidak valid!*`
            }, { quoted: global.fVerif });
        }
        
        if (isNaN(spinCount) || spinCount <= 0 || spinCount > 20) {
            return sock.sendMessage(chatId, {
                text: `❌ *Jumlah spin harus antara 1 - 20!*`
            }, { quoted: global.fVerif });
        }
        
        if (!user.rpg) user.rpg = {};
        if ((user.rpg.money || 0) < betAmount) {
            return sock.sendMessage(chatId, {
                text: `❌ *Uang kamu tidak cukup!*\n💰 Uang: Rp${(user.rpg.money || 0).toLocaleString()}\n🎲 Taruhan: Rp${betAmount.toLocaleString()}`
            }, { quoted: global.fVerif });
        }
        
        user.rpg.money -= betAmount;
        await user.save();
        
        let singleBet = betAmount / spinCount;
        let fruits = ['🍌', '🍎', '🍇', '🍊', '🥭'];
        let fruitValues = {
            '🍌': 100,
            '🍎': 50,
            '🍇': 90,
            '🍊': 70,
            '🥭': 40
        };
        
        let winPatterns = [
            ['🍎', '🍎', '🍎', '🍎'],
            ['🍌', '🍌', '🍌', '🍌'],
            ['🍇', '🍇', '🍇', '🍇'],
            ['🍊', '🍊', '🍊', '🍊'],
            ['🥭', '🥭', '🥭', '🥭'],
            ['🍎', '🍎', '🍎'],
            ['🍌', '🍌', '🍌'],
            ['🍇', '🍇', '🍇'],
            ['🍊', '🍊', '🍊'],
            ['🥭', '🥭', '🥭'],
            ['🍎', '🍎'],
            ['🍌', '🍌'],
            ['🍇', '🍇'],
            ['🍊', '🍊'],
            ['🥭', '🥭'],
            ['🍎'],
            ['🍌'],
            ['🍇'],
            ['🍊'],
            ['🥭']
        ];
        
        let wins = 0;
        let losses = 0;
        let totalWinAmount = 0;
        let totalLossAmount = 0;
        let winFruits = { '🍌': 0, '🍎': 0, '🍇': 0, '🍊': 0, '🥭': 0 };
        
        const generateSpinResult = () => {
            let result = [];
            for (let i = 0; i < 3; i++) {
                let row = [];
                for (let j = 0; j < 5; j++) {
                    row.push(fruits[Math.floor(Math.random() * fruits.length)]);
                }
                result.push(row);
            }
            return result;
        };
        
        const checkWin = (result) => {
            for (let pattern of winPatterns) {
                for (let row of result) {
                    let joinedRow = row.join('');
                    if (joinedRow.includes(pattern.join(''))) {
                        let fruit = pattern[0];
                        wins++;
                        totalWinAmount += singleBet * fruitValues[fruit] * pattern.length;
                        winFruits[fruit]++;
                        return 'Win';
                    }
                }
            }
            losses++;
            totalLossAmount += singleBet;
            return 'Lose';
        };
        
        const senderJid = m.key.participant || m.sender || m.key.remoteJid;
        const senderNumber = senderJid.split('@')[0];
        
        let initialMessage = `╭─────────────────┈ ⊹
│  🎰 *F R U I T   S P I N* 🎰
│
├─ ❏ 👤 *Player:* @${senderNumber}
├─ ❏ 🎲 *Spin:* ${spinCount}
├─ ❏ 💰 *Taruhan:* Rp${betAmount.toLocaleString()}
│
╰─────────────────┈ ⊹`;
        
        const msg = await sock.sendMessage(chatId, {
            text: initialMessage,
            mentions: [senderJid],
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
        
        for (let i = 0; i < spinCount; i++) {
            let spinResult = generateSpinResult();
            let spinText = spinResult.map(row => `│  ${row.join('  ')}  │`).join('\n');
            let spinStatus = checkWin(spinResult);
            
            let updateMessage = `╭─────────────────┈ ⊹
│  🎰 *F R U I T   S P I N* 🎰
│
├─ ❏ 👤 *Player:* @${senderNumber}
├─ ❏ 🎲 *Spin:* ${spinCount - i}/${spinCount}
├─ ❏ 💰 *Taruhan:* Rp${betAmount.toLocaleString()}
│
├─ ❏ 🎰 *Hasil Spin ${i + 1}:*
│
${spinText}
│
├─ ❏ ${spinStatus === 'Win' ? '✅ *MENANG!*' : '❌ *KALAH!*'}
│
╰─────────────────┈ ⊹`;
            
            await sock.sendMessage(chatId, {
                text: updateMessage,
                mentions: [senderJid],
                edit: msg.key,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363369878409989@newsletter',
                        serverMessageId: Math.floor(Math.random() * 1000),
                        newsletterName: '✨ Mimosa Multi-Device »'
                    }
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        user.rpg.money += totalWinAmount;
        await user.save();
        
        let resultText = `╭─────────────────┈ ⊹
│  🎰 *F R U I T   S P I N* 🎰
│
├─ ❏ 👤 *Player:* @${senderNumber}
│
├─ ❏ 📊 *HASIL AKHIR:*
│
├─ ❏ ✅ *Menang:* ${wins}x
├─ ❏ ❌ *Kalah:* ${losses}x
│
├─ ❏ 💰 *Total Kemenangan:* Rp${totalWinAmount.toLocaleString()}
├─ ❏ 💸 *Total Kekalahan:* Rp${totalLossAmount.toLocaleString()}
│
├─ ❏ 🍎 *Apel:* ${winFruits['🍎']}x
├─ ❏ 🍌 *Pisang:* ${winFruits['🍌']}x
├─ ❏ 🍇 *Anggur:* ${winFruits['🍇']}x
├─ ❏ 🍊 *Jeruk:* ${winFruits['🍊']}x
├─ ❏ 🥭 *Mangga:* ${winFruits['🥭']}x
│
├─ ❏ 💎 *XP +${Math.floor(totalWinAmount / 100)}*
│
╰─────────────────┈ ⊹`;
        
        if (user.rpg) {
            user.rpg.exp = (user.rpg.exp || 0) + Math.floor(totalWinAmount / 100);
            await user.save();
        }
        
        await sock.sendMessage(chatId, {
            text: resultText,
            mentions: [senderJid],
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
    }
};*/