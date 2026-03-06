const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    name: {
        type: String,
    },
    indexNumber: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
    },
    year: {
        type: String,
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
    },
    assignedRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
    },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
