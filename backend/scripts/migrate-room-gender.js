const mongoose = require('mongoose');
const Student = require('../models/Student');
const Room = require('../models/Room');
const Hostel = require('../models/Hostel');

async function migrateRoomGender() {
    try {
        console.log('Starting Strict Room Gender Synchronization...');
        
        // Fetch all hostels
        const hostels = await Hostel.find();
        let totalUpdated = 0;

        for (const hostel of hostels) {
            const result = await Room.updateMany(
                { hostel: hostel._id },
                { $set: { genderType: hostel.gender } }
            );
            totalUpdated += result.modifiedCount;
            console.log(`Updated ${result.modifiedCount} rooms in ${hostel.officialName} to ${hostel.gender}`);
        }

        console.log(`Strict Synchronization Complete. Total Rooms Modified: ${totalUpdated}`);
        return totalUpdated;
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

module.exports = migrateRoomGender;
