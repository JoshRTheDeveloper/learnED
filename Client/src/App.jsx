import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import Nav from './components/Nav';
import db, { addInvoiceToIndexedDB, updateInvoiceInIndexedDB, deleteInvoiceFromIndexedDB } from './utils/indexedDB';

const httpLink = createHttpLink({
  uri: '/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('Auth_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  uri: '/graphql',
  cache: new InMemoryCache()
});

function App() {
  const [invoices, setInvoices] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    db.open().catch(err => {
      console.error(`Failed to open IndexedDB: ${err}`);
    });

    const fetchAndStoreInvoices = async () => {
      try {
        const response = await fetch('/api/invoices');
        const data = await response.json();
        await db.invoices.bulkPut(data);
        setInvoices(data);
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
      }
    };

    const getInvoicesFromIndexedDB = async () => {
      try {
        const localInvoices = await db.invoices.toArray();
        setInvoices(localInvoices);
      } catch (error) {
        console.error('Failed to get invoices from IndexedDB:', error);
      }
    };

    const syncLocalChangesWithServer = async () => {
      try {
        const unsyncedInvoices = await db.invoices.toArray();
        for (const invoice of unsyncedInvoices) {
          if (invoice.synced === false) {
            const response = await fetch('/api/invoices', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(invoice),
            });
            if (response.ok) {
              await db.invoices.update(invoice.id, { synced: true });
            } else {
              console.error('Failed to sync new invoice with server');
            }
          } else if (invoice.synced === true && invoice.updatedLocally === true) {
            const response = await fetch(`/api/invoices/${invoice.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(invoice),
            });
            if (response.ok) {
              await db.invoices.update(invoice.id, { updatedLocally: false });
            } else {
              console.error('Failed to sync updated invoice with server');
            }
          } else if (invoice.synced === true && invoice.deletedLocally === true) {
            const response = await fetch(`/api/invoices/${invoice.id}`, {
              method: 'DELETE',
            });
            if (response.ok) {
              await db.invoices.delete(invoice.id);
            } else {
              console.error('Failed to sync deleted invoice with server');
            }
          }
        }
      } catch (error) {
        console.error('Failed to sync invoices with server:', error);
      }
    };

    if (!navigator.onLine) {
      getInvoicesFromIndexedDB();
    } else {
      fetchAndStoreInvoices();
      syncLocalChangesWithServer();
    }

    const handleOnline = () => {
      setIsOnline(true);
      fetchAndStoreInvoices();
      syncLocalChangesWithServer();
    };

    const handleOffline = () => {
      setIsOnline(false);
      getInvoicesFromIndexedDB();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addInvoice = async (invoice) => {
    if (isOnline) {
      try {
        const response = await fetch('/api/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoice),
        });
        const newInvoice = await response.json();
        setInvoices([...invoices, newInvoice]);
      } catch (error) {
        console.error('Failed to add invoice to server:', error);
      }
    } else {
      await addInvoiceToIndexedDB(invoice);
      setInvoices([...invoices, invoice]);
    }
  };

  const updateInvoice = async (invoice) => {
    if (isOnline) {
      try {
        const response = await fetch(`/api/invoices/${invoice.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoice),
        });
        const updatedInvoice = await response.json();
        setInvoices(invoices.map(inv => (inv.id === updatedInvoice.id ? updatedInvoice : inv)));
      } catch (error) {
        console.error('Failed to update invoice on server:', error);
      }
    } else {
      await updateInvoiceInIndexedDB(invoice);
      setInvoices(invoices.map(inv => (inv.id === invoice.id ? invoice : inv)));
    }
  };

  const deleteInvoice = async (id) => {
    if (isOnline) {
      try {
        await fetch(`/api/invoices/${id}`, {
          method: 'DELETE',
        });
        setInvoices(invoices.filter(inv => inv.id !== id));
      } catch (error) {
        console.error('Failed to delete invoice from server:', error);
      }
    } else {
      await deleteInvoiceFromIndexedDB(id);
      setInvoices(invoices.filter(inv => inv.id !== id));
    }
  };

  return (
    <ApolloProvider client={client}>
      <div>
        <Nav />
        <Outlet context={{ addInvoice, updateInvoice, deleteInvoice, isOnline, invoices }} />
      </div>
    </ApolloProvider>
  );
}

export default App;
