import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import JavaScriptObfuscator from 'javascript-obfuscator';

export default {
    cmd: ['backup', 'bkp'],
    tags: ['owner'],
    ownerOnly: true,

    run: async (sock, m, { args }) => {
        const isEnc = args[0] && args[0].toLowerCase() === 'enc';
        
        // --- DAFTAR BLACKLIST (PASTI DIBUANG) ---
        // Kita blacklist folder-folder berat yang tidak perlu dibackup
        const ignoreList = [
            'node_modules', 
            '.git', 
            'sessions',      // Folder sesi login (jangan disebar)
            'session',       // Jaga-jaga kalau namanya session
            'auth',          // Jaga-jaga kalau namanya auth
            'tmp',           // Folder sampah sementara
            'package-lock.json', 
            'yarn.lock',
            'backup.zip',
            '.npm',
            '.cache',
            '.config'
        ];

        await sock.sendMessage(m.key.remoteJid, { 
            text: `⏳ *Memproses Backup ${isEnc ? '(Encrypted)' : '(Original)'}...*\nSedang memilah file penting, mohon tunggu...` 
        }, { quoted: m });

        const rootDir = process.cwd();
        const dateStr = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const backupName = `Mimosa_V7_${isEnc ? 'ENC' : 'SRC'}_${dateStr}`;
        
        // Folder temp khusus untuk proses ini
        const tempDir = path.join(rootDir, 'tmp', backupName);
        const zipPath = path.join(rootDir, 'tmp', `${backupName}.zip`);

        // Bersihkan temp lama jika ada
        if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
        fs.mkdirSync(tempDir, { recursive: true });

        try {
            // --- 1. PROSES COPY & FILTER ---
            // Kita jalan recursive manual agar kontrol penuh
            await recursiveCopy(rootDir, tempDir, ignoreList, isEnc);

            // --- 2. COMPRESS TO ZIP ---
            await zipDirectory(tempDir, zipPath);

            // --- 3. CEK UKURAN ---
            const stats = fs.statSync(zipPath);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            const sizeKB = (stats.size / 1024).toFixed(2);
            const finalSize = stats.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

            // --- 4. KIRIM HASIL ---
            await sock.sendMessage(m.key.remoteJid, { 
                document: fs.readFileSync(zipPath), 
                mimetype: 'application/zip',
                fileName: `${backupName}.zip`,
                caption: `✅ *BACKUP SELESAI*\n\n📁 Tipe: ${isEnc ? 'Encrypted (Susah Dibaca)' : 'Source Code Asli'}\n📦 Ukuran: ${finalSize}\n🛡️ Aman dari node_modules & session.`
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Gagal: ${err.message}` }, { quoted: m });
        } finally {
            // --- 5. BERSIH-BERSIH ---
            try {
                // Hapus folder temp & file zip setelah dikirim agar server bersih
                if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
                if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
            } catch (e) { console.error('Cleanup error:', e) }
        }
    }
};

// --- LOGIKA COPY PINTAR ---
async function recursiveCopy(src, dest, ignoreList, isEnc) {
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        // 1. Cek apakah file/folder ini ada di daftar ignore?
        if (ignoreList.includes(entry.name)) continue;
        
        // 2. Cek apakah ini file hidden (.env, .gitignore) -> Skip jika perlu
        // Tapi .env biasanya butuh dicopy (tergantung preferensi, disini kita copy)
        // if (entry.name.startsWith('.')) continue; 

        if (entry.isDirectory()) {
            // Buat folder di tujuan
            if (!fs.existsSync(destPath)) fs.mkdirSync(destPath);
            // Masuk ke dalam (Recursive)
            await recursiveCopy(srcPath, destPath, ignoreList, isEnc);
        } else {
            // Ini File
            // Jika mode ENC aktif dan ini file .js (kecuali config/setting)
            // config.js jangan di-enc parah agar user masih bisa edit owner
            if (isEnc && entry.name.endsWith('.js') && entry.name !== 'config.js') {
                try {
                    const code = fs.readFileSync(srcPath, 'utf8');
                    // Obfuscation Level: Medium
                    const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
                        compact: true,
                        controlFlowFlattening: true,
                        target: 'node',
                        stringArray: true,
                        stringArrayEncoding: ['rc4'], // Bikin string jadi kode aneh
                        splitStrings: true
                    });
                    fs.writeFileSync(destPath, obfuscationResult.getObfuscatedCode());
                } catch (e) {
                    // Fallback copy biasa jika error
                    fs.copyFileSync(srcPath, destPath);
                }
            } else {
                // Copy Biasa (Json, Gambar, HTML, atau config.js)
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
}

// --- ZIPPER FUNCTION ---
function zipDirectory(source, out) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(out);

    return new Promise((resolve, reject) => {
        archive
            .directory(source, false)
            .on('error', err => reject(err))
            .pipe(stream);

        stream.on('close', () => resolve());
        archive.finalize();
    });
}