import React, { useState, useRef, useEffect } from 'react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const messagesContainerRef = useRef(null);
  const lastMessageRef = useRef(null);
  
  // Mock conversation data
  const [conversations, setConversations] = useState([
    { id: 1, username: 'user1', lastMessage: 'Hey, how are you?', unread: 2 },
    { id: 2, username: 'user2', lastMessage: 'Check out this song!', unread: 0 },
    { id: 3, username: 'user3', lastMessage: 'Thanks for sharing!', unread: 1 }
  ]);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  /// Scroll to bottom when messages change
    useEffect(() => {
        if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages, activeConversation]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setActiveConversation(null);
    }
  };

  const openConversation = (conversation) => {
    setActiveConversation(conversation);
    setMessages([
        { id: 1, sender: conversation.id, text: 'Hey there!', timestamp: '10:30 AM' },
        { id: 2, sender: 'me', text: 'Hello!', timestamp: '10:31 AM' },
        { id: 3, sender: conversation.id, text: conversation.lastMessage, timestamp: '10:35 AM' },
        { id: 4, sender: 'me', text: 'This is a test message to check scrolling', timestamp: '10:36 AM' },
        { id: 5, sender: conversation.id, text: 'Great! Let me send a longer message to ensure we have enough content to trigger scrolling behavior in this chat container.', timestamp: '10:37 AM' },
        { id: 6, sender: 'me', text: 'Perfect! Now we can test whether the scrolling works properly when there are many messages.', timestamp: '10:38 AM' },
        { id: 7, sender: conversation.id, text: 'Let me send another long message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae justo vel purus sollicitudin rhoncus.', timestamp: '10:39 AM' },
        { id: 8, sender: 'me', text: 'And one more for good measure!', timestamp: '10:40 AM' }
    ]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Add message to conversation
    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  const openNewMessageModal = () => {
    setIsNewMessageModalOpen(true);
  };

  const closeNewMessageModal = () => {
    setIsNewMessageModalOpen(false);
  };

  return (
    <div className="fixed bottom-20 left-5 z-50">
      {/* Chat Button */}
      <button 
        onClick={toggleChat}
        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg flex items-center justify-center"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <div className="absolute bottom-16 left-0 w-80 h-96 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col border border-gray-200">
          {/* Chat Header */}
          <div className="bg-black text-white p-3 flex justify-between items-center">
            <h3 className="font-bold">Messages</h3>
            <button 
              onClick={openNewMessageModal}
              className="text-white hover:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Conversation View or Messages View */}
          {!activeConversation ? (
            // List of Conversations
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {conversations.map(conversation => (
                <div 
                  key={conversation.id} 
                  onClick={() => openConversation(conversation)}
                  className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{conversation.username}</p>
                    <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
                  </div>
                  {conversation.unread > 0 && (
                    <span className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {conversation.unread}
                    </span>
                  )}
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No conversations yet
                </div>
              )}
            </div>
          ) : (
            // Active Conversation
            <div className="flex-1 flex flex-col">
              {/* Conversation Header */}
              <div className="bg-gray-100 p-3 flex items-center border-b border-gray-200">
                <button 
                  onClick={() => setActiveConversation(null)}
                  className="mr-2 text-gray-600 hover:text-gray-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <p className="font-medium">{activeConversation.username}</p>
              </div>
              
              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-3 bg-white h-[250px] max-h-[220px] flex flex-col" 
                >
                {messages.map((message, index) => (
                  <div 
                    key={message.id}
                    ref={index === messages.length - 1 ? lastMessageRef : null}
                    className={`mb-3 max-w-[75%] ${
                      message.sender === 'me' 
                        ? 'ml-auto bg-green-500 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg' 
                        : 'mr-auto bg-gray-200 text-black rounded-tr-lg rounded-tl-lg rounded-br-lg'
                    } p-3 shadow`}
                  >
                    <p className="break-words">{message.text}</p>
                    <p className={`text-xs mt-1 ${message.sender === 'me' ? 'text-green-100' : 'text-gray-500'} text-right`}>
                      {message.timestamp}
                    </p>
                  </div>
                ))}
                
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500 text-sm">No messages yet. Start a conversation!</p>
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 bg-gray-50 flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <button 
                  type="submit"
                  className="ml-2 bg-green-500 text-white rounded-full p-2 hover:bg-green-600 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* New Message Modal */}
      {isNewMessageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">New Message</h3>
              <button onClick={closeNewMessageModal} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
              <input 
                type="text" 
                placeholder="Search for users..." 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={closeNewMessageModal}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}            
    </div>
  );
}