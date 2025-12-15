import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'

// GET /api/media - List all uploaded media files
export const GET = createApiHandler({
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
      const uploadsDir = join(process.cwd(), 'public', 'uploads')
      
      let files = []
      try {
        files = await readdir(uploadsDir)
      } catch (error) {
        // Directory doesn't exist yet
        return ApiResponse.success([])
      }

      // Get file details
      const mediaFiles = await Promise.all(
        files
          .filter(file => {
            const ext = file.split('.').pop()?.toLowerCase()
            return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)
          })
          .map(async (filename) => {
            try {
              const filepath = join(uploadsDir, filename)
              const stats = await stat(filepath)
              return {
                url: `/uploads/${filename}`,
                filename,
                size: stats.size,
                uploadedAt: stats.birthtime.toISOString(),
              }
            } catch (error) {
              return null
            }
          })
      )

      // Filter out nulls and sort by upload date (newest first)
      const validFiles = mediaFiles
        .filter(file => file !== null)
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))

      return ApiResponse.success(validFiles)
    } catch (error) {
      console.error('Error listing media:', error)
      return ApiResponse.internalServerError('Failed to list media files')
    }
  },
})

