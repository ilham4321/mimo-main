export default {
    cmd: ['add', 'invite'],
    tags: ['group'],
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,

    run: async (sock, m, { args, isBotAdmin, isOwner }) => {
        if (!isBotAdmin && !isOwner) {
            return m.reply('❌ Bot harus menjadi admin untuk menambah anggota!');
        }
        
        if (!args || args.length === 0) {
            return m.reply('❌ Masukkan nomor yang ingin ditambahkan!\n\n*Contoh:* .add 6281234567890\n*Multiple:* .add 6281111111111 6282222222222');
        }
        
        let nomorList = [];
        let successList = [];
        let failList = [];
        
        for (let arg of args) {
            let nomor = arg.replace(/[^0-9]/g, '');
            if (nomor) {
                if (nomor.startsWith('0')) {
                    nomor = '62' + nomor.slice(1);
                }
                if (!nomor.startsWith('62')) {
                    nomor = '62' + nomor;
                }
                nomorList.push(nomor);
            }
        }
        
        if (nomorList.length === 0) {
            return m.reply('❌ Nomor tidak valid!');
        }
        
        await m.reply(`⏳ *Menambahkan ${nomorList.length} nomor...*`);
        
        for (const nomor of nomorList) {
            const targetJid = nomor + '@s.whatsapp.net';
            
            try {
                await sock.groupParticipantsUpdate(m.key.remoteJid, [targetJid], 'add');
                successList.push(`✅ @${nomor}`);
            } catch (err) {
                failList.push(`❌ @${nomor} - ${err.message.includes('406') ? 'No WhatsApp' : err.message.slice(0, 30)}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        let result = '📊 *HASIL TAMBAH ANGGOTA*\n\n';
        if (successList.length > 0) {
            result += `✅ *Berhasil (${successList.length}):*\n${successList.join('\n')}\n\n`;
        }
        if (failList.length > 0) {
            result += `❌ *Gagal (${failList.length}):*\n${failList.join('\n')}`;
        }
        
        await m.reply(result);
    }
};