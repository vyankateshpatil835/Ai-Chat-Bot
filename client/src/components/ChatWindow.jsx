import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

function ChatWindow({ chat, onSendMessage, sending }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  // Auto-scroll to the newest message whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    onSendMessage(input);
    setInput('');
  };

  if (!chat) {
    return (
      <div className="chat-window chat-window-empty">
        <p>Select a chat or start a new one.</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="messages">
        {chat.messages.map((msg, i) => (
          

<div key={i} className={`message message-${msg.role}`}>
  <span className="message-role">{msg.role === 'user' ? 'You' : 'AI'}</span>
    {msg.role === 'model' ? (
      <div className="markdown-body">
        <ReactMarkdown>{msg.text}</ReactMarkdown>
      </div>) : (<p>{msg.text}</p>)}
</div>
))}

        {sending && (
          <div className="message message-model message-pending">
            <span className="message-role">AI</span>
            <p className="typing-dots">
              <span></span><span></span><span></span>
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form className="message-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;