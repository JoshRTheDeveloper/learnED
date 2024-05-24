const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const path = require('path');
const { authMiddleware } = require('./utils/auth');
const multer = require('./utils/multer'); 
const { typeDefs, resolvers } = require('./schemas');
const db = require('./config/connection');
const cors = require('cors');
const PORT = process.env.PORT || 3001;
const app = express();
const fs = require('fs');
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware
});

const startApolloServer = async () => {
  await server.start();

  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow requests from these origins
  }));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  
  app.post('/upload', multer.single('file'), (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }
    
 
    const userId = req.headers.userid; 
    const filename = `${userId}_profile_picture.jpg`;
    
   
    const filePath = path.join(__dirname, 'uploads', filename);
    fs.renameSync(file.path, filePath);

   
    const fileUrl = `/uploads/${filename}`;
  
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

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
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
