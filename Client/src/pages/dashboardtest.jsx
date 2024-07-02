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


      setUserData(data.getUser);

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


      await syncOfflineMutations();
      refetch();
    };

    const handleOffline = async () => {
      setIsOffline(true);
      const invoices = await getInvoicesFromIndexedDB();
      setUserData({ invoices });


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

    if (!isOffline) {
      refetch();
    }
  }, [isOffline, refetch]);


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



            cache.modify({
              id: cache.identify(userData),
              fields: {
                invoices(existingInvoices = [], { readField }) {

                  return existingInvoices.filter(invoice => readField('_id', invoice) !== invoiceId);
                }
              }
            });


            setUserData(prevData => ({
              ...prevData,
              invoices: prevData.invoices.filter(invoice => invoice._id !== invoiceId)
            }));
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

  
  }, [userData]);


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

            <div className='invoice-list'>
              {searchResult.map(invoice => (
                <div
                  key={invoice._id}
                  className='invoice-item'
                  onClick={() => handleInvoiceClick(invoice)}
                >
                  <p>Invoice Number: {invoice.invoiceNumber}</p>
                  <p>Client: {invoice.clientName}</p>
                  <p>Amount: ${invoice.invoiceAmount}</p>
                  <p>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}

          <h2>Due Invoices</h2>
          <div className='invoice-list'>
            {filteredInvoicesDue.map(invoice => (
              <div
                key={invoice._id}
                className='invoice-item'
                onClick={() => handleInvoiceClick(invoice)}
              >
                <p>Invoice Number: {invoice.invoiceNumber}</p>
                <p>Client: {invoice.clientName}</p>
                <p>Amount: ${invoice.invoiceAmount}</p>
                <p>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          <h2>Paid Invoices</h2>
          <div className='invoice-list'>
            {invoicesPaid.map(invoice => (
              <div
                key={invoice._id}
                className='invoice-item'
                onClick={() => handleInvoiceClick(invoice)}
              >
                <p>Invoice Number: {invoice.invoiceNumber}</p>
                <p>Client: {invoice.clientName}</p>
                <p>Amount: ${invoice.invoiceAmount}</p>
                <p>Paid on: {new Date(invoice.paymentDate).toLocaleDateString()}</p>
              </div>
            ))}

          </div>
        </div>
      </div>

      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          isOpen={isModalOpen}
          onClose={closeModal}
          onDelete={handleDeleteInvoice}

        />
      )}
    </>
  );
};

export default Home;
