import { Group } from '../../database/schema.js';

export default {
    cmd: ['welcome', 'antilink'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,

    run: async (sock, m, { args, command, prefix }) => {
        const chatId = m.key.remoteJid;
        
        // 1. Ambil Data Grup dari Database (Buat jika belum ada)
        let group = await Group.findOne({ id: chatId });
        if (!group) {
            group = new Group({ id: chatId });
            await group.save();
        }

        // 2. Cek Input User
        if (!args[0]) {
            return sock.sendMessage(chatId, { 
                text: `❌ Format Salah!\n\nContoh:\n${prefix}welcome on\n${prefix}antilink on\n${prefix}welcome off` 
            }, { quoted: m });
        }

        const option = args[0].toLowerCase();
        if (option !== 'on' && option !== 'off') {
            return sock.sendMessage(chatId, { text: 'Pilih *on* atau *off*.' }, { quoted: m });
        }

        const isEnable = option === 'on';

        // 3. Simpan Pengaturan
        if (command === 'welcome') {
            group.welcome = isEnable;
            await group.save();
            await sock.sendMessage(chatId, { 
                text: `✅ Fitur Welcome berhasil di-${isEnable ? 'AKTIFKAN' : 'MATIKAN'}` 
            }, { quoted: m });
        } 
        else if (command === 'antilink') {
            group.antilink = isEnable;
            await group.save();
            await sock.sendMessage(chatId, { 
                text: `✅ Antilink berhasil di-${isEnable ? 'AKTIFKAN' : 'MATIKAN'}` 
            }, { quoted: m });
        }
    }
};
