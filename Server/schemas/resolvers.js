const { signToken, AuthenticationError, UserInputError } = require('../utils/auth');
const { User } = require('../models');
const bcrypt = require('bcrypt');

const resolvers = {
  Query: {
    getUser: async (_, { _id }) => {
      try {
        const user = await User.findById(_id);
        if (!user) {
          throw new Error('User not found');
        }
        return user;
      } catch (error) {
        throw new Error('Failed to fetch user');
      }
    },

    getUsers: async () => {
      try {
        return await User.find();
      } catch (error) {
        throw new Error('Failed to fetch users');
      }
    },
  },
    
  Mutation: {
    createUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);
      return { token, user };
    },
    
    loginUser: async (_, { email, password }) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error('User not found');
        }
        
        if (password === user.password) {
          const token = signToken(user); 
          return { token, user };
        }
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          throw new Error('Incorrect password');
        }
    
        const token = signToken(user); 
        return { token, user };
      } catch (error) {
        throw new AuthenticationError('Login failed'); 
      }
    },
  
    changeProfilePicture: async (_, { _id, profilePicture }, context) => {
      try {
      
        const user = await User.findById(_id);
    
    
        user.profilePicture = profilePicture;
    
        await user.save();
    
        return user;
      } catch (error) {
     
        console.error('Error updating profile picture:', error);
        throw new Error('Failed to update profile picture');
      }
    },
    

    changeStreetAddress: async (_, { _id, streetAddress }, context) => {
      try {
          console.log('Received parameters - _id:', _id, 'streetAddress:', streetAddress);
  
          if (!_id) {
              throw new Error('User ID is required');
          }
  
          if (!streetAddress) {
              throw new Error('Street address is required');
          }
  
          const user = await User.findByIdAndUpdate(_id, { streetAddress }, { new: true });
          if (!user) {
              throw new Error('User not found');
          }
  
          return user;
      } catch (error) {
          console.error('Error updating user street address:', error);
  
          if (error.name === 'ValidationError') {
              throw new Error('Validation error: ' + error.message);
          }
  
          if (error.name === 'MongoError' && error.code === 13) {
              throw new Error('Insufficient permissions to update user street address');
          }
  
          throw new Error('Failed to update street address');
      }
  },
  

  changeEmail: async (_, { _id, email }, context) => {
    const user = await User.findByIdAndUpdate(_id, { email }, { new: true });
    return user;
  },

  changeCity: async (_, { _id, city }, context) => {
      const user = await User.findByIdAndUpdate(_id, { city }, { new: true });
    return user;
  },
  
  changeState: async (_, { _id, state }, context) => {
    const user = await User.findByIdAndUpdate(_id, { state }, { new: true });
    return user;
  },
  
  changeZip: async (_, { _id, zip }, context) => {
    const user = await User.findByIdAndUpdate(_id, { zip }, { new: true });
    return user;
  },
},
};

module.exports = resolvers;
