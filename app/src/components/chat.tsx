import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { Copy, File, Loader, Plus, SendHorizonal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import memoryState from 'memory-state';

interface ChatProps {
  userId: string;
  videoId: string;
  video_id: string;
}

const ChatComponent: React.FC<ChatProps> = ({ userId, videoId, video_id }) => {
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
        const cachedChatId = memoryState.getState('chatId');
        if (cachedChatId) {
          setChatId(cachedChatId);
          fetchChatHistory(cachedChatId);
          setIsInitialized(true);
        } else {
          const response = await axiosInstance.post('/api/initialize_chat', { user_id: userId, video_id: videoId });
          if (response.data && response.data.chat_id) {
            setChatId(response.data.chat_id);
            memoryState.setState('chatId', response.data.chat_id);
            fetchChatHistory(response.data.chat_id);
            setIsInitialized(true);
          }
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

  const addToNote = async (note_id: string, text_to_add: string) => {
    try {
      await axiosInstance.post('/api/add_to_note', { note_id, text: text_to_add, user_id: userId });
      console.log('Text added to note:', note_id);
    } catch (error) {
      console.error('Failed to add text to note:', error);
      toast.error("Failed to add text to note");
    }
  };

  const fetchChatHistory = async (chatId: string) => {
    try {
      const cachedChatHistory = memoryState.getState('chatHistory');
      if (cachedChatHistory) {
        setMessages(cachedChatHistory);
      } else {
        const response = await axiosInstance.post('/api/get_chat_history', { chat_id: chatId, user_id: userId, video_id: videoId });
        if (response.data && response.data.chat_content) {
          memoryState.setState('chatHistory', response.data.chat_content);
          setMessages(response.data.chat_content);
        }
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
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, userMessage];
        memoryState.setState('chatHistory', updatedMessages);
        return updatedMessages;
      });
      setNewMessage('');

      // Send message to /api/add_message
      await axiosInstance.post('/api/add_message', { chat_id: chatId, user_id: userId, message: newMessage, sender: userId });

      // Send query to /api/queryVideo
      const queryResponse = await axiosInstance.post('/api/queryVideo', { user_id: userId, video_id: videoId, query: newMessage });

      if (queryResponse.data && queryResponse.data.response) {
        const axonResponse = { sender: 'axon', message: queryResponse.data.response.result, timestamp: new Date().toISOString() };

        // Update the chat history with Axon's response
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, axonResponse];
          memoryState.setState('chatHistory', updatedMessages);
          return updatedMessages;
        });

        // Send the Axon response to /api/add_message to store it in the chat history
        await axiosInstance.post('/api/add_message', { chat_id: chatId, user_id: userId, message: queryResponse.data.response.result, sender: 'axon' });
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
      console.log('Text added to note:', selectedNoteId);
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

  const handleMouseUp = () => {
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
    } else {
      setShowToolbar(false);
      setSelectedText(''); // Clear selected text if no selection
    }
  };

  const copySelectedText = () => {
    const selection = window.getSelection();
    if (selection) {
      document.execCommand('copy');
      toast('Copied Text');
      console.log('Text copied to clipboard:', selection.toString());
    }
  };

  return (
    <div
      className="w-full p-0 flex justify-between flex-1 bg-[rgb(14,14,14)] border-gray-400 min-w-full rounded-lg"
      onMouseUp={handleMouseUp}
    >
      {showNotesPopup && (
        <div className="w-1/5 p-0 border-r border-[rgb(21,21,21)] text-white text-sm">
          <div className="space-y-2 p-2">
            <button
              className="px-4 py-2 bg-[rgb(31,31,31)] rounded-lg mr-2 whitespace-nowrap text-[.8rem] flex items-center gap-1 w-full"
              onClick={() => setShowAddNotePopup(true)}
            >
              <Plus className='w-4'/> Create Note
            </button>
          </div>
            <div className='border-b border-[rgb(21,21,21)]'></div>
            <div className='flex gap-2 p-1 w-full'>
            {notes.map((note) => (
              <div
                key={note.id}
                className="cursor-pointer p-2 hover:bg-[rgb(21,21,21)] rounded-lg flex items-center gap-2 w-full"
                onClick={() => {
                  setSelectedNoteId(note.id);
                  handleAddToNote();
                  setShowNotesPopup(false);
                }}
              >
                <File className='w-4'/>
                <p>{note.title}</p>
              </div>
            ))}
            </div>
          </div>
      )}

      {showAddNotePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className=" bg-[rgb(14,14,14)] p-4 rounded-lg text-gray-200 flex flex-col gap-3 w-2/3 items-start">
            <h2 className="text-lg font-semibold">Create Note</h2>
            <input
              type="text"
              placeholder="Note Title"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              className="w-full p-2 border rounded-lg bg-transparent border-[rgb(31,31,31)] text-sm"
            />
            <div>
              <button
                className="px-4 py-2 bg-[rgb(28,28,28)] text-white rounded-lg"
                onClick={createNote}
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-[rgb(28,28,28)] text-white rounded-lg ml-2"
                onClick={() => setShowAddNotePopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 gap-3 flex-col pb-4 max-h-[80vh] justify-between p-3 w-full">
        <div
          className="flex flex-col gap-2 max-h-screen overflow-y-scroll p-4 w-full overflow-x-hidden"
          ref={chatBoxRef}
        >
          {messages ? (
            <div className="flex flex-col w-full gap-5">
              {messages.map((msg: any, index: number) => (
                <div
                  key={index}
                  className={`${msg.sender === userId ? 'sent text-gray-200 bg-[rgb(30,30,30)]' : 'received text-gray-200'}`}
                >
                  <div className={msg.sender === "axon" ? "text-sm px-0" : "bg-transparent text-sm rounded-r-md border-l-[2px] border-gray-300 px-3 p-2"}>
                    <div>
                      <ReactMarkdown>{msg.message}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Loader className="text-white w-20" />
          )}
        </div>
        <div className="w-full flex justify-between gap-2 border rounded-xl p-0 h-[max-content]">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full outline-none text-[.7rem] bg-transparent px-2 text-gray-200"
            disabled={!isInitialized}
          />
          <button
            onClick={handleSendMessage}
            disabled={newMessage.trim() === '' || !isInitialized}
            className="p-2 disabled:text-gray-500 text-black bg-white px-4 border-none outline-none rounded-r-lg"
          >
            <SendHorizonal className="w-4" />
          </button>
        </div>
      </div>
      {showToolbar && (
        <div
          className="bg-white absolute px-3 py-2 flex gap-3 rounded-xl font-thin bubble-expand-animate"
          style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
        >
          <button className="hover:bg-slate-200 p-1 aspect-square rounded-lg" onClick={copySelectedText}>
            <Copy className="w-4" />
          </button>
          <button className="hover:bg-slate-200 p-1 aspect-square rounded-lg" onClick={() => setShowNotesPopup(true)}>
            <Plus className="w-4" />
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
