import React, { useEffect, useState } from 'react';
import './sidebar.css'; 
import { Link } from "react-router-dom";
import Auth from "../../utils/auth";
import { useQuery } from '@apollo/client';
import { GET_USER } from '../../utils/queries';

const Sidebar = () => {
  const [userFirstName, setUserFirstName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");


  const profile = Auth.getProfile();

  const userId = profile?.data?._id || '';


  const { loading, error, data } = useQuery(GET_USER, {
    variables: { 'userId' : userId },
  });

  useEffect(() => {
    const fetchUserFirstName = async () => {
      if (!loading && data && data.getUser) {
        setUserFirstName(data.getUser.firstName);
        setProfilePicture(data.getUser.profilePicture);
      }
    };
    fetchUserFirstName();
  }, [loading, data]);

  return (
  <div className='content'>
    <div className="sidebar">
      <div className='profile-picture-div'>
      {profilePicture && <img src={`http://localhost:3001${profilePicture}`} className='profile-picture' alt="Profile" />}
      </div>
      {userFirstName && <h2>Welcome, {userFirstName}!</h2>}
      <ul>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/CreateInvoices">Create Invoice</Link></li>
        <li><a href="/Profile">Profile</a></li>
        <li><a href="#">Invoice History</a></li>
      </ul>
    </div>
    </div>
  );
}

export default Sidebar;
