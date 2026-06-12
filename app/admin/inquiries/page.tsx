'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminInquiries, useUpdateInquiryStatus } from '@/hooks/useAdmin'
import { Loader2, Eye, X, Mail, CheckCircle2, Send } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'

export default function AdminInquiries() {
  const { data: inquiries, isLoading, refetch } = useAdminInquiries()
  const updateStatusMutation = useUpdateInquiryStatus()
  const [selectedInq, setSelectedInq] = useState<any | null>(null)
  
  // Message Thread States
  const [activeDetails, setActiveDetails] = useState<any | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [loadingThread, setLoadingThread] = useState(false)

  const fetchThreadDetails = async (id: string) => {
    try {
      const res = await api.get(`/admin/inquiries/${id}`)
      if (res.data?.success && res.data?.data) {
        setActiveDetails(res.data.data)
      }
    } catch (err) {
      console.error('Failed to load thread details:', err)
    }
  }

  // Load thread when selectedInq is opened
  useEffect(() => {
    if (selectedInq?.id) {
      setLoadingThread(true)
      fetchThreadDetails(selectedInq.id).finally(() => setLoadingThread(false))
      
      const interval = setInterval(() => {
        fetchThreadDetails(selectedInq.id)
      }, 5000)
      
      return () => clearInterval(interval)
    } else {
      setActiveDetails(null)
    }
  }, [selectedInq?.id])

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedInq) return
    try {
      setSendingReply(true)
      await api.post(`/admin/inquiries/${selectedInq.id}/messages`, {
        message: replyText.trim()
      })
      setReplyText('')
      await fetchThreadDetails(selectedInq.id)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  const handleResolve = (id: string) => {
    updateStatusMutation.mutate(
      { id, status: 'RESOLVED' },
      {
        onSuccess: () => {
          setSelectedInq(null)
          refetch()
        }
      }
    )
  }

  return (
    <AdminLayout>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="heading-2 uppercase tracking-wide">Inquiries</h1>
          <p className="text-xs text-muted-text uppercase tracking-widest">Manage customer feedback and messages</p>
        </div>

        {/* Inquiries table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-secondary-text">Loading inquiries...</p>
          </div>
        ) : (
          <div className="glass-card overflow-x-auto border border-border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/40 text-[10px] font-bold text-muted-text uppercase tracking-widest">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {inquiries?.map((inq: any) => (
                  <tr key={inq.id} className="hover:bg-secondary/25 smooth-transition">
                    <td className="px-6 py-4 font-bold text-primary-text">{inq.name}</td>
                    <td className="px-6 py-4 text-muted-text">{inq.email}</td>
                    <td className="px-6 py-4 font-semibold text-secondary-text truncate max-w-[200px]">
                      {inq.subject}
                    </td>
                    <td className="px-6 py-4 text-muted-text">{formatDate(inq.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 border text-[9px] uppercase font-bold tracking-wider rounded ${
                        inq.status === 'RESOLVED' 
                          ? 'bg-green-500/5 text-green-400 border-green-500/20' 
                          : 'bg-orange-500/5 text-orange-400 border-orange-500/20'
                      }`}>
                        {inq.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedInq(inq)}
                        className="p-2 border border-border hover:border-primary/50 text-secondary-text hover:text-primary smooth-transition cursor-pointer inline-flex items-center gap-1.5"
                        title="View Message"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Read</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {inquiries?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-muted-text uppercase tracking-widest text-[10px]">
                      No inquiries received.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* View Details / Chat Modal */}
      <AnimatePresence>
        {selectedInq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInq(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-popover border border-border p-6 shadow-2xl z-10 space-y-5 max-h-[95vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <h3 className="font-bold text-sm uppercase tracking-widest text-primary-text flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" /> Read Inquiry
                </h3>
                <button 
                  onClick={() => setSelectedInq(null)}
                  className="text-muted-text hover:text-primary-text smooth-transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingThread && !activeDetails ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-[10px] text-muted-text uppercase font-bold tracking-widest">Loading messages thread...</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  {/* Meta details */}
                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-border/40 text-[10px] uppercase tracking-wider text-muted-text font-bold">
                    <div>
                      <span className="block text-[8px] font-extrabold text-muted-text mb-1">From</span>
                      <span className="text-primary-text">{selectedInq.name}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-extrabold text-muted-text mb-1">Email</span>
                      <span className="text-primary-text select-all">{selectedInq.email}</span>
                    </div>
                  </div>

                  {activeDetails?.product && (
                    <div className="p-2.5 bg-secondary/40 border border-border rounded flex items-center justify-between text-[10px]">
                      <span className="font-bold text-muted-text uppercase tracking-widest">Linked Product:</span>
                      <span className="font-semibold text-primary">{activeDetails.product.name}</span>
                    </div>
                  )}

                  {activeDetails?.order && (
                    <div className="p-2.5 bg-secondary/40 border border-border rounded flex items-center justify-between text-[10px]">
                      <span className="font-bold text-muted-text uppercase tracking-widest">Linked Order:</span>
                      <span className="font-semibold text-primary">#{activeDetails.order.orderNumber}</span>
                    </div>
                  )}

                  {/* Subject */}
                  <div className="space-y-1">
                    <span className="block text-[9px] font-extrabold text-muted-text uppercase tracking-widest">Subject</span>
                    <p className="font-bold text-sm text-primary-text">{selectedInq.subject}</p>
                  </div>

                  {/* Chat / Messages list */}
                  <div className="space-y-3 p-3 bg-secondary/35 border border-border rounded max-h-52 overflow-y-auto">
                    {/* First message */}
                    <div className="p-2 bg-popover border border-border/80 rounded-lg">
                      <div className="flex justify-between items-center text-[8px] font-bold text-muted-text uppercase tracking-wider mb-1">
                        <span>{selectedInq.name}</span>
                        <span>{formatDate(selectedInq.createdAt)}</span>
                      </div>
                      <p className="text-secondary-text leading-relaxed whitespace-pre-wrap">{selectedInq.message}</p>
                    </div>

                    {/* Replies */}
                    {activeDetails?.messages?.map((msg: any) => {
                      const isAdmin = msg.senderRole === 'ADMIN'
                      return (
                        <div 
                          key={msg.id} 
                          className={`p-2 rounded-lg border ${
                            isAdmin 
                              ? 'bg-primary/5 border-primary/20 ml-6' 
                              : 'bg-popover border-border/80 mr-6'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[8px] font-bold text-muted-text uppercase tracking-wider mb-1">
                            <span className={isAdmin ? 'text-primary' : ''}>{isAdmin ? 'Support Agent (Admin)' : (selectedInq.name)}</span>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-secondary-text leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Reply Input Box */}
                  <form onSubmit={handleSendReply} className="flex gap-2 items-center border-t border-border pt-3">
                    <input
                      type="text"
                      placeholder="Type your response reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={sendingReply}
                      className="flex-1 px-3 py-2 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 rounded text-xs"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="p-2 bg-primary text-white rounded hover:bg-primary/90 cursor-pointer disabled:opacity-50 smooth-transition"
                    >
                      {sendingReply ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </form>

                  {/* Action buttons */}
                  <div className="pt-3 border-t border-border flex justify-between gap-3">
                    <div>
                      {selectedInq.status === 'PENDING' && (
                        <button
                          onClick={() => handleResolve(selectedInq.id)}
                          disabled={updateStatusMutation.isPending}
                          className="px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-500 smooth-transition uppercase tracking-widest text-[9px] font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          {updateStatusMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Resolve
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedInq(null)}
                      className="px-5 py-2.5 border border-border text-primary-text hover:bg-secondary smooth-transition uppercase tracking-widest text-[9px] font-bold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}

