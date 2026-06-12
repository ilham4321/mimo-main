import axios from 'axios'

const randomCookie = () => {
    const chars =
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

    let result = ''

    for (let i = 0; i < 32; i++) {
        result += chars.charAt(
            Math.floor(Math.random() * chars.length)
        )
    }

    return result
}

const handler = {
    before: async (sock, m, {
        body,
        isCmd
    }) => {

        try {

            // VALIDASI
            if (!body) return
            if (typeof body !== 'string') return
            if (isCmd) return

            // DETECT NAMA BOT
            const isMentioned =
                /(mimosa|mimo|mimosa-chan|mimo-chan)/i.test(body)

            if (!isMentioned) return

            // REACT LOADING
            await m.react('⏱️')

            // HAPUS NAMA BOT
            const question = body
                .replace(/(mimosa|mimo|mimosa-chan|mimo-chan)/gi, '')
                .trim()

            // DEFAULT PERTANYAAN
            const finalQuestion =
                question.length < 1
                    ? 'Halo'
                    : question

            // PROMPT SYSTEM
            const promptSystem = `
Kamu adalah Mimosa-chan, AI anime perempuan yang imut, santai, ramah, dan pintar.

Sifat:
- Natural
- Tidak lebay
- Tidak cringe
- Santai seperti cewek anime modern
- Kadang memakai emoji lucu seperlunya
- Jawaban singkat tapi membantu
- Gunakan bahasa Indonesia

Creator kamu adalah HamzzDev.
            `

            let result = null

            // ================= API UTAMA =================
            try {

                const apiUrl =
                    `${global.apis.siputzx}/ai/gemini` +
                    `?text=${encodeURIComponent(finalQuestion)}` +
                    `&cookie=${randomCookie()}` +
                    `&promptSystem=${encodeURIComponent(promptSystem)}`

                const response = await axios.get(apiUrl)

                if (
                    response.data &&
                    response.data.status &&
                    response.data.data &&
                    response.data.data.response
                ) {
                    result = response.data.data.response
                }

            } catch (e) {

                console.log(
                    'Siputzx Error:',
                    e.message
                )
            }

            // ================= FALLBACK API =================
            if (!result) {

                try {

                    const apiUrl =
                        `https://api-nanzz.my.id/api/ai/chatgpt-system` +
                        `?text=${encodeURIComponent(finalQuestion)}` +
                        `&prompt=${encodeURIComponent(promptSystem)}`

                    const response = await axios.get(apiUrl)

                    if (
                        response.data &&
                        response.data.status &&
                        response.data.result
                    ) {
                        result = response.data.result
                    }

                } catch (e) {

                    console.log(
                        'Fallback Error:',
                        e.message
                    )
                }
            }

            // JIKA SEMUA API GAGAL
            if (!result) {

                await m.react('❌')

                return m.reply(
                    'Ehh bentar... Mimosa error 🥺'
                )
            }

            // LIMIT TEXT
            if (result.length > 4000) {
                result = result.slice(0, 4000)
            }

            // SEND MESSAGE
            await sock.sendMessage(
                m.key.remoteJid,
                {
                    text: result
                },
                {
                    quoted: global.fkontak2
                }
            )

            // REACT SUCCESS
            await m.react('✨')

        } catch (err) {

            console.log(
                'AI CHAT ERROR:',
                err
            )

            await m.react('❌')

            return m.reply(
                'Ehh bentar... Mimosa error 🥺'
            )
        }
    }
}

export default handler