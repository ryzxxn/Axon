'use client';
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import axiosInstance from '@/app/utils/axiosInstance';
import 'react-quill/dist/quill.bubble.css';
import { Save } from 'lucide-react';

interface QuillEditorProps {
  value: string;
  onChange: (content: string, delta: any, source: any, editor: any) => void;
  modules: any;
}

interface EditorProps {
  user_id: string;
  note_id: string;
}

export default function Editor({ user_id, note_id }: EditorProps) {
  const quillRef = useRef<ReactQuill>(null);
  const [content, setContent] = useState<string>('');
  const [initialContent, setInitialContent] = useState<string>('');

  const QuillEditor = memo(function QuillEditor({ value, onChange, modules}: QuillEditorProps) {
    return (
      <ReactQuill ref={quillRef} value={value} onChange={onChange} modules={modules} />
    );
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axiosInstance.post('/api/get-note', { user_id, note_id });
        const noteContent = response.data.note_content;
        setContent(noteContent);
        setInitialContent(noteContent);
      } catch (error) {
        console.error('Error fetching note content:', error);
        toast.error("Failed to fetch note content");
      }
    };

    fetchContent();
  }, [note_id, user_id, initialContent]);

  const handleChange = useCallback((content: string) => {
  }, []);

  async function handleSave() {
    const quill = quillRef.current!.getEditor();
    const currentContent = quill.root.innerHTML as string;

    // Compare current content with initial content
    if (currentContent === initialContent) {
      toast.error("No changes to save");
      return;
    }

    const saveData = await axiosInstance.post('/api/add_to_note', {
      note_id,
      text: currentContent,
      user_id,
    });

    if (saveData) {
      toast.success("Note Saved");
      setInitialContent(currentContent); // Update initial content after saving
    }
  }

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files![0];
      const fileExtension = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;

      try {
        const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY as string;
        const url = 'https://api.imgbb.com/1/upload';

        const formData = new FormData();
        formData.append('key', apiKey);
        formData.append('image', file);

        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message);
        }

        const imageUrl = data.data.url;

        const quill = quillRef.current!.getEditor();
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', imageUrl);

      } catch (error) {
        console.log(error);
      }
    };
  }, []);

  const debugContent = () => {
    const quill = quillRef.current!.getEditor();
    const content = quill.root.innerHTML as string;
    console.log('Editor Content:', content);
  };

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }],
      ],
      handlers: {
        image: handleImageUpload,
      },
    },
  };

  return (
    <div className='flex flex-col gap-0'>
      <div className='flex w-full justify-end'>
      <button className='border-[1px] border-black bg-black text-white w-[max-content] text-[.7rem] pl-2 pr-2 p-1 rounded-md' onClick={handleSave}>Save</button>
      </div>
      <QuillEditor value={content} onChange={handleChange} modules={modules} />
      <div id='asd'></div>
    </div>
  );
}
