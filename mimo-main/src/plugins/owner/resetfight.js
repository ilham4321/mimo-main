// plugins/owner/resetfight.js
import { User } from '../../database/schema.js';

export default {
    cmd: ['resetfight'],
    tags: ['owner'],
    ownerOnly: true,

    run: async (sock, m, { user }) => {
        const before = user.lastFight;
        user.lastFight = 0;
        await user.save();
        m.reply(`✅ *lastFight telah direset!*\n\n📊 Sebelum: ${before}\n📊 Sesudah: 0\n\nSekarang bisa bertarung lagi.`);
    }
};