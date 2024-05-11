import React, { useState, useEffect } from 'react';
import Auth from "../../utils/auth";
import { Link } from "react-router-dom";
import Logo from "../../assets/Logo.svg";
import SignupModal from '../signup-modal/modal';
import LoginModal from '../login-modal/login-modal';
import { useNavigate } from "react-router-dom";

import './index.css'

function Nav() {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); 
  const [firstName, setFirstName] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (Auth.loggedIn()) {
      fetchFirstName();
    }
  }, []);

  const fetchFirstName = async () => {
    const user = await Auth.getProfile();
    if (user && user.data) {
      setFirstName(user.data.firstName);
    }
  };

  const navigateToServices = () => {
    navigate("/");
    setTimeout(() => {
      const servicesSection = document.getElementById("services");
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 500);
  }

  const handleLogout = () => {
    Auth.logout();

    setFirstName("");
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(false);
    navigate("/");


  }
  

  // const handleLogin = async () => {
  //   await fetchFirstName(); 
  //   setIsLoggedIn(true);
  //   setIsLoginModalOpen(false); 
  // }

  // const handleSignup = async () => {
  //   await fetchFirstName(); 
  //   setIsLoggedIn(true);
  //   setIsLoginModalOpen(false); 
  //   setIsSignupModalOpen(false); 
  // }

  const handleLoginModalClose = () => {
    setIsLoginModalOpen(false);
     fetchFirstName(); 
    setIsLoginModalOpen(false);
    navigate("/dashboard");
  }

  const handleSignUpModalClose = () => {
    setIsSignupModalOpen(false); 
    fetchFirstName(); 
    setIsLoggedIn(true);
    setIsSignupModalOpen(false); 
    navigate("/dashboard");
  }
//add
  if (Auth.loggedIn()) {

    return (
      <>
        <header>
          <nav className="navbar navbar-expand-md navbar-light fixed-top ">
            <div className="container-fluid">
              <Link to="/" className="navbar-brand">
                <img className="navbar-brand" src={Logo} alt=""  />
              </Link>

             

              <div className="navbar-collapse" id="navbarCollapse">
                <ul className="navbar-nav me-auto mb-2 mb-md-0">
                
                </ul>
                <ul className='mobile-sidebar'>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/CreateInvoices">Create Invoice</Link></li>
            <li><a href="/Profile">Profile</a></li>
            <li><a href="#">Invoice History</a></li>
            </ul>
                <div className="navbar-text mx-3">

                  {firstName && <span>Welcome, {firstName}! </span>} 

                </div>
                <ul className="navbar-nav mb-2 mb-md-0">
                  <li className="nav-item">
                    <button className="nav-link active mx-3" onClick={handleLogout}>Logout</button>
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
          <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
            <div className="container-fluid">
              <Link to="/" className="navbar-brand">
                <img className="navbar-brand" src={Logo} alt="" width="45" height="50" />
              </Link>
             
              <div className="collapse navbar-collapse" id="navbarCollapse">
                <ul className="navbar-nav me-auto mb-2 mb-md-0">
                </ul>
                <ul className="navbar-nav mb-2 mb-md-0">

        


                  <li className="nav-item">
                    <button className="nav-link active mx-3 small-font" onClick={() => setIsLoginModalOpen(true)}>Login</button>
                  </li>
                  <li className="nav-item">
                    <button className="nav-link active mx-3 small-font" onClick={() => setIsSignupModalOpen(true)}>Sign Up</button>
                  </li>
                </ul>
                
              </div>
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
