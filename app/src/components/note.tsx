"use client"

import { useState, useEffect } from "react"
import { Plus, Upload, Folder as FolderIcon } from "lucide-react"
import axiosInstance from "@/app/utils/axiosInstance"
import { useSessionContext } from "./sessionprovider"

export interface Folder {
  id: string
  name: string
  notes: Note[]
}

export interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
}

export function NotesContainer() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [newNoteContent, setNewNoteContent] = useState("")
  const [userId, setUserId] = useState<string | null>(null)

  const { userData } = useSessionContext()

  useEffect(() => {
    if (userData) {
      setUserId(userData.id)
    }
  }, [userData])

  useEffect(() => {
    if (userId) {
      fetchFolders()
    }
  }, [userId])

  const fetchFolders = async () => {
    try {
      const response = await axiosInstance.get(`/api/get-folders/?user_id=${userId}`)
      setFolders(response.data.data)
    } catch (error) {
      console.error("Error fetching folders:", error)
    }
  }

  const createFolder = async () => {
    if (newFolderName.trim() === "") return
    try {
      await axiosInstance.post("/api/create-folder/", {
        name: newFolderName,
        user_id: userId,
      })
      fetchFolders()
      setNewFolderName("")
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error creating folder:", error)
    }
  }

  const addNoteToFolder = (folderId: string, note: Note) => {
    setFolders(
      folders.map((folder) => {
        if (folder.id === folderId) {
          return {
            ...folder,
            notes: [...folder.notes, note],
          }
        }
        return folder
      }),
    )
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedFolder) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folderId", selectedFolder.id)

    try {
      const response = await axiosInstance.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      const newNote: Note = {
        id: Date.now().toString(),
        title: response.data.title,
        content: response.data.content,
        createdAt: new Date(response.data.createdAt),
      }

      addNoteToFolder(selectedFolder.id, newNote)
      alert(`${file.name} has been added as a new note.`)
    } catch (error) {
      console.error("Upload error:", error)
      alert("There was an error uploading your file. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddNote = () => {
    if (!selectedFolder || newNoteTitle.trim() === "" || newNoteContent.trim() === "") return

    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle,
      content: newNoteContent,
      createdAt: new Date(),
    }

    addNoteToFolder(selectedFolder.id, newNote)
    setNewNoteTitle("")
    setNewNoteContent("")
  }

  if (!userData) {
    return <></>
  }

  return (
    <div className="grid grid-cols-6 grid-rows-1 gap-0 h-full">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Folders</h2>
          <button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {isDialogOpen && (
          <div>
            <input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <button onClick={createFolder}>Create</button>
          </div>
        )}
        <div className="p-4">
          {folders.map((folder) => (
            <div key={folder.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <FolderIcon className="h-4 w-4 mr-2" />
                <span onClick={() => setSelectedFolder(folder)}>{folder.name}</span>
              </div>
            </div>
          ))}
          {selectedFolder && (
            <div className="mt-4">
              <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} disabled={isUploading} />
              <button className="w-full mt-2" disabled={isUploading}>
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload File"}
              </button>
              <div className="mt-4">
                <input
                  placeholder="Note title"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                />
                <textarea
                  placeholder="Note content"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full mt-2"
                />
                <button onClick={handleAddNote} className="w-full mt-2">
                  Add Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 w-full grid col-span-5">
        <div className="border rounded-lg p-4">
          {selectedFolder && (
            <div>
              <h3 className="font-semibold">Notes in {selectedFolder.name}</h3>
              {selectedFolder.notes.map((note) => (
                <div key={note.id} className="border p-2 mt-2">
                  <h4 className="font-semibold">{note.title}</h4>
                  <p>{note.content}</p>
                  <small>{note.createdAt.toLocaleString()}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
