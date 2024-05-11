import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import jwtDecode from 'jwt-decode';
import './profile.css';
import Sidebar from '../components/sidebar/sidebar';
import temporaryImage from '../assets/noLogo.svg';
import {  CHANGE_COMPANY, CHANGE_PROFILE_PICTURE, CHANGE_STREET_ADDRESS, CHANGE_EMAIL, CHANGE_CITY, CHANGE_STATE, CHANGE_ZIP } from '../utils/mutations';
import { GET_USER } from '../utils/queries';
import axios from 'axios'; 

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [email, setEmail] = useState('');
  const [streetAddress, setStreetAddress] = useState(''); 
  const [fileName, setFilename] = useState ('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [logo, setLogo] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [company, setCompany] = useState('');
  const [renamedFile, setRenamedFile] = useState(null); 


  const token = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.data._id;

  const { loading, error, data } = useQuery(GET_USER, {
    variables: { userId: userId || '' },
  });

  const [changeProfilePicture] = useMutation(CHANGE_PROFILE_PICTURE);
  const [changeStreetAddress] = useMutation(CHANGE_STREET_ADDRESS);
  const [changeEmail] = useMutation(CHANGE_EMAIL);
  const [changeCity] = useMutation(CHANGE_CITY);
  const [changeState] = useMutation(CHANGE_STATE);
  const [changeZip] = useMutation(CHANGE_ZIP);
  const [changeCompany] = useMutation(CHANGE_COMPANY);

  useEffect(() => {
    if (!loading && data && data.getUser) {
      const {company, email, streetAddress, city, state, zip, profilePicture } = data.getUser; 
      
      setEmail(email);
      setStreetAddress(streetAddress);
      setCity(city);
      setState(state);
      setZip(zip);
      setLogoUrl(profilePicture ? `http://localhost:3001${profilePicture}` : temporaryImage);
      setUserData(data.getUser);
      setCompany(company);
    }
  }, [loading, data]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleStreetAddressChange = (e) => { 
    setStreetAddress(e.target.value); 
  };

  const handleCityChange = (e) => {
    setCity(e.target.value);
  };

  const handleCompanyChange = (e) => {
    setCompany(e.target.value);
  };


  const handleStateChange = (e) => {
    setState(e.target.value);
  };

  const handleZipChange = (e) => {
    setZip(e.target.value);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogo(file);
    setLogoUrl(URL.createObjectURL(file));
    
    
    const filename = `${userId}_profile_picture.jpg`;
    setFilename(filename);
    
    
    const renamedFile = new File([file], filename, { type: file.type });
    setRenamedFile(renamedFile); 
  };
  
  const uploadProfilePicture = async (file) => {
    try {
        const formData = new FormData();
        
      
        formData.append('file', file);
        
        const token = localStorage.getItem('authToken');
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.data._id; 
        
       
        const response = await axios.post('http://localhost:3001/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'userId': userId 
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
    const token = localStorage.getItem('authToken');
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.data._id; 

    const variables = { userId }; 

    if (streetAddress) { 
      variables.streetAddress = streetAddress; 
    }
    if (email) {
      variables.email = email;
    }

    if (company) {
      variables.company = company;
    }

    if (city) {
      variables.city = city;
    }
    if (state) {
      variables.state = state;
    }
    if (zip) {
      variables.zip = zip;
    }
    if (logo) {
      const picturePath = await uploadProfilePicture(renamedFile); 
 
      await changeProfilePicture({
        variables: {
          userId, 
          profilePicture: picturePath,
        },
      });
    }
    await Promise.all([
      changeStreetAddress({ variables }), 
      changeEmail({ variables }),
      changeCity({ variables }),
      changeState({ variables }),
      changeZip({ variables }),
      changeCompany({ variables })
    ]);
    setUserData({ ...userData, email, streetAddress, city, state, zip, profilePicture: renamedFile }); 'streetAddress'
    setEmail('');
    setStreetAddress(''); 
    setCity('');
    setState('');
    setZip('');
    setLogo('');
    setLogoUrl('');
    setCompany('');
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

          <p> {userData?.email}</p>
          <br></br>

          <p> {userData?.streetAddress}</p> 
          <p> {userData?.city}, {userData?.state} {userData?.zip} </p>
          </div>
          </div>
        </div>
        <div className='form1'>
        <form onSubmit={handleSubmit}>
          <div className='fields'>
            <label className='labels'>Company::</label>
            <input className='inputs' type="company" value={company || ''} onChange={handleCompanyChange} />
          </div>
          <div className='fields'>
            <label className='labels'>Email:</label>
            <input className='inputs' type="email" value={email || ''} onChange={handleEmailChange} />
          </div>
          <div className='fields'>
            <label className='labels'>Address:</label>
            <input className='inputs' type="text" value={streetAddress || ''} onChange={handleStreetAddressChange} /> 
          </div>
          <div className='fields'>
            <label className='labels'>City:</label>
            <input className='inputs'  type="text" value={city || ''} onChange={handleCityChange} />
          </div>
          <div className='fields'>
            <label className='labels'>State:</label>
            <input className='inputs'  type="text" value={state || ''} onChange={handleStateChange} />
          </div>
          <div className='fields'>
            <label className='labels'>Zip:</label>
            <input className='inputs'  type="text" value={zip || ''} onChange={handleZipChange} />
          </div>
          <div className='fields'>
            <label className='labels'>Logo:</label>
            <input className='inputs1'  type="file" accept="image/*" onChange={handleLogoChange} />
          </div>
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
    </div>
  );
};

export default Profile;
