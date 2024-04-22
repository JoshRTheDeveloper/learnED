import React, { useEffect, useState } from 'react';
import './sidebar.css'; // Import your CSS file for sidebar styling
import { Link } from "react-router-dom";
import Auth from "../../utils/auth";




const Sidebar = () => {

 const [userFirstName, setUserFirstName] = useState("");
useEffect(() => {
 const fetchUserFirstName = async () => {
   const profile = Auth.getProfile();
   console.log(profile)
   if (profile && profile.data.firstName) {
     setUserFirstName(profile.data.firstName);
   }
 };


 fetchUserFirstName();
}, []);

  return (
    <div className="sidebar">
       {userFirstName && <h2>Welcome, {userFirstName}!</h2>}
      <ul>
        <li><Link  to="/dashboard">Dashboard</Link></li>
        <li><Link  to="/CreateInvoices">Create Invoice</Link></li>
        <li><a href="/Profile">Profile</a></li>
        <li><a href="#">Invoice History</a></li>
      </ul>
    </div>
  );
}

export default Sidebar;
