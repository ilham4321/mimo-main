export default {
    cmd: ['hidetag', 'ht'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,

    run: async (sock, m, { text, groupMetadata, isBotAdmin }) => {
        if (!isBotAdmin) {
            return m.reply('❌ *Bot harus menjadi admin untuk menggunakan fitur ini!*');
        }
        
        if (!groupMetadata || !groupMetadata.participants) {
            return m.reply('❌ *Gagal mendapatkan daftar member!*');
        }
        
        const users = groupMetadata.participants.map(u => u.id);
        
        if (users.length === 0) {
            return m.reply('❌ *Tidak ada member di grup ini!*');
        }
        
        let msgText = text;
        
        if (!msgText || msgText.trim() === '') {
            msgText = '\u200B';
        }
        
        await sock.sendMessage(m.key.remoteJid, { 
            text: msgText, 
            mentions: users 
        }, { quoted: global.fVerif });
    }
};