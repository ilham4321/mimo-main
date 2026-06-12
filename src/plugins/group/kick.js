export default {
    cmd: ['kick'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,

    run: async (sock, m, { args, isBotAdmin, isOwner, groupMetadata }) => {
        if (!isBotAdmin && !isOwner) {
            return m.reply('❌ Bot harus jadi admin!');
        }
        
        let target = m.quoted?.sender || args[0]?.replace(/[^0-9]/g, '');
        
        if (!target) {
            return m.reply('❌ Balas pesan target!\n\nContoh: .kick @user');
        }
        
        if (!target.includes('@')) {
            target = target + '@s.whatsapp.net';
        }
        
        const groupId = m.key.remoteJid;
        const targetNumber = target.split('@')[0];
        
        let targetFound = false;
        let targetJidReal = null;
        
        for (const p of groupMetadata.participants) {
            if (p.id === target || p.id.includes(targetNumber)) {
                targetFound = true;
                targetJidReal = p.id;
                break;
            }
        }
        
        if (!targetFound) {
            return m.reply(`❌ Target @${targetNumber} tidak ditemukan di grup!`, { mentions: [target] });
        }
        
        // Cek apakah target admin
        const isTargetAdmin = groupMetadata.participants.some(p => 
            (p.id === target || p.id.includes(targetNumber)) && 
            (p.admin === 'admin' || p.admin === 'superadmin')
        );
        
        if (isTargetAdmin && !isOwner) {
            return m.reply(`❌ @${targetNumber} adalah admin, tidak bisa dikick!`, { mentions: [target] });
        }
        
        await m.react('⏳');
        
        try {
            await sock.groupParticipantsUpdate(groupId, [targetJidReal || target], 'remove');
            await m.reply(`✅ @${targetNumber} berhasil dikeluarkan!`, { mentions: [target] });
            await m.react('✅');
        } catch (err) {
            console.error('Kick error:', err);
            
            // Coba dengan format lain
            try {
                const altTarget = targetNumber + '@s.whatsapp.net';
                await sock.groupParticipantsUpdate(groupId, [altTarget], 'remove');
                await m.reply(`✅ @${targetNumber} berhasil dikeluarkan!`, { mentions: [target] });
                await m.react('✅');
            } catch (err2) {
                await m.reply(`❌ Gagal mengeluarkan @${targetNumber}!\n\nError: ${err.message || err2.message}`, { mentions: [target] });
                await m.react('❌');
            }
        }
    }
};