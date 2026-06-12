import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { fileTypeFromBuffer } from 'file-type';

// Konfigurasi Hamzz Cloud
const HAMZZ_API_KEY = 'hk_98b17e926cbaa77b68d4caf3b509336078779e42e074f8bbd9487c797339b13f';
const HAMZZ_API_URL = 'https://hamzz-cloud.vercel.app/api/upload';

export default {
    cmd: ['tourl', 'upload', 'hamzz'],
    tags: ['uploader'],
    limit: true,
    run: async (sock, m, { prefix, command }) => {
        
        if (!m.quoted) {
            return m.reply(`📌 *Cara Penggunaan:*\nReply gambar/video/dokumen dengan perintah *${prefix + command}*\n\nContoh: ${prefix + command} (reply ke media)`);
        }

        const mediaTypes = ['imageMessage', 'videoMessage', 'documentMessage', 'audioMessage', 'stickerMessage'];
        const hasMedia = mediaTypes.includes(m.quoted.type);
        
        if (!hasMedia) {
            return m.reply(`❌ *Format Salah!*\nHarap reply ke gambar, video, dokumen, audio, atau stiker.`);
        }

        await m.react('⏳');

        try {
            const mediaBuffer = await m.quoted.download();
            
            if (!mediaBuffer) {
                throw new Error('Gagal mendownload media');
            }

            // Deteksi tipe file
            const fileType = await fileTypeFromBuffer(mediaBuffer);
            const ext = fileType?.ext || 'bin';
            const mimeType = fileType?.mime || 'application/octet-stream';
            
            // Dapatkan nama file asli
            let originalName = `file_${Date.now()}.${ext}`;
            if (m.quoted.msg?.fileName) {
                originalName = m.quoted.msg.fileName;
            } else if (m.quoted.type === 'stickerMessage') {
                originalName = `sticker_${Date.now()}.webp`;
            }
            
            // Simpan ke file temporary
            const tempFilePath = path.join(tmpdir(), `hamzz_${Date.now()}.${ext}`);
            fs.writeFileSync(tempFilePath, mediaBuffer);
            
            // Hitung ukuran file
            const fileSize = fs.statSync(tempFilePath).size;
            const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
            
            // Cek ukuran file (max 50MB)
            if (fileSize > 50 * 1024 * 1024) {
                fs.unlinkSync(tempFilePath);
                return m.reply(`❌ *File terlalu besar!*\nMaksimal 50MB, file Anda ${fileSizeMB}MB`);
            }

            // Upload ke Hamzz Cloud
            const formData = new FormData();
            formData.append('file', fs.createReadStream(tempFilePath), { filename: originalName });
            formData.append('expiry', '7d');

            const response = await axios.post(HAMZZ_API_URL, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'x-api-key': HAMZZ_API_KEY
                },
                timeout: 120000
            });

            const result = response.data;
            
            if (!result.success) {
                throw new Error(result.error || 'Upload failed');
            }

            const fullUrl = result.fullUrl || `https://hamzz-cloud.vercel.app/api/file/${result.fileId}`;
            const expiryMessage = result.expiryMessage || 'File akan expired dalam 7 hari';

            // Icon berdasarkan tipe
            let fileIcon = '📄';
            if (mimeType.startsWith('image/')) fileIcon = '🖼️';
            else if (mimeType.startsWith('video/')) fileIcon = '🎥';
            else if (mimeType.startsWith('audio/')) fileIcon = '🎵';
            else if (mimeType === 'application/pdf') fileIcon = '📑';
            else if (ext === 'webp') fileIcon = '🏷️';
            
            const successMessage = `${fileIcon} *Hamzz Cloud Uploader*
            
📁 *Nama:* ${originalName}
📏 *Ukuran:* ${fileSizeMB} MB
📱 *Tipe:* ${mimeType}
⏱️ *Expiry:* ${expiryMessage}

🔗 *URL:* ${fullUrl}

> Powered by Hamzz Cloud | Mimosa Bot`;

            await sock.sendMessage(m.key.remoteJid, {
                text: successMessage
            }, { quoted: m });

            await m.react('✅');
            
            // Hapus file temporary
            fs.unlinkSync(tempFilePath);

        } catch (error) {
            console.error('Upload error:', error);
            await m.react('❌');
            
            let errorMsg = error.message;
            if (error.response) {
                errorMsg = error.response.data?.error || error.response.statusText;
            }
            
            m.reply(`❌ *Upload Gagal ke Hamzz Cloud*\n\nDetail: ${errorMsg}\n\nCoba lagi nanti.`);
        }
    }
};