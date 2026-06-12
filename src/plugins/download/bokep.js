import axios from 'axios';
import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['bokep', 'searchvideo', 'bokepnext', 'bokepprev'],
    tags: ['download'],
    premium: true,
    run: async (sock, m, { text, args, prefix, command }) => {
        try {
            // ==================== STATE UNTUK NAVIGASI ====================
            // Simpan state pencarian per user (sederhana, tanpa database)
            if (!global.userSearchState) global.userSearchState = {};
            
            const userId = m.sender;
            let page = 1;
            let limit = 15;
            let search = '';
            let sort = 'latest';
            
            // ==================== HANDLE NEXT PAGE ====================
            if (command === 'bokepnext') {
                const state = global.userSearchState[userId];
                if (!state) {
                    return m.reply(toSmallCaps(`❌ Tidak ada sesi pencarian aktif!\nKetik *${prefix}bokep* terlebih dahulu.`));
                }
                page = state.page + 1;
                search = state.search;
                sort = state.sort;
                limit = state.limit;
            }
            
            // ==================== HANDLE PREV PAGE ====================
            else if (command === 'bokepprev') {
                const state = global.userSearchState[userId];
                if (!state) {
                    return m.reply(toSmallCaps(`❌ Tidak ada sesi pencarian aktif!\nKetik *${prefix}bokep* terlebih dahulu.`));
                }
                if (state.page <= 1) {
                    return m.reply(toSmallCaps(`❌ Sudah di halaman pertama!`));
                }
                page = state.page - 1;
                search = state.search;
                sort = state.sort;
                limit = state.limit;
            }
            
            // ==================== PARSE ARGUMEN ====================
            else {
                // Parsing argument untuk pencarian biasa
                if (command === 'searchvideo' && text) {
                    search = text;
                } else if (args.length > 0) {
                    for (let i = 0; i < args.length; i++) {
                        if (args[i] === '--page' && args[i+1]) {
                            page = parseInt(args[++i]);
                        } else if (args[i] === '--limit' && args[i+1]) {
                            limit = parseInt(args[++i]);
                        } else if (args[i] === '--search' && args[i+1]) {
                            search = args[++i];
                        } else if (args[i] === '--sort' && args[i+1]) {
                            sort = args[++i];
                        } else if (!isNaN(parseInt(args[i]))) {
                            page = parseInt(args[i]);
                        }
                    }
                }
            }
            
            // Batasan
            if (page > 500) page = 500;
            if (page < 1) page = 1;
            if (limit > 30) limit = 30;
            
            await m.react('⏳');
            
            // Build URL
            let apiUrl = `https://play.simplepaste.site/v2/videos?key=public&page=${page}&limit=${limit}&sort=${sort}`;
            if (search) apiUrl += `&search=${encodeURIComponent(search)}`;
            
            const response = await axios.get(apiUrl);
            const data = response.data;
            
            if (data.status !== 'success') {
                throw new Error('Gagal mengambil data');
            }
            
            const videos = data.data;
            const pagination = data.pagination;
            
            if (!videos || videos.length === 0) {
                let notFoundMsg = `❌ Tidak ada video`;
                if (search) notFoundMsg += ` dengan kata kunci "${search}"`;
                return m.reply(toSmallCaps(notFoundMsg));
            }
            
            // ==================== SIMPAN STATE ====================
            global.userSearchState[userId] = {
                page: pagination.current_page,
                search: search,
                sort: sort,
                limit: limit,
                total_pages: pagination.total_pages,
                total_items: pagination.total_items
            };
            
            // ==================== BUAT PESAN ====================
            let message = `📹 *DAFTAR VIDEO* 📹\n`;
            message += `╭─「 Info 」\n`;
            message += `│ 📄 Halaman: ${pagination.current_page}/${pagination.total_pages}\n`;
            message += `│ 📊 Total: ${pagination.total_items} video\n`;
            if (search) message += `│ 🔍 Search: "${search}"\n`;
            message += `│ 📌 Sort: ${sort}\n`;
            message += `╰──────────────\n\n`;
            
            // Tampilkan video
            videos.forEach((video, index) => {
                const duration = formatDuration(video.length);
                const views = formatNumber(video.views);
                const date = new Date(video.created_at).toLocaleDateString('id-ID');
                
                message += `*${index + 1}. ${video.title.substring(0, 50)}${video.title.length > 50 ? '...' : ''}*\n`;
                message += `   ⏱️ ${duration} | 👁️ ${views} | 📅 ${date}\n`;
                message += `   🏷️ ${video.categories.map(c => c.name).join(', ')}\n`;
                message += `   🆔 *ID:* ${video.id}\n`;
                message += `   📥 *Link:* ${prefix}bokepinfo ${video.id}\n`;
                message += `\n`;
            });
            
            // ==================== NAVIGASI BUTTON ====================
            message += `╭─「 Navigasi 」\n`;
            
            // Tombol Previous (jika bukan halaman 1)
            if (pagination.current_page > 1) {
                message += `│ 🔙 *Previous:* ${prefix}bokepprev\n`;
            }
            
            // Tombol Next (jika bukan halaman terakhir)
            if (pagination.current_page < pagination.total_pages) {
                message += `│ 🔜 *Next:* ${prefix}bokepnext\n`;
            }
            
            message += `│ 🔄 *Refresh:* ${prefix}bokep\n`;
            if (search) {
                message += `│ 🔍 *Cari lagi:* ${prefix}searchvideo <kata>\n`;
            }
            message += `╰──────────────\n\n`;
            
            message += `📌 *Cara penggunaan:*\n`;
            message += `• ${prefix}bokep - Lihat video terbaru\n`;
            message += `• ${prefix}bokep 2 - Halaman 2\n`;
            message += `• ${prefix}searchvideo judul - Cari video\n`;
            message += `• ${prefix}bokepnext - Halaman berikutnya\n`;
            message += `• ${prefix}bokepprev - Halaman sebelumnya\n`;
            message += `• ${prefix}bokepinfo <id> - Dapatkan link download\n`;
            message += `\n_© Mimosa Bot_`;
            
            await sock.sendMessage(m.key.remoteJid, {
                text: message,
                contextInfo: {
                    externalAdReply: {
                        title: toSmallCaps("Video List"),
                        body: toSmallCaps(`Halaman ${page} dari ${pagination.total_pages}`),
                        thumbnailUrl: videos[0]?.thumbnail_url || 'https://files.catbox.moe/2mq5qq.png',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });
            
            await m.react('✅');
            
        } catch (e) {
            console.error('Video List Error:', e);
            await m.react('❌');
            m.reply(toSmallCaps(`❌ *error:* ${e.message}`));
        }
    }
};

// ==================== PLUGIN INFO ====================
export const info = {
    cmd: ['bokepinfo', 'bokepdetail'],
    tags: ['download'],
    premium: true,
    run: async (sock, m, { text, prefix }) => {
        try {
            if (!text) {
                return m.reply(toSmallCaps(`❌ *cara penggunaan:*\n${prefix}bokepinfo <id>\n\nContoh: ${prefix}bokepinfo 42451`));
            }
            
            const videoId = parseInt(text);
            if (isNaN(videoId)) {
                return m.reply(toSmallCaps('❌ ID harus berupa angka!'));
            }
            
            await m.react('⏳');
            
            const detailRes = await axios.get(`https://play.simplepaste.site/v2/videos/${videoId}?key=public`);
            
            if (detailRes.data.status !== 'success') {
                throw new Error('Gagal mengambil detail video');
            }
            
            const v = detailRes.data.data;
            
            if (!v) {
                return m.reply(toSmallCaps(`❌ Video dengan ID ${videoId} tidak ditemukan!`));
            }
            
            const duration = formatDuration(v.length);
            const views = formatNumber(v.views);
            const date = new Date(v.created_at).toLocaleDateString('id-ID');
            const categories = v.categories?.map(c => c.name).join(', ') || '-';
            
            const msg = `🎬 *${v.title}*

⏱️ Durasi: ${duration}
👁️ Views: ${views}
📅 Tanggal: ${date}
🆔 ID: ${v.id}
🏷️ Kategori: ${categories}

🔗 *Link Download:* 
https://play.simplepaste.site/d/${v.id}

🎥 *Link Streaming:* 
https://play.simplepaste.site/e/${v.id}

📌 *Cara download:* Buka link di browser → Pilih server → Tunggu video muncul → Klik kanan → Save video as

_© Mimosa Bot_`;
            
            await sock.sendMessage(m.key.remoteJid, {
                text: msg,
                contextInfo: {
                    externalAdReply: {
                        title: v.title.substring(0, 30),
                        body: `${duration} • ${views} views`,
                        thumbnailUrl: v.thumbnail_url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });
            
            await m.react('✅');
            
        } catch (e) {
            console.error('Info Error:', e);
            await m.react('❌');
            
            if (e.response?.status === 404) {
                m.reply(toSmallCaps(`❌ *Video tidak ditemukan!*\nID: ${text}`));
            } else {
                m.reply(toSmallCaps(`❌ *error:* ${e.message}`));
            }
        }
    }
};

// ==================== FUNGSI HELPER ====================
function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0 detik';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours} jam ${minutes} menit`;
    } else if (minutes > 0) {
        return `${minutes} menit ${secs} detik`;
    } else {
        return `${secs} detik`;
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}