const Chat = require('../models/Chat');
const { getGeminiReply } = require('../services/geminiService');

// POST /api/chats  → start a new chat session
exports.createChat = async (req, res) => {
  try {
    const chat = await Chat.create({ userId: req.userId, messages: [] });
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create chat', error: error.message });
  }
};

// GET /api/chats  → sidebar list, only THIS user's chats
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.userId })
      .select('title pinned createdAt updatedAt') // don't send full messages for the sidebar list
      .sort({ pinned: -1, updatedAt: -1 });
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chats', error: error.message });
  }
};

// GET /api/chats/:chatId  → full message history for one chat
exports.getChatById = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.chatId, userId: req.userId });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chat', error: error.message });
  }
};

// POST /api/chats/:chatId/messages  → the core feature
exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Message text is required' });

    const chat = await Chat.findOne({ _id: req.params.chatId, userId: req.userId });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // 1. Save the user's message
    chat.messages.push({ role: 'user', text });

    // 2. Ask Gemini, passing existing history for context
    const aiReplyText = await getGeminiReply(chat.messages, text);

    // 3. Save the AI's reply
    chat.messages.push({ role: 'model', text: aiReplyText });

    // 4. Auto-title new chats using the first message
    if (chat.title === 'New Chat') {
      chat.title = text.slice(0, 40);
    }

    await chat.save();
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

// PATCH /api/chats/:chatId  → rename a chat
exports.renameChat = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.chatId, userId: req.userId },
      { title: title.trim() },
      { new: true } // return the UPDATED document, not the old one
    );

    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Failed to rename chat', error: error.message });
  }
};

// DELETE /api/chats/:chatId
exports.deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({
      _id: req.params.chatId,
      userId: req.userId,
    });

    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    res.status(200).json({ message: 'Chat deleted', chatId: req.params.chatId });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete chat', error: error.message });
  }
};

// PATCH /api/chats/:chatId/pin
exports.togglePinChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.chatId, userId: req.userId });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    chat.pinned = !chat.pinned;
    await chat.save();
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update pin', error: error.message });
  }
};
