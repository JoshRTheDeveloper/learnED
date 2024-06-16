import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import jwtDecode from 'jwt-decode';
import './profile.css';
import Sidebar from '../components/sidebar/sidebar';
import temporaryImage from '../assets/noLogo.svg';
import axios from 'axios';
import { GET_USER } from '../utils/queries';
import { storeUserData, storeProfilePicture, getUserData } from '../utils/indexedDB';
import { 
  CHANGE_COMPANY,
  CHANGE_PROFILE_PICTURE,
  CHANGE_STREET_ADDRESS,
  CHANGE_EMAIL,
  CHANGE_CITY,
  CHANGE_STATE,
  CHANGE_ZIP
} from '../utils/mutations';

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

  const token = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.data._id;

  const { loading, error, data } = useQuery(GET_USER, {
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
    const fetchData = async () => {
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
          picturePath = await uploadProfilePicture(renamedFile);
          await storeProfilePicture(userId, picturePath);
          await changeProfilePictureMutation({ variables: { userId, picturePath } });
        }

        await Promise.all([
          changeCompanyMutation({ variables: { userId, company } }),
          changeStreetAddressMutation({ variables: { userId, streetAddress } }),
          changeEmailMutation({ variables: { userId, email } }),
          changeCityMutation({ variables: { userId, city } }),
          changeStateMutation({ variables: { userId, state } }),
          changeZipMutation({ variables: { userId, zip } }),
        ]);
      }

      const updatedUserData = { userId, email, streetAddress, city, state, zip, company, profilePicture: picturePath };
      setUserData(updatedUserData);
      await storeUserData(updatedUserData);

      setCompany(updatedUserData.company || '');
      setEmail(updatedUserData.email || '');
      setStreetAddress(updatedUserData.streetAddress || '');
      setCity(updatedUserData.city || '');
      setState(updatedUserData.state || '');
      setZip(updatedUserData.zip || '');
      setLogo(null);
      setRenamedFile(null);
      setLogoUrl('');

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
        <div className='profile-Id'>
          <div>
            <img src={logoUrl} alt='Uploaded Logo' className='logo-preview' />
          </div>
          <h2 id='profile-h2'>Edit Profile</h2>
          <div className='columns-2'>
            <div className='split3'>
              <br></br>
              <p>Company:</p>
              <br></br>
              <p>Email:</p>
              <br></br>
              <p>Address:</p>
            </div>
            <div className='split4'>
              <br></br>
              <p>{userData?.company}</p>
              <br></br>
              <p>{userData?.email}</p>
              <br></br>
              <p>{userData?.streetAddress}</p>
              <p>{userData?.city} {userData?.state} {userData?.zip}</p>
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
