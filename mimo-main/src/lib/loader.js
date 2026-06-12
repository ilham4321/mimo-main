import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginFolder = path.join(__dirname, '../plugins');

global.plugins = {};

// Cache untuk menyimpan module info (opsional untuk debugging)
const moduleCache = new Map();

/**
 * Validasi struktur plugin minimal
 */
const validatePlugin = (plugin, filePath) => {
    if (!plugin) return false;
    
    // Plugin harus memiliki minimal salah satu: cmd, all, atau before
    const hasCmd = plugin.cmd && (Array.isArray(plugin.cmd) || typeof plugin.cmd === 'string');
    const hasAll = typeof plugin.all === 'function';
    const hasBefore = typeof plugin.before === 'function';
    
    if (!hasCmd && !hasAll && !hasBefore) {
        console.warn(chalk.yellow(`⚠️  Plugin ${path.basename(filePath)} tidak memiliki cmd, all, atau before - akan diabaikan`));
        return false;
    }
    
    // Validasi tipe data
    if (hasCmd && typeof plugin.cmd !== 'string' && !Array.isArray(plugin.cmd)) {
        console.warn(chalk.yellow(`⚠️  Plugin ${path.basename(filePath)}: cmd harus string atau array`));
        return false;
    }
    
    if (plugin.limit !== undefined && typeof plugin.limit !== 'boolean') {
        console.warn(chalk.yellow(`⚠️  Plugin ${path.basename(filePath)}: limit harus boolean`));
        plugin.limit = false;
    }
    
    if (plugin.priority !== undefined && typeof plugin.priority !== 'number') {
        console.warn(chalk.yellow(`⚠️  Plugin ${path.basename(filePath)}: priority harus number`));
        plugin.priority = 10;
    }
    
    return true;
};

/**
 * Membersihkan module dari cache memory
 */
const cleanupModule = async (relativePath) => {
    if (global.plugins[relativePath]) {
        // Coba panggil cleanup function jika ada
        const oldPlugin = global.plugins[relativePath];
        if (typeof oldPlugin.cleanup === 'function') {
            try {
                await oldPlugin.cleanup();
            } catch (e) {
                console.error(chalk.red(`Cleanup error untuk ${relativePath}:`), e);
            }
        }
        
        // Hapus dari global
        delete global.plugins[relativePath];
        
        // Hapus dari module cache
        if (moduleCache.has(relativePath)) {
            moduleCache.delete(relativePath);
        }
        
        console.log(chalk.gray(`   └─ Cache cleaned: ${relativePath}`));
    }
};

/**
 * Memuat satu plugin
 */
const loadPlugin = async (fullPath, relativePath) => {
    try {
        // Bersihkan module lama jika ada
        await cleanupModule(relativePath);
        
        // Gunakan pathToFileURL agar bisa ditambah query string timestamp
        const fileUrl = pathToFileURL(fullPath).href;
        
        // Import module dengan timestamp query untuk bypass cache
        const module = await import(fileUrl + '?update=' + Date.now());
        const plugin = module.default;
        
        // Validasi plugin
        if (!validatePlugin(plugin, fullPath)) {
            return false;
        }
        
        // Simpan metadata tambahan
        plugin.__filename = path.basename(fullPath);
        plugin.__fullpath = fullPath;
        plugin.__loadedAt = Date.now();
        
        // Simpan ke global plugins
        global.plugins[relativePath] = plugin;
        
        // Simpan ke cache untuk debugging
        moduleCache.set(relativePath, {
            loadedAt: plugin.__loadedAt,
            size: JSON.stringify(plugin).length
        });
        
        return true;
        
    } catch (error) {
        console.error(chalk.red(`❌ Error loading plugin ${relativePath}:`));
        console.error(chalk.yellow(`   📍 File: ${fullPath}`));
        console.error(chalk.red(`   ❌ Message: ${error.message}`));
        if (error.stack) {
            console.error(chalk.gray(`   📝 Stack: ${error.stack.split('\n')[1]?.trim() || error.stack}`));
        }
        return false;
    }
};

/**
 * Memuat semua plugin dari folder
 */
const loadPlugins = async (folder) => {
    console.log(chalk.blue('\n📂 Memuat plugins...'));
    
    // Reset global plugins
    global.plugins = {};
    moduleCache.clear();
    
    // Pastikan folder ada
    if (!fs.existsSync(folder)) {
        console.log(chalk.yellow(`⚠️  Folder plugin tidak ditemukan, membuat: ${folder}`));
        fs.mkdirSync(folder, { recursive: true });
        console.log(chalk.green(`✅ Folder plugin telah dibuat: ${folder}`));
        return;
    }
    
    const files = [];
    
    // Fungsi rekursif untuk membaca semua file .js
    const readDirRecursive = (dir) => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                readDirRecursive(fullPath);
            } else if (item.endsWith('.js')) {
                files.push(fullPath);
            }
        }
    };
    
    readDirRecursive(folder);
    
    if (files.length === 0) {
        console.log(chalk.yellow('⚠️  Tidak ada file plugin (.js) yang ditemukan'));
        return;
    }
    
    console.log(chalk.cyan(`   ├─ Ditemukan ${files.length} file plugin`));
    
    let successCount = 0;
    let failCount = 0;
    
    // Load semua plugin
    for (const fullPath of files) {
        const relativePath = path.relative(folder, fullPath);
        const success = await loadPlugin(fullPath, relativePath);
        
        if (success) {
            successCount++;
            console.log(chalk.green(`   ├─ ✅ ${relativePath}`));
        } else {
            failCount++;
            console.log(chalk.red(`   ├─ ❌ ${relativePath}`));
        }
    }
    
    console.log(chalk.cyan(`   └─ ─────────────────────────`));
    console.log(chalk.green(`✅ Berhasil memuat ${successCount} plugin`));
    if (failCount > 0) {
        console.log(chalk.red(`⚠️  Gagal memuat ${failCount} plugin`));
    }
    
    // Tampilkan statistik
    const cmdPlugins = Object.values(global.plugins).filter(p => p.cmd).length;
    const allPlugins = Object.values(global.plugins).filter(p => p.all).length;
    const beforePlugins = Object.values(global.plugins).filter(p => p.before).length;
    
    console.log(chalk.gray(`   📊 Statistik: ${cmdPlugins} command, ${allPlugins} auto, ${beforePlugins} before`));
    console.log('');
};

/**
 * Reload satu plugin
 */
const reloadPlugin = async (fullPath, relativePath) => {
    console.log(chalk.yellow(`🔄 Reloading: ${relativePath}`));
    
    const startTime = Date.now();
    const success = await loadPlugin(fullPath, relativePath);
    const duration = Date.now() - startTime;
    
    if (success) {
        console.log(chalk.green(`✅ Reloaded: ${relativePath} (${duration}ms)`));
    } else {
        console.log(chalk.red(`❌ Failed to reload: ${relativePath}`));
    }
    
    return success;
};

/**
 * Watcher: Mendeteksi perubahan file (dengan debounce)
 */
const watchPlugins = (folder, options = {}) => {
    const { debounceDelay = 300, ignoreInitial = true } = options;
    
    if (!fs.existsSync(folder)) {
        console.log(chalk.yellow(`⚠️  Folder ${folder} tidak ditemukan, tidak bisa watch`));
        return null;
    }
    
    console.log(chalk.blue(`👀 Watching plugins folder: ${folder}`));
    
    // Debounce map untuk mencegah multiple reload
    const debounceTimers = new Map();
    
    // Fungsi untuk handle file change dengan debounce
    const handleFileChange = (eventType, filename) => {
        if (!filename || !filename.endsWith('.js')) return;
        
        // Bersihkan timer sebelumnya
        if (debounceTimers.has(filename)) {
            clearTimeout(debounceTimers.get(filename));
        }
        
        // Set timer baru
        const timer = setTimeout(async () => {
            debounceTimers.delete(filename);
            
            const fullPath = path.join(folder, filename);
            const relativePath = filename; // fs.watch return relative filename
            
            // Cek apakah file masih ada
            if (fs.existsSync(fullPath)) {
                await reloadPlugin(fullPath, relativePath);
            } else {
                // File dihapus
                console.log(chalk.red(`🗑️  Plugin deleted: ${filename}`));
                await cleanupModule(relativePath);
            }
        }, debounceDelay);
        
        debounceTimers.set(filename, timer);
    };
    
    // Setup watcher dengan error handling
    let watcher;
    try {
        watcher = fs.watch(folder, { recursive: true }, (eventType, filename) => {
            // Ignore jika filename null
            if (!filename) return;
            
            // Ignore file temporary (sublime, vim, etc)
            if (filename.startsWith('~') || filename.startsWith('._') || filename.includes('swp')) {
                return;
            }
            
            // Handle change events
            if (eventType === 'change' || eventType === 'rename') {
                handleFileChange(eventType, filename);
            }
        });
        
        // Error handling untuk watcher
        watcher.on('error', (error) => {
            console.error(chalk.red('Watcher error:'), error);
            console.log(chalk.yellow('⚠️  Mencoba reconnect watcher dalam 5 detik...'));
            setTimeout(() => {
                watchPlugins(folder, options);
            }, 5000);
        });
        
        console.log(chalk.green(`✅ Watcher aktif (debounce: ${debounceDelay}ms)`));
        
    } catch (error) {
        console.error(chalk.red(`❌ Gagal setup watcher: ${error.message}`));
        console.log(chalk.yellow('⚠️  Hot reload tidak tersedia, restart manual required untuk update plugin'));
        return null;
    }
    
    return watcher;
};

/**
 * Menampilkan daftar plugin yang sedang aktif
 */
const listPlugins = () => {
    console.log(chalk.cyan.bold('\n📋 Active Plugins:\n'));
    
    const pluginsByCategory = {
        commands: [],
        auto: [],
        before: []
    };
    
    for (const [name, plugin] of Object.entries(global.plugins)) {
        const icon = plugin.premium ? '💎' : plugin.ownerOnly ? '👑' : '📦';
        const cmdInfo = plugin.cmd ? `[${Array.isArray(plugin.cmd) ? plugin.cmd.join(', ') : plugin.cmd}]` : '';
        
        if (plugin.cmd) {
            pluginsByCategory.commands.push({ name, icon, cmdInfo, plugin });
        } else if (plugin.all) {
            pluginsByCategory.auto.push({ name, icon, plugin });
        } else if (plugin.before) {
            pluginsByCategory.before.push({ name, icon, plugin });
        }
    }
    
    if (pluginsByCategory.commands.length > 0) {
        console.log(chalk.green('🎮 Commands:'));
        for (const p of pluginsByCategory.commands) {
            console.log(chalk.gray(`   ${p.icon} ${p.name} ${p.cmdInfo}`));
        }
    }
    
    if (pluginsByCategory.auto.length > 0) {
        console.log(chalk.yellow('\n🤖 Auto-Response:'));
        for (const p of pluginsByCategory.auto) {
            console.log(chalk.gray(`   ${p.icon} ${p.name}`));
        }
    }
    
    if (pluginsByCategory.before.length > 0) {
        console.log(chalk.blue('\n⏳ Before Hooks:'));
        for (const p of pluginsByCategory.before) {
            const priority = p.plugin.priority || 10;
            console.log(chalk.gray(`   ${p.icon} ${p.name} (priority: ${priority})`));
        }
    }
    
    console.log(chalk.cyan(`\n📊 Total: ${Object.keys(global.plugins).length} plugins\n`));
};

/**
 * Force reload semua plugin
 */
const reloadAllPlugins = async (folder) => {
    console.log(chalk.yellow.bold('\n🔄 Force reloading all plugins...\n'));
    await loadPlugins(folder);
    listPlugins();
};

export { 
    loadPlugins, 
    watchPlugins, 
    pluginFolder,
    reloadPlugin,
    reloadAllPlugins,
    listPlugins,
    moduleCache
};