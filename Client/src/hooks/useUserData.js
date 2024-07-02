import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_USER } from '../utils/queries';
import { 
  storeUserData, 
  getUserData 
} from '../utils/indexedDB';
import { 
  CHANGE_COMPANY, 
  CHANGE_STREET_ADDRESS, 
  CHANGE_EMAIL, 
  CHANGE_CITY, 
  CHANGE_STATE, 
  CHANGE_ZIP 
} from '../utils/mutations';

const useUserData = (userId) => {
  const [userData, setUserData] = useState(null);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [initialLoad, setInitialLoad] = useState(true);

  const { loading, data, refetch } = useQuery(GET_USER, {
    variables: { userId },
    skip: !navigator.onLine || !initialLoad,
  });

  const [changeCompany] = useMutation(CHANGE_COMPANY);
  const [changeStreetAddress] = useMutation(CHANGE_STREET_ADDRESS);
  const [changeEmail] = useMutation(CHANGE_EMAIL);
  const [changeCity] = useMutation(CHANGE_CITY);
  const [changeState] = useMutation(CHANGE_STATE);
  const [changeZip] = useMutation(CHANGE_ZIP);

  useEffect(() => {
    const handleOnlineStatusChange = async () => {
      const isOnline = navigator.onLine;
      setOfflineMode(!isOnline);

      if (isOnline) {
        await syncOfflineData();
        refetch();
      }
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [refetch]);

  useEffect(() => {
    const fetchData = async () => {
      if (initialLoad) {
        let userDataFromDB;

        if (navigator.onLine && !loading && data && data.getUser) {
          userDataFromDB = data.getUser;
        } else {
          userDataFromDB = await getUserData(userId);
        }

        if (userDataFromDB) {
          setUserData(userDataFromDB);
        } else {
          console.error('No offline data found.');
        }

        setInitialLoad(false);
      }
    };

    fetchData();
  }, [loading, data, userId, initialLoad]);

  const syncOfflineData = async () => {
    try {
      const offlineUserData = await getUserData(userId);

      if (offlineUserData) {
        const { company, email, streetAddress, city, state, zip } = offlineUserData;

        await Promise.all([
          changeCompany({ variables: { userId, company } }),
          changeStreetAddress({ variables: { userId, streetAddress } }),
          changeEmail({ variables: { userId, email } }),
          changeCity({ variables: { userId, city } }),
          changeState({ variables: { userId, state } }),
          changeZip({ variables: { userId, zip } }),
        ]);

        setUserData(offlineUserData);
        await storeUserData(offlineUserData);
      } else {
        console.error('No offline changes to sync.');
      }
    } catch (error) {
      console.error('Error syncing data with server:', error);
    }
  };

  return { userData, offlineMode, setUserData };
};

export default useUserData;
