import { Group } from '../database/schema.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mimosaPath = path.join(__dirname, '../mimosa.png');

const getThumbnail = () => {
    try {
        return fs.readFileSync(mimosaPath);
    } catch {
        return null;
    }
};

const normalizeJid = (jid) => {
    if (!jid) return null;
    if (typeof jid !== 'string') return null;
    return jid.replace(/:\d+@/, '@');
};

const extractNumber = (jid) => {
    if (!jid) return null;
    if (typeof jid !== 'string') return null;
    const normalized = normalizeJid(jid);
    if (!normalized) return null;
    return normalized.split('@')[0].replace(/[^0-9]/g, '');
};

const getPnFromLid = async (sock, lidJid) => {
    if (!lidJid) return null;
    if (typeof lidJid !== 'string') return null;
    const normalizedLid = normalizeJid(lidJid);
    if (!normalizedLid) return null;
    if (!normalizedLid.includes('@lid')) return normalizedLid;
    try {
        const pn = await sock.signalRepository?.lidMapping?.getPNForLID(normalizedLid);
        if (pn) return normalizeJid(pn);
    } catch (err) {}
    return normalizedLid;
};

const getDisplayNumber = async (sock, jid) => {
    if (!jid) return 'unknown';
    if (typeof jid !== 'string') return 'unknown';
    const normalizedJid = normalizeJid(jid);
    if (!normalizedJid) return 'unknown';
    const pn = await getPnFromLid(sock, normalizedJid);
    if (pn && pn.includes('@s.whatsapp.net')) {
        return pn.split('@')[0];
    }
    if (normalizedJid.includes('@s.whatsapp.net')) {
        return normalizedJid.split('@')[0];
    }
    const num = extractNumber(jid);
    return num || 'unknown';
};

const isValidUrl = (url) => {
    if (!url) return false;
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
};

const getWelcomeImage = async (username, guildName, memberCount, avatarUrl) => {
    const cleanUsername = String(username || 'User').substring(0, 30);
    const cleanGuildName = String(guildName || 'Grup').substring(0, 50);
    const cleanAvatarUrl = isValidUrl(avatarUrl) ? avatarUrl : 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
    const defaultBackground = 'https://i.ibb.co/4YBNyvP/mountain-sunset.jpg';
    const safeMemberCount = parseInt(memberCount) || 1;
    
    const apiUrl = `https://api.siputzx.my.id/api/canvas/welcomev5?username=${encodeURIComponent(cleanUsername)}&guildName=${encodeURIComponent(cleanGuildName)}&memberCount=${safeMemberCount}&avatar=${encodeURIComponent(cleanAvatarUrl)}&background=${encodeURIComponent(defaultBackground)}&quality=90`;
    
    try {
        const response = await axios.get(apiUrl, { 
            responseType: 'arraybuffer', 
            timeout: 7000
        });
        
        if (response.status === 200 && response.data && response.data.length > 1000) {
            return Buffer.from(response.data, 'binary');
        }
        return null;
    } catch (error) {
        return null;
    }
};

const getGoodbyeImage = async (username, guildName, memberCount, avatarUrl) => {
    const cleanUsername = String(username || 'User').substring(0, 30);
    const cleanGuildName = String(guildName || 'Grup').substring(0, 50);
    const cleanAvatarUrl = isValidUrl(avatarUrl) ? avatarUrl : 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
    const defaultBackground = 'https://i.ibb.co/4YBNyvP/images-76.jpg';
    
    const apiUrl = `https://api.siputzx.my.id/api/canvas/goodbyev4?avatar=${encodeURIComponent(cleanAvatarUrl)}&background=${encodeURIComponent(defaultBackground)}&title=Goodbye&description=${encodeURIComponent(`${cleanUsername} telah meninggalkan ${cleanGuildName}`)}&border=%232a2e35&avatarBorder=%232a2e35&overlayOpacity=0.3`;
    
    try {
        const response = await axios.get(apiUrl, { 
            responseType: 'arraybuffer', 
            timeout: 15000
        });
        
        if (response.status === 200 && response.data && response.data.length > 1000) {
            return Buffer.from(response.data, 'binary');
        }
        return null;
    } catch (error) {
        return null;
    }
};

const groupHandler = async (sock, update) => {
    try {
        let { id, participants, action } = update;
        
        if (!id) return;
        if (!participants || !Array.isArray(participants) || participants.length === 0) return;
        
        let participantIds = [];
        for (const p of participants) {
            if (typeof p === 'string') {
                participantIds.push(p);
            } else if (p && typeof p === 'object' && p.id) {
                participantIds.push(p.id);
            } else if (p && typeof p === 'object' && p.phoneNumber) {
                participantIds.push(p.phoneNumber);
            }
        }
        
        if (participantIds.length === 0) return;
        
        let actorId = null;
        if (update.author) {
            actorId = typeof update.author === 'string' ? update.author : update.author?.id;
        } else if (update.actor) {
            actorId = typeof update.actor === 'string' ? update.actor : update.actor?.id;
        }
        
        const normalizedId = normalizeJid(id);
        if (!normalizedId) return;
        
        let groupData = await Group.findOne({ id: normalizedId });
        if (!groupData) {
            groupData = new Group({
                id: normalizedId,
                welcome: true,
                welcomeMessage: '👋 Selamat datang @user di grup @group',
                leaveMessage: '👋 Selamat tinggal @user'
            });
            await groupData.save();
        }
        
        if (!groupData.welcome) return;
        
        let metadata;
        try {
            metadata = await sock.groupMetadata(normalizedId);
        } catch (err) {
            return;
        }
        
        const groupName = metadata.subject || 'Grup';
        const memberCount = metadata.participants?.length || 0;
        
        for (const participantId of participantIds) {
            const normalizedParticipantId = normalizeJid(participantId);
            if (!normalizedParticipantId) continue;
            
            const displayNumber = await getDisplayNumber(sock, normalizedParticipantId);
            
            let ppUser;
            try {
                ppUser = await sock.profilePictureUrl(normalizedParticipantId, 'image');
            } catch {
                ppUser = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
            }
            
            const welcomeMsg = groupData.welcomeMessage || '👋 Selamat datang @user di grup @group';
            const leaveMsg = groupData.leaveMessage || '👋 Selamat tinggal @user';
            
            if (action === 'add') {
                let textWelcome = welcomeMsg
                    .replace('@user', `@${displayNumber}`)
                    .replace('@group', groupName);
                
                const imageBuffer = await getWelcomeImage(displayNumber, groupName, memberCount, ppUser);
                
                if (imageBuffer) {
                    await sock.sendMessage(normalizedId, {
                        image: imageBuffer,
                        caption: textWelcome,
                        mentions: [normalizedParticipantId]
                    });
                } else {
                    await sock.sendMessage(normalizedId, {
                        text: textWelcome,
                        mentions: [normalizedParticipantId]
                    });
                }
            }
            
            else if (action === 'remove') {
                let textGoodbye = leaveMsg.replace('@user', `@${displayNumber}`);
                
                const imageBuffer = await getGoodbyeImage(displayNumber, groupName, memberCount, ppUser);
                
                if (imageBuffer) {
                    await sock.sendMessage(normalizedId, {
                        image: imageBuffer,
                        caption: textGoodbye,
                        mentions: [normalizedParticipantId]
                    });
                } else {
                    await sock.sendMessage(normalizedId, {
                        text: textGoodbye,
                        mentions: [normalizedParticipantId]
                    });
                }
            }
            
            else if (action === 'promote') {
                let actorNumber = '';
                if (actorId) {
                    const normalizedActor = normalizeJid(actorId);
                    actorNumber = await getDisplayNumber(sock, normalizedActor);
                }
                
                let textPromote;
                if (actorNumber && actorNumber !== 'unknown') {
                    textPromote = `👑 @${displayNumber} telah dijadikan admin oleh @${actorNumber}!`;
                } else {
                    textPromote = `👑 @${displayNumber} telah dijadikan admin!`;
                }
                
                const mentions = [normalizedParticipantId];
                if (actorId && actorNumber && actorNumber !== 'unknown') {
                    mentions.push(normalizeJid(actorId));
                }
                
                await sock.sendMessage(normalizedId, {
                    text: textPromote,
                    mentions: mentions
                });
            }
            
            else if (action === 'demote') {
                let actorNumber = '';
                if (actorId) {
                    const normalizedActor = normalizeJid(actorId);
                    actorNumber = await getDisplayNumber(sock, normalizedActor);
                }
                
                let textDemote;
                if (actorNumber && actorNumber !== 'unknown') {
                    textDemote = `👎 @${displayNumber} telah diturunkan dari admin oleh @${actorNumber}!`;
                } else {
                    textDemote = `👎 @${displayNumber} telah diturunkan dari admin!`;
                }
                
                const mentions = [normalizedParticipantId];
                if (actorId && actorNumber && actorNumber !== 'unknown') {
                    mentions.push(normalizeJid(actorId));
                }
                
                await sock.sendMessage(normalizedId, {
                    text: textDemote,
                    mentions: mentions
                });
            }
        }
    } catch (err) {
        console.error(err);
    }
};

export default groupHandler;