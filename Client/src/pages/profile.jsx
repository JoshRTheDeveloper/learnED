import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import jwtDecode from 'jwt-decode';
import './profile.css';
import Sidebar from '../components/sidebar/sidebar';
import temporaryImage from '../assets/noLogo.svg';
import { CHANGE_PROFILE_PICTURE, CHANGE_ADDRESS, CHANGE_EMAIL } from '../utils/mutations';
import {GET_USER} from '../utils/queries';

const Profile = () => {
  // State variables for user data, email, address, and logo
  const [userData, setUserData] = useState(null);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const token = localStorage.getItem('authToken'); // Assuming the token is stored in localStorage
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.data._id;


  const { loading, error, data } = useQuery(GET_USER, {
    variables: { userId: userId || '' }, // Provide the user ID as a variable to the query
  });





  // Mutation hooks
  const [changeProfilePicture] = useMutation(CHANGE_PROFILE_PICTURE);
  const [changeAddress] = useMutation(CHANGE_ADDRESS);
  const [changeEmail] = useMutation(CHANGE_EMAIL);

  // Fetch user data when component mounts
  useEffect(() => {
    if (!loading && data && data.getUser) {
      const { email, address, profilePicture } = data.getUser;
      setEmail(email);
      setAddress(address);
      setLogoUrl(profilePicture ? profilePicture : temporaryImage);
      setUserData(data.getUser);
    }
  }, [loading, data]);

  // Function to handle email change
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  // Function to handle address change
  const handleAddressChange = (e) => {
    setAddress(e.target.value);
  };

  // Function to handle logo change
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    // Set the logo state
    setLogo(file);
    // Generate a URL for the uploaded image and set it as the source for the logo preview
    setLogoUrl(URL.createObjectURL(file));
  };

  // Function to handle form submission
// Function to handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // Initialize an empty object to hold mutation variables
    const variables = { userId };

    

    // If address is changed, add it to the mutation variables
    if (address) {
      variables.address = address;
    }

    // If email is changed, add it to the mutation variables
    if (email) {
      variables.email = email;
    }

    // Perform mutations to update user's profile
    await changeAddress({ variables });
    await changeEmail({ variables });

    // Refresh user data after mutation
    setUserData({ ...userData, email, address, profilePicture: logo });

    // Clear the form fields after submission
    setEmail('');
    setAddress('');
    setLogo('');
    setLogoUrl('');
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
