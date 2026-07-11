const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  createChat,
  getChats,
  getChatById,
  sendMessage,
  renameChat,
  deleteChat
} = require('../controllers/chatController');

router.use(protect); // every route below requires a valid JWT

router.post('/', createChat);
router.get('/', getChats);
router.get('/:chatId', getChatById);
router.post('/:chatId/messages', sendMessage);
router.patch('/:chatId', renameChat);
router.delete('/:chatId', deleteChat);

module.exports = router;