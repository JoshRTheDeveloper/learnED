import React, { useState, useEffect } from 'react';
import Auth from "../../utils/auth";
import { Link } from "react-router-dom";
import Logo from "../../assets/Logo.svg";
import SignupModal from '../signup-modal/modal';
import LoginModal from '../login-modal/login-modal';
import { useNavigate } from "react-router-dom";

import './index1.css'

function Nav1() {
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
      console.log('First name:', user.data.firstName); 
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
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
   
  }

  const handleSignUpModalClose = () => {
    setIsSignupModalOpen(false); 
    fetchFirstName(); 
    setIsLoggedIn(true);
    setIsSignupModalOpen(false); 
  }
//add
  if (Auth.loggedIn()) {

    return (
      <>
        <header className='header1'>
          <nav className="navbar navbar-expand-md navbar-light fixed-top ">
            <div className="container-fluid">
              <Link to="/" className="navbar-brand">
                <img className="navbar-brand" src={Logo} alt=""  />
              </Link>

              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse"
                aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
                
              </button>
              <div className="navbar-text">
            {firstName && <span>Welcome, {firstName}! </span>} 
                </div>

              <div className="collapse navbar-collapse" id="navbarCollapse">


                <ul className="navbar-nav me-auto mb-2 mb-md-0">
                  <li className="nav-item">
                    <Link className="nav-link active mx-3" to="/Booking">Book Your Appointment</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link active mx-3" to="/Booking">Book Your Appointment</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link active mx-3" to="/BookingHistory">Booking History</Link>
                  </li>
                </ul>
              
                <ul className="navbar-nav mb-2 mb-md-0">
                  <li className="nav-item1">
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
        <header className='header1'>
          <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
            <div className="container-fluid">
              <Link to="/" className="navbar-brand">
                <img className="navbar-brand" src={Logo} alt="" width="45" height="50" />
              </Link>
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse"
                aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
              </button>
              <div className="collapse navbar-collapse" id="navbarCollapse">
                <ul className="navbar-nav me-auto mb-2 mb-md-0">
                </ul>
                <ul className="navbar-nav mb-2 mb-md-0">
                  
                  <li className="nav-item1">
                    <button className="nav-link active mx-3 small-font"  onClick={() => setIsLoginModalOpen(true)}>Login</button>
                  </li>
                  <li className="nav-item1">
                    <button className="nav-link active mx-3 small-font"  onClick={() => setIsSignupModalOpen(true)}>Sign Up</button>
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

export default Nav1;
