import moment from 'moment-timezone';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function clockString(ms) {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;

    return [h, m, s]
        .map(v => v.toString().padStart(2, '0'))
        .join(':');
}

function ucapan() {
    const time = moment.tz('Asia/Jakarta').format('HH');

    if (time >= 4 && time < 10) return '🌤️ Selamat Pagi';
    if (time >= 10 && time < 15) return '☀️ Selamat Siang';
    if (time >= 15 && time < 18) return '🌆 Selamat Sore';
    return '🌙 Selamat Malam';
}

export default {
    cmd: ['menu', 'help', 'list'],
    tags: ['general'],

    run: async (sock, m, { user, prefix, pushName, args }) => {

        const videoPath = path.join(process.cwd(), 'src', 'mimosa.mp4');
        let videoBuffer = null;
        try {
            videoBuffer = fs.readFileSync(videoPath);
        } catch {}

        const audioPath = path.join(process.cwd(), 'src', 'menu.mp3');
        let audioBuffer = null;
        try {
            audioBuffer = fs.readFileSync(audioPath);
        } catch {}

        const thumbPath = path.join(process.cwd(), 'src', 'mimosa.png');
        let thumbBuffer = null;
        try {
            thumbBuffer = fs.readFileSync(thumbPath);
        } catch {}

        const command = args[0]?.toLowerCase();

        const level = user?.rpg?.level || 0;
        const premium = user?.premium ? 'Premium' : 'Free';
        const limit = user?.limit || 0;
        const money = user?.rpg?.money?.toLocaleString() || '0';

        const uptime = clockString(process.uptime() * 1000);
        const platform = os.platform() === 'android'
            ? 'Android Device'
            : 'Linux Server';

        const date = moment().tz('Asia/Jakarta').format('DD/MM/YYYY');
        const time = moment().tz('Asia/Jakarta').format('HH:mm:ss');

        const categories = {};

        Object.values(global.plugins || {})
            .filter(plugin => plugin && plugin.cmd && plugin.tags && !plugin.ownerOnly)
            .forEach(plugin => {
                const tags = Array.isArray(plugin.tags)
                    ? plugin.tags
                    : [plugin.tags];

                tags.forEach(tagName => {
                    if (!categories[tagName]) categories[tagName] = [];

                    const commands = Array.isArray(plugin.cmd)
                        ? plugin.cmd
                        : [plugin.cmd];

                    categories[tagName].push(...commands);
                });
            });

        //=========================
        // ALL MENU
        //=========================

        if (command === 'all') {

            let allCommandsText = `
╭─「 🌸 ALL MENU 🌸 」
│
├ 👤 User : ${pushName || 'User'}
├ 📊 Category : ${Object.keys(categories).length}
├ ⚡ Command  : ${Object.values(categories).reduce((a, b) => a + b.length, 0)}
│
`;

for (const cat of Object.keys(categories).sort()) {

allCommandsText += `
├─〔 ${cat.toUpperCase()} 〕
${categories[cat]
.map(cmd => `│ • ${prefix}${cmd}`)
.join('\n')}
│
`;
}

allCommandsText += `╰──────────────⬣`;

            for (const cat of Object.keys(categories).sort()) {

                allCommandsText += `
╭─❍ 「 ${cat.toUpperCase()} 」
${categories[cat]
.map(cmd => `│ ⌬ ${prefix}${cmd}`)
.join('\n')}
╰────────────⬣
`;
            }

            allCommandsText += `
╭──────────────────⬣
│ 🌸 Powered By Mimosa Bot
│ ⚡ Fast • Modern • Stable
╰────────────────⬣`;

            await sock.sendMessage(m.key.remoteJid, {
                text: allCommandsText,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363369878409989@newsletter',
                        serverMessageId: 101,
                        newsletterName: '🌸 Mimosa Multi Device'
                    },
                    externalAdReply: {
                        title: 'MIMOSA ALL MENU',
                        body: 'Simple • Fast • Modern',
                        thumbnail: thumbBuffer,
                        sourceUrl: 'https://whatsapp.com/channel/0029Vaxfn57Jpe8nkfCU7p27',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fkon });

            if (audioBuffer) {
                await sock.sendMessage(m.key.remoteJid, {
                    audio: audioBuffer,
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: global.fkon });
            }

            return;
        }

        //=========================
        // CATEGORY MENU
        //=========================

        const selectedCategory = Object.keys(categories)
            .find(cat => cat.toLowerCase() === command);

        if (selectedCategory) {

            let categoryText = `
╭─「 🌸 ${selectedCategory.toUpperCase()} MENU 🌸 」
│
├ 👤 ${pushName || 'User'}
├ ${ucapan()}
│
${categories[selectedCategory]
.map(cmd => `├ • ${prefix}${cmd}`)
.join('\n')}
│
├ Total Command :
├ ${categories[selectedCategory].length}
│
╰──────────────⬣`;
            await sock.sendMessage(m.key.remoteJid, {
                text: categoryText,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363369878409989@newsletter',
                        serverMessageId: 101,
                        newsletterName: '🌸 Mimosa Multi Device'
                    },
                    externalAdReply: {
                        title: `MENU ${selectedCategory.toUpperCase()}`,
                        body: 'Simple • Fast • Modern',
                        thumbnail: thumbBuffer,
                        sourceUrl: 'https://whatsapp.com/channel/0029Vaxfn57Jpe8nkfCU7p27',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fkon });

            if (audioBuffer) {
                await sock.sendMessage(m.key.remoteJid, {
                    audio: audioBuffer,
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: global.fkon });
            }

            return;
        }

        //=========================
        // MAIN MENU
        //=========================

        let menuText = `
╭─「 🌸 MIMOSA BOT 🌸 」
│
├ 👋 ${ucapan()}
├ 👤 User : ${pushName || 'User'}
│
├─〔 USER INFO 〕
│ • Level  : ${level}
│ • Money  : Rp ${money}
│ • Status : ${premium}
│ • Limit  : ${limit}
│
├─〔 BOT INFO 〕
│ • Runtime : ${uptime}
│ • Platform: ${platform}
│ • Date    : ${date}
│ • Time    : ${time}
│
├─〔 LIST MENU 〕
${Object.keys(categories).sort()
.map(cat => `│ • ${prefix}menu ${cat}`)
.join('\n')}
│
├─〔 EXAMPLE 〕
│ • ${prefix}menu all
│ • ${prefix}menu tools
│ • ${prefix}menu downloader
│
╰──────────────⬣`;
        if (videoBuffer) {

            await sock.sendMessage(m.key.remoteJid, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                gifPlayback: true,
                caption: menuText,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363369878409989@newsletter',
                        serverMessageId: 101,
                        newsletterName: '🌸 Mimosa Multi Device'
                    },
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Simple • Fast • Modern',
                        thumbnail: thumbBuffer,
                        sourceUrl: 'https://whatsapp.com/channel/0029Vaxfn57Jpe8nkfCU7p27',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fkon });

        } else {

            await sock.sendMessage(m.key.remoteJid, {
                text: menuText,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363369878409989@newsletter',
                        serverMessageId: 101,
                        newsletterName: '🌸 Mimosa Multi Device'
                    },
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Simple • Fast • Modern',
                        thumbnail: thumbBuffer,
                        sourceUrl: 'https://whatsapp.com/channel/0029Vaxfn57Jpe8nkfCU7p27',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fkon });
        }

        if (audioBuffer) {
            await sock.sendMessage(m.key.remoteJid, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: global.fkon });
        }
    }
};