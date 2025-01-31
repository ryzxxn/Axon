"use client";
import React, { useState, useEffect } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { ArrowBigRight, SendHorizonal } from 'lucide-react';

interface ChatProps {
  userId: string;
  videoId: string;
  video_id: string;
}

const ChatComponent: React.FC<ChatProps> = ({ userId, videoId, video_id }) => {
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const response = await axiosInstance.post('/api/initialize_chat', { user_id: userId, video_id: videoId });
        if (response.data && response.data.chat_id) {
          setChatId(response.data.chat_id);
          fetchChatHistory(response.data.chat_id); // Fetch history immediately after initializing chat
        } else {
          setError('Failed to initialize chat: No chat ID received');
        }
      } catch (error) {
        setError('Failed to initialize chat');
        console.error('Failed to initialize chat:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initializeChat();
  }, [userId, videoId]);

  const fetchChatHistory = async (chatId: string) => {
    try {
      const response = await axiosInstance.post('/api/get_chat_history', { chat_id: chatId, user_id: userId, video_id: videoId });
      if (response.data && response.data.chat_content) {
        setMessages(response.data.chat_content);
      } else {
        setError('Failed to fetch chat history: No chat content received');
      }
    } catch (error) {
      setError('Failed to fetch chat history');
      console.error('Failed to fetch chat history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;
    try {
      const userMessage = { sender: userId, message: newMessage, timestamp: new Date().toISOString() };

      // Optimistically add the user's message to the chat
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setNewMessage('');

      // Send message to /api/add_message
      await axiosInstance.post('/api/add_message', { chat_id: chatId, user_id: userId, message: newMessage, sender: userId });

      // Send query to /api/query
      const queryResponse = await axiosInstance.post('/api/queryVideo', { user_id: userId, video_id: video_id, query: newMessage });

      // Log the response in the chat content
      if (queryResponse.data && queryResponse.data.response) {
        const axonResponse = { sender: 'axon', message: queryResponse.data.response, timestamp: new Date().toISOString() };

        // Update the chat history with Axon's response
        setMessages((prevMessages) => [...prevMessages, axonResponse]);

        // Send the Axon response to /api/add_message to store it in the chat history
        await axiosInstance.post('/api/add_message', { chat_id: chatId, user_id: userId, message: queryResponse.data.response, sender: 'axon' });
      } else {
        setError('Failed to get query response');
      }
    } catch (error) {
      setError('Failed to send message');
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e:any) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="w-full p-4 flex flex-col justify-between flex-1 h-full">
        <div className='flex flex-1 gap-3 flex-col pb-4 overflow-y-scroll'>
          <div className="flex flex-col gap-2">
            {messages.map((msg, index) => (
              <div key={index} className={` ${msg.sender === userId ? 'sent' : 'received'}`}>
                <div className={msg.sender == "axon" ? "bg-white text-sm font-mono px-0" : "bg-slate-100 text-sm rounded-r-md border-l-[2px] border-black px-3 p-2"}>
                  <p>{msg.message}</p>
                </div>
              </div>
            ))}
          </div>
            <div className="w-full flex justify-between gap-2 border p-1 px-2 rounded-xl">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="w-full outline-none"
                />
                <button
                    onClick={handleSendMessage}
                    disabled={newMessage.trim() === ''}
                    className="p-2 bg-white rounded disabled:text-gray-400"
                >
                    <SendHorizonal />
                </button>
            </div>
          </div>
          </div>
)};

export default ChatComponent;
