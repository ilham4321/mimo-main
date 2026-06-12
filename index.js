import 'dotenv/config';
import './config.js';

import { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    Browsers, 
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    jidNormalizedUser
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import chalk from 'chalk';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CUSTOM MODULES ---
import connectDB from './src/database/mongo.js';
import { handler } from './src/handler.js';
import groupHandler from './src/handlers/group.js';
import { 
    loadPlugins, 
    watchPlugins, 
    pluginFolder,
    listPlugins,
    reloadAllPlugins,
    reloadPlugin
} from './src/lib/loader.js';

// --- CONFIG ---
const USE_PAIRING_CODE = true;
const MONGO_URI = process.env.MONGO_URI;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_FOLDER = path.join(__dirname, 'src/plugins');

// Logger level fatal agar terminal bersih
const logger = pino({ level: 'fatal' });

// Store socket global untuk akses dari luar (opsional)
let globalSock = null;

const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(text, (ans) => { rl.close(); resolve(ans); }));
};

/**
 * Setup command listener untuk owner (reload via WhatsApp)
 */
const setupOwnerCommands = async (sock) => {
    // Hanya setup sekali
    if (global._ownerCommandSetup) return;
    global._ownerCommandSetup = true;
    
    console.log(chalk.cyan('🔧 Owner commands aktif: .reload, .reloadall, .listplugins'));
    
    // Event listener untuk command owner (ini akan diproses di handler juga)
    // Tapi kita tambahkan sebagai fallback langsung di sini
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe) return;
            
            const body = m.message?.conversation || 
                        m.message?.extendedTextMessage?.text || 
                        '';
            
            if (!body.startsWith('.')) return;
            
            const args = body.slice(1).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            const sender = m.key.participant || m.key.remoteJid;
            const senderNumber = sender.split('@')[0];
            
            // Cek owner
            const ownerConfig = global.owner
                .map(v => (Array.isArray(v) ? v[0] : v))
                .map(v => v.replace(/[^0-9]/g, ''));
            
            const isOwner = m.key.fromMe || ownerConfig.includes(senderNumber);
            
            if (!isOwner) return;
            
            // Handle commands
            if (command === 'reload' && args[0]) {
                // Reload spesifik plugin: .reload tools/ping.js
                const pluginPath = args[0];
                const fullPath = path.join(PLUGIN_FOLDER, pluginPath);
                const success = await reloadPlugin(fullPath, pluginPath);
                
                if (success) {
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `✅ Plugin \`${pluginPath}\` berhasil di-reload!`
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `❌ Gagal reload plugin \`${pluginPath}\``
                    }, { quoted: m });
                }
            }
            
            else if (command === 'reloadall') {
                await sock.sendMessage(m.key.remoteJid, {
                    text: '🔄 Merefresh semua plugin...'
                }, { quoted: m });
                
                await reloadAllPlugins(PLUGIN_FOLDER);
                listPlugins();
                
                await sock.sendMessage(m.key.remoteJid, {
                    text: `✅ Berhasil me-reload ${Object.keys(global.plugins).length} plugin!`
                }, { quoted: m });
            }
            
            else if (command === 'listplugins' || command === 'plugins') {
                const pluginList = Object.keys(global.plugins).map(name => {
                    const plugin = global.plugins[name];
                    const icon = plugin.premium ? '💎' : plugin.ownerOnly ? '👑' : '📦';
                    const cmdInfo = plugin.cmd ? ` (${Array.isArray(plugin.cmd) ? plugin.cmd[0] : plugin.cmd})` : '';
                    return `${icon} \`${name}\`${cmdInfo}`;
                }).join('\n');
                
                const total = Object.keys(global.plugins).length;
                const message = `📋 *Daftar Plugin* (${total})\n\n${pluginList || 'Tidak ada plugin'}`;
                
                await sock.sendMessage(m.key.remoteJid, { text: message }, { quoted: m });
            }
        } catch (err) {
            console.error(chalk.red('Owner command error:'), err);
        }
    });
};

async function startBot() {
    console.clear();
    console.log(chalk.cyan.bold('🚀 MEMULAI MIMOSA V7 (LIGHTWEIGHT MODE)...'));

    // 1. Database
    if (!MONGO_URI) {
        console.error(chalk.bgRed.white(' FATAL '), 'MONGO_URI is missing in .env');
        process.exit(1);
    }
    await connectDB(MONGO_URI);

    // 2. Plugins
    console.log(chalk.blue('📂 Memuat Plugins...'));
    await loadPlugins(PLUGIN_FOLDER);
    
    // Tampilkan daftar plugin yang berhasil dimuat
    listPlugins();
    
    // Setup watcher untuk hot reload (dengan debounce 500ms)
    watchPlugins(PLUGIN_FOLDER, { debounceDelay: 500 });

    // 3. Auth
    const { state, saveCreds } = await useMultiFileAuthState('sessions');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(chalk.yellow(`📱 WA v${version.join('.')} (Latest: ${isLatest})`));

    // 4. Socket
    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: !USE_PAIRING_CODE,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger), 
        },
        browser: Browsers.ubuntu('Chrome'),
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: false,
        syncFullHistory: false,
        // Optimasi memory
        patchMessageBeforeSending: (message) => {
            // Optional: modifikasi pesan sebelum kirim
            return message;
        }
    });

    // Simpan socket global
    globalSock = sock;

    // 5. Pairing Code
    if (USE_PAIRING_CODE && !sock.authState.creds.registered) {
        console.log(chalk.yellow.bold('⚠️  Pairing Process...'));
        let phoneNumber = process.env.BOT_NUMBER;
        if (!phoneNumber) {
            phoneNumber = await question(chalk.bgMagenta.white(' Masukkan Nomor Bot (62xxx): ') + ' ');
        }
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(chalk.black.bgGreen(` KODE PAIRING: `));
                console.log(chalk.black.bgWhite(` ${code?.match(/.{1,4}/g)?.join('-') || code} `));
            } catch (err) {
                console.error('Gagal request code:', err);
            }
        }, 3000);
    }

    // 6. Connection Handler
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.red('Sesi Logged Out. Hapus folder sessions.'));
                process.exit(0);
            } else {
                console.log(chalk.yellow('Koneksi terputus, mencoba menyambung ulang...'));
                // Cleanup sebelum restart
                if (global._reconnectTimeout) clearTimeout(global._reconnectTimeout);
                global._reconnectTimeout = setTimeout(() => {
                    startBot();
                }, 5000);
            }
        } else if (connection === 'open') {
            console.log(chalk.green.bold('\n✅ BOT ONLINE!'));
            console.log(chalk.cyan(`   ├─ User: ${sock.user.id.split(':')[0]}`));
            console.log(chalk.cyan(`   ├─ Plugins: ${Object.keys(global.plugins).length}`));
            console.log(chalk.cyan(`   └─ Mode: ${USE_PAIRING_CODE ? 'Pairing Code' : 'QR Code'}`));
            
            // Setup owner commands via WhatsApp
            await setupOwnerCommands(sock);
            
            // ========== AUTO NOTIFIKASI PENDAFTARAN ==========
            try {
                const notifModule = await import('./src/plugins/owner/notif.js');
                if (notifModule.startAutoCheck) {
                    notifModule.startAutoCheck(sock);
                    console.log(chalk.green('   ├─ 📱 Auto-notifikasi pendaftaran aktif!'));
                }
            } catch (err) {
                console.log(chalk.yellow('   └─ ⚠️ Plugin notifikasi tidak ditemukan'));
            }
            // =================================================
            
            console.log(chalk.gray('\n💡 Tips: Gunakan .reload <plugin> atau .reloadall untuk hot reload'));
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // 7. Message Handler
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            if (!chatUpdate.messages) return;
            const m = chatUpdate.messages[0];
            if (!m.message) return;
            
            // Cegah bot memproses pesan sendiri
            if (m.key.fromMe) return;
            
            // Langsung panggil handler utama
            await handler(sock, m, chatUpdate); 
        } catch (err) {
            console.error(chalk.red('Handler Error:'), err);
        }
    });

    // 8. Group Handler
    sock.ev.on('group-participants.update', async (update) => {
    console.log(chalk.bgRed.white('[EVENT DEBUG] group-participants.update TRIGGERED!'));
    console.log(chalk.red(JSON.stringify(update, null, 2)));
    await groupHandler(sock, update);
});
    
    sock.ev.on('groups.update', async (updates) => {
    console.log('GROUPS UPDATE:', JSON.stringify(updates, null, 2));
    
    for (const update of updates) {
        const { id, subject, desc, picture, ...rest } = update;
        console.log('Update data:', { subject, desc, picture, rest });
        
        if (subject) {
            await sock.sendMessage(id, { 
                text: `📝 *UPDATE NAMA GRUP*\n\n╭────────────────\n│ ${subject}\n╰────────────────\n\n_Admin telah mengubah nama grup._` 
            });
        }
        
        if (desc) {
            await sock.sendMessage(id, { 
                text: `📋 *UPDATE DESKRIPSI GRUP*\n\n╭────────────────\n│ ${desc}\n╰────────────────\n\n_Admin telah mengubah deskripsi grup._` 
            });
        }
        
        if (picture) {
            await sock.sendMessage(id, { 
                text: `🖼️ *FOTO GRUP BERUBAH!*\n\nFoto profil grup telah diperbarui.` 
            });
        }
    }
});
    
    // 9. Optional: Handle callback query (untuk button/interactive)
    sock.ev.on('call', async (call) => {
        console.log(chalk.yellow('📞 Incoming call:', call));
        // Auto reject call
        for (const callData of call) {
            await sock.rejectCall(callData.id, callData.from);
        }
    });
}

// Handle process exit dengan clean
process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n👋 Shutting down gracefully...'));
    
    // Panggil cleanup semua plugin jika ada
    for (const [name, plugin] of Object.entries(global.plugins)) {
        if (typeof plugin.cleanup === 'function') {
            try {
                await plugin.cleanup();
                console.log(chalk.gray(`   └─ Cleanup: ${name}`));
            } catch (e) {
                console.error(chalk.red(`   └─ Cleanup error ${name}:`), e);
            }
        }
    }
    
    console.log(chalk.green('✅ Bot stopped. Goodbye!'));
    process.exit(0);
});

// Error handling untuk uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error(chalk.red('🔥 Uncaught Exception:'), error);
    // Jangan exit, biarkan bot tetap jalan
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('⚠️ Unhandled Rejection:'), reason);
});

startBot().catch(err => {
    console.error(chalk.red('System Error:'), err);
    process.exit(1);
});

// Export socket untuk keperluan debugging (opsional)
export { globalSock };