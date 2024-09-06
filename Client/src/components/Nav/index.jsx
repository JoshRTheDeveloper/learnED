import React, { useState, useEffect } from 'react';
import Auth from "../../utils/auth";
import { Link } from "react-router-dom";
import Logo from "../../assets/learnedtext.svg";
import SignupModal from '../signup-modal/modal';
import LoginModal from '../login-modal/login-modal';
import { useNavigate } from "react-router-dom";
import { useApolloClient } from '@apollo/client';
import { clearOfflineMutation, getOfflineMutations } from '../../utils/indexedDB'; 
import {   
  CREATE_INVOICE,
  DELETE_INVOICE,
  UPDATE_INVOICE,
  CHANGE_COMPANY,
  CHANGE_PROFILE_PICTURE,
  CHANGE_STREET_ADDRESS,
  CHANGE_EMAIL,
  CHANGE_CITY,
  CHANGE_STATE,
  CHANGE_ZIP } from '../../utils/mutations';
import './index.css';

function Nav() {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); 
  const [firstName, setFirstName] = useState("");
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine ? 'Online' : 'Offline');
  const navigate = useNavigate();
  const client = useApolloClient();

  useEffect(() => {
    if (Auth.loggedIn()) {
      fetchFirstName();
    }

    const handleOnlineStatusChange = () => {
      const isOnline = navigator.onLine;
      setOnlineStatus(isOnline ? 'Online' : 'Offline');
      if (isOnline) {
        executeStoredMutations();
      }
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  const fetchFirstName = async () => {
    try {
      const user = await Auth.getProfile();
      if (user && user.data) {
        setFirstName(user.data.firstName);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLogout = () => {
    Auth.logout();
    setFirstName("");
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(false);
    navigate("/");
  };

  const handleLoginModalClose = async () => {
    setIsLoginModalOpen(false);
    await fetchFirstName();
    if (Auth.loggedIn()) {
      navigate("/dashboard");
    }
  };

  const handleSignUpModalClose = async () => {
    setIsSignupModalOpen(false);
    await fetchFirstName();
    if (Auth.loggedIn()) {
      navigate("/dashboard");
    }
  };

  const executeStoredMutations = async () => {
    try {
      const storedMutations = await getOfflineMutations();
  
  
      if (!Array.isArray(storedMutations) || storedMutations.length === 0) {
   
        return;
      }
  
      for (const mutation of storedMutations) {
        try {
          const { mutation: mutationType, variables, id } = mutation;
  
          if (!mutationType || !variables || !id) {
            console.warn('Malformed mutation object:', mutation);
            continue; 
          }
  
          let result;

  
          switch (mutationType) {
            case 'CREATE_INVOICE':
              result = await client.mutate({
                mutation: CREATE_INVOICE,
                variables,
              });
     
              break;
  
            case 'DELETE_INVOICE':
              result = await client.mutate({
                mutation: DELETE_INVOICE,
                variables,
              });
    
              break;
  
            case 'UPDATE_INVOICE':
              result = await client.mutate({
                mutation: UPDATE_INVOICE,
                variables: {
                  invoiceNumber: variables.invoiceNumber, 
                  paidStatus: variables.paidStatus,
                },
              });
      
              break;
  
            case 'CHANGE_COMPANY':
              result = await client.mutate({
                mutation: CHANGE_COMPANY,
                variables,
              });
          
              break;
  
  
            case 'CHANGE_STREET_ADDRESS':
              result = await client.mutate({
                mutation: CHANGE_STREET_ADDRESS,
                variables,
              });
 
              break;
  
            case 'CHANGE_EMAIL':
              result = await client.mutate({
                mutation: CHANGE_EMAIL,
                variables,
              });
    
              break;
  
            case 'CHANGE_CITY':
              result = await client.mutate({
                mutation: CHANGE_CITY,
                variables,
              });
         
              break;
  
            case 'CHANGE_STATE':
              result = await client.mutate({
                mutation: CHANGE_STATE,
                variables,
              });
          
              break;
  
            case 'CHANGE_ZIP':
              result = await client.mutate({
                mutation: CHANGE_ZIP,
                variables,
              });
          
              break;
  
            default:
              console.warn('Unknown mutation type:', mutationType);
              continue;
          }
  
          await clearOfflineMutation(id);

        } catch (error) {
          console.error(`Error executing stored ${mutation.mutation} mutation:`, error);
      
        }
      }
    } catch (error) {
      console.error('Failed to get offline mutations:', error);
    }
  };
  
  
  

  if (Auth.loggedIn()) {
    return (
      <>
        <header>
          <nav className="navbar navbar-expand-md navbar-light fixed-top">
            <div className="container-fluid">
              <Link to="/" className="navbar-brand">
                <img className="navbar-brand" src={Logo} alt=""  />
              </Link>
              <span className="online-status">Network: {onlineStatus}</span>
              <div className="navbar-collapse" id="navbarCollapse">
                <ul className="navbar-nav me-auto mb-2 mb-md-0"></ul>
                <div className='mobile-container'>
                  <ul className='mobile-sidebar'>
                    <li><Link to="/dashboard">Dashboard</Link></li>
                    <li><Link to="/CreateInvoices">Create Invoice</Link></li>
                    <li><a href="/Profile">Profile</a></li>
                    <button className="mobile-logout" onClick={handleLogout}>Logout</button>
                  </ul>
                </div>
                <div className='width'>
                  <div className="navbar-text mx-3">
                    {firstName && <span>Welcome, {firstName}!</span>}
                  </div>
                </div>
                <ul className="navbar-nav mb-md-0">
                  <li className="nav-item">
                    <div className='logout-button'>
                      <button className="nav-link active mx-3" onClick={handleLogout}>Logout</button>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </header>
      </>
    );
  } else {
    return (
      <>
        <header>
          <nav className="navbar navbar-expand-md navbar-light fixed-top">
            <div className="container-fluid-mobile container-fluid">
              <Link to="/" className="navbar-brand-mobile navbar-brand">
                <img className="navbar-brand-mobile navbar-brand" src={Logo} alt=""  />
              </Link>
              <div className='width'>
                <div className="navbar-text mx-3">
                  {firstName && <span>Welcome, {firstName}!</span>}
                </div>
              </div>
              <ul className="navbar-nav navbar-nav-mobile mb-md-0">
                <li className="nav-item">
                  <button className="nav-link-mobile nav-link active mx-3 small-font" onClick={() => setIsLoginModalOpen(true)}>Login</button>
                </li>
                <li className="nav-item">
                  <button className="nav-link-mobile  nav-link active mx-3 small-font" onClick={() => setIsSignupModalOpen(true)}>Sign Up</button>
                </li>
                <span className="online-status">({onlineStatus})</span>
              </ul>
            </div>
          </nav>
        </header>
        <SignupModal isOpen={isSignupModalOpen} onClose={handleSignUpModalClose} onCloseModal={handleSignUpModalClose} />
        <LoginModal isOpen={isLoginModalOpen} onClose={handleLoginModalClose} onCloseModal={handleLoginModalClose} />
      </>
    );
  }
}

export default Nav;
