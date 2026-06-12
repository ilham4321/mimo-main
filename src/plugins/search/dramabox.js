import { dramabox } from '../../lib/dramabox.js';

export default {
    cmd: ['drama', 'dramabox', 'dramaindo'],
    tags: ['search'],
    limit: true,
    run: async (sock, m, { prefix, command, args }) => {
        
        const subCommand = args[0]?.toLowerCase();
        
        // Help menu
        if (!subCommand || subCommand === 'help') {
            const helpText = `🎬 *DRAMABOX - DRAMA INDO*
            
┌──────────────────
│ 📌 *PERINTAH*
├──────────────────
│ 🔹 ${prefix}drama home
│    Lihat drama terbaru
│
│ 🔹 ${prefix}drama search <judul>
│    Cari drama
│
│ 🔹 ${prefix}drama detail <book_id>
│    Lihat detail drama
│
│ 🔹 ${prefix}drama watch <book_id> <episode>
│    Link streaming (buka di browser)
└──────────────────

📝 *Contoh:*
1️⃣ ${prefix}drama home
2️⃣ ${prefix}drama search cinta
3️⃣ ${prefix}drama detail 41000105764
4️⃣ ${prefix}drama watch 41000105764 1

💡 *Link watch bisa dibuka di browser HP*`;

            await sock.sendMessage(m.key.remoteJid, {
                text: helpText
            }, { quoted: m });
            return;
        }
        
        // Home - Latest with thumbnail
        if (subCommand === 'home') {
            await m.react('⏳');
            
            try {
                const result = await dramabox.home();
                
                if (!result.latest || result.latest.length === 0) {
                    return m.reply(`❌ Gagal mengambil data drama`);
                }
                
                // Kirim dengan thumbnail (kirim gambar + caption)
                for (let i = 0; i < Math.min(result.latest.length, 5); i++) {
                    const drama = result.latest[i];
                    const text = `🎬 *${drama.title}*
                    
📺 Episode: ${drama.episodes || '?'}
🆔 ID: ${drama.book_id}

📌 *Cek detail:* ${prefix}drama detail ${drama.book_id}`;
                    
                    if (drama.image && drama.image.startsWith('http')) {
                        await sock.sendMessage(m.key.remoteJid, {
                            image: { url: drama.image },
                            caption: text
                        }, { quoted: m });
                    } else {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: text
                        }, { quoted: m });
                    }
                    
                    // Delay biar tidak spam
                    await new Promise(r => setTimeout(r, 500));
                }
                
                await m.react('✅');
                
            } catch (error) {
                console.error('Drama home error:', error);
                await m.react('❌');
                m.reply(`❌ Gagal mengambil data: ${error.message}`);
            }
            return;
        }
        
        // Search drama with thumbnail
        if (subCommand === 'search') {
            const query = args.slice(1).join(' ');
            
            if (!query) {
                return m.reply(`📌 *Cara pakai:* ${prefix}drama search <judul>\nContoh: ${prefix}drama search cinta`);
            }
            
            await m.react('⏳');
            
            try {
                const results = await dramabox.search(query);
                
                if (results.length === 0) {
                    return m.reply(`🔍 Tidak ada hasil untuk "*${query}*"`);
                }
                
                // Kirim hasil dengan thumbnail
                for (let i = 0; i < Math.min(results.length, 5); i++) {
                    const drama = results[i];
                    const text = `🔍 *HASIL PENCARIAN: ${query}*
                    
🎬 *${drama.title}*
🆔 ID: ${drama.book_id}

📌 *Cek detail:* ${prefix}drama detail ${drama.book_id}`;
                    
                    if (drama.image && drama.image.startsWith('http')) {
                        await sock.sendMessage(m.key.remoteJid, {
                            image: { url: drama.image },
                            caption: text
                        }, { quoted: m });
                    } else {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: text
                        }, { quoted: m });
                    }
                    
                    await new Promise(r => setTimeout(r, 500));
                }
                
                if (results.length > 5) {
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `📌 *${results.length - 5} hasil lainnya...*\nGunakan *${prefix}drama detail <id>* untuk lihat detail`
                    }, { quoted: m });
                }
                
                await m.react('✅');
                
            } catch (error) {
                console.error('Drama search error:', error);
                await m.react('❌');
                m.reply(`❌ Gagal mencari: ${error.message}`);
            }
            return;
        }
        
        // Detail drama with thumbnail
        if (subCommand === 'detail') {
            const bookId = args[1];
            
            if (!bookId) {
                return m.reply(`📌 *Cara pakai:* ${prefix}drama detail <book_id>\nContoh: ${prefix}drama detail 41000105764`);
            }
            
            await m.react('⏳');
            
            try {
                const detail = await dramabox.detail(bookId);
                
                let episodeList = '';
                const episodeCount = Math.min(detail.episode_list.length, 15);
                for (let i = 0; i < episodeCount; i++) {
                    episodeList += `• Episode ${detail.episode_list[i].episode}\n`;
                }
                if (detail.episode_list.length > 15) {
                    episodeList += `• ... dan ${detail.episode_list.length - 15} episode lainnya\n`;
                }
                
                const text = `🎬 *${detail.title}*
                
📝 *Sinopsis:*
${detail.description?.substring(0, 300) || 'Tidak ada'}${detail.description?.length > 300 ? '...' : ''}

📊 *Statistik:*
├ 📺 Total Episode: ${detail.stats?.total_episodes || '-'}
└ 👥 Followers: ${detail.stats?.followers || '-'}

🎞️ *Daftar Episode:*
${episodeList || 'Tidak ada episode'}

📌 *Tonton:* ${prefix}drama watch ${bookId} <episode>`;

                if (detail.thumbnail && detail.thumbnail.startsWith('http')) {
                    await sock.sendMessage(m.key.remoteJid, {
                        image: { url: detail.thumbnail },
                        caption: text
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(m.key.remoteJid, {
                        text: text
                    }, { quoted: m });
                }
                
                await m.react('✅');
                
            } catch (error) {
                console.error('Drama detail error:', error);
                await m.react('❌');
                m.reply(`❌ Gagal mengambil detail: ${error.message}`);
            }
            return;
        }
        
        // Watch - BUKA DI BROWSER
        if (subCommand === 'watch' || subCommand === 'stream') {
            const bookId = args[1];
            const episode = parseInt(args[2]);
            
            if (!bookId || isNaN(episode)) {
                return m.reply(`📌 *Cara pakai:* ${prefix}drama watch <book_id> <episode>\nContoh: ${prefix}drama watch 41000105764 1`);
            }
            
            await m.react('⏳');
            
            try {
                // Ambil thumbnail dulu untuk preview
                let detail = null;
                try {
                    detail = await dramabox.detail(bookId);
                } catch (e) {
                    // Abaikan error detail
                }
                
                const watchUrl = `https://www.dramabox.com/in/drama/${bookId}?ep=${episode}`;
                
                const text = `🎬 *WATCH DRAMA*
                
📺 *Episode ${episode}*

🔗 *Buka di browser:*
${watchUrl}

💡 *Cara menonton:*
1. Copy link di atas
2. Buka di browser Chrome/Safari
3. Tunggu video loading

📌 *Catatan:* Link hanya bisa diputar di browser`;

                if (detail?.thumbnail && detail.thumbnail.startsWith('http')) {
                    await sock.sendMessage(m.key.remoteJid, {
                        image: { url: detail.thumbnail },
                        caption: text
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(m.key.remoteJid, {
                        text: text
                    }, { quoted: m });
                }
                
                await m.react('✅');
                
            } catch (error) {
                console.error('Drama watch error:', error);
                await m.react('❌');
                m.reply(`❌ Gagal: ${error.message}`);
            }
            return;
        }
        
        // Fallback
        return m.reply(`📌 *Perintah tidak dikenal*\nKetik *${prefix}drama help* untuk bantuan`);
    }
};