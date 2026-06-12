import { User } from '../../database/schema.js';

export default {
    cmd: ['addprem', 'delprem'],
    tags: ['owner'],
    ownerOnly: true, // Hanya untuk HamzzDev

    run: async (sock, m, { args, command, prefix }) => {
        // 1. Validasi awal agar tidak error 'reading 0'
        if (!m.quoted && !args[0]) {
            return m.reply(`*Format Salah!*\n\nContoh:\n• ${prefix + command} @user 30\n• ${prefix + command} 628xxx\n• Balas chat dengan ${prefix + command} 7`);
        }

        let jid;
        let day;

        // 2. Logika pengambilan JID yang lebih aman
        if (m.quoted) {
            jid = m.quoted.sender;
            day = args[0]; 
        } else {
            // Cek apakah ada mention, jika tidak ambil dari args[0]
            jid = (m.mentions && m.mentions[0]) ? m.mentions[0] : (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
            day = args[1]; 
        }

        // Pastikan JID berhasil didapatkan sebelum lanjut
        if (!jid || !jid.endsWith('@s.whatsapp.net')) {
            return m.reply('❌ Gagal mendapatkan ID pengguna. Pastikan kamu tag orangnya atau balas pesannya.');
        }

        try {
            let user = await User.findOne({ phoneNumber: jid });
            if (!user) user = new User({ phoneNumber: jid, registered: false });

            if (command === 'addprem') {
                const isUnlimited = !day || isNaN(day);
                const durationMs = isUnlimited ? null : parseInt(day) * 24 * 60 * 60 * 1000;
                
                const now = Date.now();
                const currentExpire = (user.premiumTime && user.premiumTime > now) ? user.premiumTime : now;
                
                user.premium = true;
                user.premiumTime = isUnlimited ? 0 : currentExpire + durationMs; 
                await user.save();

                const expiredText = isUnlimited ? 'PERMANEN ♾️' : new Date(user.premiumTime).toLocaleString('id-ID');
                
                await m.reply(`✅ *ADD PREM SUKSES*\n\n👤 User: @${jid.split('@')[0]}\n⏳ Durasi: ${isUnlimited ? 'Unlimited' : day + ' Hari'}\n📅 Hingga: ${expiredText}`, {
                    mentions: [jid]
                });

                await sock.sendMessage(jid, { 
                    text: `🎊 *PREMIUM AKTIF!*\nKamu sekarang adalah member *Premium*\nDurasi: ${isUnlimited ? 'Permanen' : day + ' Hari'}\nExpired: ${expiredText}` 
                });
            }

            if (command === 'delprem') {
                user.premium = false;
                user.premiumTime = 0;
                await user.save();
                await m.reply(`🗑️ Status Premium @${jid.split('@')[0]} telah dicabut.`, { mentions: [jid] });
            }

        } catch (e) {
            console.error(e);
            m.reply('❌ Terjadi kesalahan sistem.');
        }
    }
};