import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import logger from '@/lib/logger'

// POST /api/upload - Upload image file
export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required')
    }

    try {
      const formData = await request.formData()
      const file = formData.get('file')

      if (!file) {
        return ApiResponse.badRequest('No file provided')
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        return ApiResponse.badRequest('Invalid file type. Only images are allowed.')
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        return ApiResponse.badRequest('File size exceeds 5MB limit')
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const extension = file.name.split('.').pop()
      const filename = `${timestamp}-${randomString}.${extension}`

      // Ensure uploads directory exists
      const uploadsDir = join(process.cwd(), 'public', 'uploads')
      try {
        await mkdir(uploadsDir, { recursive: true })
      } catch (error) {
        // Directory might already exist
      }

      // Save file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filepath = join(uploadsDir, filename)
      await writeFile(filepath, buffer)

      // Return file URL
      const fileUrl = `/uploads/${filename}`

      logger.info('File uploaded', { 
        filename, 
        userId: session.user.id,
        size: file.size,
        type: file.type 
      })

      return ApiResponse.success({
        url: fileUrl,
        filename,
        size: file.size,
        type: file.type
      }, 'File uploaded successfully')
    } catch (error) {
      logger.error('File upload error', error)
      return ApiResponse.internalServerError('Failed to upload file')
    }
  },
})

