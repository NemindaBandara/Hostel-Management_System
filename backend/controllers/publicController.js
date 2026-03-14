const Faculty = require('../models/Faculty');

// @route   GET /api/public/faculties
// @desc    Get all Faculties for public legend/info
exports.getAllFaculties = async (req, res) => {
    try {
        const faculties = await Faculty.find({}, 'name color facultyCode');
        res.status(200).json(faculties);
    } catch (error) {
        console.error('Error fetching public faculties:', error);
        res.status(500).json({ message: 'Server error fetching faculties' });
    }
};
