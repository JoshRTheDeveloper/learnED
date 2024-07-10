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
import { DELETE_INVOICE, UPDATE_INVOICE, CREATE_INVOICE } from '../utils/mutations';

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

        // Compare online data with IndexedDB data and sync if necessary
        await syncDataWithIndexedDB(data.user.invoices);
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

  const [createInvoice] = useMutation(CREATE_INVOICE, {
    onError: (error) => {
      console.error('Error creating invoice:', error);
    },
  });

  const [updateInvoice] = useMutation(UPDATE_INVOICE, {
    onError: (error) => {
      console.error('Error updating invoice:', error);
    },
  });

  const [deleteInvoice] = useMutation(DELETE_INVOICE, {
    onError: (error) => {
      console.error('Error deleting invoice:', error);
    },
  });

  useEffect(() => {
    // Sync online data with IndexedDB data
    const syncDataWithIndexedDB = async (onlineInvoices) => {
      try {
        const indexedDBInvoices = await getInvoicesFromIndexedDB();

        // Determine new, updated, and deleted invoices
        const onlineInvoiceNumbers = onlineInvoices.map((invoice) => invoice.invoiceNumber);
        const indexedDBInvoiceNumbers = indexedDBInvoices.map((invoice) => invoice.invoiceNumber);

        // New invoices in online data that need to be added to IndexedDB
        const newInvoices = onlineInvoices.filter(
          (invoice) => !indexedDBInvoiceNumbers.includes(invoice.invoiceNumber)
        );

        // Invoices in IndexedDB that are not in online data need to be deleted
        const deletedInvoices = indexedDBInvoices.filter(
          (invoice) => !onlineInvoiceNumbers.includes(invoice.invoiceNumber)
        );

        // Updated invoices (check for changes in properties like paidStatus)
        const updatedInvoices = onlineInvoices.filter((onlineInvoice) => {
          const indexedDBInvoice = indexedDBInvoices.find(
            (invoice) => invoice.invoiceNumber === onlineInvoice.invoiceNumber
          );
          return (
            indexedDBInvoice &&
            JSON.stringify(indexedDBInvoice) !== JSON.stringify(onlineInvoice)
          );
        });

        // Perform mutations to synchronize data
        for (const invoice of newInvoices) {
          await addInvoiceToIndexedDB(invoice); // Add to IndexedDB
          await createInvoice({ variables: { ...invoice, userID: userId } }); // Create in Online DB
        }

        for (const invoice of deletedInvoices) {
          await deleteInvoiceByNumberFromIndexedDB(invoice.invoiceNumber); // Delete from IndexedDB
          await deleteInvoice({ variables: { invoiceNumber: invoice.invoiceNumber } }); // Delete from Online DB
        }

        for (const invoice of updatedInvoices) {
          await updateInvoiceInIndexedDB(invoice.invoiceNumber, invoice.paidStatus); // Update IndexedDB
          await updateInvoice({ variables: { id: invoice._id, paidStatus: invoice.paidStatus } }); // Update Online DB
        }

        // Refresh userData after synchronization
        setUserData({ ...data.user, invoices: onlineInvoices });
      } catch (error) {
        console.error('Error syncing data with IndexedDB:', error);
      }
    };

    if (data && data.user && data.user.invoices) {
      syncDataWithIndexedDB(data.user.invoices);
    }
  }, [data, createInvoice, updateInvoice, deleteInvoice]);

  const handleSearch = () => {
    setSearchLoading(true);
    setSearchError(null);

    try {
      const filteredInvoices = userData?.invoices.filter(
        (invoice) => invoice.invoiceNumber.includes(searchInvoiceNumber)
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

      setUserData((prevData) => ({
        ...prevData,
        invoices: prevData.invoices.filter(
          (invoice) => invoice.invoiceNumber !== invoiceNumber
        ),
      }));

      setSearchResult((prevSearchResult) =>
        prevSearchResult.filter(
          (invoice) => invoice.invoiceNumber !== invoiceNumber
        )
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

      setUserData((prevData) => ({
        ...prevData,
        invoices: prevData.invoices.map((invoice) =>
          invoice.invoiceNumber === invoiceNumber
            ? { ...invoice, paidStatus: true }
            : invoice
        ),
      }));

      setSearchResult((prevSearchResult) =>
        prevSearchResult.map((invoice) =>
          invoice.invoiceNumber === invoiceNumber
            ? { ...invoice, paidStatus: true }
            : invoice
        )
      );

      setModalMessage(`Invoice with invoiceNumber ${invoiceNumber} marked as paid.`);
      setShowMessageModal(true);
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

  const invoicesDue =
    userData?.invoices.filter((invoice) => !invoice.paidStatus) || [];
  const invoicesPaid =
    userData?.invoices.filter((invoice) => invoice.paidStatus) || [];
  const filteredInvoicesDue = searchInvoiceNumber
    ? invoicesDue.filter((invoice) =>
        invoice.invoiceNumber.includes(searchInvoiceNumber)
      )
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
                      <p className="invoice-number">
                        Invoice Number: {invoice.invoiceNumber}
                      </p>
                      <p className="due-date">
                        {' '}
                        Due Date:{' '}
                        {new Date(
                          parseInt(invoice.dueDate)
                        ).toLocaleDateString()}{' '}
                      </p>
                    </div>
                    <div className="invoice-info">
                      <p>Client: {invoice.clientName}</p>
                      {invoice.invoiceAmount && (
                        <p>
                          Amount: ${parseFloat(
                            invoice.invoiceAmount.toString()
                          ).toFixed(2)}
                        </p>
                      )}
                      <p>
                        Paid Status: {invoice.paidStatus ? 'Paid' : 'Not Paid'}
                      </p>
                    </div>
                    <div className="button-container">
                      <button onClick={() => handleInvoiceClick(invoice)}>
                        Info
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(invoice.invoiceNumber)}
                      >
                        Delete
                      </button>
                      {!invoice.paidStatus && (
                        <button
                          onClick={() =>
                            handleMarkAsPaid(invoice.invoiceNumber)
                          }
                        >
                          Mark as Paid
                        </button>
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
                        <p className="invoice-number">
                          Invoice Number: {invoice.invoiceNumber}
                        </p>
                        <p className="due-date">
                          {' '}
                          Due Date:{' '}
                          {new Date(
                            parseInt(invoice.dueDate)
                          ).toLocaleDateString()}{' '}
                        </p>
                      </div>
                      <div className="invoice-info">
                        <p>Client: {invoice.clientName}</p>
                        {invoice.invoiceAmount && (
                          <p>
                            Amount: ${parseFloat(
                              invoice.invoiceAmount.toString()
                            ).toFixed(2)}
                          </p>
                        )}
                        <p>
                          Paid Status:{' '}
                          {invoice.paidStatus ? 'Paid' : 'Not Paid'}
                        </p>
                      </div>
                      <div className="button-container">
                        <button onClick={() => handleInvoiceClick(invoice)}>
                          Info
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(invoice.invoiceNumber)}
                        >
                          Delete
                        </button>
                        {!invoice.paidStatus && (
                          <button
                            onClick={() =>
                              handleMarkAsPaid(invoice.invoiceNumber)
                            }
                          >
                            Mark as Paid
                          </button>
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
                  {invoicesPaid.map((invoice) => (
                    <li key={invoice._id}>
                      <div className="due-date-container">
                        <p className="invoice-number">
                          Invoice Number: {invoice.invoiceNumber}
                        </p>
                        <p className="due-date">
                          {' '}
                          Due Date:{' '}
                          {new Date(
                            parseInt(invoice.dueDate)
                          ).toLocaleDateString()}{' '}
                        </p>
                      </div>
                      <div className="invoice-info">
                        <p>Client: {invoice.clientName}</p>
                        {invoice.invoiceAmount && (
                          <p>
                            Amount: ${parseFloat(
                              invoice.invoiceAmount.toString()
                            ).toFixed(2)}
                          </p>
                        )}
                        <p>
                          Paid Status:{' '}
                          {invoice.paidStatus ? 'Paid' : 'Not Paid'}
                        </p>
                      </div>
                      <div className="button-container">
                        <button onClick={() => handleInvoiceClick(invoice)}>
                          Info
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(invoice.invoiceNumber)}
                        >
                          Delete
                        </button>
                        {!invoice.paidStatus && (
                          <button
                            onClick={() =>
                              handleMarkAsPaid(invoice.invoiceNumber)
                            }
                          >
                            Mark as Paid
                          </button>
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
        <MessageModal
          message={modalMessage}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </>
  );
};

export default Home;
