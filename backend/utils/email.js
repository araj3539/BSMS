const nodemailer = require('nodemailer');

// --- 1. Create Transporter (Flexible Configuration) ---
async function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    console.log(`🔌 Connecting to ${host}:${port} for ${user}...`);
    
    return nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465, // True only for 465, false for 587/2525
      auth: { user, pass },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      },
      // Increase timeouts for cloud environments
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 30000,
      socketTimeout: 30000 
    });
  }

  // Safe Fallback (Mock Mode)
  console.log("⚠️ SMTP_USER/PASS not found. Email sending is SIMULATED.");
  return {
    sendMail: async (opts) => {
      console.log(`\n--- [MOCK EMAIL] ---\nTo: ${opts.to}\nSubject: ${opts.subject}\n--------------------\n`);
      return { messageId: 'mock-id', preview: 'simulated' };
    }
  };
}

// --- 2. HTML Template Generator (Unchanged) ---
function getEmailTemplate({ title, message, orderId, items, subtotal, discount, total, status }) {
  const itemsHtml = items ? items.map(it => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${it.title}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">x${it.qty}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">₹${Number(it.price * it.qty).toFixed(2)}</td>
    </tr>
  `).join('') : '';

  const formatMoney = (amount) => Number(amount).toFixed(2);

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1e293b; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-family: serif;">BookShop.</h1>
      </div>
      <div style="padding: 24px; background-color: #ffffff;">
        <h2 style="color: #333;">${title}</h2>
        <p style="color: #555; line-height: 1.6;">${message}</p>
        
        ${orderId ? `<div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0; text-align: center; font-weight: bold; color: #4f46e5;">Order #${orderId}</div>` : ''}
        ${status ? `<p><strong>Current Status:</strong> <span style="text-transform: uppercase; color: #059669;">${status}</span></p>` : ''}

        ${items ? `
          <h3 style="border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 24px;">Payment Summary</h3>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
            <thead>
              <tr style="background-color: #f8fafc; color: #64748b;">
                <th style="padding: 8px;">Item</th>
                <th style="padding: 8px;">Qty</th>
                <th style="padding: 8px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 12px 8px 4px; text-align: right; color: #64748b;">Subtotal:</td>
                <td style="padding: 12px 8px 4px; color: #333;">₹${formatMoney(subtotal)}</td>
              </tr>
              ${discount > 0 ? `
              <tr>
                <td colspan="2" style="padding: 4px 8px; text-align: right; color: #64748b;">Discount:</td>
                <td style="padding: 4px 8px; color: #16a34a;">-₹${formatMoney(discount)}</td>
              </tr>
              ` : ''}
              <tr>
                <td colspan="2" style="padding: 12px 8px; font-weight: bold; text-align: right; border-top: 1px solid #eee;">Total:</td>
                <td style="padding: 12px 8px; font-weight: bold; border-top: 1px solid #eee;">₹${formatMoney(total)}</td>
              </tr>
            </tfoot>
          </table>
        ` : ''}
      </div>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} BookShop. All rights reserved.
      </div>
    </div>
  `;
}

// --- 3. Send Email Function ---
async function sendEmail({ to, subject, html, attachments = [] }) {
  try {
    const transport = await createTransporter();
    
    // Verify connection first
    try {
        await transport.verify();
        console.log("✅ SMTP Connected successfully");
    } catch (verifyErr) {
        console.error("❌ SMTP Connection Failed:", verifyErr.message);
        return null;
    }

    const info = await transport.sendMail({
      from: `"BookShop" <${process.env.SMTP_USER || 'no-reply@bookshop.local'}>`,
      to,
      subject,
      html,
      attachments
    });
    console.log("📧 Message sent: %s", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Email error:", err.message);
    return null;
  }
}

module.exports = { sendEmail, getEmailTemplate };