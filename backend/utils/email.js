const nodemailer = require('nodemailer');

let transporter = null;

async function createTransporter() {
  if (transporter) return transporter;
  const testAccount = await nodemailer.createTestAccount();
  
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  
  console.log("📧 Mail Transporter Ready (Ethereal)");
  return transporter;
}

// --- UPDATED: Added subtotal and discount support ---
function getEmailTemplate({ title, message, orderId, items, subtotal, discount, total, status }) {
  const itemsHtml = items ? items.map(it => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${it.title}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">x${it.qty}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">₹${it.price * it.qty}</td>
    </tr>
  `).join('') : '';

  // Helper to format currency safely
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
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="http://localhost:5173/my-orders" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Your Order</a>
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} BookShop. All rights reserved.
      </div>
    </div>
  `;
}

async function sendEmail({ to, subject, html, attachments = [] }) {
  try {
    const transport = await createTransporter();
    const info = await transport.sendMail({
      from: '"BookShop" <no-reply@bookshop.local>',
      to,
      subject,
      html,
      attachments // Pass attachments to nodemailer
    });
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    return info;
  } catch (err) {
    console.error("Email error:", err);
    return null;
  }
}

module.exports = { sendEmail, getEmailTemplate };