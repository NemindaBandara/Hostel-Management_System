const Student = require('../models/Student');
const Room = require('../models/Room');
const mongoose = require('mongoose');

/**
 * Smart Bulk Allocation Logic
 * Pairs unassigned students with rooms matching their Faculty and Year.
 */
exports.bulkSmartAllocate = async (req, res) => {
    try {
        const { dryRun = false } = req.body;

        // 1. Fetch all unassigned students
        const unassignedStudents = await Student.find({ assignedRoom: null }).populate('faculty');

        // 2. Fetch all rooms that are configured for specific allocation
        const roomQuery = {
            isGeneral: false,
            'allocation.faculty': { $ne: null },
            'allocation.year': { $ne: null }
        };

        // Role-based scoping: Admins only manage their assigned hostel
        if (req.user.role === 'Admin' && req.user.managedHostelIds && req.user.managedHostelIds.length > 0) {
            roomQuery.hostel = { $in: req.user.managedHostelIds };
        }

        const rooms = await Room.find(roomQuery).populate('allocation.faculty').populate('hostel');

        // 3. Get current occupancy for these rooms
        const occupancyMap = await Student.aggregate([
            { $match: { assignedRoom: { $in: rooms.map(r => r._id) } } },
            { $group: { _id: '$assignedRoom', count: { $sum: 1 } } }
        ]);

        const currentOccupancy = {};
        occupancyMap.forEach(item => {
            currentOccupancy[item._id.toString()] = item.count;
        });

        // 4. Group rooms by Faculty_Year key for fast lookup
        // Structure: { "facultyId_year": [ {room, availableSpaces}, ... ] }
        const roomGroups = {};
        rooms.forEach(room => {
            const facultyId = room.allocation.faculty._id.toString();
            const year = room.allocation.year;
            const hostelGender = room.hostel.gender;
            const key = `${facultyId}_${year}_${hostelGender}`;

            const occupied = currentOccupancy[room._id.toString()] || 0;
            const availableSpaces = room.allocation.capacity - occupied;

            if (availableSpaces > 0) {
                if (!roomGroups[key]) roomGroups[key] = [];
                roomGroups[key].push({
                    _id: room._id,
                    roomNumber: room.roomNumber,
                    availableSpaces
                });
            }
        });

        // 5. Match Students
        const allocations = []; // Final list of {studentId, roomId}
        const summary = {}; // For reporting: { "Faculty Name - Year X": { matched: 0, totalAvailable: 0 } }

        // Initialize summary with total available spaces per Faculty/Year
        Object.keys(roomGroups).forEach(key => {
            const group = roomGroups[key];
            const firstRoomId = group[0]._id;
            const fullRoom = rooms.find(r => r._id.toString() === firstRoomId.toString());

            if (fullRoom) {
                const summaryKey = `${fullRoom.allocation.faculty.name} - Year ${fullRoom.allocation.year}`;
                const totalInGroup = group.reduce((sum, r) => sum + r.availableSpaces, 0);
                summary[summaryKey] = { matched: 0, totalAvailable: totalInGroup };
            }
        });

        unassignedStudents.forEach(student => {
            if (!student.faculty || !student.sex) return;

            // Match with any room in a compatible hostel (ignoring room.genderType)
            const key = `${student.faculty._id.toString()}_${student.year}_${student.sex}`;

            let group = roomGroups[key];

            if (group && group.length > 0) {
                // Find first room with space
                const roomObj = group[0];

                allocations.push({
                    studentId: student._id,
                    roomId: roomObj._id,
                    studentName: student.name,
                    roomNumber: roomObj.roomNumber,
                    targetGender: student.sex // Always ensure room matches student sex
                });

                // Update summary for reporting
                const summaryKey = `${student.faculty.name} - Year ${student.year} (${student.sex})`;
                if (!summary[summaryKey]) {
                    summary[summaryKey] = { matched: 0, totalAvailable: 0 };
                }
                summary[summaryKey].matched++;

                // Decrement space in our local tracking
                roomObj.availableSpaces--;
                if (roomObj.availableSpaces === 0) {
                    group.shift(); // Remove full room from group
                }
            }
        });

        // Calculate total available spaces for the summary (even if not matched)
        Object.keys(roomGroups).forEach(key => {
            const group = roomGroups[key];
            if (group.length > 0) {
                // We need to fetch the name for the key... let's do a trick or just use the first room's data
                // In a real app, we'd have a faculty map, but let's just use the summaries we created
                // or just send the raw counts.
            }
        });

        if (dryRun) {
            return res.json({
                success: true,
                message: "Bulk allocation preview generated",
                stats: {
                    totalUnassigned: unassignedStudents.length,
                    potentialAllocations: allocations.length,
                    summary
                },
                preview: allocations.slice(0, 50) // Send first 50 for preview
            });
        }

        // 6. Execute Bulk Write
        if (allocations.length === 0) {
            return res.status(400).json({ message: "No matching students and rooms found." });
        }

        const studentOps = allocations.map(a => ({
            updateOne: {
                filter: { _id: a.studentId },
                update: { $set: { assignedRoom: a.roomId } }
            }
        }));

        // Ensure ALL involved rooms match the building/student gender
        const roomOps = allocations.map(a => ({
            updateOne: {
                filter: { _id: a.roomId },
                update: { $set: { genderType: a.targetGender } }
            }
        }));

        const [studentResult] = await Promise.all([
            Student.bulkWrite(studentOps),
            roomOps.length > 0 ? Room.bulkWrite(roomOps) : Promise.resolve()
        ]);

        res.json({
            success: true,
            message: `Successfully allocated ${studentResult.modifiedCount} students.`,
            stats: {
                matched: studentResult.modifiedCount,
                summary
            }
        });

    } catch (error) {
        console.error("Bulk smart allocate error:", error);
        res.status(500).json({ message: "Internal server error during bulk allocation." });
    }
};
