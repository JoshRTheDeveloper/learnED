import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import jwtDecode from 'jwt-decode';
import './profile.css';
import Sidebar from '../components/sidebar/sidebar';
import temporaryImage from '../assets/noLogo.svg';
import axios from 'axios';
import { GET_USER } from '../utils/queries';
import {
  storeUserData,
  storeProfilePicture,
  getProfilePicture,
  getUserData,
  addOfflineMutation,
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
  const [imageSrc, setImageSrc] = useState('');

  const token = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.data._id;

  const { loading, data, refetch } = useQuery(GET_USER, {
    variables: { userId: userId || '' },
    skip: !navigator.onLine || !initialLoad,
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
        setImageSrc(logoUrl);
        refetch();
      } else {
        setImageSrc(blobUrl);
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
          setBlobUrl(profilePictureBlob);
        }
      } catch (error) {
        console.error('Failed to fetch profile picture from IndexedDB:', error);
      }
    };

    fetchProfilePicture();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (initialLoad) {
        try {
          let userDataFromDB;

          if (navigator.onLine && !loading && data && data.getUser) {
            userDataFromDB = data.getUser;
          } else {
            userDataFromDB = await getUserData(userId);
          }

          if (userDataFromDB) {
            const { company, email, streetAddress, city, state, zip, profilePicture } = userDataFromDB;
            setEmail(email);
            setStreetAddress(streetAddress);
            setCity(city);
            setState(state);
            setZip(zip);
            setUserData(userDataFromDB);
            setCompany(company);
            setLogoUrl(profilePicture || temporaryImage);
          } else {
            console.error('No offline data found.');
          }

          setInitialLoad(false);
          console.log('Fetched data from IndexedDB:', userDataFromDB);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchData();
  }, [loading, data, userId, initialLoad]);

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handleStreetAddressChange = (e) => setStreetAddress(e.target.value);
  const handleCityChange = (e) => setCity(e.target.value);
  const handleCompanyChange = (e) => setCompany(e.target.value);
  const handleStateChange = (e) => setState(e.target.value);
  const handleZipChange = (e) => setZip(e.target.value);

  const handleLogoChange = async (e) => {
    try {
      const file = e.target.files[0];
      const blobUrl = URL.createObjectURL(file);
      setLogo(file);
      setLogoUrl(blobUrl);
      setBlobUrl(blobUrl);

      const filename = `${userId}_profile_picture.jpg`;
      const renamedFile = new File([file], filename, { type: file.type });
      setRenamedFile(renamedFile);

      await storeProfilePicture(userId, blobUrl);
      console.log("Profile picture stored successfully.");
    } catch (error) {
      console.error("An error occurred while storing the profile picture or file:", error);
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
      if (navigator.onLine) {
        if (logo) {
          const uploadedPicturePath = await uploadProfilePicture(renamedFile);
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
          addOfflineMutation({ mutation: 'CHANGE_COMPANY', variables: { userId, company },}),
          addOfflineMutation({ mutation: 'CHANGE_STREET_ADDRESS', variables: { userId, streetAddress } }),
          addOfflineMutation({ mutation: 'CHANGE_EMAIL', variables: { userId, email } }),
          addOfflineMutation({ mutation: 'CHANGE_CITY', variables: { userId, city } }),
          addOfflineMutation({ mutation: 'CHANGE_STATE', variables: { userId, state } }),
          addOfflineMutation({ mutation: 'CHANGE_ZIP', variables: { userId, zip } }),
          addOfflineMutation({ mutation: 'CHANGE_PROFILE_PICTURE', variables: { userId, profilePicture: picturePath } }),
        ]);

        if (logo) {
          await storeProfilePicture(userId, logoUrl);
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
            <img src={imageSrc} alt='Uploaded Logo' className='logo-preview' />
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
              <input className='inputs1' type="file" accept="image/*" onChange={handleLogoChange} />
            </div>
            <button className='submit-button' type="submit">Submit</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
