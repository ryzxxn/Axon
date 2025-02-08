'use client';

import React, { useEffect, useState } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';

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
      }
    };

    fetchNotes();
  }, [userId]);

  const handleAddNote = async () => {
    if (newNoteTitle.trim() === '' || newNoteContent.trim() === '') return;

    try {
      const response = await axiosInstance.post(`/api/add-user-note/${userId}`, {
        title: newNoteTitle,
        content: newNoteContent,
      });
      setNotes([...notes, response.data]);
      setNewNoteTitle('');
      setNewNoteContent('');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await axiosInstance.delete(`/api/delete-user-note/${noteId}`);
      setNotes(notes.filter((note: any) => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleEditNote = (noteId: string) => {
    router.push(`/dashboard/notes/editor/${noteId}`);
  };

  return (
    <div className="text-white p-6 w-full">
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
          <Button onClick={handleAddNote}>Save Note</Button>
          <DialogClose asChild>
            <Button variant="outline" className="ml-2">Cancel</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
      
      <div className="space-y-4 grid grid-cols-4">
        {notes.map((note: any) => (
          <div key={note.id} className="p-4 bg-[rgb(14,14,14)] border border-[rgb(31,31,31)] rounded-lg shadow-md">
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
