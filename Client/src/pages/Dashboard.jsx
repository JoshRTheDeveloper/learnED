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
} from '../utils/indexedDB';
import { GET_USER } from '../utils/queries';
import { CREATE_INVOICE, UPDATE_INVOICE, DELETE_INVOICE } from '../utils/mutations';

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

  const { data, error, loading: queryLoading } = useQuery(GET_USER, {
    variables: { id: userId },
    onCompleted: async (data) => {
      if (data && data.user) {
        setUserData(data.user);

        // Sync IndexedDB with online database on initial load
        await syncIndexedDBWithOnlineDB(data.user.invoices);
      }
      setLoading(false);
    },
    onError: async () => {
      // Handle error fetching user data or GraphQL query
      const storedInvoices = await getInvoicesFromIndexedDB();
      if (storedInvoices) {
        setUserData({ invoices: storedInvoices });
      }
      setLoading(false);
    },
  });

  useEffect(() => {
    // Function to compare and update IndexedDB with online database
    const syncIndexedDBWithOnlineDB = async (onlineInvoices) => {
      try {
        const storedInvoices = await getInvoicesFromIndexedDB();

        // Compare and sync logic
        for (const invoice of storedInvoices) {
          const existingInvoice = onlineInvoices.find((inv) => inv.invoiceNumber === invoice.invoiceNumber);

          if (!existingInvoice) {
            // If invoice exists in IndexedDB but not in online DB, create it
            await createInvoice({
              variables: {
                invoiceAmount: invoice.invoiceAmount,
                paidStatus: invoice.paidStatus,
                invoiceNumber: invoice.invoiceNumber,
                companyName: invoice.companyName,
                companyEmail: invoice.companyEmail,
                clientName: invoice.clientName,
                clientEmail: invoice.clientEmail,
                dueDate: invoice.dueDate,
                userID: userId,
                invoice_details: invoice.invoice_details,
              },
            });
          }
        }

        // Update local state or refetch user data after synchronization
        const updatedUserData = await refetchUserData(); // Implement refetchUserData as per your use case
        setUserData(updatedUserData);
      } catch (error) {
        console.error('Error syncing IndexedDB with online DB:', error);
      }
    };

    if (data && data.user && data.user.invoices) {
      syncIndexedDBWithOnlineDB(data.user.invoices);
    }
  }, [data]); // Run whenever data changes (i.e., onCompleted of useQuery)

  const [createInvoice] = useMutation(CREATE_INVOICE, {
    onError: (error) => {
      console.error('Error creating invoice:', error);
      // Handle error creating invoice
    },
  });

  const [updateInvoice] = useMutation(UPDATE_INVOICE, {
    onError: (error) => {
      console.error('Error updating invoice:', error);
      // Handle error updating invoice
    },
  });

  const [deleteInvoice] = useMutation(DELETE_INVOICE, {
    onError: (error) => {
      console.error('Error deleting invoice:', error);
      // Handle error deleting invoice
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

  const handleDeleteInvoice = async (invoiceNumber) => {
    try {
      await deleteInvoiceByNumberFromIndexedDB(invoiceNumber);

      // Update local state (userData) after deleting invoice
      setUserData(prevData => ({
        ...prevData,
        invoices: prevData.invoices.filter(invoice => invoice.invoiceNumber !== invoiceNumber)
      }));

      setSearchResult(prevSearchResult =>
        prevSearchResult.filter(invoice => invoice.invoiceNumber !== invoiceNumber)
      );

      setModalMessage(`Invoice with invoiceNumber ${invoiceNumber} deleted.`);
      setShowMessageModal(true);

      // Delete invoice mutation
      await deleteInvoice({
        variables: {
          invoiceNumber: invoiceNumber,
          userID: userId
        }
      });

      // Optionally sync IndexedDB with updated online database
      const updatedUserData = await refetchUserData(); // Implement refetchUserData as per your use case
      setUserData(updatedUserData);

    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const handleMarkAsPaid = async (invoiceNumber) => {
    try {
      // Update IndexedDB locally
      await updateInvoiceInIndexedDB(invoiceNumber, true);

      // Update local state (userData) after marking invoice as paid
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

      // Update invoice mutation
      await updateInvoice({
        variables: {
          invoiceNumber: invoiceNumber,
          paidStatus: true,
          userID: userId
        }
      });

      // Optionally sync IndexedDB with updated online database
      const updatedUserData = await refetchUserData(); // Implement refetchUserData as per your use case
      setUserData(updatedUserData);

    } catch (error) {
      console.error('Error marking invoice as paid:', error);
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

          {invoicesDue.length > 0 && (
            <div className='due-invoices'>
              <h3>Due Invoices</h3>
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
            </div>
          )}

          {invoicesPaid.length > 0 && (
            <div className='paid-invoices'>
              <h3>Paid Invoices</h3>
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
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isModalOpen && (
            <InvoiceModal
              invoice={selectedInvoice}
              closeModal={closeModal}
              handleDeleteInvoice={handleDeleteInvoice}
              handleMarkAsPaid={handleMarkAsPaid}
            />
          )}

          {showMessageModal && (
            <MessageModal message={modalMessage} closeModal={() => setShowMessageModal(false)} />
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
