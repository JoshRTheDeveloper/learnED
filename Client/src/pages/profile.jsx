import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import jwtDecode from 'jwt-decode';
import './profile.css';
import Sidebar from '../components/sidebar/sidebar';
import temporaryImage from '../assets/noLogo.svg';
import axios from 'axios';
import { GET_USER } from '../utils/queries';
import { 
  CHANGE_COMPANY,
  CHANGE_PROFILE_PICTURE,
  CHANGE_STREET_ADDRESS,
  CHANGE_EMAIL,
  CHANGE_CITY,
  CHANGE_STATE,
  CHANGE_ZIP
} from '../utils/mutations';
import { 
  storeUserData,
  storeProfilePicture,
  getUserData,
  getProfilePicture
} from '../utils/indexedDB';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [email, setEmail] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [logo, setLogo] = useState(null);
  const [logoUrl, setLogoUrl] = useState(temporaryImage);
  const [company, setCompany] = useState('');
  const [renamedFile, setRenamedFile] = useState(null);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine); // Initial offline check

  const token = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.data._id;

  const { loading, error, data, refetch } = useQuery(GET_USER, {
    variables: { userId: userId || '' },
    skip: !navigator.onLine,
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
      setOfflineMode(!navigator.onLine);

      if (!offlineMode && navigator.onLine) {
        await syncWithServer();
      }
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [offlineMode]);

  const syncWithServer = async () => {
    try {
      const offlineUserData = await getUserData(userId);
      const offlineProfilePicture = await getProfilePicture(userId);

      if (offlineUserData) {
        const { company, email, streetAddress, city, state, zip, profilePicture } = offlineUserData;
        const onlineUserData = data?.getUser;

        const isDifferent =
          onlineUserData.company !== company ||
          onlineUserData.email !== email ||
          onlineUserData.streetAddress !== streetAddress ||
          onlineUserData.city !== city ||
          onlineUserData.state !== state ||
          onlineUserData.zip !== zip ||
          onlineUserData.profilePicture !== profilePicture;

        if (isDifferent) {
          await Promise.all([
            changeCompanyMutation({ variables: { userId, company } }),
            changeStreetAddressMutation({ variables: { userId, streetAddress } }),
            changeEmailMutation({ variables: { userId, email } }),
            changeCityMutation({ variables: { userId, city } }),
            changeStateMutation({ variables: { userId, state } }),
            changeZipMutation({ variables: { userId, zip } }),
            changeProfilePictureMutation({ variables: { userId, profilePicture } }),
          ]);

          await storeUserData({
            userId,
            email,
            streetAddress,
            city,
            state,
            zip,
            company,
            profilePicture,
          });

          refetch();
        }
      }
    } catch (error) {
      console.error('Error syncing data with server:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!navigator.onLine) {
          const offlineData = await getUserData(userId);
          if (offlineData) {
            const { company, email, streetAddress, city, state, zip, profilePicture } = offlineData;
            setEmail(email);
            setStreetAddress(streetAddress);
            setCity(city);
            setState(state);
            setZip(zip);
            setUserData(offlineData);
            setCompany(company);
            setLogoUrl(profilePicture || temporaryImage);
          }
        } else if (!loading && data && data.getUser) {
          const { company, email, streetAddress, city, state, zip, profilePicture } = data.getUser;
          setEmail(email);
          setStreetAddress(streetAddress);
          setCity(city);
          setState(state);
          setZip(zip);
          setUserData(data.getUser);
          setCompany(company);
          setLogoUrl(profilePicture || temporaryImage);

          await storeUserData({
            userId,
            company,
            email,
            streetAddress,
            city,
            state,
            zip,
            profilePicture
          });
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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogo(file);
    setLogoUrl(URL.createObjectURL(file));
    const filename = `${userId}_profile_picture.jpg`;
    setRenamedFile(new File([file], filename, { type: file.type }));
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

      if (navigator.onLine) {
        if (logo) {
          const uploadedPicturePath = await uploadProfilePicture(renamedFile);
          picturePath = uploadedPicturePath;
          await storeProfilePicture(userId, picturePath);
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

        await storeUserData({ userId, email, streetAddress, city, state, zip, company, profilePicture: picturePath });
      } else {
        const offlineUserData = {
          userId,
          email,
          streetAddress,
          city,
          state,
          zip,
          company,
          profilePicture: picturePath
        };

        await storeUserData(offlineUserData);

        if (logo) {
          await storeProfilePicture(userId, picturePath);
        }
      }

      setUserData({ userId, email, streetAddress, city, state, zip, company, profilePicture: picturePath });
      setCompany(company);
      setEmail(email);
      setStreetAddress(streetAddress);
      setCity(city);
      setState(state);
      setZip(zip);
      setLogo(null);
      setRenamedFile(null);
      setLogoUrl(picturePath); 

    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  useEffect(() => {
    if (userData) {
      setEmail(userData.email || '');
      setStreetAddress(userData.streetAddress || '');
      setCity(userData.city || '');
      setState(userData.state || '');
      setZip(userData.zip || '');
      setCompany(userData.company || '');
      setLogoUrl(userData.profilePicture || temporaryImage);
    }
  }, [userData]);

  return (   
    <div>
      <Sidebar />
      <div className='profile'>
        <div className='content'>
          <form onSubmit={handleSubmit}>
            <h1>Profile</h1>
            <div>
              <label>Email</label>
              <input type='email' value={email} onChange={handleEmailChange} required />
            </div>
            <div>
              <label>Street Address</label>
              <input type='text' value={streetAddress} onChange={handleStreetAddressChange} required />
            </div>
            <div>
              <label>City</label>
              <input type='text' value={city} onChange={handleCityChange} required />
            </div>
            <div>
              <label>State</label>
              <input type='text' value={state} onChange={handleStateChange} required />
            </div>
            <div>
              <label>Zip</label>
              <input type='text' value={zip} onChange={handleZipChange} required />
            </div>
            <div>
              <label>Company</label>
              <input type='text' value={company} onChange={handleCompanyChange} required />
            </div>
            <div>
              <label>Profile Picture</label>
              <input type='file' accept='image/*' onChange={handleLogoChange} />
              <img src={logoUrl} alt='Profile' className='logo' />
            </div>
            <button type='submit'>Save</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
