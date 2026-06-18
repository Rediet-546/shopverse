const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  async initialize() {
    try {
      if (this.isConnected) return this.transporter;

      const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        },
        pool: true,
        maxConnections: 5,
        rateLimit: 10
      };

      this.transporter = nodemailer.createTransport(config);
      
      // Verify connection
      await this.transporter.verify();
      this.isConnected = true;
      this.retryCount = 0;
      
      logger.info('✅ Email service initialized successfully');
      return this.transporter;

    } catch (error) {
      logger.error('❌ Email service initialization failed:', error);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        logger.info(`Retrying email connection... Attempt ${this.retryCount}`);
        await this.sleep(5000 * this.retryCount);
        return this.initialize();
      }
      
      throw error;
    }
  }

  async sendEmail({ to, subject, html, text, attachments = [], bcc = [] }) {
    try {
      await this.initialize();

      if (!to || (!html && !text)) {
        throw new Error('Missing required email parameters');
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@shopverse.com',
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text,
        attachments,
        bcc: Array.isArray(bcc) ? bcc.join(', ') : bcc,
        headers: {
            'X-Priority': '1',
            'X-Mailer': 'ShopVerse Mailer'
        }
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`✅ Email sent to ${to} with ID: ${info.messageId}`);
      return info;

    } catch (error) {
      logger.error(`❌ Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  // Template methods
  async sendVerificationEmail(email, token, name) {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f8f9fa; }
          .button { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ShopVerse!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name || 'there'}!</h2>
            <p>Thank you for registering with ShopVerse. Please verify your email address to complete your registration.</p>
            <div style="text-align: center;">
              <a href="${verifyUrl}" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p><a href="${verifyUrl}">${verifyUrl}</a></p>
            <p>This link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ShopVerse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to ShopVerse!
      
      Hello ${name || 'there'}!
      
      Thank you for registering with ShopVerse. Please verify your email address by clicking the link below:
      
      ${verifyUrl}
      
      This link will expire in 24 hours.
      
      © ${new Date().getFullYear()} ShopVerse. All rights reserved.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - ShopVerse',
      html,
      text
    });
  }

  async sendPasswordResetEmail(email, token, name) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e74c3c; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f8f9fa; }
          .button { display: inline-block; padding: 12px 24px; background: #e74c3c; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Hello ${name || 'there'}!</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ShopVerse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Reset Your Password
      
      Hello ${name || 'there'}!
      
      We received a request to reset your password. Click the link below to create a new password:
      
      ${resetUrl}
      
      Security Notice: This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
      
      © ${new Date().getFullYear()} ShopVerse. All rights reserved.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - ShopVerse',
      html,
      text
    });
  }

  async sendOrderConfirmation(email, order, name) {
    const orderUrl = `${process.env.CLIENT_URL}/orders/${order._id}`;
    
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f8f9fa; }
          .order-details { background: white; padding: 20px; border-radius: 4px; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #2c3e50; color: white; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .total-row { font-weight: bold; background: #f8f9fa; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
          </div>
          <div class="content">
            <h2>Hello ${name || 'there'}!</h2>
            <p>Thank you for your order! Your order has been confirmed.</p>
            
            <div class="order-details">
              <h3>Order #${order.orderNumber}</h3>
              <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              
              <h4>Order Items</h4>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr class="total-row">
                    <td colspan="3" style="text-align: right;">Subtotal:</td>
                    <td style="text-align: right;">$${order.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="3" style="text-align: right;">Tax:</td>
                    <td style="text-align: right;">$${order.tax.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="3" style="text-align: right;">Shipping:</td>
                    <td style="text-align: right;">$${order.shippingCost.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="3" style="text-align: right; font-size: 18px;">Total:</td>
                    <td style="text-align: right; font-size: 18px;">$${order.totalAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${orderUrl}" style="display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 4px;">View Order Details</a>
            </div>
            
            <p>You can track your order status by logging into your account.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ShopVerse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Order Confirmation - ShopVerse
      
      Hello ${name || 'there'}!
      
      Thank you for your order! Your order has been confirmed.
      
      Order #${order.orderNumber}
      Date: ${new Date(order.createdAt).toLocaleDateString()}
      Status: ${order.status}
      
      Order Items:
      ${order.items.map(item => `${item.name} x${item.quantity} - $${item.total.toFixed(2)}`).join('\n')}
      
      Subtotal: $${order.subtotal.toFixed(2)}
      Tax: $${order.tax.toFixed(2)}
      Shipping: $${order.shippingCost.toFixed(2)}
      Total: $${order.totalAmount.toFixed(2)}
      
      View your order: ${orderUrl}
      
      You can track your order status by logging into your account.
      
      © ${new Date().getFullYear()} ShopVerse. All rights reserved.
    `;

    return this.sendEmail({
      to: email,
      subject: `Order Confirmation #${order.orderNumber} - ShopVerse`,
      html,
      text
    });
  }

  async sendOrderStatusUpdate(email, order, name) {
    const orderUrl = `${process.env.CLIENT_URL}/orders/${order._id}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3498db; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f8f9fa; }
          .status-box { background: white; padding: 20px; border-radius: 4px; margin: 20px 0; text-align: center; }
          .status { font-size: 24px; font-weight: bold; color: #3498db; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Status Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${name || 'there'}!</h2>
            <p>Your order #${order.orderNumber} has been updated.</p>
            
            <div class="status-box">
              <p>Current Status:</p>
              <div class="status">${order.status.toUpperCase()}</div>
              ${order.status === 'shipped' ? `
                <p><strong>Tracking Number:</strong> ${order.shipping.trackingNumber || 'Not available'}</p>
                <p><strong>Carrier:</strong> ${order.shipping.carrier || 'Not available'}</p>
              ` : ''}
              ${order.status === 'delivered' ? `
                <p><strong>Delivered on:</strong> ${new Date(order.shipping.deliveredDate).toLocaleDateString()}</p>
              ` : ''}
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${orderUrl}" style="display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 4px;">Track Order</a>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ShopVerse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Order Status Update - ShopVerse
      
      Hello ${name || 'there'}!
      
      Your order #${order.orderNumber} has been updated.
      
      Current Status: ${order.status.toUpperCase()}
      ${order.status === 'shipped' ? `Tracking Number: ${order.shipping.trackingNumber || 'Not available'}\nCarrier: ${order.shipping.carrier || 'Not available'}` : ''}
      ${order.status === 'delivered' ? `Delivered on: ${new Date(order.shipping.deliveredDate).toLocaleDateString()}` : ''}
      
      Track your order: ${orderUrl}
      
      © ${new Date().getFullYear()} ShopVerse. All rights reserved.
    `;

    return this.sendEmail({
      to: email,
      subject: `Order Status Update #${order.orderNumber} - ShopVerse`,
      html,
      text
    });
  }

  async sendWelcomeEmail(email, name) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f8f9fa; }
          .button { display: inline-block; padding: 12px 24px; background: #27ae60; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ShopVerse!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name || 'there'}!</h2>
            <p>Welcome to ShopVerse! We're thrilled to have you join our community.</p>
            <p>Here are some things you can do:</p>
            <ul>
              <li>Browse thousands of products</li>
              <li>Save your favorite items</li>
              <li>Track your orders in real-time</li>
              <li>Get personalized recommendations</li>
            </ul>
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL}" class="button">Start Shopping</a>
            </div>
            <p>If you have any questions, our support team is here to help!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ShopVerse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to ShopVerse!
      
      Hello ${name || 'there'}!
      
      Welcome to ShopVerse! We're thrilled to have you join our community.
      
      Here are some things you can do:
      - Browse thousands of products
      - Save your favorite items
      - Track your orders in real-time
      - Get personalized recommendations
      
      Start shopping: ${process.env.CLIENT_URL}
      
      If you have any questions, our support team is here to help!
      
      © ${new Date().getFullYear()} ShopVerse. All rights reserved.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to ShopVerse! 🎉',
      html,
      text
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      retryCount: this.retryCount
    };
  }
}

const emailService = new EmailService();
module.exports = { emailService, EmailService };