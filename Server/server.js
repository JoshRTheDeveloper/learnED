const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const path = require('path');
const { authMiddleware } = require('./utils/auth');
const { upload } = require('./utils/cloudinary'); 
const { typeDefs, resolvers } = require('./schemas');
const db = require('./config/connection');
const cors = require('cors');
const sendInvoiceEmail = require('./utils/mailjet');
const Invoice = require('../Server/models/invoice');
require('dotenv').config();

const PORT = process.env.PORT || 3001;
const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware
});

const startApolloServer = async () => {
  await server.start();

  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
  }));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).send('No file uploaded.');
    }

    const fileUrl = file.path;

    res.send({ fileUrl });
  });

  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  }, express.static(path.join(__dirname, 'uploads')));

  app.use('/graphql', expressMiddleware(server, {
    context: authMiddleware
  }));

  
  app.get('/api/invoices', async (req, res) => {
    try {
      const invoices = await Invoice.find();
      res.json(invoices);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      res.status(500).send('Failed to fetch invoices');
    }
  });

  app.post('/send-invoice', async (req, res) => {
    const invoiceDetails = req.body;
    const user = req.user;

    try {
      await sendInvoiceEmail(invoiceDetails, user);
      res.status(200).send({ message: 'Email sent successfully' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).send({ message: 'Error sending email' });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../Client/dist')));
    app.use('/assets', express.static(path.join(__dirname, '../Client/dist/assets')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../Client/dist/index.html'));
    });
  }

  db.once('open', () => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
    });
  });
};

startApolloServer();
