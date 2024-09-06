import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Monster from "../assets/monstertruck.png";
import start from "../assets/startbutton.png";
import Auth from '../utils/auth';
import './truckabcgame.css';

const Truck = () => {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const navigate = useNavigate();

  // Refs for the audio elements
  const firstAudioRef = useRef(null);
  const secondAudioRef = useRef(null);

  useEffect(() => {
    if (Auth.loggedIn()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    // Loop the second audio manually
    if (secondAudioRef.current) {
      secondAudioRef.current.addEventListener('ended', () => {
        secondAudioRef.current.currentTime = 0; // Restart from the beginning
      });
    }
    // Cleanup listener on unmount
    return () => {
      if (secondAudioRef.current) {
        secondAudioRef.current.removeEventListener('ended', () => {});
      }
    };
  }, []);

  // Function to play sound
  const playSound = () => {
    if (firstAudioRef.current && secondAudioRef.current) {
      firstAudioRef.current.play();

      // Stop the first audio after 2 seconds and play the second audio
      setTimeout(() => {
        if (firstAudioRef.current) {
          firstAudioRef.current.pause();
          firstAudioRef.current.currentTime = 0; // Reset to start
        }
        secondAudioRef.current.play();
      }, 2000); // Timeout duration in milliseconds
    }
  };

  // Function to stop sound
  const stopSound = () => {
    if (firstAudioRef.current) {
      firstAudioRef.current.pause();
      firstAudioRef.current.currentTime = 0; // Reset to start
    }
    if (secondAudioRef.current) {
      secondAudioRef.current.pause();
      secondAudioRef.current.currentTime = 0; // Reset to start
    }
  };

  const toggleSignupModal = () => {
    setIsSignupModalOpen(!isSignupModalOpen);
  };

  return (
    <>
      <div className='main-truck'>
        <div className='div3-truck'>
          <div className='start-engines'>
           <button onClick={playSound}> <img className='image-truck' src={start} alt="Monster Truck" /></button>
            <button onClick={playSound}>Start Your Engines</button>
            <button onClick={stopSound}>Stop</button>
          </div> 
          <div className='truck'>
            <img className='image-truck' src={Monster} alt="Monster Truck" />
          </div>
          <div className='truck'>
            <img className='image-truck' src={Monster} alt="Monster Truck" />
          </div>
        </div>
      </div>

      {/* Audio elements */}
      <audio ref={firstAudioRef} src="../src/assets/engine-start.mp3" />
      <audio ref={secondAudioRef} src="../src/assets/rev.mp3" />
    </>
  );
};

export default Truck;
