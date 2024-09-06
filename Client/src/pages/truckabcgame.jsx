import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Auth from '../utils/auth'
import './truckabcgame.css';


const Truck = () => {
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
    

    <div className='main-truck'>
      <div className='truck'>
        <h1>truck</h1>
      </div>

    </div>
       
    </>
  );
};

export default Truck;
