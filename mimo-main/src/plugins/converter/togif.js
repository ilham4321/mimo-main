import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

export default {
    cmd: ['togif', 'tovideo', 'tomp4'],
    tags: ['sticker'],
    limit: true,
    run: async (sock, m, { prefix, command }) => {
        
        if (!m.quoted) {
            return m.reply(`📌 *Cara Penggunaan:*\nReply stiker dengan perintah *${prefix + command}*\n\nContoh: ${prefix + command} (reply ke stiker)`);
        }

        const hasMedia = m.quoted.type === 'stickerMessage';
        
        if (!hasMedia) {
            return m.reply(`❌ *Format Salah!*\nHarap reply ke stiker.`);
        }

        await m.react('⏳');

        try {
            const mediaBuffer = await m.quoted.download();
            
            if (!mediaBuffer) {
                throw new Error('Gagal mendownload stiker');
            }

            const inputPath = path.join(tmpdir(), `input_${Date.now()}.webp`);
            const outputPath = path.join(tmpdir(), `output_${Date.now()}.mp4`);
            const frameDir = path.join(tmpdir(), `frames_${Date.now()}`);
            
            fs.writeFileSync(inputPath, mediaBuffer);
            fs.mkdirSync(frameDir, { recursive: true });
            
            // Extract frames dari webp
            try {
                await execAsync(`ffmpeg -i "${inputPath}" -vf "fps=10" "${frameDir}/frame-%04d.png" -y`);
            } catch (e) {
                console.log('Extract failed, trying with imagemagick');
                await execAsync(`convert "${inputPath}" -coalesce "${frameDir}/frame-%04d.png"`);
            }
            
            // Cek apakah ada frame yang terekstrak
            const frames = fs.readdirSync(frameDir).filter(f => f.endsWith('.png'));
            if (frames.length === 0) {
                throw new Error('Tidak ada frame yang terekstrak');
            }
            
            console.log(`Extracted ${frames.length} frames`);
            
            // Gabungkan frames ke video
            const isGif = command === 'togif';
            if (isGif) {
                await execAsync(`ffmpeg -framerate 10 -pattern_type glob -i "${frameDir}/*.png" -c:v libx264 -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${outputPath}" -y`);
            } else {
                await execAsync(`ffmpeg -framerate 10 -pattern_type glob -i "${frameDir}/*.png" -c:v libx264 -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${outputPath}" -y`);
            }
            
            const resultBuffer = fs.readFileSync(outputPath);
            
            // Cleanup
            fs.unlinkSync(inputPath);
            fs.rmSync(frameDir, { recursive: true, force: true });
            fs.unlinkSync(outputPath);

            if (isGif) {
                await sock.sendMessage(m.key.remoteJid, {
                    video: resultBuffer,
                    mimetype: 'video/mp4',
                    caption: '✅ Stiker ke GIF',
                    gifPlayback: true,
                    gifAttribution: Math.floor(Math.random() * 2) + 1
                }, { quoted: m });
            } else {
                await sock.sendMessage(m.key.remoteJid, {
                    video: resultBuffer,
                    mimetype: 'video/mp4',
                    caption: '✅ Stiker ke Video'
                }, { quoted: m });
            }

            await m.react('✅');

        } catch (error) {
            console.error('ToGIF error:', error);
            await m.react('❌');
            m.reply(`❌ *Gagal konversi stiker*\n\nStiker mungkin corrupt atau format tidak didukung.\nCoba stiker lain.`);
        }
    }
};
