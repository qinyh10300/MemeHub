import nodemailer from 'nodemailer'

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = process.env

// 创建邮件传输器
const transporter = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465, // 465 使用 SSL
      auth: SMTP_USER
        ? {
            user: SMTP_USER,
            pass: SMTP_PASS,
          }
        : undefined,
    })
  : null

export const isEmailEnabled = () => Boolean(transporter)

export const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export async function sendMail({ to, subject, text, html }) {
  if (!transporter) {
    console.warn('[mailer] transporter not configured, skip sending')
    return
  }
  if (!to || !isValidEmail(to)) {
    console.warn('[mailer] invalid recipient, skip sending')
    return
  }

  const from = SMTP_FROM || SMTP_USER || 'no-reply@memehub'

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  })
}

