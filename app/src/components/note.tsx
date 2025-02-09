'use client';

import React, { useEffect, useState } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';

const Notes = ({ userId }: any) => {
  const [notes, setNotes] = useState<any>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        if (userId) {
          const response = await axiosInstance.get(`/api/get-user-notes/${userId}`);
          setNotes(response.data);
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        toast.error('Failed to fetch notes');
      }
    };

    fetchNotes();
  }, [userId]);

  const handleAddNote = async () => {
    if (newNoteTitle.trim() === '' || newNoteContent.trim() === '') {
      toast.error('Title and content cannot be empty');
      return;
    }

    try {
      const response = await axiosInstance.post(`/api/add-user-note/${userId}`, {
        title: newNoteTitle,
        content: newNoteContent,
      });
      setNotes([...notes, response.data]);
      setNewNoteTitle('');
      setNewNoteContent('');
      setIsModalOpen(false);
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await axiosInstance.delete(`/api/delete-user-note/${noteId}`);
      setNotes(notes.filter((note: any) => note.id !== noteId));
      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const handleEditNote = (noteId: string) => {
    router.push(`/dashboard/notes/editor/${noteId}`);
  };

  return (
    <div className="text-gray-600 p-6 w-full">
      <h1 className="text-2xl font-bold mb-4">Notes</h1>

      <Button onClick={() => setIsModalOpen(true)} className="mb-4">Create New Note</Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogTitle>Create New Note</DialogTitle>
          <Input
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="Note Title"
            className="mb-2"
          />
          <Textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Note Content"
            className="mb-4"
          />
          <Button onClick={handleAddNote}>Save Note</Button>
          <DialogClose asChild>
            <Button variant="outline" className="ml-2">Cancel</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {notes.map((note: any) => (
          <div key={note.id} className="p-4 border border-[rgb(31,31,31)] rounded-lg shadow-md text-gray-600">
            <h2 className="text-lg font-semibold">{note.title}</h2>
            <div className="mt-2 flex gap-2 text-[.8rem]">
              <p onClick={() => handleEditNote(note.id)} className='border border-[rgb(31,31,31)] p-1 leading-none rounded-sm cursor-pointer'>Edit</p>
              <p onClick={() => handleDeleteNote(note.id)} className='border border-[rgb(31,31,31)] p-1 leading-none rounded-sm cursor-pointer'>Delete</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notes;
