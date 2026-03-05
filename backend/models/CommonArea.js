const mongoose = require('mongoose');

const commonAreaSchema = new mongoose.Schema({
    hostel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true,
    },
    floor: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ['Washroom', 'Study Room', 'Common Room'],
        required: true,
    },
    assets: {
        toilets: {
            total: { type: Number, default: 0 },
            working: { type: Number, default: 0 },
        },
        sinks: {
            total: { type: Number, default: 0 },
            working: { type: Number, default: 0 },
        },
        showers: {
            total: { type: Number, default: 0 },
            working: { type: Number, default: 0 },
        },
        fans: {
            total: { type: Number, default: 0 },
            working: { type: Number, default: 0 },
        },
        lights: {
            total: { type: Number, default: 0 },
            working: { type: Number, default: 0 },
        },
        plugs: {
            total: { type: Number, default: 0 },
            working: { type: Number, default: 0 },
        }
    },
}, { timestamps: true });

module.exports = mongoose.model('CommonArea', commonAreaSchema);
