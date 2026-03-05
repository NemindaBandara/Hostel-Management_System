const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    hostel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true,
    },
    floor: {
        type: Number,
        required: true,
    },
    roomNumber: {
        type: String,
        required: true,
    },
    isGeneral: {
        type: Boolean,
        default: true
    },
    allocation: {
        faculty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Faculty',
        },
        year: {
            type: String,
        },
        capacity: {
            type: Number,
            enum: [2, 4, 6, 8],
            default: 4,
        },
    },
    assets: {
        fans: {
            working: { type: Number, default: 0 },
            notWorking: { type: Number, default: 0 },
        },
        lights: {
            working: { type: Number, default: 0 },
            notWorking: { type: Number, default: 0 },
        },
        plugs: {
            working: { type: Number, default: 0 },
            notWorking: { type: Number, default: 0 },
        },
    },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
