import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@rfqplatform.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Notify an RFQ buyer that a new quote has been submitted on their RFQ.
 */
export async function sendQuoteSubmittedEmail(params: {
  buyerEmail: string;
  buyerName: string;
  rfqNumber: string;
  rfqProjectName: string;
  rfqId: number;
  supplierCompanyName: string;
  price: number;
  currency: string;
}): Promise<void> {
  const {
    buyerEmail,
    buyerName,
    rfqNumber,
    rfqProjectName,
    rfqId,
    supplierCompanyName,
    price,
    currency,
  } = params;

  const rfqUrl = `${FRONTEND_URL}/rfqs/${rfqId}`;
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    .header { background: #4f46e5; color: #fff; padding: 28px 32px; }
    .header h1 { margin: 0; font-size: 22px; }
    .body { padding: 32px; color: #374151; }
    .body p { line-height: 1.6; margin: 0 0 16px; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px 20px; margin: 20px 0; }
    .info-box table { width: 100%; border-collapse: collapse; }
    .info-box td { padding: 6px 0; font-size: 14px; }
    .info-box td:first-child { color: #6b7280; width: 140px; }
    .info-box td:last-child { font-weight: 600; color: #111827; }
    .btn { display: inline-block; background: #4f46e5; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; margin-top: 8px; }
    .footer { padding: 20px 32px; background: #f9fafb; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Quote Received</h1>
    </div>
    <div class="body">
      <p>Hi ${buyerName || 'there'},</p>
      <p>A new quote has been submitted for your RFQ. Here are the details:</p>
      <div class="info-box">
        <table>
          <tr><td>RFQ Number</td><td>${rfqNumber}</td></tr>
          <tr><td>Project</td><td>${rfqProjectName}</td></tr>
          <tr><td>Supplier</td><td>${supplierCompanyName}</td></tr>
          <tr><td>Price</td><td>${formattedPrice}</td></tr>
        </table>
      </div>
      <p>Log in to review the full quote, compare bids, and take action.</p>
      <a href="${rfqUrl}" class="btn">View RFQ &amp; Quotes</a>
    </div>
    <div class="footer">
      RFQ Platform &bull; This is an automated notification.
    </div>
  </div>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: `"RFQ Platform" <${FROM}>`,
    to: buyerEmail,
    subject: `New quote received for ${rfqNumber} – ${rfqProjectName}`,
    html,
  });
}
