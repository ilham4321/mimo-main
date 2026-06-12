import { promises as fs } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { tmpdir } from 'os';
import { fileTypeFromBuffer } from 'file-type';
import webp from 'node-webpmux';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');
const tmpDir = join(__dirname, '../tmp');

import { existsSync, mkdirSync } from 'fs';
if (!existsSync(tmpDir)) {
    mkdirSync(tmpDir, { recursive: true });
}

// ==================== FFMPEG BASIC ====================
function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
    return new Promise(async (resolve, reject) => {
        let tmp = null;
        let out = null;
        try {
            tmp = join(tmpDir, +new Date() + '.' + ext);
            out = tmp + '.' + ext2;
            await fs.writeFile(tmp, buffer);
            
            const ffmpegProcess = spawn('ffmpeg', [
                '-y',
                '-i', tmp,
                ...args,
                out
            ]);
            
            ffmpegProcess.on('error', (err) => {
                console.error('FFmpeg spawn error:', err);
                reject(err);
            });
            
            ffmpegProcess.on('close', async (code) => {
                try {
                    if (tmp && await fs.access(tmp).then(() => true).catch(() => false)) {
                        await fs.unlink(tmp).catch(() => {});
                    }
                    if (code !== 0) {
                        reject(new Error(`FFmpeg exited with code ${code}`));
                        return;
                    }
                    const data = await fs.readFile(out);
                    if (out && await fs.access(out).then(() => true).catch(() => false)) {
                        await fs.unlink(out).catch(() => {});
                    }
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            });
        } catch (e) {
            if (tmp && await fs.access(tmp).then(() => true).catch(() => false)) {
                await fs.unlink(tmp).catch(() => {});
            }
            if (out && await fs.access(out).then(() => true).catch(() => false)) {
                await fs.unlink(out).catch(() => {});
            }
            reject(e);
        }
    });
}

// ==================== AUDIO CONVERTER ====================
function toPTT(buffer, ext) {
    return ffmpeg(buffer, [
        '-vn',
        '-c:a', 'libopus',
        '-b:a', '128k',
        '-vbr', 'on',
    ], ext, 'ogg');
}

function toAudio(buffer, ext) {
    return ffmpeg(buffer, [
        '-vn',
        '-c:a', 'libopus',
        '-b:a', '128k',
        '-vbr', 'on',
        '-compression_level', '10'
    ], ext, 'opus');
}

function toMP3(buffer, ext) {
    return ffmpeg(buffer, [
        '-vn',
        '-c:a', 'libmp3lame',
        '-b:a', '128k',
    ], ext, 'mp3');
}

// ==================== VIDEO CONVERTER ====================
function toVideo(buffer, ext) {
    return ffmpeg(buffer, [
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-ab', '128k',
        '-ar', '44100',
        '-crf', '32',
        '-preset', 'slow'
    ], ext, 'mp4');
}

function compressVideo(buffer, resolution = '854:480') {
    return ffmpeg(buffer, [
        '-vf', `scale=${resolution}`,
        '-c:v', 'libx264',
        '-crf', '28',
        '-preset', 'fast',
        '-c:a', 'aac',
        '-b:a', '96k'
    ], 'mp4', 'mp4');
}

// ==================== STICKER CONVERTER ====================
async function imageToWebp(buffer) {
    return ffmpeg(buffer, [
        '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
        '-vcodec', 'libwebp'
    ], 'jpg', 'webp');
}

async function videoToWebp(buffer) {
    return ffmpeg(buffer, [
        '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
        '-vcodec', 'libwebp',
        '-loop', '0',
        '-ss', '00:00:00',
        '-t', '00:00:05',
        '-preset', 'default',
        '-an',
        '-vsync', '0'
    ], 'mp4', 'webp');
}

async function addExif(webpSticker, packname, author, categories = ['✨']) {
    const img = new webp.Image();
    const stickerPackId = crypto.randomBytes(32).toString('hex');
    const json = {
        'sticker-pack-id': stickerPackId,
        'sticker-pack-name': packname,
        'sticker-pack-publisher': author,
        'emojis': categories
    };
    let exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    let jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    let exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    await img.load(webpSticker);
    img.exif = exif;
    return await img.save(null);
}

async function sticker(buffer, packname, author, isVideo = false) {
    let webpBuffer;
    if (isVideo) {
        webpBuffer = await videoToWebp(buffer);
    } else {
        webpBuffer = await imageToWebp(buffer);
    }
    return await addExif(webpBuffer, packname, author);
}

// ==================== WEBP TO MP4/GIF (Support Animated) ====================
async function webpToMp4(webpBuffer) {
    try {
        console.log('Converting webp to mp4, buffer size:', webpBuffer.length);
        
        // Deteksi apakah animated webp (cek header ANIM)
        const hexHeader = webpBuffer.toString('hex', 0, 20);
        const isAnimated = hexHeader.includes('414e494d'); // 'ANIM' in hex
        console.log('Is animated webp:', isAnimated);
        
        const args = [
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=15'
        ];
        
        const result = await ffmpeg(webpBuffer, args, 'webp', 'mp4');
        console.log('Conversion success, result size:', result.length);
        return result;
    } catch (err) {
        console.error('webpToMp4 error:', err);
        throw err;
    }
}

async function webpToGif(webpBuffer) {
    try {
        console.log('Converting webp to gif, buffer size:', webpBuffer.length);
        
        // Deteksi apakah animated webp
        const hexHeader = webpBuffer.toString('hex', 0, 20);
        const isAnimated = hexHeader.includes('414e494d');
        console.log('Is animated webp:', isAnimated);
        
        const args = [
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=10',
            '-loop', '0'
        ];
        
        const result = await ffmpeg(webpBuffer, args, 'webp', 'gif');
        console.log('Conversion success, result size:', result.length);
        return result;
    } catch (err) {
        console.error('webpToGif error:', err);
        throw err;
    }
}
// Di dalam converter.js, tambahkan fungsi ini

// ==================== WEBP TO IMAGE (PNG/JPG) ====================
async function webpToImage(webpBuffer, format = 'png') {
    try {
        console.log('Converting webp to image, buffer size:', webpBuffer.length);
        
        // Deteksi apakah animated webp
        const hexHeader = webpBuffer.toString('hex', 0, 20);
        const isAnimated = hexHeader.includes('414e494d');
        console.log('Is animated webp:', isAnimated);
        
        const args = [
            '-vframes', '1',      // Ambil frame pertama
            '-q:v', '2'           // Kualitas tinggi
        ];
        
        const result = await ffmpeg(webpBuffer, args, 'webp', format);
        console.log('Conversion success, result size:', result.length);
        return result;
    } catch (err) {
        console.error('webpToImage error:', err);
        throw err;
    }
}

export {
    // Audio
    toPTT,
    toAudio,
    toMP3,
    // Video
    toVideo,
    compressVideo,
    ffmpeg,
    // Sticker
    imageToWebp,
    videoToWebp,
    addExif,
    sticker,
    // Webp to MP4/GIF
    webpToMp4,
    webpToGif,
    webpToImage
};

// Auto reload
const file = fileURLToPath(import.meta.url);
import { watchFile, unwatchFile } from 'fs';
watchFile(file, () => {
    unwatchFile(file);
    console.log(chalk.bgGreen(chalk.black("[ UPDATE ]")), chalk.white(`converter.js`));
});
