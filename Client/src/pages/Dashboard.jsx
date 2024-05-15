import React, { useState } from 'react';
import SignupModal from '../components/signup-modal/modal';
import { useQuery } from '@apollo/client';
import './dashboard.css';
import Sidebar from '../components/sidebar/sidebar';
import jwtDecode from 'jwt-decode';
import { GET_USER } from '../utils/queries';

const Home = () => {
  const token = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.data._id;



  const { loading, error, data } = useQuery(GET_USER, {
    variables: { userId: userId || '' },
  });

console.log(data)

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const user = data?.getUser;
  const invoicesDue = user?.invoices.filter(invoice => !invoice.paidStatus) || [];

  return (
    <>
      <div className="app">
        <Sidebar />
        <div className="main-content">
          {/* Your main content goes here */}
        </div>
      </div>

      <div className="total">
        <div className="row">
          <h2>Invoices Due</h2>
          {invoicesDue.length === 0 ? (
            <p>No invoices due.</p>
          ) : (
            <ul>
              {invoicesDue.map(invoice => (
                <li key={invoice._id}>
                  <div className='due-date-container'>
                  <p className='invoice-number' >Invoice Number: {invoice.invoiceNumber}</p>
                  <p className='due-date'> Due Date: {new Date(parseInt(invoice.dueDate)).toLocaleDateString()} </p>
                  </div>
               <div className='invoice-info' >
                  <p>Client: {invoice.clientName}</p>
                  <p>Amount: ${parseFloat(invoice.invoiceAmount.toString()).toFixed(2)}</p>
              
                  <p>Details: {invoice.invoice_details}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="row">
          <h2>Invoices Paid</h2>
          {/* Implement similar logic for paid invoices if needed */}
        </div>
      </div>
    </>
  );
};

export default Home;
