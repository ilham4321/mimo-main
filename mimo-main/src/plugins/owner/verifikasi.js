import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================================
// 📋 KONFIGURASI
// ================================
const CONFIG = {
    API_KEY: 'TLK_BOT_SECRET_2026',
    WEB_URL: 'https://mimosamd.my.id',
    ADMIN_NUMBERS: [
        '6281219048244@s.whatsapp.net',  // Hafiz
        '6289508242211@s.whatsapp.net'   // Hamzz
    ]
};

// File untuk menyimpan data pending
const TEMP_FILE = path.join(__dirname, '../../database/pending_verification.json');
const DB_DIR = path.dirname(TEMP_FILE);

// ================================
// 💾 MANAJEMEN DATA PENDING
// ================================
let pendingVerification = new Map();

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

if (fs.existsSync(TEMP_FILE)) {
    try {
        const data = JSON.parse(fs.readFileSync(TEMP_FILE, 'utf8'));
        pendingVerification = new Map(Object.entries(data));
        console.log(`📋 Loaded ${pendingVerification.size} pending verifications`);
    } catch (e) {
        console.error('Gagal load pending data:', e.message);
    }
}

function savePendingVerification() {
    const obj = Object.fromEntries(pendingVerification);
    fs.writeFileSync(TEMP_FILE, JSON.stringify(obj, null, 2));
}

// ================================
// 🌐 API CALLS KE WEB
// ================================

async function getRegistrationDetail(orderId) {
    try {
        const response = await fetch(`${CONFIG.WEB_URL}/api/bot/detail/${orderId}`, {
            headers: { 'x-api-key': CONFIG.API_KEY }
        });
        const result = await response.json();
        return result.success ? result.data : null;
    } catch (error) {
        console.error('❌ Gagal ambil detail:', error.message);
        return null;
    }
}

async function updateStatus(orderId, newStatus, adminNote = '') {
    try {
        const response = await fetch(`${CONFIG.WEB_URL}/api/bot/update-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CONFIG.API_KEY
            },
            body: JSON.stringify({ orderId, newStatus, adminNote })
        });
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('❌ Gagal update status:', error.message);
        return false;
    }
}

async function generateCertificate(orderId) {
    try {
        const response = await fetch(`${CONFIG.WEB_URL}/api/generate-certificate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CONFIG.API_KEY
            },
            body: JSON.stringify({ orderId })
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('❌ Gagal generate sertifikat:', error.message);
        return { success: false, error: error.message };
    }
}

async function getPendingFromWeb() {
    try {
        const response = await fetch(`${CONFIG.WEB_URL}/api/bot/pending`, {
            headers: { 'x-api-key': CONFIG.API_KEY }
        });
        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('❌ Gagal ambil pending dari web:', error.message);
        return [];
    }
}

// ================================
// 📝 FORMAT PESAN
// ================================

function formatDetailPendaftaran(team) {
    const date = new Date(team.registeredAt);
    const formattedDate = date.toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    
    let buktiText = '';
    if (team.paymentProof) {
        buktiText += `\n📸 Bukti Bayar: ${CONFIG.WEB_URL}/${team.paymentProof}`;
    }
    if (team.igProof) {
        buktiText += `\n📷 Bukti IG: ${CONFIG.WEB_URL}/${team.igProof}`;
    }
    if (team.ytProof) {
        buktiText += `\n🎬 Bukti YT: ${CONFIG.WEB_URL}/${team.ytProof}`;
    }
    if (team.flyerProof) {
        buktiText += `\n📢 Bukti Brosur: ${CONFIG.WEB_URL}/${team.flyerProof}`;
    }
    
    return `
📋 *DETAIL PENDAFTARAN*
─────────────────────
🆔 ID      : ${team.orderId}
🏷️ Tim     : ${team.teamName}
👤 Ketua   : ${team.captainName}
📱 WA      : ${team.phone}
📍 Lokasi  : ${team.locationName}
💰 Biaya   : Rp ${team.price.toLocaleString('id-ID')}
📅 Waktu   : ${formattedDate}
📊 Status  : ${team.status === 'waiting_verification' ? '⏳ MENUNGGU VERIFIKASI' : '🕐 MENUNGGU BAYAR'}
${buktiText}
─────────────────────
✅ *Cara Verifikasi:*
   • Ketik *done* (reply pesan ini) untuk konfirmasi LUNAS
   • Ketik *batal* (reply pesan ini) untuk tolak pembayaran
─────────────────────
    `.trim();
}

function formatVerifikasiSukses(team, adminName) {
    return `
✅ *VERIFIKASI BERHASIL*

─────────────────────
🎉 PEMBAYARAN KONFIRMASI
─────────────────────
🆔 ID      : ${team.orderId}
🏷️ Tim     : ${team.teamName}
👤 Ketua   : ${team.captainName}
📱 WA      : ${team.phone}
💰 Biaya   : Rp ${team.price.toLocaleString('id-ID')}
📊 Status  : ✅ LUNAS
─────────────────────
🔐 Diverifikasi oleh: ${adminName}
📅 Waktu: ${new Date().toLocaleString('id-ID')}
─────────────────────

Silakan lanjut ke babak selanjutnya!
    `.trim();
}

function formatVerifikasiDitolak(team, adminName) {
    return `
❌ *VERIFIKASI DITOLAK*

─────────────────────
⚠️ PEMBAYARAN TIDAK VALID
─────────────────────
🆔 ID      : ${team.orderId}
🏷️ Tim     : ${team.teamName}
👤 Ketua   : ${team.captainName}
📊 Status  : ❌ DITOLAK
─────────────────────
🔐 Diverifikasi oleh: ${adminName}
📅 Waktu: ${new Date().toLocaleString('id-ID')}
─────────────────────

Silakan hubungi panitia untuk info lebih lanjut.
    `.trim();
}

function formatSertifikatBerhasil(certResult) {
    return `
📜 *SERTIFIKAT TELAH DIBUAT*

─────────────────────
🔗 *Link Sertifikat:* ${CONFIG.WEB_URL}${certResult.url}
🆔 *No. Sertifikat:* ${certResult.certNumber}
─────────────────────

📌 *Cara Mendapatkan:*
Klik link di atas, lalu tekan "Cetak / Simpan PDF"
    `.trim();
}

// ================================
// 🔄 HANDLER PESAN MASUK (REPLY)
// ================================

export async function handleIncomingMessage(sock, m) {
    try {
        // Cegah bot memproses pesan sendiri
        if (m.key.fromMe) return false;
        
        const messageText = m.message?.conversation || m.message?.extendedTextMessage?.text;
        if (!messageText) return false;
        
        // Cek apakah ini balasan ke pesan verifikasi
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg) return false;
        
        const quotedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text;
        if (!quotedText || !quotedText.includes('DETAIL PENDAFTARAN')) return false;
        
        // Ekstrak orderId dari pesan yang dikutip
        const orderIdMatch = quotedText.match(/🆔 ID\s*:\s*([^\n]+)/);
        if (!orderIdMatch) return false;
        
        const orderId = orderIdMatch[1].trim();
        const action = messageText.toLowerCase().trim();
        
        // Ambil detail pendaftaran
        const team = await getRegistrationDetail(orderId);
        if (!team) {
            await sock.sendMessage(m.key.remoteJid, { text: '❌ Data pendaftaran tidak ditemukan!' });
            return true;
        }
        
        const adminName = m.pushName || m.key.remoteJid.split('@')[0];
        
        if (action === 'done') {
            const success = await updateStatus(orderId, 'paid', `Diverifikasi oleh ${adminName}`);
            
            if (success) {
                await sock.sendMessage(m.key.remoteJid, { text: formatVerifikasiSukses(team, adminName) });
                
                // ========== GENERATE SERTIFIKAT OTOMATIS ==========
                const certResult = await generateCertificate(orderId);
                
                if (certResult.success) {
                    await sock.sendMessage(m.key.remoteJid, { text: formatSertifikatBerhasil(certResult) });
                    
                    // Kirim notifikasi ke peserta
                    if (team.phone) {
                        const participantNumber = team.phone.replace(/^0/, '62') + '@s.whatsapp.net';
                        try {
                            await sock.sendMessage(participantNumber, { text: `
🎉 *PEMBAYARAN ANDA TELAH DIKONFIRMASI*

Halo *${team.teamName}*,

Pembayaran Anda sebesar Rp ${team.price.toLocaleString('id-ID')} telah diverifikasi.

📜 *E-Sertifikat Anda:* ${CONFIG.WEB_URL}${certResult.url}
🆔 *No. Sertifikat:* ${certResult.certNumber}

📅 Jadwal Turnamen:
   • 50 Besar (Online): 15 Agustus 2026
   • 6 Besar (Offline): 16 Agustus 2026

Terima kasih telah berpartisipasi! 🎮
                            `.trim() });
                        } catch (err) {
                            console.log('Gagal kirim notif ke peserta:', err.message);
                        }
                    }
                } else {
                    await sock.sendMessage(m.key.remoteJid, { text: `⚠️ Verifikasi berhasil, tetapi gagal membuat sertifikat: ${certResult.error}` });
                }
                // =================================================
                
                pendingVerification.delete(orderId);
                savePendingVerification();
            } else {
                await sock.sendMessage(m.key.remoteJid, { text: '❌ Gagal mengupdate status! Coba lagi nanti.' });
            }
            return true;
            
        } else if (action === 'batal' || action === 'tolak') {
            const success = await updateStatus(orderId, 'pending', `Ditolak oleh ${adminName}`);
            
            if (success) {
                await sock.sendMessage(m.key.remoteJid, { text: formatVerifikasiDitolak(team, adminName) });
                pendingVerification.delete(orderId);
                savePendingVerification();
            } else {
                await sock.sendMessage(m.key.remoteJid, { text: '❌ Gagal mengupdate status! Coba lagi nanti.' });
            }
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error handleIncomingMessage:', error);
        return false;
    }
}

// ================================
// 🎯 PLUGIN COMMAND
// ================================

export default {
    cmd: ['verifikasi', 'verify', 'cek'],
    tags: ['owner'],
    ownerOnly: true,
    
    run: async (sock, m, { args }) => {
        const action = args[0]?.toLowerCase();
        const orderId = args[1];
        const chatId = m.key.remoteJid;
        const adminName = m.pushName || chatId.split('@')[0];
        
        // Cek pending
        if (action === 'pending') {
            await sock.sendMessage(chatId, { text: '🔍 Memeriksa pendaftaran menunggu verifikasi...' });
            
            const pending = await getPendingFromWeb();
            const waitingList = pending.filter(t => t.status === 'waiting_verification');
            
            if (waitingList.length === 0) {
                await sock.sendMessage(chatId, { text: '📭 Tidak ada pendaftaran yang menunggu verifikasi.' });
                return;
            }
            
            for (const team of waitingList) {
                const detail = await getRegistrationDetail(team.orderId);
                if (detail) {
                    await sock.sendMessage(chatId, { text: formatDetailPendaftaran(detail) });
                    pendingVerification.set(team.orderId, {
                        sender: chatId,
                        teamName: team.teamName
                    });
                    savePendingVerification();
                }
            }
            return;
        }
        
        // Verifikasi done (manual via command)
        if (action === 'done' && orderId) {
            const team = await getRegistrationDetail(orderId);
            if (!team) {
                await sock.sendMessage(chatId, { text: '❌ Data pendaftaran tidak ditemukan!' });
                return;
            }
            
            const success = await updateStatus(orderId, 'paid', `Diverifikasi oleh ${adminName}`);
            
            if (success) {
                await sock.sendMessage(chatId, { text: formatVerifikasiSukses(team, adminName) });
                
                // Generate sertifikat
                const certResult = await generateCertificate(orderId);
                
                if (certResult.success) {
                    await sock.sendMessage(chatId, { text: formatSertifikatBerhasil(certResult) });
                    
                    // Kirim notifikasi ke peserta
                    if (team.phone) {
                        const participantNumber = team.phone.replace(/^0/, '62') + '@s.whatsapp.net';
                        try {
                            await sock.sendMessage(participantNumber, { text: `
🎉 *PEMBAYARAN ANDA TELAH DIKONFIRMASI*

Halo *${team.teamName}*,

Pembayaran Anda sebesar Rp ${team.price.toLocaleString('id-ID')} telah diverifikasi.

📜 *E-Sertifikat Anda:* ${CONFIG.WEB_URL}${certResult.url}
🆔 *No. Sertifikat:* ${certResult.certNumber}

Terima kasih telah berpartisipasi! 🎮
                            `.trim() });
                        } catch (err) {
                            console.log('Gagal kirim notif ke peserta:', err.message);
                        }
                    }
                } else {
                    await sock.sendMessage(chatId, { text: `⚠️ Verifikasi berhasil, tetapi gagal membuat sertifikat: ${certResult.error}` });
                }
                
                pendingVerification.delete(orderId);
                savePendingVerification();
            } else {
                await sock.sendMessage(chatId, { text: '❌ Gagal mengupdate status! Coba lagi nanti.' });
            }
            return;
        }
        
        // Verifikasi batal (manual via command)
        if ((action === 'batal' || action === 'tolak') && orderId) {
            const team = await getRegistrationDetail(orderId);
            if (!team) {
                await sock.sendMessage(chatId, { text: '❌ Data pendaftaran tidak ditemukan!' });
                return;
            }
            
            const success = await updateStatus(orderId, 'pending', `Ditolak oleh ${adminName}`);
            
            if (success) {
                await sock.sendMessage(chatId, { text: formatVerifikasiDitolak(team, adminName) });
                pendingVerification.delete(orderId);
                savePendingVerification();
            } else {
                await sock.sendMessage(chatId, { text: '❌ Gagal mengupdate status! Coba lagi nanti.' });
            }
            return;
        }
        
        // Generate sertifikat manual
        if (action === 'cert' && orderId) {
            const team = await getRegistrationDetail(orderId);
            if (!team) {
                await sock.sendMessage(chatId, { text: '❌ Data pendaftaran tidak ditemukan!' });
                return;
            }
            
            if (team.status !== 'paid') {
                await sock.sendMessage(chatId, { text: '❌ Sertifikat hanya bisa dibuat untuk peserta yang sudah LUNAS!' });
                return;
            }
            
            await sock.sendMessage(chatId, { text: '⏳ Membuat sertifikat...' });
            
            const certResult = await generateCertificate(orderId);
            
            if (certResult.success) {
                await sock.sendMessage(chatId, { text: formatSertifikatBerhasil(certResult) });
            } else {
                await sock.sendMessage(chatId, { text: `❌ Gagal membuat sertifikat: ${certResult.error}` });
            }
            return;
        }
        
        // Help
        await sock.sendMessage(chatId, { text: `
📋 *Cara Penggunaan Plugin Verifikasi*

─────────────────────
📌 *Perintah:*
─────────────────────
• *verifikasi pending* - Cek semua pendaftaran yang menunggu verifikasi
• *verifikasi done <orderId>* - Konfirmasi LUNAS
• *verifikasi batal <orderId>* - Tolak pembayaran
• *verifikasi cert <orderId>* - Generate sertifikat

─────────────────────
📌 *Cara Cepat (Reply):*
─────────────────────
1. Ketik *verifikasi pending*
2. Bot akan kirim detail pendaftaran
3. *Reply* pesan tersebut dengan:
   • *done* - Konfirmasi LUNAS (otomatis buat sertifikat)
   • *batal* - Tolak pembayaran

─────────────────────
⚡ Status akan otomatis berubah di website!
📜 Sertifikat otomatis dibuat saat verifikasi "done"
─────────────────────
        `.trim() });
    }
};