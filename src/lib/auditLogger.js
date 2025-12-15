'use server'

import { prisma } from '@/lib/prisma'
import logger from './logger'

/**
 * Persist an audit log entry for sensitive/admin actions.
 * @param {Object} params
 * @param {string} params.action - e.g. 'ORDER_UPDATE', 'USER_ROLE_CHANGE'
 * @param {string} [params.userId] - acting user
 * @param {string} [params.entityType] - e.g. 'order', 'user', 'product'
 * @param {string} [params.entityId] - target entity id
 * @param {Object} [params.details] - additional metadata (will be stored as JSON)
 * @param {Request} [params.request] - Next Request to capture IP/UA
 */
export async function logAudit({
  action,
  userId,
  entityType,
  entityId,
  details,
  request,
}) {
  try {
    const ip =
      request?.headers?.get('x-forwarded-for') ||
      request?.headers?.get('x-real-ip') ||
      request?.ip ||
      null
    const userAgent = request?.headers?.get('user-agent') || null

    await prisma.auditLog.create({
      data: {
        action,
        userId: userId || null,
        entityType: entityType || null,
        entityId: entityId || null,
        ip,
        userAgent,
        details: details ? sanitizeDetails(details) : undefined,
      },
    })
  } catch (error) {
    // Do not block main flow; just log error
    logger.error('auditLog.write.error', error, { action, entityType, entityId })
  }
}

function sanitizeDetails(details) {
  // Avoid logging secrets or very large payloads
  const cloned = structuredClone(details)
  if (cloned?.token) cloned.token = '[redacted]'
  if (cloned?.password) cloned.password = '[redacted]'
  return cloned
}


