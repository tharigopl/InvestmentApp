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

async function addFriendsAPI(token, friendsemail, uid) {
    console.log("API_DOMAIN",API_DOMAIN);
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };

    
    var url = `/api/users/${uid}/friendsemail`;

    console.log("Add friends  ", token, friendsemail, uid);
    
    console.log(url)
    const name = 'test';
    const response = await api.patch(url, {"emailids":friendsemail}, config);

    const data = response.data;
    console.log("Add Friends API ", data)
    return data;
}

async function getUserDetailsAPI(token, uid) {
    console.log("API_DOMAIN",API_DOMAIN);
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };

    
    var url = `/api/users/${uid}`;

    console.log("Get User Details  ", token, uid);
    
    console.log(url)
    const name = 'test';
    const response = await api.get(url, config);

    const data = response.data;
    //data["user"]["id"] = data["user"]["_id"];
    //console.log("User Details  ", data)


    // const users = [];
    // //users.push(data["user"]);


    // const userObj = {
    //     id: data["user"]["id"],
    //     email:'',
    //     fname: '',
    //     lname: '',
    //     mname: '',
    //     phoneno:'',
    //     street:'',
    //     unit:'',
    //     city:'',
    //     state:'',
    //     postalcode:'',
    //     country:'',
    //     dateofbirth:'',
    //     cntrytaxresidence:'',
    //     fundingsource:'',
    //   };
    //   users.push(userObj);
    return data;
}

async function updateUserAPI(token, uid, userdata) {
    console.log("API_DOMAIN",API_DOMAIN);
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };

    
    var url = `/api/users/${uid}/`;

    console.log("Updating user  ", token, userdata, uid);
    
    console.log(url)
    const name = 'test';
    const response = await api.patch(url, userdata, config);

    const data = response.data;
    console.log("Add Update user API ", data)
    return data;
}

export function getUserDetails(token, uid) {
    return getUserDetailsAPI(token, uid);
}

export function addFriends(token, friends, uid) {
    return addFriendsAPI(token, friends, uid);
}

export function updateUser(token, uid, userdata) {
    return updateUserAPI(token, uid, userdata);
}