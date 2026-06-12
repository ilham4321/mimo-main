import { User } from '../../database/schema.js';

export default {
    cmd: ['addmoney', 'delmoney'],
    tags: ['owner'],
    ownerOnly: true, // Hanya HamzzDev yang bisa akses

    run: async (sock, m, { args, command, prefix }) => {
        if (!m.quoted && !args[0]) {
            return m.reply(`*Format Salah!*\n\nContoh: ${prefix + command} @user 5000`);
        }

        let jid;
        let amount;

        if (m.quoted) {
            jid = m.quoted.sender;
            amount = args[0]; 
        } else {
            jid = (m.mentions && m.mentions[0]) ? m.mentions[0] : (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
            amount = args[1]; 
        }

        if (!jid || !jid.endsWith('@s.whatsapp.net')) {
            return m.reply('❌ Gagal mendapatkan ID pengguna.');
        }

        if (!amount || isNaN(amount)) {
            return m.reply('❌ Masukkan jumlah angka yang valid.');
        }

        const totalAmount = parseInt(amount);

        try {
            let user = await User.findOne({ phoneNumber: jid });
            if (!user) user = new User({ phoneNumber: jid });

            // Pastikan objek rpg ada agar tidak error undefined
            if (!user.rpg) {
                user.rpg = { level: 1, exp: 0, money: 1000, inventory: [] };
            }

            if (command === 'addmoney') {
                // UPDATE DISINI: Mengakses user.rpg.money
                user.rpg.money = (user.rpg.money || 0) + totalAmount;
                
                // Beri tahu Mongoose bahwa ada perubahan pada sub-document/objek
                user.markModified('rpg'); 
                await user.save();

                await m.reply(`✅ *BERHASIL TAMBAH SALDO*\n\n👤 User: @${jid.split('@')[0]}\n💰 Ditambah: +${totalAmount.toLocaleString()}\n💳 Total Saldo RPG: ${user.rpg.money.toLocaleString()}`, {
                    mentions: [jid]
                });
            }

            if (command === 'delmoney') {
                user.rpg.money = Math.max(0, (user.rpg.money || 0) - totalAmount);
                user.markModified('rpg');
                await user.save();
                
                await m.reply(`🗑️ *SALDO DIKURANGI*\n\n👤 User: @${jid.split('@')[0]}\n💳 Sisa Saldo: ${user.rpg.money.toLocaleString()}`, {
                    mentions: [jid]
                });
            }

        } catch (e) {
            console.error(e);
            m.reply('❌ Terjadi kesalahan database.');
        }
    }
};