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
            working: { type: Number, default: 0 },
            notWorking: { type: Number, default: 0 },
        },
        sinks: {
            working: { type: Number, default: 0 },
            notWorking: { type: Number, default: 0 },
        },
        showers: {
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
        }
    },
}, { timestamps: true });

module.exports = mongoose.model('CommonArea', commonAreaSchema);
