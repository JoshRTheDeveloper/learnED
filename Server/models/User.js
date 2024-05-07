const mongoose = require('mongoose');

const { Schema } = mongoose;
const bcrypt = require('bcrypt');

const userSchema = new Schema({

  company: {
    type: String,
    trim: true,
    },

  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  profilePicture: {
    type: String,
  },
  
  streetAddress: {
    type: String,
    trim: true,
  },
  
  city: {
    type: String,
    trim: true,
  },

  state: {
    type: String,
    trim: true,
  },

  zip: {
    type: String,
    trim: true,
  },
  
});


userSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('password')) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
  next();
});

// Compare the incoming password with the hashed password
userSchema.methods.isCorrectPassword = async function (password) {
  await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
