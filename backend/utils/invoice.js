// backend/utils/invoice.js
const PDFDocument = require('pdfkit');
const path = require('path');

function buildInvoice(doc, order) {
  // --- HEADER WITH LOGO ---
  const logoPath = path.join(__dirname, '../assets/logo.png');
  
  // Try to render logo, fallback to text if missing
  try {
      doc.image(logoPath, 50, 45, { width: 100 });
  } catch (err) {
      doc
        .fillColor('#1e293b')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Readify', 50, 50);
  }

  // Company Details
  doc
    .fillColor('#1e293b')
    .fontSize(10)
    .font('Helvetica')
    .text('123 Knowledge Avenue', 50, 110)
    .text('Tech District, 560001', 50, 125)
    .text('bsms.bookshop.official@gmail.com', 50, 140);

  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('INVOICE', 50, 50, { align: 'right' })
    .fontSize(10)
    .text(`Invoice #: INV-${order._id.toString().slice(-6).toUpperCase()}`, 50, 80, { align: 'right' })
    .text(`Order #: ${order._id}`, 50, 95, { align: 'right' })
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 110, { align: 'right' });

  // --- LINE SEPARATOR ---
  doc.moveDown();
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 160).lineTo(550, 160).stroke();

  // --- BILL TO / SHIP TO ---
  doc
    .moveDown()
    .fillColor('#000000')
    .font('Helvetica-Bold')
    .text('Bill To:', 50, 180)
    .font('Helvetica')
    .text(order.userIdName, 50, 195)
    .text(order.userEmail, 50, 210)
    
    .font('Helvetica-Bold')
    .text('Ship To:', 300, 180)
    .font('Helvetica')
    .text(order.shippingAddress, 300, 195, { width: 250 });

  // --- TABLE HEADER ---
  const tableTop = 280;
  doc.font('Helvetica-Bold');
  generateTableRow(doc, tableTop, 'Item', 'Qty', 'Unit Price', 'Total');
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

  // --- TABLE ROWS ---
  doc.font('Helvetica');
  let i = 0;
  let position = 0;
  
  order.items.forEach((item) => {
    position = tableTop + 35 + (i * 25);
    generateTableRow(
      doc,
      position,
      item.title.length > 40 ? item.title.substring(0, 37) + "..." : item.title,
      item.qty,
      formatCurrency(item.price),
      formatCurrency(item.price * item.qty)
    );
    i++;
  });

  // --- SUMMARY ---
  const summaryTop = position + 40;
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, summaryTop).lineTo(550, summaryTop).stroke();
  
  doc.font('Helvetica-Bold');
  generateTableRow(doc, summaryTop + 15, '', '', 'Subtotal:', formatCurrency(order.subtotal));
  
  if (order.discount > 0) {
    doc.fillColor('#16a34a'); // Green for discount
    generateTableRow(doc, summaryTop + 35, '', '', 'Discount:', `-${formatCurrency(order.discount)}`);
    doc.fillColor('#000000'); // Reset
  }

  doc.fontSize(12).font('Helvetica-Bold');
  generateTableRow(doc, summaryTop + 60, '', '', 'Grand Total:', formatCurrency(order.totalAmount));

  // --- FOOTER ---
  doc
    .fontSize(10)
    .font('Helvetica')
    .text('Thank you for choosing Readify.', 50, 700, { align: 'center', width: 500 });
}

function generateTableRow(doc, y, item, qty, price, total) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(qty, 280, y, { width: 90, align: 'right' })
    .text(price, 370, y, { width: 90, align: 'right' })
    .text(total, 0, y, { align: 'right' });
}

function formatCurrency(amount) {
  return "Rs. " + Number(amount).toFixed(2);
}

// Generate Buffer (For Email Attachment)
function generateInvoiceBuffer(order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    buildInvoice(doc, order);
    doc.end();
  });
}

// Stream to Response (For Direct Download)
function streamInvoice(order, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);

  doc.pipe(res);
  buildInvoice(doc, order);
  doc.end();
}

module.exports = { generateInvoiceBuffer, streamInvoice };