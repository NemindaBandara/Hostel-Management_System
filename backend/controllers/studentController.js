const mongoose = require('mongoose');
const Student = require('../models/Student');
const Room = require('../models/Room');
const CommonArea = require('../models/CommonArea');
const Hostel = require('../models/Hostel');
const MaintenanceTicket = require('../models/MaintenanceTicket');

// @route   GET /api/students/find/:indexNumber
// @desc    Find student, their room, and assets
exports.findStudentRoom = async (req, res) => {
    try {
        const { indexNumber } = req.params;

        const student = await Student.findOne({ indexNumber }).populate('faculty');
        if (!student) {
            return res.status(404).json({ message: 'Index number not found' });
        }

        if (!student.assignedRoom) {
            return res.status(404).json({ message: 'No room assigned yet' });
        }

        const [room, pendingTickets] = await Promise.all([
            Room.findById(student.assignedRoom)
                .populate('hostel', 'officialName alias')
                .populate('allocation.faculty'),
            MaintenanceTicket.find({
                locationId: student.assignedRoom,
                status: 'Pending'
            })
        ]);

        if (!room) {
            return res.status(404).json({ message: 'Assigned room not found in layout' });
        }

        const roomObj = room.toObject();
        roomObj.pendingTickets = pendingTickets;

        res.status(200).json({
            student,
            room: roomObj
        });
    } catch (error) {
        console.error('Error finding student room:', error);
        res.status(500).json({ message: 'Server error searching for room' });
    }
};

// @route   POST /api/students/report-damage
// @desc    Report damage for a specific asset in a room or common area
exports.reportDamage = async (req, res) => {
    try {
        const { locationId, locationType, assetKey, indexNumber } = req.body;

        if (!locationId || !locationType || !assetKey || !indexNumber) {
            return res.status(400).json({ message: 'Missing required reporting data' });
        }

        const student = await Student.findOne({ indexNumber });
        if (!student) {
            return res.status(404).json({ message: 'Student search required to report damage' });
        }

        let location;
        if (locationType === 'Room') {
            location = await Room.findById(locationId);
        } else if (locationType === 'CommonArea') {
            location = await CommonArea.findById(locationId);
        } else {
            return res.status(400).json({ message: 'Invalid location type' });
        }

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        // Check if asset exists and has working units
        if (!location.assets[assetKey]) {
            return res.status(400).json({ message: `Asset '${assetKey}' does not exist in this location` });
        }

        if (location.assets[assetKey].working <= 0) {
            return res.status(400).json({ message: 'No working units left to report as damaged' });
        }

        // 1. Create Maintenance Ticket
        const ticket = new MaintenanceTicket({
            locationId,
            locationType,
            assetKey,
            reportedBy: student._id,
            status: 'Pending'
        });
        await ticket.save();

        // 2. Update counts in Room/CommonArea
        location.assets[assetKey].working -= 1;
        location.assets[assetKey].notWorking += 1;

        // Mark as modified if it's a nested object
        location.markModified(`assets.${assetKey}`);
        await location.save();

        res.status(200).json({ 
            message: `Successfully reported damage for ${assetKey}. Maintenance ticket created.`,
            assets: location.assets 
        });

    } catch (error) {
        console.error('Error reporting damage:', error);
        res.status(500).json({ message: 'Server error reporting damage' });
    }
};
