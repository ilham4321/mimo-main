import fs from 'fs';
import path from 'path';

export default {
    cmd: ['addf', 'adf'],
    tags: ['owner'],
    ownerOnly: true, // Keamanan: Hanya HamzzDev yang bisa akses

    run: async (sock, m, { text, prefix, command }) => {
        // 1. Validasi Input Path
        if (!text) return m.reply(`*Format Salah!*\n\nContoh: ${prefix + command} src/handler.js\n(Wajib reply pesan yang berisi kode baru)`);

        // 2. Validasi Reply (Kode Baru)
        const quotedText = m.quoted ? m.quoted.text : null;
        if (!quotedText) return m.reply('❌ Silakan reply pesan yang berisi kode/teks baru untuk dimasukkan ke file.');

        const filePath = path.resolve(process.cwd(), text);

        try {
            // 3. Cek apakah folder tujuan ada, jika tidak buat foldernya
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // 4. Proses Timpa File
            // Menulis ulang file dengan teks yang ada di reply (m.quoted.text)
            fs.writeFileSync(filePath, quotedText);

            await m.reply(`✅ *BERHASIL UPDATE FILE*\n\n📁 Lokasi: \`${text}\`\n✨ Status: Berhasil diganti & disimpan.`);
            
            // Catatan: Jika bot kamu menggunakan 'fs.watch' di index.js, 
            // maka bot akan otomatis mereload file yang baru saja diupdate ini.

        } catch (e) {
            console.error(e);
            m.reply(`❌ *GAGAL!*\nTerjadi kesalahan: ${e.message}`);
        }
    }
};