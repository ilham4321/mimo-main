let timeout = 60000;
let poin = 500;

global.gameMath = global.gameMath || {};

let modes = {
    noob: [-3, 3, -3, 3, '+-', 15000, 10],
    easy: [-10, 10, -10, 10, '*/+-', 20000, 40],
    medium: [-40, 40, -20, 20, '*/+-', 40000, 150],
    hard: [-100, 100, -70, 70, '*/+-', 60000, 350],
    extreme: [-999999, 999999, -999999, 999999, '*/', 99999, 9999],
    impossible: [-99999999999, 99999999999, -99999999999, 999999999999, '*/', 30000, 35000],
    impossible2: [-999999999999999, 999999999999999, -999, 999, '/', 30000, 50000]
};

let operators = {
    '+': '+',
    '-': '-',
    '*': '×',
    '/': '÷'
};

function randomInt(from, to) {
    if (from > to) [from, to] = [to, from];
    from = Math.floor(from);
    to = Math.floor(to);
    return Math.floor((to - from) * Math.random() + from);
}

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function genMath(mode) {
    let [a1, a2, b1, b2, ops, time, bonus] = modes[mode];
    let a = randomInt(a1, a2);
    let b = randomInt(b1, b2);
    let op = pickRandom([...ops]);
    let result = (new Function(`return ${a} ${op.replace('/', '*')} ${b < 0 ? `(${b})` : b}`))();
    if (op == '/') [a, result] = [result, a];
    return {
        str: `${a} ${operators[op]} ${b}`,
        mode,
        time,
        bonus,
        result
    };
}

export default {
    cmd: ['math', 'nyerah'],
    tags: ['game'],
    limit: false,
    group: true,

    run: async (sock, m, { user, args, command, prefix }) => {
        const chatId = m.key.remoteJid;
        
        if (command === 'nyerah') {
            if (global.gameMath && global.gameMath[chatId]) {
                const jawaban = global.gameMath[chatId].result;
                clearTimeout(global.gameMath[chatId].timer);
                
                await sock.sendMessage(chatId, {
                    text: `😔 *NYERAH!*\n\nJawabannya adalah *${jawaban}*`,
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
                
                delete global.gameMath[chatId];
            } else {
                await sock.sendMessage(chatId, {
                    text: `❌ *Tidak ada game yang sedang berjalan!*\n\nKetik .math untuk memulai.`
                }, { quoted: global.fVerif });
            }
            return;
        }
        
        if (command === 'math') {
            if (global.gameMath[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Masih ada soal yang belum dijawab!*\nKetik *nyerah* untuk mengakhiri.`
                }, { quoted: global.fVerif });
            }
            
            let mode = args[0]?.toLowerCase();
            
            if (!mode || !modes[mode]) {
                const modeList = Object.keys(modes).join(', ');
                return sock.sendMessage(chatId, {
                    text: `╭─────────────────┈ ⊹
│  🧮 *M A T H* 🧮
│
├─ ❏ 📝 *Mode yang tersedia:*
│     ${modeList}
│
├─ ❏ 📌 *Contoh:*
│     ${prefix}math easy
│     ${prefix}math medium
│     ${prefix}math hard
│
├─ ❏ 💡 *Setiap mode memiliki:*
│     • Tingkat kesulitan berbeda
│     • Waktu timeout berbeda
│     • Bonus XP berbeda
│
╰─────────────────┈ ⊹`,
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
            
            const math = genMath(mode);
            const timeInSeconds = (math.time / 1000).toFixed(2);
            
            global.gameMath[chatId] = {
                result: math.result,
                bonus: math.bonus,
                time: math.time,
                aktif: true,
                timer: null
            };
            
            const text = `╭─────────────────┈ ⊹
│  🧮 *M A T H* 🧮
│
├─ ❏ ❓ *Soal:*
│     ${math.str} = ?
│
├─ ❏ ⭐ *Mode:* ${mode}
├─ ❏ ⏰ *Timeout:* ${timeInSeconds} detik
├─ ❏ 🎁 *Bonus:* ${math.bonus} XP
├─ ❏ 😔 *Nyerah:* ketik "nyerah"
│
├─ ❏ 💬 *Ketik jawaban langsung!*
│
╰─────────────────┈ ⊹`;
            
            await sock.sendMessage(chatId, {
                text: text,
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
            
            const timer = setTimeout(async () => {
                if (global.gameMath[chatId] && global.gameMath[chatId].aktif) {
                    const jawaban = global.gameMath[chatId].result;
                    await sock.sendMessage(chatId, {
                        text: `⏰ *WAKTU HABIS!*\n\nJawabannya adalah *${jawaban}*`,
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
                    delete global.gameMath[chatId];
                }
            }, math.time);
            
            global.gameMath[chatId].timer = timer;
            return;
        }
    },
    
    all: async (sock, m, { isGroup, user }) => {
        if (!isGroup) return;
        
        const chatId = m.key.remoteJid;
        
        if (!global.gameMath || !global.gameMath[chatId]) return;
        if (!global.gameMath[chatId].aktif) return;
        
        let pesan = '';
        if (m.message?.conversation) pesan = m.message.conversation;
        else if (m.msg?.text) pesan = m.msg.text;
        else return;
        
        if (pesan.startsWith('.') || pesan.startsWith('#')) return;
        
        if (pesan.toLowerCase().trim() === 'nyerah') {
            const jawaban = global.gameMath[chatId].result;
            clearTimeout(global.gameMath[chatId].timer);
            await sock.sendMessage(chatId, {
                text: `😔 *NYERAH!*\n\nJawabannya adalah *${jawaban}*`,
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
            delete global.gameMath[chatId];
            return;
        }
        
        let jawabanUser = parseInt(pesan);
        
        if (isNaN(jawabanUser)) return;
        
        const jawabanBenar = global.gameMath[chatId].result;
        const bonus = global.gameMath[chatId].bonus;
        
        if (jawabanUser === jawabanBenar) {
            clearTimeout(global.gameMath[chatId].timer);
            
            if (user && user.rpg) {
                user.rpg.exp = (user.rpg.exp || 0) + bonus;
                await user.save();
            }
            
            await sock.sendMessage(chatId, {
                text: `✅ *BENAR!*\n\n🎉 Jawaban *${jawabanBenar}* benar!\n✨ +${bonus} XP`,
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
            
            delete global.gameMath[chatId];
        } else {
            await sock.sendMessage(chatId, {
                text: `❌ *SALAH!*\n\nJawaban *${jawabanUser}* tidak tepat.\n💡 Coba lagi atau ketik *nyerah* untuk menyerah.`,
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
};