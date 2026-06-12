<p align="center">
  <img src="src/mimosa.png" alt="Mimosa Bot" width="250" height="250">
</p>

<h1 align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=32&duration=3000&pause=500&color=F7A8C4&center=true&vCenter=true&width=500&lines=MIMOSA+MULTI-DEVICE;WhatsApp+Bot;Simple+%7C+Fast+%7C+Secure" alt="Typing SVG" />
</h1>

<p align="center">
  <a href="https://github.com/eatmyd180/mimo">
    <img src="https://img.shields.io/badge/Version-7.0.0-blue?style=for-the-badge">
  </a>
  <a href="https://github.com/eatmyd180/mimo">
    <img src="https://img.shields.io/badge/Node.js-20.x-green?style=for-the-badge">
  </a>
  <a href="https://github.com/eatmyd180/mimo">
    <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge">
  </a>
  <a href="https://github.com/eatmyd180/mimo">
    <img src="https://img.shields.io/badge/Made%20with-☕-red?style=for-the-badge">
  </a>
</p>

---

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&duration=2000&pause=500&color=F7A8C4&center=true&vCenter=true&width=435&lines=HamzzDev;Mimosa+Multi-Device;Always+Updated" alt="Typing SVG" />
</p>

---

## ✍️ About

**Mimosa Multi-Device** is a feature-rich WhatsApp bot built with **[Baileys](https://github.com/@whiskeysockets/baileys)**. Designed to be fast, secure, and easy to use.

---

## ✨ Features

- ✅ **Multi-Device Support** - Scan QR or use Pairing Code
- ✅ **Pairing Code** - Easy login without QR scan
- ✅ **Auto Respon** - Trigger-based automatic replies
- ✅ **Anti Spam & Anti Link** - Keep your group safe
- ✅ **Limit System** - Daily limits for users
- ✅ **Premium System** - Special perks for premium users
- ✅ **Database MongoDB** - Persistent storage
- ✅ **Media Converter** - Image/Video/Audio to sticker, MP3, voice note
- ✅ **Media Uploader** - Upload to Hamzz Cloud (E2E)
- ✅ **Games** - Fun interactive games
- ✅ **Downloader** - YouTube, TikTok, Instagram, Facebook

---

## 📦 Installation

### Prerequisites
- Node.js **20.x** or higher
- MongoDB **Atlas** (for database)
- FFmpeg & WebP tools

### Install on Termux
```bash
pkg update && pkg upgrade
pkg install nodejs-lts ffmpeg webp git
git clone https://github.com/eatmyd180/mimo.git
cd mimo
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
node index.js
```

Login Methods

Method 1: Pairing Code (Recommended)

· Set USE_PAIRING_CODE = true in index.js
· Enter your phone number when prompted
· Enter the 8-digit code in WhatsApp Linked Devices

Method 2: QR Code

· Set USE_PAIRING_CODE = false in index.js
· Scan QR code with WhatsApp

---

🚀 Deployment

Deploy to Railway (Recommended)

1. Fork this repository
2. Create new project on Railway
3. Connect your GitHub repo
4. Add environment variables:
   · MONGODB_URI
   · JWT_SECRET
5. Deploy!

Deploy to VPS

```bash
git clone https://github.com/eatmyd180/mimo.git
cd mimo
npm install
npm install -g pm2
pm2 start index.js --name mimo
pm2 save
pm2 startup
```

---

📁 Environment Variables

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
```

---

📝 Usage

Type .menu to see all available commands and categories.

---

⚠️ Note

This project is still in development and will continue to be updated for all features and bug maintenance.

---

📁 Project Structure

```
mimo/
├── src/
│   ├── plugins/     # Bot commands
│   ├── lib/         # Core utilities
│   └── database/    # MongoDB schemas
├── sessions/        # WhatsApp auth (gitignored)
├── index.js         # Main entry
├── config.js        # Bot configuration
└── package.json     # Dependencies
```

---

👨‍💻 Author

<p align="center">
  <a href="https://github.com/eatmyd180">
    <img src="https://img.shields.io/badge/GitHub-HamzzDev-181717?style=for-the-badge&logo=github">
  </a>
  <a href="https://whatsapp.com/channel/0029Vaxfn57Jpe8nkfCU7p27">
    <img src="https://img.shields.io/badge/WhatsApp-Channel-25D366?style=for-the-badge&logo=whatsapp">
  </a>
</p>

---

📜 License

This project is licensed under the MIT License.

---

<p align="center">
  <i>Made with ☕ by HamzzDev</i><br>
  <i>© 2024 Mimosa Multi-Device</i>
</p>