let timeout = 60000;
let poin = 500;

global.gameKuis = global.gameKuis || {};

const questions = {
    science: [
        { soal: "Apa nama planet terdekat dengan Matahari?", jawaban: "Merkurius", pilihan: ["Merkurius", "Venus", "Bumi", "Mars"] },
        { soal: "Apa nama proses pembuatan makanan pada tumbuhan?", jawaban: "Fotosintesis", pilihan: ["Fotosintesis", "Respirasi", "Fermentasi", "Transpirasi"] },
        { soal: "Apa nama partikel terkecil penyusun materi?", jawaban: "Atom", pilihan: ["Atom", "Molekul", "Elektron", "Proton"] },
        { soal: "Apa nama gaya yang menarik benda ke pusat bumi?", jawaban: "Gravitasi", pilihan: ["Gravitasi", "Magnet", "Listrik", "Gesek"] },
        { soal: "Apa nama alat untuk mengukur suhu?", jawaban: "Termometer", pilihan: ["Termometer", "Barometer", "Hygrometer", "Anemometer"] },
        { soal: "Hewan apa yang bisa hidup di air dan darat?", jawaban: "Amfibi", pilihan: ["Amfibi", "Reptil", "Mamalia", "Aves"] },
        { soal: "Apa nama darah putih yang melawan infeksi?", jawaban: "Leukosit", pilihan: ["Leukosit", "Eritrosit", "Trombosit", "Plasma"] },
        { soal: "Apa nama planet terbesar di tata surya?", jawaban: "Jupiter", pilihan: ["Jupiter", "Saturnus", "Uranus", "Neptunus"] },
        { soal: "Apa nama proses perubahan air menjadi uap?", jawaban: "Evaporasi", pilihan: ["Evaporasi", "Kondensasi", "Presipitasi", "Sublimasi"] },
        { soal: "Apa nama alat untuk melihat benda mikroskopis?", jawaban: "Mikroskop", pilihan: ["Mikroskop", "Teleskop", "Periskop", "Stetoskop"] },
        { soal: "Apa nama lapisan atmosfer yang melindungi bumi dari sinar UV?", jawaban: "Ozon", pilihan: ["Ozon", "Troposfer", "Stratosfer", "Mesosfer"] },
        { soal: "Apa nama hewan tercepat di darat?", jawaban: "Cheetah", pilihan: ["Cheetah", "Singa", "Macan", "Kuda"] },
        { soal: "Apa nama tulang yang melindungi otak?", jawaban: "Tengkorak", pilihan: ["Tengkorak", "Rusuk", "Belakang", "Panggul"] },
        { soal: "Apa nama asam yang ada di lambung?", jawaban: "Asam Klorida", pilihan: ["Asam Klorida", "Asam Sulfat", "Asam Nitrat", "Asam Asetat"] },
        { soal: "Apa nama planet yang memiliki cincin?", jawaban: "Saturnus", pilihan: ["Saturnus", "Jupiter", "Uranus", "Neptunus"] },
        { soal: "Apa nama organ yang memompa darah?", jawaban: "Jantung", pilihan: ["Jantung", "Paru-paru", "Hati", "Ginjal"] },
        { soal: "Apa nama proses pencernaan secara mekanik di mulut?", jawaban: "Mengunyah", pilihan: ["Mengunyah", "Menelan", "Mencerna", "Menyerap"] },
        { soal: "Apa nama energi yang dihasilkan dari panas bumi?", jawaban: "Geothermal", pilihan: ["Geothermal", "Solar", "Angin", "Air"] },
        { soal: "Apa nama tumbuhan pemakan serangga?", jawaban: "Kantong Semar", pilihan: ["Kantong Semar", "Mawar", "Melati", "Anggrek"] },
        { soal: "Apa nama zat yang mempercepat reaksi kimia?", jawaban: "Katalis", pilihan: ["Katalis", "Inhibitor", "Reaktan", "Produk"] }
    ],
    history: [
        { soal: "Siapa presiden pertama Indonesia?", jawaban: "Soekarno", pilihan: ["Soekarno", "Soeharto", "Habibie", "Gus Dur"] },
        { soal: "Kapan Indonesia merdeka?", jawaban: "17 Agustus 1945", pilihan: ["17 Agustus 1945", "17 Agustus 1946", "17 Agustus 1947", "17 Agustus 1948"] },
        { soal: "Siapa penemu lampu pijar?", jawaban: "Thomas Alva Edison", pilihan: ["Thomas Alva Edison", "Nikola Tesla", "Albert Einstein", "Alexander Graham Bell"] },
        { soal: "Apa nama perang dunia pertama dimulai tahun?", jawaban: "1914", pilihan: ["1914", "1915", "1916", "1917"] },
        { soal: "Siapa pahlawan wanita dari Aceh?", jawaban: "Cut Nyak Dien", pilihan: ["Cut Nyak Dien", "R.A. Kartini", "Dewi Sartika", "Martha Christina Tiahahu"] },
        { soal: "Siapa yang menulis proklamasi kemerdekaan Indonesia?", jawaban: "Soekarno", pilihan: ["Soekarno", "Mohammad Hatta", "Ahmad Soebardjo", "Sayuti Melik"] },
        { soal: "Apa nama kerajaan Hindu tertua di Indonesia?", jawaban: "Kutai", pilihan: ["Kutai", "Tarumanegara", "Sriwijaya", "Majapahit"] },
        { soal: "Siapa penemu benua Amerika?", jawaban: "Christopher Columbus", pilihan: ["Christopher Columbus", "Ferdinand Magellan", "Marco Polo", "Vasco da Gama"] },
        { soal: "Apa nama candi Buddha terbesar di dunia?", jawaban: "Borobudur", pilihan: ["Borobudur", "Prambanan", "Sewu", "Mendut"] },
        { soal: "Siapa raja terkenal dari Kerajaan Majapahit?", jawaban: "Hayam Wuruk", pilihan: ["Hayam Wuruk", "Gajah Mada", "Ken Arok", "Kertanegara"] },
        { soal: "Apa nama peristiwa penculikan Soekarno-Hatta?", jawaban: "Rengasdengklok", pilihan: ["Rengasdengklok", "Bandung", "Yogyakarta", "Jakarta"] },
        { soal: "Siapa presiden Amerika Serikat pertama?", jawaban: "George Washington", pilihan: ["George Washington", "Abraham Lincoln", "Thomas Jefferson", "John Adams"] },
        { soal: "Apa nama kerajaan Islam terbesar di Indonesia?", jawaban: "Demak", pilihan: ["Demak", "Mataram", "Banten", "Cirebon"] },
        { soal: "Siapa tokoh reformasi Indonesia?", jawaban: "B.J. Habibie", pilihan: ["B.J. Habibie", "Abdurrahman Wahid", "Megawati", "Susilo Bambang Yudhoyono"] },
        { soal: "Apa nama perang antara Indonesia dan Belanda?", jawaban: "Revolusi Fisik", pilihan: ["Revolusi Fisik", "Perang Diponegoro", "Perang Padri", "Perang Aceh"] },
        { soal: "Siapa yang dijuluki Singa Podium?", jawaban: "Soekarno", pilihan: ["Soekarno", "Soeharto", "B.J. Habibie", "Abdurrahman Wahid"] },
        { soal: "Apa nama organisasi pergerakan nasional pertama?", jawaban: "Budi Utomo", pilihan: ["Budi Utomo", "Sarekat Islam", "Indische Partij", "Muhammadiyah"] },
        { soal: "Siapa arsitek pembangunan Monas?", jawaban: "Soedarsono", pilihan: ["Soedarsono", "Friedrich Silaban", "R.M. Soedarsono", "Suharto"] },
        { soal: "Apa nama perjanjian yang mengakhiri Perang Dunia II?", jawaban: "Perjanjian Versailles", pilihan: ["Perjanjian Versailles", "Perjanjian Paris", "Perjanjian London", "Perjanjian Roma"] },
        { soal: "Siapa tokoh yang dijuluki Bapak Koperasi Indonesia?", jawaban: "Mohammad Hatta", pilihan: ["Mohammad Hatta", "Soekarno", "Ki Hajar Dewantara", "Ahmad Dahlan"] }
    ],
    geography: [
        { soal: "Apa ibu kota Indonesia?", jawaban: "Jakarta", pilihan: ["Jakarta", "Surabaya", "Bandung", "Medan"] },
        { soal: "Apa gunung tertinggi di dunia?", jawaban: "Everest", pilihan: ["Everest", "Kilimanjaro", "Fuji", "K2"] },
        { soal: "Apa sungai terpanjang di dunia?", jawaban: "Nil", pilihan: ["Nil", "Amazon", "Mississippi", "Yangtze"] },
        { soal: "Apa negara terluas di dunia?", jawaban: "Rusia", pilihan: ["Rusia", "Kanada", "China", "Amerika Serikat"] },
        { soal: "Apa ibu kota Jepang?", jawaban: "Tokyo", pilihan: ["Tokyo", "Osaka", "Kyoto", "Nagoya"] },
        { soal: "Apa gurun terluas di dunia?", jawaban: "Sahara", pilihan: ["Sahara", "Gobi", "Kalahari", "Atacama"] },
        { soal: "Apa samudera terluas di dunia?", jawaban: "Pasifik", pilihan: ["Pasifik", "Atlantik", "Hindia", "Arktik"] },
        { soal: "Apa ibu kota Thailand?", jawaban: "Bangkok", pilihan: ["Bangkok", "Phuket", "Chiang Mai", "Pattaya"] },
        { soal: "Apa danau terbesar di dunia?", jawaban: "Kaspia", pilihan: ["Kaspia", "Superior", "Victoria", "Titicaca"] },
        { soal: "Apa negara dengan populasi terbanyak di dunia?", jawaban: "China", pilihan: ["China", "India", "Amerika Serikat", "Indonesia"] },
        { soal: "Apa ibu kota Australia?", jawaban: "Canberra", pilihan: ["Canberra", "Sydney", "Melbourne", "Perth"] },
        { soal: "Apa gunung tertinggi di Indonesia?", jawaban: "Puncak Jaya", pilihan: ["Puncak Jaya", "Kerinci", "Rinjani", "Semeru"] },
        { soal: "Apa selat yang memisahkan Sumatera dan Jawa?", jawaban: "Selat Sunda", pilihan: ["Selat Sunda", "Selat Bali", "Selat Lombok", "Selat Malaka"] },
        { soal: "Apa ibu kota Malaysia?", jawaban: "Kuala Lumpur", pilihan: ["Kuala Lumpur", "Putrajaya", "Johor Bahru", "Penang"] },
        { soal: "Apa negara terkecil di dunia?", jawaban: "Vatikan", pilihan: ["Vatikan", "Monako", "San Marino", "Malta"] },
        { soal: "Apa benua terluas di dunia?", jawaban: "Asia", pilihan: ["Asia", "Afrika", "Amerika", "Eropa"] },
        { soal: "Apa ibu kota Inggris?", jawaban: "London", pilihan: ["London", "Manchester", "Liverpool", "Birmingham"] },
        { soal: "Apa air terjun tertinggi di dunia?", jawaban: "Angel", pilihan: ["Angel", "Niagara", "Victoria", "Iguazu"] },
        { soal: "Apa negara kepulauan terbesar di dunia?", jawaban: "Indonesia", pilihan: ["Indonesia", "Filipina", "Jepang", "Maladewa"] },
        { soal: "Apa ibu kota Mesir?", jawaban: "Kairo", pilihan: ["Kairo", "Alexandria", "Giza", "Luxor"] }
    ],
    math: [
        { soal: "Berapa hasil dari 8 x 7?", jawaban: "56", pilihan: ["56", "48", "64", "49"] },
        { soal: "Apa akar kuadrat dari 144?", jawaban: "12", pilihan: ["12", "14", "16", "18"] },
        { soal: "Berapa hasil dari 100 dibagi 4?", jawaban: "25", pilihan: ["25", "20", "30", "15"] },
        { soal: "Apa nilai π (pi)?", jawaban: "3,14", pilihan: ["3,14", "3,12", "3,16", "3,18"] },
        { soal: "Berapa hasil dari 15 + 27?", jawaban: "42", pilihan: ["42", "52", "32", "40"] },
        { soal: "Apa hasil dari 9^2?", jawaban: "81", pilihan: ["81", "72", "64", "90"] },
        { soal: "Berapa hasil dari 50 - 28?", jawaban: "22", pilihan: ["22", "18", "20", "24"] },
        { soal: "Apa hasil dari 6 x 9?", jawaban: "54", pilihan: ["54", "45", "63", "56"] },
        { soal: "Apa hasil dari 144 dibagi 12?", jawaban: "12", pilihan: ["12", "10", "14", "8"] },
        { soal: "Berapa hasil dari 30 + 45?", jawaban: "75", pilihan: ["75", "65", "85", "70"] },
        { soal: "Apa hasil dari 7 x 8?", jawaban: "56", pilihan: ["56", "48", "64", "49"] },
        { soal: "Apa akar kuadrat dari 169?", jawaban: "13", pilihan: ["13", "11", "15", "17"] },
        { soal: "Berapa hasil dari 200 - 75?", jawaban: "125", pilihan: ["125", "115", "135", "105"] },
        { soal: "Apa hasil dari 11 x 12?", jawaban: "132", pilihan: ["132", "121", "144", "112"] },
        { soal: "Apa hasil dari 81 dibagi 9?", jawaban: "9", pilihan: ["9", "8", "10", "7"] },
        { soal: "Apa nilai 5^3?", jawaban: "125", pilihan: ["125", "115", "135", "105"] },
        { soal: "Berapa hasil dari 24 + 36?", jawaban: "60", pilihan: ["60", "50", "70", "40"] },
        { soal: "Apa hasil dari 14 x 6?", jawaban: "84", pilihan: ["84", "74", "94", "64"] },
        { soal: "Apa akar kuadrat dari 225?", jawaban: "15", pilihan: ["15", "13", "17", "19"] },
        { soal: "Berapa hasil dari 1000 dibagi 8?", jawaban: "125", pilihan: ["125", "120", "130", "140"] }
    ]
};

const categories = [
    { name: 'Sains', key: 'science' },
    { name: 'Sejarah', key: 'history' },
    { name: 'Geografi', key: 'geography' },
    { name: 'Matematika', key: 'math' }
];

export default {
    cmd: ['kuis', 'quiz', 'nyerah'],
    tags: ['game'],
    limit: false,
    group: true,

    run: async (sock, m, { user, prefix, command }) => {
        const chatId = m.key.remoteJid;
        
        if (command === 'nyerah') {
            if (global.gameKuis && global.gameKuis[chatId]) {
                const jawaban = global.gameKuis[chatId].jawaban;
                clearTimeout(global.gameKuis[chatId].timer);
                
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
                
                delete global.gameKuis[chatId];
            } else {
                await sock.sendMessage(chatId, {
                    text: `❌ *Tidak ada kuis yang sedang berjalan!*\n\nKetik .kuis untuk memulai.`
                }, { quoted: global.fVerif });
            }
            return;
        }
        
        if (command === 'kuis' || command === 'quiz') {
            if (global.gameKuis[chatId]) {
                return sock.sendMessage(chatId, {
                    text: `❌ *Masih ada pertanyaan yang belum dijawab!*\nKetik *nyerah* untuk mengakhiri.`
                }, { quoted: global.fVerif });
            }
            
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            const questionsList = questions[randomCategory.key];
            const randomIndex = Math.floor(Math.random() * questionsList.length);
            const q = questionsList[randomIndex];
            
            let optionText = '';
            for (let i = 0; i < q.pilihan.length; i++) {
                const letter = String.fromCharCode(65 + i);
                optionText += `${letter}. ${q.pilihan[i]}\n`;
            }
            
            global.gameKuis[chatId] = {
                jawaban: q.jawaban,
                jawabanLetter: String.fromCharCode(65 + q.pilihan.indexOf(q.jawaban)),
                aktif: true,
                timer: null
            };
            
            const text = `╭─────────────────┈ ⊹
│  ❓ *K U I S* ❓
│
├─ ❏ 📂 *Kategori:* ${randomCategory.name}
│
├─ ❏ 📝 *Soal:*
│     ${q.soal}
│
├─ ❏ 🔘 *Pilihan:*
${optionText}
│
├─ ❏ ⏰ *Timeout:* 60 detik
├─ ❏ 🎁 *Bonus:* ${poin} XP
├─ ❏ 😔 *Nyerah:* ketik "nyerah"
│
├─ ❏ 💬 *Jawab dengan huruf A/B/C/D*
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
                if (global.gameKuis[chatId] && global.gameKuis[chatId].aktif) {
                    const jawaban = global.gameKuis[chatId].jawaban;
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
                    delete global.gameKuis[chatId];
                }
            }, timeout);
            
            global.gameKuis[chatId].timer = timer;
            return;
        }
    },
    
    all: async (sock, m, { isGroup, user }) => {
        if (!isGroup) return;
        
        const chatId = m.key.remoteJid;
        
        if (!global.gameKuis || !global.gameKuis[chatId]) return;
        if (!global.gameKuis[chatId].aktif) return;
        
        let pesan = '';
        if (m.message?.conversation) pesan = m.message.conversation;
        else if (m.msg?.text) pesan = m.msg.text;
        else return;
        
        if (pesan.startsWith('.') || pesan.startsWith('#')) return;
        
        if (pesan.toLowerCase().trim() === 'nyerah') {
            const jawaban = global.gameKuis[chatId].jawaban;
            clearTimeout(global.gameKuis[chatId].timer);
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
            delete global.gameKuis[chatId];
            return;
        }
        
        const jawabanLetter = pesan.toUpperCase().trim();
        const validLetters = ['A', 'B', 'C', 'D'];
        
        if (!validLetters.includes(jawabanLetter)) return;
        
        const jawabanBenar = global.gameKuis[chatId].jawaban;
        const jawabanBenarLetter = global.gameKuis[chatId].jawabanLetter;
        
        if (jawabanLetter === jawabanBenarLetter) {
            clearTimeout(global.gameKuis[chatId].timer);
            
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
            
            delete global.gameKuis[chatId];
        } else {
            await sock.sendMessage(chatId, {
                text: `❌ *SALAH!*\n\nJawaban *${jawabanLetter}* tidak tepat.\n💡 Coba lagi atau ketik *nyerah* untuk menyerah.`,
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