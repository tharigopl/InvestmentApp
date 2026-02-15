import axios from 'axios';

const API_KEY = 'AIzaSyDK6dLf66nFmxkJb58V5YMaZwvQYigadOU';
const API_DOMAIN = '192.168.0.157:5000';
//const API_DOMAIN = process.env.EXPO_PUBLIC_API_DOMAIN;
//const API_DOMAIN = 'http://192.168.0.165:5000';
//const API_DOMAIN = '192.168.0.82';
//const API_DOMAIN = 'https://happykid-396701.uc.r.appspot.com';

const baseurl = `http://${API_DOMAIN}`;
const api = axios.create({
  baseURL: baseurl,
});

async function authenticate(mode, email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:${mode}?key=${API_KEY}`;

  const response = await axios.post(url, {
    email: email,
    password: password,
    returnSecureToken: true,
  });
console.log("response.data ", response.data.email);
  const token = response.data.idToken;

  return token;
}

async function tdtauthenticate(mode, email, password) {
  var url = `/api/users/login`;
  console.log("POST1111");
  if(mode == 'signUp'){
    console.log("Signup1");
    url = `/api/users/signup`;
  }
  console.log(url);
  const response = await api.post(url, {
    email: email,
    password: password
  });
  
  const token = response;
  console.log(token);
  return token;
}

async function getUserLocation() {
  
  const location = await axios.post('https://ipapi.co/json/');

  console.log(location);
  return location;
}

export function createUser(email, password) {
  return authenticate('signUp', email, password);
}

export function login(email, password) {
  return authenticate('signInWithPassword', email, password);
}

export function logintdtserver(email, password) {
  return tdtauthenticate('signInWithPassword', email, password);
}

export function createUserTdtServer(email, password) {
  return tdtauthenticate('signUp', email, password);
}

export function getUserLoc() {
  console.log("Get User Doc");
  return getUserLocation();
}