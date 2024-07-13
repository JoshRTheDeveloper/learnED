import React, { useEffect, useState } from 'react';
import './sidebar.css';
import { Link } from 'react-router-dom';
import Auth from '../../utils/auth';
import { getUserData, getProfilePicture } from '../../utils/indexedDB';
import { GET_USER } from '../../utils/queries';
import { useQuery } from '@apollo/client';

const Sidebar = () => {
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  const profile = Auth.getProfile();
  const userId = profile?.data?._id || '';

  const { data: userDataFromDB, error: errorFromDB, refetch } = useQuery(GET_USER, {
    variables: { userId },
    skip: !userId,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      let userData, profilePicUrl;

      if (userDataFromDB && userDataFromDB.user) {
        userData = userDataFromDB.user;
        profilePicUrl = userData.profilePictureUrl;
      } else {
        userData = await getUserData(userId);
        profilePicUrl = await getProfilePicture(userId);
      }

      if (userData) {
        setUserFirstName(userData.firstName);
        setUserLastName(userData.lastName);
        setProfilePicture(profilePicUrl || '');
      }
    };

    fetchUserData();
  }, [userId, userDataFromDB]);

  return (
    <div className='content'>
      <div className='sidebar'>
        <div className='profile-picture-div'>
          {profilePicture && <img src={profilePicture} className='profile-picture2' alt='Profile' />}
        </div>
        {userFirstName && userLastName && <h2>Welcome, {userFirstName} {userLastName}!</h2>}
        <ul>
          <li>
            <Link to='/dashboard'>Dashboard</Link>
          </li>
          <li>
            <Link to='/CreateInvoices'>Create Invoice</Link>
          </li>
          <li>
            <Link to='/Profile'>Profile</Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
