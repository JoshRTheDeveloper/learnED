import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import './dashboard.css';
import Sidebar from '../components/sidebar/sidebar';
import jwtDecode from 'jwt-decode';
import InvoiceModal from '../components/invoice-modal/invoice-modal';
import MessageModal from '../components/message-modal/message-modal';
import {
  getInvoicesFromIndexedDB,
  addInvoiceToIndexedDB,
  deleteInvoiceByNumberFromIndexedDB,
  updateInvoiceInIndexedDB,
  addOfflineMutation,
} from '../utils/indexedDB';
import { GET_USER, GET_INVOICE } from '../utils/queries';
import { UPDATE_INVOICE, DELETE_INVOICE } from '../utils/mutations';

const Home = () => {
  const token = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.data._id;

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const { data, error, loading: queryLoading, refetch } = useQuery(GET_USER, {
    variables: { id: userId },
    onCompleted: async (data) => {
      if (data && data.user) {
        setUserData(data.user);

        if (data.user.invoices) {
          for (const invoice of data.user.invoices) {
            await addInvoiceToIndexedDB(invoice);
          }
        }
      }
      setLoading(false);
    },
    onError: async () => {
      const storedInvoices = await getInvoicesFromIndexedDB();
      if (storedInvoices) {
        setUserData({ invoices: storedInvoices });
      }
      setLoading(false);
    },
  });

  const handleSearch = () => {
    setSearchLoading(true);
    setSearchError(null);

    try {
      const filteredInvoices = userData?.invoices.filter(
        invoice => invoice.invoiceNumber.includes(searchInvoiceNumber)
      ) || [];

      setSearchResult(filteredInvoices);
    } catch (error) {
      setSearchError(error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleInvoiceClick = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [deleteInvoice] = useMutation(DELETE_INVOICE);

  const handleDeleteInvoice = async (invoiceNumber) => {
    try {
      console.log(`Attempting to delete invoice with number: ${invoiceNumber}`);
  
      // Step 1: Delete invoice from IndexedDB
      await deleteInvoiceByNumberFromIndexedDB(invoiceNumber);
      console.log(`Successfully deleted invoice from IndexedDB: ${invoiceNumber}`);
  
  
      setUserData(prevUserData => ({
        ...prevUserData,
        invoices: prevUserData.invoices.filter(invoice => invoice.invoiceNumber !== invoiceNumber)
      }));
  
     
      const { data } = await deleteInvoice({
        variables: { invoiceNumber },
      });
      console.log(`Successfully deleted invoice from server:`, data);
  
      setModalMessage(`Invoice deleted`);
      setShowMessageModal(true);
  
    } catch (error) {
      console.error('Error deleting invoice:', error);
  
      await addOfflineMutation({
        
        mutation: 'DELETE_INVOICE', 
        variables: { invoiceNumber },
      });
  
      setModalMessage(`Invoice deletion added to offline queue.`);
      setShowMessageModal(true);
    }
  };

  const [markAsPaid] = useMutation(UPDATE_INVOICE, {
    onCompleted: async () => {
      try {
        await updateInvoiceInIndexedDB(selectedInvoice.invoiceNumber, true);
        setModalMessage(`Invoice with invoiceNumber ${selectedInvoice.invoiceNumber} marked as paid.`);
        setShowMessageModal(true);
      } catch (error) {
        console.error('Error updating invoice locally:', error);
      }
    },
    onError: (error) => {
      console.error('Error marking invoice as paid:', error);
    },
  });

  const handleMarkAsPaid = async (invoiceNumber) => {
    try {
      await markAsPaid({
        variables: { invoiceNumber, paidStatus: true },
      });
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      await addOfflineMutation({
        mutation: 'UPDATE_INVOICE',
        variables: { invoiceNumber, paidStatus: true },
      });
      setModalMessage(`Mark as paid added to offline queue.`);
      setShowMessageModal(true);
    }
  };

  if (loading || queryLoading) {
    return <p>Loading user data...</p>;
  }

  if (!userData || !userData.invoices) {
    return <p>No user data available.</p>;
  }

  const invoicesDue = userData?.invoices.filter(invoice => !invoice.paidStatus) || [];
  const invoicesPaid = userData?.invoices.filter(invoice => invoice.paidStatus) || [];
  const filteredInvoicesDue = searchInvoiceNumber
    ? invoicesDue.filter(invoice => invoice.invoiceNumber.includes(searchInvoiceNumber))
    : invoicesDue;

  return (
    <>
      <div className="app">
        <Sidebar />
        <div className="main-content">
          <div className='search-bar-div'>
            <h2>Search Invoices</h2>
            <input
              className='search-bar-input'
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
                  <li key={invoice._id}>
                    <div className='due-date-container'>
                      <p className='invoice-number'>Invoice Number: {invoice.invoiceNumber}</p>
                      <p className='due-date'> Due Date: {new Date(parseInt(invoice.dueDate)).toLocaleDateString()} </p>
                    </div>
                    <div className='invoice-info'>
                      <p>Client: {invoice.clientName}</p>
                      {invoice.invoiceAmount && (
                        <p>Amount: ${parseFloat(invoice.invoiceAmount.toString()).toFixed(2)}</p>
                      )}
                      <p>Paid Status: {invoice.paidStatus ? 'Paid' : 'Not Paid'}</p>
                    </div>
                    <div className='button-container'>
                      <button onClick={() => handleInvoiceClick(invoice)}>Info</button>
                      <button onClick={() => handleDeleteInvoice(invoice.invoiceNumber)}>Delete</button>
                      {!invoice.paidStatus && (
                        <button onClick={() => handleMarkAsPaid(invoice.invoiceNumber)}>Mark as Paid</button>
                      )}
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
                    <li key={invoice._id}>
                      <div className='due-date-container'>
                        <p className='invoice-number'>Invoice Number: {invoice.invoiceNumber}</p>
                        <p className='due-date'> Due Date: {new Date(parseInt(invoice.dueDate)).toLocaleDateString()} </p>
                      </div>
                      <div className='invoice-info'>
                        <p>Client: {invoice.clientName}</p>
                        {invoice.invoiceAmount && (
                          <p>Amount: ${parseFloat(invoice.invoiceAmount.toString()).toFixed(2)}</p>
                        )}
                        <p>Paid Status: {invoice.paidStatus ? 'Paid' : 'Not Paid'}</p>
                      </div>
                      <div className='button-container'>
                        <button onClick={() => handleInvoiceClick(invoice)}>Info</button>
                        <button onClick={() => handleDeleteInvoice(invoice.invoiceNumber)}>Delete</button>
                        {!invoice.paidStatus && (
                          <button onClick={() => handleMarkAsPaid(invoice.invoiceNumber)}>Mark as Paid</button>
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
                    <li key={invoice._id}>
                      <div className='due-date-container'>
                        <p className='invoice-number'>Invoice Number: {invoice.invoiceNumber}</p>
                        <p className='due-date'> Due Date: {new Date(parseInt(invoice.dueDate)).toLocaleDateString()} </p>
                      </div>
                      <div className='invoice-info'>
                        <p>Client: {invoice.clientName}</p>
                        {invoice.invoiceAmount && (
                          <p>Amount: ${parseFloat(invoice.invoiceAmount.toString()).toFixed(2)}</p>
                        )}
                        <p>Paid Status: {invoice.paidStatus ? 'Paid' : 'Not Paid'}</p>
                      </div>
                      <div className='button-container'>
                        <button onClick={() => handleInvoiceClick(invoice)}>Info</button>
                        <button onClick={() => handleDeleteInvoice(invoice.invoiceNumber)}>Delete</button>
                        {!invoice.paidStatus && (
                          <button onClick={() => handleMarkAsPaid(invoice.invoiceNumber)}>Mark as Paid</button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <InvoiceModal
          invoice={selectedInvoice}
          closeModal={closeModal}
          markAsPaid={handleMarkAsPaid}
        />
      )}

      {showMessageModal && (
        <MessageModal message={modalMessage} onClose={() => setShowMessageModal(false)} />
      )}
    </>
  );
};

export default Home;
