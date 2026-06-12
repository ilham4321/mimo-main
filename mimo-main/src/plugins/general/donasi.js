import axios from 'axios'
import QRCode from 'qrcode'
import dotenv from 'dotenv'

dotenv.config()

export default {
    cmd: ['donasi', 'donate'],
    tags: ['general'],

    run: async (sock, m, { args, prefix }) => {

        await m.react('⏳')

        try {

            const API_KEY = process.env.PAKASIR_APIKEY
            const SLUG = process.env.PAKASIR_SLUG

            if (!API_KEY || !SLUG) {
                return m.reply(
                    '❌ PAKASIR_APIKEY / PAKASIR_SLUG belum diisi di .env'
                )
            }

            let amount = parseInt(args[0])

            if (!amount || isNaN(amount)) amount = 1000

            if (amount < 1000) {
                return m.reply(
                    `❌ Minimal donasi Rp1.000\n\nContoh:\n${prefix}donasi 5000`
                )
            }

            const orderId =
                'DONATE-' + Date.now()

            const payload = {
                project: SLUG,
                order_id: orderId,
                amount: amount,
                api_key: API_KEY
            }

            const { data } = await axios.post(
                'https://app.pakasir.com/api/transactioncreate/qris',
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )

            console.log(
                'Pakasir response:',
                JSON.stringify(data, null, 2)
            )

            if (
                !data ||
                !data.payment ||
                !data.payment.payment_number
            ) {
                return m.reply(
                    '❌ QRIS tidak ditemukan dari response Pakasir'
                )
            }

            const payment = data.payment

            const qrString =
                payment.payment_number

            const expired =
                new Date(
                    payment.expired_at
                ).toLocaleString('id-ID')

            const qrBuffer = await QRCode.toBuffer(
                qrString,
                {
                    width: 700,
                    margin: 2
                }
            )

            const caption = `
╭═━〔 💖 DONASI MIMOSA 💖 〕━═╮

Haiii 👋
Terima kasih sudah support
pengembangan *Mimosa Multi-Device* ✨

Donasi kamu membantu:
• Server tetap online
• Update fitur lebih cepat
• Development bot berjalan terus

┣━━━━━━━━━━━━━━━━━━━
┃ 💳 DETAIL PEMBAYARAN
┣━━━━━━━━━━━━━━━━━━━

┃ 🧾 ID Transaksi
┃ ${orderId}

┃ 💰 Nominal
┃ Rp${payment.amount.toLocaleString('id-ID')}

┃ 💸 Fee
┃ Rp${payment.fee.toLocaleString('id-ID')}

┃ 💵 Total Bayar
┃ Rp${payment.total_payment.toLocaleString('id-ID')}

┃ 📌 Metode
┃ QRIS All Payment

┃ ⏰ Expired
┃ ${expired}

┣━━━━━━━━━━━━━━━━━━━
┃ 📖 CARA PEMBAYARAN
┣━━━━━━━━━━━━━━━━━━━

┃ 1. Scan QRIS di atas
┃ 2. Bayar sesuai nominal
┃ 3. Tunggu pembayaran otomatis
┃    terdeteksi oleh sistem

╰═━〔 THANK YOU 💖 〕━═╯
            `.trim()

            await sock.sendMessage(
                m.key.remoteJid,
                {
                    image: qrBuffer,
                    caption: caption
                },
                {
                    quoted: global.fkontak2
                }
            )

            await m.react('✅')

            const checker = setInterval(async () => {

                try {

                    const checkUrl =
                        `https://app.pakasir.com/api/transactiondetail` +
                        `?project=${SLUG}` +
                        `&amount=${amount}` +
                        `&order_id=${orderId}` +
                        `&api_key=${API_KEY}`

                    const check =
                        await axios.get(checkUrl)

                    const trx =
                        check.data?.transaction

                    if (!trx) return

                    if (
                        trx.status === 'completed'
                    ) {

                        clearInterval(checker)

                        await sock.sendMessage(
                            m.key.remoteJid,
                            {
                                text: `
╭═━〔 ✅ DONASI BERHASIL 〕━═╮

Pembayaran berhasil diterima ✨

💖 Terima kasih telah
mendukung Mimosa MD

┣━━━━━━━━━━━━━━━━━━━
┃ 🧾 DETAIL DONASI
┣━━━━━━━━━━━━━━━━━━━

┃ ID :
┃ ${orderId}

┃ Nominal :
┃ Rp${amount.toLocaleString('id-ID')}

╰═━〔 THANK YOU 🤍 〕━═╯
                                `.trim()
                            },
                            {
                                quoted: global.fkontak2
                            }
                        )
                    }

                } catch (e) {
                    console.log(
                        'CHECKER ERROR:',
                        e.message
                    )
                }

            }, 15000)

        } catch (err) {

            console.log(
                'DONASI ERROR:',
                err.response?.data || err
            )

            await m.reply(
                `❌ Terjadi error\n\n${err.message}`
            )

            await m.react('❌')
        }
    }
}