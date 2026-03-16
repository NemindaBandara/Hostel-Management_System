const mongoose = require('mongoose');

const maintenanceTicketSchema = new mongoose.Schema({
    locationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // Ref is dynamic (Room or CommonArea)
    },
    locationType: {
        type: String,
        required: true,
        enum: ['Room', 'CommonArea']
    },
    hostel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true
    },
    assetKey: {
        type: String,
        required: true
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Resolved'],
        default: 'Pending'
    },
    reportedAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceTicket', maintenanceTicketSchema);
