const express = require('express');
const router = express.Router();
const Hostel = require('../models/Hostel');
const Faculty = require('../models/Faculty');
const adminController = require('../controllers/adminController');

// @route   POST /api/admin/faculty
// @desc    Add a New Faculty
router.post('/faculty', async (req, res) => {
    try {
        const { name, color, facultyCode } = req.body;

        // Check if faculty already exists
        const existingFaculty = await Faculty.findOne({ facultyCode });
        if (existingFaculty) {
            return res.status(400).json({ message: 'Faculty with this code already exists' });
        }

        const faculty = new Faculty({ name, color, facultyCode });
        await faculty.save();

        res.status(201).json(faculty);
    } catch (error) {
        console.error('Error creating faculty:', error);
        res.status(500).json({ message: 'Server error creating faculty' });
    }
});

// @route   PUT /api/admin/hostel/:hostelId/floor/:floor/bulk-assets
// @desc    Mass-update all rooms on a specific floor with a copied asset template
router.put('/hostel/:hostelId/floor/:floor/bulk-assets', adminController.bulkUpdateFloorAssets);

// @route   GET /api/admin/faculties
// @desc    Get all Faculties
router.get('/faculties', adminController.getAllFaculties);

// @route   PUT /api/admin/faculty/:facultyId
// @desc    Edit existing Faculty
router.put('/faculty/:facultyId', adminController.updateFaculty);

// @route   DELETE /api/admin/faculty/:facultyId
// @desc    Delete existing Faculty
router.delete('/faculty/:facultyId', adminController.deleteFaculty);

// @route   POST /api/admin/hostel
// @desc    Add a New Hostel
router.post('/hostel', async (req, res) => {
    try {
        const { officialName, alias, gender, numberOfFloors } = req.body;

        // Use officialName as alias if alias is not provided
        const hostelAlias = alias || officialName;

        const hostel = new Hostel({
            officialName,
            alias: hostelAlias,
            gender,
            numberOfFloors
        });

        await hostel.save();

        res.status(201).json(hostel);
    } catch (error) {
        console.error('Error creating hostel:', error);
        res.status(500).json({ message: 'Server error creating hostel' });
    }
});

// @route   PUT /api/admin/hostel/:hostelId
// @desc    Edit existing Hostel
router.put('/hostel/:hostelId', adminController.updateHostel);

// @route   DELETE /api/admin/hostel/:hostelId
// @desc    Delete Building and cascade layout
router.delete('/hostel/:hostelId', adminController.deleteHostel);

// @route   POST /api/admin/hostel/:hostelId/design
// @desc    Design a Hostel (Auto-generate Rooms)
router.post('/hostel/:hostelId/design', adminController.designHostel);

// @route   DELETE /api/admin/hostel/:hostelId/design
// @desc    Reset a Hostel's floorplan layout
router.delete('/hostel/:hostelId/design', adminController.deleteHostelDesign);

// @route   PUT /api/admin/room/:roomId/configure
// @desc    Configure Room Allocation Rules
router.put('/room/:roomId/configure', adminController.configureRoom);

// @route   PUT /api/admin/rooms/bulk-update
// @desc    Bulk update multiple rooms configuration
router.put('/rooms/bulk-update', adminController.bulkUpdateRooms);

// @route   PUT /api/admin/room/:roomId
// @desc    Update Room Allocation and Assets
router.put('/room/:roomId', adminController.updateRoom);

// @route   PUT /api/admin/room/:roomId/assets
// @desc    Update Room Assets
router.put('/room/:roomId/assets', adminController.updateRoomAssets);

// @route   POST /api/admin/room/:roomId/allocate
// @desc    Allocate Student to Room
router.post('/room/:roomId/allocate', adminController.allocateStudent);

// @route   PUT /api/admin/common-area/:commonAreaId/assets
// @desc    Update Common Area Assets
router.put('/common-area/:commonAreaId/assets', adminController.updateCommonAreaAssets);

// @route   GET /api/admin/hostels
// @desc    Get all Hostels
router.get('/hostels', adminController.getAllHostels);

// @route   GET /api/admin/hostel/:hostelId/layout
// @desc    Get Hostel Layout (Rooms and Common Areas grouped by floor)
router.get('/hostel/:hostelId/layout', adminController.getHostelLayout);

// @route   POST /api/admin/students/bulk
// @desc    Bulk upload students via CSV
router.post('/students/bulk', adminController.bulkUploadStudents);

// @route   GET /api/admin/students
// @desc    Get all students with advanced filtering and global stats
router.get('/students', adminController.getStudents);

// @route   POST /api/admin/student
// @desc    Add a single student
router.post('/student', adminController.addStudent);

// @route   GET /api/admin/students/count
// @desc    Get aggregate student counts (supports filtering by year/faculty)
router.get('/students/count', adminController.getStudentCount);
const bulkAllocationController = require('../controllers/bulkAllocationController');

// ... existing routes ...

router.get('/students/unassigned', adminController.getUnassignedStudents);
router.put('/student/:studentId/unassign', adminController.unassignStudent);

// @route   POST /api/admin/allocate/bulk-smart
// @desc    Smart Bulk Student Allocation (Dry-run supported)
router.post('/allocate/bulk-smart', bulkAllocationController.bulkSmartAllocate);

// Student CRUD and Rollover
router.put('/students/:id', adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);
router.post('/students/rollover', adminController.academicRollover);

router.get('/hostels/capacity-stats', adminController.getHostelCapacityStats);

// Maintenance Reporting
router.get('/reports/maintenance', adminController.getMaintenanceReport);
router.patch('/reports/:ticketId/resolve', adminController.resolveMaintenanceTicket);

// Migration
router.post('/room-gender-migration', adminController.runGenderMigration);
router.post('/fix-gender-mismatches', adminController.runGenderFix);

module.exports = router;
