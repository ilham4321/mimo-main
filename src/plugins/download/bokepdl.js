import axios from 'axios';
import { toSmallCaps } from '../../font.js';
import { fileTypeFromBuffer } from 'file-type';

export default {
    cmd: ['bokepdl', 'bokepdownload', 'dlbokep'],
    tags: ['download'],
    run: async (sock, m, { text, prefix }) => {
        try {
            if (!text) {
                return m.reply(toSmallCaps(`❌ *cara penggunaan:*\n${prefix}bokepdl <id>\n\nContoh: ${prefix}bokepdl 42451`));
            }
            
            const videoId = parseInt(text);
            if (isNaN(videoId)) {
                return m.reply(toSmallCaps('❌ ID harus berupa angka!'));
            }
            
            await m.react('⏳');
            
            // 1. Ambil detail video
            const detailRes = await axios.get(`https://play.simplepaste.site/v2/videos/${videoId}?key=public`);
            
            if (detailRes.data.status !== 'success') {
                throw new Error('Gagal mengambil detail video');
            }
            
            const video = detailRes.data.data;
            
            if (!video) {
                return m.reply(toSmallCaps(`❌ Video dengan ID ${videoId} tidak ditemukan!`));
            }
            
            const duration = formatDuration(video.length);
            const views = formatNumber(video.views);
            
            // 2. Kirim info
            await m.reply(toSmallCaps(`⏳ *Mengunduh:* ${video.title}\n⏱️ Durasi: ${duration}\n\nMohon tunggu, video sedang diunduh...`));
            
            // 3. Download dengan header yang benar
            const downloadUrl = `https://play.simplepaste.site/d/${video.id}`;
            
            // Tambahkan header untuk menghindari redirect
            const videoRes = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 180000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://play.simplepaste.site/',
                    'Accept': 'video/mp4,video/webp,video/*,*/*'
                },
                // Jangan ikuti redirect otomatis
                maxRedirects: 0,
                validateStatus: (status) => status < 400
            });
            
            const videoBuffer = Buffer.from(videoRes.data);
            const fileSize = formatFileSize(videoBuffer.length);
            
            // 4. Cek apakah file benar-benar video
            const fileType = await fileTypeFromBuffer(videoBuffer);
            
            // Jika ukuran terlalu kecil (< 100KB) atau bukan video, kemungkinan error
            if (videoBuffer.length < 100000 || (fileType && !fileType.mime.startsWith('video/'))) {
                // Kirim link alternatif
                const embedUrl = `https://play.simplepaste.site/e/${video.id}`;
                const msg = `⚠️ *Gagal download langsung*\n\n` +
                           `🎬 *${video.title}*\n` +
                           `⏱️ ${duration} | 👁️ ${views}\n\n` +
                           `🔗 *Link Alternatif:*\n${embedUrl}\n\n` +
                           `📌 Buka link di browser untuk streaming/download\n\n` +
                           `_© Mimosa Bot_`;
                
                await sock.sendMessage(m.key.remoteJid, {
                    text: msg,
                    contextInfo: {
                        externalAdReply: {
                            title: video.title.substring(0, 30),
                            body: `${duration} • ${views} views`,
                            thumbnailUrl: video.thumbnail_url,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: m });
                
                await m.react('⚠️');
                return;
            }
            
            // 5. Kirim video
            await sock.sendMessage(m.key.remoteJid, {
                video: videoBuffer,
                caption: toSmallCaps(`✅ *${video.title}*\n⏱️ ${duration} | 👁️ ${views} | 📦 ${fileSize}`),
                mimetype: 'video/mp4',
                contextInfo: {
                    externalAdReply: {
                        title: video.title.substring(0, 30),
                        body: `${duration} • ${views} views`,
                        thumbnailUrl: video.thumbnail_url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });
            
            await m.react('✅');
            
        } catch (e) {
            console.error('Download Error:', e);
            await m.react('❌');
            
            if (e.response?.status === 404) {
                m.reply(toSmallCaps(`❌ *Video tidak ditemukan!*\nID: ${text}`));
            } else if (e.response?.status === 302 || e.response?.status === 301) {
                // Redirect detected, kasih link
                m.reply(toSmallCaps(`⚠️ *Link memerlukan redirect*\n\nCoba buka: https://play.simplepaste.site/e/${text}\n\nLalu download manual.`));
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
    if (hours > 0) return `${hours} jam ${minutes} menit`;
    if (minutes > 0) return `${minutes} menit ${secs} detik`;
    return `${secs} detik`;
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}