import { toSmallCaps } from '../../font.js';

export default {
    cmd: ['cekidch', 'idch', 'channelid'],
    tags: ['tools'],
    run: async (sock, m, { text, prefix, command }) => {
        // 1. Validasi Link
        if (!text || !text.includes('https://whatsapp.com/channel/')) {
            return m.reply(toSmallCaps(`*${toSmallCaps('format salah')}!*\n${toSmallCaps('contoh')}: ${prefix + command} https://whatsapp.com/channel/xxxxx`));
        }

        await m.react('⏳');

        try {
            // 2. Ekstrak Invite Code dari Link
            const inviteCode = text.split('https://whatsapp.com/channel/')[1]?.split(/[\s?]/)[0];
            
            if (!inviteCode) {
                await m.react('❌');
                return m.reply(toSmallCaps('❌ gagal mengekstrak kode undangan.'));
            }

            // 3. Ambil Metadata dari WhatsApp Server
            // Fungsi newsletterMetadata tersedia di library Baileys kamu
            const metadata = await sock.newsletterMetadata('invite', inviteCode);

            if (!metadata?.id) {
                await m.react('❌');
                return m.reply(toSmallCaps('❌ saluran tidak ditemukan atau link sudah kedaluwarsa.'));
            }

            // 4. Susun Informasi dengan gaya Smallcaps
            let caption = `📺 *${toSmallCaps('channel info')}*\n\n`;
            caption += `┌  🆔 *${toSmallCaps('id')}* : \`${metadata.id}\`\n`;
            caption += `│  📝 *${toSmallCaps('nama')}* : ${metadata.name || 'Unknown'}\n`;
            caption += `│  👥 *${toSmallCaps('subscriber')}* : ${metadata.subscribers || 0}\n`;
            caption += `└  🕒 *${toSmallCaps('status')}* : ${metadata.verification === 'VERIFIED' ? '✅ Verified' : 'Regular'}\n\n`;
            
            caption += `> ${toSmallCaps('salin id di atas untuk pengaturan newsletter')}\n\n`;
            caption += `*_© ${toSmallCaps('mimosa multi-device')}_*`;

            // 5. Kirim Pesan dengan Context Info Saluran Mimosa
            await sock.sendMessage(m.key.remoteJid, {
                text: caption,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363204362148135@newsletter',
                        newsletterName: 'Mimosa Multi-Device✨',
                        serverMessageId: 100
                    },
                    externalAdReply: {
                        title: toSmallCaps("channel id detector"),
                        body: metadata.name,
                        thumbnailUrl: "https://files.catbox.moe/2mq5qq.png", 
                        sourceUrl: text,
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });

            await m.react('✅');

        } catch (error) {
            console.error(error);
            await m.react('❌');
            m.reply(toSmallCaps(`❌ *error*: ${error.message}`));
        }
    }
};