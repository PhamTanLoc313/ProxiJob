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
    <div className="max-w-6xl mx-auto p-4 h-[calc(100vh-140px)] flex flex-col md:flex-row bg-white border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
      {/* 1. Conversations List Pane */}
      <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col shrink-0 ${activeChat ? "hidden md:flex" : "flex"}`}>
        <div className="p-4.5 bg-gradient-to-r from-slate-50 to-orange-50/10 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
            <MessageCircle size={16} className="text-orange-600" /> Tin nhắn trò chuyện
          </h2>
          <button
            onClick={loadConversations}
            className="p-2 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl border border-slate-200 shadow-xs transition duration-200 cursor-pointer"
          >
            <RefreshCw size={13} className="hover:rotate-180 transition-transform duration-300" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loadingConvos ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent" />
              <p className="text-[11px] font-semibold">Đang tải cuộc hội thoại...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-8 text-xs text-slate-450 font-semibold bg-slate-50/30 rounded-2xl border border-dashed border-slate-100">Chưa có cuộc trò chuyện nào.</div>
          ) : (
            conversations.map((c) => {
              const isActive = activeChat?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectChat(c)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition flex items-center gap-3 border ${
                    isActive
                      ? "bg-orange-500/10 border-orange-200/80 shadow-xs"
                      : "border-transparent hover:bg-slate-50/80"
                  }`}
                >
                  <div className="relative">
                    {c.avatar ? (
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120";
                        }}
                      />
                    ) : (
                      <div className="w-11 h-11 bg-orange-50 rounded-full flex items-center justify-center text-sm shrink-0 border border-orange-200 text-orange-700">
                        🏪
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-extrabold text-slate-800 text-xs truncate">{c.name || "Chủ cửa hàng"}</h4>
                      <span className="text-[9px] text-slate-400 font-semibold shrink-0">{c.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-1">{c.lastMessage}</p>
                  </div>
                  
                  {c.unread > 0 && (
                    <span className="h-4.5 min-w-4.5 px-1 bg-orange-600 border border-orange-500 rounded-full text-[9px] font-black text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-600/10">
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
      <div className={`flex-1 flex flex-col bg-slate-50/40 ${!activeChat ? "hidden md:flex justify-center items-center p-12 text-slate-400 text-center" : "flex"}`}>
        {!activeChat ? (
          <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
            <div className="h-20 w-20 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-orange-500/15 rotate-[-4deg]">
              <MessageCircle size={36} />
            </div>
            <h3 className="font-black text-slate-800 text-base mt-4 tracking-tight">Chưa chọn cuộc trò chuyện</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">Chọn một Nhà tuyển dụng bên trái để xem nội dung trao đổi và phản hồi chi tiết về ca làm.</p>
          </div>
        ) : (
          <>
            {/* Active Header */}
            <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center shadow-sm shadow-slate-900/2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveChat(null)}
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 md:hidden transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className="relative">
                  {activeChat.avatar ? (
                    <img
                      src={activeChat.avatar}
                      alt={activeChat.name}
                      className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120";
                      }}
                    />
                  ) : (
                    <div className="w-11 h-11 bg-orange-50 rounded-full flex items-center justify-center text-lg border border-orange-200 text-orange-700">
                      🏪
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                </div>

                <div>
                  <h3 className="font-black text-slate-800 text-xs tracking-tight">{activeChat.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Đang hoạt động</p>
                  </div>
                </div>
              </div>
              
              {activeChat.phone && activeChat.phone !== "Không có" && (
                <a
                  href={`tel:${activeChat.phone}`}
                  className="p-2.5 bg-slate-50 hover:bg-orange-600 hover:text-white rounded-xl border border-slate-200/80 shadow-xs transition duration-200"
                >
                  <Phone size={14} />
                </a>
              )}
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMsgs ? (
                <div className="flex flex-col items-center justify-center p-8 gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-400 border-t-transparent" />
                  <p className="text-[10px] text-slate-400 font-semibold">Đang tải lịch sử hội thoại...</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isStudent = m.sender === "student";
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isStudent ? "justify-end" : "justify-start"} items-end gap-2`}
                    >
                      <div
                        className={`max-w-xs p-3.5 rounded-2xl text-xs relative ${
                          isStudent
                            ? "bg-gradient-to-br from-orange-600 to-amber-500 text-white rounded-tr-none shadow-md shadow-orange-600/10"
                            : "bg-white text-slate-800 border border-slate-200/50 rounded-tl-none shadow-xs"
                        }`}
                      >
                        <p className="leading-relaxed font-semibold whitespace-pre-wrap">{m.text}</p>
                        <span className={`text-[8px] mt-1.5 block text-right font-semibold ${isStudent ? "text-orange-200" : "text-slate-400"}`}>
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
                placeholder="Nhập phản hồi hoặc thảo luận ca làm..."
                className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-orange-500 focus:bg-white transition duration-200 font-semibold"
              />
              <button
                type="submit"
                className="h-12 w-12 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/10 hover:shadow-orange-600/25 transition duration-300 hover:scale-[1.04] active:scale-95 cursor-pointer shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
