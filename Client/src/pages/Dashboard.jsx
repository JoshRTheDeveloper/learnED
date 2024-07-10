import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import './dashboard.css';
import Sidebar from '../components/sidebar/sidebar';
import jwtDecode from 'jwt-decode';
import InvoiceModal from '../components/invoice-modal/invoice-modal';
import MessageModal from '../components/message-modal/message-modal';
import {
  getInvoicesFromIndexedDB,
  deleteInvoiceByNumberFromIndexedDB,
  updateInvoiceInIndexedDB,
} from '../utils/indexedDB';
import {
  GET_USER,
  CREATE_INVOICE,
  UPDATE_INVOICE,
  DELETE_INVOICE,
} from '../utils/queries';

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

  const { data: userDataQuery, error: userError, loading: userLoading, refetch: refetchUserData } = useQuery(GET_USER, {
    variables: { id: userId },
    onCompleted: async (data) => {
      if (data && data.user) {
        setUserData(data.user);

        // Sync IndexedDB with online database on initial load
        await syncIndexedDBWithOnlineDB(data.user.invoices);
      }
      setLoading(false);
    },
    onError: async (error) => {
      console.error('Error fetching user data:', error);
      // Handle error fetching user data
      setLoading(false);
    },
  });

  useEffect(() => {
    // Function to compare and update IndexedDB with online database
    const syncIndexedDBWithOnlineDB = async (invoices) => {
      try {
        const storedInvoices = await getInvoicesFromIndexedDB();

        // Clear existing invoices in OnlineDB (if needed)
        await clearOnlineDB();

        // Update OnlineDB with data from IndexedDB
        for (const invoice of storedInvoices) {
          const existingInvoice = invoices.find((inv) => inv.invoiceNumber === invoice.invoiceNumber);

          if (!existingInvoice) {
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

        // Optionally, update local state or perform additional actions after synchronization
        const updatedUserData = await refetchUserData();
        setUserData(updatedUserData);
      } catch (error) {
        console.error('Error syncing IndexedDB with online DB:', error);
      }
    };

    if (userDataQuery && userDataQuery.user && userDataQuery.user.invoices) {
      syncIndexedDBWithOnlineDB(userDataQuery.user.invoices);
    }
  }, [userDataQuery]);

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

      // Delete invoice from online DB if necessary
      await deleteInvoice({
        variables: { invoiceNumber },
      });

      setUserData((prevData) => ({
        ...prevData,
        invoices: prevData.invoices.filter((invoice) => invoice.invoiceNumber !== invoiceNumber),
      }));

      setSearchResult((prevSearchResult) =>
        prevSearchResult.filter((invoice) => invoice.invoiceNumber !== invoiceNumber)
      );

      setModalMessage(`Invoice with invoiceNumber ${invoiceNumber} deleted.`);
      setShowMessageModal(true);
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const handleMarkAsPaid = async (invoiceNumber) => {
    try {
      await updateInvoiceInIndexedDB(invoiceNumber, true);

      // Update invoice in online DB
      await updateInvoice({
        variables: { id: invoiceNumber, paidStatus: true },
      });

      // Update local state to reflect the change
      setUserData((prevData) => ({
        ...prevData,
        invoices: prevData.invoices.map((invoice) =>
          invoice.invoiceNumber === invoiceNumber ? { ...invoice, paidStatus: true } : invoice
        ),
      }));

      setSearchResult((prevSearchResult) =>
        prevSearchResult.map((invoice) =>
          invoice.invoiceNumber === invoiceNumber ? { ...invoice, paidStatus: true } : invoice
        )
      );

      setModalMessage(`Invoice with invoiceNumber ${invoiceNumber} marked as paid.`);
      setShowMessageModal(true);
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchInvoiceNumber.trim()) {
      setSearchResult([]);
      return;
    }

    setSearchLoading(true);
    try {
      const filteredInvoices = userData.invoices.filter((invoice) =>
        invoice.invoiceNumber.includes(searchInvoiceNumber)
      );
      setSearchResult(filteredInvoices);
      setSearchLoading(false);
    } catch (error) {
      setSearchError(error);
      setSearchLoading(false);
    }
  };

  if (loading || userLoading) {
    return <p>Loading user data...</p>;
  }

  if (!userData || !userData.invoices) {
    return <p>No user data available.</p>;
  }

  const invoicesDue = userData.invoices.filter((invoice) => !invoice.paidStatus);
  const invoicesPaid = userData.invoices.filter((invoice) => invoice.paidStatus);
  const filteredInvoicesDue = searchInvoiceNumber
    ? invoicesDue.filter((invoice) => invoice.invoiceNumber.includes(searchInvoiceNumber))
    : invoicesDue;

  return (
    <>
      <div className="app">
        <Sidebar />
        <div className="main-content">
          <div className="search-bar-div">
            <h2>Search Invoices</h2>
            <input
              className="search-bar-input"
              type="text"
              value={searchInvoiceNumber}
              onChange={(e) => setSearchInvoiceNumber(e.target.value)}
              placeholder="Search by Invoice Number"
            />
            <div className="search-button-div">
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
            <div className="search-results">
              <h3>Search Results</h3>
              <ul>
                {searchResult.map((invoice) => (
                  <li key={invoice._id}>
                    <div className="due-date-container">
                      <p className="invoice-number">Invoice Number: {invoice.invoiceNumber}</p>
                      <p className="due-date">
                        {' '}
                        Due Date: {new Date(parseInt(invoice.dueDate)).toLocaleDateString()}{' '}
                      </p>
                    </div>
                    <div className="invoice-info">
                      <p>Client: {invoice.clientName}</p>
                      {invoice.invoiceAmount && (
                        <p>Amount: ${parseFloat(invoice.invoiceAmount.toString()).toFixed(2)}</p>
                      )}
                      <p>Paid Status: {invoice.paidStatus ? 'Paid' : 'Not Paid'}</p>
                    </div>
                    <div className="button-container">
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
                  {filteredInvoicesDue.map((invoice) => (
                    <li key={invoice._id}>
                      <div className="due-date-container">
                        <p className="invoice-number">Invoice Number: {invoice.invoiceNumber}</p>
                        <p className="due-date">
                          {' '}
                          Due Date: {new Date(parseInt(invoice.dueDate)).toLocaleDateString()}{' '}
                        </p>
                      </div>
                      <div className="invoice-info">
                        <p>Client: {invoice.clientName}</p>
                        {invoice.invoiceAmount && (
                          <p>Amount: ${parseFloat(invoice.invoiceAmount.toString()).toFixed(2)}</p>
                        )}
                        <p>Paid Status: {invoice.paidStatus ? 'Paid' : 'Not Paid'}</p>
                      </div>
                      <div className="button-container">
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
                <p>No invoices paid.</p>
              ) : (
                <ul>
                  {invoicesPaid.map((invoice) => (
                    <li key={invoice._id}>
                      <div className="due-date-container">
                        <p className="invoice-number">Invoice Number: {invoice.invoiceNumber}</p>
                        <p className="due-date">
                          {' '}
                          Due Date: {new Date(parseInt(invoice.dueDate)).toLocaleDateString()}{' '}
                        </p>
                      </div>
                      <div className="invoice-info">
                        <p>Client: {invoice.clientName}</p>
                        {invoice.invoiceAmount && (
                          <p>Amount: ${parseFloat(invoice.invoiceAmount.toString()).toFixed(2)}</p>
                        )}
                        <p>Paid Status: {invoice.paidStatus ? 'Paid' : 'Not Paid'}</p>
                      </div>
                      <div className="button-container">
                        <button onClick={() => handleInvoiceClick(invoice)}>Info</button>
                        <button onClick={() => handleDeleteInvoice(invoice.invoiceNumber)}>Delete</button>
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
          refetchUserData={refetchUserData}
          setModalMessage={setModalMessage}
          setShowMessageModal={setShowMessageModal}
        />
      )}

      {showMessageModal && <MessageModal message={modalMessage} closeModal={() => setShowMessageModal(false)} />}
    </>
  );
};

export default Home;
