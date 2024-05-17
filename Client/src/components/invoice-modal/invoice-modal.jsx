import React from 'react';
import './invoice-modal.css'; // Create and import CSS for styling the modal

const InvoiceModal = ({ invoice, onClose }) => {
  if (!invoice) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>X</button>
         <div className='spacing'>
          {/* empty space for spacing */}
         </div>
         {/* Row 1 */}
         <div className='row-modal spacing-small'>
           <p><strong>Invoice Number:</strong> {invoice.invoiceNumber}</p>
           <p className='small-font'><strong>Date Created:</strong> {new Date(parseInt(invoice.dateCreated)).toLocaleDateString()}</p>
         </div>
         {/* Row 2 */}
         <div className='row-modal  spacing-small'>
           <p className='small-font' ><strong>Client:</strong> {invoice.clientName}</p>
           <p><strong>Due Date:</strong> {new Date(parseInt(invoice.dueDate)).toLocaleDateString()}</p>
         </div>
         {/* row 3 */}
         <div className='row-modal'>
            <p className='small-font' >{invoice.clientStreetAddress}</p>
         </div>
         {/* row 4 */}
         <div className='row-modal  spacing-small'>
         <p className='small-font' >{invoice.clientCityAddress}</p>
         </div>
         {/* modal */}
         <div className='details-modal' >
           <div className='heading-modal' >
             <h3>Description</h3>
           </div>
             <p> {invoice.invoice_details}</p>
         </div>
         {/* row 5 */}
         <div className='row-modal '>
            <p >Email:</p>
            <p className='small-font'><strong>Paid Status:</strong> {invoice.paidStatus ? 'Paid' : 'Not Paid'}</p>
         </div>
         {/* row 6 */}
         <div className='row-modal '>
            <p className='small-font' >{invoice.clientEmail}</p>
            <p><strong>Amount:</strong> ${parseFloat(invoice.invoiceAmount.toString()).toFixed(2)}</p>
          </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
