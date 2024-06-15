import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import Auth from "../../utils/auth";
import { CREATE_USER } from '../../utils/mutations'; 
import './modal.css';
import { getUserData, storeUserData, storeAuthData, storeLoginCredentials } from '../../utils/indexedDB';

const SignupModal = ({ isOpen, onClose }) => {
  const [formState, setFormState] = useState({ company: '', email: '', password: '', confirmPassword: '', firstName: '', lastName: '' });
  const [addUser, { error }] = useMutation(CREATE_USER); 
  const [successMessage, setSuccessMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {
      if (formState.password !== formState.confirmPassword) {
        throw new Error('Passwords do not match.');
      }
  
      const passwordRegex = /^(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
  
      if (!passwordRegex.test(formState.password)) {
        throw new Error('Password must contain at least 8 characters and a special character.');
      }
  
      
      await storeUserData({
        company: formState.company,
        email: formState.email,
        password: formState.password,
        firstName: formState.firstName,
        lastName: formState.lastName,
      });

     
      await storeLoginCredentials(formState.email, formState.password);

      setSuccessMessage('Thank You! Signup was successful!');
      setSubmitted(true);
  
      if (navigator.onLine) {
        await syncUserDataWithServer();
      }
    } catch (err) {
      console.error(err);
      setSuccessMessage('');
      setSubmitted(false);
    }
  };
  
  const syncUserDataWithServer = async () => {
    try {
      const userData = await getUserData();
  
      const { data } = await addUser({
        variables: {
          company: userData.company,
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
      });
  
      const token = data.createUser.token;
      await storeAuthData(token, userData[0]);
      Auth.login(token);
      setSuccessMessage('Thank You! Signup was successful!');
      setSubmitted(true);
      
    } catch (error) {
      console.error('Error syncing user data with server:', error);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    let updatedValue = value;
  
    if (name === 'firstName' || name === 'lastName') {
      updatedValue = value.replace(/\b\w/g, (char) => char.toUpperCase());
    } else if (name === 'email') {
      updatedValue = value.toLowerCase();
    }
  
    setFormState({
      ...formState,
      [name]: updatedValue,
    });
  };

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`} id="signUpModal">
      <div className="modal-content p-4 d-flex dark-background justify-content-end">
        <button className="close-button" onClick={onClose}>
          X
        </button>

        <h2 className='text-center gold-text my-3'>Signup</h2>
        {submitted && successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
        {!submitted && (
          <form onSubmit={handleFormSubmit}>
            <div className="d-flex justify-content-end">
              <div className='company-input'>
                <label htmlFor="company" className='me-3 light-text'>Company:</label>
                <p className='require'> (Not Required)</p>
              </div>
              <input
                placeholder="Company"
                name="company"
                type="text"
                id="company"
                value={formState.company}
                onChange={handleChange}
                required
              />
            </div>
          
            <div className="d-flex justify-content-end">
              <label htmlFor="firstName" className='me-3 light-text'>First Name:</label>
              <input
                placeholder="First"
                name="firstName"
                type="text"
                id="firstName"
                value={formState.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="d-flex justify-content-end">
              <label htmlFor="lastName" className='me-3 light-text'>Last Name:</label>
              <input
                placeholder="Last"
                name="lastName"
                type="text" 
                id="lastName"
                value={formState.lastName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="d-flex justify-content-end ms-5">
              <label htmlFor="email" className='me-3 light-text'>Email:</label>
              <input
                placeholder="youremail@test.com"
                name="email"
                type="email"
                id="email"
                value={formState.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="d-flex justify-content-end">
              <label htmlFor="password" className='mx-3 light-text'>Password:</label>
              <input
                placeholder="******"
                name="password"
                type="password"
                id="password"
                value={formState.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="d-flex justify-content-end">
              <label htmlFor="confirmPassword" className='mx-3 confirm light-text'>Confirm Password:</label>
              <input
                placeholder="******"
                name="confirmPassword"
                type="password"
                id="confirmPassword"
                value={formState.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            <p className='password'> Password must contain at least a capital, 8 characters and a special character.</p>
            <div className="my-2 d-flex justify-content-end">
              <button className='btn gold-background btn-dark' type="submit">Submit</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignupModal;
