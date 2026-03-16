const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (id, role, managedHostelIds) => {
    return jwt.sign({ id, role, managedHostelIds }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d'
    });
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                email: user.email,
                role: user.role,
                isFirstLogin: user.isFirstLogin,
                managedHostelIds: user.managedHostelIds || [],
                token: generateToken(user._id, user.role, user.managedHostelIds || [])
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// @route   POST /api/auth/change-password
// @desc    Update password and set isFirstLogin to false
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, password } = req.body;
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid current password' });
        }

        user.password = password;
        user.isFirstLogin = false;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error updating password' });
    }
};

// @route   PUT /api/auth/profile
// @desc    Update user profile (name)
exports.updateProfile = async (req, res) => {
    try {
        const { name } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = name || user.name;
        await user.save();

        // If user is a student, sync name with Student model
        if (user.role === 'Student') {
            const Student = require('../models/Student');
            await Student.findOneAndUpdate(
                { userId: user._id },
                { name: user.name }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                managedHostelIds: user.managedHostelIds
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};
