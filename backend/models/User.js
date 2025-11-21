// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const AddressSchema = new mongoose.Schema({
  label: { type: String, required: true },
  address: { type: String, required: true }
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin','customer'], default: 'customer' },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  addresses: [AddressSchema]
}, { timestamps: true });

// hash password when saving if modified
UserSchema.pre('save', async function(next){
  if(!this.isModified('password')) return next();
  try{
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  }catch(err){ next(err); }
});

// helper to compare password
UserSchema.methods.comparePassword = async function(plain){
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', UserSchema);
