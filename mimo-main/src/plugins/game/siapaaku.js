let timeout = 60000;
let poin = 4999;

global.gameSiapakahAku = global.gameSiapakahAku || {};

const questions = [
    { soal: "Aku hewan berkaki empat, punya suara mengaum, dan dijuluki raja hutan.", jawaban: "singa" },
    { soal: "Aku tumbuhan berduri, bunganya merah, melambangkan cinta.", jawaban: "mawar" },
    { soal: "Aku dipakai di pergelangan tangan, menunjukkan waktu.", jawaban: "jam tangan" },
    { soal: "Aku planet terdekat dengan matahari, sangat panas.", jawaban: "merkuri" },
    { soal: "Aku bisa terbang, membawa penumpang ke berbagai kota.", jawaban: "pesawat" },
    { soal: "Aku buah berwarna kuning, bentuk melengkung, disukai monyet.", jawaban: "pisang" },
    { soal: "Aku pakaian adat Jepang, dipakai wanita saat formal.", jawaban: "kimono" },
    { soal: "Aku penemu lampu pijar, namaku terkenal dunia.", jawaban: "thomas alva edison" },
    { soal: "Aku hewan malam, bisa terbang, suka makan buah.", jawaban: "kelelawar" },
    { soal: "Aku negara dengan julukan negeri sakura.", jawaban: "jepang" },
    { soal: "Aku alat musik petik, punya 6 senar.", jawaban: "gitar" },
    { soal: "Aku gunung tertinggi di dunia, terletak di Nepal.", jawaban: "everest" },
    { soal: "Aku minuman hitam pahit, diminum pagi hari.", jawaban: "kopi" },
    { soal: "Aku hewan laut punya 8 tentakel.", jawaban: "gurita" },
    { soal: "Aku lagu kebangsaan Indonesia.", jawaban: "indonesia raya" },
    { soal: "Aku ibu kota negara Indonesia.", jawaban: "jakarta" },
    { soal: "Aku benda untuk menulis, berisi tinta.", jawaban: "pulpen" },
    { soal: "Aku hewan punya punuk, hidup di gurun.", jawaban: "unta" },
    { soal: "Aku presiden pertama Indonesia.", jawaban: "soekarno" },
    { soal: "Aku olahraga pakai raket dan kok.", jawaban: "bulu tangkis" },
    { soal: "Aku benda untuk menghapus pensil.", jawaban: "penghapus" },
    { soal: "Aku planet yang punya cincin.", jawaban: "saturnus" },
    { soal: "Aku hewan yang bisa berubah warna.", jawaban: "bunglon" },
    { soal: "Aku makanan khas Padang dari daging sapi.", jawaban: "rendang" },
    { soal: "Aku penemu benua Amerika.", jawaban: "christopher columbus" },
    { soal: "Aku hewan penghasil susu.", jawaban: "sapi" },
    { soal: "Aku alat komunikasi modern yang bisa dibawa kemana-mana.", jawaban: "handphone" },
    { soal: "Aku sungai terpanjang di dunia.", jawaban: "sungai nil" },
    { soal: "Aku hewan berbelalai panjang.", jawaban: "gajah" },
    { soal: "Aku masakan Jepang berupa nasi dengan topping ikan mentah.", jawaban: "sushi" },
    { soal: "Aku pahlawan wanita dari Aceh.", jawaban: "cut nyak dien" },
    { soal: "Aku benda untuk minum, terbuat dari kaca atau plastik.", jawaban: "gelas" },
    { soal: "Aku hewan yang bisa terbang dan berkicau.", jawaban: "burung" },
    { soal: "Aku ibukota negara Jepang.", jawaban: "tokyo" },
    { soal: "Aku alat musik tiup dari logam.", jawaban: "terompet" },
    { soal: "Aku hewan pintar suka meniru.", jawaban: "monyet" },
    { soal: "Aku makanan pokok masyarakat Indonesia.", jawaban: "nasi" },
    { soal: "Aku ilmuwan terkenal dengan rambut khas dan teori relativitas.", jawaban: "albert einstein" },
    { soal: "Aku hewan bercangkang, jalanku lambat.", jawaban: "kura kura" },
    { soal: "Aku transportasi tradisional di air.", jawaban: "perahu" },
    { soal: "Aku buah berduri, dijuluki raja buah.", jawaban: "durian" },
    { soal: "Aku pakaian adat Bali, dipakai wanita.", jawaban: "kebaya" },
    { soal: "Aku hewan hitam putih yang suka bambu.", jawaban: "panda" },
    { soal: "Aku elektronik untuk menyimpan makanan tetap dingin.", jawaban: "kulkas" },
    { soal: "Aku pencipta lagu Indonesia Raya.", jawaban: "wage rudolf soepratman" },
    { soal: "Aku hewan yang disebut sahabat manusia.", jawaban: "anjing" },
    { soal: "Aku ibukota negara Inggris.", jawaban: "london" },
    { soal: "Aku alat transportasi roda dua tanpa mesin, harus dikayuh.", jawaban: "sepeda" },
    { soal: "Aku buah berwarna hijau atau merah, rasanya manis atau asam, ada bintang di dalamnya.", jawaban: "apel" },
    { soal: "Aku benda elektronik untuk menonton film atau berita.", jawaban: "televisi" },
    { soal: "Aku hewan yang menghasilkan telur, suaranya kukuruyuk.", jawaban: "ayam" },
    { soal: "Aku benda untuk menerangi ruangan saat gelap.", jawaban: "lampu" }
];

export default {
    cmd: ['siapakahaku', 'siapaaku', 'nyerah', 'whohint'],
    tags: ['game'],
    limit: false,
    group: true,

    run: async (sock, m, { user, prefix, command }) => {
        const chatId = m.key.remoteJid;
        
        if (command === 'nyerah') {
            if (global.gameSiapakahAku && global.gameSiapakahAku[chatId]) {
                const jawaban = global.gameSiapakahAku[chatId].jawaban;
                clearTimeout(global.gameSiapakahAku[chatId].timer);
                
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
                
                delete global.gameSiapakahAku[chatId];
            } else {
                await sock.sendMessage(chatId, {
                    text: `❌ *Tidak ada game yang sedang berjalan!*\n\nKetik .siapakahaku untuk memulai.`
                }, { quoted: global.fVerif });
            }
            return;
        }
        
        if (command === 'whohint') {
            if (!global.gameSiapakahAku || !global.gameSiapakahAku[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Tidak ada game yang sedang berjalan!*\n\nKetik .siapakahaku untuk memulai.`
                }, { quoted: global.fVerif });
            }
            
            const jawaban = global.gameSiapakahAku[chatId].jawaban;
            let hint = '';
            for (let i = 0; i < jawaban.length; i++) {
                if (i === 0 || i === jawaban.length - 1) {
                    hint += jawaban[i];
                } else {
                    hint += '*';
                }
            }
            
            await sock.sendMessage(chatId, {
                text: `💡 *HINT:* ${hint}\n📏 *Panjang:* ${jawaban.length} huruf`,
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
        
        if (command === 'siapakahaku' || command === 'siapaaku') {
            if (global.gameSiapakahAku[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Masih ada pertanyaan yang belum dijawab!*\nKetik *nyerah* untuk mengakhiri.`
                }, { quoted: global.fVerif });
            }
            
            const randomIndex = Math.floor(Math.random() * questions.length);
            const q = questions[randomIndex];
            
            global.gameSiapakahAku[chatId] = {
                jawaban: q.jawaban.toLowerCase(),
                soal: q.soal,
                aktif: true,
                timer: null
            };
            
            const text = `╭─────────────────┈ ⊹
│  🕵️ *S I A P A K A H   A K U* 🕵️
│
├─ ❏ ❓ *Soal:*
│     ${q.soal}
│
├─ ❏ ⏰ *Timeout:* ${(timeout / 1000).toFixed(2)} detik
├─ ❏ 💡 *Hint:* ${prefix}whohint
├─ ❏ 🎁 *Bonus:* ${poin} XP
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
                if (global.gameSiapakahAku[chatId] && global.gameSiapakahAku[chatId].aktif) {
                    const jawaban = global.gameSiapakahAku[chatId].jawaban;
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
                    delete global.gameSiapakahAku[chatId];
                }
            }, timeout);
            
            global.gameSiapakahAku[chatId].timer = timer;
            return;
        }
    },
    
    all: async (sock, m, { isGroup, user }) => {
        if (!isGroup) return;
        
        const chatId = m.key.remoteJid;
        
        if (!global.gameSiapakahAku || !global.gameSiapakahAku[chatId]) return;
        if (!global.gameSiapakahAku[chatId].aktif) return;
        
        let pesan = '';
        if (m.message?.conversation) pesan = m.message.conversation;
        else if (m.msg?.text) pesan = m.msg.text;
        else return;
        
        if (pesan.startsWith('.') || pesan.startsWith('#')) return;
        
        if (pesan.toLowerCase().trim() === 'nyerah') {
            const jawaban = global.gameSiapakahAku[chatId].jawaban;
            clearTimeout(global.gameSiapakahAku[chatId].timer);
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
            delete global.gameSiapakahAku[chatId];
            return;
        }
        
        const jawabanBenar = global.gameSiapakahAku[chatId].jawaban;
        
        if (pesan.toLowerCase().trim() === jawabanBenar) {
            clearTimeout(global.gameSiapakahAku[chatId].timer);
            
            if (user && user.rpg) {
                user.rpg.exp = (user.rpg.exp || 0) + poin;
                user.rpg.money = (user.rpg.money || 0) + poin;
                await user.save();
            }
            
            await sock.sendMessage(chatId, {
                text: `✅ *BENAR!*\n\n🎉 Jawaban *${jawabanBenar}* benar!\n✨ +${poin} XP\n💰 +${poin} Money`,
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
            
            delete global.gameSiapakahAku[chatId];
        } else {
            await sock.sendMessage(chatId, {
                text: `❌ *SALAH!*\n\nJawaban *${pesan}* tidak tepat.\n💡 Coba lagi atau ketik *nyerah* untuk menyerah.`,
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