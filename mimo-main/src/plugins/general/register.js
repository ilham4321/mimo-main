import crypto from 'crypto'

global.dbCaptcha = global.dbCaptcha || {}

export default {
    name: 'register',
    cmd: ['register', 'reg', 'daftar'],
    tags: ['general'],
    help: ['register nama.umur'],

    run: async (sock, m, {
        text,
        user,
        sender,
        pushName
    }) => {

        // ==================== SUDAH REGISTER ====================
        if (user.registered) {
            return m.reply(`
╭─〔 ✅ SUDAH TERDAFTAR 〕
│
│ 👤 Nama : ${user.name || pushName}
│ 🎂 Umur : ${user.age || '-'}
│ 📅 Status : Verified
│
╰───────────────
`)
        }

        // ==================== VALIDASI INPUT ====================
        if (!text) {
            return m.reply(`
╭─〔 📖 CARA REGISTER 〕
│
│ Gunakan format:
│
│ .register nama.umur
│
│ Contoh:
│ .register HamzzDev.18
│
╰───────────────
`)
        }

        let [nama, umur] = text.split('.')

        if (!nama || !umur) {
            return m.reply(`
❌ Format salah!

Contoh:
.register HamzzDev.18
`)
        }

        umur = parseInt(umur)

        if (isNaN(umur)) {
            return m.reply('❌ Umur harus berupa angka!')
        }

        if (umur < 5 || umur > 80) {
            return m.reply('❌ Umur tidak valid!')
        }

        // ==================== CAPTCHA ====================
        const a = Math.floor(Math.random() * 10)
        const b = Math.floor(Math.random() * 10)

        const hasil = a + b

        global.dbCaptcha[sender] = {
            nama,
            umur,
            jawaban: hasil,
            expired: Date.now() + 60000
        }

        await m.reply(`
╭─〔 🔐 VERIFIKASI CAPTCHA 〕
│
│ Halo *${nama}*
│
│ Jawab pertanyaan berikut:
│
│ ${a} + ${b} = ?
│
│ Balas dengan angka
│
│ ⏱️ Timeout: 60 detik
│
╰───────────────
`)
    },

    all: async (sock, m, {
        user,
        sender,
        pushName
    }) => {

        if (!global.dbCaptcha[sender]) return

        const data = global.dbCaptcha[sender]

        // ==================== EXPIRED ====================
        if (Date.now() > data.expired) {
            delete global.dbCaptcha[sender]

            return m.reply(`
❌ CAPTCHA EXPIRED

Silahkan register ulang.
`)
        }

        const body =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            ''

        if (!body) return

        // Abaikan command
        if (/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(body)) return

        // ==================== CEK JAWABAN ====================
        if (parseInt(body) !== data.jawaban) return

        // ==================== SAVE DATABASE ====================
        user.name = data.nama
        user.age = data.umur
        user.registered = true
        user.regTime = Date.now()

        // ID random
        user.serial = crypto.randomBytes(8).toString('hex')

        await user.save()

        delete global.dbCaptcha[sender]

        // ==================== SUKSES ====================
        await m.reply(`
╭─〔 ✅ REGISTER BERHASIL 〕
│
│ 👤 Nama : ${data.nama}
│ 🎂 Umur : ${data.umur}
│ 📅 Status : Verified
│
│ Selamat bergabung di
│ ✨ MIMOSA BOT
│
╰───────────────
`)
    }
}