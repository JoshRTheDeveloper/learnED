import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import jwtDecode from 'jwt-decode';
import './profile.css';
import Sidebar from '../components/sidebar/sidebar';
import temporaryImage from '../assets/noLogo.svg';
import { CHANGE_COMPANY, CHANGE_PROFILE_PICTURE, CHANGE_STREET_ADDRESS, CHANGE_EMAIL, CHANGE_CITY, CHANGE_STATE, CHANGE_ZIP } from '../utils/mutations';
import { GET_USER } from '../utils/queries';
import axios from 'axios';
import { storeUserData, storeProfilePicture, getProfilePicture, getUserData } from '../utils/indexedDB';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [email, setEmail] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [logo, setLogo] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [company, setCompany] = useState('');
  const [renamedFile, setRenamedFile] = useState(null);

  const token = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.data._id;

  const { loading, error, data } = useQuery(GET_USER, {
    variables: { userId: userId || '' },
    skip: !navigator.onLine, 
  });

  const [changeProfilePicture] = useMutation(CHANGE_PROFILE_PICTURE);
  const [changeStreetAddressMutation] = useMutation(CHANGE_STREET_ADDRESS);
  const [changeEmailMutation] = useMutation(CHANGE_EMAIL);
  const [changeCityMutation] = useMutation(CHANGE_CITY);
  const [changeStateMutation] = useMutation(CHANGE_STATE);
  const [changeZipMutation] = useMutation(CHANGE_ZIP);
  const [changeCompanyMutation] = useMutation(CHANGE_COMPANY);

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
          const blob = await getProfilePicture(userId);
          setLogo(blob || temporaryImage);
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
        storeUserData({ userId, company, email, streetAddress, city, state, zip, profilePicture });
        const blob = await getProfilePicture(userId);
        setLogo(blob || temporaryImage);
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
      const variables = { userId, streetAddress, email, company, city, state, zip };
      if (logo) {
        const picturePath = await uploadProfilePicture(renamedFile);
        await changeProfilePicture({
          variables: { userId, profilePicture: picturePath },
        });
        await storeProfilePicture(userId, picturePath);
      }
      await Promise.all([
        changeStreetAddressMutation({ variables }),
        changeEmailMutation({ variables }),
        changeCityMutation({ variables }),
        changeStateMutation({ variables }),
        changeZipMutation({ variables }),
        changeCompanyMutation({ variables }),
      ]);

      const updatedUserData = { ...userData, email, streetAddress, city, state, zip, profilePicture: renamedFile.name };
      setUserData(updatedUserData);
      storeUserData(updatedUserData);
      setCompany('');
      setEmail('');
      setStreetAddress('');
      setCity('');
      setState('');
      setZip('');
      setLogo(null);
      setLogoUrl('');
      window.location.reload();
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
            <img src={logoUrl || temporaryImage} alt='Uploaded Logo' className='logo-preview' />
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
              <input className='inputs' type="company" value={company || ''} onChange={handleCompanyChange} />
            </div>
            <div className='fields'>
              <label className='labels'>Email:</label>
              <input className='inputs' type="email" value={email || ''} onChange={handleEmailChange} />
            </div>
            <div className='fields'>
              <label className='labels'>Address:</label>
              <input className='inputs' type="text" placeholder="Enter Address" value={streetAddress || ''} onChange={handleStreetAddressChange} />
            </div>
            <div className='fields'>
              <label className='labels'>City:</label>
              <input className='inputs' type="text" placeholder="Enter City" value={city || ''} onChange={handleCityChange} />
            </div>
            <div className='fields'>
              <label className='labels'>State:</label>
              <input className='inputs' type="text" placeholder="Enter State" value={state || ''} onChange={handleStateChange} />
            </div>
            <div className='fields'>
              <label className='labels'>Zip:</label>
              <input className='inputs' type="text" placeholder="Enter Zip" value={zip || ''} onChange={handleZipChange} />
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
