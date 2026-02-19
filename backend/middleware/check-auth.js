const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  try {
    //console.log("Headers",req.headers);
    const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
    
    if (!token) {
      throw new Error('Authentication failed1!');
    }
    const decodedToken = jwt.verify(token, 'supersecret_dont_share');
    //req.userData = { userId: decodedToken };
    req.userData = { 
      userId: decodedToken.userId,  // String
      email: decodedToken.email      // String
    };
    next();
  } catch (err) {
    const error = new HttpError('Authentication failed2!', 403);
    return next(error);
  }
};
