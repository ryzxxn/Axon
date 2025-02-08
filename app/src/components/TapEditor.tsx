'use client';
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from '@tiptap/starter-kit';
import "./tiptap.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Document from '@tiptap/extension-document';
import Youtube from "@tiptap/extension-youtube";
import Link from '@tiptap/extension-link';
import AutoJoiner from "tiptap-extension-auto-joiner";
import React, { useEffect, useState, useCallback, useRef } from "react";
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import paragraph, { Paragraph } from '@tiptap/extension-paragraph';
import { BubbleMenu } from '@tiptap/react';
import axiosInstance from "@/app/utils/axiosInstance";
import { Button } from './ui/button';
import Underline from "@tiptap/extension-underline";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import { ChevronDown, Link2, Image as ImageIcon, List, ListOrdered } from "lucide-react";
import { Popover } from "./ui/popover";
import { PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import { useRouter } from "next/navigation";
import GlobalDragHandle from "tiptap-extension-global-drag-handle";
import Dropcursor from "@tiptap/extension-dropcursor";
import { v4 as uuidv4 } from 'uuid';
import debounce from 'lodash.debounce';
import Text from '@tiptap/extension-text'

const CustomDocument = Document.extend({
  content: "heading block",
});

const Tiptap = ({ user_id, note_id }: { user_id: string; note_id: string }) => {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const router = useRouter();
  const editor:any = useEditor({
    immediatelyRender: false,
    onTransaction({ editor, transaction }) {
      if (transaction.docChanged) {
        const content = editor.getHTML();
        debouncedSave(content);
      }
    },
    extensions: [Document,
        Paragraph,
        Text,
        Heading
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          " padding:16px focus:outline-none",
      },
    },
  });

  const debouncedSave = useRef(
    debounce((content:any) => {
      axiosInstance
        .post(`/api/add_to_note`, {
          note_id,
          text: content,
          user_id,
        })
        .catch((err) => console.error("Failed to update note:", err));
    }, 500)
  ).current;

  useEffect(() => {
    if (!editor) return;
    axiosInstance
      .post(`/api/get-note`, { user_id, note_id })
      .then((resp) => {
        let content = "New Note";
        try {
          content = JSON.parse(resp.data.note_content);
        } catch (error) {
          console.error("Failed to parse content:", error);
          content = resp.data.note_content;
        }
        editor.commands.setContent(content);
      })
      .catch(() => {
        router.push("/");
      });

    editor.chain().focus().setTextSelection(0).run();
  }, [note_id, user_id, editor, router]);

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

        editor.chain().focus().setImage({ src: imageUrl }).run();

      } catch (error) {
        console.log(error);
      }
    };
  }, [editor]);

  const addLink = () => {
    if (linkUrl) {
      const sanitizedUrl = linkUrl.replace(/^(https?:\/\/)?/, "https://");
      editor.chain().focus().setLink({ href: sanitizedUrl }).run();
    }
    setIsLinkDialogOpen(false);
    setLinkUrl("");
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  if (!editor) return <></>;

  return (
    <>
      <BubbleMenu
        className="p-1 bg-white shadow-lg flex items-center rounded-md border border-neutral-300/20 backdrop-blur-lg w-max"
        editor={editor}
        tippyOptions={{
          duration: 400,
          zIndex: 100000000,
          offset: window.innerWidth <= 768 ? [-20, 30] : [-20, 10],
          animation: "bubbleShowUp",
          placement: "top-start",
        }}
      >
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex w-min hover:bg-zinc-100 rounded items-center gap-1 md:px-2 px-1 py-1 text-xs md:text-sm whitespace-nowrap text-neutral-600 transition-colors"
            >
              {editor.isActive("heading", { level: 2 }) && "Heading 1"}
              {editor.isActive("heading", { level: 3 }) && "Heading 2"}
              {editor.isActive("heading", { level: 4 }) && "Heading 3"}
              {!editor.isActive("heading", { level: 2 }) &&
                !editor.isActive("heading", { level: 3 }) &&
                !editor.isActive("heading", { level: 4 }) &&
                "Text"}
              <ChevronDown className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="bg-white shadow-md mt-2 text-black border rounded-lg border-white/10 p-2 backdrop-blur-lg md:max-w-96 w-64 md:w-auto"
            align="start"
          >
            <h4 className="text-xs font-thin opacity-40">Turn Into</h4>
            <div className="mt-2 w-full">
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().clearNodes().run();
                }}
                className="text-left hover:bg-neutral-100 w-full p-1 px-2 rounded"
              >
                <h4>Text</h4>
                <p className="text-xs opacity-50">
                  Just Start Writing with plain Text
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = editor.state.doc.textBetween(
                    editor.state.selection.from,
                    editor.state.selection.to,
                    " ",
                  );

                  editor
                    .chain()
                    .deleteSelection()
                    .insertContent(`<h2>${text}</h2>`)
                    .run();
                }}
                className="text-left hover:bg-neutral-100 w-full p-1 px-2 rounded"
              >
                <h4>Heading 1</h4>
                <p className="text-xs opacity-50">Big section heading.</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = editor.state.doc.textBetween(
                    editor.state.selection.from,
                    editor.state.selection.to,
                    " ",
                  );

                  editor
                    .chain()
                    .deleteSelection()
                    .insertContent(`<h3>${text}</h3>`)
                    .run();
                }}
                className="text-left hover:bg-neutral-100 w-full p-1 px-2 rounded"
              >
                <h4>Heading 2</h4>
                <p className="text-xs opacity-50">
                  Medium section heading.
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = editor.state.doc.textBetween(
                    editor.state.selection.from,
                    editor.state.selection.to,
                    " ",
                  );

                  editor
                    .chain()
                    .deleteSelection()
                    .insertContent(`<h4>${text}</h4>`)
                    .run();
                }}
                className="text-left hover:bg-neutral-100 w-full p-1 px-2 rounded"
              >
                <h4>Heading 3</h4>
                <p className="text-xs opacity-50">Small section heading.</p>
              </button>
            </div>
          </PopoverContent>
        </Popover>
        <div className="grid grid-flow-col items-center gap-1 font-bold md:text-sm text-xs">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`text-neutral-600 font-semibold size-7 hover:bg-zinc-100 rounded transition-colors ${
              editor.isActive("bold") ? "text-primary" : ""
            }`}
          >
            B
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`text-neutral-600 italic transition-colors size-7 hover:bg-zinc-100 rounded ${
              editor.isActive("italic") ? "text-primary" : ""
            }`}
          >
            I
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`text-neutral-600 underline transition-colors size-7 hover:bg-zinc-100 rounded ${
              editor.isActive("underline") ? "text-primary" : ""
            }`}
          >
            U
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`text-neutral-600 line-through transition-colors size-7 hover:bg-zinc-100 rounded ${
              editor.isActive("strike") ? "text-primary" : ""
            }`}
          >
            S
          </button>

          <button
            type="button"
            onClick={() => {
              if (editor.isActive("link")) {
                removeLink();
              } else {
                setIsLinkDialogOpen(true);
              }
            }}
            className={`text-neutral-600 transition-colors grid place-items-center hover:bg-zinc-100 size-7 rounded ${
              editor.isActive("link") ? "text-primary" : ""
            }`}
          >
            <Link2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleImageUpload}
            className="text-neutral-600 transition-colors grid place-items-center hover:bg-zinc-100 size-7 rounded"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`text-neutral-600 transition-colors grid place-items-center hover:bg-zinc-100 size-7 rounded ${
              editor.isActive("bulletList") ? "text-primary" : ""
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`text-neutral-600 transition-colors grid place-items-center hover:bg-zinc-100 size-7 rounded ${
              editor.isActive("orderedList") ? "text-primary" : ""
            }`}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>
      </BubbleMenu>
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
            <DialogDescription>
              Enter the URL for the link you want to add.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">
                URL
              </div>
              <input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={addLink}>
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditorContent
        className={`z-50 relative ${isProcessing ? "pointer-events-none animate-pulse" : "pointer-events-auto"} p-0 m-0`}
        editor={editor}
      />
    </>
  );
};

export default Tiptap;
