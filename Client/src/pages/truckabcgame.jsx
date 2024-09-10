import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Monster from "../assets/monstertruck.png";
import start from "../assets/startbutton.png";
import gas from "../assets/gaspedal.png";
import Auth from '../utils/auth';
import './truckabcgame.css';

const Truck = () => {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [showStartText, setShowStartText] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);
  const navigate = useNavigate();

  const firstAudioRef = useRef(null);
  const secondAudioRef = useRef(null);

  useEffect(() => {
    if (Auth.loggedIn()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    if (secondAudioRef.current) {
      secondAudioRef.current.addEventListener('ended', () => {
        secondAudioRef.current.currentTime = 0; 
      });
    }
  
    return () => {
      if (secondAudioRef.current) {
        secondAudioRef.current.removeEventListener('ended', () => {});
      }
    };
  }, []);

  const playSound = () => {
    if (firstAudioRef.current) {
      firstAudioRef.current.play();
    }
    setShowStartText(false);
    setIsAnimating(false); 
  };

  const playRev = () => {
    if (secondAudioRef.current) {
      secondAudioRef.current.play();
    }
  };

  const toggleSignupModal = () => {
    setIsSignupModalOpen(!isSignupModalOpen);
  };

  return (
    <>
      <div className='main-truck'>
        <div className='message'>
          <div className='truck'>
            {showStartText && <h1 className='button-title'>Start Your Engines!</h1>}
          </div>
        </div>
        <div className='div3-truck'>
          <div className='truck'>
            <button className='transparent' onClick={playSound}>
              <img
                className={`startImg ${isAnimating ? '' : 'stopped'}`} 
                src={start}
                alt="Start Button"
              />
            </button>
          </div>
          <div className='truck'>
            <button className='transparent' onClick={playRev}>
              <img className='gasImg' src={gas} alt="Gas Pedal" />
            </button>
          </div>
          <div className='truck'>
            <img className='truckImg' src={Monster} alt="Monster Truck" />
          </div>
        </div>
      </div>
      <audio ref={firstAudioRef} src="../src/assets/engine-start.mp3" />
      <audio ref={secondAudioRef} src="../src/assets/rev.mp3" />
    </>
  );
};

export default Truck;
