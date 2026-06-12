import chalk from 'chalk';
import { User, Group } from './database/schema.js';
import {
    jidNormalizedUser,
    downloadContentFromMessage,
    getContentType,
    generateWAMessageFromContent,
    proto,
    areJidsSameUser,
} from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const normalizeJid = (jid) => {
    if (!jid) return null;
    return jid.replace(/:\d+@/, '@');
};

const extractNumber = (jid) => {
    if (!jid) return null;
    const normalized = normalizeJid(jid);
    return normalized.split('@')[0].replace(/[^0-9]/g, '');
};

const getLidFromPn = async (sock, pnJid) => {
    if (!pnJid) return null;
    const normalizedPn = normalizeJid(pnJid);
    
    try {
        const lid = await sock.signalRepository?.lidMapping?.getLIDForPN(normalizedPn);
        if (lid) return normalizeJid(lid);
    } catch (err) {}
    
    return null;
};

const getPnFromLid = async (sock, lidJid) => {
    if (!lidJid) return null;
    const normalizedLid = normalizeJid(lidJid);
    
    try {
        const pn = await sock.signalRepository?.lidMapping?.getPNForLID(normalizedLid);
        if (pn) return normalizeJid(pn);
    } catch (err) {}
    
    return null;
};

const isAdminUser = async (sock, participants, jidToCheck) => {
    if (!participants || !jidToCheck) return false;
    
    const normalizedCheck = normalizeJid(jidToCheck);
    const checkNumber = extractNumber(jidToCheck);
    
    for (const p of participants) {
        if (normalizeJid(p.id) === normalizedCheck) {
            return p.admin === 'admin' || p.admin === 'superadmin';
        }
    }
    
    for (const p of participants) {
        if (extractNumber(p.id) === checkNumber) {
            return p.admin === 'admin' || p.admin === 'superadmin';
        }
    }
    
    const pnFromCheck = await getPnFromLid(sock, normalizedCheck);
    if (pnFromCheck) {
        for (const p of participants) {
            const pPn = await getPnFromLid(sock, p.id);
            if (pPn === pnFromCheck) {
                return p.admin === 'admin' || p.admin === 'superadmin';
            }
        }
    }
    
    const lidFromCheck = await getLidFromPn(sock, normalizedCheck);
    if (lidFromCheck) {
        for (const p of participants) {
            if (normalizeJid(p.id) === lidFromCheck) {
                return p.admin === 'admin' || p.admin === 'superadmin';
            }
        }
    }
    
    return false;
};

const extractPhoneNumber = async (sock, jid) => {
    if (!jid) return null;
    
    const normalizedJid = normalizeJid(jid);
    const pn = await getPnFromLid(sock, normalizedJid);
    
    if (pn && pn.includes('@s.whatsapp.net')) {
        return pn.split('@')[0];
    }
    
    if (normalizedJid.includes('@s.whatsapp.net')) {
        return normalizedJid.split('@')[0];
    }
    
    return null;
};

const findValidJid = (obj) => {
    if (!obj) return null;
    for (let key in obj) {
        if (typeof obj[key] === 'string' && obj[key].endsWith('@s.whatsapp.net')) {
            return obj[key];
        }
    }
    return null;
};

const parseMentions = (text) => {
    let matches = text?.match(/@(\d{10,15})/g) || [];
    return matches.map(match => match.replace('@', '') + '@s.whatsapp.net');
};

const spamTracker = new Map();

global.fVerif = {
    key: {
        fromMe: false,
        participant: '0@s.whatsapp.net',
        remoteJid: 'status@broadcast'
    },
    message: {
        conversation: `© Powered by HamzzDev`
    },
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363369878409989@newsletter',
            serverMessageId: 101,
            newsletterName: '✨ Mimosa Multi-Device »'
        }
    }
};

global.fkon = {
    key: {
        fromMe: false,
        participant: '0@s.whatsapp.net',
        remoteJid: 'status@broadcast'
    },
    message: {
        contactMessage: {
            displayName: 'Mimosa Bot',
            vcard: `BEGIN:VCARD
VERSION:3.0
N:;Mimosa Bot;;;
FN:Mimosa Bot
item1.TEL;waid=0:0
item1.X-ABLabel:Ponsel
END:VCARD`
        }
    }
};

global.fkontak2 = {
    key: {
        fromMe: false,
        participant: '0@s.whatsapp.net',
        remoteJid: 'status@broadcast'
    },
    message: {
        productMessage: {
            product: {
                productImage: {
                    jpegThumbnail: (() => {
                        try {
                            return fs.readFileSync('./src/mimosa.png');
                        } catch {
                            return null;
                        }
                    })()
                },
                title: 'MIMOSA BOT',
                description: 'Simple • Fast • Secure',
                currencyCode: 'IDR',
                priceAmount1000: '999999999',
                retailerId: 'MIMOSA',
                productImageCount: 1
            },
            businessOwnerJid: '0@s.whatsapp.net'
        }
    }
};

global.fdoc = {
    key: {
        participant: '0@s.whatsapp.net',
        remoteJid: 'status@broadcast'
    },
    message: {
        documentMessage: {
            title: '« ✨ Mimosa Multi-Device »',
            jpegThumbnail: null
        }
    }
};

global.fkontak = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363369878409989@newsletter',
            serverMessageId: 101,
            newsletterName: '« ✨ Mimosa Multi-Device »'
        }
    }
};

export const handler = async (sock, m, chatUpdate, store = {}) => {
    try {
        const rawSender = m.key.fromMe
            ? sock.user.id
            : (findValidJid(m.key) || m.key.participant || m.key.remoteJid);

        const sender = jidNormalizedUser(rawSender);
        const senderJid = sender;

        const botJid = jidNormalizedUser(sock.user.id);

        const isGroup = m.key.remoteJid.endsWith('@g.us');
        if (m.key.remoteJid === 'status@broadcast') return;

        const senderNumber = await extractPhoneNumber(sock, sender) || extractNumber(sender);
        const botNumber = await extractPhoneNumber(sock, botJid) || extractNumber(botJid);

        m.mtype = getContentType(m.message);
        m.msg = m.mtype === 'viewOnceMessage'
            ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)]
            : m.message[m.mtype];

        const body = m.message?.conversation ||
            m.msg?.caption ||
            m.msg?.text ||
            '';

        const isCmd = /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?#$%^&.©^]/gi.test(body);
        const prefix = isCmd ? body[0] : '';
        const command = isCmd ? body.slice(1).trim().split(' ').shift().toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(' ');
        const pushName = m.pushName || 'User';

        m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];

        m.react = async (emoji) => {
            try {
                await sock.sendMessage(m.key.remoteJid, {
                    react: { text: emoji, key: m.key }
                });
            } catch (error) {
                console.error('React Error:', error);
            }
        };

        m.reply = async (content, options = {}) => {
            try {
                const thumbPath = path.join(process.cwd(), 'src', 'mimosa.png');
                let thumbBuffer = null;
                try {
                    thumbBuffer = fs.readFileSync(thumbPath);
                } catch (err) { }

                const quotedMsg = global.fkon || options.quoted || m;

                const newsletterConfig = {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363369878409989@newsletter',
                        serverMessageId: Math.floor(Math.random() * 1000),
                        newsletterName: '✨ Mimosa Multi-Device »'
                    }
                };

                if (typeof content === 'string') {
                    return sock.sendMessage(m.key.remoteJid, {
                        text: content,
                        mentions: parseMentions(content),
                        contextInfo: {
                            ...newsletterConfig,
                            externalAdReply: options.externalAdReply || (global.externalAd?.enabled ? {
                                title: global.externalAd.title || global.botName,
                                body: global.externalAd.body || global.footer,
                                thumbnail: thumbBuffer,
                                thumbnailUrl: thumbBuffer ? undefined : global.externalAd.thumbnail,
                                sourceUrl: global.externalAd.sourceUrl,
                                mediaType: 1,
                                renderLargerThumbnail: true
                            } : undefined)
                        },
                        ...options
                    }, { quoted: quotedMsg });
                }

                else if (Buffer.isBuffer(content)) {
                    const type = await fileTypeFromBuffer(content);

                    if (type?.mime?.startsWith('image/')) {
                        return sock.sendMessage(m.key.remoteJid, {
                            image: content,
                            caption: options.caption || '',
                            contextInfo: {
                                ...newsletterConfig,
                                externalAdReply: options.externalAdReply ? undefined : {
                                    title: 'MIMOSA BOT',
                                    body: 'Simple • Fast • Secure',
                                    thumbnail: thumbBuffer,
                                    sourceUrl: 'https://whatsapp.com/channel/0029Vaxfn57Jpe8nkfCU7p27',
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            },
                            ...options
                        }, { quoted: quotedMsg });
                    }
                    else if (type?.mime?.startsWith('video/')) {
                        return sock.sendMessage(m.key.remoteJid, {
                            video: content,
                            caption: options.caption || '',
                            contextInfo: {
                                ...newsletterConfig,
                                gifPlayback: options.gifPlayback || false,
                                externalAdReply: options.externalAdReply ? undefined : {
                                    title: 'MIMOSA BOT',
                                    body: 'Simple • Fast • Secure',
                                    thumbnail: thumbBuffer,
                                    sourceUrl: 'https://whatsapp.com/channel/0029Vaxfn57Jpe8nkfCU7p27',
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            },
                            ...options
                        }, { quoted: quotedMsg });
                    }
                    else {
                        return sock.sendMessage(m.key.remoteJid, {
                            document: content,
                            mimetype: type?.mime || 'application/octet-stream',
                            fileName: options.filename || `file.${type?.ext || 'bin'}`,
                            caption: options.caption || '',
                            contextInfo: newsletterConfig,
                            ...options
                        }, { quoted: quotedMsg });
                    }
                }

                else if (typeof content === 'object') {
                    return sock.sendMessage(m.key.remoteJid, content, {
                        quoted: quotedMsg,
                        contextInfo: newsletterConfig,
                        ...options
                    });
                }
            } catch (e) {
                console.error('Reply Error:', e);
                return sock.sendMessage(m.key.remoteJid, { text: 'Error: ' + e.message }, { quoted: global.fkon || m });
            }
        };

        if (m.msg?.contextInfo?.quotedMessage) {
            const quotedMessage = m.msg.contextInfo.quotedMessage;
            const quotedType = getContentType(quotedMessage);
            const quotedContent = quotedMessage[quotedType];

            const quotedSender = jidNormalizedUser(m.msg.contextInfo.participant || m.key.participant || m.key.remoteJid);
            const quotedId = m.msg.contextInfo.stanzaId;
            const quotedChat = m.msg.contextInfo.remoteJid || m.key.remoteJid;

            let quotedText = '';

            if (quotedType === 'conversation') {
                quotedText = quotedContent || '';
            } else if (quotedType === 'extendedTextMessage') {
                quotedText = quotedContent?.text || '';
            } else if (quotedType === 'imageMessage') {
                quotedText = quotedContent?.caption || '';
            } else if (quotedType === 'videoMessage') {
                quotedText = quotedContent?.caption || '';
            } else if (quotedType === 'documentMessage') {
                quotedText = quotedContent?.caption || '';
            } else {
                quotedText = quotedContent?.text || quotedContent?.caption || quotedContent?.description || '';
            }

            m.quoted = {
                id: quotedId,
                chat: quotedChat,
                sender: quotedSender,
                fromMe: quotedSender === jidNormalizedUser(sock.user.id),
                type: quotedType,
                mtype: quotedType,
                text: quotedText,
                message: quotedMessage,
                mentionedJid: quotedContent?.contextInfo?.mentionedJid || [],

                key: {
                    remoteJid: quotedChat,
                    fromMe: quotedSender === jidNormalizedUser(sock.user.id),
                    id: quotedId,
                    participant: quotedSender
                },

                download: async (filename = null) => {
                    try {
                        const mediaType = quotedType.replace('Message', '');
                        const stream = await downloadContentFromMessage(quotedContent, mediaType);
                        let buffer = Buffer.from([]);
                        for await (const chunk of stream) {
                            buffer = Buffer.concat([buffer, chunk]);
                        }

                        if (filename) {
                            const type = await fileTypeFromBuffer(buffer);
                            const filePath = path.join(process.cwd(), filename + '.' + (type?.ext || 'bin'));
                            fs.writeFileSync(filePath, buffer);
                            return filePath;
                        }
                        return buffer;
                    } catch (e) {
                        console.error('Quoted Download Error:', e);
                        throw e;
                    }
                },

                delete: () => {
                    const vM = proto.WebMessageInfo.fromObject({
                        key: {
                            remoteJid: quotedChat,
                            fromMe: quotedSender === jidNormalizedUser(sock.user.id),
                            id: quotedId
                        }
                    });
                    return sock.sendMessage(quotedChat, { delete: vM.key });
                },

                reply: async (content, options = {}) => {
                    return sock.sendMessage(quotedChat, {
                        text: content,
                        ...options
                    }, { quoted: m.quoted });
                }
            };

            if (['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage'].includes(quotedType)) {
                m.quoted.media = quotedContent;
            }
        } else {
            m.quoted = null;
        }

        const ownerConfig = global.owner
            .map(v => (Array.isArray(v) ? v[0] : v))
            .map(v => v.replace(/[^0-9]/g, ''));

        const isOwner = m.key.fromMe || ownerConfig.includes(senderNumber);

        let user = await User.findOne({ jid: senderJid });
        if (!user) {
            user = await User.findOne({ phoneNumber: senderNumber });
        }
        
        if (!user) {
            user = new User({
                jid: senderJid,
                phoneNumber: senderNumber,
                name: pushName,
                limit: global.limit?.default || 20,
                premium: isOwner,
                registered: false,
                premiumTime: 0,
                banned: false,
                warning: 0
            });
            await user.save();
        } else if (!user.jid) {
            user.jid = senderJid;
            await user.save();
        }

        if (user.banned) {
            if (isCmd) await m.reply('🚫 Kamu telah dibanned!');
            return;
        }

        if (user.premium && user.premiumTime !== 0 && Date.now() > user.premiumTime) {
            user.premium = false;
            user.premiumTime = 0;
            await user.save();
            await m.reply('🔔 Masa Premium kamu telah berakhir.');
        }

        if (global.maintenance && !isOwner) {
            if (isCmd) await m.reply('🔧 Maintenance mode');
            return;
        }

        if (global.antiSpam && !isOwner && !user.premium) {
            const now = Date.now();
            const userSpam = spamTracker.get(sender) || { count: 0, lastMsg: 0 };

            if (now - userSpam.lastMsg < 1000) {
                userSpam.count++;
                if (userSpam.count > (global.antiSpamConfig?.maxPerSecond || 5)) {
                    user.warning++;
                    await user.save();

                    if (user.warning >= (global.antiSpamConfig?.warningCount || 3)) {
                        user.banned = true;
                        await user.save();
                        await m.reply('🚫 Kamu telah dibanned karena spam!');
                        return;
                    } else {
                        await m.reply(`⚠️ Warning ${user.warning}/3: Jangan spam!`);
                    }
                }
            } else {
                userSpam.count = 1;
            }

            userSpam.lastMsg = now;
            spamTracker.set(sender, userSpam);
        }

        if (isOwner) {
            const firstChar = body.charAt(0);
            const isEvalCommand = firstChar === '>' || firstChar === '$';
            const isAsyncEval = body.startsWith('>>');

            if (isEvalCommand || isAsyncEval) {
                try {
                    let evalCommand = isAsyncEval ? '>>' : firstChar;
                    let evalCode = isAsyncEval ? body.substring(2).trim() : body.substring(1).trim();

                    if (!evalCode && evalCommand !== '>') {
                        return m.reply(`*Cara penggunaan:*\n${evalCommand} <kode>`);
                    }

                    await m.react('⏳');

                    const util = await import('util');
                    const { exec } = await import('child_process');

                    if (evalCommand === '>' || evalCommand === '>>') {
                        let result;

                        const context = {
                            sock, m, util: util.default,
                            sender, senderNumber, botNumber, isGroup, pushName,
                            $user: user,
                            fs, path
                        };

                        const contextKeys = Object.keys(context);
                        const contextValues = Object.values(context);

                        if (evalCommand === '>>') {
                            const asyncFn = new Function(...contextKeys, `
                                return (async () => {
                                    try {
                                        return ${evalCode}
                                    } catch (e) {
                                        return e;
                                    }
                                })()
                            `);
                            result = await asyncFn(...contextValues);
                        } else {
                            const syncFn = new Function(...contextKeys, `
                                try {
                                    return ${evalCode}
                                } catch (e) {
                                    return e;
                                }
                            `);
                            result = syncFn(...contextValues);
                        }

                        const output = util.default.inspect(result, {
                            depth: 3,
                            colors: false,
                            maxArrayLength: 50
                        });

                        await m.react('✅');

                        if (output.length > 4000) {
                            await sock.sendMessage(m.key.remoteJid, {
                                document: Buffer.from(output, 'utf-8'),
                                mimetype: 'text/plain',
                                fileName: 'eval_result.txt',
                                caption: '📎 Hasil terlalu panjang'
                            }, { quoted: m });
                        } else {
                            await m.reply(`📦 *Output:*\n\`\`\`${output}\`\`\``);
                        }
                    }

                    else if (evalCommand === '$') {
                        exec(evalCode, {
                            timeout: 15000,
                            maxBuffer: 1024 * 2000,
                            shell: true
                        }, async (error, stdout, stderr) => {
                            let output = '';

                            if (error) output += `❌ *Error:* ${error.message}\n`;
                            if (stderr) output += `⚠️ *Stderr:*\n${stderr}\n`;
                            if (stdout) output += `✅ *Stdout:*\n${stdout}`;
                            if (!output) output = '✅ Command executed (no output)';

                            await m.react('✅');

                            if (output.length > 4000) {
                                await sock.sendMessage(m.key.remoteJid, {
                                    document: Buffer.from(output, 'utf-8'),
                                    mimetype: 'text/plain',
                                    fileName: 'exec_output.txt'
                                }, { quoted: m });
                            } else {
                                await m.reply(`💻 *Result:*\n\`\`\`${output}\`\`\``);
                            }
                        });
                    }

                    return;
                } catch (error) {
                    console.error('Eval Error:', error);
                    await m.react('❌');
                    await m.reply(`❌ *Error:*\n\`\`\`${error.message}\`\`\``);
                    return;
                }
            }
        }

        let groupMetadata = null;
        let isAdmin = false;
        let isBotAdmin = false;

        if (isGroup) {
            groupMetadata = await sock.groupMetadata(m.key.remoteJid);
            
            isAdmin = await isAdminUser(sock, groupMetadata.participants, senderJid) || isOwner;
            isBotAdmin = await isAdminUser(sock, groupMetadata.participants, botJid);
        }

        for (let plugin of Object.values(global.plugins)) {
            if (!plugin) continue;
            if (typeof plugin.all === 'function') {
                try {
                    if (plugin.__reloading) continue;
                    
                    await plugin.all(sock, m, {
                        body,
                        isCmd,
                        command,
                        prefix,
                        args,
                        text,
                        user,
                        isGroup,
                        sender: senderJid,
                        senderNumber,
                        botNumber,
                        isOwner,
                        pushName,
                        store,
                        isAdmin,
                        isBotAdmin
                    });
                } catch (e) {
                    if (e.message?.includes('is not a function')) continue;
                    console.error(chalk.bgRed.white('[ALL PLUGIN ERROR]'), e);
                }
            }
        }

        const beforePlugins = Object.values(global.plugins)
            .filter(p => typeof p?.before === 'function')
            .sort((a, b) => (a.priority ?? 10) - (b.priority ?? 10));

        for (let plugin of beforePlugins) {
            try {
                if (plugin.__reloading) continue;
                
                const stop = await plugin.before(sock, m, {
                    body,
                    isCmd,
                    command,
                    prefix,
                    args,
                    text,
                    user,
                    isGroup,
                    sender: senderJid,
                    senderNumber,
                    botNumber,
                    isOwner,
                    pushName,
                    store,
                    isAdmin,
                    isBotAdmin
                });

                if (stop) return;
            } catch (e) {
                if (e.message?.includes('is not a function')) continue;
                console.error(chalk.bgRed.white('[BEFORE ERROR]'), plugin.cmd || plugin.name || 'unknown', e);
            }
        }

        if (isCmd && global.logging?.commands) {
            console.log(chalk.bgMagenta.white('[CMD]'), chalk.green(command));
            console.log(chalk.cyan(`   ├─ Sender : ${normalizeJid(senderJid)}`));
            console.log(chalk.cyan(`   ├─ Group  : ${isGroup ? 'Yes' : 'No'}`));
            console.log(chalk.cyan(`   └─ IsOwner: ${isOwner}`));
        }

        if (isCmd && command) {
            let executed = false;

            for (let plugin of Object.values(global.plugins)) {
                if (!plugin) continue;
                if (!plugin.cmd && !plugin.before) continue;
                if (plugin.__reloading) continue;

                const isMatch = Array.isArray(plugin.cmd)
                    ? plugin.cmd.includes(command)
                    : plugin.cmd === command;

                if (!isMatch) continue;
                if (executed) break;

                if (plugin.hidden && !isOwner) {
                    await m.reply('🚧 Fitur dalam perbaikan');
                    executed = true;
                    break;
                }
                if (plugin.ownerOnly && !isOwner) {
                    await m.reply('❌ Khusus Owner!');
                    executed = true;
                    break;
                }
                if (plugin.groupOnly && !isGroup) {
                    await m.reply('❌ Khusus Grup!');
                    executed = true;
                    break;
                }
                if (plugin.adminOnly && !isAdmin && !isOwner) {
                    await m.reply('❌ Khusus Admin Grup!');
                    executed = true;
                    break;
                }
                if (plugin.botAdmin && !isBotAdmin) {
                    await m.reply('❌ Bot harus menjadi admin grup terlebih dahulu!\n\nCara: Jadikan bot sebagai admin grup melalui pengaturan grup WhatsApp.');
                    executed = true;
                    break;
                }
                if (plugin.register && !user.registered) {
                    await m.reply(`❌ Kamu belum terdaftar! Ketik *${prefix}register nama*`);
                    executed = true;
                    break;
                }
                if (plugin.premium && !isOwner && !user.premium) {
                    await m.reply('❌ Khusus Premium!');
                    executed = true;
                    break;
                }
                if (plugin.limit && !isOwner && !user.premium) {
                    if (user.limit < 1) {
                        await m.reply('❌ Limit habis!');
                        executed = true;
                        break;
                    }
                    user.limit -= 1;
                    await user.save();
                }

                try {
                    await plugin.run(sock, m, {
                        text,
                        args,
                        command,
                        prefix,
                        user,
                        isGroup,
                        isAdmin,
                        isBotAdmin,
                        isOwner,
                        sender: senderJid,
                        senderNumber,
                        pushName,
                        groupMetadata,
                        store,
                        participants: groupMetadata?.participants || []
                    });

                    executed = true;
                    break;

                } catch (e) {
                    if (e.message?.includes('is not a function')) {
                        console.log(chalk.yellow(`⚠️ Plugin ${command} sedang direload, skip`));
                        executed = true;
                        break;
                    }
                    console.error(`[PLUGIN ERROR] ${command}:`, e);
                    await sock.sendMessage(m.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: m });
                    executed = true;
                    break;
                }
            }

            if (!executed && isCmd) {
                await m.reply(`❌ Command "${command}" tidak ditemukan! Ketik .menu`);
            }
        }

    } catch (err) {
        console.error('Handler Error:', err);
    }
};

const __filename = new URL(import.meta.url).pathname;
fs.watchFile(__filename, () => {
    fs.unwatchFile(__filename);
    console.log(chalk.redBright(`🔄 ${__filename} updated, reloading...`));
    import(`${__filename}?update=${Date.now()}`);
});