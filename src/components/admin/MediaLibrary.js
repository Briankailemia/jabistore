'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import OptimizedImage from '@/components/OptimizedImage'

export default function MediaLibrary({ isOpen, onClose, onSelectImage, multiple = false }) {
  const [mediaFiles, setMediaFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImages, setSelectedImages] = useState([])
  const toast = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchMedia()
    }
  }, [isOpen])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/media', {
        credentials: 'include',
      })

      if (response.ok) {
        const result = await response.json()
        setMediaFiles(result.data || [])
      } else {
        toast.error('Failed to load media library')
      }
    } catch (error) {
      console.error('Error fetching media:', error)
      toast.error('Failed to load media library')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectImage = (image) => {
    if (multiple) {
      setSelectedImages(prev => {
        const isSelected = prev.some(img => img.url === image.url)
        if (isSelected) {
          return prev.filter(img => img.url !== image.url)
        } else {
          return [...prev, image]
        }
      })
    } else {
      onSelectImage(image)
      onClose()
    }
  }

  const handleConfirmSelection = () => {
    if (selectedImages.length > 0) {
      if (multiple) {
        // Call onSelectImage for each selected image
        selectedImages.forEach(img => onSelectImage(img))
      } else {
        onSelectImage(selectedImages[0])
      }
      setSelectedImages([])
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Media Library</h2>
              <p className="text-sm text-blue-200 mt-1">Select from uploaded images</p>
            </div>
            <div className="flex items-center gap-3">
              {multiple && selectedImages.length > 0 && (
                <button
                  onClick={handleConfirmSelection}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Select {selectedImages.length} Image{selectedImages.length !== 1 ? 's' : ''}
                </button>
              )}
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            </div>
          ) : mediaFiles.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Images Found</h3>
              <p className="text-gray-600">Upload images to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mediaFiles.map((file, index) => {
                const isSelected = selectedImages.some(img => img.url === file.url)
                return (
                  <div
                    key={index}
                    onClick={() => handleSelectImage({ url: file.url, alt: file.filename })}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-900 ring-4 ring-blue-500 ring-offset-2'
                        : 'border-gray-200 hover:border-blue-500'
                    }`}
                  >
                    <OptimizedImage
                      src={file.url}
                      alt={file.filename}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-900/20 flex items-center justify-center">
                        <div className="bg-blue-900 text-white rounded-full p-2">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                      {file.filename}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

