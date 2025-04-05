import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  Avatar,
  Spinner,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Badge,
  Icon,
} from "@chakra-ui/react";
import { CloseIcon, ArrowBackIcon, EditIcon, ChatIcon, SendIcon } from '@chakra-ui/icons';
export default function ChatWidget() {
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('spotify_user');
      return userData ? JSON.parse(userData).token : null;
    }
    return null;
  });
  

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
  const [socket, setSocket] = useState(null);

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
      const userData = localStorage.getItem('spotify_user');
      const storedToken = userData ? JSON.parse(userData).token : null;
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
    const verifyAuthentication = async () => {
      const userData = localStorage.getItem('spotify_user');
      const storedToken = userData ? JSON.parse(userData).token : null;
      console.log('Checking authentication status:', { storedToken: !!storedToken });
    
      if (!storedToken) {
        console.warn('Không có token, người dùng chưa đăng nhập');
        return;
      }
      
      // Optional: Verify token is valid with a backend call
      try {
        const response = await fetch('http://localhost:8000/api/validate-token/', {
          headers: { 'Authorization': `Token ${storedToken}` }
        });
        
        if (response.ok) {
          console.log('Token hợp lệ');
          setToken(storedToken);
        } else {
          console.error('Token không hợp lệ hoặc hết hạn');
          // Clear invalid token
          localStorage.removeItem('spotify_user');
          setToken(null);
        }
      } catch (error) {
        console.error('Lỗi kiểm tra token:', error);
      }
    };
    
    verifyAuthentication();
  }, []); 

useEffect(() => {
  let reconnectTimer;
  
  const connectWebSocket = () => {
    if (token && user?.user_id) {
      const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${wsScheme}://localhost:8000/ws/chat/${user.user_id}/`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      const chatSocket = new WebSocket(wsUrl);
    
      chatSocket.onopen = () => {
        console.log('WebSocket connection established');
      };
      
      chatSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
      
          if (data.message) {
            if (activeConversation && data.conversation_id === activeConversation.id) {
              const newMsg = {
                id: data.message_id || new Date().getTime(), 
                sender: data.sender_id,
                text: data.message,
                timestamp: data.timestamp || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
              };
              
              setMessages(prev => [...prev, newMsg]);
            }
            setConversations(prev => {
              const currentTimestamp = new Date();
              const updatedConversations = prev.map(conv => 
                conv.id === data.conversation_id 
                  ? {
                      ...conv,
                      lastMessage: data.message,
                      fullTimestamp: currentTimestamp.toISOString(),
                      timestamp: data.timestamp || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                      unread: activeConversation?.id === data.conversation_id ? 0 : (conv.unread || 0) + 1
                    }
                  : conv
              );
              
              return updatedConversations.sort((a, b) => {
                if (a.fullTimestamp && b.fullTimestamp) {
                  return new Date(b.fullTimestamp) - new Date(a.fullTimestamp);
                }
                
                const timeA = typeof a.timestamp === 'string' ? new Date(a.timestamp) : a.timestamp;
                const timeB = typeof b.timestamp === 'string' ? new Date(b.timestamp) : b.timestamp;
                return new Date(timeB) - new Date(timeA);
              });
            });
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      chatSocket.onclose = (event) => {
        console.log('WebSocket connection closed:', event);
        clearTimeout(reconnectTimer);
        
        reconnectTimer = setTimeout(() => {
          if (token && user?.user_id) {
            console.log('Attempting to reconnect WebSocket...');
            connectWebSocket();
          }
        }, 3000);
      };
      
      chatSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      setSocket(chatSocket);
      
      return () => {
        console.log('Closing WebSocket connection');
        clearTimeout(reconnectTimer);
        chatSocket.close();
      };
    }
  };

  connectWebSocket();
  
  return () => {
    clearTimeout(reconnectTimer);
  };
}, [token, user?.user_id, activeConversation?.id]); // Include activeConversation.id to refresh WebSocket when conversation changes

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
      const userDataaa = localStorage.getItem('spotify_user');
      const tokenn = userDataaa ? JSON.parse(userDataaa).token : null;
      const response = await fetch('http://localhost:8000/api/conversations/search', {
        headers: {
          'Authorization': `Token ${tokenn}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Dữ liệu cuộc trò chuyện:', data);
    
        const formattedConversations = data.map(conv => {
          const convTime = conv.timestamp ? new Date(conv.timestamp) : new Date();
          
          return {
            id: conv.conversation_id,
            username: conv.other_user.username,
            user_id: conv.other_user.id,
            lastMessage: conv.last_message || 'Chưa có tin nhắn',
            fullTimestamp: convTime.toISOString(),
            timestamp: convTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            avatarImg: conv.other_user.avatarImg,
            unread: 0
          };
        }).sort((a, b) => new Date(b.fullTimestamp) - new Date(a.fullTimestamp));
        
        setConversations(formattedConversations);
        
        // Check if conversation with Gemini AI (user_id = 1) already exists
        const geminiConversation = formattedConversations.find(conv => conv.user_id === 1);
        if (!geminiConversation) {
          // If no conversation with Gemini AI exists, we might want to create it
          // or just let the user initiate it when they click on Gemini AI in the list
          console.log('Chưa có cuộc trò chuyện với Gemini AI');
        }
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
    const userData = localStorage.getItem('spotify_user');
    const token = userData ? JSON.parse(userData).token : null;

    if (!token) {
      console.error('Không có token, không thể tìm kiếm. Vui lòng đăng nhập lại.');
      // Maybe show a login prompt or error message to the user
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
  // CHỨC NĂNG MỚI: Tìm kiếm cuộc trò chuyện với một người dùng cụ thể
// CHỨC NĂNG MỚI: Tìm kiếm cuộc trò chuyện với một người dùng cụ thể
const findConversationWithUser = async (userId) => {
  try {
    console.log(`Đang tìm kiếm cuộc trò chuyện với user ID: ${userId}`);
    const userData = localStorage.getItem('spotify_user');
    const token = userData ? JSON.parse(userData).token : null;
    // Add timestamp to prevent caching
    const response = await fetch(`http://localhost:8000/api/conversations/search/?user_id=${userId}&_=${new Date().getTime()}`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Cache-Control': 'no-cache'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Kết quả tìm kiếm cuộc trò chuyện:', data);
      
      // Check if any conversations exist with this specific user
      if (data && Array.isArray(data) && data.length > 0) {
        const filteredConversations = data.filter(conv => 
          conv.other_user && conv.other_user.id === parseInt(userId)
        );
        
        if (filteredConversations.length > 0) {
          return filteredConversations[0]; // Return the first matching conversation
        }
      }
      return null; // No matching conversation found
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
  // Hàm tạo cuộc trò chuyện mới
const createConversation = async () => {
  if (!selectedUser) {
    console.error('Chưa chọn người dùng');
    return;
  }
  
  try {
    console.log(`Tạo cuộc trò chuyện với người dùng: ${selectedUser.username} (ID: ${selectedUser.id})`);
    const userData = localStorage.getItem('spotify_user');
    const token = userData ? JSON.parse(userData).token : null;
    const response = await fetch('http://localhost:8000/api/conversations/create/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({
        recipient_id: selectedUser.id,
        initial_message: initialMessage.trim() || null // Send the initial message with the request
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
        unread: 0,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      
      setConversations(prev => [newConv, ...prev]);
      setActiveConversation(newConv);
      
      // If the backend created a message, add it to the messages state
      if (data.message) {
        const newMsg = {
          id: data.message.id,
          sender: data.message.sender || user?.user_id, 
          text: data.message.content || data.message.text, 
          timestamp: data.message.timestamp
        };
        setMessages([newMsg]);
      } else {
        setMessages([]);
      }
      
      // Đóng modal
      closeNewMessageModal();
      setInitialMessage('');
    } else {
      const errorData = await response.json();
      console.error('Lỗi tạo cuộc trò chuyện:', errorData);
    }
  } catch (error) {
    console.error('Lỗi kết nối hoặc xử lý:', error);
  }
};

 // Add this helper function before the sendMessage function
const ensureWebSocketConnection = () => {
  // If socket doesn't exist or is closed/closing
  if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
    if (token && user?.user_id) {
      const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${wsScheme}://localhost:8000/ws/chat/${user.user_id}/`;
      
      console.log('Re-establishing WebSocket connection before sending message');
      const newSocket = new WebSocket(wsUrl);
      
      // Set basic handlers
      newSocket.onopen = () => console.log('WebSocket reconnected');
      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          // Process incoming messages
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      setSocket(newSocket);
      return newSocket;
    }
  }
  return socket;
};

const sendMessage = async (conversationId, content) => {
  if (!content.trim()) return;
  const currentTimestamp = new Date();
  
  try {
    // Check if this is a conversation with Gemini AI (user_id = 1)
    const isGeminiConversation = activeConversation?.user_id === 1 || conversationId === "gemini-ai";
    
    if (isGeminiConversation) {
      console.log(`Gửi tin nhắn đến Gemini AI: "${content}"`);
      
      // Add user message to the UI immediately
      const userMsg = {
        id: `user-msg-${Date.now()}`,
        sender: user?.user_id,
        text: content,
        timestamp: currentTimestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      
      setMessages(prev => [...prev, userMsg]);
      setNewMessage(''); // Clear input field
      
      // Show typing indicator
      const typingMsgId = `typing-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: typingMsgId,
        sender: 1, // Gemini AI user_id is 1
        text: "Đang trả lời...",
        timestamp: currentTimestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        isTyping: true
      }]);
      
      // Call the backend Gemini AI endpoint
      try {
        const userDataString = localStorage.getItem('spotify_user');
        const tokenz = userDataString ? JSON.parse(userDataString).token : null;
        
        const response = await fetch('http://localhost:8000/api/gemini/chat/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${tokenz}`
          },
          body: JSON.stringify({
            message: content
          })
        });
        
        // Remove typing indicator
        setMessages(prev => prev.filter(msg => msg.id !== typingMsgId));
        
        if (response.ok) {
          const data = await response.json();
          console.log('Phản hồi từ Gemini AI:', data);
          
          // Add AI response to messages
          const aiMsg = {
            id: data.ai_message?.id || `ai-msg-${Date.now()}`,
            sender: 1, // Gemini AI user_id is 1
            text: data.ai_message?.text || "Xin lỗi, tôi không thể trả lời lúc này.",
            timestamp: data.ai_message?.timestamp || currentTimestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          };
          
          setMessages(prev => [...prev, aiMsg]);
          
          // Update conversation last message if in conversation list
          if (activeConversation) {
            setActiveConversation(prev => ({
              ...prev,
              lastMessage: aiMsg.text,
              timestamp: aiMsg.timestamp
            }));
          }
          
          // Update conversations list if Gemini is in it
          setConversations(prev => {
            const geminiConv = prev.find(conv => conv.user_id === 1);
            if (geminiConv) {
              return prev.map(conv => 
                conv.user_id === 1 
                  ? {
                      ...conv,
                      lastMessage: aiMsg.text,
                      fullTimestamp: new Date().toISOString(),
                      timestamp: aiMsg.timestamp
                    }
                  : conv
              ).sort((a, b) => {
                if (a.fullTimestamp && b.fullTimestamp) {
                  return new Date(b.fullTimestamp) - new Date(a.fullTimestamp);
                }
                return 0;
              });
            }
            return prev;
          });
        } else {
          console.error('Lỗi khi gọi API Gemini:', await response.text());
          
          // Add error message
          setMessages(prev => [...prev, {
            id: `error-${Date.now()}`,
            sender: 1, // Gemini AI user_id is 1
            text: "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn.",
            timestamp: currentTimestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }]);
        }
      } catch (error) {
        console.error('Lỗi kết nối API Gemini:', error);
        
        // Remove typing indicator and show error message
        setMessages(prev => prev.filter(msg => msg.id !== typingMsgId));
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          sender: 1, // Gemini AI user_id is 1
          text: "Xin lỗi, không thể kết nối với dịch vụ AI. Vui lòng thử lại sau.",
          timestamp: currentTimestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
      }
      
      return; // Exit early for Gemini AI
    }
    
    // Regular conversation messaging logic
    console.log(`Gửi tin nhắn đến cuộc trò chuyện ${conversationId}: "${content}"`);
    const activeSocket = socket?.readyState === WebSocket.OPEN ? 
      socket : ensureWebSocketConnection();

    if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
      // WebSocket is available, send message through it
      const tempMsgId = `temp-${Date.now()}`;

      activeSocket.send(JSON.stringify({
        type: 'chat_message',
        conversation_id: conversationId,
        message: content,
        recipient_id: activeConversation.user_id
      }));
      
      // Add message to UI immediately (optimistic update)
      const newMsg = {
        id: tempMsgId,
        sender: user?.user_id,
        text: content,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      
      setMessages(prev => [...prev, newMsg]);
      
      // Update conversation in the list
      setConversations(prev => {
        const updatedConversations = prev.map(conv =>
          conv.id === conversationId 
            ? { 
                ...conv, 
                lastMessage: content, 
                fullTimestamp: new Date().toISOString(),
                timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
              } 
            : conv
        );
        
        return updatedConversations.sort((a, b) => {
          if (a.fullTimestamp && b.fullTimestamp) {
            return new Date(b.fullTimestamp) - new Date(a.fullTimestamp);
          }
          
          const timeA = typeof a.timestamp === 'string' ? new Date(a.timestamp) : a.timestamp;
          const timeB = typeof b.timestamp === 'string' ? new Date(b.timestamp) : b.timestamp;
          return new Date(timeB) - new Date(timeA);
        });
      });
      
      setNewMessage(''); // Clear input field
    } else {
      // WebSocket not available, use REST API
      console.log('WebSocket không khả dụng, sử dụng REST API');
      const userDataString = localStorage.getItem('spotify_user');
      const tokenz = userDataString ? JSON.parse(userDataString).token : null;
     
      const response = await fetch(`http://localhost:8000/api/messages/${conversationId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${tokenz}`
        },
        body: JSON.stringify({
          content: content
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Tin nhắn đã gửi:', data);
        
        // Add message to UI
        const newMsg = {
          id: data.id,
          sender: user?.user_id, 
          text: content,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        
        setMessages(prev => [...prev, newMsg]);

        // Update conversation in the list
        setConversations(prev => {
          const updatedConversations = prev.map(conv =>
            conv.id === conversationId 
              ? { 
                  ...conv, 
                  lastMessage: content, 
                  fullTimestamp: new Date().toISOString(),
                  timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                } 
              : conv
          );
          
          return updatedConversations.sort((a, b) => {
            if (a.fullTimestamp && b.fullTimestamp) {
              return new Date(b.fullTimestamp) - new Date(a.fullTimestamp);
            }
            
            const timeA = typeof a.timestamp === 'string' ? new Date(a.timestamp) : a.timestamp;
            const timeB = typeof b.timestamp === 'string' ? new Date(b.timestamp) : b.timestamp;
            return new Date(timeB) - new Date(timeA);
          });
        });
        
        setNewMessage(''); 
      } else {
        const errorData = await response.json();
        console.error('Lỗi gửi tin nhắn:', errorData);
      }
    }
  } catch (error) {
    console.error('Lỗi kết nối hoặc xử lý:', error);
  }
};

    const openConversation = async (conversation) => {
      try {
        if (!conversation || !conversation.id) {
          console.error("Không thể mở cuộc trò chuyện không có ID");
          return;
        }
        
        const userData = localStorage.getItem('spotify_user');
        const tokenz = userData ? JSON.parse(userData).token : null;
        console.log(`Mở cuộc trò chuyện ID: ${conversation.id}`);
        setActiveConversation(conversation);
        
        const response = await fetch(`http://localhost:8000/api/messages/${conversation.id}/`, {
          headers: {
            'Authorization': `Token ${tokenz}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Tin nhắn trong cuộc trò chuyện:', data);
          
          // If there are no messages and this is the Gemini AI conversation, add a welcome message
          if (data.length === 0 && conversation.user_id === 1) {
            setMessages([{
              id: "welcome-msg",
              sender: 1,
              text: "Xin chào! Tôi là Gemini AI, trợ lý ảo của bạn. Tôi có thể giúp gì cho bạn?",
              timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            }]);
          } else {
            setMessages(data);
          }
          
          // Mark as read
          if (conversation.unread > 0) {
            setConversations(prev => 
              prev.map(conv => 
                conv.id === conversation.id 
                  ? {...conv, unread: 0} 
                  : conv
              )
            );
          }
        } else {
          const errorData = await response.json();
          console.error('Lỗi lấy tin nhắn:', errorData);
        }
      } catch (error) {
        console.error('Lỗi kết nối hoặc xử lý:', error);
      }
    };
    const handleSelectUser = async (user) => {
      console.log('Đã chọn người dùng:', user);
      setSelectedUser(user);
      setSearchResults([]);
      
      try {
        const existingConversation = await findConversationWithUser(user.id);
        if (existingConversation && existingConversation.id) { 
          console.log('Đã tìm thấy cuộc trò chuyện hiện có:', existingConversation);
          closeNewMessageModal();
          setActiveConversation(existingConversation);
          openConversation(existingConversation);
        }   
      } catch (error) {
        console.error("Lỗi khi tìm kiếm cuộc trò chuyện:", error);
      }
    };
            
    const handleStartChat = async () => {
      if (!selectedUser) {
        console.error('Chưa chọn người dùng');
        return;
      }
      
      try {
        const existingConversation = await findConversationWithUser(selectedUser.id);
        
        if (existingConversation) {
          console.log('Đã tìm thấy cuộc trò chuyện hiện có:', existingConversation);
          closeNewMessageModal();
          setActiveConversation(existingConversation);
          openConversation(existingConversation);
          if (initialMessage.trim()) {
            sendMessage(existingConversation.id, initialMessage);
            setInitialMessage('');
          }
        } else {
          console.log('Chưa có cuộc trò chuyện, tạo mới với:', selectedUser.username);
          createConversation();
        }
      } catch (error) {
        console.error('Lỗi kiểm tra hoặc tạo cuộc trò chuyện:', error);
      }
    };
  
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
    
    const handleMessageChange = (e) => setNewMessage(e.target.value);
    const handleInitialMessageChange = (e) => setInitialMessage(e.target.value);
    const handleSearchChange = (e) => setSearchTerm(e.target.value);
    
    const handleSubmit = (e) => {
      e.preventDefault();
      if (!activeConversation || !newMessage.trim()) return;
      
      sendMessage(activeConversation.id, newMessage);
    };
  
   
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return '';
      if (typeof timestamp === 'string') return timestamp;
      return new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    };

    return (
      <Box position="fixed" bottom="20px" left="20px" zIndex="1000">
        {isOpen && (
          <Box 
            position="absolute" 
            bottom="70px" 
            left="0" 
            width="320px" 
            height="480px" 
            bg="white" 
            borderRadius="lg" 
            boxShadow="2xl"
            display="flex"
            flexDirection="column"
            overflow="hidden"
          >
            {/* Header - fixed at top */}
            <Flex 
              bg="green.500" 
              color="white" 
              p={3} 
              justifyContent="space-between" 
              alignItems="center"
              position="sticky"
              top="0"
              zIndex="10"
            >
              <Text fontWeight="bold">Tin nhắn</Text>
              <Flex gap={2}>
                {activeConversation ? (
                  <Button size="sm" variant="ghost" color="white" onClick={closeChat}>
                    <ArrowBackIcon />
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" color="white" onClick={openNewMessageModal}>
                    <EditIcon />
                  </Button>
                )}
                <Button size="sm" variant="ghost" color="white" onClick={toggleChatWidget}>
                  <CloseIcon />
                </Button>
              </Flex>
            </Flex>
            
            {/* Chat content */}
            {activeConversation ? (
              <Flex direction="column" h="calc(100% - 57px)">
                {/* User info - fixed below header */}
                <Flex 
                  p={2} 
                  alignItems="center" 
                  borderBottom="1px solid" 
                  borderColor="gray.200"
                  bg="white"
                  position="sticky"
                  top="0"
                  zIndex="5"
                >
                  <Avatar 
                    size="sm" 
                    name={activeConversation.username}
                    src={activeConversation.avatarImg ? formatImageUrl(activeConversation.avatarImg) : undefined}
                    mr={2}
                  />
                  <Text fontWeight="semibold">{activeConversation.username}</Text>
                </Flex>
                
                {/* Messages - scrollable area */}
                <Box 
                  flex="1" 
                  overflowY="auto" 
                  p={3} 
                  bg="gray.50" 
                  ref={messagesContainerRef}
                  display="flex"
                  flexDirection="column"
                >
                 {messages.map((msg, index) => (
                <Flex
                  key={msg.id || index}
                  justifyContent={msg.sender === user?.user_id ? "flex-end" : "flex-start"}
                  width="100%"
                  mb={2}
                >
                  <Box
                    bg={msg.sender === user?.user_id ? "green.500" : "white"}
                    color={msg.sender === user?.user_id ? "white" : "black"}
                    borderRadius="lg"
                    px={3}
                    py={2}
                    maxW="80%"
                    boxShadow="sm"
                    ref={index === messages.length - 1 ? lastMessageRef : null}
                    borderTopRightRadius={msg.sender === user?.user_id ? 0 : "lg"}
                    borderTopLeftRadius={msg.sender === user?.user_id ? "lg" : 0}
                    wordBreak="break-word"
                  >
                    {msg.isTyping ? (
                      <Flex align="center">
                        <Text mr={2}>Đang trả lời</Text>
                        <Spinner size="xs" color={msg.sender === user?.user_id ? "white" : "green.500"} />
                      </Flex>
                    ) : (
                      <Text>{msg.text}</Text>
                    )}
                    <Text fontSize="xs" color={msg.sender === user?.user_id ? "white" : "gray.500"} textAlign="right">
                      {formatTimestamp(msg.timestamp)}
                    </Text>
                  </Box>
                </Flex>
              ))}
                </Box>
                
                {/* Message input - fixed at bottom */}
                <Flex 
                  as="form" 
                  p={2} 
                  borderTop="1px solid" 
                  borderColor="gray.200" 
                  onSubmit={handleSubmit}
                  position="sticky"
                  bottom="0"
                  bg="white"
                  zIndex="5"
                >
                  <Input
                    value={newMessage}
                    onChange={handleMessageChange}
                    placeholder="Nhập tin nhắn..."
                    borderRadius="full"
                    mr={2}
                  />
                  <Button 
                    type="submit" 
                    colorScheme="green" 
                    borderRadius="full" 
                    isDisabled={!newMessage.trim()}
                  >
                    Send
                  </Button>
                </Flex>
              </Flex>
            ) : (
              <Box flex="1" overflowY="auto">
                {isLoadingConversations ? (
                  <Flex justify="center" align="center" h="100%">
                    <Spinner color="green.500" />
                  </Flex>
                ) : conversations.length >= 0 ? (
                  <>
                    {conversations.map((conv) => (
                      <Flex
                        key={conv.id}
                        p={3}
                        alignItems="center"
                        cursor="pointer"
                        _hover={{ bg: "gray.50" }}
                        bg={activeConversation?.id === conv.id ? "gray.100" : "white"}
                        borderBottom="1px solid"
                        borderColor="gray.100"
                        onClick={() => openConversation(conv)}
                      >
                        <Avatar
                          size="md"
                          name={conv.username}
                          src={conv.avatarImg ? formatImageUrl(conv.avatarImg) : undefined}
                          mr={3}
                        />
                        <Box flex="1" overflow="hidden">
                          <Flex justify="space-between" align="center" mb={1}>
                            <Text fontWeight="semibold" noOfLines={1}>{conv.username}</Text>
                            <Text fontSize="xs" color="gray.500">{formatTimestamp(conv.timestamp)}</Text>
                          </Flex>
                          <Flex alignItems="center">
                            <Text fontSize="sm" color="gray.600" noOfLines={1} flex="1">
                              {conv.lastMessage}
                            </Text>
                            {conv.unread > 0 && (
                              <Badge ml={1} colorScheme="green" borderRadius="full" px={2}>
                                {conv.unread}
                              </Badge>
                            )}
                          </Flex>
                        </Box>
                      </Flex>
                    ))}
                  </>
                ) : (
                  <Flex direction="column" justify="center" align="center" h="100%" p={4}>
                    <Text mb={4} color="gray.600">Chưa có cuộc trò chuyện nào.</Text>
                    <Button colorScheme="green" onClick={openNewMessageModal}>
                      Bắt đầu cuộc trò chuyện
                    </Button>
                  </Flex>
                )}
              </Box>
            )}
          </Box>
        )}
        
        {/* New Message Modal using Chakra UI */}
        <Modal isOpen={isNewMessageModalOpen} onClose={closeNewMessageModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Tin nhắn mới</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Box mb={4}>
                <Input
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Tìm người dùng..."
                  mb={2}
                />
                {isSearching && <Spinner size="sm" color="green.500" ml={2} />}
              </Box>
              
              {searchResults.length > 0 ? (
                <Box maxH="200px" overflowY="auto">
                  {searchResults.map(user => (
                    <Flex
                      key={user.id}
                      p={2}
                      alignItems="center"
                      cursor="pointer"
                      _hover={{ bg: "gray.50" }}
                      bg={selectedUser?.id === user.id ? "gray.100" : "white"}
                      borderRadius="md"
                      mb={1}
                      onClick={() => handleSelectUser(user)}
                    >
                      <Avatar
                        size="sm"
                        name={user.username}
                        src={user.avatarImg ? formatImageUrl(user.avatarImg) : undefined}
                        mr={2}
                      />
                      <Box>
                        <Text fontWeight="medium">{user.username}</Text>
                        {user.name && <Text fontSize="sm" color="gray.600">{user.name}</Text>}
                      </Box>
                    </Flex>
                  ))}
                </Box>
              ) : searchTerm.length >= 2 ? (
                <Text color="gray.600">Không tìm thấy người dùng</Text>
              ) : null}
              
              {selectedUser && (
                <Box mt={4} p={3} borderWidth="1px" borderRadius="md">
                  <Text mb={2} fontWeight="medium">Gửi tin nhắn đến:</Text>
                  <Flex alignItems="center" mb={3}>
                    <Avatar
                      size="sm"
                      name={selectedUser.username}
                      src={selectedUser.avatarImg ? formatImageUrl(selectedUser.avatarImg) : undefined}
                      mr={2}
                    />
                    <Box>
                      <Text fontWeight="medium">{selectedUser.username}</Text>
                      {selectedUser.name && <Text fontSize="sm">{selectedUser.name}</Text>}
                    </Box>
                  </Flex>
                  <Textarea
                    value={initialMessage}
                    onChange={handleInitialMessageChange}
                    placeholder="Nhập tin nhắn..."
                    resize="vertical"
                  />
                </Box>
              )}
            </ModalBody>
            
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={closeNewMessageModal}>
                Hủy
              </Button>
              <Button 
                colorScheme="green" 
                onClick={handleStartChat}
                isDisabled={!selectedUser}
              >
                Bắt đầu trò chuyện
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        
        {/* Toggle button */}
        <Button
          onClick={toggleChatWidget}
          position="fixed"
          bottom="100px"
          left="20px"
          colorScheme="green"
          borderRadius="full"
          width="50px"
          height="50px"
          boxShadow="md"
        >
          {isOpen ? <CloseIcon /> : <ChatIcon />}
        </Button>
      </Box>
    );
  }