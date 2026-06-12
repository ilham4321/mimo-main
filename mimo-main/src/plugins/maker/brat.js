import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import webpmux from 'node-webpmux'; // Wajib install: npm install node-webpmux

export default {
    cmd: ['brat'],
    tags: ['maker'],
    limit: true,

    run: async (sock, m, { text, prefix, command }) => {
        // --- CONFIG PACKNAME (Bisa diganti sesuka hati) ---
        const packname = "Mimosa Bot";
        const author = "HamzzDev";

        if (!text) {
            return sock.sendMessage(m.key.remoteJid, { 
                text: `❓ *Mau nulis apa?*\n\nContoh:\n${prefix + command} hallo dunia` 
            }, { quoted: m });
        }

        await sock.sendMessage(m.key.remoteJid, { react: { text: '⏳', key: m.key } });

        const tempPng = path.join(process.cwd(), 'tmp', `brat_${Date.now()}.png`);
        const tempWebp = path.join(process.cwd(), 'tmp', `brat_${Date.now()}.webp`);
        const tempExif = path.join(process.cwd(), 'tmp', `brat_${Date.now()}_exif.webp`);

        // Buat folder tmp jika belum ada
        if (!fs.existsSync(path.join(process.cwd(), 'tmp'))) {
            fs.mkdirSync(path.join(process.cwd(), 'tmp'));
        }

        try {
            // 1. Download Gambar
            const apiUrl = `https://www.ditss.biz.id/api/maker/brat?text=${encodeURIComponent(text)}`;
            const response = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            // Cek Error JSON
            try {
                const jsonCheck = JSON.parse(response.data.toString());
                if (jsonCheck.message) throw new Error(jsonCheck.message);
            } catch (e) {}

            fs.writeFileSync(tempPng, response.data);

            // 2. Convert ke WebP (512x512)
            // Penting: Resize ke 512x512 agar valid stiker WA
            exec(`ffmpeg -i "${tempPng}" -vcodec libwebp -filter:v fps=fps=20 -lossless 1 -loop 0 -preset default -an -vsync 0 -s 512x512 "${tempWebp}"`, async (err) => {
                
                if (fs.existsSync(tempPng)) fs.unlinkSync(tempPng); // Hapus PNG

                if (err) {
                    console.error('FFMPEG Error:', err);
                    return sock.sendMessage(m.key.remoteJid, { text: '❌ Gagal convert gambar.' }, { quoted: m });
                }

                // 3. Tambahkan Metadata (Exif)
                try {
                    await addExif(tempWebp, tempExif, packname, author);
                    
                    // Kirim Hasil Akhir
                    await sock.sendMessage(m.key.remoteJid, { 
                        sticker: fs.readFileSync(tempExif) 
                    }, { quoted: m });

                    // Cleanup
                    if (fs.existsSync(tempWebp)) fs.unlinkSync(tempWebp);
                    if (fs.existsSync(tempExif)) fs.unlinkSync(tempExif);
                    
                    await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });

                } catch (e) {
                    console.error('Exif Error:', e);
                    // Fallback: Kirim polosan jika exif gagal
                    await sock.sendMessage(m.key.remoteJid, { sticker: fs.readFileSync(tempWebp) }, { quoted: m });
                }
            });

        } catch (err) {
            console.error(err);
            if (fs.existsSync(tempPng)) fs.unlinkSync(tempPng);
            if (fs.existsSync(tempWebp)) fs.unlinkSync(tempWebp);
            await sock.sendMessage(m.key.remoteJid, { text: '❌ Server sedang sibuk.' }, { quoted: m });
        }
    }
};

// --- FUNGSI EXIF YANG SUDAH DIPERBAIKI ---
async function addExif(input, output, packname, author) {
    const json = { 
        "sticker-pack-id": "com.mimosa.tech", 
        "sticker-pack-name": packname, 
        "sticker-pack-publisher": author, 
        "emojis": ["🤖", "✨"] 
    };

    const img = new webpmux.Image();
    await img.load(input);

    // 1. Buat Buffer Header Exif (Little Endian)
    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    
    // 2. HITUNG PANJANG DATA (Ini yg kemarin salah)
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUInt32LE(jsonBuff.length, 14); // Tulis panjang data di byte ke-14

    img.exif = exif;
    await img.save(output);
}