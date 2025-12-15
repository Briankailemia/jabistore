import nodemailer from 'nodemailer'
import { prisma } from './prisma'
import logger from './logger'

/**
 * Get email configuration from database settings or environment variables
 */
async function getEmailConfig() {
  try {
    // Try to get from database settings first
    const smtpSettings = await prisma.settings.findUnique({
      where: { key: 'smtp' }
    })

    if (smtpSettings?.value) {
      const config = smtpSettings.value
      return {
        host: config.host || process.env.SMTP_HOST,
        port: config.port || parseInt(process.env.SMTP_PORT || '587'),
        secure: config.secure || (config.port === 465),
        auth: {
          user: config.user || process.env.SMTP_USER,
          pass: config.pass || process.env.SMTP_PASS,
        },
        from: config.from || process.env.SMTP_FROM || config.user || process.env.SMTP_USER,
      }
    }

    // Fallback to environment variables
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
    }
  } catch (error) {
    logger.error('Error getting email config', { error: error.message })
    // Fallback to environment variables
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
    }
  }
}

/**
 * Create a nodemailer transporter instance
 */
async function createTransporter() {
  const config = await getEmailConfig()

  if (!config.host || !config.auth?.user || !config.auth?.pass) {
    throw new Error('Email configuration is incomplete. Please configure SMTP settings in admin panel or environment variables.')
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  })
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email body
 * @param {string} [options.html] - HTML email body
 * @param {string} [options.from] - Sender email address (defaults to configured from address)
 * @param {string} [options.replyTo] - Reply-to email address
 * @param {Array} [options.cc] - CC recipients
 * @param {Array} [options.bcc] - BCC recipients
 * @returns {Promise<Object>} - Email send result
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  from,
  replyTo,
  cc,
  bcc,
}) {
  try {
    const config = await getEmailConfig()
    const transporter = await createTransporter()

    const mailOptions = {
      from: from || config.from,
      to,
      subject,
      text,
      html: html || text?.replace(/\n/g, '<br>'),
      replyTo: replyTo || from || config.from,
      cc,
      bcc,
    }

    const result = await transporter.sendMail(mailOptions)
    
    logger.info('Email sent successfully', {
      to,
      subject,
      messageId: result.messageId,
    })

    return {
      success: true,
      messageId: result.messageId,
      response: result.response,
    }
  } catch (error) {
    logger.error('Error sending email', {
      error: error.message,
      to,
      subject,
      stack: error.stack,
    })

    throw new Error(`Failed to send email: ${error.message}`)
  }
}

/**
 * Send a contact form email
 * @param {Object} data - Contact form data
 * @param {string} data.name - Sender name
 * @param {string} data.email - Sender email
 * @param {string} data.subject - Email subject
 * @param {string} data.message - Email message
 * @param {string} [data.category] - Contact category
 * @returns {Promise<Object>} - Email send result
 */
export async function sendContactEmail(data) {
  const { name, email, subject, message, category } = data

  // Get store email from settings
  let storeEmail = 'support@dilitechsolutions.com'
  try {
    const storeSettings = await prisma.settings.findUnique({
      where: { key: 'store' }
    })
    if (storeSettings?.value?.storeEmail) {
      storeEmail = storeSettings.value.storeEmail
    }
  } catch (error) {
    logger.warn('Could not fetch store email from settings', { error: error.message })
  }

  const emailSubject = category 
    ? `[${category}] ${subject}`
    : subject

  const emailText = `
New contact form submission from ${name} (${email})

Subject: ${subject}
${category ? `Category: ${category}\n` : ''}

Message:
${message}

---
This email was sent from the contact form on your website.
Reply directly to this email to respond to ${name} at ${email}
  `.trim()

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">New Contact Form Submission</h2>
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Subject:</strong> ${subject}</p>
      ${category ? `<p><strong>Category:</strong> ${category}</p>` : ''}
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap; background: #f9fafb; padding: 15px; border-radius: 5px;">${message.replace(/\n/g, '<br>')}</p>
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        This email was sent from the contact form on your website.<br>
        Reply directly to this email to respond to ${name} at ${email}
      </p>
    </div>
  `

  return sendEmail({
    to: storeEmail,
    subject: emailSubject,
    text: emailText,
    html: emailHtml,
    replyTo: email, // Allow replying directly to the sender
  })
}

/**
 * Send a support email
 * @param {Object} data - Support email data
 * @param {string} data.name - Sender name
 * @param {string} data.email - Sender email
 * @param {string} data.subject - Email subject
 * @param {string} data.message - Email message
 * @param {string} [data.category] - Support category
 * @param {string} [data.orderNumber] - Order number if applicable
 * @returns {Promise<Object>} - Email send result
 */
export async function sendSupportEmail(data) {
  const { name, email, subject, message, category, orderNumber } = data

  // Get store email from settings
  let storeEmail = 'support@dilitechsolutions.com'
  try {
    const storeSettings = await prisma.settings.findUnique({
      where: { key: 'store' }
    })
    if (storeSettings?.value?.storeEmail) {
      storeEmail = storeSettings.value.storeEmail
    }
  } catch (error) {
    logger.warn('Could not fetch store email from settings', { error: error.message })
  }

  const emailSubject = category 
    ? `[${category}] ${subject}`
    : subject

  const emailText = `
New support request from ${name} (${email})

Subject: ${subject}
${category ? `Category: ${category}\n` : ''}
${orderNumber ? `Order Number: ${orderNumber}\n` : ''}

Message:
${message}

---
This email was sent from the support form on your website.
Reply directly to this email to respond to ${name} at ${email}
  `.trim()

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">New Support Request</h2>
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Subject:</strong> ${subject}</p>
      ${category ? `<p><strong>Category:</strong> ${category}</p>` : ''}
      ${orderNumber ? `<p><strong>Order Number:</strong> ${orderNumber}</p>` : ''}
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap; background: #f9fafb; padding: 15px; border-radius: 5px;">${message.replace(/\n/g, '<br>')}</p>
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        This email was sent from the support form on your website.<br>
        Reply directly to this email to respond to ${name} at ${email}
      </p>
    </div>
  `

  return sendEmail({
    to: storeEmail,
    subject: emailSubject,
    text: emailText,
    html: emailHtml,
    replyTo: email, // Allow replying directly to the sender
  })
}

/**
 * Verify email configuration
 * @returns {Promise<Object>} - Verification result
 */
export async function verifyEmailConfig() {
  try {
    const transporter = await createTransporter()
    await transporter.verify()
    return {
      success: true,
      message: 'Email configuration is valid',
    }
  } catch (error) {
    return {
      success: false,
      message: error.message,
    }
  }
}

