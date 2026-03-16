const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
    officialName: {
        type: String,
        required: true,
    },
    alias: {
        type: String,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female'],
        required: true,
    },
    numberOfFloors: {
        type: Number,
        required: true,
    },
    primaryWarden: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Hostel', hostelSchema);
