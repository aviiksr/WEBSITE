const mongoose = require('mongoose');

const fileSchema = mongoose.Schema({
  originalName: { type: String, required: true },
  filename: { type: String, required: true }, // For S3 key or local filename
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true }, // S3 URL or local path
  category: { type: String, default: 'Others' },
  tags: [{ type: String }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  shareId: { type: String, unique: true, sparse: true },
  isDeleted: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
