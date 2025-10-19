/**
 * Email Notification Service
 * 
 * Sends email notifications using Firebase Cloud Functions
 * or a third-party email service (SendGrid, Mailgun, etc.)
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getUserProfile } from './authService';

export interface EmailNotification {
  to: string;
  subject: string;
  text: string;
  html?: string;
  userId: string;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
}

const EMAILS_COLLECTION = 'mail'; // Firestore collection for email queue

/**
 * Send email to user
 * Uses Firestore-triggered Cloud Function to actually send the email
 */
export async function sendEmail(
  userId: string,
  subject: string,
  text: string,
  html?: string
): Promise<void> {
  try {
    // Get user email
    const userProfile = await getUserProfile(userId);
    
    if (!userProfile.email) {
      throw new Error('User email not found');
    }

    // Add to Firestore email queue
    // A Cloud Function will pick this up and send the email
    const emailData: Partial<EmailNotification> = {
      to: userProfile.email,
      subject,
      text,
      html: html || text,
      userId,
      status: 'pending',
    };

    await addDoc(collection(db, EMAILS_COLLECTION), {
      ...emailData,
      sentAt: serverTimestamp(),
    });

    console.log(`📧 Email queued for ${userProfile.email}: ${subject}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send risk alert email
 */
export async function sendRiskAlertEmail(
  userId: string,
  symbol: string,
  riskLevel: string,
  profitLossPercent: number,
  recommendation: string
): Promise<void> {
  const subject = `🚨 Risk Alert: ${symbol} at ${riskLevel.toUpperCase()} risk`;
  
  const text = `
Risk Alert for ${symbol}

Risk Level: ${riskLevel.toUpperCase()}
Current Loss: ${profitLossPercent.toFixed(2)}%

Recommendation: ${recommendation}

Please review your portfolio and take appropriate action.

---
This is an automated alert from your AI Financial Agent.
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">🚨 Risk Alert</h2>
      <div style="background: #fff3e0; padding: 20px; border-left: 4px solid #ff9800; margin: 20px 0;">
        <h3 style="margin-top: 0;">${symbol}</h3>
        <p><strong>Risk Level:</strong> <span style="color: #d32f2f; font-weight: bold;">${riskLevel.toUpperCase()}</span></p>
        <p><strong>Current Loss:</strong> ${profitLossPercent.toFixed(2)}%</p>
      </div>
      <div style="background: #e3f2fd; padding: 20px; border-left: 4px solid #2196f3; margin: 20px 0;">
        <h4 style="margin-top: 0;">💡 AI Recommendation</h4>
        <p>${recommendation}</p>
      </div>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        This is an automated alert from your AI Financial Agent. Please review your portfolio in the app.
      </p>
    </div>
  `;

  await sendEmail(userId, subject, text, html);
}

/**
 * Send auto-sell notification email
 */
export async function sendAutoSellEmail(
  userId: string,
  symbol: string,
  quantity: number,
  sellPrice: number,
  loss: number,
  reason: string
): Promise<void> {
  const subject = `⚠️ Auto-Sell Executed: ${symbol}`;
  
  const text = `
Auto-Sell Notification

Your Risk & Sell Agent has automatically sold your position in ${symbol}.

Details:
- Symbol: ${symbol}
- Quantity: ${quantity}
- Sell Price: $${sellPrice.toFixed(2)}
- Total Loss: $${Math.abs(loss).toFixed(2)}

Reason: ${reason}

This action was taken to protect your portfolio from further losses.

---
This is an automated action by your AI Financial Agent.
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">⚠️ Auto-Sell Executed</h2>
      <div style="background: #ffebee; padding: 20px; border-left: 4px solid #d32f2f; margin: 20px 0;">
        <h3 style="margin-top: 0;">Your Risk & Sell Agent has acted</h3>
        <p>Your position in <strong>${symbol}</strong> has been automatically sold to protect your portfolio.</p>
      </div>
      <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
        <h4 style="margin-top: 0;">Transaction Details</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Symbol:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #ddd; text-align: right;">${symbol}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Quantity:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #ddd; text-align: right;">${quantity}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Sell Price:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #ddd; text-align: right;">$${sellPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Total Loss:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #d32f2f;">-$${Math.abs(loss).toFixed(2)}</td>
          </tr>
        </table>
      </div>
      <div style="background: #e8f5e9; padding: 20px; border-left: 4px solid #4caf50; margin: 20px 0;">
        <h4 style="margin-top: 0;">Reason for Action</h4>
        <p>${reason}</p>
        <p style="margin-bottom: 0; color: #2e7d32;">This action was taken to prevent further losses and protect your portfolio.</p>
      </div>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        This is an automated action by your AI Financial Agent. You can review the details in your portfolio dashboard.
      </p>
    </div>
  `;

  await sendEmail(userId, subject, text, html);
}

/**
 * Send agent action pending approval email
 */
export async function sendAgentApprovalEmail(
  userId: string,
  agentName: string,
  action: string,
  details: string,
  recommendation: string,
  approvalLink: string
): Promise<void> {
  const subject = `🤖 ${agentName} requires your approval`;
  
  const text = `
Agent Action Approval Required

Your ${agentName} wants to take the following action:

Action: ${action}

Details: ${details}

Recommendation: ${recommendation}

Please review and approve or reject this action in your dashboard.

---
This is a notification from your AI Financial Agent.
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2196f3;">🤖 Agent Action Pending</h2>
      <div style="background: #e3f2fd; padding: 20px; border-left: 4px solid #2196f3; margin: 20px 0;">
        <h3 style="margin-top: 0;">${agentName}</h3>
        <p>Your agent wants to take the following action and requires your approval:</p>
      </div>
      <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
        <h4 style="margin-top: 0;">Proposed Action</h4>
        <p><strong>${action}</strong></p>
        <p>${details}</p>
      </div>
      <div style="background: #e8f5e9; padding: 20px; border-left: 4px solid #4caf50; margin: 20px 0;">
        <h4 style="margin-top: 0;">💡 AI Recommendation</h4>
        <p>${recommendation}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${approvalLink}" style="background: #4caf50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
          Review & Approve
        </a>
      </div>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        This action requires your approval. Please review it in your dashboard.
      </p>
    </div>
  `;

  await sendEmail(userId, subject, text, html);
}
