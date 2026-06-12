import axios from 'axios';
import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['bokepdetail', 'bokepinfo', 'videoinfo'],
    tags: ['download'],
    run: async (sock, m, { text, args, prefix }) => {
        try {
            if (!text) {
                return m.reply(toSmallCaps(`❌ *cara penggunaan:*\n${prefix}bokepdetail <id>\n\nContoh: ${prefix}bokepdetail 42451`));
            }
            
            const videoId = parseInt(text);
            if (isNaN(videoId)) {
                return m.reply(toSmallCaps('❌ ID harus berupa angka!'));
            }
            
            await m.react('⏳');
            
            // Ambil detail video
            const detailResponse = await axios.get(`https://play.simplepaste.site/v2/videos/${videoId}?key=public`);
            
            if (detailResponse.data.status !== 'success') {
                throw new Error('Gagal mengambil detail video');
            }
            
            // PERBAIKAN: Gunakan let untuk variabel yang mungkin diubah
            let videoData = detailResponse.data.data;
            
            if (!videoData) {
                return m.reply(toSmallCaps(`❌ Video dengan ID ${videoId} tidak ditemukan!`));
            }
            
            // PERBAIKAN: Buat objek baru untuk video agar tidak ada assignment ke const
            const video = {
                id: videoData.id,
                title: videoData.title,
                length: videoData.length,
                views: videoData.views,
                created_at: videoData.created_at,
                categories: videoData.categories || [],
                thumbnail_url: videoData.thumbnail_url
            };
            
            const downloadUrl = `https://play.simplepaste.site/d/${video.id}`;
            const embedUrl = `https://play.simplepaste.site/e/${video.id}`;
            
            const duration = formatDuration(video.length);
            const views = formatNumber(video.views);
            const date = new Date(video.created_at).toLocaleDateString('id-ID');
            
            // Buat pesan informasi
            let infoMessage = `🎬 *${video.title}*\n\n`;
            infoMessage += `⏱️ *Durasi:* ${duration}\n`;
            infoMessage += `👁️ *Views:* ${views}\n`;
            infoMessage += `📅 *Tanggal:* ${date}\n`;
            infoMessage += `🆔 *ID:* ${video.id}\n`;
            
            if (video.categories && video.categories.length > 0) {
                infoMessage += `🏷️ *Kategori:* ${video.categories.map(c => c.name).join(', ')}\n`;
            }
            
            infoMessage += `\n🔗 *Link Download:*\n${downloadUrl}\n\n`;
            infoMessage += `🎥 *Link Streaming:*\n${embedUrl}\n\n`;
            infoMessage += `📌 *Cara download:*\n`;
            infoMessage += `• Buka link di browser\n`;
            infoMessage += `• Klik kanan → Save video as\n`;
            infoMessage += `\n_© Mimosa Bot_`;
            
            // Kirim pesan dengan thumbnail
            await sock.sendMessage(m.key.remoteJid, {
                text: infoMessage,
                contextInfo: {
                    externalAdReply: {
                        title: toSmallCaps(video.title.substring(0, 30)),
                        body: toSmallCaps(`${duration} • ${views} views`),
                        thumbnailUrl: video.thumbnail_url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });
            
            await m.react('✅');
            
        } catch (e) {
            console.error('Video Detail Error:', e);
            await m.react('❌');
            
            if (e.response?.status === 404) {
                m.reply(toSmallCaps(`❌ *Video tidak ditemukan!*\nID: ${text}\nPastikan ID video benar.`));
            } else {
                m.reply(toSmallCaps(`❌ *error:* ${e.message}`));
            }
        }
    }
};

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