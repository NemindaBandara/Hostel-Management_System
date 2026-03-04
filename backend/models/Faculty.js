const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  facultyCode: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Faculty', facultySchema);
