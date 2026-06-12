import fs from 'fs'
import path from 'path'

export default {
    customPrefix: /^(bot|mybot|p)$/i,

    async all(sock, m) {
        const body =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            m.message?.videoMessage?.caption ||
            ''

        if (!this.customPrefix.test(body)) return

        const audioPath = path.join(process.cwd(), 'src', 'bot.mp3')

        // cek file ada
        if (!fs.existsSync(audioPath)) {
            return m.reply('Audio bot.mp3 tidak ditemukan di folder src/')
        }

        // kirim audio normal
        await sock.sendMessage(
            m.key.remoteJid,
            {
                audio: fs.readFileSync(audioPath),
                mimetype: 'audio/mpeg',
                ptt: false
            },
            {
                quoted: global.fkon
            }
        )

        setTimeout(async () => {
            await m.reply(
                'Apasi Kamu Mau Apasih?\nNaniyoo~ Hah!! Hah!! Apa? 😤'
            )
        }, 2000)
    }
}