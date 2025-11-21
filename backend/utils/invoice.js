// backend/utils/invoice.js
const PDFDocument = require('pdfkit');

function buildInvoice(doc, order) {
  // --- HEADER ---
  doc
    .fillColor('#1e293b')
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('BookShop.', 50, 50)
    .fontSize(10)
    .font('Helvetica')
    .text('123 Bookstore Lane', 50, 80)
    .text('Knowledge City, 560001', 50, 95)
    .text('support@bookshop.local', 50, 110);

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
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 140).lineTo(550, 140).stroke();

  // --- BILL TO / SHIP TO ---
  doc
    .moveDown()
    .fillColor('#000000')
    .font('Helvetica-Bold')
    .text('Bill To:', 50, 160)
    .font('Helvetica')
    .text(order.userIdName, 50, 175)
    .text(order.userEmail, 50, 190)
    
    .font('Helvetica-Bold')
    .text('Ship To:', 300, 160)
    .font('Helvetica')
    .text(order.shippingAddress, 300, 175, { width: 250 });

  // --- TABLE HEADER ---
  const tableTop = 250;
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
    .text('Thank you for shopping with us.', 50, 700, { align: 'center', width: 500 });
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