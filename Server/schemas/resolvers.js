const { signToken, AuthenticationError, UserInputError } = require('../utils/auth');
const { User, Invoice } = require('../models');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');


const resolvers = {
  Query: {
    getUser: async (_, { _id }) => {
      try {
        const user = await User.findById(_id).populate('invoices'); 
        if (!user) {
          throw new Error('User not found');
        }
        console.log(user.invoices);
        console.log(user._id)
        return user;
      } catch (error) {
        throw new Error('Failed to fetch user');
      }
    },

    getUsers: async () => {
      try {
        return await User.find().populate('invoices');
      } catch (error) {
        throw new Error('Failed to fetch users');
      }
    },

    getInvoices: async () => {
      try {
      
        const invoices = await Invoice.find().populate('user');
        const invoicesWithFloatAmount = invoices.map(invoice => ({
          ...invoice.toObject(),
          invoiceAmount: parseFloat(invoice.invoiceAmount.toString())
        }));
    
        return invoicesWithFloatAmount;
      } catch (error) {
        console.error('Error fetching invoices:', error.message);
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }
    },
    
    getInvoice: async (parent, { _id }) => {
      try {
     
        const invoice = await Invoice.findById(_id).populate('user');
    
      
        if (!invoice) {
          throw new Error('Invoice not found.');
        }
 
        const invoiceWithFloatAmount = {
          ...invoice.toObject(),
          invoiceAmount: parseFloat(invoice.invoiceAmount.toString())
        };
    
        return invoiceWithFloatAmount;
      } catch (error) {
        console.error('Error fetching invoice:', error.message);
        throw new Error(`Failed to fetch invoice: ${error.message}`);
      }
    },

   getUserInvoices: async (parent, { userId }) => {
  try {

    const invoices = await Invoice.find({ user: userId }).populate('user');


    const invoicesWithFloatAmount = invoices.map(invoice => ({
      ...invoice.toObject(),
      invoiceAmount: parseFloat(invoice.invoiceAmount.toString())
    }));

   
    return invoicesWithFloatAmount;
  } catch (error) {
 
    console.error('Error fetching invoices:', error.message);
    throw new Error(`Failed to fetch invoices: ${error.message}`);
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
  
  changeCompany: async (_, { _id, company }, context) => {
    const user = await User.findByIdAndUpdate(_id, { company }, { new: true });
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

 createInvoice:  async (_, args) => {
    try {
      console.log('Received arguments:', args);
  
      if (!args.userID) {
        throw new Error('User ID is required to create an invoice.');
      }
  
      if (!mongoose.Types.ObjectId.isValid(args.userID)) {
        throw new Error('Invalid User ID format.');
      }
  
      const invoiceAmountDecimal = mongoose.Types.Decimal128.fromString(args.invoiceAmount.toString());
  
      const invoice = new Invoice({
        ...args,
        invoiceAmount: invoiceAmountDecimal,
        user: args.userID,
      });
  
      await invoice.save();
  
      await User.findByIdAndUpdate(args.userID, { $push: { invoices: invoice._id } });
  
      console.log('Created invoice:', invoice);
  
      return {
        ...invoice.toObject(),
        invoiceAmount: parseFloat(invoice.invoiceAmount.toString()),
      };
    } catch (error) {
      console.error('Error creating invoice:', error.message);
      throw new Error(`Failed to create invoice: ${error.message}`);
    }
  },
  

  updateInvoice: async (parent, args) => {
    const { _id, ...updateData } = args;
    return await Invoice.findByIdAndUpdate(_id, updateData, { new: true }).populate('user');
  },

  deleteInvoice: async (parent, { _id }) => {
    return await Invoice.findByIdAndDelete(_id).populate('user');
  },
},
};

module.exports = resolvers;
