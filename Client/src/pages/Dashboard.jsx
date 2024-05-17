import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import './dashboard.css';
import Sidebar from '../components/sidebar/sidebar';
import jwtDecode from 'jwt-decode';
import { GET_USER, GET_INVOICES_BY_NUMBER } from '../utils/queries';
import { UPDATE_INVOICE } from '../utils/mutations';
import InvoiceModal from '../components/invoice-modal/invoice-modal'; // Import the InvoiceModal component

const Home = () => {
  const token = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.data._id;

  const { loading: userLoading, error: userError, data: userData } = useQuery(GET_USER, {
    variables: { userId: userId || '' },

  });


  const [markAsPaidMutation] = useMutation(UPDATE_INVOICE);
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false); 
  const [searchError, setSearchError] = useState(null); 
  const [selectedInvoice, setSelectedInvoice] = useState(null); // Add state for selected invoice
  const [isModalOpen, setIsModalOpen] = useState(false); // Add state for modal visibility

  const handleSearch = async () => {
    try {
      setSearchLoading(true);
      setSearchError(null);

      // Filter invoices based on the searchInvoiceNumber
      const filteredInvoices = userData?.getUser?.invoices.filter(
        invoice => invoice.invoiceNumber.includes(searchInvoiceNumber)
      ) || [];

      setSearchResult(filteredInvoices);
      return filteredInvoices; 
    } catch (error) {
      setSearchError(error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleInvoiceClick = (invoice) => {
    console.log('Paid Status:', invoice.paidStatus);
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedInvoice(null);
    setIsModalOpen(false);
  };

  if (userLoading) return <p>Loading user data...</p>;
  if (userError) return <p>Error loading user data: {userError.message}</p>;

  const user = userData?.getUser;
  const invoicesDue = user?.invoices.filter(invoice => !invoice.paidStatus) || [];
  const invoicesPaid = user?.invoices.filter(invoice => invoice.paidStatus) || [];

  const markAsPaid = (invoiceId) => {
    markAsPaidMutation({
      variables: {
        id: invoiceId,
        paidStatus: true,
      },
      update: (cache, { data: { updateInvoice } }) => {
        
      },
    });
  };

  const filteredInvoicesDue = searchInvoiceNumber
    ? invoicesDue.filter(invoice => invoice.invoiceNumber.includes(searchInvoiceNumber))
    : invoicesDue;

  return (
    <>
      <div className="app">
        <Sidebar />
        <div className="main-content">
          {/* Your main content goes here */}
        </div>
      </div>

      <div className='search-bar-div'>
        <h2>Search Invoices</h2>
        <input className='search-bar-input'
          type="text"
          value={searchInvoiceNumber}
          onChange={(e) => setSearchInvoiceNumber(e.target.value)}
          placeholder="Search by Invoice Number"
        />
        <div className='search-button-div'>
          <button onClick={handleSearch}>Search</button> 
        </div>
      </div>

      {searchLoading ? (
        <p>Loading search results...</p>
      ) : searchError ? (
        <p>Error: {searchError.message}</p>
      ) : searchResult.length === 0 ? (
        <p>No invoices found.</p>
      ) : (
        <div className='search-results'>
          <h3>Search Results</h3>
          <ul>
            {searchResult.map(invoice => (
              <li key={invoice._id} onClick={() => handleInvoiceClick(invoice)}>
                <div className='due-date-container'>
                  <p className='invoice-number'>Invoice Number: {invoice.invoiceNumber}</p>
                  <p className='due-date'> Due Date: {new Date(parseInt(invoice.dueDate)).toLocaleDateString()} </p>
                </div>
                <div className='invoice-info'>
                  <p>Client: {invoice.clientName}</p>
                  <p>Amount: ${parseFloat(invoice.invoiceAmount.toString()).toFixed(2)}</p>
                </div>
                <div className='mark-button'>
                  {!invoice.paidStatus && <button onClick={() => markAsPaid(invoice._id)}>Mark as Paid</button>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="total">
        <div className="row">
          <h2>Invoices Due</h2>
          {filteredInvoicesDue.length === 0 ? (
            <p>No invoices due.</p>
          ) : (
            <ul>
              {filteredInvoicesDue.map(invoice => (
                <li key={invoice._id} onClick={() => handleInvoiceClick(invoice)}>
                  <div className='due-date-container'>
                    <p className='invoice-number'>Invoice Number: {invoice.invoiceNumber}</p>
                    <p className='due-date'> Due Date: {new Date(parseInt(invoice.dueDate)).toLocaleDateString()} </p>
                  </div>
                  <div className='invoice-info'>
                    <p>Client: {invoice.clientName}</p>
                    <p>Amount: ${parseFloat(invoice.invoiceAmount.toString()).toFixed(2)}</p>
                    <p>Paid Status: {invoice.paidStatus ? 'Paid' : 'Not Paid'}</p>
                  </div>
                  <div className='mark-button'>
                    {!invoice.paidStatus && (
                      <button onClick={() => markAsPaid(invoice._id)}>Mark as Paid</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="row">
          <h2>Invoices Paid</h2>
          {invoicesPaid.length === 0 ? (
            <p>No paid invoices.</p>
          ) : (
            <ul>
              {invoicesPaid.map(invoice => (
                <li key={invoice._id} onClick={() => handleInvoiceClick(invoice)}>
                  <div className='invoice-info'>
                    <p className='invoice-number'>Invoice Number: {invoice.invoiceNumber}</p>
                    <p>Client: {invoice.clientName}</p>
                    <p>Amount: ${parseFloat(invoice.invoiceAmount.toString()).toFixed(2)}</p>
                    <p>Paid Status: Paid</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {isModalOpen && (
        <InvoiceModal invoice={selectedInvoice} onClose={closeModal} />
      )}
    </>
  );
};

export default Home;
