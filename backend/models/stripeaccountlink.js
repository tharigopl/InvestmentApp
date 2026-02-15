const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const stripeAccountLinkSchema = new Schema({
      
        "object": {
          "type": "String"
        },
        "created": {
          "type": "Number"
        },
        "expires_at": {
          "type": "Number"
        },
        "url": {
          "type": "String"
        }
      
});

stripeAccountLinkSchema.plugin(uniqueValidator);

module.exports = mongoose.model('StripeUserAccountLink', stripeAccountLinkSchema);
