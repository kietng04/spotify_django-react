import React, { useState, useRef, useEffect } from 'react';
export default function ChatWidget() {
  // Lấy token từ localStorage thay vì AuthContext
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('spotify_token');
    }
    return null;
  });
  
  // Lấy thông tin người dùng từ localStorage
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('spotify_user');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const messagesContainerRef = useRef(null);
  const lastMessageRef = useRef(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const formatImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('/https%3A') || url.startsWith('/http%3A')) {
      return decodeURIComponent(url.substring(1));
    }
    
    if (url.startsWith('/') && !url.startsWith('/http')) {
      return `http://localhost:8000${url}`;
    }
    return url;
  };
  useEffect(() => {
    const checkToken = () => {
      const storedToken = localStorage.getItem('spotify_token');
      if (storedToken !== token) {
        setToken(storedToken);
      }
    };
    
    checkToken();
    window.addEventListener('storage', checkToken);
    
    return () => {
      window.removeEventListener('storage', checkToken);
    };
  }, []);

  
  useEffect(() => {
    if (token) {
      console.log('Token hiện tại:', token);
      fetchConversations();
    } else {
      console.warn('Không tìm thấy token, không thể tải cuộc trò chuyện');
    }
  }, [token]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, activeConversation]);

  // Tìm kiếm người dùng khi nhập
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchUsers(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      console.log('Đang lấy danh sách cuộc trò chuyện...');
      const response = await fetch('http://localhost:8000/api/conversations/search', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
        
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Dữ liệu cuộc trò chuyện:', data);
        
        // Transform the data to match the expected format in the UI
        const formattedConversations = data.map(conv => ({
          id: conv.conversation_id,
          username: conv.other_user.username,
          user_id: conv.other_user.id,
          lastMessage: conv.last_message || 'Chưa có tin nhắn',
          timestamp: conv.timestamp,
          avatarImg: conv.other_user.avatarImg,
          unread: 0 // You can add unread count in your backend response if needed
        }));
        
        setConversations(formattedConversations);
      } else {
        const errorData = await response.json();
        console.error('Lỗi lấy cuộc trò chuyện:', errorData);
      }
    } catch (error) {
      console.error('Lỗi kết nối hoặc xử lý:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const searchUsers = async (query) => {
    if (!token) {
      console.error('Không có token, không thể tìm kiếm');
      return;
    }
    
    setIsSearching(true);
    try {
      console.log(`Đang tìm kiếm người dùng với từ khóa: "${query}"`);
      
      const response = await fetch(`http://localhost:8000/api/user-search/?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Kết quả tìm kiếm:', data);
        setSearchResults(data);
      } else {
        console.error('API trả về lỗi:', data);
      }
    } catch (error) {
      console.error('Lỗi kết nối API tìm kiếm:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // CHỨC NĂNG MỚI: Tìm kiếm cuộc trò chuyện với một người dùng cụ thể
  const findConversationWithUser = async (userId) => {
    try {
      console.log(`Đang tìm kiếm cuộc trò chuyện với user ID: ${userId}`);
      
      const response = await fetch(`http://localhost:8000/api/conversations/search/?user_id=${userId}`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Kết quả tìm kiếm cuộc trò chuyện:', data);
        
        if (data.length > 0) {
          return data[0];  // Trả về cuộc trò chuyện đầu tiên tìm thấy
        }
        return null;
      } else {
        const errorData = await response.json();
        console.error('Lỗi tìm kiếm cuộc trò chuyện:', errorData);
        return null;
      }
    } catch (error) {
      console.error('Lỗi kết nối API tìm kiếm cuộc trò chuyện:', error);
      return null;
    }
  };

  // Hàm tạo cuộc trò chuyện mới
  const createConversation = async () => {
    if (!selectedUser) {
      console.error('Chưa chọn người dùng');
      return;
    }
    
    try {
      console.log(`Tạo cuộc trò chuyện với người dùng: ${selectedUser.username} (ID: ${selectedUser.id})`);
      
      const response = await fetch('http://localhost:8000/api/conversations/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          recipient_id: selectedUser.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Kết quả tạo cuộc trò chuyện:', data);
        
        // Tạo cuộc trò chuyện mới trong state
        const newConv = {
          id: data.conversation_id,
          user_id: selectedUser.id,
          username: selectedUser.username,
          lastMessage: initialMessage || '',
          unread: 0
        };
        
        setConversations(prev => [newConv, ...prev]);
        setActiveConversation(newConv);
        setMessages([]); // Reset messages
        
        // Nếu có tin nhắn khởi tạo, gửi nó
        if (initialMessage.trim()) {
          sendMessage(data.conversation_id, initialMessage);
        }
        
        // Đóng modal
        closeNewMessageModal();
      } else {
        const errorData = await response.json();
        console.error('Lỗi tạo cuộc trò chuyện:', errorData);
      }
    } catch (error) {
      console.error('Lỗi kết nối hoặc xử lý:', error);
    }
  };

  // Hàm gửi tin nhắn
  const sendMessage = async (conversationId, content) => {
    if (!content.trim()) return;
    
    try {
      console.log(`Gửi tin nhắn đến cuộc trò chuyện ${conversationId}: "${content}"`);
      
      const response = await fetch(`http://localhost:8000/api/messages/${conversationId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          content: content
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Tin nhắn đã gửi:', data);
        
        // Thêm tin nhắn vào state
        const newMsg = {
          id: data.id,
          sender: user?.id, // Lấy ID người dùng hiện tại
          text: content,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        
        setMessages(prev => [...prev, newMsg]);
        
        setConversations(prev => 
          prev.map(conv =>
            conv.id === conversationId 
              ? { 
                  ...conv, 
                  lastMessage: content, 
                  timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                } 
              : conv
          )
        );
        
        // Reset input sau khi gửi
        setNewMessage('');
              } else {
                const errorData = await response.json();
                console.error('Lỗi gửi tin nhắn:', errorData);
              }
            } catch (error) {
              console.error('Lỗi kết nối hoặc xử lý:', error);
            }
          };
        
          // Hàm mở cuộc trò chuyện
          const openConversation = async (conversation) => {
            try {
              console.log(`Mở cuộc trò chuyện ID: ${conversation.id}`);
              setActiveConversation(conversation);
              
              const response = await fetch(`http://localhost:8000/api/messages/${conversation.id}/`, {
                headers: {
                  'Authorization': `Token ${token}`
                }
              });
        
              if (response.ok) {
                const data = await response.json();
                console.log('Tin nhắn trong cuộc trò chuyện:', data);
                setMessages(data);
                
                // Đánh dấu cuộc trò chuyện đã đọc nếu có unread > 0
                if (conversation.unread > 0) {
                  setConversations(prev => 
                    prev.map(conv => 
                      conv.id === conversation.id 
                        ? {...conv, unread: 0} 
                        : conv
                    )
                  );
                  
                  // Có thể gọi API để đánh dấu đã đọc trên server
                  // markConversationAsRead(conversation.id);
                }
              } else {
                const errorData = await response.json();
                console.error('Lỗi lấy tin nhắn:', errorData);
              }
            } catch (error) {
              console.error('Lỗi kết nối hoặc xử lý:', error);
            }
          };
          
          // Xử lý chọn người dùng từ kết quả tìm kiếm
          const handleSelectUser = async (user) => {
            console.log('Đã chọn người dùng:', user);
            setSelectedUser(user);
            setSearchResults([]);
            
            // Kiểm tra xem đã có cuộc trò chuyện với người này chưa
            const existingConversation = await findConversationWithUser(user.id);
            if (existingConversation) {
              console.log('Đã tìm thấy cuộc trò chuyện hiện có:', existingConversation);
              
              // Đóng modal tin nhắn mới
              closeNewMessageModal();
              
              // Mở cuộc trò chuyện đã tồn tại
              setActiveConversation(existingConversation);
              openConversation(existingConversation);
            }
          };
          
          // Hàm bắt đầu cuộc trò chuyện mới
          const handleStartChat = async () => {
            if (!selectedUser) {
              console.error('Chưa chọn người dùng');
              return;
            }
            
            // Kiểm tra lại một lần nữa xem đã có cuộc trò chuyện chưa
            const existingConversation = await findConversationWithUser(selectedUser.id);
            
            if (existingConversation) {
              // Nếu đã có, mở nó
              closeNewMessageModal();
              setActiveConversation(existingConversation);
              openConversation(existingConversation);
              
              // Nếu có tin nhắn khởi tạo, gửi nó vào cuộc trò chuyện hiện có
              if (initialMessage.trim()) {
                sendMessage(existingConversation.id, initialMessage);
                setInitialMessage('');
              }
            } else {
              // Nếu chưa có, tạo mới
              createConversation();
            }
          };
        
          // Các hàm tiện ích
          const toggleChatWidget = () => setIsOpen(!isOpen);
          const closeChat = () => {
            setActiveConversation(null);
            setMessages([]);
          };
          const openNewMessageModal = () => {
            setIsNewMessageModalOpen(true);
            setSelectedUser(null);
            setSearchTerm('');
            setSearchResults([]);
            setInitialMessage('');
          };
          const closeNewMessageModal = () => {
            setIsNewMessageModalOpen(false);
            setSelectedUser(null);
            setSearchTerm('');
            setSearchResults([]);
            setInitialMessage('');
          };
          
          // Handle message input change
          const handleMessageChange = (e) => setNewMessage(e.target.value);
          const handleInitialMessageChange = (e) => setInitialMessage(e.target.value);
          const handleSearchChange = (e) => setSearchTerm(e.target.value);
          
          // Handle form submit
          const handleSubmit = (e) => {
            e.preventDefault();
            if (!activeConversation || !newMessage.trim()) return;
            
            sendMessage(activeConversation.id, newMessage);
          };
        
          // Format timestamp
          const formatTimestamp = (timestamp) => {
            if (!timestamp) return '';
            // Nếu là string, sử dụng trực tiếp
            if (typeof timestamp === 'string') return timestamp;
            // Nếu là Date object, format nó
            return new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          };
        
          // Render chat widget UI - chi tiết phần UI sẽ được tiếp tục thêm vào dưới đây
          return (
            <div className="fixed bottom-24 left-4" style={{ zIndex: 9999 }}>
              {/* Chat toggle button - luôn hiển thị */}
              <button 
                onClick={toggleChatWidget} 
                className="bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg flex items-center justify-center"
                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </button>
          
              {/* Chat widget container */}
              {isOpen && (
                <div className="fixed bottom-24 left-4 w-80 bg-white rounded-lg shadow-xl flex flex-col overflow-hidden" 
                     style={{ height: '500px', zIndex: 9999 }}>
                  {/* Header */}
                  <div className="bg-green-500 text-white p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-lg font-semibold ml-2">Tin nhắn</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* New message button */}
                      <button 
                        onClick={openNewMessageModal} 
                        className="hover:bg-green-600 rounded-full p-1"
                        title="Tin nhắn mới"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      {/* Close button */}
                      <button 
                        onClick={toggleChatWidget} 
                        className="hover:bg-green-600 rounded-full p-1"
                        title="Đóng"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
          
                  {/* Content */}
                  {token ? (
                    activeConversation ? (
                      <div className="flex flex-col h-full">
                        {/* Conversation header */}
                        <div className="bg-gray-100 p-3 flex items-center justify-between border-b">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold">{activeConversation.username?.charAt(0)}</span>
                            </div>
                            <span className="text-sm font-medium ml-2">{activeConversation.username}</span>
                          </div>
                          <button 
                            onClick={closeChat} 
                            className="text-gray-500 hover:text-gray-700"
                            title="Quay lại"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                        </div>
          
                        {/* Message list */}
                        <div 
                          ref={messagesContainerRef}
                          className="flex-1 overflow-y-auto p-3 space-y-3"
                        >
                          {messages.map((msg) => (
                            <div 
                              key={msg.id} 
                              className={`flex ${msg.sender === user?.id ? 'justify-end' : 'justify-start'}`}
                              ref={messages[messages.length - 1]?.id === msg.id ? lastMessageRef : null}
                            >
                              <div 
                                className={`max-w-[70%] p-3 rounded-lg ${
                                  msg.sender === user?.id 
                                    ? 'bg-green-500 text-white rounded-br-none' 
                                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                                }`}
                              >
                                <p className="text-sm">{msg.text}</p>
                                <p className={`text-xs ${msg.sender === user?.id ? 'text-green-100' : 'text-gray-500'} text-right mt-1`}>
                                  {formatTimestamp(msg.timestamp)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
          
                        {/* Message input */}
                        <form onSubmit={handleSubmit} className="p-3 bg-gray-100 border-t">
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={handleMessageChange}
                              placeholder="Aa"
                              className="flex-1 p-2 border border-gray-300 rounded-full focus:outline-none focus:border-green-500"
                            />
                            <button
                              type="submit"
                              disabled={!newMessage.trim()}
                              className={`ml-2 p-2 rounded-full ${newMessage.trim() ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto">
                        {/* Conversations list */}
                        {conversations.length > 0 ? (
                        conversations.map((conv) => (
                          <div
                            key={conv.id}
                            onClick={() => openConversation(conv)}
                            className={`p-3 border-b hover:bg-gray-100 cursor-pointer flex items-center ${
                              conv.unread > 0 ? 'bg-gray-50' : ''
                            }`}
                          >
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                              {conv.avatarImg ? (
                                <img 
                                src={formatImageUrl(conv.avatarImg)} 
                                alt={conv.username} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null; // Tránh lặp vô hạn
                                  e.target.style.display = 'none';
                                  
                                  // Thêm kiểm tra trước khi thay đổi style
                                  const fallbackSpan = e.target.parentNode.querySelector('span');
                                  if (fallbackSpan) {
                                    fallbackSpan.style.display = 'flex';
                                  } else {
                                    // Tạo span mới nếu không tìm thấy
                                    const newSpan = document.createElement('span');
                                    newSpan.className = 'text-sm font-bold';
                                    newSpan.style.display = 'flex';
                                    newSpan.textContent = conv.username?.charAt(0) || '?';
                                    e.target.parentNode.appendChild(newSpan);
                                  }
                                }}
                              />
                              ) : (
                                <span className="text-sm font-bold">{conv.username?.charAt(0)}</span>
                              )}
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <span className={`font-medium ${conv.unread > 0 ? 'font-bold text-black' : 'text-gray-800'}`}>
                                  {conv.username}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatTimestamp(conv.timestamp)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <p className={`text-sm truncate ${conv.unread > 0 ? 'font-medium text-black' : 'text-gray-500'}`}>
                                  {conv.lastMessage || 'Chưa có tin nhắn'}
                                </p>
                                {conv.unread > 0 && (
                                  <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {conv.unread}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          {isLoadingConversations ? (
                            <p>Đang tải cuộc trò chuyện...</p>
                          ) : (
                            <>
                              <p>Bạn chưa có cuộc trò chuyện nào.</p>
                              <button 
                                onClick={openNewMessageModal}
                                className="mt-2 text-green-500 hover:text-green-600"
                              >
                                Tạo tin nhắn mới
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      </div>
                    )
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-gray-700 mb-3">Vui lòng đăng nhập để sử dụng tính năng chat</p>
                      <button 
                        onClick={() => {
                          setIsOpen(false);
                          // Chuyển hướng đến trang đăng nhập
                          if (typeof window !== 'undefined') {
                            window.location.href = '/login';
                          }
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full"
                      >
                        Đăng nhập
                      </button>
                    </div>
                  )}
                </div>
              )}
          
              {/* New message modal */}
              {token && isNewMessageModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
                  <div className="bg-white rounded-lg w-96 max-w-md mx-auto overflow-hidden">
                    <div className="bg-green-500 text-white p-3 flex items-center justify-between">
                      <span className="text-lg font-semibold">Tin nhắn mới</span>
                      <button onClick={closeNewMessageModal} className="text-white hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="p-4">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Đến:</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder="Tìm kiếm người dùng..."
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:border-green-500"
                          />
                          {selectedUser && (
                            <div className="mt-2 p-2 bg-green-100 rounded-md flex items-center justify-between">
                              <span>{selectedUser.username}</span>
                              <button 
                                onClick={() => setSelectedUser(null)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
          
                        {/* Search results */}
                        {!selectedUser && searchResults.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                            {searchResults.map(user => (
                              <div
                                key={user.id}
                                onClick={() => handleSelectUser(user)}
                                className="p-2 hover:bg-gray-100 cursor-pointer"
                              >
                                {user.username}
                              </div>
                            ))}
                          </div>
                        )}
          
                        {isSearching && (
                          <div className="mt-2 text-sm text-gray-500">Đang tìm kiếm...</div>
                        )}
                      </div>
          
                      {selectedUser && (
                        <>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tin nhắn:</label>
                            <textarea
                              value={initialMessage}
                              onChange={handleInitialMessageChange}
                              placeholder="Nhập tin nhắn của bạn..."
                              rows={3}
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:border-green-500"
                            ></textarea>
                          </div>
          
                          <div className="flex justify-end">
                            <button
                              onClick={handleStartChat}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                            >
                              Gửi
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }