'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FileUploadDropzone } from '@/components/custom-requests/FileUploadDropzone'
import { CustomRequestSchema } from '@/lib/validators'

export default function CustomRequestPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm({
    resolver: zodResolver(CustomRequestSchema),
    mode: 'onChange',
  })

  const title = watch('title')
  const description = watch('description')

  const handleAddFiles = (newFiles: File[]) => {
    setFiles([...files, ...newFiles])
  }

  const handleRemoveFile = (fileName: string) => {
    setFiles(files.filter(f => f.name !== fileName))
  }

  const onSubmit = async (data: any) => {
    if (files.length === 0) return

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      // Simulate file upload with progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval)
            return prev
          }
          return prev + Math.random() * 30
        })
      }, 200)

      // TODO: Submit to API
      // const formData = new FormData()
      // formData.append('title', data.title)
      // formData.append('description', data.description)
      // files.forEach(file => formData.append('files', file))
      // await api.post(ENDPOINTS.CUSTOM_REQUESTS, formData)

      setUploadProgress(100)
      clearInterval(interval)

      setTimeout(() => {
        setSubmitSuccess(true)
        setIsSubmitting(false)
      }, 500)
    } catch (error) {
      console.error('Upload failed:', error)
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  return (
    <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
      <Navbar />

      {/* Page Header */}
      <motion.div
        className="pt-32 pb-12 md:pb-16 border-b border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="heading-2 text-primary-text mb-4">Create Your Custom Project</h1>
          <p className="text-secondary-text max-w-2xl">
            Upload your design files and tell us about your project. Our expert team will review your submission and provide a detailed quote within 24 hours.
          </p>
        </div>
      </motion.div>

      {/* Form Section */}
      <div className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            {submitSuccess ? (
              <motion.div
                className="text-center py-16"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <div className="w-16 h-16 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="heading-2 text-primary-text mb-4">Request Submitted!</h2>
                <p className="text-secondary-text mb-8 max-w-xl mx-auto">
                  Thank you for your submission. Our team will review your files and provide a detailed quotation within 24 hours. You'll receive updates via email.
                </p>
                <button
                  onClick={() => {
                    setSubmitSuccess(false)
                    setFiles([])
                    setUploadProgress(0)
                  }}
                  className="px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 smooth-transition cursor-pointer shadow-md"
                >
                  Submit Another Request
                </button>
              </motion.div>
            ) : (
              <motion.form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                {/* File Upload - Premium UX */}
                <div className="space-y-3">
                  <h2 className="heading-3 text-lg text-primary-text">Upload Your Design Files</h2>
                  <p className="text-secondary-text text-sm">
                    Supported formats: STL, OBJ, STEP, PNG, JPG, JPEG
                  </p>
                  <FileUploadDropzone
                    files={files}
                    onFilesAdd={handleAddFiles}
                    onFileRemove={handleRemoveFile}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Upload Progress */}
                {isSubmitting && uploadProgress > 0 && (
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-primary-text text-sm font-medium">Uploading files...</p>
                      <p className="text-secondary-text text-sm">{Math.round(uploadProgress)}%</p>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-accent-hover"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Project Details */}
                <div className="space-y-6 pt-4 border-t border-border">
                  <h2 className="heading-3 text-lg text-primary-text">Project Details</h2>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">Project Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Custom Bracket Design"
                      {...register('title')}
                      className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-primary-text placeholder-muted-text focus:outline-none focus:border-primary/40 smooth-transition"
                      disabled={isSubmitting}
                    />
                    {errors.title && (
                      <p className="text-red-400 text-sm mt-1">{(errors.title as any)?.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">Project Description</label>
                    <textarea
                      placeholder="Tell us about your project, requirements, materials, finish, and any other specifications..."
                      {...register('description')}
                      rows={6}
                      className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-primary-text placeholder-muted-text focus:outline-none focus:border-primary/40 smooth-transition resize-none"
                      disabled={isSubmitting}
                    />
                    {errors.description && (
                      <p className="text-red-400 text-sm mt-1">{(errors.description as any)?.message}</p>
                    )}
                    <p className="text-secondary-text text-xs mt-2">
                      {description?.length || 0} characters
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting || files.length === 0 || !isValid}
                  className="w-full px-6 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed smooth-transition text-lg cursor-pointer shadow-md"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? 'Submitting...' : 'Get Your Quote'}
                </motion.button>

                {/* Info Box */}
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-secondary-text text-sm">
                    Next step: Our team will review your files and provide a detailed quotation within 24 hours. You can track your request status anytime.
                  </p>
                </div>
              </motion.form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
