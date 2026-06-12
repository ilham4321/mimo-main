import moment from 'moment-timezone';
import speed from 'performance-now';

// ==================== WAKTU & TANGGAL ====================

// Fungsi ucapan berdasarkan waktu
export function ucapan() {
    const time = moment.tz('Asia/Jakarta').format('HH');
    if (time >= 4 && time < 10) return "Selamat pagi";
    if (time >= 10 && time < 15) return "Selamat siang";
    if (time >= 15 && time < 18) return "Selamat sore";
    return "Selamat malam";
}

// Format tanggal Indonesia
export function getDate() {
    const d = new Date();
    const locale = 'id';
    const week = d.toLocaleDateString(locale, { weekday: 'long' });
    const date = d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    return `${week}, ${date}`;
}

// Format tanggal lengkap dengan waktu
export function getFullDate() {
    return moment().tz('Asia/Jakarta').format('dddd, DD MMMM YYYY - HH:mm:ss');
}

// Format waktu saja
export function getTime() {
    return moment().tz('Asia/Jakarta').format('HH:mm:ss');
}

// ==================== RUNTIME ====================

// Format runtime dari detik
export function clockString(ms) {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

// Format runtime dari detik (versi teks)
export function runtime(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const dDisplay = d > 0 ? d + "d " : "";
    const hDisplay = h > 0 ? h + "h " : "";
    const mDisplay = m > 0 ? m + "m " : "";
    const sDisplay = s > 0 ? s + "s" : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

// ==================== LATENSI / PING ====================

// Hitung latensi ke server WhatsApp
export async function getLatency(sock) {
    const start = speed();
    await sock.sendPresenceUpdate('composing', 'status@broadcast');
    const end = speed();
    return (end - start).toFixed(2);
}

// ==================== PROFILE PICTURE ====================

// Dapatkan URL profil picture user
export async function getProfilePicture(sock, jid) {
    try {
        return await sock.profilePictureUrl(jid, 'image');
    } catch {
        return 'https://telegra.ph/file/a6294049a1863a69154cf.jpg'\;
    }
}

// ==================== RANDOM ====================

// Random pick dari array
export function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

// Random angka antara min dan max
export function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ==================== FAKE MESSAGE ====================

// Fake Contact (pesan seolah dari kontak)
export function createFakeContact(name, number) {
    return {
        key: {
            fromMe: false,
            participant: `${number}@s.whatsapp.net`,
            remoteJid: 'BROADCAST GROUP'
        },
        message: {
            contactMessage: {
                displayName: name,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${name};;;\nFN:${name}\nitem1.TEL;waid=${number}:${number}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
            }
        }
    };
}

// Fake Verification (pesan terverifikasi WhatsApp)
export const fakeVerified = {
    key: {
        participant: '0@s.whatsapp.net',
        remoteJid: "0@s.whatsapp.net"
    },
    message: {
        conversation: "✓ Terverifikasi Oleh WhatsApp"
    }
};

// Random Document (file palsu)
export function randomDocument() {
    const mimes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/msword",
        "application/pdf"
    ];
    const sizes = [2000, 3000, 2023000, 2024000];
    return {
        mimetype: pickRandom(mimes),
        size: pickRandom(sizes)
    };
}

// Newsletter Forward (pesan dari newsletter)
export function createNewsletterForward(newsletterJid, newsletterName) {
    return {
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: newsletterJid,
                serverMessageId: Math.floor(Math.random() * 1000),
                newsletterName: newsletterName
            }
        }
    };
}

// ==================== EXTERNAL AD REPLY ====================

// Template external ad reply
export function createAdReply(title, body, thumbnailUrl, sourceUrl) {
    return {
        contextInfo: {
            externalAdReply: {
                showAdAttribution: true,
                title: title,
                body: body,
                thumbnailUrl: thumbnailUrl,
                sourceUrl: sourceUrl,
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    };
}

// ==================== FORMAT ANGKA ====================

// Format angka ke Rupiah
export function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

// Format angka dengan koma
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ==================== VALIDASI ====================

// Cek apakah URL valid
export function isValidUrl(url) {
    const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(url);
}

// Cek apakah angka
export function isNumber(num) {
    return !isNaN(parseFloat(num)) && isFinite(num);
}

// ==================== SLEEP / DELAY ====================

// Delay / sleep
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== EXPORT SEMUA ====================
export default {
    ucapan,
    getDate,
    getFullDate,
    getTime,
    clockString,
    runtime,
    getLatency,
    getProfilePicture,
    pickRandom,
    randomRange,
    createFakeContact,
    fakeVerified,
    randomDocument,
    createNewsletterForward,
    createAdReply,
    formatRupiah,
    formatNumber,
    isValidUrl,
    isNumber,
    sleep
};
