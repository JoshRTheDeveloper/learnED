import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import Auth from "../../utils/auth";
import { LOGIN_USER } from '../../utils/mutations';
import { GET_USER } from '../../utils/queries';
import './login-modal.css';
import { getUserData, storeProfilePicture, storeUserData } from '../../utils/indexedDB'; 

const LoginModal = ({ isOpen, onClose }) => {
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [loginUser, { error }] = useMutation(LOGIN_USER);
  const [submitted, setSubmitted] = useState(false);
  const { data: userData, refetch } = useQuery(GET_USER, {
    skip: true, 
  });
  
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await loginUser({
        variables: {
          email: formState.email,
          password: formState.password,
        },
      });
  
      if (data && data.loginUser) {
        const token = data.loginUser.token;
        Auth.login(token);
  
        setFormState({ email: '', password: '' });
        setSubmitted(true);

        const userId = data.loginUser.user._id;
        const { data: userFullData } = await refetch({ userId });
  

        await storeUserData(userFullData);

        const userDataFromDB = await getUserData(userId);

  

        const profilePictureUrl = userFullData.getUser.profilePicture;
  
        if (profilePictureUrl) {

          const response = await fetch(profilePictureUrl);
          const profilePictureBlob = await response.blob();
  

          await storeProfilePicture(userId, profilePictureBlob);
  
        } else {
          console.warn('No profile picture found in user data.');
        }
  
        onClose();
      } else {
        console.error('Login mutation did not return expected data structure:', data);
        setSubmitted(false);
      }
    } catch (err) {
      console.error('Error occurred during login:', err);
      setSubmitted(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const updatedValue = name === 'email' ? value.toLowerCase() : value;
    setFormState({
      ...formState,
      [name]: updatedValue,
    });
  };

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`} id="LoginModal">
      <div className="modal-content p-4 d-flex dark-background justify-content-end">
        <button className="close-button" onClick={onClose}>
          X
        </button>
  
        <h2 className='text-center gold-text my-3'>Login</h2>
        {submitted && (
          <div className="success-message">Login successful!</div>
        )}
        {!submitted && (
          <form onSubmit={handleFormSubmit}>
            <div className="d-flex justify-content-end">
              <label htmlFor="email" className='me-3 light-text'>Email:</label>
              <input
                placeholder="youremail@test.com"
                name="email"
                type="email"
                id="email-input"
                onChange={handleChange}
              />
            </div>
            <div className="d-flex justify-content-end">
              <label htmlFor="password" className='mx-3 light-text'>Password:</label>
              <input
                placeholder="******"
                name="password"
                type="password"
                id="password-input"
                onChange={handleChange}
              />
            </div>
            <div className="my-2 d-flex justify-content-end">
              <button className='btn gold-background btn-dark' type="submit">Login</button>
            </div>
          </form>
        )}
        {error && (
          <div className="error-message">Invalid credentials. Please try again.</div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
