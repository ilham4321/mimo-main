import fs from 'fs';
import path from 'path';
import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['lp','fitur'],
    tags: ['general'],
    run: async (sock, m, { prefix }) => {
        await m.react('⏳');

        // --- 1. SETUP GAMBAR LOKAL ---
        // Mengambil gambar dari src/mimosa.png sesuai instruksi
        const thumbPath = path.join(process.cwd(), 'src', 'mimosa.png');
        let thumbBuffer;

        try {
            thumbBuffer = fs.readFileSync(thumbPath);
        } catch (err) {
            console.error("Gambar lokal src/mimosa.png tidak ditemukan.");
            thumbBuffer = null; 
        }

        try {
            // 2. AMBIL SEMUA PLUGINS
            const plugins = Object.values(global.plugins);
            const tags = {};

            // 3. KELOMPOKKAN BERDASARKAN TAG
            plugins.forEach(p => {
                if (p.tags && p.tags.length > 0) {
                    p.tags.forEach(t => {
                        if (!tags[t]) tags[t] = [];
                        const commandName = Array.isArray(p.cmd) ? p.cmd[0] : p.cmd;
                        if (commandName) tags[t].push(commandName);
                    });
                }
            });

            // 4. SUSUN TEKS DAFTAR FITUR (SMALLCAPS)
            const availableTags = Object.keys(tags).sort();
            let caption = `📂 *${toSmallCaps('mimosa feature list')}*\n\n`;
            caption += `${toSmallCaps('total kategori')} : ${availableTags.length}\n`;
            caption += `${toSmallCaps('total fitur')} : ${plugins.length}\n\n`;

            availableTags.forEach(tag => {
                caption += `┌  📂 *${toSmallCaps(tag.toUpperCase())}*\n`;
                const sortedCmds = tags[tag].sort();
                sortedCmds.forEach((cmd, i) => {
                    const isLast = i === sortedCmds.length - 1;
                    caption += `${isLast ? '└' : '│'}  ◦ ${prefix}${cmd}\n`;
                });
                caption += `\n`;
            });

            caption += `*_© ${toSmallCaps('mimosa multi-device')}_*`;

            // 5. KIRIM PESAN DENGAN GAMBAR LOKAL
            await sock.sendMessage(m.key.remoteJid, {
                text: caption,
                contextInfo: {
                    externalAdReply: {
                        title: toSmallCaps("mimosa dashboard"),
                        body: "simple. fast. secure.",
                        // Selalu gunakan buffer gambar lokal
                        thumbnail: thumbBuffer,
                        sourceUrl: "https://whatsapp.com/channel/0029VaFqS8I5Ui2TjO7d9W2L",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

            await m.react('✅');

        } catch (e) {
            console.error(e);
            await m.react('❌');
            m.reply(toSmallCaps(`❌ terjadi kesalahan: ${e.message}`));
        }
    }
};