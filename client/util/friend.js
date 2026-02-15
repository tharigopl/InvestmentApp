import axios from 'axios';

const API_KEY = 'AIzaSyDK6dLf66nFmxkJb58V5YMaZwvQYigadOU';
const API_DOMAIN = '192.168.0.157:5000';
//const API_DOMAIN = process.env.EXPO_PUBLIC_API_DOMAIN;
//const API_DOMAIN = 'http://192.168.0.165:5000';
//const API_DOMAIN = '192.168.0.165:5000';
//const API_DOMAIN = '192.168.0.82';
//const API_DOMAIN = 'https://happykid-396701.uc.r.appspot.com';

const baseurl = `http://${API_DOMAIN}`;
const api = axios.create({
  baseURL: baseurl,
});

async function getAllUsersAPI(token) {
    console.log("API_DOMAIN",API_DOMAIN);
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    
    var url = `/api/users`;

    console.log("Get All Users  ", token);
    
    console.log(url)
    const name = 'test';
    const response = await api.get(url, config);

    const data = response.data;

    return data;
}

async function getAllFriendsForUserAPI(token, uid) {
    console.log("API_DOMAIN",API_DOMAIN);
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    
    var url = `/api/users/${uid}/friends`;

    console.log(url)
    const name = 'test';
    const response = await api.get(url, config);

    const data = response.data;

    console.log("Get All Users As Friends data", data);
    
    const friends = [];

    for (const key in data.friends) {
        console.log("Key ", key, data.friends[key].email);
        const friendsObj = {
        id: data.friends[key].id,
        email: data.friends[key].email
        };
        friends.push(friendsObj);
    }


    return friends;
}

async function deleteFriend(token, friendid) {
    console.log("API_DOMAIN",API_DOMAIN);
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    
    var url = `/api/users/`;

    console.log("Get All Users  ", token);
    
    console.log(url)
    const name = 'test';
    const response = await api.get(url, config);

    const data = response.data;
    

    return data;
}

export function getAllUsers(token) {
    return getAllUsersAPI(token);
}

export function getAllFriendsForUser(token, uid) {
    console.log("Get All Friends For User ", uid);
    return getAllFriendsForUserAPI(token, uid);
}