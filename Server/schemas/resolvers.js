const { signToken, AuthenticationError } = require('../utils/auth');
const { User, Invoice } = require('../models');
const { sendInvoiceEmail } = require('../utils/mailjet');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const resolvers = {
  Query: {
    getUser: async (_, { _id }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(_id)) {
          throw new Error('Invalid User ID format.');
        }
        const user = await User.findById(_id).populate('invoices');
        if (!user) {
          throw new Error('User not found');
        }
        const userWithConvertedInvoices = {
          ...user.toObject(),
          invoices: user.invoices.map(invoice => ({
            ...invoice.toObject(),
            invoiceAmount: parseFloat(invoice.invoiceAmount.toString())
          }))
        };
        return userWithConvertedInvoices;
      } catch (error) {
        console.error('Failed to fetch user:', error.message);
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
        return invoices.map(invoice => ({
          ...invoice.toObject(),
          invoiceAmount: parseFloat(invoice.invoiceAmount.toString())
        }));
      } catch (error) {
        console.error('Error fetching invoices:', error.message);
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }
    },
    getInvoice: async (_, { _id }) => {
      try {
        const invoice = await Invoice.findById(_id).populate('user');
        if (!invoice) {
          throw new Error('Invoice not found.');
        }
        return {
          ...invoice.toObject(),
          invoiceAmount: parseFloat(invoice.invoiceAmount.toString())
        };
      } catch (error) {
        console.error('Error fetching invoice:', error.message);
        throw new Error(`Failed to fetch invoice: ${error.message}`);
      }
    },
    getUserInvoices: async (_, { userId }) => {
      try {
        const invoices = await Invoice.find({ user: userId }).populate('user');
        return invoices.map(invoice => ({
          ...invoice.toObject(),
          invoiceAmount: parseFloat(invoice.invoiceAmount.toString())
        }));
      } catch (error) {
        console.error('Error fetching invoices:', error.message);
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }
    },
    getInvoicesByNumber: async (_, { userId, invoiceNumber }) => {
      try {
        const user = await User.findById(userId);
        if (!user) {
          throw new Error('User not found');
        }
        const filter = { user: userId };
        if (invoiceNumber) {
          filter.invoiceNumber = invoiceNumber;
        }
        return await Invoice.find(filter);
      } catch (error) {
        throw new Error(error);
      }
    },
  },
  Mutation: {
    createUser: async (_, args) => {
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
    changeProfilePicture: async (_, { _id, profilePicture }) => {
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
    changeStreetAddress: async (_, { _id, streetAddress }) => {
      try {
        if (!_id || !streetAddress) {
          throw new Error('User ID and street address are required');
        }
        const user = await User.findByIdAndUpdate(_id, { streetAddress }, { new: true });
        if (!user) {
          throw new Error('User not found');
        }
        return user;
      } catch (error) {
        console.error('Error updating user street address:', error);
        throw new Error('Failed to update street address');
      }
    },
    changeEmail: async (_, { _id, email }) => {
      return await User.findByIdAndUpdate(_id, { email }, { new: true });
    },
    changeCity: async (_, { _id, city }) => {
      return await User.findByIdAndUpdate(_id, { city }, { new: true });
    },
    changeCompany: async (_, { _id, company }) => {
      return await User.findByIdAndUpdate(_id, { company }, { new: true });
    },
    changeState: async (_, { _id, state }) => {
      return await User.findByIdAndUpdate(_id, { state }, { new: true });
    },
    changeZip: async (_, { _id, zip }) => {
      return await User.findByIdAndUpdate(_id, { zip }, { new: true });
    },
    createInvoice: async (_, args) => {
      try {
        const { userID, invoiceAmount } = args;
        if (!userID || !mongoose.Types.ObjectId.isValid(userID)) {
          throw new Error('Invalid or missing User ID');
        }
        let invoiceAmountDecimal;
        try {
          invoiceAmountDecimal = mongoose.Types.Decimal128.fromString(invoiceAmount.toString());
        } catch (error) {
          throw new Error('Invalid invoice amount format');
        }
        const invoice = new Invoice({ ...args, invoiceAmount: invoiceAmountDecimal, user: userID });
        let savedInvoice;
        try {
          savedInvoice = await invoice.save();
        } catch (error) {
          console.error('Error saving invoice:', error.message);
          throw new Error('Failed to save invoice');
        }
        try {
          const user = await User.findByIdAndUpdate(
            userID,
            { $push: { invoices: savedInvoice._id } },
            { new: true }
          );
          if (!user) {
            throw new Error('User not found');
          }
        } catch (error) {
          console.error('Error updating user with invoice:', error.message);
          throw new Error('Failed to update user with the new invoice');
        }
        try {
          await sendInvoiceEmail(savedInvoice);
        } catch (error) {
          console.error('Error sending invoice email:', error.message);
          throw new Error('Failed to send invoice email');
        }
        return {
          ...savedInvoice.toObject(),
          invoiceAmount: parseFloat(savedInvoice.invoiceAmount.toString())
        };
      } catch (error) {
        console.error('Error creating invoice:', error.message);
        throw new Error(`Failed to create invoice: ${error.message}`);
      }
    },
    updateInvoice: async (_, { invoiceNumber, ...updateData }) => {
      try {
        const updatedInvoice = await Invoice.findOneAndUpdate(
          { invoiceNumber },
          updateData,
          { new: true }
        ).populate('user');
        if (!updatedInvoice) {
          throw new Error(`Invoice with invoiceNumber ${invoiceNumber} not found`);
        }
        return updatedInvoice;
      } catch (error) {
        console.error('Error updating invoice:', error);
        throw new Error('Failed to update invoice');
      }
    },
    deleteInvoice: async (_, { invoiceNumber }) => {
      try {
        const deletedInvoice = await Invoice.findOneAndDelete({ invoiceNumber }).populate('user');
        if (!deletedInvoice) {
          return { success: false, message: 'Invoice not found' };
        }
        await User.updateOne(
          { _id: deletedInvoice.user._id },
          { $pull: { invoices: deletedInvoice._id } }
        );
        return { success: true, message: 'Invoice deleted successfully' };
      } catch (error) {
        console.error('Error deleting invoice:', error);
        return { success: false, message: 'An error occurred while deleting the invoice' };
      }
    }
  }
};

module.exports = resolvers;
