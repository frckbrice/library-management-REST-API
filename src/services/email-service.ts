/**
 * Email Service
 *
 * Sends emails via Gmail SMTP (nodemailer): response emails to contact form
 * visitors, acknowledgment emails, and generic sendEmail. Requires
 * GMAIL_USER and GMAIL_APP_PASSWORD; logs and returns false if not configured.
 *
 * @module src/services/email-service
 */

import nodemailer from 'nodemailer';

// Check for Gmail SMTP configuration
if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("Gmail SMTP credentials not found. Email functionality will be disabled.");
    console.warn("Required environment variables: GMAIL_USER, GMAIL_APP_PASSWORD");
}

// Create SMTP transporter for Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
    secure: true, // Use TLS
    port: 465,
});

/** Parameters for generic sendEmail. */
interface EmailParams {
    to: string;
    from: string;
    subject: string;
    text?: string;
    html?: string;
}

/** Parameters for sending a reply to a contact form submission. */
interface ResponseEmailParams {
    visitorEmail: string;
    visitorName: string;
    originalSubject: string;
    responseSubject: string;
    responseMessage: string;
    libraryName: string;
    libraryEmail: string;
}

/**
 * Sends an email reply to a visitor who submitted a contact form (HTML + text).
 * @param params - Reply content and library/visitor details
 * @returns true if sent, false if SMTP not configured or send failed
 */
export async function sendResponseEmail(params: ResponseEmailParams): Promise<boolean> {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.log("Email would be sent to:", params.visitorEmail);
        console.log("Subject:", params.responseSubject);
        return false;
    }

    try {
        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Response from ${params.libraryName}</h2>
        
        <p>Dear ${params.visitorName},</p>
        
        <p>Thank you for contacting us. We have received your inquiry regarding "<strong>${params.originalSubject}</strong>" and are pleased to respond.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">Our Response:</h3>
          <div style="white-space: pre-wrap; line-height: 1.6;">${params.responseMessage}</div>
        </div>
        
        <p>If you have any additional questions or need further assistance, please don't hesitate to contact us.</p>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        
        <p style="color: #6c757d; font-size: 14px;">
          Best regards,<br>
          ${params.libraryName}<br>
          <a href="mailto:${params.libraryEmail}" style="color: #007bff;">${params.libraryEmail}</a>
        </p>
        
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          This is an automated response from our library inquiry system. Please do not reply directly to this email.
        </p>
      </div>
    `;

        const textContent = `
Response from ${params.libraryName}

Dear ${params.visitorName},

Thank you for contacting us. We have received your inquiry regarding "${params.originalSubject}" and are pleased to respond.

Our Response:
${params.responseMessage}

If you have any additional questions or need further assistance, please don't hesitate to contact us.

Best regards,
${params.libraryName}
${params.libraryEmail}

This is an automated response from our library inquiry system. Please do not reply directly to this email.
    `;

        await transporter.sendMail({
            from: `"${params.libraryName}" <${process.env.GMAIL_USER}>`,
            to: params.visitorEmail,
            subject: params.responseSubject,
            text: textContent,
            html: htmlContent,
            replyTo: params.libraryEmail,
        });

        return true;
    } catch (error) {
        console.error('Gmail SMTP email error:', error);
        return false;
    }
}

/**
 * Sends an acknowledgment email to a visitor after they submit a contact form.
 * @param params - Visitor email/name, subject, library name/email
 * @returns true if sent, false if SMTP not configured or send failed
 */
export async function sendAcknowledgmentEmail(params: {
    visitorEmail: string;
    visitorName: string;
    subject: string;
    libraryName: string;
    libraryEmail: string;
}): Promise<boolean> {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.log("Acknowledgment email would be sent to:", params.visitorEmail);
        return false;
    }

    try {
        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Thank you for contacting ${params.libraryName}</h2>
        
        <p>Dear ${params.visitorName},</p>
        
        <p>We have successfully received your inquiry regarding "<strong>${params.subject}</strong>".</p>
        
        <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #155724;">
            <strong>✓ Message Received</strong><br>
            Our team will review your inquiry and respond within 2-3 business days.
          </p>
        </div>
        
        <p>If you have an urgent matter, please contact us directly at <a href="mailto:${params.libraryEmail}" style="color: #007bff;">${params.libraryEmail}</a>.</p>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        
        <p style="color: #6c757d; font-size: 14px;">
          Best regards,<br>
          ${params.libraryName}<br>
          <a href="mailto:${params.libraryEmail}" style="color: #007bff;">${params.libraryEmail}</a>
        </p>
      </div>
    `;

        await transporter.sendMail({
            from: `"${params.libraryName}" <${process.env.GMAIL_USER}>`,
            to: params.visitorEmail,
            subject: `Re: ${params.subject} - Message Received`,
            html: htmlContent,
            replyTo: params.libraryEmail,
        });

        return true;
    } catch (error) {
        console.error('Gmail SMTP acknowledgment email error:', error);
        return false;
    }
}

/**
 * Sends a generic email (to, from, subject, text/html).
 * @param params - Email parameters
 * @returns true if sent, false if SMTP not configured or send failed
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.log("Email would be sent:", params);
        return false;
    }

    try {
        await transporter.sendMail({
            from: `"Library Platform" <${process.env.GMAIL_USER}>`,
            to: params.to,
            subject: params.subject,
            text: params.text || '',
            html: params.html,
            replyTo: params.from,
        });
        return true;
    } catch (error) {
        console.error('Gmail SMTP email error:', error);
        return false;
    }
}
