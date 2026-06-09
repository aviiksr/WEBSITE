const File = require('../models/File');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { uploadToS3, deleteFromS3, getS3SignedUrl } = require('../services/s3Service');
const { categorizeFile } = require('../services/categorizationService');
const { sendShareNotification } = require('../services/emailService');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const maxStorageBytes = req.user.isPremium ? 100 * 1024 * 1024 * 1024 : 15 * 1024 * 1024 * 1024;
    if (req.user.usedStorage + req.file.size > maxStorageBytes) {
      if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Storage limit exceeded. Please upgrade to premium.' });
    }

    let fileUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
    
    const s3Url = await uploadToS3(req.file);
    if (s3Url) {
      fileUrl = s3Url;
      fs.unlinkSync(req.file.path);
    }

    const skipAI = !!req.body.category;
    const { category: autoCategory, tags } = await categorizeFile(req.file.originalname, req.file.mimetype, skipAI);
    const category = req.body.category || autoCategory;

    const newFile = await File.create({
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
      category,
      tags,
      uploadedBy: req.user._id,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { usedStorage: req.file.size } });
    await Activity.create({ user: req.user._id, actionType: 'UPLOAD', fileId: newFile._id, description: `Uploaded file: ${req.file.originalname}` });

    res.status(201).json(newFile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFiles = async (req, res) => {
  try {
    const files = await File.find({ uploadedBy: req.user._id, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    
    // Generate pre-signed URLs for S3 files so they are accessible
    const filesWithSignedUrls = await Promise.all(
      files.map(async (file) => {
        const fileObj = file.toObject();
        // If the URL is an S3 URL, replace it with a signed URL
        if (fileObj.url && fileObj.url.includes('.s3.')) {
          const signedUrl = await getS3SignedUrl(fileObj.filename);
          if (signedUrl) {
            fileObj.url = signedUrl;
          }
        }
        return fileObj;
      })
    );
    
    res.json(filesWithSignedUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Generate a fresh pre-signed URL with Content-Disposition attachment
    if (file.url && file.url.includes('.s3.')) {
      const signedUrl = await getS3SignedUrl(file.filename, file.originalName);
      if (signedUrl) {
        return res.json({ downloadUrl: signedUrl });
      }
    }

    // Fallback: return the stored URL (local files)
    res.json({ downloadUrl: file.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Soft delete: move to trash
    file.isDeleted = true;
    await file.save();

    await Activity.create({ user: req.user._id, actionType: 'DELETE', description: `Moved file to trash: ${file.originalName}` });

    res.json({ message: 'File moved to trash' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTrashFiles = async (req, res) => {
  try {
    const files = await File.find({ uploadedBy: req.user._id, isDeleted: true }).sort({ updatedAt: -1 });
    
    const filesWithSignedUrls = await Promise.all(
      files.map(async (file) => {
        const fileObj = file.toObject();
        if (fileObj.url && fileObj.url.includes('.s3.')) {
          const signedUrl = await getS3SignedUrl(fileObj.filename);
          if (signedUrl) {
            fileObj.url = signedUrl;
          }
        }
        return fileObj;
      })
    );
    
    res.json(filesWithSignedUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const restoreFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    file.isDeleted = false;
    await file.save();

    await Activity.create({ user: req.user._id, actionType: 'UPLOAD', description: `Restored file from trash: ${file.originalName}` });

    res.json({ message: 'File restored successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const permanentDeleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const s3Deleted = await deleteFromS3(file.filename);
    if (!s3Deleted) {
      const localPath = `uploads/${file.filename}`;
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }

    await file.deleteOne();
    await User.findByIdAndUpdate(req.user._id, { $inc: { usedStorage: -file.size } });
    await Activity.create({ user: req.user._id, actionType: 'DELETE', description: `Permanently deleted file: ${file.originalName}` });

    res.json({ message: 'File permanently removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const renameFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (req.body.newName) file.originalName = req.body.newName;
    if (req.body.category !== undefined) file.category = req.body.category;
    await file.save();
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const shareFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!file.shareId) {
      file.shareId = uuidv4();
      await file.save();
    }
    
    const shareLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${file.shareId}`;
    const { recipientEmail } = req.body;

    if (recipientEmail) {
      await Activity.create({ user: req.user._id, actionType: 'SHARE', fileId: file._id, description: `Emailed share link for ${file.originalName} to ${recipientEmail}` });
      await sendShareNotification(req.user, file.originalName, shareLink, recipientEmail);
    } else {
      await Activity.create({ user: req.user._id, actionType: 'SHARE', fileId: file._id, description: `Generated share link for: ${file.originalName}` });
      await sendShareNotification(req.user, file.originalName, shareLink);
    }

    res.json({ shareId: file.shareId, file, message: recipientEmail ? `Link emailed to ${recipientEmail}` : 'Share link generated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSharedFile = async (req, res) => {
  try {
    const file = await File.findOne({ shareId: req.params.shareId });
    if (!file) return res.status(404).json({ message: 'File not found or link expired' });

    const signedUrl = await getS3SignedUrl(file.filename);
    const downloadUrl = signedUrl || file.url;

    res.json({ file, downloadUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    file.isFavorite = !file.isFavorite;
    await file.save();

    await Activity.create({ user: req.user._id, actionType: 'UPLOAD', fileId: file._id, description: `${file.isFavorite ? 'Favorited' : 'Unfavorited'} file: ${file.originalName}` });

    res.json(file);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { categoryName } = req.body;
    if (!categoryName) return res.status(400).json({ message: 'Category name required' });
    
    const user = await User.findById(req.user._id);
    if (!user.customCategories) {
      user.customCategories = [];
    }
    if (!user.customCategories.includes(categoryName)) {
      user.customCategories.push(categoryName);
      await user.save();
    }
    res.json({ message: 'Category created', categoryName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTextFile = async (req, res) => {
  try {
    const { filename, content, category } = req.body;
    if (!filename) return res.status(400).json({ message: 'Filename required' });

    const finalFilename = filename.endsWith('.txt') ? filename : `${filename}.txt`;
    const tempName = `${uuidv4()}-${finalFilename}`;
    const tempPath = path.join(__dirname, '..', 'uploads', tempName);
    
    fs.writeFileSync(tempPath, content || '');
    const size = fs.statSync(tempPath).size;

    const maxStorageBytes = req.user.isPremium ? 100 * 1024 * 1024 * 1024 : 15 * 1024 * 1024 * 1024;
    if (req.user.usedStorage + size > maxStorageBytes) {
      fs.unlinkSync(tempPath);
      return res.status(400).json({ message: 'Storage limit exceeded. Please upgrade to premium.' });
    }

    const fileObj = {
      path: tempPath,
      filename: tempName,
      originalname: finalFilename,
      mimetype: 'text/plain',
      size
    };

    let fileUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${tempName}`;
    const s3Url = await uploadToS3(fileObj);
    if (s3Url) {
      fileUrl = s3Url;
      fs.unlinkSync(tempPath);
    }

    const { category: autoCategory, tags } = await categorizeFile(finalFilename, 'text/plain');
    const finalCategory = category || autoCategory;

    const newFile = await File.create({
      originalName: finalFilename,
      filename: tempName,
      mimeType: 'text/plain',
      size,
      url: fileUrl,
      category: finalCategory,
      tags,
      uploadedBy: req.user._id,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { usedStorage: size } });
    await Activity.create({ user: req.user._id, actionType: 'UPLOAD', fileId: newFile._id, description: `Created text file: ${finalFilename}` });

    res.status(201).json(newFile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bulkDeleteFiles = async (req, res) => {
  try {
    const { fileIds } = req.body;
    if (!fileIds || !Array.isArray(fileIds)) return res.status(400).json({ message: 'fileIds array required' });
    
    await File.updateMany(
      { _id: { $in: fileIds }, uploadedBy: req.user._id },
      { $set: { isDeleted: true } }
    );
    await Activity.create({ user: req.user._id, actionType: 'DELETE', description: `Moved ${fileIds.length} files to trash` });
    res.json({ message: 'Files moved to trash' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bulkRestoreFiles = async (req, res) => {
  try {
    const { fileIds } = req.body;
    if (!fileIds || !Array.isArray(fileIds)) return res.status(400).json({ message: 'fileIds array required' });
    
    await File.updateMany(
      { _id: { $in: fileIds }, uploadedBy: req.user._id },
      { $set: { isDeleted: false } }
    );
    await Activity.create({ user: req.user._id, actionType: 'UPLOAD', description: `Restored ${fileIds.length} files from trash` });
    res.json({ message: 'Files restored successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bulkPermanentDeleteFiles = async (req, res) => {
  try {
    const { fileIds } = req.body;
    if (!fileIds || !Array.isArray(fileIds)) return res.status(400).json({ message: 'fileIds array required' });
    
    const files = await File.find({ _id: { $in: fileIds }, uploadedBy: req.user._id });
    let totalSizeFreed = 0;

    for (const file of files) {
      const s3Deleted = await deleteFromS3(file.filename);
      if (!s3Deleted) {
        const localPath = `uploads/${file.filename}`;
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      }
      totalSizeFreed += file.size;
    }

    await File.deleteMany({ _id: { $in: fileIds }, uploadedBy: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { $inc: { usedStorage: -totalSizeFreed } });
    await Activity.create({ user: req.user._id, actionType: 'DELETE', description: `Permanently deleted ${files.length} files` });

    res.json({ message: 'Files permanently removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const emptyTrash = async (req, res) => {
  try {
    const files = await File.find({ uploadedBy: req.user._id, isDeleted: true });
    let totalSizeFreed = 0;

    for (const file of files) {
      const s3Deleted = await deleteFromS3(file.filename);
      if (!s3Deleted) {
        const localPath = `uploads/${file.filename}`;
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      }
      totalSizeFreed += file.size;
    }

    await File.deleteMany({ uploadedBy: req.user._id, isDeleted: true });
    await User.findByIdAndUpdate(req.user._id, { $inc: { usedStorage: -totalSizeFreed } });
    await Activity.create({ user: req.user._id, actionType: 'DELETE', description: `Emptied trash (${files.length} files)` });

    res.json({ message: 'Trash emptied successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadFile, getFiles, downloadFile, deleteFile, getTrashFiles, restoreFile, permanentDeleteFile, renameFile, shareFile, getSharedFile, toggleFavorite, createCategory, createTextFile, bulkDeleteFiles, bulkRestoreFiles, bulkPermanentDeleteFiles, emptyTrash };
