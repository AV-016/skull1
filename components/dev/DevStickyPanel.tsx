'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pin, Plus, X, Trash2, Edit2, Check, FileText, Settings, ShieldAlert } from 'lucide-react'

interface DevNote {
  id: string
  title: string
  category: 'HIGHLIGHT' | 'REMOVE' | 'UI/UX' | 'BUGFIX' | 'FEATURE'
  description: string
  status: 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED'
  createdAt: string
}

const DEFAULT_NOTES: DevNote[] = [
  {
    id: 'note-1',
    title: 'Phone OTP Verification',
    category: 'FEATURE',
    description: 'Added Firebase client-side SMS verification inside address forms with numeric formatting and validation.',
    status: 'COMPLETED',
    createdAt: new Date().toISOString()
  },
  {
    id: 'note-2',
    title: 'Razorpay Auto-Refunds',
    category: 'FEATURE',
    description: 'Integrated Razorpay Payments SDK into admin refund operations and customer cancellations for immediate returns.',
    status: 'COMPLETED',
    createdAt: new Date().toISOString()
  },
  {
    id: 'note-3',
    title: 'Custom Order Split Columns',
    category: 'UI/UX',
    description: 'Redesigned landing hero banner for Skulture customized prints with side-by-side idea/print comparison cards.',
    status: 'COMPLETED',
    createdAt: new Date().toISOString()
  },
  {
    id: 'note-4',
    title: 'FAQ Page Relocation',
    category: 'HIGHLIGHT',
    description: 'Moved FAQs section from homepage to a dedicated subpage (/faq) linked dynamically inside the Footer.',
    status: 'COMPLETED',
    createdAt: new Date().toISOString()
  }
]

export function DevStickyPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState<DevNote[]>([])
  
  // Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<DevNote['category']>('HIGHLIGHT')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<DevNote['status']>('ACTIVE')
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState<DevNote['category']>('HIGHLIGHT')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState<DevNote['status']>('ACTIVE')

  // Load notes from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dev-sticky-notes')
      if (stored) {
        try {
          setNotes(JSON.parse(stored))
        } catch (e) {
          setNotes(DEFAULT_NOTES)
        }
      } else {
        setNotes(DEFAULT_NOTES)
        localStorage.setItem('dev-sticky-notes', JSON.stringify(DEFAULT_NOTES))
      }
    }
  }, [])

  // Save notes to localStorage
  const saveNotes = (updated: DevNote[]) => {
    setNotes(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dev-sticky-notes', JSON.stringify(updated))
    }
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const newNote: DevNote = {
      id: `note-${Date.now()}`,
      title: title.trim(),
      category,
      description: description.trim(),
      status,
      createdAt: new Date().toISOString()
    }

    saveNotes([newNote, ...notes])
    setTitle('')
    setDescription('')
    setCategory('HIGHLIGHT')
    setStatus('ACTIVE')
  }

  const handleDeleteNote = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id))
  }

  const startEditing = (note: DevNote) => {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditCategory(note.category)
    setEditDescription(note.description)
    setEditStatus(note.status)
  }

  const handleSaveEdit = (id: string) => {
    const updated = notes.map(n => {
      if (n.id === id) {
        return {
          ...n,
          title: editTitle.trim(),
          category: editCategory,
          description: editDescription.trim(),
          status: editStatus
        }
      }
      return n
    })
    saveNotes(updated)
    setEditingId(null)
  }

  const getCategoryColor = (cat: DevNote['category']) => {
    switch (cat) {
      case 'HIGHLIGHT': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'REMOVE': return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'UI/UX': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'BUGFIX': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'FEATURE': return 'bg-green-500/10 text-green-400 border-green-500/20'
    }
  }

  const getStatusStyle = (st: DevNote['status']) => {
    switch (st) {
      case 'ACTIVE': return 'bg-blue-500 text-white'
      case 'IN_PROGRESS': return 'bg-amber-500 text-white'
      case 'COMPLETED': return 'bg-green-600 text-white'
    }
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-primary hover:bg-primary/95 text-white rounded-full shadow-2xl flex items-center justify-center gap-2 hover:scale-105 transition duration-300 group cursor-pointer"
        title="Developer Sticky Board"
      >
        <Pin className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
        <span className="text-xs font-bold uppercase tracking-wider pr-1">Dev Sticky Notes</span>
      </button>

      {/* Slide-over Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-lg bg-card border-l border-border h-full flex flex-col shadow-2xl text-primary-text text-xs"
            >
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/35">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary animate-spin-slow" />
                  <div>
                    <h2 className="text-base font-extrabold tracking-wide uppercase">Dev Board</h2>
                    <p className="text-[10px] text-muted-text uppercase tracking-wider font-semibold">Track features highlights & updates</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-secondary rounded-lg transition text-muted-text hover:text-primary-text cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Form to Add New Note */}
                <form onSubmit={handleAddNote} className="p-4 bg-secondary/30 border border-border rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="font-extrabold uppercase tracking-wider text-[10px] text-primary">Add Sticky Note</span>
                    <Plus className="w-4 h-4 text-primary" />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-bold text-muted-text uppercase tracking-wider block mb-1">Title</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Highlight active event changes"
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-primary-text focus:outline-none focus:border-primary/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-muted-text uppercase tracking-wider block mb-1">Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as DevNote['category'])}
                          className="w-full px-2 py-2 bg-secondary border border-border rounded-lg text-primary-text focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
                        >
                          <option value="HIGHLIGHT">Highlight</option>
                          <option value="REMOVE">Remove / Deprecate</option>
                          <option value="FEATURE">Feature</option>
                          <option value="BUGFIX">Bugfix</option>
                          <option value="UI/UX">UI/UX Change</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-muted-text uppercase tracking-wider block mb-1">Status</label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as DevNote['status'])}
                          className="w-full px-2 py-2 bg-secondary border border-border rounded-lg text-primary-text focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-muted-text uppercase tracking-wider block mb-1">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter brief details of the change..."
                        rows={3}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-primary-text focus:outline-none focus:border-primary/50 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg uppercase tracking-wider transition shadow-md shadow-primary/10 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Save to Board
                    </button>
                  </div>
                </form>

                {/* List of Notes */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="font-extrabold uppercase tracking-wider text-[10px]">Active Board Notes ({notes.length})</span>
                    <FileText className="w-4 h-4 text-muted-text" />
                  </div>

                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-4 bg-secondary/15 border border-border rounded-2xl flex flex-col gap-2 relative group hover:border-primary/20 smooth-transition"
                      >
                        {editingId === note.id ? (
                          /* Editing Interface */
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-2 py-1 bg-secondary border border-border rounded text-xs font-bold text-primary-text"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value as DevNote['category'])}
                                className="px-2 py-1 bg-secondary border border-border rounded text-[10px]"
                              >
                                <option value="HIGHLIGHT">Highlight</option>
                                <option value="REMOVE">Remove</option>
                                <option value="FEATURE">Feature</option>
                                <option value="BUGFIX">Bugfix</option>
                                <option value="UI/UX">UI/UX</option>
                              </select>
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value as DevNote['status'])}
                                className="px-2 py-1 bg-secondary border border-border rounded text-[10px]"
                              >
                                <option value="ACTIVE">Active</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                              </select>
                            </div>
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={2}
                              className="w-full px-2 py-1 bg-secondary border border-border rounded text-[11px] resize-none"
                            />
                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-2.5 py-1 border border-border rounded text-[9px] font-bold uppercase hover:bg-secondary cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(note.id)}
                                className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[9px] font-bold uppercase cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Default View */
                          <>
                            <div className="flex justify-between items-start pr-12">
                              <div className="flex flex-col gap-1">
                                <h4 className="font-extrabold text-sm text-primary-text leading-tight">{note.title}</h4>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span className={`text-[8px] font-bold border px-1.5 py-0.5 rounded uppercase tracking-wider ${getCategoryColor(note.category)}`}>
                                    {note.category}
                                  </span>
                                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${getStatusStyle(note.status)}`}>
                                    {note.status.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {note.description && (
                              <p className="text-secondary-text text-[11px] leading-relaxed mt-1 font-medium">
                                {note.description}
                              </p>
                            )}

                            {/* Floating Action Controls */}
                            <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <button
                                onClick={() => startEditing(note)}
                                className="p-1 border border-border hover:border-primary/40 hover:text-primary rounded bg-card text-muted-text smooth-transition cursor-pointer"
                                title="Edit Note"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-1 border border-border hover:border-red-500/40 hover:text-red-500 rounded bg-card text-muted-text smooth-transition cursor-pointer"
                                title="Delete Note"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                    {notes.length === 0 && (
                      <div className="p-8 border border-dashed border-border rounded-2xl text-center text-muted-text font-semibold uppercase tracking-wider">
                        Sticky board is empty
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
