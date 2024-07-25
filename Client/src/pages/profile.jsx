import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import jwtDecode from 'jwt-decode';
import './profile.css';
import Sidebar from '../components/sidebar/sidebar';
import temporaryImage from '../assets/noLogo.svg';
import axios from 'axios';
import { GET_USER } from '../utils/queries';
import { useApolloClient } from '@apollo/client';
import {
  storeUserData,
  storeProfilePicture,
  getProfilePicture,
  getUserData,
  addOfflineMutation,
  getOfflineMutations,
  clearOfflineMutation,
  getOfflineMutation

} from '../utils/indexedDB';
import {
  CHANGE_COMPANY,
  CHANGE_PROFILE_PICTURE,
  CHANGE_STREET_ADDRESS,
  CHANGE_EMAIL,
  CHANGE_CITY,
  CHANGE_STATE,
  CHANGE_ZIP,
} from '../utils/mutations';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [email, setEmail] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [company, setCompany] = useState('');
  const [logoUrl, setLogoUrl] = useState(temporaryImage);
  const [blobUrl, setBlobUrl] = useState(temporaryImage);
  const [logo, setLogo] = useState(null);
  const [renamedFile, setRenamedFile] = useState(null);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [initialLoad, setInitialLoad] = useState(true);
  const [url, setUrl] = useState('')
  const client = useApolloClient();

  const token = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.data._id;

  const { loading, data, refetch } = useQuery(GET_USER, {
    variables: { userId: userId || '' },
  });

  const [changeCompanyMutation] = useMutation(CHANGE_COMPANY);
  const [changeProfilePictureMutation] = useMutation(CHANGE_PROFILE_PICTURE);
  const [changeStreetAddressMutation] = useMutation(CHANGE_STREET_ADDRESS);
  const [changeEmailMutation] = useMutation(CHANGE_EMAIL);
  const [changeCityMutation] = useMutation(CHANGE_CITY);
  const [changeStateMutation] = useMutation(CHANGE_STATE);
  const [changeZipMutation] = useMutation(CHANGE_ZIP);

  useEffect(() => {
    const handleOnlineStatusChange = async () => {
      const isOnline = navigator.onLine;
      setOfflineMode(!isOnline);

      if (isOnline) {
        await syncOfflineData();
        refetch();
      } else {
        console.error('Went offline.');
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
    const fetchProfilePicture = async () => {
      try {
        const profilePictureBlob = await getProfilePicture();
        if (profilePictureBlob) {
          const url = URL.createObjectURL(profilePictureBlob);
          setBlobUrl(url);
        }
      } catch (error) {
        console.error('Failed to fetch profile picture from IndexedDB:', error);
      }
    };

    fetchProfilePicture();
  }, []);

  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let userDataFromOnline = null;
        let userDataFromDB = null;
  
        // Check if data is available online
        if (navigator.onLine) {
          userDataFromOnline = data.getUser;
          
        } else {
          // Fetch data from IndexedDB if offline or data is not available online
          userDataFromDB = await getUserData(userId);
          console.log(userDataFromDB)
        }
  
        // Determine which data source to use
        const userData = userDataFromOnline || userDataFromDB.getUser || userDataFromDB;

        if (userData) {
          const { company, email, streetAddress, city, state, zip, profilePicture } = userData;
          setEmail(email);
          setStreetAddress(streetAddress);
          setCity(city);
          setState(state);
          setZip(zip);
          setUserData(userData);
          setCompany(company);
          setLogoUrl(profilePicture || temporaryImage);
        } else {
          console.warn('No user data found');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    fetchData();
  }, [loading, data, userId]);
  

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handleStreetAddressChange = (e) => setStreetAddress(e.target.value);
  const handleCityChange = (e) => setCity(e.target.value);
  const handleCompanyChange = (e) => setCompany(e.target.value);
  const handleStateChange = (e) => setState(e.target.value);
  const handleZipChange = (e) => setZip(e.target.value);

  const handleLogoChange = async (e) => {
    try {
      const file = e.target.files[0];
      if (file) {
        // Create a URL for display purposes (temporary)
        const blobUrl = URL.createObjectURL(file);
        setLogo(file);
        setLogoUrl(blobUrl);
        setUrl(file)

        // Store the file directly in IndexedDB
        await storeProfilePicture(userId, file);
        console.log("Profile picture stored successfully.");
      }
    } catch (error) {
      console.error("An error occurred while storing the profile picture or file:", error);
    }
  };



  


  const syncOfflineData = async () => {
    try {
      const offlineMutations = await getOfflineMutation('CHANGE_PROFILE_PICTURE');
      console.log(offlineMutations)
      for (const { mutation, variables } of offlineMutations) {
        console.log('Processing mutation:', mutation);
      console.log('Initial variables:', variables);
        if (mutation === 'CHANGE_PROFILE_PICTURE') {
          const profilePictureBlob = await getProfilePicture(userId);
          console.log (profilePictureBlob)
          if (profilePictureBlob) {
            const uploadedPicturePath = await uploadProfilePicture(profilePictureBlob);
            console.log('Uploaded picture path:', uploadedPicturePath);
            variables.profilePicture = uploadedPicturePath;
          }
        }
console.log (mutation, variables, '--mutations')
      await executeMutation(offlineMutations);
      }

      clearOfflineMutation();
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  };


  const executeMutation = async (mutations) => {
    try {
      console.log('Stored mutations:', mutations);
  
      if (!Array.isArray(mutations) || mutations.length === 0) {
        console.log('No offline mutations found');
        return;
      }
  
      for (const mutation of mutations) {
        try {
          const { mutation: mutationType, variables, id } = mutation;
  
          if (!mutationType || !variables || !id) {
            console.warn('Malformed mutation object:', mutation);
            continue; 
          }
  
          let result;
          console.log(`Executing mutation type: ${mutationType} with variables:`, variables);
  
          switch (mutationType) {
            case 'CHANGE_PROFILE_PICTURE':
              result = await client.mutate({
                mutation: CHANGE_PROFILE_PICTURE,
                variables,
              });
              console.log('Successfully executed changeProfilePicture mutation:', result);
              break;
  
            default:
              console.warn('Unknown mutation type:', mutationType);
              continue;
          }
  
          // If the mutation is successfully executed, clear it from the offline storage
          await clearOfflineMutations(id);
        } catch (error) {
          console.error(`Error executing stored ${mutation.mutation} mutation:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to get offline mutations:', error);
    }
  };

  const uploadProfilePicture = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('https://invoicinator3000-d580657ecca9.herokuapp.com/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'userId': userId,
        },
      });
      return response.data.fileUrl;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let picturePath = logoUrl;
      let fileUrl = url
      if (navigator.onLine) {
        if (logo) {
          const uploadedPicturePath = await uploadProfilePicture(logo);
          picturePath = uploadedPicturePath;
          console.log(uploadedPicturePath);
        }

        await Promise.all([
          changeCompanyMutation({ variables: { userId, company } }),
          changeStreetAddressMutation({ variables: { userId, streetAddress } }),
          changeEmailMutation({ variables: { userId, email } }),
          changeCityMutation({ variables: { userId, city } }),
          changeStateMutation({ variables: { userId, state } }),
          changeZipMutation({ variables: { userId, zip } }),
          changeProfilePictureMutation({ variables: { userId, profilePicture: picturePath } }),
        ]);

        setUserData({
          userId,
          email,
          streetAddress,
          city,
          state,
          zip,
          company,
          profilePicture: picturePath,
        });

        await storeUserData({
          userId,
          email,
          streetAddress,
          city,
          state,
          zip,
          company,
          profilePicture: picturePath,
        });
      } else {
        const offlineUserData = {
          userId,
          email,
          streetAddress,
          city,
          state,
          zip,
          company,
          profilePicture: picturePath,
        };

        await storeUserData(offlineUserData);

        await Promise.all([
          addOfflineMutation({ mutation: 'CHANGE_COMPANY', variables: { userId, company }, }),
          addOfflineMutation({ mutation: 'CHANGE_STREET_ADDRESS', variables: { userId, streetAddress } }),
          addOfflineMutation({ mutation: 'CHANGE_EMAIL', variables: { userId, email } }),
          addOfflineMutation({ mutation: 'CHANGE_CITY', variables: { userId, city } }),
          addOfflineMutation({ mutation: 'CHANGE_STATE', variables: { userId, state } }),
          addOfflineMutation({ mutation: 'CHANGE_ZIP', variables: { userId, zip } }),
          addOfflineMutation({ mutation: 'CHANGE_PROFILE_PICTURE', variables: { userId, profilePicture: url } }),
        ]);

        if (logo) {
          await storeProfilePicture(userId, logo);
        }
      }

      setEmail(email);
      setStreetAddress(streetAddress);
      setCity(city);
      setState(state);
      setZip(zip);
      setCompany(company);
      setLogo(null);
      setRenamedFile(null);
      setLogoUrl(picturePath);
      setBlobUrl(blobUrl);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div>
      <Sidebar />
      <div className='profile'>
        <div className='profile-Id'>
          <div>
            <img src={navigator.onLine ? logoUrl : blobUrl} alt='Uploaded Logo' className='logo-preview' />
          </div>
          <h2 id='profile-h2'>Edit Profile</h2>
          <div className='columns-2'>
            <div className='split3'>
              <br />
              <p>Company:</p>
              <br />
              <p>Email:</p>
              <br />
              <p>Address:</p>
            </div>
            <div className='split4'>
              <br />
              <p>{company}</p>
              <br />
              <p>{email}</p>
              <br />
              <p>{streetAddress}</p>
              <p>{city} {state} {zip}</p>
            </div>
          </div>
        </div>
        <div className='form1'>
          <form onSubmit={handleSubmit}>
            <div className='fields'>
              <label className='labels'>Company:</label>
              <input className='inputs' type="text" value={company} onChange={handleCompanyChange} />
            </div>
            <div className='fields'>
              <label className='labels'>Email:</label>
              <input className='inputs' type="email" value={email} onChange={handleEmailChange} />
            </div>
            <div className='fields'>
              <label className='labels'>Address:</label>
              <input className='inputs' type="text" placeholder="Enter Address" value={streetAddress} onChange={handleStreetAddressChange} />
            </div>
            <div className='fields'>
              <label className='labels'>City:</label>
              <input className='inputs' type="text" placeholder="Enter City" value={city} onChange={handleCityChange} />
            </div>
            <div className='fields'>
              <label className='labels'>State:</label>
              <input className='inputs' type="text" placeholder="Enter State" value={state} onChange={handleStateChange} />
            </div>
            <div className='fields'>
              <label className='labels'>Zip:</label>
              <input className='inputs' type="text" placeholder="Enter Zip" value={zip} onChange={handleZipChange} />
            </div>
            <div className='fields'>
              <label className='labels'>Logo:</label>
                  {offlineMode ? (
                  <p className='parOffline'> Logo upload is not available offline.</p>
                  ) : (
                    <input className='inputs1' type="file" accept="image/*" onChange={handleLogoChange} />
                  )}
</div>
            <button className='submit-button' type="submit">Submit</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
