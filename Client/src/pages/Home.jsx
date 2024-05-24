import React, { useState, useEffect, useRef } from 'react';
import { Parallax, ParallaxLayer } from "@react-spring/parallax";
import SignupModal from '../components/signup-modal/modal';
import './home.css';


const Home = () => {
 

 
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const toggleSignupModal = () => {
    setIsSignupModalOpen(!isSignupModalOpen);
  };


  
  return (
    <>
    

      <div>
        
          <Parallax pages={3} >

               

                  <ParallaxLayer offset={0} speed={10} id='par-background1' horizontal/>
                  <ParallaxLayer offset={0} speed={10} id='par-background2' horizontal/>
                  <ParallaxLayer offset={0} speed={3} id='par-background'/>

                  <ParallaxLayer offset={0} speed={-15} horizontal id='par-heading'>

                 

                  <div className="animation_layer parallax main-text"  >
              <div className="container pb-5 heading">
                <div className="" id="main-tagline">
                  <h2 className="text-app-red font-casmono">
                    Say 'Hasta la Vista' to business pain
                  </h2>
                </div>
                <div className="" id="sub-tagline">
                  <h5 className="text-app-red py-12 text-xl font-casmono">
                    The InvoicInator will not stop until you get paid!
                  </h5>
                </div>
                <div className="py-5">
                <button className="nav-link nav-link-mobile active mx-3 small-font cust-btn" onClick={toggleSignupModal}>Get Started</button>
                </div>
                <div>
                  <p>Scroll down to see Collaborators...</p>
                </div>
              </div>
            </div>
                  </ParallaxLayer>

             
    
                  <ParallaxLayer offset={1} speed={0} >
                  <div className="container">
      <div className="heading-container">
        <h2 className="custom-h2"> Our Collaborators</h2>
      </div>
      </div>
                  </ParallaxLayer>

                  <ParallaxLayer className='page2' offset={1} speed={1}  sticky={{ start: 1.5, end: 3 }} >

                  
<div >

                  <div className="row-home-container1">
        <div className="row-home">
          <div className="column-home column-home-container column-home-space ">
            <h3>Joshua Roth</h3>
            <p>Role: Developer</p>
            <div className='row-home'> 
            <a href="https://github.com/JoshRTheDeveloper" className=" app-button1"><b>Github</b></a>
            <a href="/login#signup" className=" app-button1"><b>Linked-In</b></a>
            </div>
          </div>
          
          <div className="column-home column-home-container column-home-space">
            
            <h3>Anothny Buffill</h3>
            <p>Role: Developer</p>
            <div className='row-home'> 
            <a href="https://github.com/JoshRTheDeveloper" className=" app-button1"><b>Github</b></a>
            <a href="/login#signup" className=" app-button1"><b>Linked-In</b></a>
            </div>
          </div>
        </div>
      </div>

      <div className="row-home-container">
        <div className="row1">
          
          <div className="column-home column-home-container column-home-space">
            <h3>Brian Doherty</h3>
            <p>Role: Developer</p>
            <div className='row-home'> 
            <a href="https://github.com/JoshRTheDeveloper" className=" app-button1"><b>Github</b></a>
            <a href="/login#signup" className=" app-button1"><b>Linked-In</b></a>
            </div>
          </div>
        </div>
      </div>

                  <div className="row-home-container">

        <div className="row-home">
          <div className="column-home column-home-container column-home-space">
            <h3>Michale Graham</h3>
            <p>Role: Developer</p>
            <div className='row-home'> 
            <a href="https://github.com/JoshRTheDeveloper" className=" app-button1"><b>Github</b></a>
            <a href="/login#signup" className=" app-button1"><b>Linked-In</b></a>
            </div>
          </div>

          <div className="column-home column-home-container column-home-space">
            <h3>Luke Garnsey</h3>
            <p>Role: Developer</p>
            <div className='row-home'> 
            <a href="https://github.com/JoshRTheDeveloper" className=" app-button1"><b>Github</b></a>
            <a href="/login#signup" className=" app-button1"><b>Linked-In</b></a>
            </div>
          </div>
        </div>
      </div>
 </div>
      
                  </ParallaxLayer>
                  
                  <h2 className="mobile-h2"> Our Collaborators</h2>
                  <div className='mobile'>
                  <div className="row-home-container1">
        <div className="row-home">
          <div className="column-home column-home-container column-home-space ">
            
            <h3>Joshua Roth</h3>
            <p>Role: Developer</p>
            <div className='row-home '> 
            <a href="https://github.com/JoshRTheDeveloper" className=" app-button1"><b>Github</b></a>
            <a href="/login#signup" className=" app-button1"><b>Linked-In</b></a>
            </div>
          </div>
          
          <div className="column-home column-home-container column-home-space">
            
            <h3>Anothny Buffill</h3>
            <p>Role: Developer</p>
            <div className='row-home'> 
            <a href="https://github.com/JoshRTheDeveloper" className=" app-button1"><b>Github</b></a>
            <a href="/login#signup" className=" app-button1"><b>Linked-In</b></a>
            </div>
          </div>
        </div>
      </div>

      <div className="row-home-container">
        <div className="row-home1">
          
          <div className="column-home column-home-container column-home-space">
            <h3>Brian Doherty</h3>
            <p>Role: Developer</p>
            <div className='row-home'> 
            <a href="https://github.com/JoshRTheDeveloper" className=" app-button1"><b>Github</b></a>
            <a href="/login#signup" className=" app-button1"><b>Linked-In</b></a>
            </div>
          </div>
        </div>
      </div>

                  <div className="row-home-container">

        <div className="row-home">
          <div className="column-home column-home-container column-home-space">
            <h3>Michale Graham</h3>
            <p>Role: Developer</p>
            <div className='row-home'> 
            <a href="https://github.com/JoshRTheDeveloper" className=" app-button1"><b>Github</b></a>
            <a href="/login#signup" className=" app-button1"><b>Linked-In</b></a>
            </div>
          </div>

          <div className="column-home column-home-container column-home-space">
            <h3>Luke Garnsey</h3>
            <p>Role: Developer</p>
            <div className='row-home'> 
            <a href="https://github.com/JoshRTheDeveloper" className=" app-button1"><b>Github</b></a>
            <a href="/login#signup" className=" app-button1"><b>Linked-In</b></a>
            </div>
          </div>
        </div>
      </div>
 </div>

            </Parallax>


          {isSignupModalOpen && (
      <SignupModal isOpen={isSignupModalOpen} onClose={toggleSignupModal} />
    )}
        
      </div>
       
    </>
  );
};

export default Home;
