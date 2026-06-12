import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi - SESUAIKAN DENGAN WEB-MU
const CONFIG = {
    API_KEY: 'TLK_BOT_SECRET_2026',
    WEB_URL: 'https://mimosamd.my.id',
    PANITIA: [
        '6281219048244@s.whatsapp.net',  // Hafiz
        '6289508242211@s.whatsapp.net'   // Hamzz
    ],
    INTERVAL: 10000,  // Cek setiap 10 detik
    SENT_FILE: path.join(__dirname, '../../database/sent_notifications.json')
};

// Pastikan folder database ada
const dbDir = path.dirname(CONFIG.SENT_FILE);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Load data notifikasi yang sudah dikirim
let sentNotifications = new Set();
if (fs.existsSync(CONFIG.SENT_FILE)) {
    try {
        const data = JSON.parse(fs.readFileSync(CONFIG.SENT_FILE, 'utf8'));
        sentNotifications = new Set(data);
        console.log(`📋 Loaded ${sentNotifications.size} sent notifications`);
    } catch (e) {
        //console.error('Gagal load sent notifications:', e.message);
    }
}

function saveSentNotifications() {
    fs.writeFileSync(CONFIG.SENT_FILE, JSON.stringify([...sentNotifications], null, 2));
}

// Ambil pendaftaran baru dari web
async function getPendingRegistrations() {
    try {
        const response = await fetch(`${CONFIG.WEB_URL}/api/bot/pending`, {
            headers: { 'x-api-key': CONFIG.API_KEY }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        return result.data || [];
    } catch (error) {
        //console.error('❌ Gagal ambil data dari web:', error.message);
        return [];
    }
}

// Tandai notifikasi sudah dikirim ke web
async function markAsSent(orderId) {
    try {
        const response = await fetch(`${CONFIG.WEB_URL}/api/bot/mark-sent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CONFIG.API_KEY
            },
            body: JSON.stringify({ orderId })
        });
        return response.ok;
    } catch (error) {
        //console.error(`❌ Gagal mark sent untuk ${orderId}:`, error.message);
        return false;
    }
}

// Format pesan WhatsApp
function formatPesanPendaftaran(team) {
    const date = new Date(team.registeredAt);
    const formattedDate = date.toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    
    return `
🎮 *PENDAFTARAN BARU!* 🎮
─────────────────────
🆔 ID      : ${team.orderId}
🏷️ Tim     : ${team.teamName}
👤 Ketua   : ${team.captainName}
📱 WA      : ${team.phone}
📍 Lokasi  : ${team.locationName}
💰 Biaya   : Rp ${team.price.toLocaleString('id-ID')}
📅 Waktu   : ${formattedDate}
📊 Status  : ⏳ MENUNGGU PEMBAYARAN
─────────────────────
🔗 *Admin Panel:* ${CONFIG.WEB_URL}/admin
─────────────────────
📌 *Cara Verifikasi:*
   Ketik *verifikasi pending* untuk lihat daftar
   Ketik *verifikasi done <orderId>* untuk konfirmasi
    `.trim();
}

// Kirim pesan ke semua panitia
async function sendToAllPanitia(sock, message) {
    let successCount = 0;
    
    for (const nomor of CONFIG.PANITIA) {
        try {
            await sock.sendMessage(nomor, { text: message });
            successCount++;
            console.log(`✅ Pesan terkirim ke ${nomor}`);
        } catch (error) {
            //console.error(`❌ Gagal kirim ke ${nomor}:`, error.message);
        }
    }
    
    return successCount;
}

// Variabel untuk interval
let checkInterval = null;

// Fungsi utama untuk mengecek pendaftaran baru
async function checkNewRegistrations(sock) {
    try {
        const pendingTeams = await getPendingRegistrations();
        
        if (pendingTeams.length === 0) return;
        
        console.log(`📋 Ditemukan ${pendingTeams.length} pendaftaran baru`);
        
        for (const team of pendingTeams) {
            // Cek apakah sudah pernah dikirim
            if (sentNotifications.has(team.orderId)) {
                console.log(`⏭️ Skip ${team.orderId} (already sent)`);
                continue;
            }
            
            // Format pesan
            const message = formatPesanPendaftaran(team);
            
            // Kirim ke semua panitia
            const sentCount = await sendToAllPanitia(sock, message);
            
            if (sentCount > 0) {
                // Tandai sudah dikirim ke web
                const marked = await markAsSent(team.orderId);
                
                if (marked) {
                    sentNotifications.add(team.orderId);
                    saveSentNotifications();
                    console.log(`✅ Notifikasi terkirim untuk ${team.teamName} (${team.orderId})`);
                }
            }
        }
    } catch (error) {
        //console.error('❌ Error checkNewRegistrations:', error);
    }
}

// Start auto-check
export function startAutoCheck(sock) {
    if (checkInterval) {
        clearInterval(checkInterval);
        console.log('🔄 Restarting auto-notifikasi...');
    }
    
    console.log(`🟢 Auto-notifikasi dimulai, cek setiap ${CONFIG.INTERVAL / 1000} detik`);
    console.log(`📨 Target panitia: ${CONFIG.PANITIA.length} nomor`);
    console.log(`🔗 Web URL: ${CONFIG.WEB_URL}`);
    
    // Langsung cek sekali saat start
    setTimeout(() => checkNewRegistrations(sock), 2000);
    
    // Set interval
    checkInterval = setInterval(() => {
        checkNewRegistrations(sock);
    }, CONFIG.INTERVAL);
}

// Stop auto-check
export function stopAutoCheck() {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
        console.log('🔴 Auto-notifikasi dihentikan');
    }
}

// Plugin command manual
export default {
    cmd: ['notifikasi', 'notif'],
    tags: ['owner'],
    ownerOnly: true,
    
    run: async (sock, m, { args }) => {
        const action = args[0]?.toLowerCase();
        
        if (action === 'start') {
            startAutoCheck(sock);
            await m.reply('✅ Auto-notifikasi dimulai! Bot akan mengecek pendaftaran baru setiap 10 detik.');
            return;
        }
        
        if (action === 'stop') {
            stopAutoCheck();
            await m.reply('🛑 Auto-notifikasi dihentikan!');
            return;
        }
        
        if (action === 'status') {
            const isRunning = checkInterval !== null;
            await m.reply(`
📊 *Status Auto-Notifikasi*
─────────────────────
🟢 Status: ${isRunning ? 'AKTIF' : 'NONAKTIF'}
📨 Target: ${CONFIG.PANITIA.length} nomor
⏱️ Interval: ${CONFIG.INTERVAL / 1000} detik
🔗 Web: ${CONFIG.WEB_URL}
📋 Terkirim: ${sentNotifications.size} pesan
─────────────────────
*Perintah:*
• notifikasi start - Mulai auto-notifikasi
• notifikasi stop - Hentikan auto-notifikasi
• notifikasi status - Cek status
            `.trim());
            return;
        }
        
        // Help
        await m.reply(`
📋 *Plugin Auto-Notifikasi Pendaftaran*
─────────────────────
*Perintah:*
• notifikasi start - Mulai auto-notifikasi
• notifikasi stop - Hentikan auto-notifikasi
• notifikasi status - Cek status

*Fungsi:*
Bot akan otomatis mengirim pesan ke panitia
ketika ada pendaftaran baru di website.
─────────────────────
        `.trim());
    }
};