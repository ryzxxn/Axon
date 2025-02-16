'use client';

import React, { useEffect, useState } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PenSquare } from 'lucide-react';

const Dash_Notes = ({ userId }: {userId:string}) => {
  const [notes, setNotes] = useState<any>([]);
  const [filteredNotes, setFilteredNotes] = useState<any>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        if (userId) {
          const response = await axiosInstance.get(`/api/get-user-notes/${userId}`);
          setNotes(response.data);
          setFilteredNotes(response.data); // Initialize filtered notes with all notes
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        toast.error('Failed to fetch notes');
      }
    };

    fetchNotes();
  }, [userId]);

  useEffect(() => {
    // Filter notes based on the search query
    if (searchQuery.trim() === '') {
      setFilteredNotes(notes);
    } else {
      setFilteredNotes(
        notes.filter((note: any) =>
          (note.title && note.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      );
    }
  }, [searchQuery, notes]);

  const handleAddNote = async () => {
    if (newNoteTitle.trim() === '') {
      toast.error('Title and content cannot be empty');
      return;
    }

    try {
      const response = await axiosInstance.post(`/api/create-note`, {
        user_id: userId,
        title: newNoteTitle,
        content: newNoteContent,
      });
      setNotes([...notes, response.data]);
      setFilteredNotes([...notes, response.data]); // Update filtered notes
      setNewNoteTitle('');
      setNewNoteContent('');
      setIsModalOpen(false); 
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const handleEditNote = (noteId: string) => {
    router.push(`/dashboard/notes/editor/${noteId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0'); // Add leading zero if needed
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className='flex flex-col w-full'>
        <h1 className="text-2xl font-bold text-gray-600">Recent Notes</h1>
      <div className="py-6">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          className='border outline-none'
        />
      </div>

      <div className="text-gray-600 pb-6 w-full">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogTitle>Create New Note</DialogTitle>
            <Input
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Note Title"
              className="mb-2"
            />
            <Button onClick={handleAddNote}>Save Note</Button>
            <DialogClose asChild>
              <Button variant="outline" className="ml-2">Cancel</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {filteredNotes.map((note: any) => (
            <div key={note.id} className="p-4 border leading-none rounded-lg shadow-md text-gray-600 gap-2 flex flex-col flex-1 w-full">
              <h2 className="text-lg font-semibold capitalize leading-none">{note.title}</h2>
              <p className="text-sm text-gray-500">{formatDate(note.created_at)}</p>
              <div className="flex gap-2 text-[.8rem] justify-end items-center">
                <p onClick={() => handleEditNote(note.id)} className='border p-1 leading-none rounded-sm cursor-pointer'><PenSquare className='w-4 aspect-square h-4'/></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dash_Notes;
