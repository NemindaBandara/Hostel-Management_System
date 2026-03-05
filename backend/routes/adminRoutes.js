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

// @route   POST /api/admin/hostel/:hostelId/design
// @desc    Design a Hostel (Auto-generate Rooms)
router.post('/hostel/:hostelId/design', adminController.designHostel);

// @route   PUT /api/admin/room/:roomId/configure
// @desc    Configure Room Allocation Rules
router.put('/room/:roomId/configure', adminController.configureRoom);

// @route   PUT /api/admin/room/:roomId/assets
// @desc    Update Room Assets
router.put('/room/:roomId/assets', adminController.updateRoomAssets);

// @route   POST /api/admin/room/:roomId/allocate
// @desc    Allocate Student to Room
router.post('/room/:roomId/allocate', adminController.allocateStudent);

// @route   PUT /api/admin/common-area/:commonAreaId/assets
// @desc    Update Common Area Assets
router.put('/common-area/:commonAreaId/assets', adminController.updateCommonAreaAssets);

// @route   GET /api/admin/hostel/:hostelId/layout
// @desc    Get Hostel Layout (Rooms and Common Areas grouped by floor)
router.get('/hostel/:hostelId/layout', adminController.getHostelLayout);

module.exports = router;
