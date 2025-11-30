// backend/services/emailService.js - Email Service with NodeMailer
const nodemailer = require('nodemailer');

// ============================================
// Create Email Transporter
// ============================================
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email credentials not configured. Using console logging instead.');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST, // e.g., 'smtp.gmail.com'
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Gmail address
      pass: process.env.EMAIL_PASS  // Gmail app password
    },
    tls: {
      rejectUnauthorized: false // For development
    }
  });
};

// ============================================
// Send Email Verification
// ============================================
const sendVerificationEmail = async (user, verificationToken) => {
  try {
    const transporter = createTransporter();

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;

    const mailOptions = {
      from: `"DroneNova Arena" <${process.env.EMAIL_USER || 'noreply@dronenova.com'}>`,
      to: user.email,
      subject: '🚁 Verify Your DroneNova Arena Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: linear-gradient(135deg,
                rgba(255, 153, 51, 0.1) 0%,
                rgba(255, 255, 255, 0.95) 50%,
                rgba(19, 136, 8, 0.1) 100%);
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(90deg, #FF9933 0%, #138808 100%);
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              color: white;
              margin: 0;
              font-size: 28px;
              text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            }
            .content {
              padding: 40px 30px;
              background: white;
            }
            .content h2 {
              color: #FF9933;
              margin-top: 0;
            }
            .verify-button {
              display: inline-block;
              padding: 15px 40px;
              background: linear-gradient(90deg, #FF9933 0%, #138808 100%);
              color: white;
              text-decoration: none;
              border-radius: 25px;
              font-weight: bold;
              font-size: 16px;
              margin: 20px 0;
              text-align: center;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
            }
            .verify-button:hover {
              opacity: 0.9;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 3px solid #FF9933;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ff9800;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚁 DroneNova Arena</h1>
            </div>

            <div class="content">
              <h2>Welcome, ${user.name}! 🎉</h2>

              <p>Thank you for registering with DroneNova Arena - India's premier drone combat tournament platform!</p>

              <p>To activate your account and start participating in tournaments, please verify your email address by clicking the button below:</p>

              <div style="text-align: center;">
                <a href="${verificationUrl}" class="verify-button">
                  ✅ Verify Email Address
                </a>
              </div>

              <p>Or copy and paste this link in your browser:</p>
              <p style="background: #f4f4f4; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
                ${verificationUrl}
              </p>

              <div class="warning">
                <strong>⚠️ Important:</strong> This verification link will expire in 24 hours.
              </div>

              <p style="margin-top: 30px;">Once verified, you'll be able to:</p>
              <ul>
                <li>✅ Register for upcoming tournaments</li>
                <li>✅ Create or join teams</li>
                <li>✅ View your match reports</li>
                <li>✅ Track your performance stats</li>
              </ul>

              <p>If you didn't create this account, please ignore this email.</p>

              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong style="color: #FF9933;">DroneNova Arena Team</strong> 🇮🇳
              </p>
            </div>

            <div class="footer">
              <p>© ${new Date().getFullYear()} DroneNova Arena. All rights reserved.</p>
              <p>🇮🇳 Made in India with ❤️</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    if (transporter) {
      // Send email
      await transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${user.email}`);
      return { success: true, message: 'Email sent successfully' };
    } else {
      // Development mode: Log to console
      console.log('\n📧 ===============================================');
      console.log('📧 EMAIL VERIFICATION (Development Mode)');
      console.log('📧 ===============================================');
      console.log(`📧 To: ${user.email}`);
      console.log(`📧 Subject: Verify Your DroneNova Arena Account`);
      console.log(`📧 Verification URL: ${verificationUrl}`);
      console.log('📧 ===============================================\n');
      return { success: true, message: 'Email logged to console (dev mode)' };
    }

  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return { success: false, message: error.message };
  }
};

// ============================================
// Send Welcome Email (after verification)
// ============================================
const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"DroneNova Arena" <${process.env.EMAIL_USER || 'noreply@dronenova.com'}>`,
      to: user.email,
      subject: '🎉 Welcome to DroneNova Arena!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(90deg, #FF9933 0%, #138808 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 40px 30px; }
            .content h2 { color: #FF9933; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 3px solid #FF9933; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚁 Welcome to DroneNova Arena!</h1>
            </div>
            <div class="content">
              <h2>Congratulations, ${user.name}! 🎊</h2>
              <p>Your email has been verified successfully!</p>
              <p>You can now access all features of DroneNova Arena:</p>
              <ul>
                <li>Browse and register for tournaments</li>
                <li>Create or join teams</li>
                <li>Compete in drone combat matches</li>
                <li>Receive detailed match reports</li>
                <li>Track your performance and rankings</li>
              </ul>
              <p>Ready to take flight? Visit our platform and explore upcoming tournaments!</p>
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong style="color: #FF9933;">DroneNova Arena Team</strong> 🇮🇳
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} DroneNova Arena. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    if (transporter) {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${user.email}`);
    } else {
      console.log(`📧 Welcome email (dev mode): ${user.email}`);
    }

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
  }
};

// ============================================
// Send Password Reset Email
// ============================================
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createTransporter();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"DroneNova Arena" <${process.env.EMAIL_USER || 'noreply@dronenova.com'}>`,
      to: user.email,
      subject: '🔒 Reset Your DroneNova Arena Password',
      html: `
        <p>Hi ${user.name},</p>
        <p>You requested a password reset for your DroneNova Arena account.</p>
        <p>Click the link below to reset your password (valid for 1 hour):</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>DroneNova Arena Team</p>
      `
    };

    if (transporter) {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${user.email}`);
    } else {
      console.log(`📧 Password reset URL (dev mode): ${resetUrl}`);
    }

  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
};
