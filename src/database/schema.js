import mongoose from 'mongoose'

// ==================== USER SCHEMA (LID COMPATIBLE) ====================
const UserSchema = new mongoose.Schema({
    // PRIMARY KEY: JID (bisa berisi @s.whatsapp.net atau @lid)
    jid: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Nomor telepon (opsional, untuk display/backward compatibility)
    phoneNumber: {
        type: String,
        sparse: true,
        //index: true
    },

    // REGISTER
    name: {
        type: String,
        default: ''
    },

    age: {
        type: Number,
        default: 0
    },

    registered: {
        type: Boolean,
        default: false
    },

    serial: {
        type: String,
        default: ''
    },

    regTime: {
        type: Number,
        default: 0
    },
    

    // SETTINGS
    language: {
        type: String,
        default: 'id',
        enum: ['id', 'en']
    },

    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin', 'developer']
    },

    // LIMIT & PREMIUM
    limit: {
        type: Number,
        default: 20
    },

    premium: {
        type: Boolean,
        default: false
    },

    premiumTime: {
        type: Number,
        default: 0
    },

    // MODERATION
    banned: {
        type: Boolean,
        default: false
    },

    warning: {
        type: Number,
        default: 0
    },
    
    lastFight: {
    type: Number,
    default: 0
    },

    // RPG
    rpg: {
        level: {
            type: Number,
            default: 1
        },
        exp: {
            type: Number,
            default: 0
        },
        money: {
            type: Number,
            default: 1000
        },
        inventory: {
            type: Array,
            default: []
        }
    },

    // CREATED
    createdAt: {
        type: Date,
        default: Date.now
    }
})

// ==================== GROUP SCHEMA (LID COMPATIBLE) ====================
const GroupSchema = new mongoose.Schema({
    // GROUP JID (format: xxxxx@g.us)
    id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Nama grup (untuk display)
    name: {
        type: String,
        default: ''
    },

    // SETTINGS
    welcome: {
        type: Boolean,
        default: false
    },

    antilink: {
        type: Boolean,
        default: false
    },

    antilinkAction: {
        type: String,
        default: 'kick',
        enum: ['kick', 'warn', 'delete']
    },

    mute: {
        type: Boolean,
        default: false
    },
    
    muteUntil: {
        type: Number,
        default: null
    },
    isClosed: {
        type: Boolean,
        default: false
    },
    
    closeUntil: {
        type: Number,
        default: null
    },
    
    closeTimer: {
        type: Number,
        default: null
    },
    
    blacklist: {
    type: Array,
    default: []
    },
    
    nsfw: {
        type: Boolean,
        default: false
    },

    // Auto response settings
    autoRespond: {
        type: Boolean,
        default: false
    },

    welcomeMessage: {
        type: String,
        default: '👋 Selamat datang @user di grup @group'
    },

    leaveMessage: {
        type: String,
        default: '👋 Selamat tinggal @user'
    },

    // CREATED
    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
})

// ==================== STATIC METHODS ====================

/**
 * Find or create user by JID (LID or PN)
 * @param {string} jid - User JID (bisa @s.whatsapp.net atau @lid)
 * @param {string} name - Nama pengguna
 * @param {object} sock - Socket instance (opsional, untuk extract nomor)
 * @returns {Promise<object>} User document
 */
UserSchema.statics.findOrCreate = async function(jid, name = 'User', sock = null) {
    if (!jid) return null
    
    let user = await this.findOne({ jid })
    
    if (!user) {
        let phoneNumber = null
        
        // Coba ekstrak nomor telepon dari JID
        if (jid.includes('@s.whatsapp.net')) {
            phoneNumber = jid.split('@')[0]
        } else if (jid.includes('@lid') && sock) {
            try {
                const pn = await sock.signalRepository?.lidMapping?.getPNForLID(jid)
                if (pn) phoneNumber = pn.split('@')[0]
            } catch (err) {
                console.log('Failed to get PN for LID:', err.message)
            }
        }
        
        user = new this({
            jid,
            phoneNumber,
            name: name || 'User',
            limit: global.limit?.default || 20
        })
        
        await user.save()
        console.log(`✅ New user created: ${jid} (${phoneNumber || 'no phone'})`)
    }
    
    return user
}

/**
 * Find user by phone number (for backward compatibility)
 * @param {string} phoneNumber - Nomor telepon
 * @returns {Promise<object|null>} User document
 */
UserSchema.statics.findByPhoneNumber = async function(phoneNumber) {
    if (!phoneNumber) return null
    return await this.findOne({ phoneNumber })
}

/**
 * Update user's phone number if needed (when LID to PN mapping found)
 * @param {string} jid - User JID
 * @param {string} phoneNumber - Nomor telepon baru
 */
UserSchema.methods.updatePhoneNumber = async function(phoneNumber) {
    if (phoneNumber && this.phoneNumber !== phoneNumber) {
        this.phoneNumber = phoneNumber
        await this.save()
        console.log(`📱 Updated phone number for ${this.jid}: ${phoneNumber}`)
    }
}

// ==================== GROUP STATIC METHODS ====================

/**
 * Find or create group by ID
 * @param {string} groupId - Group JID
 * @param {string} groupName - Nama grup
 * @returns {Promise<object>} Group document
 */
GroupSchema.statics.findOrCreate = async function(groupId, groupName = '') {
    if (!groupId) return null
    
    let group = await this.findOne({ id: groupId })
    
    if (!group) {
        group = new this({
            id: groupId,
            name: groupName || ''
        })
        await group.save()
        console.log(`✅ New group created: ${groupId}`)
    }
    
    return group
}

// ==================== EXPORT ====================
export const User = mongoose.model('User', UserSchema)
export const Group = mongoose.model('Group', GroupSchema)