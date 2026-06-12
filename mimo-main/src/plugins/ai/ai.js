import axios from 'axios';
import fs from 'fs';
import path from 'path';

export default {
    cmd: ['ai', 'gemini', 'chat'],
    tags: ['ai'],
    limit: true, 
    
    run: async (sock, m, { text, prefix, command }) => {
        // --- 1. LOAD GAMBAR LOKAL ---
        const thumbPath = path.join(process.cwd(), 'src', 'mimosa.png');
        let thumbBuffer;
        try {
            thumbBuffer = fs.readFileSync(thumbPath);
        } catch (e) {
            console.error("Gagal membaca src/mimosa.png, menggunakan fallback URL.");
            thumbBuffer = null;
        }

        // --- 2. CEK INPUT ---
        if (!text) {
            return sock.sendMessage(m.key.remoteJid, { 
                text: `❓ *Mau tanya apa?*\n\nContoh penggunaan:\n${prefix + command} Siapa itu Hamzz?` 
            }, { quoted: m });
        }

        // --- 3. REAKSI LOADING ---
        await sock.sendMessage(m.key.remoteJid, { react: { text: '🧠', key: m.key } });

        try {
            // --- 4. REQUEST API ---
            const apiUrl = 'https://api.siputzx.my.id/api/ai/gemini-lite';
            const response = await axios.get(apiUrl, {
                params: {
                    prompt: text,
                    model: 'gemini-2.0-flash-lite'
                }
            });

            const res = response.data;

            // --- 5. VALIDASI & KIRIM ---
            if (res.status && res.data && res.data.parts && res.data.parts.length > 0) {
                const aiResponse = res.data.parts[0].text;

                await sock.sendMessage(m.key.remoteJid, { 
                    text: `${aiResponse}`,
                    contextInfo: {
                        externalAdReply: {
                            title: "Mimosa AI",
                            body: "Powered by HamzzDev",
                            // --- SETTING THUMBNAIL LOKAL ---
                            thumbnail: thumbBuffer, 
                            thumbnailUrl: thumbBuffer ? undefined : "https://files.catbox.moe/2mq5qq.png",
                            
                            sourceUrl: "https://chat.whatsapp.com/II3jGhHyX322A81h8bmCqf?mode=gi_t",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: m });

                await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });

            } else {
                throw new Error('Format respon API tidak valid');
            }

        } catch (err) {
            console.error(err);
            await sock.sendMessage(m.key.remoteJid, { 
                text: '❌ Maaf, AI sedang sibuk. Coba lagi nanti.' 
            }, { quoted: m });
            
            await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
        }
    }
};