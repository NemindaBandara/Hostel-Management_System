const mongoose = require('mongoose');
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const CommonArea = require('../models/CommonArea');
const MaintenanceTicket = require('../models/MaintenanceTicket');
const User = require('../models/User');
const migrateRoomGender = require('../scripts/migrate-room-gender');
const fixGenderMismatches = require('../scripts/fix-gender-mismatches');

// @route   PUT /api/admin/hostel/:hostelId
// @desc    Edit existing Hostel details
exports.updateHostel = async (req, res) => {
    try {
        const { hostelId } = req.params;
        const { officialName, alias, gender } = req.body;

        if (!mongoose.Types.ObjectId.isValid(hostelId)) {
            return res.status(400).json({ message: 'Invalid Hostel ID format' });
        }

        const hostel = await Hostel.findById(hostelId);
        if (!hostel) return res.status(404).json({ message: 'Hostel not found' });

        if (officialName) hostel.officialName = officialName;
        if (alias) hostel.alias = alias;
        if (gender) hostel.gender = gender;

        await hostel.save();
        res.status(200).json(hostel);
    } catch (error) {
        console.error('Error updating hostel:', error);
        res.status(500).json({ message: 'Server error updating hostel' });
    }
};

// @route   DELETE /api/admin/hostel/:hostelId
// @desc    Delete Hostel and cascade all its Layouts
exports.deleteHostel = async (req, res) => {
    try {
        const { hostelId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(hostelId)) {
            return res.status(400).json({ message: 'Invalid Hostel ID format' });
        }

        const hostel = await Hostel.findById(hostelId);
        if (!hostel) return res.status(404).json({ message: 'Hostel not found' });

        // Cascade delete rooms and common areas
        await Room.deleteMany({ hostel: hostelId });
        await CommonArea.deleteMany({ hostel: hostelId });
        await hostel.deleteOne();

        res.status(200).json({ message: 'Hostel and its physical mapped layouts completely deleted' });
    } catch (error) {
        console.error('Error deleting hostel:', error);
        res.status(500).json({ message: 'Server error deleting hostel' });
    }
};

// @route   DELETE /api/admin/hostel/:hostelId/design
// @desc    Reset and delete a Hostel's floorplan/layout
exports.deleteHostelDesign = async (req, res) => {
    try {
        const { hostelId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(hostelId)) {
            return res.status(400).json({ message: 'Invalid Hostel ID format' });
        }

        // Keep the building, just burn the layout
        await Room.deleteMany({ hostel: hostelId });
        await CommonArea.deleteMany({ hostel: hostelId });

        res.status(200).json({ message: 'Hostel layout successfully reset' });
    } catch (error) {
        console.error('Error resetting layout:', error);
        res.status(500).json({ message: 'Server error resetting layout' });
    }
};

// @route   POST /api/admin/hostel/:hostelId/design
// @desc    Design a Hostel (Auto-generate Rooms and Common Areas)
exports.designHostel = async (req, res) => {
    try {
        const { hostelId } = req.params;
        const { floorConfigs, commonAreaConfig } = req.body; // commonAreaConfig e.g. { "1": ["Washroom", "Study Room"], "2": ["Washroom"] }

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
        const commonAreasToCreate = [];

        for (let i = 0; i < floors; i++) {
            const floorIndex = i + 1;
            const roomsOnThisFloor = floorConfigs[i];

            // 1. Generate Rooms
            for (let roomIndex = 1; roomIndex <= roomsOnThisFloor; roomIndex++) {
                // Generate a logical room number, e.g., Floor 1 Room 1 -> 101, Floor 2 Room 12 -> 212
                const roomIndexFormatted = roomIndex < 10 ? `0${roomIndex}` : `${roomIndex}`;
                const roomNumber = `${floorIndex}${roomIndexFormatted}`;

                roomsToCreate.push({
                    hostel: hostelId,
                    floor: floorIndex,
                    roomNumber: roomNumber,
                    genderType: hostel.gender,
                    isGeneral: true,
                    allocation: {
                        capacity: 4 // default as requested
                    }
                });
            }

            // 2. Generate Common Areas
            // If commonAreaConfig provided for this floor, use it, else default to ['Washroom']
            const areasForFloor = (commonAreaConfig && commonAreaConfig[floorIndex])
                ? commonAreaConfig[floorIndex]
                : ['Washroom'];

            for (const areaType of areasForFloor) {
                commonAreasToCreate.push({
                    hostel: hostelId,
                    floor: floorIndex,
                    type: areaType
                });
            }
        }

        await Room.insertMany(roomsToCreate);
        await CommonArea.insertMany(commonAreasToCreate);

        res.status(201).json({
            message: `Successfully generated ${roomsToCreate.length} rooms and ${commonAreasToCreate.length} common areas across ${floors} floors for ${hostel.officialName}.`,
            roomCount: roomsToCreate.length,
            commonAreaCount: commonAreasToCreate.length
        });
    } catch (error) {
        console.error('Error designing hostel:', error);
        res.status(500).json({ message: 'Server error designing hostel' });
    }
};

// @route   PUT /api/admin/hostel/:hostelId/floor/:floor/bulk-assets
// @desc    Mass-update all rooms on a specific floor with a copied asset template
exports.bulkUpdateFloorAssets = async (req, res) => {
    try {
        const { hostelId, floor } = req.params;
        const { assets } = req.body;

        if (!mongoose.Types.ObjectId.isValid(hostelId)) {
            return res.status(400).json({ message: 'Invalid Hostel ID format' });
        }

        if (!assets || typeof assets !== 'object') {
            return res.status(400).json({ message: 'Valid assets template object is required' });
        }

        // Find all rooms on this specific floor for this hostel
        // Update them all with the new asset template
        const result = await Room.updateMany(
            { hostel: hostelId, floor: Number(floor) },
            { $set: { assets: assets } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'No rooms found on this floor' });
        }

        res.status(200).json({
            message: `Successfully updated ${result.modifiedCount} rooms on Floor ${floor}`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error bulk updating floor assets:', error);
        res.status(500).json({ message: 'Server error during bulk asset update' });
    }
};

// @route   PUT /api/admin/room/:roomId
// @desc    Update Room Allocation and Assets
exports.updateRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { faculty, year, assets } = req.body;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Update allocation fields
        if (faculty) {
            let facultyObj;
            if (mongoose.Types.ObjectId.isValid(faculty)) {
                facultyObj = await Faculty.findById(faculty);
            } else {
                facultyObj = await Faculty.findOne({ facultyCode: faculty });
            }

            if (!facultyObj) {
                return res.status(404).json({ message: 'Faculty not found' });
            }
            room.allocation.faculty = facultyObj._id;
            room.isGeneral = false;
        } else if (faculty === null || faculty === '') {
            room.allocation.faculty = undefined;
            room.isGeneral = true;
        }

        if (year !== undefined) room.allocation.year = String(year);

        // Update assets
        if (assets && typeof assets === 'object') {
            room.assets = { ...room.assets, ...assets };
        }

        await room.save();
        await room.populate('allocation.faculty');

        res.status(200).json({ message: 'Room updated successfully', room });
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ message: 'Server error updating room' });
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

// @route   PUT /api/admin/rooms/bulk-update
// @desc    Bulk update multiple rooms configuration
exports.bulkUpdateRooms = async (req, res) => {
    try {
        const { roomIds, facultyId, year, capacity, isGeneral } = req.body;

        if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
            return res.status(400).json({ message: 'No room IDs provided' });
        }

        const updateData = {};

        // If isGeneral is explicitly true, or facultyId is null, make it a general room
        if (isGeneral === true || facultyId === null) {
            updateData['isGeneral'] = true;
            updateData['allocation.faculty'] = undefined;
        } else if (facultyId) {
            if (!mongoose.Types.ObjectId.isValid(facultyId)) {
                return res.status(400).json({ message: 'Invalid Faculty ID format' });
            }
            updateData['isGeneral'] = false;
            updateData['allocation.faculty'] = facultyId;
        }

        if (year) {
            updateData['allocation.year'] = year;
        }

        if (capacity) {
            if (![2, 4, 6, 8].includes(Number(capacity))) {
                return res.status(400).json({ message: 'Capacity must be 2, 4, 6, or 8' });
            }
            updateData['allocation.capacity'] = Number(capacity);
        }

        const result = await Room.updateMany(
            { _id: { $in: roomIds } },
            { $set: updateData }
        );

        res.status(200).json({
            message: `Successfully updated ${result.modifiedCount} rooms`,
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount
        });
    } catch (error) {
        console.error('Error in bulk room update:', error);
        res.status(500).json({ message: 'Server error during bulk room update' });
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
        const room = await Room.findById(roomId).populate('allocation.faculty').populate('hostel');
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check Hostel Gender Match
        if (room.hostel.gender !== student.sex) {
            return res.status(400).json({
                message: `Gender Mismatch: This building is reserved for ${room.hostel.gender} students.`
            });
        }

        // Check Capacity
        const currentStudentsCount = await Student.countDocuments({ assignedRoom: roomId });
        if (currentStudentsCount >= (room.allocation.capacity || 4)) {
            return res.status(400).json({ message: 'This room is full and cannot accept more students.' });
        }

        // Check Faculty Match
        if (!room.isGeneral) {
            const roomFacultyId = room.allocation.faculty ? room.allocation.faculty._id.toString() : null;
            const studentFacultyId = student.faculty?._id.toString();

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

        // If room genderType isn't already set to hostel gender (e.g. legacy Neutral), force it now
        if (room.genderType !== room.hostel.gender) {
            room.genderType = room.hostel.gender;
            await room.save();
        }

        res.status(200).json({
            message: `Student ${student.name} successfully allocated to Room ${room.roomNumber}`,
            student
        });

    } catch (error) {
        console.error('Error allocating student:', error);
        res.status(500).json({ message: 'Server error allocating student' });
    }
};

// @route   PUT /api/admin/common-area/:commonAreaId/assets
// @desc    Update Common Area Assets
exports.updateCommonAreaAssets = async (req, res) => {
    try {
        const { commonAreaId } = req.params;
        const assetsUpdates = req.body;

        const commonArea = await CommonArea.findById(commonAreaId);
        if (!commonArea) {
            return res.status(404).json({ message: 'Common area not found' });
        }

        // Merge updates selectively
        if (assetsUpdates.toilets) commonArea.assets.toilets = { ...commonArea.assets.toilets, ...assetsUpdates.toilets };
        if (assetsUpdates.sinks) commonArea.assets.sinks = { ...commonArea.assets.sinks, ...assetsUpdates.sinks };
        if (assetsUpdates.showers) commonArea.assets.showers = { ...commonArea.assets.showers, ...assetsUpdates.showers };
        if (assetsUpdates.fans) commonArea.assets.fans = { ...commonArea.assets.fans, ...assetsUpdates.fans };
        if (assetsUpdates.lights) commonArea.assets.lights = { ...commonArea.assets.lights, ...assetsUpdates.lights };
        if (assetsUpdates.plugs) commonArea.assets.plugs = { ...commonArea.assets.plugs, ...assetsUpdates.plugs };

        await commonArea.save();

        res.status(200).json({ message: 'Common area assets updated successfully', assets: commonArea.assets });
    } catch (error) {
        console.error('Error updating common area assets:', error);
        res.status(500).json({ message: 'Server error updating common area assets' });
    }
};

// @route   GET /api/admin/hostels
// @desc    Get all Hostels
exports.getAllHostels = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'Admin') {
            const managedIds = req.user.managedHostelIds || [];
            if (managedIds.length === 0) {
                return res.status(200).json([]); // Return empty if no hostels assigned
            }
            filter = { _id: { $in: managedIds } };
        }

        const hostels = await Hostel.find(filter).lean();

        // Add a boolean indicating if a floorplan has been generated
        const hostelsWithDesignStatus = await Promise.all(hostels.map(async (hostel) => {
            const hasRooms = await Room.exists({ hostel: hostel._id });
            return {
                ...hostel,
                isDesigned: !!hasRooms
            };
        }));

        res.status(200).json(hostelsWithDesignStatus);
    } catch (error) {
        console.error('Error fetching hostels:', error);
        res.status(500).json({ message: 'Server error fetching hostels' });
    }
};

// @route   GET /api/admin/hostel/:hostelId/layout
// @desc    Get complete structure of rooms and common areas grouped by floor
exports.getHostelLayout = async (req, res) => {
    try {
        const { hostelId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(hostelId)) {
            return res.status(400).json({ message: 'Invalid Hostel ID format' });
        }

        // Strict Scoping Check
        if (req.user.role === 'Admin' && !req.user.managedHostelIds?.map(id => id.toString()).includes(hostelId)) {
            return res.status(403).json({ message: '403 Forbidden: You are not authorized to access this hostel layout' });
        }

        // Fetch all rooms, common areas, students, and pending maintenance tickets for this hostel
        const [rooms, commonAreas, students, pendingTickets] = await Promise.all([
            Room.find({ hostel: hostelId }).populate('allocation.faculty'),
            CommonArea.find({ hostel: hostelId }),
            Student.find({ assignedRoom: { $in: (await Room.find({ hostel: hostelId }).select('_id')).map(r => r._id) } }),
            MaintenanceTicket.find({ 
                status: 'Pending', 
                locationId: { $in: [
                    ...(await Room.find({ hostel: hostelId }).select('_id')).map(r => r._id),
                    ...(await CommonArea.find({ hostel: hostelId }).select('_id')).map(a => a._id)
                ] }
            })
        ]);

        // Map tickets to their locations
        const ticketMap = {};
        pendingTickets.forEach(ticket => {
            const lid = ticket.locationId.toString();
            if (!ticketMap[lid]) ticketMap[lid] = [];
            ticketMap[lid].push(ticket);
        });

        // Map students to their rooms
        const studentMap = {};
        students.forEach(student => {
            if (student.assignedRoom) {
                const rid = student.assignedRoom.toString();
                if (!studentMap[rid]) studentMap[rid] = [];
                studentMap[rid].push(student);
            }
        });

        // Group by floor
        const layout = {};

        // Helper to ensure floor array exists
        const ensureFloor = (floor) => {
            if (!layout[floor]) {
                layout[floor] = {
                    rooms: [],
                    commonAreas: []
                };
            }
        };

        rooms.forEach((room) => {
            ensureFloor(room.floor);
            // Convert to object and inject students and pending tickets
            const roomObj = room.toObject();
            roomObj.students = studentMap[room._id.toString()] || [];
            roomObj.pendingTickets = ticketMap[room._id.toString()] || [];
            layout[room.floor].rooms.push(roomObj);
        });

        commonAreas.forEach((area) => {
            ensureFloor(area.floor);
            const areaObj = area.toObject();
            areaObj.pendingTickets = ticketMap[area._id.toString()] || [];
            layout[area.floor].commonAreas.push(areaObj);
        });

        // Convert the layout object dictionary into the expected structured array format for the frontend
        const formattedLayout = Object.keys(layout).map((floorNum) => ({
            floor: parseInt(floorNum, 10),
            rooms: layout[floorNum].rooms,
            commonAreas: layout[floorNum].commonAreas
        })).sort((a, b) => a.floor - b.floor);

        res.status(200).json({
            layout: layout,
            floors: formattedLayout
        });

    } catch (error) {
        console.error('Error fetching hostel layout:', error);
        res.status(500).json({ message: 'Server error fetching hostel layout' });
    }
};

// @route   PUT /api/admin/hostel/:hostelId/floor/:floor/bulk-assets
// @desc    Mass-update all rooms on a specific floor with a shared asset template configuration
exports.bulkUpdateFloorAssets = async (req, res) => {
    try {
        const { hostelId, floor } = req.params;
        const { assets } = req.body;

        if (!mongoose.Types.ObjectId.isValid(hostelId)) {
            return res.status(400).json({ message: 'Invalid Hostel ID format' });
        }

        if (!assets || typeof assets !== 'object') {
            return res.status(400).json({ message: 'Valid assets configuration object is required' });
        }

        // Apply to all rooms with matching hostel and floor exactly
        const updateResult = await Room.updateMany(
            { hostel: hostelId, floor: Number(floor) },
            { $set: { assets: assets } }
        );

        res.status(200).json({
            message: `Successfully pasted template to ${updateResult.modifiedCount} rooms on Floor ${floor}`,
            modifiedCount: updateResult.modifiedCount
        });

    } catch (error) {
        console.error('Error executing bulk floor asset update:', error);
        res.status(500).json({ message: 'Server error processing bulk update' });
    }
};

// @route   GET /api/admin/faculties
// @desc    Get all Faculties
exports.getAllFaculties = async (req, res) => {
    try {
        const faculties = await Faculty.find();
        res.status(200).json(faculties);
    } catch (error) {
        console.error('Error fetching faculties:', error);
        res.status(500).json({ message: 'Server error fetching faculties' });
    }
};

// @route   PUT /api/admin/faculty/:facultyId
// @desc    Edit existing Faculty details
exports.updateFaculty = async (req, res) => {
    try {
        const { facultyId } = req.params;
        const { name, color, facultyCode } = req.body;

        if (!mongoose.Types.ObjectId.isValid(facultyId)) {
            return res.status(400).json({ message: 'Invalid Faculty ID format' });
        }

        const faculty = await Faculty.findById(facultyId);
        if (!faculty) return res.status(404).json({ message: 'Faculty not found' });

        if (name) faculty.name = name;
        if (color) faculty.color = color;
        if (facultyCode) {
            const existingFaculty = await Faculty.findOne({ facultyCode, _id: { $ne: facultyId } });
            if (existingFaculty) {
                return res.status(400).json({ message: 'Another faculty with this code already exists' });
            }
            faculty.facultyCode = facultyCode;
        }

        await faculty.save();
        res.status(200).json(faculty);
    } catch (error) {
        console.error('Error updating faculty:', error);
        res.status(500).json({ message: 'Server error updating faculty' });
    }
};

// @route   DELETE /api/admin/faculty/:facultyId
// @desc    Delete Faculty
exports.deleteFaculty = async (req, res) => {
    try {
        const { facultyId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(facultyId)) {
            return res.status(400).json({ message: 'Invalid Faculty ID format' });
        }

        const faculty = await Faculty.findById(facultyId);
        if (!faculty) return res.status(404).json({ message: 'Faculty not found' });

        await Faculty.findByIdAndDelete(facultyId);

        res.status(200).json({ message: 'Faculty deleted successfully' });
    } catch (error) {
        console.error('Error deleting faculty:', error);
        res.status(500).json({ message: 'Server error deleting faculty' });
    }
};

// @route   POST /api/admin/students/bulk
// @desc    Bulk upload students via CSV
exports.bulkUploadStudents = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { students } = req.body;

        if (!students || !Array.isArray(students) || students.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Invalid or empty students data provided' });
        }

        // 1. Pre-fetch faculties for mapping
        const dbFaculties = await Faculty.find().session(session);
        const facultyLookup = {};
        dbFaculties.forEach(f => {
            facultyLookup[f.name.toLowerCase()] = f._id;
            if (f.facultyCode) facultyLookup[f.facultyCode.toLowerCase()] = f._id;
        });

        // 2. Identify unique emails and pre-fetch existing Users
        const studentEmails = [...new Set(students.map(s => s.email?.toLowerCase()).filter(Boolean))];
        const existingUsers = await User.find({ email: { $in: studentEmails } }).session(session);
        const userMap = new Map(); // email -> userId
        existingUsers.forEach(u => userMap.set(u.email.toLowerCase(), u._id));

        // 3. Prepare list of new Users to be created
        const usersToCreate = [];
        const processedEmails = new Set();

        students.forEach(s => {
            const email = s.email?.toLowerCase();
            if (email && !userMap.has(email) && !processedEmails.has(email)) {
                usersToCreate.push({
                    email,
                    password: s.indexNumber, // Initial password is indexNumber
                    role: 'Student',
                    isFirstLogin: true
                });
                processedEmails.add(email);
            }
        });

        // 4. Batch create missing Users (triggers pre-save hashing)
        if (usersToCreate.length > 0) {
            const newUsers = await User.create(usersToCreate, { session });
            newUsers.forEach(u => userMap.set(u.email.toLowerCase(), u._id));
        }

        // 5. Prepare Student bulk operations
        const studentOps = students.map(studentData => {
            const cleanStudent = { ...studentData };
            const email = cleanStudent.email?.toLowerCase();
            
            cleanStudent.name = `${cleanStudent.firstName || ''} ${cleanStudent.lastName || ''}`.trim();

            if (cleanStudent.faculty) {
                const facStr = cleanStudent.faculty.toString().toLowerCase();
                const facultyId = facultyLookup[facStr];
                if (facultyId) cleanStudent.faculty = facultyId;
                else delete cleanStudent.faculty;
            }

            const genderVal = cleanStudent.sex || cleanStudent.gender || cleanStudent.Sex || cleanStudent.Gender;
            if (genderVal) {
                cleanStudent.sex = genderVal.toString().toLowerCase().startsWith('m') ? 'Male' : 'Female';
            }

            cleanStudent.userId = userMap.get(email);

            return {
                updateOne: {
                    filter: { indexNumber: cleanStudent.indexNumber },
                    update: { $set: cleanStudent },
                    upsert: true
                }
            };
        });

        // 6. Execute Student bulk write
        const result = await Student.bulkWrite(studentOps, { session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            message: 'Bulk upload completed successfully',
            upsertedCount: result.upsertedCount,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        console.error('Error in bulk upload:', error);
        res.status(500).json({ message: 'Server error processing bulk upload' });
    }
};

// @route   POST /api/admin/student
// @desc    Add a single student
exports.addStudent = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { firstName, lastName, indexNumber, email, faculty, year, sex } = req.body;

        if (!indexNumber || !sex || !email) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Index Number, Sex, and Email are required' });
        }

        // Check for duplicates
        const existingStudent = await Student.findOne({ indexNumber }).session(session);
        if (existingStudent) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: `Student with index ${indexNumber} already exists` });
        }

        const User = require('../models/User');
        let user = await User.findOne({ email }).session(session);
        if (!user) {
            user = new User({
                email,
                password: indexNumber,
                role: 'Student'
            });
            await user.save({ session });
        }

        const studentPayload = {
            firstName,
            lastName,
            name: `${firstName || ''} ${lastName || ''}`.trim(),
            indexNumber,
            email,
            year,
            sex,
            userId: user._id
        };

        // Try mapping faculty if provided
        if (faculty) {
            const facStr = faculty.toLowerCase();
            const dbFac = await Faculty.findOne({ $or: [{ name: new RegExp('^' + facStr + '$', 'i') }, { facultyCode: new RegExp('^' + facStr + '$', 'i') }] }).session(session);
            if (dbFac) {
                studentPayload.faculty = dbFac._id;
            }
        }

        const student = new Student(studentPayload);
        await student.save({ session });

        await session.commitTransaction();
        session.endSession();
        res.status(201).json(student);
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).json({ message: 'Server error adding student' });
    }
};

// @route   GET /api/admin/students/count
// @desc    Get aggregate student counts
exports.getStudentCount = async (req, res) => {
    try {
        const { facultyId, year } = req.query;

        const filter = {};

        if (facultyId && mongoose.Types.ObjectId.isValid(facultyId)) {
            filter.faculty = facultyId;
        }

        if (year) {
            filter.year = new RegExp(year, 'i');
        }

        const count = await Student.countDocuments(filter);

        res.status(200).json({ count });

    } catch (error) {
        console.error('Error fetching student count:', error);
        res.status(500).json({ message: 'Server error fetching student count' });
    }
};

// @route   GET /api/admin/students/unassigned
// @desc    Get students not assigned to any room, filtered by faculty, year, and search
exports.getUnassignedStudents = async (req, res) => {
    try {
        const { faculty, year, search } = req.query;

        const filter = { assignedRoom: null };

        if (faculty && mongoose.Types.ObjectId.isValid(faculty)) {
            filter.faculty = faculty;
        }

        if (year) {
            filter.year = year;
        }

        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { firstName: new RegExp(search, 'i') },
                { lastName: new RegExp(search, 'i') },
                { indexNumber: new RegExp(search, 'i') }
            ];
        }

        const students = await Student.find(filter).limit(20).populate('faculty');
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching unassigned students:', error);
        res.status(500).json({ message: 'Server error fetching students' });
    }
};

// @route   PUT /api/admin/student/:studentId/unassign
// @desc    Unassign a student from their current room
exports.unassignStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        student.assignedRoom = null;
        await student.save();

        res.status(200).json({
            message: 'Student successfully unassigned',
            student
        });
    } catch (error) {
        console.error('Error unassigning student:', error);
        res.status(500).json({ message: 'Server error unassigning student' });
    }
};

// @route   PUT /api/admin/students/:id
// @desc    Update student details
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, indexNumber, faculty, year, email } = req.body;

        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (firstName) student.firstName = firstName;
        if (lastName) student.lastName = lastName;

        // Automatically sync the combined name if both are present or individually updated
        if (firstName || lastName) {
            student.name = `${student.firstName || ''} ${student.lastName || ''}`.trim();
        }

        if (indexNumber) student.indexNumber = indexNumber;
        if (faculty) student.faculty = faculty;

        // If year changes and student is assigned to a room, sync the room's year level
        if (year && year !== student.year && student.assignedRoom) {
            await Room.findByIdAndUpdate(student.assignedRoom, {
                $set: { 'allocation.year': year }
            });
        }

        if (year) student.year = year;
        if (email !== undefined) student.email = email;

        await student.save();
        res.status(200).json({ message: 'Student updated successfully', student });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ message: 'Server error updating student' });
    }
};

// @route   DELETE /api/admin/students/:id
// @desc    Delete student and free room capacity
exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findById(id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Deleting student is enough as our layout logic fetches students based on assignedRoom index
        await Student.findByIdAndDelete(id);

        res.status(200).json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ message: 'Server error deleting student' });
    }
};

// @route   POST /api/admin/students/rollover
// @desc    Academic Year Rollover: Targeted deletion or promotion
exports.academicRollover = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { facultyId, year, roomStrategy } = req.body;

        // Build base query
        const query = {};
        if (facultyId && facultyId !== 'all') {
            query.faculty = facultyId;
        }

        const studentUpdateMod = {};
        if (roomStrategy === 'vacate') {
            studentUpdateMod.assignedRoom = null;
        }

        if (year === 'all') {
            // Global Rollover
            const deleteResult = await Student.deleteMany({ ...query, year: '4' }).session(session);

            await Student.updateMany({ ...query, year: '3' }, { $set: { year: '4', ...studentUpdateMod } }).session(session);
            await Student.updateMany({ ...query, year: '2' }, { $set: { year: '3', ...studentUpdateMod } }).session(session);
            await Student.updateMany({ ...query, year: '1' }, { $set: { year: '2', ...studentUpdateMod } }).session(session);

            if (roomStrategy === 'upgrade') {
                const roomQuery = (facultyId && facultyId !== 'all') ? { 'allocation.faculty': facultyId } : {};
                await Room.updateMany({ ...roomQuery, 'allocation.year': '3' }, { $set: { 'allocation.year': '4' } }).session(session);
                await Room.updateMany({ ...roomQuery, 'allocation.year': '2' }, { $set: { 'allocation.year': '3' } }).session(session);
                await Room.updateMany({ ...roomQuery, 'allocation.year': '1' }, { $set: { 'allocation.year': '2' } }).session(session);
            }

            await session.commitTransaction();
            res.status(200).json({
                message: 'Global rollover completed',
                graduatedCount: deleteResult.deletedCount
            });
        } else {
            // Targeted Rollover
            if (year === '4') {
                const result = await Student.deleteMany({ ...query, year: '4' }).session(session);
                await session.commitTransaction();
                res.status(200).json({ message: `Graduated ${result.deletedCount} students from Year 4`, graduatedCount: result.deletedCount });
            } else {
                const nextYear = (parseInt(year) + 1).toString();
                const result = await Student.updateMany({ ...query, year }, { $set: { year: nextYear, ...studentUpdateMod } }).session(session);

                if (roomStrategy === 'upgrade') {
                    const roomQuery = { 'allocation.year': year };
                    if (facultyId && facultyId !== 'all') roomQuery['allocation.faculty'] = facultyId;
                    await Room.updateMany(roomQuery, { $set: { 'allocation.year': nextYear } }).session(session);
                }

                await session.commitTransaction();
                res.status(200).json({ message: `Promoted ${result.modifiedCount} students to Year ${nextYear}` });
            }
        }
    } catch (error) {
        await session.abortTransaction();
        console.error('Error during academic rollover:', error);
        res.status(500).json({ message: 'Server error during targeted rollover' });
    } finally {
        session.endSession();
    }
};
// @route   GET /api/admin/students
// @desc    Get all students with advanced filtering and global stats
exports.getStudents = async (req, res) => {
    try {
        const { faculty, year, status, search, sex, page = 1, limit = 15 } = req.query;

        const filter = {};

        if (faculty && mongoose.Types.ObjectId.isValid(faculty)) {
            filter.faculty = faculty;
        }

        if (year) {
            filter.year = year;
        }

        if (sex) {
            filter.sex = sex;
        }

        if (status === 'assigned') {
            filter.assignedRoom = { $ne: null };
        } else if (status === 'unassigned') {
            filter.assignedRoom = null;
        }

        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { firstName: new RegExp(search, 'i') },
                { lastName: new RegExp(search, 'i') },
                { indexNumber: new RegExp(search, 'i') }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [students, totalFiltered, stats] = await Promise.all([
            Student.find(filter)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('faculty')
                .populate({
                    path: 'assignedRoom',
                    populate: { path: 'hostel', select: 'officialName alias' }
                })
                .sort({ createdAt: -1 }),
            Student.countDocuments(filter),
            Promise.all([
                Student.countDocuments({}),
                Student.countDocuments({ assignedRoom: { $ne: null } }),
                Student.countDocuments({ assignedRoom: null })
            ])
        ]);

        res.status(200).json({
            students,
            stats: {
                total: stats[0],
                assigned: stats[1],
                unassigned: stats[2]
            },
            pagination: {
                total: totalFiltered,
                page: parseInt(page),
                pages: Math.ceil(totalFiltered / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Server error fetching students' });
    }
};

// @route   GET /api/admin/hostels/capacity-stats
// @desc    Get real-time capacity and occupancy statistics
exports.getHostelCapacityStats = async (req, res) => {
    try {
        const pipeline = [];

        // Role-Based Scoping Stage
        if (req.user.role === 'Admin') {
            const managedIds = req.user.managedHostelIds || [];
            if (managedIds.length === 0) {
                return res.status(200).json({
                    hostels: [],
                    global: { totalCapacity: 0, filledBeds: 0, availableBeds: 0, occupancyRate: 0 }
                });
            }
            pipeline.push({ $match: { hostel: { $in: managedIds } } });
        }
        pipeline.push(
            {
                $group: {
                    _id: "$hostel",
                    totalCapacity: { $sum: { $ifNull: ["$allocation.capacity", 0] } },
                    roomIds: { $push: "$_id" }
                }
            },
            {
                $lookup: {
                    from: "students",
                    localField: "roomIds",
                    foreignField: "assignedRoom",
                    as: "residents"
                }
            },
            {
                $lookup: {
                    from: "hostels",
                    localField: "_id",
                    foreignField: "_id",
                    as: "hostelDetails"
                }
            },
            {
                $unwind: "$hostelDetails"
            },
            {
                $project: {
                    _id: 1,
                    name: "$hostelDetails.officialName",
                    alias: "$hostelDetails.alias",
                    totalCapacity: 1,
                    filledBeds: { $size: "$residents" },
                    availableBeds: { $subtract: ["$totalCapacity", { $size: "$residents" }] },
                    occupancyRate: {
                        $cond: [
                            { $eq: ["$totalCapacity", 0] },
                            0,
                            { $multiply: [{ $divide: [{ $size: "$residents" }, "$totalCapacity"] }, 100] }
                        ]
                    }
                }
            },
            { $sort: { name: 1 } }
        );

        const stats = await Room.aggregate(pipeline);

        const globalStats = stats.reduce((acc, curr) => ({
            totalCapacity: acc.totalCapacity + curr.totalCapacity,
            filledBeds: acc.filledBeds + curr.filledBeds,
            availableBeds: acc.availableBeds + curr.availableBeds
        }), { totalCapacity: 0, filledBeds: 0, availableBeds: 0 });

        globalStats.occupancyRate = globalStats.totalCapacity > 0
            ? (globalStats.filledBeds / globalStats.totalCapacity) * 100
            : 0;

        res.status(200).json({
            hostels: stats,
            global: globalStats
        });

    } catch (error) {
        console.error('Error fetching capacity stats:', error);
        res.status(500).json({ message: 'Server error generating capacity analytics' });
    }
};

// @route   GET /api/admin/reports/maintenance
// @desc    Get paginated maintenance report for broken assets (based on tickets)
exports.getMaintenanceReport = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const { status = 'Pending', issueType } = req.query;

        const skip = (page - 1) * limit;

        const query = {};
        if (status !== 'all') {
            query.status = status;
        }

        if (issueType && issueType !== 'all') {
            query.assetKey = new RegExp(issueType, 'i');
        }

        // Role-based scoping
        if (req.user.role === 'Admin' && req.user.managedHostelIds && req.user.managedHostelIds.length > 0) {
            query.hostel = { $in: req.user.managedHostelIds };
        }

        const [tickets, totalCount] = await Promise.all([
            MaintenanceTicket.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('reportedBy', 'name indexNumber'),
            MaintenanceTicket.countDocuments(query)
        ]);

        // Enrich tickets with location details manually (since locationId is dynamic)
        const enrichedTickets = await Promise.all(tickets.map(async (ticket) => {
            let location;
            if (ticket.locationType === 'Room') {
                location = await Room.findById(ticket.locationId).populate('hostel', 'officialName');
            } else {
                location = await CommonArea.findById(ticket.locationId).populate('hostel', 'officialName');
            }

            const ticketObj = ticket.toObject();
            if (location) {
                const locName = ticket.locationType === 'Room' 
                    ? `Room ${location.roomNumber}` 
                    : `${location.type}`;
                ticketObj.locationDetails = `${location.hostel?.officialName} - Floor ${location.floor} - ${locName}`;
            } else {
                ticketObj.locationDetails = 'Unknown Location';
            }
            return ticketObj;
        }));

        res.status(200).json({
            issues: enrichedTickets,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page
        });

    } catch (error) {
        console.error('Error fetching maintenance report:', error);
        res.status(500).json({ message: 'Server error generating reports' });
    }
};

// @route   PATCH /api/admin/reports/:ticketId/resolve
// @desc    Resolve a maintenance ticket and sync with Room/CommonArea assets
exports.resolveMaintenanceTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const ticket = await MaintenanceTicket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: 'Maintenance ticket not found' });
        }

        if (ticket.status === 'Resolved') {
            return res.status(400).json({ message: 'Ticket is already resolved' });
        }

        let location;
        if (ticket.locationType === 'Room') {
            location = await Room.findById(ticket.locationId);
        } else {
            location = await CommonArea.findById(ticket.locationId);
        }

        if (!location) {
            return res.status(404).json({ message: 'Associated location not found' });
        }

        const asset = location.assets[ticket.assetKey];
        if (!asset) {
            return res.status(400).json({ message: 'Asset key mismatch in location' });
        }

        // Logic check: only increment working if notWorking > 0
        if (asset.notWorking > 0) {
            asset.working += 1;
            asset.notWorking -= 1;
            
            location.markModified(`assets.${ticket.assetKey}`);
            await location.save();
        }

        ticket.status = 'Resolved';
        ticket.resolvedAt = new Date();
        await ticket.save();

        res.status(200).json({ 
            message: 'Asset updated and issue resolved successfully', 
            ticket 
        });

    } catch (error) {
        console.error('Error resolving maintenance ticket:', error);
        res.status(500).json({ message: 'Server error resolving maintenance issue' });
    }
};

// @route   POST /api/admin/room-gender-migration
// @desc    Trigger one-time migration to set genderType for occupied rooms
exports.runGenderMigration = async (req, res) => {
    try {
        const count = await migrateRoomGender();
        res.json({
            success: true,
            message: `Migration successful. ${count} rooms updated based on current occupants.`
        });
    } catch (error) {
        console.error('Migration endpoint error:', error);
        res.status(500).json({ message: 'Internal server error during migration.' });
    }
};

// @route   POST /api/admin/fix-gender-mismatches
// @desc    Diagnose and unassign students whose gender doesn't match their hostel
exports.runGenderFix = async (req, res) => {
    try {
        const mismatches = await fixGenderMismatches();
        res.json({
            success: true,
            totalMismatches: mismatches.length,
            mismatches
        });
    } catch (error) {
        console.error('Gender fix endpoint error:', error);
        res.status(500).json({ message: 'Internal server error during gender fix.' });
    }
};

// @desc    Get all users with 'Admin' role
exports.getAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: 'Admin' }).populate('managedHostelIds', 'officialName alias');
        res.status(200).json(admins);
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ message: 'Server error fetching admins' });
    }
};

// @desc    Create a new Admin user
exports.createAdmin = async (req, res) => {
    try {
        const { email, name, password, managedHostelIds } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const admin = await User.create({
            email,
            name,
            password, // Hashed via pre-save hook
            role: 'Admin',
            managedHostelIds: managedHostelIds || [],
            isFirstLogin: true
        });

        res.status(201).json({
            _id: admin._id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            managedHostelIds: admin.managedHostelIds
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ message: 'Server error creating admin' });
    }
};

// @route   PUT /api/admin/admins/:id/hostel
// @desc    Assign or update managed hostels for an admin
exports.updateAdminHostel = async (req, res) => {
    try {
        const { id } = req.params;
        const { managedHostelIds } = req.body;

        const admin = await User.findById(id);
        if (!admin || admin.role !== 'Admin') {
            return res.status(404).json({ message: 'Admin not found' });
        }

        admin.managedHostelIds = managedHostelIds || [];
        await admin.save();

        res.status(200).json({
            message: 'Admin hostel assignments updated',
            admin: {
                _id: admin._id,
                email: admin.email,
                managedHostelIds: admin.managedHostelIds
            }
        });
    } catch (error) {
        console.error('Error updating admin hostel:', error);
        res.status(500).json({ message: 'Server error updating admin hostel' });
    }
};

// @route   PUT /api/admin/admins/:id
// @desc    Update Admin user details (name/email)
exports.updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        const admin = await User.findById(id);
        if (!admin || admin.role !== 'Admin') {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== admin.email) {
            const userExists = await User.findOne({ email });
            if (userExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            admin.email = email;
        }

        if (name) admin.name = name;
        await admin.save();

        res.status(200).json({
            message: 'Admin updated successfully',
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email
            }
        });
    } catch (error) {
        console.error('Error updating admin:', error);
        res.status(500).json({ message: 'Server error updating admin' });
    }
};

// @route   DELETE /api/admin/admins/:id
// @desc    Permanently delete an Admin user
exports.deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = await User.findById(id);
        if (!admin || admin.role !== 'Admin') {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Clear reference in Hostels
        await Hostel.updateMany({ primaryWarden: id }, { $unset: { primaryWarden: "" } });

        await User.findByIdAndDelete(id);

        res.status(200).json({ message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ message: 'Server error deleting admin' });
    }
};
