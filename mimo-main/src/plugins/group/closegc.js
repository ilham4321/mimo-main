import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mimosaPath = path.join(__dirname, '../../mimosa.png');

const getThumbnail = () => {
    try {
        return fs.readFileSync(mimosaPath);
    } catch {
        return null;
    }
};

// Map untuk menyimpan interval per grup (opsional)
const autoOpenIntervals = new Map();

export default {
    cmd: ['closegc', 'opengc', 'tutupgc', 'bukagc'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,

    run: async (sock, m, { command, args }) => {
        const { Group } = await import('../../database/schema.js');
        const groupId = m.key.remoteJid;
        const thumbnail = getThumbnail();
        
        let groupData = await Group.findOne({ id: groupId });
        if (!groupData) {
            groupData = new Group({ id: groupId });
            await groupData.save();
        }
        
        const isClose = command === 'closegc' || command === 'tutupgc';
        const isOpen = command === 'opengc' || command === 'bukagc';
        
        // BUKA GRUP
        if (isOpen) {
            try {
                // Hapus interval jika ada
                if (autoOpenIntervals.has(groupId)) {
                    clearInterval(autoOpenIntervals.get(groupId));
                    autoOpenIntervals.delete(groupId);
                }
                
                await sock.groupSettingUpdate(groupId, "not_announcement");
                
                groupData.isClosed = false;
                groupData.closeUntil = null;
                await groupData.save();
                
                const groupMetadata = await sock.groupMetadata(groupId);
                const allMembers = groupMetadata.participants.map(p => p.id);
                
                await sock.sendMessage(groupId, { 
                    text: `🔓 *GRUP DIBUKA!*\n\n┌─❖\n│ Semua anggota sekarang bisa\n│ mengirim pesan kembali.\n╰─────────────────`,
                    mentions: allMembers,
                    contextInfo: {
                        externalAdReply: {
                            title: 'MIMOSA BOT',
                            body: 'Group Opened',
                            thumbnail: thumbnail,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: global.fkon });
                
            } catch (err) {
                m.reply(`❌ *Gagal membuka grup!*\n\nError: ${err.message}`);
            }
            return;
        }
        
        // TUTUP GRUP
        if (isClose) {
            try {
                let duration = 0;
                let durationText = '';
                
                if (args[0]) {
                    const timeValue = parseInt(args[0]);
                    const timeUnit = args[0].replace(/[0-9]/g, '').toLowerCase() || 'm';
                    
                    if (isNaN(timeValue)) {
                        return m.reply('❌ Format durasi salah!\n\n*Contoh:*\n.closegc 5m  (5 menit)\n.closegc 30d (30 detik)\n.closegc 1j  (1 jam)\n.closegc 1h  (1 hari)');
                    }
                    
                    if (timeUnit === 'd' || timeUnit === 'detik') {
                        duration = timeValue * 1000;
                        durationText = `${timeValue} detik`;
                    } else if (timeUnit === 'm' || timeUnit === 'menit') {
                        duration = timeValue * 60 * 1000;
                        durationText = `${timeValue} menit`;
                    } else if (timeUnit === 'j' || timeUnit === 'jam') {
                        duration = timeValue * 60 * 60 * 1000;
                        durationText = `${timeValue} jam`;
                    } else if (timeUnit === 'h' || timeUnit === 'hari') {
                        duration = timeValue * 24 * 60 * 60 * 1000;
                        durationText = `${timeValue} hari`;
                    } else {
                        return m.reply('❌ Unit waktu tidak dikenal!\n\nGunakan: d (detik), m (menit), j (jam), h (hari)');
                    }
                }
                
                await sock.groupSettingUpdate(groupId, "announcement");
                
                const closeUntil = duration > 0 ? Date.now() + duration : null;
                
                groupData.isClosed = true;
                groupData.closeUntil = closeUntil;
                await groupData.save();
                
                // Hapus interval lama jika ada
                if (autoOpenIntervals.has(groupId)) {
                    clearInterval(autoOpenIntervals.get(groupId));
                    autoOpenIntervals.delete(groupId);
                }
                
                // Buat interval baru untuk pengecekan (setiap 5 detik)
                if (duration > 0) {
                    const interval = setInterval(async () => {
                        try {
                            const currentGroup = await Group.findOne({ id: groupId });
                            if (currentGroup && currentGroup.isClosed && currentGroup.closeUntil && currentGroup.closeUntil <= Date.now()) {
                                console.log(`[AUTO OPEN] Membuka grup ${groupId} via interval`);
                                
                                await sock.groupSettingUpdate(groupId, "not_announcement");
                                
                                currentGroup.isClosed = false;
                                currentGroup.closeUntil = null;
                                await currentGroup.save();
                                
                                // Hapus interval setelah berhasil
                                if (autoOpenIntervals.has(groupId)) {
                                    clearInterval(autoOpenIntervals.get(groupId));
                                    autoOpenIntervals.delete(groupId);
                                }
                                
                                const groupMetadata = await sock.groupMetadata(groupId);
                                const allMembers = groupMetadata.participants.map(p => p.id);
                                
                                await sock.sendMessage(groupId, { 
                                    text: `🔓 *GRUP TERBUKA OTOMATIS!*\n\n┌─❖\n│ Waktu penutupan telah habis.\n│ Semua anggota bisa chat kembali.\n╰─────────────────`,
                                    mentions: allMembers,
                                    contextInfo: {
                                        externalAdReply: {
                                            title: 'MIMOSA BOT',
                                            body: 'Auto Opened',
                                            thumbnail: thumbnail,
                                            mediaType: 1,
                                            renderLargerThumbnail: true
                                        }
                                    }
                                }, { quoted: global.fkon });
                            }
                        } catch (err) {
                            console.error('[AUTO OPEN INTERVAL ERROR]', err);
                        }
                    }, 5000); // Cek setiap 5 detik
                    
                    autoOpenIntervals.set(groupId, interval);
                }
                
                const groupMetadata = await sock.groupMetadata(groupId);
                const allMembers = groupMetadata.participants.map(p => p.id);
                
                let text = `🔒 *GRUP DITUTUP!*\n\n┌─❖\n│ Sekarang HANYA ADMIN yang\n│ bisa mengirim pesan.\n│\n├─❖\n│ *Untuk membuka kembali:*\n│ └─ .opengc\n`;
                
                if (duration > 0) {
                    const bukaJam = new Date(Date.now() + duration);
                    const jam = bukaJam.getHours().toString().padStart(2, '0');
                    const menit = bukaJam.getMinutes().toString().padStart(2, '0');
                    const detik = bukaJam.getSeconds().toString().padStart(2, '0');
                    text += `│\n├─❖\n│ ⏰ *Akan terbuka otomatis*\n│    ${durationText} lagi (${jam}:${menit}:${detik})\n`;
                }
                
                text += `╰─────────────────`;
                
                await sock.sendMessage(groupId, { 
                    text: text,
                    mentions: allMembers,
                    contextInfo: {
                        externalAdReply: {
                            title: 'MIMOSA BOT',
                            body: duration > 0 ? `Closed for ${durationText}` : 'Group Closed',
                            thumbnail: thumbnail,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: global.fkon });
                
            } catch (err) {
                m.reply(`❌ *Gagal menutup grup!*\n\nError: ${err.message}`);
            }
        }
    },
    
    // AUTO CHECK setiap ada pesan (backup)
    all: async (sock, m, { isGroup }) => {
        if (!isGroup) return;
        
        const { Group } = await import('../../database/schema.js');
        const groupId = m.key.remoteJid;
        
        try {
            const groupData = await Group.findOne({ id: groupId });
            if (!groupData) return;
            
            // Cek apakah grup terkunci dan waktu sudah habis
            if (groupData.isClosed && groupData.closeUntil && groupData.closeUntil <= Date.now()) {
                console.log(`[AUTO OPEN] Membuka grup ${groupId} via message trigger`);
                
                await sock.groupSettingUpdate(groupId, "not_announcement");
                
                groupData.isClosed = false;
                groupData.closeUntil = null;
                await groupData.save();
                
                // Hapus interval jika ada
                if (autoOpenIntervals.has(groupId)) {
                    clearInterval(autoOpenIntervals.get(groupId));
                    autoOpenIntervals.delete(groupId);
                }
                
                const groupMetadata = await sock.groupMetadata(groupId);
                const allMembers = groupMetadata.participants.map(p => p.id);
                const thumbnail = getThumbnail();
                
                await sock.sendMessage(groupId, { 
                    text: `🔓 *GRUP TERBUKA OTOMATIS!*\n\n┌─❖\n│ Waktu penutupan telah habis.\n│ Semua anggota bisa chat kembali.\n╰─────────────────`,
                    mentions: allMembers,
                    contextInfo: {
                        externalAdReply: {
                            title: 'MIMOSA BOT',
                            body: 'Auto Opened',
                            thumbnail: thumbnail,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: global.fkon });
            }
        } catch (err) {
            console.error('[AUTO CHECK ERROR]', err);
        }
    }
};