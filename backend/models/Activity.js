const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  actionType: {
    type: String,
    enum: ['LOGIN', 'REGISTER', 'UPLOAD', 'DELETE', 'SHARE'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
