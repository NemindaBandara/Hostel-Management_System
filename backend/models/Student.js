const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    indexNumber: {
        type: String,
        required: true,
        unique: true,
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: true,
    },
    assignedRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
    },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
