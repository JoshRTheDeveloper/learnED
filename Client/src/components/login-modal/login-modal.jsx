import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import Auth from "../../utils/auth";
import { LOGIN_USER } from '../../utils/mutations';
import { getUserData } from '../../utils/indexedDB';
import './login-modal.css';

const LoginModal = ({ isOpen, onClose }) => {
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [loginUser, { error }] = useMutation(LOGIN_USER);
  const [submitted, setSubmitted] = useState(false);

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {
      const encryptedUserData = await getUserData();
      
      if (encryptedUserData) {
        const { email, password } = encryptedUserData;
        console.log('Decrypted Email:', email);
        console.log('Decrypted Password:', password);
  
        if (formState.email === email && formState.password === password) {
          const mutationResponse = await loginUser({
            variables: {
              email: formState.email,
              password: formState.password,
            },
          });
  
          const token = mutationResponse.data.loginUser.token;
          Auth.login(token);
  
          setFormState({ email: '', password: '' });
          setSubmitted(true);
        } else {
          setSubmitted(false);
          console.error('Invalid credentials');
        }
      } else {
        console.error('No user data found in IndexedDB');
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
