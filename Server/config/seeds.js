const mongoose = require('mongoose');
const db = require('./connection');
const { User } = require('../models');
const cleanDB = require('./cleanDB');

db.once('open', async () => {
  await cleanDB('User', 'users');



  const users = await User.insertMany([
    {
      firstName: 'Michael',
      lastName: 'Davidson',
      email: 'md1232@example.com',
      password: 'abc123',
      address: '4414 cordova ln',
    },
    {
      firstName: 'Anna',
      lastName: 'Cormier',
      email: 'ac1232@example.com',
      password: 'abc123',
    }
  ]);

  
  await Promise.all(users.map(user => user.save()));

  console.log('Data seeded successfully');
  process.exit();
});

