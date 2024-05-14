import React, { useState, useEffect, useRef } from 'react';
import SignupModal from '../components/signup-modal/modal';
import { useQuery, useMutation } from '@apollo/client';
import './dashboard.css';
import Sidebar from '../components/sidebar/sidebar';
import jwtDecode from 'jwt-decode';
import { GET_USER } from '../utils/queries';


const Home = () => {
 

  const token = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.data._id;

  const { loading, error, data } = useQuery(GET_USER, {
    variables: { userId: userId || '' },
  });

  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const toggleSignupModal = () => {
    setIsSignupModalOpen(!isSignupModalOpen);
  };


  
  return (
    <>
    
    <div className="app">
      <Sidebar />
      <div className="main-content">
        {/* Your main content goes here */}
      </div>
    </div>

    <div className='total'>

     <div className='row'> 
     <h2>Invoices Due</h2>
     </div>

     <div className='row'>
     <h2>Invoices Paid</h2>
     </div>
    

    </div>

    </>
  );
};

export default Home;
