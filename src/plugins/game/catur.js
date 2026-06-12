import { Chess } from 'chess.js';

let timeout = 300000;

global.gameChess = global.gameChess || {};

export default {
    cmd: ['chess', 'catur'],
    tags: ['game'],
    limit: false,
    group: true,

    run: async (sock, m, { args, command, prefix }) => {
        const chatId = m.key.remoteJid;
        const senderId = m.key.participant || m.sender || m.key.remoteJid;
        
        let chessData = global.gameChess[chatId];
        
        if (!chessData) {
            chessData = {
                gameData: null,
                fen: null,
                currentTurn: null,
                players: [],
                hasJoined: []
            };
            global.gameChess[chatId] = chessData;
        }
        
        const { gameData, fen, currentTurn, players, hasJoined } = chessData;
        const feature = args[0]?.toLowerCase();
        
        // ========== HELP ==========
        if (feature === 'help' || (!feature && !args[1])) {
            const helpText = `╭─────────────────┈ ⊹
│  ♟️ *C H E S S* ♟️
│
├─ ❏ 📝 *Perintah:*
│
├─ ❏ ♟️ *chess create*
│     └─ Mulai permainan catur
│
├─ ❏ ♟️ *chess join*
│     └─ Bergabung ke permainan
│
├─ ❏ ♟️ *chess start*
│     └─ Mulai game (setelah 2 player)
│
├─ ❏ ♟️ *chess delete*
│     └─ Hentikan permainan
│
├─ ❏ ♟️ *chess a2 a4*
│     └─ Melakukan langkah
│
├─ ❏ 📌 *Contoh langkah:*
│     • Pion: a2 a4, e2 e4
│     • Kuda: g1 f3, b1 c3
│     • Gajah: c1 g5
│     • Benteng: a1 a4
│     • Ratu: d1 d4
│     • Raja: e1 e2
│
╰─────────────────┈ ⊹`;
            
            return sock.sendMessage(chatId, {
                text: helpText,
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
        
        // ========== DELETE ==========
        if (feature === 'delete') {
            delete global.gameChess[chatId];
            return sock.sendMessage(chatId, {
                text: `🏳️ *Permainan catur dihentikan.*`,
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
        
        // ========== CREATE ==========
        if (feature === 'create') {
            if (gameData) {
                return sock.sendMessage(chatId, {
                    text: `⚠️ *Permainan sudah dimulai.*\nKetik *chess delete* untuk menghentikan.`,
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
            
            chessData.gameData = { status: 'waiting', black: null, white: null };
            
            return sock.sendMessage(chatId, {
                text: `🎮 *Permainan catur dimulai!*\n\n┌─❖\n│ ♟️ *Status:* Menunggu pemain\n│ 📝 *Cara join:* ${prefix}chess join\n╰─────────────────`,
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
        
        // ========== JOIN ==========
        if (feature === 'join') {
            if (players.includes(senderId)) {
                return sock.sendMessage(chatId, {
                    text: `🙅‍♂️ *Anda sudah bergabung dalam permainan ini.*`,
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
            
            if (!gameData || gameData.status !== 'waiting') {
                return sock.sendMessage(chatId, {
                    text: `⚠️ *Tidak ada permainan yang sedang menunggu.*\nKetik *chess create* untuk memulai.`,
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
            
            if (players.length >= 2) {
                return sock.sendMessage(chatId, {
                    text: `👥 *Pemain sudah mencukupi.*\nKetik *chess start* untuk memulai permainan.`,
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
            
            players.push(senderId);
            chessData.hasJoined.push(senderId);
            
            if (players.length === 2) {
                gameData.status = 'ready';
                const random = Math.random() < 0.5;
                gameData.black = random ? players[0] : players[1];
                gameData.white = random ? players[1] : players[0];
                
                const playerList = hasJoined.map(p => `│     @${p.split('@')[0]}`).join('\n');
                
                return sock.sendMessage(chatId, {
                    text: `╭─────────────────┈ ⊹
│  ♟️ *P E M A I N* ♟️
│
├─ ❏ 👥 *Pemain yang bergabung:*
${playerList}
│
├─ ❏ ♠️ *Hitam:* @${gameData.black.split('@')[0]}
├─ ❏ ♔ *Putih:* @${gameData.white.split('@')[0]}
│
├─ ❏ 💡 *Mulai game:* ${prefix}chess start
│
╰─────────────────┈ ⊹`,
                    mentions: hasJoined,
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
                    text: `🙋‍♂️ *@${senderId.split('@')[0]} bergabung!*\n\nMenunggu 1 pemain lagi...`,
                    mentions: [senderId],
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
        }
        
        // ========== START ==========
        if (feature === 'start') {
            if (!gameData || gameData.status !== 'ready') {
                return sock.sendMessage(chatId, {
                    text: `⚠️ *Tidak dapat memulai permainan.*\nTunggu hingga 2 pemain bergabung.`,
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
            
            if (players.length !== 2) {
                return sock.sendMessage(chatId, {
                    text: `⚠️ *Butuh 2 pemain untuk memulai!*\nSaat ini: ${players.length}/2 pemain.`,
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
            
            gameData.status = 'playing';
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            chessData.fen = fen;
            chessData.currentTurn = gameData.white;
            const encodedFen = encodeURIComponent(fen);
            const boardUrl = `https://www.chess.com/dynboard?fen=${encodedFen}&board=graffiti&piece=graffiti&size=4&coordinates=inside`;
            
            const startText = `╭─────────────────┈ ⊹
│  ♟️ *C H E S S* ♟️
│
├─ ❏ ♠️ *Hitam:* @${gameData.black.split('@')[0]}
├─ ❏ ♔ *Putih:* @${gameData.white.split('@')[0]}
│
├─ ❏ 🎲 *Giliran:* PUTIH (@${gameData.white.split('@')[0]})
│
├─ ❏ 📝 *Notasi Papan:*
│     a1 = baris1 kolom a
│     e2 = baris2 kolom e
│
├─ ❏ 💡 *Cara main:*
│     ${prefix}chess e2 e4
│
╰─────────────────┈ ⊹`;
            
            try {
                await sock.sendMessage(chatId, {
                    image: { url: boardUrl },
                    caption: startText,
                    mentions: [gameData.white, gameData.black],
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
                await sock.sendMessage(chatId, {
                    text: startText,
                    mentions: [gameData.white, gameData.black],
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
            return;
        }
        
        // ========== MOVE ==========
        if (args[0] && args[1]) {
            if (!gameData || gameData.status !== 'playing') {
                return sock.sendMessage(chatId, {
                    text: `⚠️ *Permainan belum dimulai.*\nKetik *chess start* untuk memulai.`,
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
            
            if (currentTurn !== senderId) {
                const turnName = currentTurn === gameData.white ? 'PUTIH' : 'HITAM';
                return sock.sendMessage(chatId, {
                    text: `⏳ *Giliran ${turnName}!*\n@${currentTurn.split('@')[0]} sedang berpikir.`,
                    mentions: [currentTurn],
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
            
            const chess = new Chess(fen);
            const [from, to] = args;
            
            // Validasi format notasi (contoh: e2, a1, d4)
            const notationRegex = /^[a-h][1-8]$/;
            if (!notationRegex.test(from) || !notationRegex.test(to)) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Format notasi salah!*\n\n*Contoh:* a2 a4, e2 e4, g1 f3\n\n*Notasi:* huruf a-h + angka 1-8`,
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
            
            try {
                chess.move({ from, to, promotion: 'q' });
            } catch (e) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Langkah tidak valid!*\n\nBidak di ${from} tidak bisa bergerak ke ${to}.\n\n💡 *Tips:*\n• Pion: maju 1 atau 2 langkah\n• Kuda: bentuk L\n• Gajah: diagonal\n• Benteng: lurus\n• Ratu: bebas\n• Raja: 1 langkah`,
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
            
            chessData.fen = chess.fen();
            const currentTurnIndex = players.indexOf(currentTurn);
            const nextTurnIndex = (currentTurnIndex + 1) % 2;
            chessData.currentTurn = players[nextTurnIndex];
            const encodedFen = encodeURIComponent(chess.fen());
            const boardUrl = `https://www.chess.com/dynboard?fen=${encodedFen}&board=graffiti&piece=graffiti&size=4&coordinates=inside`;
            
            const turnName = chessData.currentTurn === gameData.white ? 'PUTIH' : 'HITAM';
            const turnMention = chessData.currentTurn;
            
            const moveText = `╭─────────────────┈ ⊹
│  ♟️ *C H E S S* ♟️
│
├─ ❏ 🎲 *Giliran:* ${turnName}
├─ ❏ 👤 @${turnMention.split('@')[0]}
│
├─ ❏ 📝 *Langkah terakhir:* ${from} → ${to}
│
├─ ❏ 💡 *Cara main:*
│     ${prefix}chess e2 e4
│
╰─────────────────┈ ⊹`;
            
            // Cek checkmate
            if (chess.isCheckmate()) {
                const winner = senderId;
                delete global.gameChess[chatId];
                return sock.sendMessage(chatId, {
                    text: `🏆 *CHECKMATE!*\n\n🎉 *Pemenang:* @${winner.split('@')[0]}\n\n🏳️ *Permainan selesai.*`,
                    mentions: [winner],
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
            
            // Cek draw
            if (chess.isDraw()) {
                delete global.gameChess[chatId];
                return sock.sendMessage(chatId, {
                    text: `♟️ *DRAW!*\n\n🏳️ *Permainan berakhir seri.*`,
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
            
            // Cek skak
            if (chess.inCheck()) {
                const checkText = `\n├─ ❏ ⚠️ *CHECK!* Raja dalam bahaya!`;
                try {
                    await sock.sendMessage(chatId, {
                        image: { url: boardUrl },
                        caption: moveText.replace('╰─────────────────┈ ⊹', checkText + '\n╰─────────────────┈ ⊹'),
                        mentions: [turnMention],
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
                    await sock.sendMessage(chatId, {
                        text: moveText + checkText,
                        mentions: [turnMention],
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
                return;
            }
            
            try {
                await sock.sendMessage(chatId, {
                    image: { url: boardUrl },
                    caption: moveText,
                    mentions: [turnMention],
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
                await sock.sendMessage(chatId, {
                    text: moveText,
                    mentions: [turnMention],
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
            return;
        }
    }
};