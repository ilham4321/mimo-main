import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { fileTypeFromBuffer } from 'file-type';

// Konfigurasi Hamzz Cloud
const HAMZZ_API_KEY = 'hk_98b17e926cbaa77b68d4caf3b509336078779e42e074f8bbd9487c797339b13f';
const HAMZZ_API_URL = 'https://hamzz-cloud.vercel.app/api/upload'\;

/**
 * Upload file/image ke Hamzz Cloud
 * @param {Buffer} buffer - File buffer
 * @param {string} expiry - Expiry time (5m, 1d, 7d, 30d, never)
 * @returns {Promise<{success: boolean, url: string, fileId: string, expiryMessage: string, fullUrl: string}>}
 */
async function uploadToHamzz(buffer, expiry = '7d') {
    return new Promise(async (resolve, reject) => {
        try {
            // Deteksi tipe file
            const fileType = await fileTypeFromBuffer(buffer);
            const ext = fileType?.ext || 'bin';
            const mimeType = fileType?.mime || 'application/octet-stream';
            
            // Buat file temporary
            const tempFilePath = path.join(tmpdir(), `hamzz_${Date.now()}.${ext}`);
            fs.writeFileSync(tempFilePath, buffer);
            
            // Cek ukuran file (max 50MB)
            const fileSize = fs.statSync(tempFilePath).size;
            const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
            
            if (fileSize > 50 * 1024 * 1024) {
                fs.unlinkSync(tempFilePath);
                return reject(new Error(`File terlalu besar! Maksimal 50MB, file Anda ${fileSizeMB}MB`));
            }
            
            // Siapkan form data
            const formData = new FormData();
            formData.append('file', fs.createReadStream(tempFilePath), { 
                filename: `file_${Date.now()}.${ext}` 
            });
            formData.append('expiry', expiry);
            
            // Upload ke Hamzz Cloud
            const response = await axios.post(HAMZZ_API_URL, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'x-api-key': HAMZZ_API_KEY
                },
                timeout: 120000
            });
            
            // Hapus file temporary
            fs.unlinkSync(tempFilePath);
            
            const result = response.data;
            
            if (!result.success) {
                return reject(new Error(result.error || 'Upload failed'));
            }
            
            const fullUrl = result.fullUrl || `https://hamzz-cloud.vercel.app/api/file/${result.fileId}`;
            
            resolve({
                success: true,
                url: fullUrl,
                fileId: result.fileId,
                expiryMessage: result.expiryMessage || `File akan expired dalam ${expiry}`,
                remainingQuota: result.remainingQuota,
                size: fileSizeMB,
                mimeType: mimeType,
                ext: ext
            });
            
        } catch (error) {
            console.error('Upload to Hamzz error:', error);
            if (error.response) {
                reject(new Error(error.response.data?.error || error.response.statusText));
            } else {
                reject(error);
            }
        }
    });
}

/**
 * Upload gambar ke Hamzz Cloud (alias uploadToHamzz)
 * @param {Buffer} buffer - Image buffer
 * @param {string} expiry - Expiry time
 * @returns {Promise<{success: boolean, url: string}>}
 */
async function uploadImage(buffer, expiry = '7d') {
    return uploadToHamzz(buffer, expiry);
}

/**
 * Upload file ke Hamzz Cloud (alias uploadToHamzz)
 * @param {Buffer} buffer - File buffer
 * @param {string} expiry - Expiry time
 * @returns {Promise<{success: boolean, url: string}>}
 */
async function uploadFile(buffer, expiry = '7d') {
    return uploadToHamzz(buffer, expiry);
}

export { uploadToHamzz, uploadImage, uploadFile };
