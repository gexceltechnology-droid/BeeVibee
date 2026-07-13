import nodemailer from 'nodemailer';

interface SendMailParams {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  packageName: string;
  addOns: string[];
  totalPrice: number;
  guestCount: number;
  specialRequests?: string;
}

export async function sendBookingConfirmationEmail(params: SendMailParams) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true'; // true for port 465
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"Bee Vibe" <bookings@beevibe.org>';

  const formattedAddons = params.addOns.length > 0 ? params.addOns.join(', ') : 'None';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Bee Vibe Booking Confirmed</title>
        <style>
          body {
            font-family: 'Outfit', -apple-system, sans-serif;
            background-color: #0a0a0c;
            color: #ffffff;
            margin: 0;
            padding: 24px;
          }
          .card {
            background-color: #121217;
            border: 1px solid #f2a900;
            border-radius: 12px;
            padding: 32px;
            max-width: 500px;
            margin: 0 auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed rgba(242, 169, 0, 0.3);
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            color: #f2a900;
            text-shadow: 0 0 15px rgba(242, 169, 0, 0.4);
          }
          .title {
            font-size: 11px;
            color: #a0a0b0;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-top: 4px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 16px;
          }
          .label {
            color: #a0a0b0;
            font-size: 11px;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .val {
            font-weight: bold;
            color: #ffffff;
            font-size: 14px;
          }
          .accent-val {
            color: #f2a900;
            font-size: 16px;
            font-weight: 800;
          }
          .highlight-box {
            background: rgba(242, 169, 0, 0.08);
            border: 1px dashed rgba(242, 169, 0, 0.35);
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            font-size: 13px;
            color: #f2a900;
            font-weight: 600;
            line-height: 1.5;
            text-align: center;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            color: #626272;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 20px;
            margin-top: 24px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">🐝 BEE VIBE</div>
            <div class="title">Booking Confirmation Ticket</div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding-bottom: 16px;">
                <div class="label">Ticket Code</div>
                <div class="val" style="color: #f2a900; font-size: 18px; font-weight: 800;">${params.id}</div>
              </td>
              <td style="padding-bottom: 16px; text-align: right;">
                <div class="label">Status</div>
                <div class="val" style="color: #10b981; font-weight: 800;">CONFIRMED</div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 16px; width: 50%;">
                <div class="label">Guest Name</div>
                <div class="val">${params.customerName}</div>
              </td>
              <td style="padding-bottom: 16px; width: 50%; text-align: right;">
                <div class="label">Guests Count</div>
                <div class="val">${params.guestCount} People</div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 16px;">
                <div class="label">Date</div>
                <div class="val">${params.date}</div>
              </td>
              <td style="padding-bottom: 16px; text-align: right;">
                <div class="label">Show Time</div>
                <div class="val">${params.timeSlot}</div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 16px;">
                <div class="label">Theme Package</div>
                <div class="val">${params.packageName}</div>
              </td>
              <td style="padding-bottom: 16px; text-align: right;">
                <div class="label">Total Price</div>
                <div class="val accent-val">₹${params.totalPrice}</div>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-bottom: 16px;">
                <div class="label">Add-ons Selected</div>
                <div class="val" style="color: #d0d0e0; font-size: 13px; font-weight: 500;">${formattedAddons}</div>
              </td>
            </tr>
          </table>

          <div class="highlight-box">
            👉 Please download the ticket receipt from the website or present this email at the Bee Vibe reception desk upon arrival!
          </div>

          <div class="footer">
            Thank you for choosing Bee Vibe Mini Private Theater!<br>
            <strong>Call</strong>: +91 81235 01013<br>
            <strong>Location</strong>: 1340, 41st cross road, near jain university 4th grade, jayanagar 9th block, bangalore, India
          </div>
        </div>
      </body>
    </html>
  `;

  // If environment variables are missing, log confirmation code mock email to console and exit gracefully.
  if (!host || !user || !pass) {
    console.log(`\n==================================================`);
    console.log(`[MOCK EMAIL SENT] SMTP configuration missing in environment variables.`);
    console.log(`To: ${params.email}`);
    console.log(`Subject: Bee Vibe Booking Confirmation - ${params.id}`);
    console.log(`Ticket Code: ${params.id}`);
    console.log(`==================================================\n`);
    return;
  }

  // Create Node Mailer transporter
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  // Send mail
  await transporter.sendMail({
    from,
    to: params.email,
    subject: `Your Bee Vibe Booking Confirmation Ticket [Code: ${params.id}]`,
    html: htmlContent,
  });

  console.log(`[EMAIL] Booking confirmation email successfully sent to ${params.email}`);
}
