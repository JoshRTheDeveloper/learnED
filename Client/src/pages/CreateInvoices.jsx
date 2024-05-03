import React, { useState, useEffect, useRef } from 'react';
import SignupModal from '../components/signup-modal/modal';
import './CreateInvoices.css';
import Sidebar from '../components/sidebar/sidebar';
import Auth from "../utils/auth";

const CreateInvoices = () => {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const toggleSignupModal = () => {
    setIsSignupModalOpen(!isSignupModalOpen);
  };



  
  const [userFirstName, setUserFirstName] = useState("");
  useEffect(() => {
   const fetchUserFirstName = async () => {
     const profile = Auth.getProfile();
  
     if (profile && profile.data.firstName) {
       setUserFirstName(profile.data.firstName);
     }
   };
   fetchUserFirstName();
  }, []);

  const user = {
    email: userFirstName,
    name: 'John Doe',
    address: '123 Main Street',
    city: 'Anytown, USA'
  };




  return (
    <>
      <div className="app">
        <Sidebar />

        <div className="center-content">
          <div className="container center-content bg-app-grey" id="main-create-container">
            <a href="/dashboard" className="bg-app-blue mt-2 mr-2 p-2 app-button-flat text-app-black">
              <b>← to Dashboard</b>
            </a>
        
            <form className="form">
              <div className='invoice-details'>
                <h3 className='invoice-h3'>Create Invoice</h3>
              </div>
              <div className='line'></div>
              <div className='input'>
                <label className="label font-casmono" htmlFor="invoice-num">Invoice#:</label>
                <input type="text" placeholder="1234ABCD" id="invoice-num" maxLength="8" required />
              </div>
              <div className='input'> 
                <label className="label font-casmono" htmlFor="payment-due">Payment Due:</label>
                <input type="date" id="payment-due" required />
              </div>
              <div className='input'>
                <label className="label font-casmono" htmlFor="amount-due">Amount Due:</label>
                <input type="text" placeholder="$00.00" id="amount-due" required />
              </div>
        
              <div className='user-client'>

                <div id="invoice-user-container">
                <label className="label font-casmono" htmlFor="user-email">User:</label>
                  <div>
                    
                    <input type="email" placeholder="Your Email" id="user-email" value={user.email} required />
                  </div>
                  <div>
                    <label className="label-item" htmlFor="company-name"></label>
                    <input type="text" placeholder="Your Name/Company" id="company-name" value={user.name} required />
                  </div>
                  <div>
                    <label className="label-item" htmlFor="user-address"></label>
                    <input type="text" placeholder="Address" id="user-address" value={user.address} required />
                  </div>
                  <div>
                    <label className="label-item" htmlFor="user-city"></label>
                    <input type="text" placeholder="City, State, Zip" id="user-city" value={user.city} required />
                  </div>
                </div>
                <div id="invoice-client-container">

                <label className="label font-casmono" htmlFor="client-email">Client:</label>

                  <div>
                   
                    <input type="email" placeholder="Client Email" id="client-email" required />
                  </div>
                  <div>
                    <label className="label-item-right" htmlFor="client-name"></label>
                    <input type="text" placeholder="Client Name/Company" id="client-name" required />
                  </div>
                  <div>
                    <label className="label-item-right" htmlFor="client-address"></label>
                    <input type="text" placeholder="Billing Address" id="client-address" required />
                  </div>
                  <div>
                    <label className="label-item-right" htmlFor="client-city"></label>
                    <input type="text" placeholder="City, State, Zip" id="client-city" required />
                  </div>
                </div>
              </div>
        
              <div className="invoice-bottom">
              <label className="label-item font-casmono" htmlFor="invoice-details">Invoice&nbsp; Details:</label>
                <div id="details-container">
                  
                  <textarea className='details' type="text" placeholder="Details of work provided" id="invoice-details"></textarea>
                </div>
                <button type="submit" id="send-invoice-button">Send Invoice</button>
              </div>
            </form>
            {/* Include the Popup component here */}
            {/* <Popup /> */}
            {/* Include the script file */}
            {/* <script src="/js/create-invoice/invoice.js"></script> */}
          </div>
        </div>
      </div>

     
    </>
  );
};

export default CreateInvoices;
