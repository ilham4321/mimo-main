import fs from 'fs';
import { watchFile, unwatchFile } from 'fs';
import { fileURLToPath } from 'url';

// --- GLOBAL SETTINGS ---
global.owner = [
    ['6289508242211', 'HamzzDev', true]
];

global.botName = 'Mimosa Multi-Device';
global.botVersion = '7.0';
global.footer = '© Mimosa 2026';
global.packname = 'Sticker By';
global.author = 'Mimosa Bot';

// --- API BASE URLS ---
global.apis = {
    siputzx: 'https://api.siputzx.my.id/api',
    nanzz: 'https://api-nanzz.my.id/docs'
};

// --- FEATURE TOGGLES ---
global.autodl = true;
global.antiSpam = true;
global.antiLink = true;
global.readMessage = true;
global.readGroup = false;
global.publicMode = true;
global.maintenance = false;
global.debug = false;

// --- COOLDOWN SETTINGS ---
global.cooldown = {
    default: 3,
    premium: 1,
    owner: 0
};

// --- LIMIT SYSTEM ---
global.limit = {
    default: 20,
    premium: 100,
    add: 5,
};

// --- ANTI-SPAM SETTINGS ---
global.antiSpamConfig = {
    maxPerSecond: 5,
    warningCount: 3,
};

// --- DOWNLOAD SETTINGS ---
global.downloadConfig = {
    maxSize: 100,
    timeout: 60,
};

// --- MEDIA SETTINGS ---
global.mediaConfig = {
    stickerSize: 512,
    imageQuality: 80,
};

// --- GROUP SETTINGS ---
global.groupConfig = {
    welcome: true,
    leave: true,
    promote: true,
    demote: true
};

// --- NEWSLETTER INFO ---
global.newsletter = {
    jid: '120363204362148135@newsletter',
    name: 'Mimosa Multi-Device✨',
    enabled: true
};

// --- EXTERNAL AD REPLY ---
global.externalAd = {
    title: 'Mimosa Multi-Device',
    body: 'Simple. Fast. Secure.',
    thumbnail: 'https://hamzz-cloud.vercel.app/api/file/6a14091744a50833d0a65a5b',
    sourceUrl: 'https://whatsapp.com/channel/0029VaFqS8I5Ui2TjO7d9W2L',
    enabled: true
};

// --- WAIT MESSAGES ---
global.wait = ['⏳', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'];
global.waitMessage = '⚡ *Mimosa-chan lagi proses...* ⚡\n*Tunggu ya, jangan nakal~* ✨';

// --- ERROR MESSAGES ---
global.errorMessage = '💦 *Ehehe~ Error nih...* 💦\n```%error%```\n*Mimosa-chan minta maaf!* 🥺';
global.ownerOnlyMessage = '👑 *Ehee~ Ini khusus owner saja* 👑\n*Kamu bukan HamzzDev-sama...* 😭';
global.groupOnlyMessage = '👥 *UwU~ Ini khusus grup loh* 👥\n*Chat pribadi? Nggak bisa!* ✨';
global.adminOnlyMessage = '👑 *Nyehehe~ Khusus admin grup* 👑\n*Kamu bukan admin...* 😿';
global.premiumOnlyMessage = '💎 *Waa~ Premium only* 💎\n*Kamu belum premium...* 🌸';
global.botAdminMessage = '🤖 *Mimosa-chan harus jadi admin dulu* 🤖\n*Jadiin admin dulu yaa~* 🥺';
global.limitMessage = '🌌 *Yah... Limit kamu habis* 🌌\n*Ketik *.buylimit* dulu ya* 💫';
global.registerMessage = '📝 *Kak, daftar dulu yuk!* 📝\n*Ketik* ```%prefix%register namakamu```';
global.bannedMessage = '🚫 *Duh... Kamu kena banned* 🚫\n*Hubungi owner untuk unbanned* 👑';
global.maintenanceMessage = '🔧 *Maintenance mode nih...* 🔧\n*Tunggu bentar ya~* ⏳';

// --- COMMAND MESSAGES ---
global.cmdNotFound = '❓ *Eh? Commandnya nggak ada* ❓\n*Ketik* ```%prefix%menu``` *ya* 📋';
global.cmdError = '💥 *Waa error...* 💥\n```%error%```\n*Lapor owner aja deh* 👑';
global.cmdCooldown = '⏱️ *Sabar dong...* ⏱️\n*Tunggu* ```%time% detik``` *lagi ya* 🥺';

// --- SUCCESS MESSAGES ---
global.successMessage = '✅ *Yey! Berhasil~* ✅\n*Makasih udah pake bot ini* 💕';
global.doneMessage = '🎊 *Sudah selesai!* 🎊\n*Mimosa-chan capek...* 😮‍💨';

// --- WARNING MESSAGES ---
global.warningMessage = '⚠️ *Peringatan!* ⚠️\n*Kamu sudah warning* ```%count%/3```\n*Jangan nakal yaa...* 😣';

// --- RPG EMOTICONS ---
global.rpg = {
    emoticon(string) {
        string = string.toLowerCase();
        let emot = {
            level: '🧬', limit: '🌌', health: '❤️', exp: '✉️', money: '💵',
            potion: '🥤', diamond: '💎', common: '📦', uncommon: '🎁', mythic: 'mw',
            legendary: '🗃️', pet: '🎁', trash: '🗑', armor: '🥼', sword: '⚔️',
            pickaxe: '⛏️', fishingrod: '🎣', wood: '🪵', rock: '🪨', string: '🕸️',
            horse: '🐎', cat: '🐈', dog: '🐕', fox: '🦊', petFood: '🍖', iron: '⛓️',
            gold: '👑', emerald: '💚'
        };
        let results = Object.keys(emot).map(v => [v, new RegExp(v, 'gi')]).filter(v => v[1].test(string));
        if (!results.length) return '';
        else return emot[results[0][0]];
    }
};

// --- CHARACTER INFO ---
global.character = {
    name: 'Mimosa-chan',
    age: '16 (永远)',
    birthday: '24 Desember',
    personality: 'Genki, tsundere, sometimes dere-dere',
    likes: ['🍡 Dango', '🍵 Matcha', '🐱 Neko', '✨ Sparkles'],
    dislikes: ['😠 Spammer', '🚫 Toxic people', '💢 Error'],
    catchphrase: 'Mimosa-chan, majuu~! ✨'
};

// --- KAWAII EMOJIS ---
global.kawaii = {
    happy: ['✨', '🎉', '🎊', '💕', '🌸', '🌟', '⭐', '💫'],
    sad: ['😢', '😭', '🥺', '💔', '😿', '💦', '🌧️'],
    angry: ['😤', '💢', '😠', '👿', '🔥', '💥'],
    love: ['💕', '💗', '💓', '💖', '💘', '💝', '❤️', '🧡', '💛', '💚', '💙', '💜'],
    cute: ['🥺', '👉👈', 'uwu', 'owo', 'ehehe', 'nyaa~']
};

// --- LOGGING ---
global.logging = {
    commands: true,
    errors: true,
    joins: true,
    leaves: true
};

// --- TIMEZONE ---
global.timezone = 'Asia/Jakarta';

// --- LANGUAGE ---
global.language = 'id';

let file = fileURLToPath(import.meta.url);
watchFile(file, () => {
    unwatchFile(file);
    console.log('🔄 *Mimosa-chan update config!* 🔄');
    import(file + '?update=' + Date.now());
});