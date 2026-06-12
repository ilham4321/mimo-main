export default {
    cmd: ['antilink'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,

    run: async (sock, m, { args }) => {
        const { Group, User } = await import('../../database/schema.js');
        const groupId = m.key.remoteJid;
        
        let groupData = await Group.findOne({ id: groupId });
        if (!groupData) {
            groupData = new Group({ id: groupId });
            await groupData.save();
        }
        
        if (args[0] === 'on') {
            groupData.antilink = true;
            await groupData.save();
            
            await sock.sendMessage(groupId, { 
                text: `✅ *ANTI LINK AKTIF!*\n\n⚠️ Dilarang mengirim link di grup ini.\n📋 Peringatan 3x akan dikeluarkan.`,
                contextInfo: {
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Anti Link Activated',
                        thumbnailUrl: 'https://telegra.ph/file/24fa902ead26340f3df2c.png',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fkontak2 });
        } 
        else if (args[0] === 'off') {
            groupData.antilink = false;
            await groupData.save();
            
            await sock.sendMessage(groupId, { 
                text: `❌ *ANTI LINK NONAKTIF!*\n\nLink bebas dikirim kembali.`,
                contextInfo: {
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Anti Link Deactivated',
                        thumbnailUrl: 'https://telegra.ph/file/24fa902ead26340f3df2c.png',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fkontak2 });
        }
        else {
            const status = groupData.antilink ? '✅ AKTIF' : '❌ NONAKTIF';
            await sock.sendMessage(groupId, { 
                text: `📋 *STATUS ANTI LINK*\n\n┌─❖\n│ Status: ${status}\n│\n├─❖\n│ *Cara penggunaan:*\n│ ├─ .antilink on\n│ └─ .antilink off\n╰─────────────────`,
                contextInfo: {
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: 'Anti Link Status',
                        thumbnailUrl: 'https://telegra.ph/file/24fa902ead26340f3df2c.png',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fkontak2 });
        }
    },
    
    all: async (sock, m, { isGroup, isAdmin, isBotAdmin, isOwner }) => {
        if (!isGroup) return;
        if (isAdmin || isOwner) return;
        if (!isBotAdmin) return;
        
        const { Group, User } = await import('../../database/schema.js');
        const groupId = m.key.remoteJid;
        
        const groupData = await Group.findOne({ id: groupId });
        if (!groupData || !groupData.antilink) return;
        
        let body = '';
        if (m.message?.conversation) body = m.message.conversation;
        else if (m.msg?.text) body = m.msg.text;
        else if (m.msg?.caption) body = m.msg.caption;
        
        if (!body) return;
        
        const linkPattern = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/i;
        const hasLink = linkPattern.test(body);
        
        if (!hasLink) return;
        
        const senderJid = m.key.participant || m.sender || m.key.remoteJid;
        if (!senderJid || senderJid.includes('@g.us')) return;
        
        const senderNumber = senderJid.split('@')[0];
        
        await sock.sendMessage(groupId, { delete: m.key });
        
        let user = await User.findOne({ jid: senderJid });
        if (!user) {
            user = new User({ jid: senderJid, phoneNumber: senderNumber });
            await user.save();
        }
        
        const currentWarn = user.warning || 0;
        const newWarn = currentWarn + 1;
        
        if (newWarn >= 3) {
            const groupMetadata = await sock.groupMetadata(groupId);
            
            let targetJidReal = null;
            for (const p of groupMetadata.participants) {
                if (p.id === senderJid || p.id.includes(senderNumber)) {
                    targetJidReal = p.id;
                    break;
                }
            }
            
            if (targetJidReal) {
                try {
                    await sock.groupParticipantsUpdate(groupId, [targetJidReal], 'remove');
                    await sock.sendMessage(groupId, { 
                        text: `🔨 @${senderNumber} *telah dikeluarkan!*\n📊 Peringatan: ${newWarn}/3\n📝 Alasan: Mengirim link 3x`,
                        mentions: [senderJid],
                        contextInfo: {
                            externalAdReply: {
                                title: 'MIMOSA BOT',
                                body: 'Anti Link - Kicked',
                                thumbnailUrl: 'https://telegra.ph/file/24fa902ead26340f3df2c.png',
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: global.fkontak2 });
                    user.warning = 0;
                    await user.save();
                } catch (err) {
                    await sock.sendMessage(groupId, { 
                        text: `❌ Gagal mengeluarkan @${senderNumber}: ${err.message}`,
                        mentions: [senderJid]
                    }, { quoted: global.fkontak2 });
                }
            } else {
                await sock.sendMessage(groupId, { 
                    text: `❌ Gagal: @${senderNumber} tidak ditemukan!`,
                    mentions: [senderJid]
                }, { quoted: global.fkontak2 });
            }
        } else {
            user.warning = newWarn;
            await user.save();
            
            await sock.sendMessage(groupId, { 
                text: `⚠️ *PERINGATAN ${newWarn}/3!*\n\n👤 @${senderNumber}\n📝 *Dilarang mengirim link di grup ini!*\n💡 Jika sudah 3x akan dikeluarkan.`,
                mentions: [senderJid],
                contextInfo: {
                    externalAdReply: {
                        title: 'MIMOSA BOT',
                        body: `Peringatan ${newWarn}/3`,
                        thumbnailUrl: 'https://telegra.ph/file/24fa902ead26340f3df2c.png',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fkontak2 });
        }
    }
};