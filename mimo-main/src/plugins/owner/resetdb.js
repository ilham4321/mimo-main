import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Group } from '../../database/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mimosaPath = path.join(__dirname, '../../mimosa.png');

const getThumbnail = () => {
    try {
        return fs.readFileSync(mimosaPath);
    } catch {
        return null;
    }
};

const newsletterConfig = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363369878409989@newsletter',
        serverMessageId: Math.floor(Math.random() * 1000),
        newsletterName: '✨ Mimosa Multi-Device »'
    }
};

export default {
    cmd: ['resetdb', 'cleardb', 'hapusdb'],
    tags: ['owner'],
    ownerOnly: true,

    run: async (sock, m, { args }) => {
        const thumbnail = getThumbnail();
        
        const action = args[0]?.toLowerCase();
        const confirm = args[1]?.toLowerCase();
        
        if (!action) {
            const userCount = await User.countDocuments();
            const groupCount = await Group.countDocuments();
            
            const text = `╭─────────────────┈ ⊹
│  🗑️ *R E S E T   D B* 🗑️
│
├─ ❏ 📊 *Statistik Database:*
│     👤 User: ${userCount}
│     👥 Group: ${groupCount}
│
├─ ❏ ⚠️ *Peringatan!*
│     Data yang dihapus TIDAK BISA
│     dikembalikan!
│
├─ ❏ 📝 *Cara Penggunaan:*
│     ├ ✦ .resetdb users
│     ├ ✦ .resetdb groups
│     ├ ✦ .resetdb all
│     └ ✦ .resetdb confirm
│
╰─────────────────┈ ⊹`;
            
            return sock.sendMessage(m.key.remoteJid, {
                text: text,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Reset Database',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        if (action === 'users' && confirm === 'confirm') {
            const count = await User.countDocuments();
            await User.deleteMany({});
            
            const text = `✅ *RESET USER BERHASIL!*

┌─────────────────────
│ 🗑️ ${count} data user telah dihapus
│
│ 💡 Bot akan membuat data baru
│    secara otomatis saat user
│    mengirim pesan.
└─────────────────────`;
            
            return sock.sendMessage(m.key.remoteJid, {
                text: text,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Reset Database Success',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        if (action === 'groups' && confirm === 'confirm') {
            const count = await Group.countDocuments();
            await Group.deleteMany({});
            
            const text = `✅ *RESET GRUP BERHASIL!*

┌─────────────────────
│ 🗑️ ${count} data grup telah dihapus
│
│ 💡 Bot akan membuat data baru
│    secara otomatis saat grup
│    mengirim pesan.
└─────────────────────`;
            
            return sock.sendMessage(m.key.remoteJid, {
                text: text,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Reset Database Success',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        if (action === 'all' && confirm === 'confirm') {
            const userCount = await User.countDocuments();
            const groupCount = await Group.countDocuments();
            
            await User.deleteMany({});
            await Group.deleteMany({});
            
            const text = `✅ *RESET SEMUA DATA BERHASIL!*

┌─────────────────────
│ 🗑️ Data yang dihapus:
│     👤 User: ${userCount}
│     👥 Group: ${groupCount}
│
│ 💡 Bot akan membuat data baru
│    secara otomatis saat digunakan.
└─────────────────────`;
            
            return sock.sendMessage(m.key.remoteJid, {
                text: text,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Reset Database Success',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        if (action === 'users' || action === 'groups' || action === 'all') {
            const target = action === 'all' ? 'SEMUA DATA' : action === 'users' ? 'USER' : 'GRUP';
            const userCount = await User.countDocuments();
            const groupCount = await Group.countDocuments();
            
            let stats = '';
            if (action === 'users') stats = `👤 User: ${userCount}`;
            else if (action === 'groups') stats = `👥 Group: ${groupCount}`;
            else stats = `👤 User: ${userCount}\n│     👥 Group: ${groupCount}`;
            
            const text = `⚠️ *KONFIRMASI HAPUS ${target}*

┌─────────────────────
│ Anda akan menghapus SEMUA data
│ ${target === 'SEMUA DATA' ? 'dari database!' : target.toLowerCase()}
│
│ 📊 *Statistik:*
│     ${stats}
│
│ ❗ Data yang dihapus TIDAK BISA
│    dikembalikan!
└─────────────────────

💡 *Ketik ulang perintah dengan 'confirm'*
Contoh: .resetdb ${action} confirm`;
            
            return sock.sendMessage(m.key.remoteJid, {
                text: text,
                contextInfo: {
                    ...newsletterConfig,
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Reset Database',
                        thumbnail: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fVerif });
        }
        
        await sock.sendMessage(m.key.remoteJid, { 
            text: `❌ *Format salah!*\n\n*Cara penggunaan:*\n.resetdb users\n.resetdb users confirm\n.resetdb groups\n.resetdb groups confirm\n.resetdb all\n.resetdb all confirm`,
            contextInfo: {
                ...newsletterConfig,
                externalAdReply: {
                    title: 'MIMOSA BOT',
                    body: 'Reset Database',
                    thumbnail: thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: global.fVerif });
    }
};