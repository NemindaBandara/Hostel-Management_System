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
    sex: {
        type: String,
        enum: ['Male', 'Female'],
        required: true,
    },
    assignedRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
