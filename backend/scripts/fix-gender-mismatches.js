const mongoose = require('mongoose');
const Student = require('../models/Student');
const Room = require('../models/Room');
const Hostel = require('../models/Hostel');

async function fixGenderMismatches() {
    try {
        console.log('Starting Gender Mismatch Diagnosis...');
        
        // Populate all students with their rooms and hostels
        const students = await Student.find({ assignedRoom: { $ne: null } })
            .populate({
                path: 'assignedRoom',
                populate: { path: 'hostel' }
            });

        const mismatches = [];

        for (const student of students) {
            const room = student.assignedRoom;
            if (!room || !room.hostel) continue;

            const hostelGender = room.hostel.gender;
            const studentSex = student.sex;

            if (hostelGender !== studentSex) {
                mismatches.push({
                    studentIndex: student.indexNumber,
                    studentSex,
                    hostelName: room.hostel.officialName,
                    hostelGender,
                    roomNumber: room.roomNumber
                });
            }
        }

        console.log(`Found ${mismatches.length} gender mismatches.`);
        
        if (mismatches.length > 0) {
            console.table(mismatches);
            
            // Should we auto-fix? Let's provide a function to unassign them
            console.log('Unassigning mismatched students...');
            for (const mismatch of mismatches) {
                await Student.updateOne(
                    { indexNumber: mismatch.studentIndex },
                    { $set: { assignedRoom: null } }
                );
            }
            console.log('Mismatched students have been unassigned.');
        }

        return mismatches;
    } catch (error) {
        console.error('Diagnosis failed:', error);
        throw error;
    }
}

module.exports = fixGenderMismatches;
