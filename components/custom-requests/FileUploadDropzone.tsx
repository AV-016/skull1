'use client'

import { motion } from 'framer-motion'
import { Upload, FileIcon, X } from 'lucide-react'
import { useState, useCallback } from 'react'
import { formatFileSize } from '@/lib/utils'
import { SUPPORTED_FILE_EXTENSIONS, MAX_FILE_SIZE } from '@/lib/constants'

interface FilePreviewCardProps {
  file: File
  onRemove: (name: string) => void
}

const FilePreviewCard = ({ file, onRemove }: FilePreviewCardProps) => {
  const isImage = file.type.startsWith('image/')

  return (
    <motion.div
      className="relative p-4 bg-secondary border border-border rounded-xl group hover:border-primary/50 smooth-transition shadow"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-16 h-16 bg-card border border-border rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {isImage ? (
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <FileIcon className="w-8 h-8 text-secondary-text" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-primary-text font-bold truncate text-sm">{file.name}</p>
          <p className="text-secondary-text text-xs mt-1">{formatFileSize(file.size)}</p>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(file.name)}
          className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 smooth-transition hover:bg-red-600 cursor-pointer shadow-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

interface FileUploadDropzoneProps {
  files: File[]
  onFilesAdd: (files: File[]) => void
  onFileRemove: (fileName: string) => void
  disabled?: boolean
}

export const FileUploadDropzone = ({
  files,
  onFilesAdd,
  onFileRemove,
  disabled = false,
}: FileUploadDropzoneProps) => {
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }, [])

  const validateAndAddFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return

    const validFiles: File[] = []
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i]

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`File ${file.name} is too large`)
        continue
      }

      // Check file type
      const isSupported = SUPPORTED_FILE_EXTENSIONS.some(ext =>
        file.name.toLowerCase().endsWith(ext)
      )
      if (!isSupported) {
        console.warn(`File ${file.name} is not supported`)
        alert(`File "${file.name}" is not supported. Please upload formats like STL, OBJ, STEP, PNG, or JPG. ZIP/compressed files are not allowed.`)
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length > 0) {
      onFilesAdd(validFiles)
    }
  }, [onFilesAdd])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)
      if (!disabled) {
        validateAndAddFiles(e.dataTransfer.files)
      }
    },
    [disabled, validateAndAddFiles]
  )

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <motion.div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative p-12 md:p-16 border-2 border-dashed rounded-2xl smooth-transition cursor-pointer ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border bg-secondary/30 hover:border-primary/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          type="file"
          multiple
          accept={SUPPORTED_FILE_EXTENSIONS.join(',')}
          onChange={(e) => validateAndAddFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center text-center pointer-events-none">
          <motion.div
            animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Upload className="w-12 h-12 text-primary mb-4 mx-auto" />
          </motion.div>
          <h3 className="text-xl font-bold text-primary-text mb-2">
            {isDragActive ? 'Drop files here' : 'Drag files here or click to upload'}
          </h3>
          <p className="text-secondary-text text-sm font-medium">
            Supported formats: STL, OBJ, STEP, PNG, JPG, JPEG
          </p>
          <p className="text-muted-text text-xs mt-2 font-semibold">
            Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
          </p>
        </div>
      </motion.div>

      {/* File List */}
      {files.length > 0 && (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h4 className="font-bold text-primary-text text-sm">
            Files Selected ({files.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {files.map((file) => (
              <FilePreviewCard
                key={file.name}
                file={file}
                onRemove={onFileRemove}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
