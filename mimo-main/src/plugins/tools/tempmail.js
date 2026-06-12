import { tempmail } from '../../lib/tempmail.js';

// Memory sementara (hilang jika bot restart)
const userMails = new Map();

export default {
    cmd: ['tempmail', 'mail', 'emailtemp'],
    tags: ['tools'],
    limit: true,
    run: async (sock, m, { prefix, command, args }) => {
        
        const subCommand = args[0]?.toLowerCase();
        const sender = m.key.remoteJid;
        
        // Buat email baru
        if (!subCommand || subCommand === 'create' || subCommand === 'new') {
            await m.react('⏳');
            
            try {
                const result = await tempmail.create();
                
                if (!result.success || !result.result?.data) {
                    throw new Error('Gagal membuat email');
                }
                
                const emailData = result.result.data;
                const email = emailData.email;
                const token = emailData.email_token;
                const expired = emailData.expired || '24 jam';
                
                // Simpan ke memory
                userMails.set(sender, { email, token, expired });
                
                const message = `📧 *EMAIL TEMPORER BERHASIL DIBUAT*
                
📫 *Email:* ${email}
🔑 *Token:* ${token}
⏰ *Expired:* ${expired}

📌 *Perintah selanjutnya:*
• ${prefix}tempmail inbox - Cek pesan masuk
• ${prefix}tempmail read <nomor> - Baca detail pesan

💡 *Token tersimpan otomatis untuk akun ini*`;

                await sock.sendMessage(m.key.remoteJid, {
                    text: message
                }, { quoted: m });
                
                await m.react('✅');
                
            } catch (error) {
                console.error('Create email error:', error);
                await m.react('❌');
                m.reply(`❌ Gagal membuat email: ${error.message}`);
            }
            return;
        }
        
        // Cek inbox
        if (subCommand === 'inbox' || subCommand === 'cek') {
            const userData = userMails.get(sender);
            const token = userData?.token;
            const email = userData?.email;
            
            if (!token) {
                return m.reply(`📌 Belum punya email temporer\nBuat dulu dengan *${prefix}tempmail create*`);
            }
            
            await m.react('⏳');
            
            try {
                const result = await tempmail.cekInbox(token);
                const messages = result.result?.data || [];
                
                if (messages.length === 0) {
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `📭 *INBOX KOSONG*
                        
📧 Email: ${email}
🔑 Token: ${token}

Belum ada pesan masuk. Coba cek lagi nanti.`
                    }, { quoted: m });
                    await m.react('✅');
                    return;
                }
                
                let inboxText = `📬 *INBOX TEMPORER*
📧 ${email}
📨 Total: ${messages.length} pesan

`;
                
                for (let i = 0; i < messages.length; i++) {
                    const msg = messages[i];
                    inboxText += `[${i}] 📩 ${msg.from || 'Unknown'}
   📝 ${msg.subject || 'No Subject'}
   🕐 ${msg.date || 'Unknown'}
   🔍 Ketik: ${prefix}tempmail read ${i}

`;
                }
                
                await sock.sendMessage(m.key.remoteJid, {
                    text: inboxText
                }, { quoted: m });
                
                await m.react('✅');
                
            } catch (error) {
                await m.react('❌');
                m.reply(`❌ Gagal cek inbox: ${error.message}`);
            }
            return;
        }
        
        // Baca pesan detail
        if (subCommand === 'read') {
            const index = parseInt(args[1]);
            const userData = userMails.get(sender);
            const token = userData?.token;
            
            if (isNaN(index)) {
                return m.reply(`📌 Cara pakai: ${prefix}tempmail read <nomor_pesan>\nContoh: ${prefix}tempmail read 0`);
            }
            
            if (!token) {
                return m.reply(`📌 Buat email dulu dengan *${prefix}tempmail create*`);
            }
            
            await m.react('⏳');
            
            try {
                const result = await tempmail.cekInbox(token);
                const messages = result.result?.data || [];
                
                if (index >= messages.length) {
                    return m.reply(`❌ Pesan nomor ${index} tidak ada. Total pesan: ${messages.length}`);
                }
                
                const msg = messages[index];
                
                const detailText = `📧 *DETAIL PESAN*
                
📩 *Pengirim:* ${msg.from || 'Unknown'}
📝 *Subjek:* ${msg.subject || 'No Subject'}
🕐 *Waktu:* ${msg.date || 'Unknown'}

📄 *Isi Pesan:*
${msg.body || msg.preview || 'Tidak ada konten'}`;

                await sock.sendMessage(m.key.remoteJid, {
                    text: detailText
                }, { quoted: m });
                
                await m.react('✅');
                
            } catch (error) {
                await m.react('❌');
                m.reply(`❌ Gagal baca pesan: ${error.message}`);
            }
            return;
        }
        
        // Help
        const helpText = `📧 *TEMPMAIL - EMAIL TEMPORER*

📌 *Perintah:*
• ${prefix}tempmail create - Buat email baru
• ${prefix}tempmail inbox - Cek pesan masuk
• ${prefix}tempmail read <nomor> - Baca detail pesan

📝 *Contoh:*
1️⃣ ${prefix}tempmail create
2️⃣ ${prefix}tempmail inbox
3️⃣ ${prefix}tempmail read 0

⏰ Email expired setelah 24 jam
💾 Token tersimpan otomatis (selama bot nyala)`;

        await sock.sendMessage(m.key.remoteJid, {
            text: helpText
        }, { quoted: m });
    }
};