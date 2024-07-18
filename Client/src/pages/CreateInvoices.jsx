import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import jwtDecode from 'jwt-decode';
import Sidebar from '../components/sidebar/sidebar';
import { addInvoiceToIndexedDB, getUserData, addOfflineMutation } from '../utils/indexedDB';
import MessageModal from '../components/message-modal/message-modal';
import { CREATE_INVOICE } from '../utils/mutations';
import { v4 as uuidv4 } from 'uuid'; 
import './CreateInvoices.css';

const CreateInvoices = () => {
  const [userData, setUserData] = useState(null);
  const [email, setEmail] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [invoiceDetails, setInvoiceDetails] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [paidStatus, setPaidStatus] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [savedLocally, setSavedLocally] = useState(false);

  const token = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.data._id;

  const [createInvoiceMutation] = useMutation(CREATE_INVOICE);

  useEffect(() => {
    const fetchUserDataFromIndexedDB = async () => {
      const localUserData = await getUserData();
      if (localUserData) {
        const { email, streetAddress, city, state, zip, profilePicture } = localUserData;
        console.log('fetch for create:', profilePicture)
        setEmail(email);
        setStreetAddress(streetAddress);
        setCity(city);
        setState(state);
        setZip(zip);
        setProfilePicture(profilePicture);
        setUserData(localUserData);
      }
    };

    fetchUserDataFromIndexedDB();
  }, []);

  const name = `${userData?.company || ''} ${userData?.lastName || ''}`;

  const user = {
    email: email,
    name: name,
    streetAddress: streetAddress,
    city: city + (state ? `, ${state}` : '') + (zip ? ` ${zip}` : ''),
    profilePicture: profilePicture,
  };
console.log (profilePicture)
const handleFormSubmit = async (event) => {
  event.preventDefault();

  const invoiceAmountFloat = parseFloat(invoiceAmount);
  const dueDateISO = new Date(dueDate).toISOString();

  const variables = {
    invoiceAmount: invoiceAmountFloat,
    paidStatus: paidStatus,
    invoiceNumber: invoiceNumber,
    companyName: user.name,
    companyStreetAddress: user.streetAddress,
    companyCityAddress: user.city,
    companyEmail: user.email,
    clientName: clientName,
    clientStreetAddress: clientAddress,
    clientCityAddress: clientCity,
    clientEmail: clientEmail,
    dueDate: dueDateISO,
    userID: userId,
    invoice_details: invoiceDetails,
    profilePicture: profilePicture,
  };

  console.log('Profile Picture:', profilePicture);
  console.log('Variables for mutation:', variables);

  try {
    if (navigator.onLine) {
      console.log('Online - attempting to create invoice...');
      const { data } = await createInvoiceMutation({ variables });
      if (data?.createInvoice) {
        const createdInvoice = data.createInvoice;
        console.log('Invoice created successfully:', createdInvoice);
        await addInvoiceToIndexedDB(createdInvoice);
        console.log('Invoice added to IndexedDB.');
      } else {
        throw new Error('No invoice data returned from mutation.');
      }
    } else {
      console.log('Offline - saving invoice locally...');
      variables._id = uuidv4();
      await addInvoiceToIndexedDB(variables);
      console.log('Invoice saved locally in IndexedDB.');
      await addOfflineMutation({ mutation: 'CREATE_INVOICE', variables });
      console.log('Offline mutation recorded.');
    }

    // Reset form fields and state
    setSavedLocally(true);
    setInvoiceAmount('');
    setPaidStatus(false);
    setInvoiceNumber('');
    setClientEmail('');
    setClientName('');
    setClientAddress('');
    setClientCity('');
    setInvoiceDetails('');
    setDueDate('');
  } catch (error) {
    console.error('Error saving invoice:', error.message || error);
    alert(`Error: ${error.message || error}`);
  }
};

  return (
    <>
      <div className="app">
        <Sidebar />
        <div className="center-content">
          <div className="container center-content bg-app-grey" id="main-create-container">
            <form className="form" onSubmit={handleFormSubmit}>
              <div className='spacing'></div>
              <div className='heading-invoices'>
                <div className='heading-title'>
                  <h3 className='invoice-h3'>Create Invoice</h3>
                  <div className='back-link'>
                    <a href="/dashboard">← to Dashboard</a>
                  </div>
                  <div className='save-message'>
                    {savedLocally && <h5 className="saved-locally"> *Invoice Saved* </h5>}
                  </div>
                </div>
              </div>
              <div className='line'></div>
              <div className='section1'>
                <div className='split'>
                  <div>
                  {navigator.onLine && profilePicture && <img src={profilePicture} className='profile-picture1' alt="Profile" />}
                  </div>
                </div>
                <div className='split2'>
                  <div className='input'>
                    <label className="label font-casmono" htmlFor="invoice-num">Invoice#:</label>
                    <input type="text" placeholder="1234ABCD" id="invoice-num" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} maxLength="8" required />
                  </div>
                  <div className='input'>
                    <label className="label font-casmono" htmlFor="payment-due">Payment Due:</label>
                    <input type="date" id="payment-due" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
                  </div>
                  <div className='input'>
                    <label className="label font-casmono" htmlFor="amount-due">Amount Due:</label>
                    <input type="text" placeholder="$00.00" id="amount-due" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} required />
                  </div>
                </div>
              </div>
              <div className='user-client'>
                <div id="invoice-user-container">
                  <label className="label font-casmono" htmlFor="user-email">User:</label>
                  <div>
                    <input type="email" placeholder="Your Email" id="user-email" value={user.email} readOnly />
                  </div>
                  <div>
                    <label className="label-item" htmlFor="company-name"></label>
                    <input type="text" placeholder="Your Name/Company" id="company-name" value={user.name} readOnly />
                  </div>
                  <div>
                    <label className="label-item" htmlFor="user-address"></label>
                    <input type="text" placeholder="Address" id="user-address" value={user.streetAddress} readOnly />
                  </div>
                  <div>
                    <label className="label-item" htmlFor="user-city"></label>
                    <input type="text" placeholder="City, State, Zip" id="user-city" value={user.city} readOnly />
                  </div>
                </div>
                <div id="invoice-client-container">
                  <label className="label font-casmono" htmlFor="client-email">Client:</label>
                  <div>
                    <input type="email" placeholder="Client Email" id="client-email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label-item-right" htmlFor="client-name"></label>
                    <input type="text" placeholder="Client Name/Company" id="client-name" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label-item-right" htmlFor="client-address"></label>
                    <input type="text" placeholder="Billing Address" id="client-address" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label-item-right" htmlFor="client-city"></label>
                    <input type="text" placeholder="City, State, Zip" id="client-city" value={clientCity} onChange={(e) => setClientCity(e.target.value)} required />
                  </div>
                </div>
              </div>
              <div className="invoice-bottom">
                <label className="label-item font-casmono" htmlFor="invoice-details">Invoice&nbsp; Details:</label>
                <div id="details-container">
                  <textarea className='details' type="text" placeholder="Details of work provided" id="invoice-details" value={invoiceDetails} onChange={(e) => setInvoiceDetails(e.target.value)}></textarea>
                </div>
                <div className='invoice-button'>
                  <button type="submit" id="send-invoice-button">Save Invoice</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {savedLocally && (
        <MessageModal
          message="Invoice Saved Locally."
          onClose={() => setSavedLocally(false)}
        />
      )}
    </>
  );
};

export default CreateInvoices;
