import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import jwtDecode from 'jwt-decode';
import './profile.css';
import Sidebar from '../components/sidebar/sidebar';
import temporaryImage from '../assets/noLogo.svg';
import { CHANGE_PROFILE_PICTURE, CHANGE_ADDRESS, CHANGE_EMAIL } from '../utils/mutations';
import { GET_USER } from '../utils/queries';
import axios from 'axios'; // Import axios for making HTTP requests


const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [filename, setFilename] = useState('');
  const [renamedFile, setRenamedFile] = useState(null); // Add renamedFile state

  const token = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.data._id;

  const { loading, error, data } = useQuery(GET_USER, {
    variables: { userId: userId || '' },
  });

  const [changeProfilePicture] = useMutation(CHANGE_PROFILE_PICTURE);
  const [changeAddress] = useMutation(CHANGE_ADDRESS);
  const [changeEmail] = useMutation(CHANGE_EMAIL);

  useEffect(() => {
    if (!loading && data && data.getUser) {
      const { email, address, profilePicture } = data.getUser;
      
      setEmail(email);
      setAddress(address);
      setLogoUrl(profilePicture ? `http://localhost:3001${profilePicture}` : temporaryImage);
      setUserData(data.getUser);
    }
  }, [loading, data]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
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

    if (address) {
      variables.address = address;
    }
    if (email) {
      variables.email = email;
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
      changeAddress({ variables }),
      changeEmail({ variables }),
    ]);
    setUserData({ ...userData, email, address, profilePicture: renamedFile });
    setEmail('');
    setAddress('');
    setLogo('');
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
            <img src={logoUrl} alt='Uploaded Logo' className='logo-preview' />
          </div>
          <h2 id='profile-h2'>Edit Profile</h2>
          <div>
            <p>Email: {userData?.email}</p>
            <p>Address: {userData?.address}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Email:</label>
            <input type="email" value={email || ''} onChange={handleEmailChange} />
          </div>
          <div>
            <label>Address:</label>
            <input type="text" value={address || ''} onChange={handleAddressChange} />
          </div>
          <div>
            <label>Logo:</label>
            <input type="file" accept="image/*" onChange={handleLogoChange} />
          </div>
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
