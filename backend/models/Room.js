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
    genderType: {
        type: String,
        enum: ['Male', 'Female', 'Neutral'],
        default: 'Neutral'
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
        beds: {
            working: { type: Number, default: 0 },
            notWorking: { type: Number, default: 0 },
        },
        lockers: {
            working: { type: Number, default: 0 },
            notWorking: { type: Number, default: 0 },
        },
        tables: {
            working: { type: Number, default: 0 },
            notWorking: { type: Number, default: 0 },
        },
        chairs: {
            working: { type: Number, default: 0 },
            notWorking: { type: Number, default: 0 },
        },
        racks: {
            working: { type: Number, default: 0 },
            notWorking: { type: Number, default: 0 },
        },
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
