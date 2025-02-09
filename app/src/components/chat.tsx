import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { Copy, File, Loader, Plus, SendHorizonal, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

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
  const [showToolbar, setShowToolbar] = useState<boolean>(false);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number, left: number }>({ top: 0, left: 0 });
  const [showNotesPopup, setShowNotesPopup] = useState<boolean>(false);
  const [notes, setNotes] = useState<{ id: string, title: string }[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [showAddNotePopup, setShowAddNotePopup] = useState<boolean>(false);
  const [newNoteTitle, setNewNoteTitle] = useState<string>('');
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [selectedText, setSelectedText] = useState<string>('');
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

  useEffect(() => {
    // Attach event listeners for text selection
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      // Clean up event listeners on component unmount
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const addToNote = async (note_id: string, text_to_add: string) => {
    try {
      await axiosInstance.post('/api/append_to_note', { note_id, text: text_to_add, user_id: userId });
      console.log('Text added to note:', note_id);
      toast.success('Text added to note');
      setShowNotesPopup(false);
      setShowToolbar(false);
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

  const handleAddToNote = () => {
    if (selectedNoteId && selectedText) {
      addToNote(selectedNoteId, selectedText);
      setSelectedText(''); // Clear selected text after adding to note
    }
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

  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setToolbarPosition({
        top: rect.top + window.scrollY - 10,
        left: rect.left + window.scrollX + rect.width / 2,
      });
      setShowToolbar(true);
      setSelectedText(selection.toString()); // Set selected text
      console.log('Text selected:', selection.toString());
    } else {
      setShowToolbar(false);
      setSelectedText(''); // Clear selected text if no selection
      console.log('No text selected');
    }
  };

  const handleMouseUp = () => {
    console.log('Mouse up event triggered');
    handleSelection();
  };

  const handleTouchEnd = () => {
    console.log('Touch end event triggered');
    handleSelection();
  };

  const copySelectedText = () => {
    const selection = window.getSelection();
    if (selection) {
      document.execCommand('copy');
      toast('Copied Text');
    }
  };

  const clearAllStates = () => {
    setChatId(null);
    setMessages([]);
    setNewMessage('');
    setShowToolbar(false);
    setToolbarPosition({ top: 0, left: 0 });
    setShowNotesPopup(false);
    setNotes([]);
    setSelectedNoteId(null);
    setIsInitialized(false);
    setShowAddNotePopup(false);
    setNewNoteTitle('');
    setNewNoteContent('');
    setSelectedText('');
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
      <div className="flex-1 overflow-y-auto p-4 max-h-[80vh]" ref={chatBoxRef}>
        {messages.length > 0 ? (
          messages.map((msg: any, index: number) => (
            <div
              key={index}
              className={`flex items-start mb-4 ${msg.sender === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`rounded-lg px-4 py-2 ${msg.sender === userId ? 'bg-gray-700 text-white w-3/4' : 'bg-gray-200 text-gray-800'}`}>
                <ReactMarkdown className='text-sm'>{msg.message}</ReactMarkdown>
                <span className="block text-xs text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))
        ) : (
          <Loader className="text-gray-400 w-10 h-10 mx-auto" />
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
      {showToolbar && (
        <div
          className="bg-white border border-gray-200 shadow-md rounded-lg px-3 py-2 flex gap-3 absolute"
          style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
        >
          <button className="hover:bg-gray-100 p-1 rounded-lg" onClick={copySelectedText}>
            <Copy className="w-5 h-5" />
          </button>
          <button className="hover:bg-gray-100 p-1 rounded-lg" onClick={() => setShowNotesPopup(true)}>
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}
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
                <Plus className="w-4 h-4 mr-2" /> Create Note
              </button>
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-100`}
                  onClick={() => {
                    setSelectedNoteId(note.id);
                    setShowNotesPopup(false);
                    toast('Note selected. Click "Add to Note" to add text.');
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
      {showToolbar && (
        <div
          className="bg-white border border-gray-200 shadow-md rounded-lg px-3 py-2 flex gap-3 absolute"
          style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
        >
          <button className="hover:bg-gray-100 p-1 rounded-lg" onClick={copySelectedText}>
            <Copy className="w-5 h-5" />
          </button>
          <button className="hover:bg-gray-100 p-1 rounded-lg" onClick={handleAddToNote}>
            <Plus className="w-5 h-5" />
          </button>
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
