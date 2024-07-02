require('dotenv').config();
const mailjet = require('node-mailjet').apiConnect(process.env.MAILJET_API_KEY, process.env.MAILJET_SECRET_KEY);

const sendInvoiceEmail = async (invoiceDetails) => {
  const request = mailjet
    .post('send', { version: 'v3.1' })
    .request({
      Messages: [
        {
          From: {
            Email: 'invoicinator3000@gmail.com',  
            Name: invoiceDetails.companyName,  
          },
          To: [
            {
              Email: invoiceDetails.clientEmail,
              Name: invoiceDetails.clientName,
            },
          ],
          Subject: `Invoice ${invoiceDetails.invoiceNumber} from ${invoiceDetails.companyName}`,
          TextPart: `Dear ${invoiceDetails.clientName}, here are the details of your invoice: ${invoiceDetails.invoiceDetails}. The total amount due is $${invoiceDetails.invoiceAmount}.`,
          HTMLPart: `
            <div style="font-family: Arial, sans-serif; color: #333;">
            <img src="${invoiceDetails.profilePicture}" alt="Company Logo" style="width: 150px; height: 150px; margin-bottom: 20px;">
              <h3 style="color: #0000;">Invoice ${invoiceDetails.invoiceNumber}</h3>
              <p>Dear ${invoiceDetails.clientName},</p>
              <p>Here are the details of your invoice:</p>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px;">${invoiceDetails.invoice_details}</td>
                </tr>
              </table>
              <p><strong>Total Amount Due:</strong> $${invoiceDetails.invoiceAmount}</p>
              <p><strong>Due Date:</strong> ${invoiceDetails.dueDate}</p>
              <p>Thank you for your business!</p>
              <p style="margin-top: 20px; font-size: 12px; color: #555;">
                If you have any questions about this invoice, please contact us at ${invoiceDetails.companyEmail}.
              </p>
            </div>
          `,
        },
      ],
    });

  try {
    const result = await request;
    console.log(result.body);
  } catch (err) {
    console.error('Error sending email:', err.statusCode, err.message);
  }
};

module.exports = sendInvoiceEmail;

