import fs from 'fs';
import path from 'path';

export default {
    cmd: ['getf', 'getfile'],
    tags: ['owner'],
    ownerOnly: true, // Keamanan: Hanya HamzzDev yang bisa mengambil file server

    run: async (sock, m, { text, prefix, command }) => {
        // 1. Validasi Input Path
        if (!text) return m.reply(`*Format Salah!*\n\nContoh: ${prefix + command} src/handler.js`);

        const filePath = path.resolve(process.cwd(), text);

        // 2. Cek apakah file tersebut benar-benar ada
        if (!fs.existsSync(filePath)) {
            return m.reply(`❌ *FILE TIDAK DITEMUKAN*\n\nPath: \`${text}\` tidak valid atau file tidak ada.`);
        }

        // 3. Cek apakah yang diambil adalah file (bukan folder)
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            return m.reply(`❌ *ERROR*\n\`${text}\` adalah sebuah folder. Fitur ini hanya untuk mengambil file tunggal.`);
        }

        try {
            // 4. Kirim File Berdasarkan Ukuran
            // Jika file teks dan ukurannya kecil, kirim sebagai pesan teks
            // Jika file besar atau biner (db/img), kirim sebagai dokumen
            const fileSizeMB = stats.size / (1024 * 1024);
            
            if (fileSizeMB > 50) {
                return m.reply(`❌ *FILE TERLALU BESAR*\nUkuran file: ${fileSizeMB.toFixed(2)} MB (Maksimal 50MB).`);
            }

            // Membaca file
            const fileBuffer = fs.readFileSync(filePath);

            await sock.sendMessage(m.key.remoteJid, {
                document: fileBuffer,
                mimetype: 'application/octet-stream',
                fileName: path.basename(filePath),
                caption: `✅ *BERHASIL MENGAMBIL FILE*\n\n📁 Path: \`${text}\`\n⚖️ Ukuran: ${fileSizeMB.toFixed(2)} MB`
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply(`❌ *GAGAL MENGAMBIL FILE*\nTerjadi kesalahan: ${e.message}`);
        }
    }
};