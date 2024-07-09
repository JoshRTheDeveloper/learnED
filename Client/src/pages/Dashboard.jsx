import React, { useState, useEffect } from 'react';
import './dashboard.css';
import { useQuery, useMutation } from '@apollo/client';
import Sidebar from '../components/sidebar/sidebar';
import jwtDecode from 'jwt-decode';
import InvoiceModal from '../components/invoice-modal/invoice-modal';
import MessageModal from '../components/message-modal/message-modal';
import { GET_USER } from '../utils/queries';
import { DELETE_INVOICE } from '../utils/mutations';
import {
  deleteInvoiceByNumberFromIndexedDB,
  updateInvoiceInIndexedDB,
  addInvoiceToIndexedDB,
  getUserData
} from '../utils/indexedDB';

const Home = () => {
  const token = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.data._id;

  const { loading, error, data, refetch } = useQuery(GET_USER, {
    variables: { userId },
    fetchPolicy: 'cache-and-network',
  });

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (navigator.onLine) {
          // Online: Use GraphQL data if available
          if (data && data.getUser) {
            setUserData(data.getUser);

            // Store each invoice in IndexedDB for offline access
            data.getUser.invoices.forEach(async invoice => {
              await addInvoiceToIndexedDB(invoice);
            });
          } else {
            console.log('No data available from GraphQL.');
          }
        } else {
          // Offline: Fallback to IndexedDB
          const indexedDBUserData = await getUserData();
          if (indexedDBUserData) {
            setUserData(indexedDBUserData);
          } else {
            console.log('No user data available in IndexedDB.');
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Handle error fetching data
      }
    };

    fetchData();
  }, [data]);

  useEffect(() => {
    refetch(); // Ensure data freshness
  }, [refetch]);

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

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      await deleteInvoiceMutation({
        variables: { id: invoiceId },
        update: (cache) => {
          const existingData = cache.readQuery({
            query: GET_USER,
            variables: { userId },
          });

          const updatedInvoices = existingData.getUser.invoices.filter(
            invoice => invoice._id !== invoiceId
          );

          cache.writeQuery({
            query: GET_USER,
            variables: { userId },
            data: {
              getUser: {
                ...existingData.getUser,
                invoices: updatedInvoices,
              },
            },
          });
        },
      });

      setUserData(prevData => ({
        ...prevData,
        invoices: prevData.invoices.filter(invoice => invoice._id !== invoiceId)
      }));

      setSearchResult(prevSearchResult =>
        prevSearchResult.filter(invoice => invoice._id !== invoiceId)
      );

    
      const invoiceToDelete = userData.invoices.find(invoice => invoice._id === invoiceId);
      if (invoiceToDelete) {
        await deleteInvoiceByNumberFromIndexedDB(invoiceToDelete.invoiceNumber);
      }

      setModalMessage(`Invoice with ID ${invoiceId} deleted.`);
      setShowMessageModal(true);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      setModalMessage(`Error deleting invoice: ${error.message}`);
      setShowMessageModal(true);
    }
  };

  const handleMarkAsPaid = async (invoiceNumber) => {
    try {
      // Mark invoice as paid in IndexedDB
      await updateInvoiceInIndexedDB(invoiceNumber, true);

      setUserData(prevData => ({
        ...prevData,
        invoices: prevData.invoices.map(invoice =>
          invoice.invoiceNumber === invoiceNumber ? { ...invoice, paidStatus: true } : invoice
        )
      }));

      setSearchResult(prevSearchResult =>
        prevSearchResult.map(invoice =>
          invoice.invoiceNumber === invoiceNumber ? { ...invoice, paidStatus: true } : invoice
        )
      );

      setModalMessage(`Invoice with invoiceNumber ${invoiceNumber} marked as paid.`);
      setShowMessageModal(true);
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      setModalMessage(`Error marking invoice as paid: ${error.message}`);
      setShowMessageModal(true);
    }
  };

  const handleFetchUserData = async () => {
    try {
      const decryptedUserData = await getUserData();

      if (decryptedUserData) {
        setUserData(decryptedUserData);
        setModalMessage('User data fetched from IndexedDB.');
        setShowMessageModal(true);
      } else {
        setModalMessage('No user data found in IndexedDB.');
        setShowMessageModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setModalMessage(`Error fetching user data: ${error.message}`);
      setShowMessageModal(true);
    }
  };

  if (loading) {
    return <p>Loading user data...</p>;
  }

  if (error || !userData || !userData.invoices) {
    return <p>Error fetching data or no user data available.</p>;
  }

  const invoicesDue = userData.invoices.filter(invoice => !invoice.paidStatus) || [];
  const invoicesPaid = userData.invoices.filter(invoice => invoice.paidStatus) || [];
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
                      <button onClick={() => handleDeleteInvoice(invoice._id)}>Delete</button>
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
                        <button onClick={() => handleDeleteInvoice(invoice._id)}>Delete</button>
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
                        <button onClick={() => handleDeleteInvoice(invoice._id)}>Delete</button>
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
        <InvoiceModal invoice={selectedInvoice} onClose={closeModal} />
      )}

      {showMessageModal && (
        <MessageModal message={modalMessage} onClose={() => setShowMessageModal(false)} />
      )}

      <div className="fetch-data-button">
        <button onClick={handleFetchUserData}>Fetch User Data from IndexedDB</button>
      </div>
    </>
  );
};

export default Home;
