import React, { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { api, connectSSE } from "../../api";

export function ChatBox({ requestId }) {
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const conn = connectSSE((event) => {
      if (event.type === "message" && event.message.request_id === requestId) {
        setMessages((prev) => [...prev, event.message]);
      }
    });
    return () => conn?.close();
  }, [requestId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await api.getMessages(requestId);
      setMessages(data.messages || []);
      setOtherUser(data.otherUser);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const body = input.trim();
    setInput("");
    try {
      const msg = await api.sendMessage(requestId, body);
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      alert("Failed to send message: " + e.message);
    }
  };

  if (loading) return <div style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>Loading chat...</div>;

  return (
    <div className="chat-panel" style={{ background: "var(--bg-elevated)", border: "1px solid var(--trace)", borderRadius: "var(--radius-md)" }}>
      {otherUser && (
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--trace)", fontSize: 13, fontWeight: 600 }}>
          Chat with {otherUser.name}
        </div>
      )}
      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <div style={{ margin: "auto", color: "var(--muted)", fontSize: 12 }}>Send a message to start the conversation!</div>
        ) : (
          messages.map((m) => {
            const isMine = otherUser ? m.sender_id !== otherUser.id : false;
            return (
              <div key={m.id} className={`chat-bubble ${isMine ? "chat-bubble--mine" : "chat-bubble--theirs"}`}>
                <div>{m.body}</div>
                <div className="chat-bubble__time">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={sendMessage} className="chat-input-row">
        <input 
          type="text" 
          className="input" 
          placeholder="Type a message..." 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={!input.trim()} style={{ padding: "8px 12px" }}>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
