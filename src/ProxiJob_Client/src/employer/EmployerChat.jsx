import { useState, useEffect, useRef } from "react";
import {
  Send, Phone, MessageCircle, RefreshCw, ChevronLeft, Search, Users,
  Sparkles, UserCheck, ShieldCheck, CheckCircle2, MessageSquare
} from "lucide-react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { IDENTITY_API_BASE_URL, getAuthHeader } from "../api/apiConfig";
import { getStoredToken } from "../api/auth";
import { getEmployees } from "../api/management";

const getInitials = (name) => {
  if (!name) return "NV";
  const words = name.trim().split(" ").filter(Boolean);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const QUICK_REPLIES = [
  "Em có thể đi làm ca sáng mai không?",
  "Shop đã nhận được đơn ứng tuyển của em.",
  "Em nhớ check-in QR đúng giờ tại cửa hàng nhé!",
  "Cảm ơn em đã hoàn thành xuất sắc ca làm!"
];

export default function EmployerChat() {
  const [conversations, setConversations] = useState([]);
  const [staffDirectory, setStaffDirectory] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("chats"); // "chats" | "directory"

  const connectionRef = useRef(null);
  const activeChatRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load active conversations
  const loadConversations = async () => {
    try {
      const headers = getAuthHeader();
      const response = await fetch(`${IDENTITY_API_BASE_URL}/messages/conversations`, { headers });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        const mapped = list.map(c => {
          const cid = (c.userId || c.UserId || c.id)?.toString();
          return {
            id: cid,
            name: c.name || c.Name || "Sinh viên",
            email: c.email || c.Email,
            avatar: c.avatar || c.Avatar || c.avatarUrl || c.AvatarUrl || "",
            phone: c.phone || c.Phone,
            lastMessage: c.lastMessage || c.LastMessage || "",
            time: c.time || c.Time || "",
            unread: c.unread !== undefined ? c.unread : (c.Unread !== undefined ? c.Unread : 0),
            gender: c.gender || c.Gender || "Male"
          };
        });
        setConversations(mapped);
      }
    } catch (err) {
      console.log("Failed to load conversations:", err);
    } finally {
      setLoadingConvos(false);
    }
  };

  // Load staff directory
  const loadStaffDirectory = async () => {
    try {
      const data = await getEmployees();
      const list = data?.items || (Array.isArray(data) ? data : []);
      setStaffDirectory(list);
    } catch (err) {
      console.log("Failed to load staff directory:", err);
    }
  };

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

          const isPartnerSender = senderId?.toString().toLowerCase() === partnerId?.toString().toLowerCase();

          return {
            id: m.id || m.Id || Math.random(),
            sender: isPartnerSender ? "student" : "employer",
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

      if (currentChat && currentChat.id?.toString() === senderId?.toString()) {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random(),
            sender: "student",
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
        console.log("[SignalR Employer] Connected successfully.");
      })
      .catch((err) => console.log("[SignalR Employer] Connection failed:", err));

    loadConversations();
    loadStaffDirectory();

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
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const textToSend = inputText;
    setInputText("");

    const localMsg = {
      id: Math.random(),
      sender: "employer",
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

  // Filtered lists
  const filteredConversations = conversations.filter(c =>
    (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone || "").includes(searchQuery)
  );

  const filteredDirectory = staffDirectory.filter(s => {
    const n = (s.name || s.Name || "").toLowerCase();
    const p = (s.phone || s.Phone || "");
    return n.includes(searchQuery.toLowerCase()) || p.includes(searchQuery);
  });

  // Create a lookup map for student avatars from active conversations
  const avatarMap = {};
  conversations.forEach((c) => {
    const key = c.id?.toString().toLowerCase();
    if (key && c.avatar) {
      avatarMap[key] = c.avatar;
    }
  });

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col gap-6">

      {/* ==================== 1. PREMIUM HEADER BANNER ==================== */}
      <div
        className="dashboard-fade-in dashboard-fade-in-1 relative overflow-hidden rounded-3xl shadow-lg border border-orange-100/80 dots-pattern"
        style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fef3c7 100%)" }}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-40 blur-2xl" style={{ background: "radial-gradient(circle, #f97316, transparent)" }} />

        <div className="relative z-10 p-6 md:p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white">
              <MessageCircle size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Trò Chuyện & Chỉ Đạo Công Việc Realtime
              </h1>
              <p className="text-slate-600 text-xs font-medium mt-0.5">
                Nhắn tin trực tiếp với nhân viên nội bộ & sinh viên ứng tuyển.
              </p>
            </div>
          </div>

          <button
            onClick={() => { loadConversations(); loadStaffDirectory(); }}
            className="bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 hover:text-orange-600 p-3 rounded-2xl border border-orange-200/60 shadow-xs transition-all duration-300 flex items-center gap-2 text-xs font-extrabold shrink-0"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* ==================== 2. MAIN CHAT CONTAINER ==================== */}
      <div className="dashboard-fade-in dashboard-fade-in-2 h-[calc(100vh-220px)] min-h-[580px] flex flex-col md:flex-row bg-white/80 backdrop-blur-sm border border-slate-100 shadow-xl rounded-3xl overflow-hidden">

        {/* ===== LEFT: SIDEBAR (Conversations & Staff Directory) ===== */}
        <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col shrink-0 bg-slate-50/50 ${activeChat ? "hidden md:flex" : "flex"}`}>

          {/* Sub-Tabs Selector */}
          <div className="p-3 bg-white border-b border-slate-100 flex gap-1">
            <button
              onClick={() => setSidebarTab("chats")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 flex items-center justify-center gap-2 ${
                sidebarTab === "chats"
                  ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <MessageSquare size={14} /> Trò chuyện ({conversations.length})
            </button>
            <button
              onClick={() => setSidebarTab("directory")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 flex items-center justify-center gap-2 ${
                sidebarTab === "directory"
                  ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <Users size={14} /> Danh bạ ({staffDirectory.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={sidebarTab === "chats" ? "Tìm đoạn chat..." : "Tìm nhân sự theo tên/SĐT..."}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Content List Area */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {sidebarTab === "chats" ? (
              /* TAB 1: ACTIVE CHATS */
              loadingConvos ? (
                <div className="text-center p-8 text-xs text-slate-400 font-semibold">Đang tải đoạn chat...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center p-8 text-xs text-slate-400 font-semibold">
                  <MessageCircle size={28} className="text-slate-300 mb-2 mx-auto" />
                  Chưa có đoạn chat nào. Chuyển sang tab "Danh bạ" để chủ động nhắn tin!
                </div>
              ) : (
                filteredConversations.map((c, idx) => {
                  const isActive = activeChat?.id === c.id;
                  const name = c.name || "Sinh viên";
                  return (
                    <div
                      key={c.id || idx}
                      onClick={() => handleSelectChat(c)}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all duration-200 flex items-center gap-3 border card-hover-lift ${
                        isActive
                          ? "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300 shadow-md shadow-orange-500/5"
                          : "bg-white border-slate-100 hover:border-orange-200"
                      }`}
                    >
                      {c.avatar ? (
                        <img
                          src={c.avatar}
                          alt={name}
                          className="w-11 h-11 rounded-2xl object-cover shrink-0 border border-slate-200"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120";
                          }}
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center font-black text-xs text-white uppercase shadow-sm shrink-0">
                          {getInitials(name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-black text-slate-800 text-xs truncate">{name}</h4>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">{c.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{c.lastMessage || "Nhắn tin chỉ đạo..."}</p>
                      </div>
                      {c.unread > 0 && (
                        <span className="h-5 w-5 bg-orange-600 rounded-full text-[10px] font-black text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  );
                })
              )
            ) : (
              /* TAB 2: STAFF DIRECTORY SELECTOR */
              filteredDirectory.length === 0 ? (
                <div className="text-center p-8 text-xs text-slate-400 font-semibold">
                  <Users size={28} className="text-slate-300 mb-2 mx-auto" />
                  Không tìm thấy nhân sự nào.
                </div>
              ) : (
                filteredDirectory.map((staff) => {
                  const empName = staff.name || staff.Name || "Nhân viên";
                  const empRole = staff.role || staff.Role || "Phục vụ";
                  const empPhone = staff.phone || staff.Phone || "";
                  const empUserId = (staff.userId || staff.UserId || staff.id)?.toString();
                  const empAvatar = staff.avatar || staff.Avatar || staff.avatarUrl || staff.AvatarUrl || avatarMap[empUserId?.toLowerCase()] || "";
                  const isInternal = (staff.employeeType || staff.EmployeeType || "Internal").toLowerCase() === "internal";

                  return (
                    <div
                      key={staff.id}
                      onClick={() => handleSelectChat({
                        id: empUserId,
                        name: empName,
                        phone: empPhone,
                        role: empRole,
                        avatar: empAvatar
                      })}
                      className="p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-orange-300 cursor-pointer transition-all duration-200 flex items-center gap-3 card-hover-lift"
                    >
                      {empAvatar ? (
                        <img
                          src={empAvatar}
                          alt={empName}
                          className="w-11 h-11 rounded-2xl object-cover shrink-0 border border-slate-200"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120";
                          }}
                        />
                      ) : (
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs text-white uppercase shadow-sm shrink-0 ${
                            isInternal
                              ? "bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/20"
                              : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20"
                          }`}
                        >
                          {getInitials(empName)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h4 className="font-black text-slate-800 text-xs truncate">{empName}</h4>
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            isInternal ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {isInternal ? "Nội bộ" : "Vãng lai"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{empRole} • {empPhone || "Chưa có SĐT"}</p>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* ===== RIGHT: CHAT DETAIL PANE ===== */}
        <div className={`flex-1 min-w-0 flex flex-col bg-slate-50/40 ${!activeChat ? "hidden md:flex justify-center items-center p-12 text-slate-400 text-center" : "flex"}`}>
          {!activeChat ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center shadow-xs">
                <MessageCircle size={32} className="text-orange-500" />
              </div>
              <h3 className="font-black text-slate-700 text-base">Chưa chọn ứng viên / nhân sự trò chuyện</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Bấm chọn một cuộc hội thoại bên trái hoặc chuyển sang tab <strong>"Danh bạ"</strong> để bắt đầu trò chuyện realtime ngay.
              </p>
            </div>
          ) : (
            <>
              {/* Active Header */}
              <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveChat(null)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 md:hidden"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {activeChat.avatar ? (
                    <img
                      src={activeChat.avatar}
                      alt={activeChat.name}
                      className="w-11 h-11 rounded-2xl object-cover shrink-0 border border-slate-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120";
                      }}
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-black text-xs text-white uppercase shadow-sm">
                      {getInitials(activeChat.name)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-black text-slate-800 text-sm tracking-tight">{activeChat.name}</h3>
                    <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Direct Chat • Online Realtime
                    </p>
                  </div>
                </div>

                {activeChat.phone && activeChat.phone !== "Không có" && (
                  <a
                    href={`tel:${activeChat.phone}`}
                    className="p-2.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-2xl border border-orange-200 transition-all font-bold text-xs flex items-center gap-1.5"
                  >
                    <Phone size={14} /> Gọi Điện
                  </a>
                )}
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                {loadingMsgs ? (
                  <div className="text-center p-8 text-xs text-slate-400 font-semibold">Đang tải lịch sử tin nhắn...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center p-8 text-xs text-slate-400 font-semibold">
                    Chưa có tin nhắn nào. Gửi tin nhắn đầu tiên bên dưới để chỉ đạo công việc!
                  </div>
                ) : (
                  messages.map((m, index) => {
                    const isEmployer = m.sender === "employer";
                    return (
                      <div
                        key={m.id || index}
                        className={`flex items-end gap-2 ${isEmployer ? "justify-end" : "justify-start"}`}
                      >
                        {!isEmployer && (
                          activeChat.avatar ? (
                            <img
                              src={activeChat.avatar}
                              alt={activeChat.name}
                              className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-200 mb-1"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120";
                              }}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center font-black text-[10px] text-white uppercase shrink-0 mb-1">
                              {getInitials(activeChat.name)}
                            </div>
                          )
                        )}
                        <div
                          className={`max-w-sm p-4 rounded-2xl text-xs leading-relaxed relative ${
                            isEmployer
                              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-none shadow-md shadow-orange-500/10 font-medium"
                              : "bg-white text-slate-800 border border-slate-100 rounded-bl-none shadow-xs font-medium"
                          }`}
                        >
                          <p>{m.text}</p>
                          <span className={`text-[9px] mt-1.5 block text-right font-bold ${isEmployer ? "text-orange-100" : "text-slate-400"}`}>
                            {m.time}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Chips */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto min-w-0 max-w-full">
                <span className="text-[10px] uppercase font-black text-slate-400 shrink-0 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-500" /> Nhắn nhanh:
                </span>
                {QUICK_REPLIES.map((text, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputText(text);
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:border-orange-300 hover:bg-orange-50 text-slate-600 hover:text-orange-600 rounded-xl text-[11px] font-bold transition whitespace-nowrap shrink-0 shadow-xs"
                  >
                    {text}
                  </button>
                ))}
              </div>

              {/* Input Footer */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Nhập tin nhắn chỉ đạo công việc..."
                  className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  className="h-12 w-12 btn-premium text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 transition shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
