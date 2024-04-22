import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import Auth from "../../utils/auth";
import { CREATE_USER } from '../../utils/mutations'; 
import './modal.css';

const SignupModal = ({ isOpen, onClose }) => {
  const [formState, setFormState] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [addUser, { error }] = useMutation(CREATE_USER); 
  const [successMessage, setSuccessMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await addUser({
        variables: {
          email: formState.email,
          password: formState.password,
          firstName: formState.firstName,
          lastName: formState.lastName,
        },
      });
      const token = data.createUser.token;
      Auth.login(token);
      setSuccessMessage('Thank You! Signup was successful!');
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setSuccessMessage('');
      setSubmitted(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState({
      ...formState,
      [name]: value,
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
              <label htmlFor="firstName" className='me-3 light-text'>First Name:</label>
              <input
                placeholder="First"
                name="firstName"
                type="text"
                id="firstName"
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
                onChange={handleChange}
                required
              />
            </div>
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
