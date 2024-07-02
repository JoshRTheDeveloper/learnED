// src/hooks/useInvoices.js

import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_INVOICES } from '../utils/queries';
import { addInvoiceToIndexedDB, getInvoicesFromIndexedDB } from '../utils/indexedDB';

const useInvoices = (userId) => {
  const { loading: onlineLoading, error: onlineError, data: onlineData } = useQuery(GET_INVOICES, {
    variables: { userId },
    onError: (error) => console.error('Error fetching invoices from online DB:', error),
  });

  const { loading: offlineLoading, error: offlineError, data: offlineData } = getInvoicesFromIndexedDB();

  useEffect(() => {
    const syncInvoicesToIndexedDB = async () => {
      if (!onlineLoading && !onlineError && onlineData) {
        const invoices = onlineData.invoices; // Adjust according to your GraphQL response structure

        try {
          // Save invoices to IndexedDB
          await addInvoiceToIndexedDB(invoices);
          console.log('Invoices synced to IndexedDB:', invoices);
        } catch (error) {
          console.error('Error saving invoices to IndexedDB:', error);
        }
      }
    };

    syncInvoicesToIndexedDB();
  }, [onlineLoading, onlineError, onlineData]);

  return { loading: onlineLoading || offlineLoading, error: onlineError || offlineError, data: onlineData || offlineData };
};

export default useInvoices;
