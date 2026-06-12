import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';

/**
 * Upload file ke CloudSky (Sesuai Kode Milikmu)
 * @param {String} filePath - Lokasi file di server
 */
export async function CloudSky(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        
        // Deteksi Mime & Ext secara otomatis dari buffer
        const ftype = await fileTypeFromBuffer(buffer);
        const mimetype = ftype ? ftype.mime : 'application/octet-stream';
        const ext = ftype ? ftype.ext : 'bin';
        
        const fileKey = `mimosa-bot/${Date.now()}.${ext}`;
        const fileSize = buffer.length;

        // 1. Get Upload URL
        const presignResponse = await axios.post('https://api.cloudsky.biz.id/get-upload-url', {
            fileKey: fileKey,
            contentType: mimetype,
            fileSize: fileSize
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        const { uploadUrl } = presignResponse.data;
        if (!uploadUrl) throw new Error('No uploadUrl received from CloudSky API.');

        // 2. Upload File (PUT)
        await axios.put(uploadUrl, buffer, {
            headers: {
                'Content-Type': mimetype,
                'x-amz-server-side-encryption': 'AES256'
            }
        });

        return `https://api.cloudsky.biz.id/file?key=${fileKey}`;

    } catch (error) {
        throw new Error(`CloudSky Upload Error: ${error.message}`);
    }
}

/**
 * Upload file ke Catbox.moe
 * @param {String} filePath 
 */
export async function CatBox(filePath) {
    try {
        const fileStream = fs.createReadStream(filePath);
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', fileStream); // Form-data otomatis baca filename dari stream

        const { data } = await axios.post('https://catbox.moe/user/api.php', formData, {
            headers: {
                ...formData.getHeaders(),
                'User-Agent': 'Mozilla/5.0'
            }
        });
        return data;
    } catch (error) {
        throw new Error(`Catbox Upload Error: ${error.message}`);
    }
}

/**
 * Upload file ke Uguu.se
 * @param {String} filePath 
 */
export async function Uguu(filePath) {
    try {
        const fileStream = fs.createReadStream(filePath);
        const formData = new FormData();
        formData.append('files[]', fileStream);

        const { data } = await axios.post('https://uguu.se/upload.php', formData, {
            headers: {
                ...formData.getHeaders(),
                'User-Agent': 'Mozilla/5.0'
            }
        });
        return data.files[0].url;
    } catch (error) {
        throw new Error(`Uguu Upload Error: ${error.message}`);
    }
}

/**
 * Upload file ke Telegra.ph (Khusus Gambar)
 * @param {String} filePath 
 */
export async function TelegraPh(filePath) {
    try {
        const fileStream = fs.createReadStream(filePath);
        const formData = new FormData();
        formData.append('file', fileStream);

        const { data } = await axios.post('https://telegra.ph/upload', formData, {
            headers: { ...formData.getHeaders() }
        });
        
        if (data.error) throw new Error(data.error);
        return 'https://telegra.ph' + data[0].src;
    } catch (error) {
        throw new Error(`Telegraph Upload Error: ${error.message}`);
    }
}