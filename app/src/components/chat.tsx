import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { CopyIcon, File, Loader, PlusIcon, SendHorizonal, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { marked } from 'marked';

interface ChatProps {
  userId: string;
  videoId: string;
  video_id: string;
  toggleChat: boolean;
  setToggleChat: (toggle: boolean) => void;
}

const ChatComponent: React.FC<ChatProps> = ({ userId, videoId, video_id, toggleChat, setToggleChat }: ChatProps) => {
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [showNotesPopup, setShowNotesPopup] = useState<boolean>(false);
  const [notes, setNotes] = useState<{ id: string, title: string }[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [showAddNotePopup, setShowAddNotePopup] = useState<boolean>(false);
  const [newNoteTitle, setNewNoteTitle] = useState<string>('');
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [messageToAdd, setMessageToAdd] = useState<string>('');
  const chatBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const response = await axiosInstance.post('/api/initialize_chat', { user_id: userId, video_id: videoId });
        if (response.data && response.data.chat_id) {
          setChatId(response.data.chat_id);
          await fetchChatHistory(response.data.chat_id);
          setIsInitialized(true);
        } else {
          console.error('Chat initialization failed: No chat_id in response');
          toast.error("Chat initialization failed");
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        toast.error("Failed to initialize chat");
      }
    };
    initializeChat();
  }, [userId, videoId]);

  useEffect(() => {
    // Scroll to the bottom of the chat box when messages change
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Fetch user notes when the component mounts
    const fetchUserNotes = async () => {
      try {
        const response = await axiosInstance.get(`/api/get-user-notes/${userId}`);
        if (response.data) {
          setNotes(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch user notes:', error);
        toast.error("Failed to fetch user notes");
      }
    };
    fetchUserNotes();
  }, [userId]);

  const convertMarkdownToHtml = (markdown: string): string => {
    // Convert Markdown to HTML
    const html:any = marked(markdown,{
      gfm: true,
      breaks: true,
    });
    return html;
  };

  const addToNote = async (note_id: string, text_to_add: string) => {
    try {
      const html_data = convertMarkdownToHtml(text_to_add)
      await axiosInstance.post('/api/append_to_note', { note_id, text: html_data, user_id: userId });
      console.log('Text added to note:', note_id);
      toast.success('Text added to note');
      setShowNotesPopup(false);
    } catch (error) {
      console.error('Failed to add text to note:', error);
      toast.error("Failed to add text to note");
    }
  };

  const fetchChatHistory = async (chatId: string) => {
    try {
      const response = await axiosInstance.post('/api/get_chat_history', { chat_id: chatId, user_id: userId, video_id: videoId });
      if (response.data && response.data.chat_content) {
        setMessages(response.data.chat_content);
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      toast.error("Failed to fetch chat history");
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

      // Send query to /api/queryVideo
      const queryResponse = await axiosInstance.post('/api/queryVideo', { "video_id": video_id, "query": newMessage });

      if (queryResponse.data && queryResponse.data.response) {
        const axonResponse = { sender: 'axon', message: queryResponse.data.response.content, timestamp: new Date().toISOString() };

        // Update the chat history with Axon's response
        setMessages((prevMessages) => [...prevMessages, axonResponse]);

        // Send the Axon response to /api/add_message to store it in the chat history
        await axiosInstance.post('/api/add_message', { chat_id: chatId, user_id: userId, message: queryResponse.data.response.content, sender: 'axon' });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error("Failed to send message");
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleAddToNote = (message: string) => {
    setMessageToAdd(message);
    setShowNotesPopup(true);
  };

  const createNote = async () => {
    try {
      const response = await axiosInstance.post('/api/create-note', { title: newNoteTitle, content: newNoteContent, user_id: userId });
      if (response.data) {
        setNotes((prevNotes) => [...prevNotes, response.data]);
        setNewNoteTitle('');
        setNewNoteContent('<p>Start writing your note here...</p>');
        setShowAddNotePopup(false);
      }
    } catch (error) {
      console.error('Failed to create note:', error);
      toast.error("Failed to create note");
    }
  };

  const copySelectedText = (message: string) => {
    navigator.clipboard.writeText(message);
    toast('Copied Text');
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border border-gray-200 rounded-lg shadow-md relative justify-between">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Chat</h2>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={() => setToggleChat(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-0 max-h-[80vh]" ref={chatBoxRef}>
        {messages.length > 0 ? (
          messages.map((msg: any, index: number) => (
            <div
              key={index}
              className={`flex items-start p-4 ${msg.sender === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`rounded-lg px-4 py-2 ${msg.sender === userId ? 'bg-gray-700 text-white w-3/4' : 'bg-gray-200 text-gray-800'}`}>
                <div className='text-sm'>
                  <ReactMarkdown>{msg.message}</ReactMarkdown>
                </div>
                <div className='flex flex-row-reverse justify-between'>
                  {msg.sender != userId && (
                    <div className='flex gap-2'>
                      <CopyIcon className="w-4 h-4 cursor-pointer" onClick={() => copySelectedText(msg.message)} />
                      <PlusIcon className="w-4 h-4 cursor-pointer" onClick={() => handleAddToNote(msg.message)} />
                    </div>
                  )}
                  <span className="block text-xs text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <></>
        )}
      </div>
      <div className="flex items-center p-4 border-t border-gray-200">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 mr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!isInitialized}
        />
        <button
          onClick={handleSendMessage}
          disabled={newMessage.trim() === '' || !isInitialized}
          className="bg-blue-500 text-white rounded-lg px-4 py-2 disabled:opacity-50"
        >
          <SendHorizonal className="w-5 h-5" />
        </button>
      </div>
      {showNotesPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Notes</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowNotesPopup(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                className="w-full bg-gray-800 text-white rounded-lg py-2 px-4 flex items-center justify-center"
                onClick={() => setShowAddNotePopup(true)}
              >
                <PlusIcon className="w-4 h-4 mr-2" /> Create Note
              </button>
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-100`}
                  onClick={() => {
                    setSelectedNoteId(note.id);
                    addToNote(note.id, messageToAdd);
                    setShowNotesPopup(false);
                  }}
                >
                  <div className="flex items-center">
                    <File className="w-4 h-4 mr-2" />
                    <p className="text-sm text-gray-800">{note.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showAddNotePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Create Note</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAddNotePopup(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Note Title"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                className="bg-blue-500 text-white rounded-lg px-4 py-2"
                onClick={createNote}
              >
                Save
              </button>
              <button
                className="bg-gray-300 text-gray-800 rounded-lg px-4 py-2"
                onClick={() => setShowAddNotePopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes bubbleExpand {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .bubble-expand-animate {
          animation: bubbleExpand 0.1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChatComponent;
