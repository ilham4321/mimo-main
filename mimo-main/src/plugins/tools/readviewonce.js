export default {
    cmd: ['readviewonce', 'rvo', 'readonce'],
    tags: ['tools'],
    limit: true,
    run: async (sock, m, { prefix, command }) => {
        
        if (!m.quoted) {
            return m.reply(`📌 *Cara Penggunaan:*\nReply ke pesan *View Once* (sekali lihat) dengan perintah *${prefix + command}*\n\nContoh: ${prefix + command} (reply ke view once message)`);
        }

        // Cek apakah quoted message adalah view once
        const quotedMsg = m.quoted.message;
        let isViewOnce = false;
        let mediaBuffer = null;
        let mediaType = null;
        let mimeType = null;
        let caption = '';

        // Cek berbagai tipe pesan view once
        if (quotedMsg?.imageMessage?.viewOnce) {
            isViewOnce = true;
            mediaType = 'image';
            mimeType = quotedMsg.imageMessage.mimetype;
            caption = quotedMsg.imageMessage.caption || '';
            mediaBuffer = await m.quoted.download();
        } 
        else if (quotedMsg?.videoMessage?.viewOnce) {
            isViewOnce = true;
            mediaType = 'video';
            mimeType = quotedMsg.videoMessage.mimetype;
            caption = quotedMsg.videoMessage.caption || '';
            mediaBuffer = await m.quoted.download();
        }
        else if (quotedMsg?.audioMessage?.viewOnce) {
            isViewOnce = true;
            mediaType = 'audio';
            mimeType = quotedMsg.audioMessage.mimetype;
            caption = quotedMsg.audioMessage.caption || '';
            mediaBuffer = await m.quoted.download();
        }

        if (!isViewOnce) {
            return m.reply(`❌ *Bukan pesan View Once!*\nHarap reply ke pesan yang dikirim dengan mode *"Sekali Lihat"*.`);
        }

        if (!mediaBuffer) {
            return m.reply(`❌ *Gagal mendownload media!*\nCoba lagi nanti.`);
        }

        await m.react('⏳');

        try {
            // Kirim media berdasarkan tipe
            if (mediaType === 'image') {
                await sock.sendMessage(m.key.remoteJid, {
                    image: mediaBuffer,
                    caption: caption || '✅ *View Once Image*',
                    mimetype: mimeType
                }, { quoted: m });
            } 
            else if (mediaType === 'video') {
                await sock.sendMessage(m.key.remoteJid, {
                    video: mediaBuffer,
                    caption: caption || '✅ *View Once Video*',
                    mimetype: mimeType
                }, { quoted: m });
            }
            else if (mediaType === 'audio') {
                await sock.sendMessage(m.key.remoteJid, {
                    audio: mediaBuffer,
                    mimetype: mimeType,
                    ptt: false
                }, { quoted: m });
            }

            await m.react('✅');

        } catch (error) {
            console.error('ReadViewOnce error:', error);
            await m.react('❌');
            m.reply(`❌ *Gagal membaca pesan View Once*\n\nDetail: ${error.message}`);
        }
    }
};