import fs from 'fs';
import path from 'path';

export default {
    cmd: ['addplugin', 'delplugin', 'getplugin', 'addp', 'delp', 'getp'],
    tags: ['owner'],
    ownerOnly: true, // WAJIB: Hanya owner yang boleh akses
    
    run: async (sock, m, { args, text, command, prefix }) => {
        // Tentukan lokasi root folder plugins
        const pluginDir = path.join(process.cwd(), 'src/plugins');

        // Argumen pertama harus nama file (misal: rpg/hunting.js)
        const fileName = args[0];

        if (!fileName) {
            return sock.sendMessage(m.key.remoteJid, { 
                text: `❌ Harap sertakan nama file/path!\n\nContoh:\n${prefix}addp rpg/test.js (sambil reply kode)\n${prefix}delp rpg/test.js\n${prefix}getp rpg/test.js` 
            }, { quoted: m });
        }

        const filePath = path.join(pluginDir, fileName);

        // --- ADD PLUGIN (Buat/Edit File) ---
        if (command === 'addplugin' || command === 'addp') {
            // Prioritas: Ambil kode dari pesan yang di-reply (quoted), kalau tidak ada baru dari text setelah nama file
            let code = m.quoted ? m.quoted.text : text.replace(fileName, '').trim();

            if (!code) {
                return sock.sendMessage(m.key.remoteJid, { text: '❌ Mana kodenya? Reply pesan script atau tulis langsung.' }, { quoted: m });
            }

            try {
                // Pastikan folder tujuan ada (misal user mau simpan di folder baru: 'event/baru.js')
                const folder = path.dirname(filePath);
                if (!fs.existsSync(folder)) {
                    fs.mkdirSync(folder, { recursive: true });
                }

                // Tulis file
                fs.writeFileSync(filePath, code);
                
                await sock.sendMessage(m.key.remoteJid, { 
                    text: `✅ *Sukses!*\nFile berhasil disimpan ke:\n📂 src/plugins/${fileName}\n\nSistem akan memuat ulang plugin secara otomatis dalam beberapa detik.` 
                }, { quoted: m });

            } catch (err) {
                console.error(err);
                await sock.sendMessage(m.key.remoteJid, { text: `❌ Gagal menyimpan: ${err.message}` }, { quoted: m });
            }
        }

        // --- DELETE PLUGIN (Hapus File) ---
        else if (command === 'delplugin' || command === 'delp') {
            try {
                if (!fs.existsSync(filePath)) {
                    return sock.sendMessage(m.key.remoteJid, { text: '❌ File tidak ditemukan di folder plugins.' }, { quoted: m });
                }

                fs.unlinkSync(filePath);
                
                await sock.sendMessage(m.key.remoteJid, { 
                    text: `🗑️ *Dihapus!*\nFile src/plugins/${fileName} telah dihapus selamanya.` 
                }, { quoted: m });

            } catch (err) {
                await sock.sendMessage(m.key.remoteJid, { text: `❌ Gagal menghapus: ${err.message}` }, { quoted: m });
            }
        }

        // --- GET PLUGIN (Ambil Kode) ---
        else if (command === 'getplugin' || command === 'getp') {
            try {
                if (!fs.existsSync(filePath)) {
                    return sock.sendMessage(m.key.remoteJid, { text: '❌ File tidak ditemukan.' }, { quoted: m });
                }

                const fileContent = fs.readFileSync(filePath, 'utf-8');
                
                await sock.sendMessage(m.key.remoteJid, { 
                    text: fileContent 
                }, { quoted: m });

            } catch (err) {
                await sock.sendMessage(m.key.remoteJid, { text: `❌ Gagal mengambil file: ${err.message}` }, { quoted: m });
            }
        }
    }
};
