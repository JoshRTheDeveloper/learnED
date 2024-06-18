import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import Nav from './components/Nav';
import db, { addInvoiceToIndexedDB, updateInvoiceInIndexedDB, deleteInvoiceFromIndexedDB, getUserData, getAuthData } from './utils/indexedDB';

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
  const [userData, setUserData] = useState(null);
  const [authData, setAuthData] = useState(null);
  

  
  useEffect(() => {
    const initializeData = async () => {
      try {
        
        await db.open();

        
        if (navigator.onLine) {
          await fetchAndStoreInvoices();
        } else {
         
          await getInvoicesFromIndexedDB();
        }

      
        await Promise.all([
          getAndSetUserData(),
          getAndSetAuthData(),
        ]);
      } catch (error) {
        console.error('Failed to initialize data:', error);
      }
    };

    initializeData();

   
    const handleOnline = () => {
      setIsOnline(true);
      syncWithServer();
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

  const getAndSetUserData = async () => {
    try {
      const userData = await getUserData();
      setUserData(userData);
    } catch (error) {
      console.error('Failed to get user data:', error);
    }
  };

  const getAndSetAuthData = async () => {
    try {
      const authData = await getAuthData();
      setAuthData(authData);
    } catch (error) {
      console.error('Failed to get authentication data:', error);
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

  const syncWithServer = async () => {
    if (isOnline) {
      try {
        const unsyncedInvoices = await db.invoices.toArray();
        for (const invoice of unsyncedInvoices) {
          if (invoice.synced === false) {
            await syncNewInvoice(invoice);
          } else if (invoice.synced === true && invoice.updatedLocally === true) {
            await syncUpdatedInvoice(invoice);
          } else if (invoice.synced === true && invoice.deletedLocally === true) {
            await syncDeletedInvoice(invoice);
          }
        }
      } catch (error) {
        console.error('Failed to sync invoices with server:', error);
      }
    }
  };

  const syncNewInvoice = async (invoice) => {
    try {
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
    } catch (error) {
      console.error('Failed to sync new invoice with server:', error);
    }
  };

  const syncUpdatedInvoice = async (invoice) => {
    try {
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
    } catch (error) {
      console.error('Failed to sync updated invoice with server:', error);
    }
  };

  const syncDeletedInvoice = async (invoice) => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await db.invoices.delete(invoice.id);
      } else {
        console.error('Failed to sync deleted invoice with server');
      }
    } catch (error) {
      console.error('Failed to sync deleted invoice with server:', error);
    }
  };

  const addInvoice = async (invoice) => {
    if (isOnline) {
      try {
        const response = await fetch('/api/invoices', {
          method:'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoice),
        });
        if (response.ok) {
          const newInvoice = await response.json();
          setInvoices([...invoices, newInvoice]);
        } else {
          console.error('Failed to add invoice to server:', response.status);
        }
      } catch (error) {
        console.error('Failed to add invoice to server:', error);
      }
    } else {
      try {
        await addInvoiceToIndexedDB(invoice);
        setInvoices([...invoices, invoice]);
      } catch (error) {
        console.error('Failed to add invoice to IndexedDB:', error);
      }
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
        if (response.ok) {
          const updatedInvoice = await response.json();
          setInvoices(invoices.map(inv => (inv.id === updatedInvoice.id ? updatedInvoice : inv)));
        } else {
          console.error('Failed to update invoice on server:', response.status);
        }
      } catch (error) {
        console.error('Failed to update invoice on server:', error);
      }
    } else {
      try {
        await updateInvoiceInIndexedDB(invoice);
        setInvoices(invoices.map(inv => (inv.id === invoice.id ? invoice : inv)));
      } catch (error) {
        console.error('Failed to update invoice in IndexedDB:', error);
      }
    }
  };

  const deleteInvoice = async (id) => {
    if (isOnline) {
      try {
        const response = await fetch(`/api/invoices/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setInvoices(invoices.filter(inv => inv.id !== id));
        } else {
          console.error('Failed to delete invoice from server:', response.status);
        }
      } catch (error) {
        console.error('Failed to delete invoice from server:', error);
      }
    } else {
      try {
        await deleteInvoiceFromIndexedDB(id);
        setInvoices(invoices.filter(inv => inv.id !== id));
      } catch (error) {
        console.error('Failed to delete invoice from IndexedDB:', error);
      }
    }
  };

  const fetchUserDataFromServer = async () => {
    try {
      const response = await fetch('/api/user');
      return response.json();
    } catch (error) {
      console.error('Failed to fetch user data from server:', error);
      return null;
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

