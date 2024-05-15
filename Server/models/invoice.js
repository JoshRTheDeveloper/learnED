const mongoose = require('mongoose');

const { Schema } = mongoose;

const invoiceSchema = new Schema({
  invoiceAmount: {
    type: Schema.Types.Decimal128,
    required: true,
  },
  paidStatus: {
    type: Boolean,
    required: true,
    default: false,
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  companyStreetAddress: {
    type: String,
    trim: true,
  },
  companyCityAddress: {
    type: String,
    trim: true,
  },
  companyEmail: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`,
    },
  },
  clientName: {
    type: String,
    required: true,
    trim: true,
  },
  clientStreetAddress: {
    type: String,
    trim: true,
  },
  clientCityAddress: {
    type: String,
    trim: true,
  },
  clientEmail: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`,
    },
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  invoice_details: {
    type: String,
    required: true,
  },
}, {
  timestamps: false,
  collection: 'invoices',
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
