import { useState, useEffect } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { GET_USER, GET_USER_INVOICES } from '../utils/queries';
import {
  CHANGE_COMPANY,
  CHANGE_PROFILE_PICTURE,
  CHANGE_STREET_ADDRESS,
  CHANGE_EMAIL,
  CHANGE_CITY,
  CHANGE_STATE,
  CHANGE_ZIP,
  UPDATE_INVOICE,
} from '../utils/mutations';

import {
  storeUserData,
  getInvoicesFromIndexedDB,
  addInvoiceToIndexedDB,
  getOfflineMutations,
  clearOfflineMutations,
  addOfflineMutation, 
} from './../utils/indexedDB';

const useDataManagement = (userId) => {
  const [userData, setUserData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const client = useApolloClient();

  const { loading: userLoading, error: userError, data: userDataQuery } = useQuery(GET_USER, {
    variables: { userId },
    skip: !isOnline,
  });

  const { loading: invoicesLoading, error: invoicesError, data: invoicesData } = useQuery(GET_USER_INVOICES, {
    variables: { userId },
    skip: !isOnline,
  });

  const [updateInvoiceMutation] = useMutation(UPDATE_INVOICE);
  const [changeEmailMutation] = useMutation(CHANGE_EMAIL);
  const [changeCityMutation] = useMutation(CHANGE_CITY);
  const [changeStateMutation] = useMutation(CHANGE_STATE);
  const [changeZipMutation] = useMutation(CHANGE_ZIP);
  const [changeCompanyMutation] = useMutation(CHANGE_COMPANY);
  const [changeProfilePictureMutation] = useMutation(CHANGE_PROFILE_PICTURE);
  const [changeStreetAddressMutation] = useMutation(CHANGE_STREET_ADDRESS);

  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      syncOfflineMutations();
      fetchDataFromServer();
    } else {
      fetchDataFromIndexedDB();
    }
  }, [isOnline]);

  useEffect(() => {
    if (userDataQuery && userDataQuery.getUser) {
      setUserData(userDataQuery.getUser);
      storeUserData(userDataQuery.getUser); 
      console.log('Stored user data in IndexedDB:', userDataQuery.getUser);
    }
  }, [userDataQuery]);

  useEffect(() => {
    if (invoicesData && invoicesData.getUserInvoices) {
      setInvoices(invoicesData.getUserInvoices);
      invoicesData.getUserInvoices.forEach(async (invoice) => {
        await addInvoiceToIndexedDB(invoice); 
        console.log('Stored invoice in IndexedDB:', invoice);
      });
    }
  }, [invoicesData]);

  const syncOfflineMutations = async () => {
    const offlineMutations = await getOfflineMutations();
    for (const mutation of offlineMutations) {
      try {
        await executeOfflineMutation(mutation);
        console.log('Executed offline mutation:', mutation);
      } catch (error) {
        console.error('Failed to execute offline mutation:', error);
      }
    }
    await clearOfflineMutations();
  };

  const executeOfflineMutation = async (mutation) => {
    const { mutationType, variables } = mutation;
    try {
      switch (mutationType) {
        case 'UPDATE_INVOICE':
          await updateInvoiceMutation({ variables });
          break;
        case 'CHANGE_EMAIL':
          await changeEmailMutation({ variables });
          break;
        case 'CHANGE_CITY':
          await changeCityMutation({ variables });
          break;
        case 'CHANGE_STATE':
          await changeStateMutation({ variables });
          break;
        case 'CHANGE_ZIP':
          await changeZipMutation({ variables });
          break;
        case 'CHANGE_COMPANY':
          await changeCompanyMutation({ variables });
          break;
        case 'CHANGE_PROFILE_PICTURE':
          await changeProfilePictureMutation({ variables });
          break;
        case 'CHANGE_STREET_ADDRESS':
          await changeStreetAddressMutation({ variables });
          break;
        default:
          throw new Error(`Unknown mutation type: ${mutationType}`);
      }
      console.log('Executed mutation:', mutationType, variables);
    } catch (error) {
      console.error(`Failed to execute ${mutationType}:`, error);
    }
  };

  const updateInvoice = async (invoiceId, paidStatus) => {
    if (isOnline) {
      try {
        await updateInvoiceMutation({ variables: { id: invoiceId, paidStatus } });
      } catch (error) {
        console.error('Error updating invoice online:', error);
      
      }
    } else {
      try {
     
        await updateInvoiceInIndexedDB(invoiceId, paidStatus);
        await addOfflineMutation({ mutationType: 'UPDATE_INVOICE', variables: { id: invoiceId, paidStatus } });
        console.log('Stored offline invoice update:', { id: invoiceId, paidStatus });
      } catch (error) {
        console.error('Error updating invoice offline:', error);

      }
    }
    fetchDataFromIndexedDB();
  };
  

  const updateProfileField = async (mutationType, variables) => {
    if (isOnline) {
      await executeOfflineMutation({ mutationType, variables });
    } else {
      await addOfflineMutation({ mutationType, variables });
      console.log('Stored offline mutation:', { mutationType, variables });
    }
    fetchDataFromIndexedDB();
  };
  
  const fetchDataFromServer = async () => {
    try {
      const { data } = await client.query({
        query: GET_USER,
        variables: { userId },
      });
  
      if (data && data.getUser) {
        setUserData(data.getUser);
        await storeUserData(data.getUser);
        console.log('Fetched user data from server and stored in IndexedDB:', data.getUser);
      }
  
      const { data: invoicesData } = await client.query({
        query: GET_USER_INVOICES,
        variables: { userId },
      });
  
      if (invoicesData && invoicesData.getUserInvoices) {
        setInvoices(invoicesData.getUserInvoices);
        for (const invoice of invoicesData.getUserInvoices) {
          await addInvoiceToIndexedDB(invoice);
          console.log('Fetched invoice data from server and stored in IndexedDB:', invoice);
        }
      }
    } catch (error) {
      console.error('Error fetching data from server:', error);
    }
  };
  
  const fetchDataFromIndexedDB = async () => {
    const offlineInvoices = await getInvoicesFromIndexedDB();
    setInvoices(offlineInvoices || []);
    console.log('Fetched invoices from IndexedDB:', offlineInvoices);
  };

 const fetchUserDataFromIndexedDB = async () => {
    try {
      const userData = await getUserData();
      const profilePicture = await getProfilePicture();
      return { ...userData, profilePicture };
    } catch (error) {
      console.error('Failed to fetch user data from IndexedDB:', error);
      return null;
    }
  };

  return {
    userData,
    invoices,
    userLoading,
    userError,
    invoicesLoading,
    invoicesError,
    updateInvoice,
    updateProfileField,
  };
};

export default useDataManagement;
