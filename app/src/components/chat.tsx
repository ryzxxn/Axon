import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { Copy, File, Loader, Plus, SendHorizonal, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface ChatProps {
  userId: string;
  videoId: string;
  video_id: string;
}

const ChatComponent: React.FC<ChatProps> = ({ userId, videoId, video_id }: ChatProps) => {
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
          fetchChatHistory(response.data.chat_id);
          setIsInitialized(true);
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
      await axiosInstance.post('/api/append_to_note', { note_id, text: text_to_add, user_id: userId });
      console.log('Text added to note:', note_id);
      toast.success('Text added to note');
      setShowNotesPopup(!showNotesPopup)
      setShowToolbar(!showToolbar)
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
      setShowAddNotePopup(!showNotesPopup)
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
    } else {
      setShowToolbar(false);
      setSelectedText(''); // Clear selected text if no selection
    }
  };

  const handleMouseUp = () => {
    handleSelection();
  };

  const handleTouchEnd = () => {
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
    <div
      className="w-full p-0 flex justify-between bottom-0 flex-1 bg-white border-gray-400 min-w-full rounded-lg relative"
      onMouseUp={handleMouseUp}
      onTouchEnd={handleTouchEnd}
    >
      <button
        className="absolute top-2 right-2 text-white hover:text-gray-300"
        onClick={clearAllStates}
      >
        <X className="w-4 h-4" />
      </button>
      {showNotesPopup && (
        <div className='flex flex-col h-full sm:flex-row sm:flex md:flex-rowmd:flex lg:flex-row lg:flex'>
        <div className="w-full p-0 text-white text-sm">
          <div className="space-y-2 p-2">
            <button
              className="px-4 py-2 bg-[rgb(31,31,31)] rounded-lg mr-2 whitespace-nowrap text-[.8rem] flex items-center gap-1 w-full"
              onClick={() => setShowAddNotePopup(true)}
            >
              <Plus className='w-4'/> Create Note
            </button>
          </div>
          <div className='border-b'></div>
          <div className='flex gap-1 p-1 w-full flex-col text-gray-600'>
            <p>Notes</p>
            {notes.map((note) => (
              <div
                key={note.id}
                className={`cursor-pointer p-2 text-gray-600 ${selectedNoteId === note.id ? 'bg-gray-300' : 'hover:bg-gray-300'} rounded-lg flex items-center gap-2 w-full select-none border`}
                onClick={() => {
                  if (selectedNoteId === note.id) {
                    handleAddToNote();
                  } else {
                    setSelectedNoteId(note.id);
                    toast('Click again to add text to note');
                  }
                }}
              >
                <File className='w-4 hidden sm:flex'/>
                <p className='flex text-[.7rem] leading-none'>{note.title}</p>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}
      

      {showAddNotePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-50">
          <div className="p-4 rounded-lg text-gray-600 flex flex-col gap-3 w-2/3 items-start border bg-white">
            <h2 className="text-lg font-semibold">Create Note</h2>
            <input
              type="text"
              placeholder="Note Title"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              className="w-full p-2 border rounded-lg bg-transparent text-sm outline-none"
            />
            <div>
              <button
                className="px-4 py-2 bg-[rgb(28,28,28)] text-white rounded-lg"
                onClick={createNote}
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-[rgb(28,28,28)]  text-white border rounded-lg ml-2"
                onClick={() => setShowAddNotePopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 gap-3 flex-col pb-4 max-h-[80vh] justify-between p-3 w-full border-l">
        <div
          className="flex flex-col gap-2 max-h-screen overflow-y-scroll p-4 w-full overflow-x-hidden"
          ref={chatBoxRef}
        >
          {messages ? (
            <div className="flex flex-col w-full gap-5 text-gray-600">
              {messages.map((msg: any, index: number) => (
                <div
                  key={index}
                  className={`${msg.sender === userId ? 'sent text-gray-200 bg-gray-200' : 'received text-gray-600'}`}
                >
                  <div className={msg.sender === "axon" ? "text-sm px-0" : "bg-transparent text-sm rounded-r-md border-l-[2px] border-gray-300 px-3 p-2"}>
                    <div>
                      <ReactMarkdown className='text-gray-600'>{msg.message}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Loader className="text-black w-20" />
          )}
        </div>
        <div className="w-full flex justify-between gap-2 border rounded-xl p-0 h-[max-content]">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full outline-none text-[.7rem] bg-transparent px-2 text-gray-600"
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
          className="bg-white absolute px-3 py-2 flex gap-3 rounded-xl font-thin bubble-expand-animate outline outline-1 outline-gray-300"
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
