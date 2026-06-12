import { performance } from 'perf_hooks';

export default {
    cmd: ['ping', 'p'],
    run: async (sock, m) => {
        const start = performance.now();
        await sock.sendMessage(m.key.remoteJid, { text: 'Pong!' }, { quoted: m });
        const end = performance.now();
        
        // Edit pesan sebelumnya (jika mau) atau kirim lagi latency
        await sock.sendMessage(m.key.remoteJid, { text: `Kecepatan: ${(end - start).toFixed(2)}ms` });
    }
};
