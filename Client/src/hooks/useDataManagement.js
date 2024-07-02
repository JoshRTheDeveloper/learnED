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
  updateInvoiceInIndexedDB,
  getUserData,
  getProfilePicture,
} from './../utils/indexedDB';

const useDataManagement = (userId) => {
  const [userData, setUserData] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState(null);
  const client = useApolloClient();

  const { loading, error, data } = useQuery(GET_USER, {
    variables: { userId },
    onCompleted: (data) => {
      setUserData(data.user);
      storeUserData(data.user);
    },
    onError: (error) => {
      setUserError(error);
    },
  });

  const [
    changeCompany,
    { loading: companyLoading, error: companyError },
  ] = useMutation(CHANGE_COMPANY);

  const [
    changeProfilePicture,
    { loading: pictureLoading, error: pictureError },
  ] = useMutation(CHANGE_PROFILE_PICTURE);

  const [
    changeStreetAddress,
    { loading: addressLoading, error: addressError },
  ] = useMutation(CHANGE_STREET_ADDRESS);

  const [
    changeEmail,
    { loading: emailLoading, error: emailError },
  ] = useMutation(CHANGE_EMAIL);

  const [
    changeCity,
    { loading: cityLoading, error: cityError },
  ] = useMutation(CHANGE_CITY);

  const [
    changeState,
    { loading: stateLoading, error: stateError },
  ] = useMutation(CHANGE_STATE);

  const [
    changeZip,
    { loading: zipLoading, error: zipError },
  ] = useMutation(CHANGE_ZIP);

  useEffect(() => {
    setUserLoading(loading);
  }, [loading]);

  useEffect(() => {
    if (error) setUserError(error);
  }, [error]);

  const fetchUserDataFromIndexedDB = async () => {
    try {
      const userData = await getUserData(userId);
      const profilePicture = await getProfilePicture(userId);
      if (userData) {
        return {
          ...userData,
          profilePicture: profilePicture,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data from IndexedDB:', error);
      return null;
    }
  };

  const updateProfileField = async (mutationType, variables) => {
    try {
      let mutation;
      switch (mutationType) {
        case 'CHANGE_COMPANY':
          mutation = changeCompany;
          break;
        case 'CHANGE_PROFILE_PICTURE':
          mutation = changeProfilePicture;
          break;
        case 'CHANGE_STREET_ADDRESS':
          mutation = changeStreetAddress;
          break;
        case 'CHANGE_EMAIL':
          mutation = changeEmail;
          break;
        case 'CHANGE_CITY':
          mutation = changeCity;
          break;
        case 'CHANGE_STATE':
          mutation = changeState;
          break;
        case 'CHANGE_ZIP':
          mutation = changeZip;
          break;
        default:
          throw new Error('Unknown mutation type');
      }
      const result = await mutation({ variables });
      // Store the updated field in IndexedDB (not shown here)
      return result;
    } catch (error) {
      console.error('Error updating profile field:', error);
      throw error;
    }
  };

  return {
    userData,
    userLoading,
    userError,
    updateProfileField,
    fetchUserDataFromIndexedDB,
  };
};

export default useDataManagement;
