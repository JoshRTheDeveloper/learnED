import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Auth from '../utils/auth'

import './home.css';


const Home = () => {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (Auth.loggedIn()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const toggleSignupModal = () => {
    setIsSignupModalOpen(!isSignupModalOpen);
  };


  
  return (
    <>
    

    <div className='main'>
      <div className='div2'>
        <div className='blue'>
          <h3>Abc Game</h3>
        </div>
        <div className='green'>
          <h3>Abc Draw Game</h3>
        </div>



</div>

    </div>
       
    </>
  );
};

export default Home;
