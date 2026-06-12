import fetch from 'node-fetch';

let poin = 1000;

global.gameBlackjack = global.gameBlackjack || {};

class Deck {
    constructor(decks = 1) {
        this.deck = [];
        this.dealtCards = [];
        this.createDeck(decks);
    }

    createDeck(decks) {
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const suits = ['♣️', '♦️', '♠️', '♥️'];
        
        for (let d = 0; d < decks; d++) {
            for (let s = 0; s < suits.length; s++) {
                for (let v = 0; v < values.length; v++) {
                    let value = values[v];
                    let point = value;
                    if (value === 'J' || value === 'Q' || value === 'K') point = 10;
                    if (value === 'A') point = 11;
                    this.deck.push({
                        name: `${values[v]}${suits[s]}`,
                        suit: suits[s],
                        value: values[v],
                        point: point
                    });
                }
            }
        }
        this.shuffle();
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealCard() {
        const card = this.deck.pop();
        this.dealtCards.push(card);
        return card;
    }

    dealCards(count) {
        const cards = [];
        for (let i = 0; i < count; i++) {
            cards.push(this.dealCard());
        }
        return cards;
    }
}

function calculateTotal(cards) {
    let total = 0;
    let aces = 0;
    
    for (const card of cards) {
        let point = card.point;
        total += point;
        if (card.value === 'A') aces++;
    }
    
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    
    return total;
}

function formatCards(cards) {
    return cards.map(c => `${c.name}`).join(' ');
}

export default {
    cmd: ['blackjack', 'bj'],
    tags: ['game'],
    limit: false,

    run: async (sock, m, { user, args, command, prefix }) => {
        const chatId = m.key.remoteJid;
        const aksi = args[0]?.toLowerCase();
        const betAmount = parseInt(args[1]) || 1000;
        
        // ========== END ==========
        if (aksi === 'end') {
            if (global.gameBlackjack[chatId]) {
                delete global.gameBlackjack[chatId];
                return sock.sendMessage(chatId, {
                    text: `👋 *Anda keluar dari sesi Blackjack.*`,
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
            } else {
                return sock.sendMessage(chatId, {
                    text: `❌ *Tidak ada sesi Blackjack yang sedang berlangsung.*`
                }, { quoted: global.fVerif });
            }
        }
        
        // ========== HIT ==========
        if (aksi === 'hit') {
            if (!global.gameBlackjack[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Anda tidak sedang bermain Blackjack.*\n\nKetik *${prefix}blackjack start* untuk memulai.`
                }, { quoted: global.fVerif });
            }
            
            const game = global.gameBlackjack[chatId];
            
            if (game.state !== 'playing') {
                return sock.sendMessage(chatId, {
                    text: `❌ *Game sudah selesai!* Ketik *${prefix}blackjack start* untuk bermain lagi.`
                }, { quoted: global.fVerif });
            }
            
            const newCard = game.deck.dealCard();
            game.playerCards.push(newCard);
            const playerTotal = calculateTotal(game.playerCards);
            
            if (playerTotal > 21) {
                game.state = 'dealer_win';
                const payout = 0;
                
                const text = `╭─────────────────┈ ⊹
│  🃏 *B L A C K J A C K* 🃏
│
├─ ❏ 👤 *Kartu Anda:*
│     ${formatCards(game.playerCards)}
│     Total: *${playerTotal}* (BUST!)
│
├─ ❏ 🤖 *Kartu Dealer:*
│     ${formatCards(game.dealerCards)}
│     Total: *${calculateTotal(game.dealerCards)}*
│
├─ ❏ 📊 *Hasil: DEALER MENANG*
├─ ❏ 💰 *Taruhan:* Rp${game.bet.toLocaleString()}
├─ ❏ 💸 *Kembali:* Rp${payout}
│
╰─────────────────┈ ⊹`;
                
                await sock.sendMessage(chatId, { text: text, contextInfo: { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: '120363369878409989@newsletter', serverMessageId: Math.floor(Math.random() * 1000), newsletterName: '✨ Mimosa Multi-Device »' } } }, { quoted: global.fVerif });
                
                delete global.gameBlackjack[chatId];
            } else {
                const hiddenDealerCards = formatCards(game.dealerCards.slice(0, -1)) + ' ❓';
                const dealerTotal = '?';
                
                const text = `╭─────────────────┈ ⊹
│  🃏 *B L A C K J A C K* 🃏
│
├─ ❏ 👤 *Kartu Anda:*
│     ${formatCards(game.playerCards)}
│     Total: *${playerTotal}*
│
├─ ❏ 🤖 *Kartu Dealer:*
│     ${hiddenDealerCards}
│     Total: *${dealerTotal}*
│
├─ ❏ 💰 *Taruhan:* Rp${game.bet.toLocaleString()}
│
├─ ❏ 📝 *Perintah:*
│     ${prefix}bj hit - ambil kartu
│     ${prefix}bj stand - berhenti
│
╰─────────────────┈ ⊹`;
                
                await sock.sendMessage(chatId, { text: text, contextInfo: { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: '120363369878409989@newsletter', serverMessageId: Math.floor(Math.random() * 1000), newsletterName: '✨ Mimosa Multi-Device »' } } }, { quoted: global.fVerif });
            }
            return;
        }
        
        // ========== STAND ==========
        if (aksi === 'stand') {
            if (!global.gameBlackjack[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Anda tidak sedang bermain Blackjack.*`
                }, { quoted: global.fVerif });
            }
            
            const game = global.gameBlackjack[chatId];
            
            if (game.state !== 'playing') {
                return sock.sendMessage(chatId, {
                    text: `❌ *Game sudah selesai!*`
                }, { quoted: global.fVerif });
            }
            
            let dealerTotal = calculateTotal(game.dealerCards);
            
            while (dealerTotal < 17) {
                const newCard = game.deck.dealCard();
                game.dealerCards.push(newCard);
                dealerTotal = calculateTotal(game.dealerCards);
            }
            
            const playerTotal = calculateTotal(game.playerCards);
            let result = '';
            let payout = 0;
            
            if (dealerTotal > 21) {
                result = 'PLAYER MENANG!';
                payout = game.bet * 2;
                if (user && user.rpg) {
                    user.rpg.money = (user.rpg.money || 0) + payout;
                    await user.save();
                }
            } else if (playerTotal > dealerTotal) {
                result = 'PLAYER MENANG!';
                payout = game.bet * 2;
                if (user && user.rpg) {
                    user.rpg.money = (user.rpg.money || 0) + payout;
                    await user.save();
                }
            } else if (playerTotal === dealerTotal) {
                result = 'DRAW / SERI';
                payout = game.bet;
                if (user && user.rpg) {
                    user.rpg.money = (user.rpg.money || 0) + payout;
                    await user.save();
                }
            } else {
                result = 'DEALER MENANG!';
                payout = 0;
            }
            
            const text = `╭─────────────────┈ ⊹
│  🃏 *B L A C K J A C K* 🃏
│
├─ ❏ 👤 *Kartu Anda:*
│     ${formatCards(game.playerCards)}
│     Total: *${playerTotal}*
│
├─ ❏ 🤖 *Kartu Dealer:*
│     ${formatCards(game.dealerCards)}
│     Total: *${dealerTotal}*
│
├─ ❏ 📊 *Hasil: ${result}*
├─ ❏ 💰 *Taruhan:* Rp${game.bet.toLocaleString()}
├─ ❏ 💸 *Kembali:* Rp${payout.toLocaleString()}
│
╰─────────────────┈ ⊹`;
            
            await sock.sendMessage(chatId, { text: text, contextInfo: { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: '120363369878409989@newsletter', serverMessageId: Math.floor(Math.random() * 1000), newsletterName: '✨ Mimosa Multi-Device »' } } }, { quoted: global.fVerif });
            
            delete global.gameBlackjack[chatId];
            return;
        }
        
        // ========== START ==========
        if (aksi === 'start' || !aksi) {
            if (global.gameBlackjack[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Sesi Blackjack sudah berlangsung!*\nKetik *${prefix}bj end* untuk keluar.`
                }, { quoted: global.fVerif });
            }
            
            if (!user.rpg) user.rpg = {};
            if ((user.rpg.money || 0) < betAmount) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Uang kamu tidak cukup!*\n💰 Uang kamu: Rp${(user.rpg.money || 0).toLocaleString()}\n🎲 Minimal taruhan: Rp${betAmount.toLocaleString()}`
                }, { quoted: global.fVerif });
            }
            
            user.rpg.money -= betAmount;
            await user.save();
            
            const deck = new Deck(1);
            const playerCards = deck.dealCards(2);
            const dealerCards = deck.dealCards(2);
            
            global.gameBlackjack[chatId] = {
                deck: deck,
                playerCards: playerCards,
                dealerCards: dealerCards,
                bet: betAmount,
                state: 'playing'
            };
            
            const playerTotal = calculateTotal(playerCards);
            const hiddenDealerCards = formatCards(dealerCards.slice(0, -1)) + ' ❓';
            
            const text = `╭─────────────────┈ ⊹
│  🃏 *B L A C K J A C K* 🃏
│
├─ ❏ 👤 *Kartu Anda:*
│     ${formatCards(playerCards)}
│     Total: *${playerTotal}*
│
├─ ❏ 🤖 *Kartu Dealer:*
│     ${hiddenDealerCards}
│     Total: *?*
│
├─ ❏ 💰 *Taruhan:* Rp${betAmount.toLocaleString()}
│
├─ ❏ 📝 *Perintah:*
│     ${prefix}bj hit - ambil kartu
│     ${prefix}bj stand - berhenti
│     ${prefix}bj end - keluar
│
╰─────────────────┈ ⊹`;
            
            await sock.sendMessage(chatId, { text: text, contextInfo: { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: '120363369878409989@newsletter', serverMessageId: Math.floor(Math.random() * 1000), newsletterName: '✨ Mimosa Multi-Device »' } } }, { quoted: global.fVerif });
            return;
        }
        
        // ========== HELP ==========
        await sock.sendMessage(chatId, {
            text: `╭─────────────────┈ ⊹
│  🃏 *B L A C K J A C K* 🃏
│
├─ ❏ 📝 *Cara Bermain:*
│     Pemain vs Dealer, siapa yang
│     mendekati 21 tanpa melebihi
│
├─ ❏ 🎮 *Perintah:*
│     ${prefix}bj start - mulai game
│     ${prefix}bj hit - ambil kartu
│     ${prefix}bj stand - berhenti
│     ${prefix}bj end - keluar
│
├─ ❏ 🎲 *Contoh:*
│     ${prefix}bj start 5000
│
╰─────────────────┈ ⊹`
        }, { quoted: global.fVerif });
    }
};