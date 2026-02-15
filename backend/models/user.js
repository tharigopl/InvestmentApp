const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({  
  fname: { type: String, required: false },
  lname: { type: String, required: false },
  mname: { type: String, required: false },
  dateofbirth: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength:6 },
  phoneno : { type: String, required: false},
  street : { type: String, required: false},
  unit : { type: String, required: false},
  city : { type: String, required: false},
  state : { type: String, required: false},
  country : { type: String, required: false},
  country : { type: String, required: false},
  postalcode: { type: String, required: false, minlength: 6 },
  //image: { type: String, required: true },
  places: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Place' }],
  //friends: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Friend' }],
  friends: [{ type: mongoose.Types.ObjectId, required: true, ref: 'User' }],
  stripeuser: {type: mongoose.Types.ObjectId, ref:'StripeUser'}
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
