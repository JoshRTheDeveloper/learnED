import React, { useState, useEffect, useRef } from 'react';
import SignupModal from '../components/signup-modal/modal';
import './dashboard.css';
import Sidebar from '../components/sidebar/sidebar';

const Home = () => {
 

 
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
