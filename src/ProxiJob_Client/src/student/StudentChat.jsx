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
  const messagesRef = useRef([]);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Scroll to bottom on new messages and update messagesRef
  useEffect(() => {
    messagesRef.current = messages;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync messages with conversations list (unread counts and last message)
  useEffect(() => {
    if (!activeChat || messages.length === 0) return;
    
    const lastMsg = messages[messages.length - 1];
    
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id?.toString() === activeChat.id?.toString()) {
          return {
            ...c,
            lastMessage: lastMsg.text,
            time: lastMsg.time,
            unread: 0
          };
        }
        return c;
      })
    );
  }, [messages, activeChat]);

  // Load conversations list
  const loadConversations = async () => {
    try {
      const headers = getAuthHeader();
      const response = await fetch(`${IDENTITY_API_BASE_URL}/messages/conversations`, { headers });
      if (response.ok) {
        const data = await response.json();
        const rawList = Array.isArray(data) ? data : [];
        setConversations((prev) => {
          return rawList.map((c) => {
            const cid = (c.userId || c.UserId || c.id)?.toString();
            const isCurrentActive = activeChatRef.current && activeChatRef.current.id?.toString() === cid;
            const localConvo = prev.find((lc) => lc.id?.toString() === cid);

            let lastMsgText = c.lastMessage || c.LastMessage || "";
            let lastMsgTime = c.time || c.Time || "";
            let unreadVal = c.unread !== undefined ? c.unread : (c.Unread !== undefined ? c.Unread : 0);

            if (isCurrentActive) {
              unreadVal = 0;
              const currentMsgs = messagesRef.current;
              if (currentMsgs && currentMsgs.length > 0) {
                const lastMsg = currentMsgs[currentMsgs.length - 1];
                lastMsgText = lastMsg.text;
                lastMsgTime = lastMsg.time;
              }
            } else if (localConvo) {
              lastMsgText = localConvo.lastMessage || lastMsgText;
              lastMsgTime = localConvo.time || lastMsgTime;
              unreadVal = localConvo.unread;
            }

            return {
              id: cid,
              name: c.name || c.Name || "Người dùng",
              email: c.email || c.Email,
              avatar: c.avatar || c.Avatar || c.avatarUrl || c.AvatarUrl || "",
              phone: c.phone || c.Phone,
              lastMessage: lastMsgText,
              time: lastMsgTime,
              unread: unreadVal
            };
          });
        });
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
        const rawList = Array.isArray(data) ? data : [];
        const mapped = rawList.map((m) => {
          const senderId = m.senderId !== undefined ? m.senderId : m.SenderId;
          const content = m.content || m.Content || "";
          const createdAt = m.createdAt || m.CreatedAt;
          
          return {
            id: m.id || m.Id || Math.random(),
            sender: senderId?.toString() === partnerId?.toString() ? "employer" : "student",
            text: content,
            time: createdAt 
              ? new Date(createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) 
              : ""
          };
        });
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

    const hubUrl = IDENTITY_API_BASE_URL.replace(/\/api$/, "/hub/chat");
    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (senderId, messageContent) => {
      const currentChat = activeChatRef.current;
      const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      const isCurrentActive = currentChat && currentChat.id?.toString() === senderId?.toString();
      
      if (isCurrentActive) {
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

      setConversations((prev) => {
        const cid = senderId.toString();
        const existing = prev.find((c) => c.id?.toString() === cid);
        const others = prev.filter((c) => c.id?.toString() !== cid);
        if (existing) {
          const updated = {
            ...existing,
            lastMessage: messageContent,
            time: timeStr,
            unread: isCurrentActive ? 0 : (existing.unread + 1)
          };
          return [updated, ...others];
        }
        return prev;
      });
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

    setConversations((prev) => {
      const cid = activeChat.id?.toString();
      const existing = prev.find((c) => c.id?.toString() === cid);
      const others = prev.filter((c) => c.id?.toString() !== cid);
      if (existing) {
        const updated = {
          ...existing,
          lastMessage: textToSend,
          time: localMsg.time,
          unread: 0
        };
        return [updated, ...others];
      }
      return prev;
    });

    try {
      if (connectionRef.current && connectionRef.current.state === "Connected") {
        await connectionRef.current.invoke("SendMessage", activeChat.id, textToSend);
      }
    } catch (err) {
      console.log("Failed to send message:", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 h-[calc(100vh-140px)] flex flex-col md:flex-row bg-white border border-slate-100 shadow-xl rounded-3xl overflow-hidden">
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
                  {c.avatar ? (
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120";
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-sm shrink-0 border border-slate-200">
                      🏪
                    </div>
                  )}
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
                {activeChat.avatar ? (
                  <img
                    src={activeChat.avatar}
                    alt={activeChat.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120";
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-lg border border-orange-200">
                    🏪
                  </div>
                )}
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
