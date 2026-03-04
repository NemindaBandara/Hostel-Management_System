const express = require('express');
const router = express.Router();
const Hostel = require('../models/Hostel');
const Faculty = require('../models/Faculty');

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

module.exports = router;
