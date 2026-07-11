import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import './ChatPage.css';

function ChatPage() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loadingChats, setLoadingChats] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const { logout } = useAuth();
  const navigate = useNavigate();

  // Fetch the sidebar list once when the page loads
  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await api.get('/chats');
      setChats(res.data);
    } catch (err) {
      setError('Failed to load chats');
    } finally {
      setLoadingChats(false);
    }
  };

  const handleSelectChat = async (chatId) => {
    try {
      const res = await api.get(`/chats/${chatId}`);
      setActiveChat(res.data);
    } catch (err) {
      setError('Failed to open chat');
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await api.post('/chats');
      setChats((prev) => [res.data, ...prev]); // add to top of sidebar
      setActiveChat(res.data);
    } catch (err) {
      setError('Failed to create chat');
    }
  };

  const handleSendMessage = async (text) => {
    if (!activeChat) return;

    // Optimistic UI: show the user's message immediately,
    // don't wait for the server round-trip to display it
    const optimisticChat = {
      ...activeChat,
      messages: [...activeChat.messages, { role: 'user', text }],
    };
    setActiveChat(optimisticChat);
    setSending(true);
    setError('');

    try {
      const res = await api.post(`/chats/${activeChat._id}/messages`, { text });
      setActiveChat(res.data); // replace with real server state (includes AI reply)

      // Update the sidebar title/order without a full refetch
      setChats((prev) =>
        prev.map((c) => (c._id === res.data._id ? { ...c, title: res.data.title } : c))
      );
    } catch (err) {
      setError('Message failed to send. Try again.');
      setActiveChat(activeChat); // roll back the optimistic update
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChat = async (chatId) => {
  try {
    await api.delete(`/chats/${chatId}`);
    setChats((prev) => prev.filter((c) => c._id !== chatId));
    if (activeChat?._id === chatId) {
      setActiveChat(null); // was open? close it, since it no longer exists
    }
  } catch (err) {
    setError('Failed to delete chat');
  }
};

const handleRenameChat = async (chatId, newTitle) => {
  // Optimistic update — same pattern as sending messages
  setChats((prev) =>
    prev.map((c) => (c._id === chatId ? { ...c, title: newTitle } : c))
  );

  try {
    const res = await api.patch(`/chats/${chatId}`, { title: newTitle });
    if (activeChat?._id === chatId) {
      setActiveChat((prev) => ({ ...prev, title: res.data.title }));
    }
  } catch (err) {
    setError('Failed to rename chat');
    fetchChats(); // roll back by refetching real state from server
  }
};

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="chat-page">
      <Sidebar
        chats={chats}
        activeChatId={activeChat?._id}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onLogout={handleLogout}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        loading={loadingChats}
      />
      <ChatWindow chat={activeChat} onSendMessage={handleSendMessage} sending={sending} />
      {error && <div className="error-toast">{error}</div>}
    </div>
  );
}

export default ChatPage;