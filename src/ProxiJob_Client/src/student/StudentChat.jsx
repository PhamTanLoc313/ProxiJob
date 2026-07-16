import { useState, useEffect, useRef } from "react";
import { Send, Phone, User, MessageCircle, RefreshCw, ChevronLeft } from "lucide-react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { IDENTITY_API_BASE_URL, getAuthHeader } from "../api/apiConfig";
import { getStoredToken } from "../api/auth";

export default function StudentChat() {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  
  const connectionRef = useRef(null);
  const activeChatRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversations list
  const loadConversations = async () => {
    try {
      const headers = getAuthHeader();
      const response = await fetch(`${IDENTITY_API_BASE_URL}/messages/conversations`, { headers });
      if (response.ok) {
        const data = await response.json();
        setConversations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.log("Failed to load conversations:", err);
    } finally {
      setLoadingConvos(false);
    }
  };

  // Load message history for active chat
  const loadMessages = async (partnerId) => {
    if (!partnerId) return;
    setLoadingMsgs(true);
    try {
      const headers = getAuthHeader();
      const response = await fetch(`${IDENTITY_API_BASE_URL}/messages/${partnerId}`, { headers });
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((m) => ({
          id: m.id || Math.random(),
          sender: m.senderId === partnerId ? "employer" : "student",
          text: m.content,
          time: new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        }));
        setMessages(mapped);
      }
    } catch (err) {
      console.log("Failed to load messages:", err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  // Set up SignalR
  useEffect(() => {
    let active = true;
    const token = getStoredToken();
    if (!token) return;

    const hubUrl = IDENTITY_API_BASE_URL.replace("/api", "/hub/chat");
    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (senderId, messageContent) => {
      const currentChat = activeChatRef.current;
      const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      
      if (currentChat && currentChat.id?.toString() === senderId?.toString()) {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random(),
            sender: "employer",
            text: messageContent,
            time: timeStr
          }
        ]);
      }
      loadConversations();
    });

    connection.start()
      .then(() => {
        connectionRef.current = connection;
        console.log("[SignalR] Connected successfully.");
      })
      .catch((err) => console.log("[SignalR] Connection failed:", err));

    loadConversations();

    return () => {
      active = false;
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, []);

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    loadMessages(chat.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const textToSend = inputText;
    setInputText("");

    // Append to local list immediately
    const localMsg = {
      id: Math.random(),
      sender: "student",
      text: textToSend,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };
    setMessages((prev) => [...prev, localMsg]);

    try {
      if (connectionRef.current && connectionRef.current.state === "Connected") {
        await connectionRef.current.invoke("SendMessage", activeChat.id, textToSend);
      }
      loadConversations();
    } catch (err) {
      console.log("Failed to send message:", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 min-h-[calc(100vh-140px)] flex flex-col md:flex-row bg-white border border-slate-100 shadow-xl rounded-3xl overflow-hidden">
      {/* 1. Conversations List Pane */}
      <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col shrink-0 ${activeChat ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
            <MessageCircle size={16} /> Tin nhắn trò chuyện
          </h2>
          <button
            onClick={loadConversations}
            className="p-1.5 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition"
          >
            <RefreshCw size={12} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConvos ? (
            <div className="text-center p-6 text-xs text-slate-400">Đang tải cuộc hội thoại...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-8 text-xs text-slate-400">Chưa có cuộc trò chuyện nào.</div>
          ) : (
            conversations.map((c) => {
              const isActive = activeChat?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectChat(c)}
                  className={`p-3 rounded-2xl cursor-pointer transition flex items-center gap-3 border ${
                    isActive
                      ? "bg-orange-50 border-orange-200"
                      : "border-transparent hover:bg-slate-50"
                  }`}
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border">
                    {c.gender === "Female" ? "👩‍💼" : "👨‍💼"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-bold text-slate-800 text-xs truncate">{c.name || "Chủ cửa hàng"}</h4>
                      <span className="text-[9px] text-slate-400 shrink-0">{c.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{c.lastMessage}</p>
                  </div>
                  {c.unread > 0 && (
                    <span className="h-4 w-4 bg-orange-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center shrink-0">
                      {c.unread}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Message Detail Pane */}
      <div className={`flex-1 flex flex-col bg-slate-50/50 ${!activeChat ? "hidden md:flex justify-center items-center p-12 text-slate-400 text-center" : "flex"}`}>
        {!activeChat ? (
          <div className="flex flex-col items-center gap-2">
            <MessageCircle size={48} className="text-slate-300" />
            <h3 className="font-extrabold text-slate-700 text-sm">Chưa chọn cuộc trò chuyện</h3>
            <p className="text-xs text-slate-400 max-w-xs">Chọn một người tuyển dụng từ danh mục bên trái để bắt đầu trao đổi chi tiết ca trực.</p>
          </div>
        ) : (
          <>
            {/* Active Header */}
            <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveChat(null)}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 md:hidden"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-lg border">
                  🏪
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{activeChat.name}</h3>
                  <p className="text-[10px] text-slate-400">Trực tuyến</p>
                </div>
              </div>
              
              {activeChat.phone && activeChat.phone !== "Không có" && (
                <a
                  href={`tel:${activeChat.phone}`}
                  className="p-2.5 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 rounded-xl border border-slate-200 transition"
                >
                  <Phone size={14} />
                </a>
              )}
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="text-center p-4 text-xs text-slate-400">Đang tải lịch sử tin nhắn...</div>
              ) : (
                messages.map((m) => {
                  const isStudent = m.sender === "student";
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isStudent ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-2xl text-xs relative ${
                          isStudent
                            ? "bg-orange-600 text-white rounded-tr-none shadow-md shadow-orange-600/5"
                            : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                        }`}
                      >
                        <p>{m.text}</p>
                        <span className={`text-[8px] mt-1 block text-right ${isStudent ? "text-orange-200" : "text-slate-400"}`}>
                          {m.time}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập nội dung tin nhắn để phản hồi..."
                className="flex-1 h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-amber-400 focus:bg-white transition"
              />
              <button
                type="submit"
                className="h-11 w-11 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/10 transition shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
