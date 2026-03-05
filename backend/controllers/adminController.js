const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');

// @route   POST /api/admin/hostel/:hostelId/design
// @desc    Design a Hostel (Auto-generate Rooms)
exports.designHostel = async (req, res) => {
    try {
        const { hostelId } = req.params;
        const { floorConfigs } = req.body; // e.g., [8, 12, 12]

        if (!floorConfigs || !Array.isArray(floorConfigs) || floorConfigs.length === 0) {
            return res.status(400).json({ message: 'Please provide a valid floorConfigs array' });
        }

        const floors = floorConfigs.length;

        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
            return res.status(404).json({ message: 'Hostel not found' });
        }

        // Update the hostel floors if it differs
        if (hostel.numberOfFloors !== floors) {
            hostel.numberOfFloors = floors;
            await hostel.save();
        }

        // Check if rooms already exist to prevent duplicate generation
        const existingRoomsCount = await Room.countDocuments({ hostel: hostelId });
        if (existingRoomsCount > 0) {
            return res.status(400).json({ message: 'Rooms have already been designed for this hostel.' });
        }

        const roomsToCreate = [];

        for (let i = 0; i < floors; i++) {
            const floorIndex = i + 1;
            const roomsOnThisFloor = floorConfigs[i];

            for (let roomIndex = 1; roomIndex <= roomsOnThisFloor; roomIndex++) {
                // Generate a logical room number, e.g., Floor 1 Room 1 -> 101, Floor 2 Room 12 -> 212
                const roomIndexFormatted = roomIndex < 10 ? `0${roomIndex}` : `${roomIndex}`;
                const roomNumber = `${floorIndex}${roomIndexFormatted}`;

                roomsToCreate.push({
                    hostel: hostelId,
                    floor: floorIndex,
                    roomNumber: roomNumber,
                    isGeneral: true,
                    allocation: {
                        capacity: 4 // default as requested
                    }
                });
            }
        }

        await Room.insertMany(roomsToCreate);

        res.status(201).json({
            message: `Successfully generated ${roomsToCreate.length} rooms across ${floors} floors for ${hostel.officialName}.`,
            count: roomsToCreate.length
        });
    } catch (error) {
        console.error('Error designing hostel:', error);
        res.status(500).json({ message: 'Server error designing hostel' });
    }
};

// @route   PUT /api/admin/room/:roomId/configure
// @desc    Configure Room Allocation Rules
exports.configureRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { facultyId, year, capacity } = req.body;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Update allocation fields
        if (facultyId) {
            const faculty = await Faculty.findById(facultyId);
            if (!faculty) {
                return res.status(404).json({ message: 'Faculty not found' });
            }
            room.allocation.faculty = facultyId;
            room.isGeneral = false; // Assigning a faculty means it's no longer a general room
        } else {
            // If faculty is explicitly set to null/empty in the request, make it general
            if (facultyId === null) {
                room.allocation.faculty = undefined;
                room.isGeneral = true;
            }
        }

        if (year) room.allocation.year = year;
        if (capacity) {
            if (![2, 4, 6, 8].includes(Number(capacity))) {
                return res.status(400).json({ message: 'Capacity must be 2, 4, 6, or 8' });
            }
            room.allocation.capacity = Number(capacity);
        }

        await room.save();

        // Populate faculty details for response
        await room.populate('allocation.faculty');

        res.status(200).json({ message: 'Room configuration updated successfully', room });
    } catch (error) {
        console.error('Error configuring room:', error);
        res.status(500).json({ message: 'Server error configuring room' });
    }
};

// @route   PUT /api/admin/room/:roomId/assets
// @desc    Update Room Assets
exports.updateRoomAssets = async (req, res) => {
    try {
        const { roomId } = req.params;
        const assetsUpdates = req.body; // Expects an object matching the assets schema

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Merge updates selectively (only updating existing Room assets)
        if (assetsUpdates.fans) room.assets.fans = { ...room.assets.fans, ...assetsUpdates.fans };
        if (assetsUpdates.lights) room.assets.lights = { ...room.assets.lights, ...assetsUpdates.lights };
        if (assetsUpdates.plugs) room.assets.plugs = { ...room.assets.plugs, ...assetsUpdates.plugs };

        await room.save();

        res.status(200).json({ message: 'Room assets updated successfully', assets: room.assets });
    } catch (error) {
        console.error('Error updating room assets:', error);
        res.status(500).json({ message: 'Server error updating room assets' });
    }
};

// @route   POST /api/admin/room/:roomId/allocate
// @desc    Allocate Student to Room
exports.allocateStudent = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { studentIndex } = req.body;

        if (!studentIndex) {
            return res.status(400).json({ message: 'Please provide studentIndex' });
        }

        // Fetch Student
        const student = await Student.findOne({ indexNumber: studentIndex }).populate('faculty');
        if (!student) {
            return res.status(404).json({ message: 'Student not found in the system' });
        }

        // If already assigned to a room
        if (student.assignedRoom) {
            // Need to decide whether to allow reassignment or not. 
            // For now, let's block it or explicitly require an "unassign" first.
            if (student.assignedRoom.toString() === roomId) {
                return res.status(400).json({ message: 'Student is already assigned to this room' });
            }
            // For reassignment, we would need to decrement the old room's count, but let's keep it simple for now or explicitly say it.
            return res.status(400).json({ message: 'Student is currently assigned to another room. Unassign them first.' });
        }

        // Fetch Room
        const room = await Room.findById(roomId).populate('allocation.faculty');
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check if room has been configured
        if (!room.allocation.capacity) {
            return res.status(400).json({ message: 'Room capacity is not configured.' });
        }

        // Check Capacity
        const currentStudentsCount = await Student.countDocuments({ assignedRoom: roomId });
        if (currentStudentsCount >= room.allocation.capacity) {
            return res.status(400).json({ message: 'This room is full and cannot accept more students.' });
        }

        // Check Faculty Match
        if (!room.isGeneral) {
            // It's a reserved room
            const roomFacultyId = room.allocation.faculty ? room.allocation.faculty._id.toString() : null;
            const studentFacultyId = student.faculty._id.toString();

            if (roomFacultyId !== studentFacultyId) {
                const requiredFacultyName = room.allocation.faculty ? room.allocation.faculty.name : 'Unknown';
                return res.status(400).json({
                    message: `Faculty Mismatch: This room is reserved for ${requiredFacultyName} students.`
                });
            }
        }

        // If everything is fine, assign the student
        student.assignedRoom = roomId;
        await student.save();

        res.status(200).json({
            message: `Student ${student.name} successfully allocated to Room ${room.roomNumber}`,
            student
        });

    } catch (error) {
        console.error('Error allocating student:', error);
        res.status(500).json({ message: 'Server error allocating student' });
    }
};
