import React, { useState, useEffect } from 'react';
import Auth from "../../utils/auth";
import { Link } from "react-router-dom";
import Logo from "../../assets/Logo.svg";
import SignupModal from '../signup-modal/modal';
import jwtDecode from 'jwt-decode';
import LoginModal from '../login-modal/login-modal';
import { useNavigate } from "react-router-dom";
import { useApolloClient, useQuery } from '@apollo/client';
import { clearOfflineMutation, getOfflineMutations, storeUserData } from '../../utils/indexedDB'; 
import { GET_USER } from '../../utils/queries'; 
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
  CHANGE_ZIP
} from '../../utils/mutations';
import './index.css';

function Nav() {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine ? 'Online' : 'Offline');
  const navigate = useNavigate();
  const client = useApolloClient();

  // Fetch user data with GET_USER query
  const token = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.data._id;
  const { data: userData } = useQuery(GET_USER, {
    variables: { userId: userId || '' },
    skip: !navigator.onLine // Skip if offline
  });

  useEffect(() => {
    if (Auth.loggedIn()) {
      fetchFirstName();
    }

    const handleOnlineStatusChange = () => {
      const isOnline = navigator.onLine;
      setOnlineStatus(isOnline ? 'Online' : 'Offline');
      if (isOnline) {
        executeStoredMutations();
        syncUserData();
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

  const syncUserData = async () => {
    try {
      if (userData) {
        const { company, email, streetAddress, city, state, zip, profilePicture } = userData.getUser;

        await storeUserData({
          userId,
          email,
          streetAddress,
          city,
          state,
          zip,
          company,
          profilePicture,
        });

        console.log('User data synced to IndexedDB');
      }
    } catch (error) {
      console.error('Error syncing user data to IndexedDB:', error);
    }
  };

  const executeStoredMutations = async () => {
    try {
      const storedMutations = await getOfflineMutations();
      console.log('Stored mutations:', storedMutations);

      if (!Array.isArray(storedMutations) || storedMutations.length === 0) {
        console.log('No offline mutations found');
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
          console.log(`Executing mutation type: ${mutationType} with variables:`, variables);

          switch (mutationType) {
            case 'CREATE_INVOICE':
              result = await client.mutate({
                mutation: CREATE_INVOICE,
                variables,
              });
              console.log('Successfully executed createInvoice mutation:', result);
              break;

            case 'DELETE_INVOICE':
              result = await client.mutate({
                mutation: DELETE_INVOICE,
                variables,
              });
              console.log('Successfully executed deleteInvoice mutation:', result);
              break;

            case 'UPDATE_INVOICE':
              result = await client.mutate({
                mutation: UPDATE_INVOICE,
                variables: {
                  invoiceNumber: variables.invoiceNumber, 
                  paidStatus: variables.paidStatus,
                },
              });
              console.log('Successfully executed updateInvoice mutation:', result);
              break;

            case 'CHANGE_COMPANY':
              result = await client.mutate({
                mutation: CHANGE_COMPANY,
                variables,
              });
              console.log('Successfully executed changeCompany mutation:', result);
              break;

            case 'CHANGE_PROFILE_PICTURE':
              result = await client.mutate({
                mutation: CHANGE_PROFILE_PICTURE,
                variables,
              });
              console.log('Successfully executed changeProfilePicture mutation:', result);
              break;

            case 'CHANGE_STREET_ADDRESS':
              result = await client.mutate({
                mutation: CHANGE_STREET_ADDRESS,
                variables,
              });
              console.log('Successfully executed changeStreetAddress mutation:', result);
              break;

            case 'CHANGE_EMAIL':
              result = await client.mutate({
                mutation: CHANGE_EMAIL,
                variables,
              });
              console.log('Successfully executed changeEmail mutation:', result);
              break;

            case 'CHANGE_CITY':
              result = await client.mutate({
                mutation: CHANGE_CITY,
                variables,
              });
              console.log('Successfully executed changeCity mutation:', result);
              break;

            case 'CHANGE_STATE':
              result = await client.mutate({
                mutation: CHANGE_STATE,
                variables,
              });
              console.log('Successfully executed changeState mutation:', result);
              break;

            case 'CHANGE_ZIP':
              result = await client.mutate({
                mutation: CHANGE_ZIP,
                variables,
              });
              console.log('Successfully executed changeZip mutation:', result);
              break;

            default:
              console.warn('Unknown mutation type:', mutationType);
              continue;
          }

          await clearOfflineMutation(id);
          console.log(`Cleared mutation with id ${id} from offline storage`);
        } catch (error) {
          console.error(`Error executing stored ${mutation.mutation} mutation:`, error);
          console.log('GraphQL Error Details:', error?.graphQLErrors);
          console.log('Network Error Details:', error?.networkError);
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
