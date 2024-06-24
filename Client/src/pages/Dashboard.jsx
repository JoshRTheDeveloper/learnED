import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import './dashboard.css';
import Sidebar from '../components/sidebar/sidebar';
import jwtDecode from 'jwt-decode';
import { GET_USER } from '../utils/queries';
import { UPDATE_INVOICE, DELETE_INVOICE } from '../utils/mutations';
import InvoiceModal from '../components/invoice-modal/invoice-modal';
import {
  addInvoiceToIndexedDB,
  getInvoicesFromIndexedDB,
  deleteInvoiceFromIndexedDB,
  addOfflineMutation,
  getOfflineMutations,
  clearOfflineMutations,
} from '../utils/indexedDB';

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
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const { refetch, loading: queryLoading } = useQuery(GET_USER, {
    variables: { userId: userId || '' },
    fetchPolicy: 'cache-first',
    onCompleted: async (data) => {
      console.log('Query completed', data);
      setUserData(data.getUser);
      setLoading(false);
      await Promise.all(data.getUser.invoices.map(invoice => addInvoiceToIndexedDB(invoice)));
    },
    onError: (error) => {
      console.error('Error fetching user data:', error);
      setLoading(false);
    },
    skip: isOffline,
  });

  const [markAsPaidMutation] = useMutation(UPDATE_INVOICE);
  const [deleteInvoiceMutation] = useMutation(DELETE_INVOICE);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      setLoading(true);
      await syncOfflineMutations();
      refetch();
    };

    const handleOffline = async () => {
      setIsOffline(true);
      const invoices = await getInvoicesFromIndexedDB();
      setUserData({ invoices });
      setLoading(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (isOffline) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOffline, refetch]);

  useEffect(() => {
    refetch();  // Fetch data when component mounts
  }, []);

  const syncOfflineMutations = async () => {
    const offlineMutations = await getOfflineMutations();
    for (const mutation of offlineMutations) {
      if (mutation.type === 'delete') {
        await deleteInvoiceMutation({ variables: { id: mutation.invoiceId } });
      }
    }
    await clearOfflineMutations();
  };

  const handleSearch = () => {
    try {
      setSearchLoading(true);
      setSearchError(null);

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
    setSelectedInvoice(null);
    setIsModalOpen(false);
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (isOffline) {
      await addOfflineMutation({ type: 'delete', invoiceId });
      await deleteInvoiceFromIndexedDB(invoiceId);
      setUserData(prevData => ({
        ...prevData,
        invoices: prevData.invoices.filter(invoice => invoice._id !== invoiceId)
      }));
    } else {
      try {
        await deleteInvoiceMutation({
          variables: { id: invoiceId },
          update: (cache, { data: { deleteInvoice } }) => {
            if (!deleteInvoice.success) {
              console.error('Error deleting invoice:', deleteInvoice.message);
              return;
            }

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
          },
        });

        await deleteInvoiceFromIndexedDB(invoiceId);
        refetch();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  useEffect(() => {
    console.log('userData changed:', userData);
  }, [userData]);

  if (loading || queryLoading) {
    return <p>Loading user data...</p>;
  }

  if (!userData) {
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
                        <button onClick={(e) => { e.stopPropagation(); markAsPaidMutation({ variables: { id: invoice._id } }); }}>Mark as Paid</button>
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
                          <button onClick={(e) => { e.stopPropagation(); markAsPaidMutation({ variables: { id: invoice._id } }); }}>Mark as Paid</button>
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
                      <div className='mark-button'>
                        <button onClick={() => handleInvoiceClick(invoice)}>Info</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice._id); }}>Delete</button>
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
