import { useState } from 'react';

function Sidebar({ chats, activeChatId, onSelectChat, onNewChat, onLogout, onDeleteChat, onRenameChat, loading }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const startEditing = (chat, e) => {
    e.stopPropagation(); // don't trigger onSelectChat when clicking rename
    setEditingId(chat._id);
    setEditValue(chat.title);
  };

  const submitRename = (chatId) => {
    if (editValue.trim()) {
      onRenameChat(chatId, editValue.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (chatId, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this chat? This can\'t be undone.')) {
      onDeleteChat(chatId);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">continuum</span>
      </div>

      <button className="new-chat-btn" onClick={onNewChat}>
        + New chat
      </button>

      <div className="chat-list">
        {loading && <p className="chat-list-status">Loading chats...</p>}
        {!loading && chats.length === 0 && (
          <p className="chat-list-status">No chats yet — start one above.</p>
        )}

        {chats.map((chat) => (
          <div
            key={chat._id}
            className={`chat-list-item ${chat._id === activeChatId ? 'active' : ''}`}
            onClick={() => onSelectChat(chat._id)}
          >
            {editingId === chat._id ? (
              <input
                className="rename-input"
                value={editValue}
                autoFocus
                onChange={(e) => setEditValue(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={() => submitRename(chat._id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename(chat._id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
              />
            ) : (
              <>
                <span className="chat-title-text">{chat.title}</span>
                <div className="chat-item-actions">
                  <button
                    className="icon-btn"
                    title="Rename"
                    onClick={(e) => startEditing(chat, e)}
                  >
                    ✎
                  </button>
                  <button
                    className="icon-btn"
                    title="Delete"
                    onClick={(e) => handleDelete(chat._id, e)}
                  >
                    ✕
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <button className="logout-btn" onClick={onLogout}>
        Log out
      </button>
    </aside>
  );
}

export default Sidebar;