const express = require('express');
const router = express.Router();
const { uploadFile, getFiles, downloadFile, deleteFile, getTrashFiles, restoreFile, permanentDeleteFile, renameFile, shareFile, getSharedFile, toggleFavorite } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, upload.single('file'), uploadFile)
  .get(protect, getFiles);

router.get('/trash', protect, getTrashFiles);
router.get('/:id/download', protect, downloadFile);
router.put('/:id/restore', protect, restoreFile);
router.put('/:id/favorite', protect, toggleFavorite);
router.delete('/:id/permanent', protect, permanentDeleteFile);

router.route('/:id')
  .delete(protect, deleteFile)
  .put(protect, renameFile);

router.post('/:id/share', protect, shareFile);
router.get('/shared/:shareId', getSharedFile);

module.exports = router;
