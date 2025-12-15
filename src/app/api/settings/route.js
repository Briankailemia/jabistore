import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { logAudit } from '@/lib/auditLogger'
import { z } from 'zod'

// GET /api/settings - Get store settings
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
      // Get settings from database
      const storeSettings = await prisma.settings.findUnique({
        where: { key: 'store' }
      })
      const smtpSettings = await prisma.settings.findUnique({
        where: { key: 'smtp' }
      })

      // Default settings
      const defaultStore = {
        storeName: 'Dilitech Solutions',
        storeEmail: 'support@dilitechsolutions.com',
        storePhone: '+254 700 000 000',
        storeAddress: 'Nairobi, Kenya',
        enableMpesa: true,
        enableCard: true,
        defaultShippingCost: 500,
        freeShippingThreshold: 5000,
        taxRate: 0,
        currency: 'KES',
        timezone: 'Africa/Nairobi',
      }

      const defaultSmtp = {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        user: process.env.SMTP_USER || '',
        pass: '', // Never return password
        from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
      }

      const settings = {
        store: storeSettings?.value || defaultStore,
        smtp: smtpSettings?.value ? {
          ...smtpSettings.value,
          pass: smtpSettings.value.pass ? '***configured***' : '', // Mask password
        } : defaultSmtp,
      }

      logger.info('Settings fetched', { userId: session.user.id })

      return ApiResponse.success(settings)
    } catch (error) {
      logger.error('Error fetching settings', { error: error.message })
      return ApiResponse.error('Failed to fetch settings', 500)
    }
  },
})

// PUT /api/settings - Update store settings
const updateSettingsSchema = z.object({
  type: z.enum(['store', 'smtp']),
  storeName: z.string().min(1, 'Store name is required').max(255, 'Store name is too long').optional(),
  storeEmail: z.string().email('Invalid email format').optional(),
  storePhone: z.string().min(10, 'Phone number is too short').optional(),
  storeAddress: z.string().max(500, 'Address is too long').optional(),
  enableMpesa: z.boolean().optional(),
  enableCard: z.boolean().optional(),
  defaultShippingCost: z.number()
    .nonnegative('Shipping cost must be non-negative')
    .optional(),
  freeShippingThreshold: z.number()
    .nonnegative('Free shipping threshold must be non-negative')
    .optional(),
  taxRate: z.number()
    .min(0, 'Tax rate must be at least 0')
    .max(100, 'Tax rate cannot exceed 100')
    .optional(),
  currency: z.string().length(3, 'Currency must be a 3-letter code').optional(),
  timezone: z.string().min(1, 'Timezone is required').optional(),
  // SMTP settings
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpSecure: z.boolean().optional(),
  smtpUser: z.string().email('Invalid email format').optional(),
  smtpPass: z.string().optional(),
  smtpFrom: z.string().email('Invalid email format').optional(),
})

export const PUT = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(updateSettingsSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required')
    }

    const data = request.validatedData
    const { type, ...settingsData } = data

    try {
      if (type === 'store') {
        // Update store settings
        const storeData = {
          storeName: settingsData.storeName,
          storeEmail: settingsData.storeEmail,
          storePhone: settingsData.storePhone,
          storeAddress: settingsData.storeAddress,
          enableMpesa: settingsData.enableMpesa,
          enableCard: settingsData.enableCard,
          defaultShippingCost: settingsData.defaultShippingCost,
          freeShippingThreshold: settingsData.freeShippingThreshold,
          taxRate: settingsData.taxRate,
          currency: settingsData.currency,
          timezone: settingsData.timezone,
        }

        // Remove undefined values
        Object.keys(storeData).forEach(key => {
          if (storeData[key] === undefined) {
            delete storeData[key]
          }
        })

        // Get existing settings
        const existing = await prisma.settings.findUnique({
          where: { key: 'store' }
        })

        const finalStoreData = existing?.value 
          ? { ...existing.value, ...storeData }
          : storeData

        await prisma.settings.upsert({
          where: { key: 'store' },
          update: {
            value: finalStoreData,
            description: 'Store configuration settings',
          },
          create: {
            key: 'store',
            value: finalStoreData,
            description: 'Store configuration settings',
            updatedBy: session.user.id,
          },
        })

        logger.info('Store settings updated', { 
          userId: session.user.id,
          updatedFields: Object.keys(storeData)
        })

        await logAudit({
          action: 'SETTINGS_UPDATE',
          userId: session.user.id,
          entityType: 'settings',
          entityId: 'store',
          details: { updatedFields: Object.keys(storeData) },
          request,
        })

        return ApiResponse.success(
          { settings: finalStoreData },
          'Store settings updated successfully'
        )
      } else if (type === 'smtp') {
        // Update SMTP settings
        const smtpData = {
          host: settingsData.smtpHost,
          port: settingsData.smtpPort,
          secure: settingsData.smtpSecure,
          user: settingsData.smtpUser,
          pass: settingsData.smtpPass,
          from: settingsData.smtpFrom,
        }

        // Remove undefined values
        Object.keys(smtpData).forEach(key => {
          if (smtpData[key] === undefined) {
            delete smtpData[key]
          }
        })

        // Get existing settings
        const existing = await prisma.settings.findUnique({
          where: { key: 'smtp' }
        })

        const finalSmtpData = existing?.value 
          ? { ...existing.value, ...smtpData }
          : smtpData

        // If password is not provided, keep existing password
        if (!smtpData.pass && existing?.value?.pass) {
          finalSmtpData.pass = existing.value.pass
        }

        await prisma.settings.upsert({
          where: { key: 'smtp' },
          update: {
            value: finalSmtpData,
            description: 'SMTP email configuration',
            updatedBy: session.user.id,
          },
          create: {
            key: 'smtp',
            value: finalSmtpData,
            description: 'SMTP email configuration',
            updatedBy: session.user.id,
          },
        })

        logger.info('SMTP settings updated', { 
          userId: session.user.id,
          updatedFields: Object.keys(smtpData)
        })

        await logAudit({
          action: 'SETTINGS_UPDATE',
          userId: session.user.id,
          entityType: 'settings',
          entityId: 'smtp',
          details: { updatedFields: Object.keys(smtpData) },
          request,
        })

        return ApiResponse.success(
          { 
            settings: {
              ...finalSmtpData,
              pass: finalSmtpData.pass ? '***configured***' : '', // Mask password
            }
          },
          'SMTP settings updated successfully'
        )
      } else {
        return ApiResponse.error('Invalid settings type', 400)
      }
    } catch (error) {
      logger.error('Error updating settings', { 
        error: error.message,
        userId: session.user.id,
      })
      return ApiResponse.error('Failed to update settings', 500)
    }
  },
})

