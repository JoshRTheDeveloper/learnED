import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import './dashboard.css';
import Sidebar from '../components/sidebar/sidebar';
import jwtDecode from 'jwt-decode';
import { GET_USER } from '../utils/queries';
import { UPDATE_INVOICE, DELETE_INVOICE } from '../utils/mutations';
import InvoiceModal from '../components/invoice-modal/invoice-modal';
import { addInvoiceToIndexedDB, getInvoicesFromIndexedDB, deleteInvoiceFromIndexedDB, clearIndexedDB } from '../utils/indexedDB';

const Home = () => {
  const token = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.data._id;

  // Query to fetch user data
  const { loading: userLoading, error: userError, data: userData, refetch } = useQuery(GET_USER, {
    variables: { userId: userId || '' },
    fetchPolicy: 'cache-first', // Retrieve data from cache first, then attempt network request
    onCompleted: async (data) => {
      // Clear IndexedDB and store invoices locally when user data is fetched
      await clearIndexedDB();
      await data.getUser.invoices.forEach(invoice => addInvoiceToIndexedDB(invoice));
    },
  });

  // Mutation to mark invoice as paid
  const [markAsPaidMutation] = useMutation(UPDATE_INVOICE);

  // Mutation to delete invoice
  const [deleteInvoiceMutation] = useMutation(DELETE_INVOICE);

  // State variables
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Effect to handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      refetch();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refetch]);

  // Function to handle search
  const handleSearch = async () => {
    try {
      setSearchLoading(true);
      setSearchError(null);

      const filteredInvoices = userData?.getUser?.invoices.filter(
        invoice => invoice.invoiceNumber.includes(searchInvoiceNumber)
      ) || [];

      setSearchResult(filteredInvoices);
    } catch (error) {
      setSearchError(error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Function to handle invoice click
  const handleInvoiceClick = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  // Function to close modal
  const closeModal = () => {
    setSelectedInvoice(null);
    setIsModalOpen(false);
  };

  // Function to handle deleting invoice
  const handleDeleteInvoice = async (invoiceId) => {
    try {
      const { data } = await deleteInvoiceMutation({
        variables: { id: invoiceId },
        update: (cache, { data: { deleteInvoice } }) => {
          if (!deleteInvoice.success) {
            console.error('Error deleting invoice:', deleteInvoice.message);
            return;
          }

          // Remove deleted invoice from cache and search results
          const existingUser = cache.readQuery({
            query: GET_USER,
            variables: { userId: userId || '' },
          });

          cache.writeQuery({
            query: GET_USER,
            data: {
              getUser: {
                ...existingUser.getUser,
                invoices: existingUser.getUser.invoices.filter(
                  (invoice) => invoice._id !== invoiceId
                ),
              },
            },
            variables: { userId: userId || '' },
          });

          setSearchResult(prevSearchResult => prevSearchResult.filter(invoice => invoice._id !== invoiceId));

          refetch();
        },
      });
      await deleteInvoiceFromIndexedDB(invoiceId);
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  if (userLoading) return <p>Loading user data...</p>;
  if (userError) return <p>Error loading user data: {userError.message}</p>;

  const user = userData?.getUser;
  const invoicesDue = user?.invoices.filter(invoice => !invoice.paidStatus) || [];
  const invoicesPaid = user?.invoices.filter(invoice => invoice.paidStatus) || [];

  // Filter invoices due based on search input
  const filteredInvoicesDue = searchInvoiceNumber
    ? invoicesDue.filter(invoice => invoice.invoiceNumber.includes(searchInvoiceNumber))
    : invoicesDue;

  return (
    <>
      <div className="app">
        <Sidebar />
        <div className="main-content"></div>
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
        <p>No results found.</p>
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
                  <p>Paid Status: {invoice.paidStatus ? 'Paid' : 'Not Paid'}</p>
                </div>
                <div className='mark-button'>
                <button onClick={() => handleInvoiceClick(invoice)}>Info</button>
                  {!invoice.paidStatus && (
                    <button onClick={(e) => { e.stopPropagation(); markAsPaid(invoice._id); }}>Mark as Paid</button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice._id); }}>Delete</button>
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
                <li key={invoice._id} >
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
                  <button onClick={() => handleInvoiceClick(invoice)}>Info</button>
                    {!invoice.paidStatus && (
                      <button onClick={(e) => { e.stopPropagation(); markAsPaid(invoice._id); }}>Mark as Paid</button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice._id); }}>Delete</button>
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
                  <div className='due-date-container'>
                    <p className='invoice-number'>Invoice Number: {invoice.invoiceNumber}</p>
                    <p className='due-date'> Due Date: {new Date(parseInt(invoice.dueDate)).toLocaleDateString()} </p>
                  </div>
                  <div className='invoice-info'>
                    <p>Client: {invoice.clientName}</p>
                    <p>Amount: ${parseFloat(invoice.invoiceAmount.toString()).toFixed(2)}</p>
                    <p>Paid Status: {invoice.paidStatus ? 'Paid' : 'Not Paid'}</p>
                  </div>
                  
                  <button onClick={() => handleInvoiceClick(invoice)}>Info</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice._id); }}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {isModalOpen && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={closeModal}
          onSave={(updatedInvoice) => {
            setSearchResult(prevSearchResult =>
              prevSearchResult.map(invoice =>
                invoice._id === updatedInvoice._id ? updatedInvoice : invoice
              )
            );
          }}
        />
      )}
    </>
  );
};

export default Home;
