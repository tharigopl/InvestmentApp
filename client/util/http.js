import axios from 'axios';

//const BACKEND_URL = 'https://uwunm-fe912-default-rtdb.firebaseio.com';

const BACKEND_URL =  'https://wunme-53e1d-default-rtdb.firebaseio.com/';

const UWUNM_BACKEND_URL = 'https://uwunm-fe912-default-rtdb.firebaseio.com/';
  
const STRIPEFB_BACKEND_URL = 'https://stripefunctions-cdb57-default-rtdb.firebaseio.com/';

export async function storeExpense(expenseData, token) {  
  const response = await axios.post(`${STRIPEFB_BACKEND_URL}/expenses.json?auth=${token}`, expenseData).catch(function (error) {
    if (error.response) {
      // Request made and server responded
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }

  });
  const id = response.data.name;
  return id;
}

export async function fetchExpenses(token) {
  const response = await axios.get(STRIPEFB_BACKEND_URL + '/expenses.json?auth='+ token).catch(function (error) {
    if (error.response) {
      // Request made and server responded
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }

  });

  const expenses = [];

  for (const key in response.data) {
    const expenseObj = {
      id: key,
      amount: response.data[key].amount,
      date: new Date(response.data[key].date),
      description: response.data[key].description
    };
    expenses.push(expenseObj);
  }

  return expenses;
}

export async function updateExpense(id, expenseData, token) {
  return axios.put(STRIPEFB_BACKEND_URL + `/expenses/${id}.json?auth=${token}`, expenseData).catch(function (error) {
    if (error.response) {
      // Request made and server responded
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }

  });
}

export async function deleteExpense(id, token) {
  return axios.delete(STRIPEFB_BACKEND_URL + `/expenses/${id}.json?auth=${token}`).catch(function (error) {
    if (error.response) {
      // Request made and server responded
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }

  });
}


export async function storeAccount(accountData, token) {

  console.log("Store Account Token ",token);
    const response = await axios.post(STRIPEFB_BACKEND_URL + '/accounts.json?auth='+ token, accountData).catch(function (error) {
        if (error.response) {
          // Request made and server responded
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log('Error', error.message);
        }
    
      });
    const id = response.data.name;
    console.log('Store Account Response Data '+ id);
    return id;
  }
  
  export async function fetchAccounts(token) {
    const response = await axios.get(STRIPEFB_BACKEND_URL + '/accounts.json?auth='+ token).catch(function (error) {
        if (error.response) {
          // Request made and server responded
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log('Error', error.message);
        }
    
      });
  
    const accounts = [];
  
    for (const key in response.data) {
      const accountObj = {
        id: key,
        name: response.data[key].name,
        createddate: new Date(response.data[key].createddate),
        description: response.data[key].description,
        secretkey: response.data[key].secretkey,
        apiendpoint: response.data[key].apiendpoint,
      };
      accounts.push(accountObj);
    }
  
    return accounts;
  }
  
  export async function updateAccount(id, accountData, token) {
    return axios.put(STRIPEFB_BACKEND_URL + `/accounts/${id}.json?auth=${token}`, accountData).catch(function (error) {
        if (error.response) {
          // Request made and server responded
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log('Error', error.message);
        }
    
      });
  }
  
  export async function deleteAccount(id, token) {
    return axios.delete(STRIPEFB_BACKEND_URL + `/accounts/${id}.json?auth=${token}`).catch(function (error) {
        if (error.response) {
          // Request made and server responded
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log('Error', error.message);
        }
    
      });
  }

  //User APIs
  export async function storeUser(userData, token) {  
    const response = await axios.post(STRIPEFB_BACKEND_URL + '/users.json?auth='+ token, userData).catch(function (error) {
      if (error.response) {
        // Request made and server responded
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
  
    });
    const data = response.data;
    return data;
  }

  export async function fetchUserDetails(token) {
    const response = await axios.get(STRIPEFB_BACKEND_URL + '/users.json?auth='+ token).catch(function (error) {
      if (error.response) {
        // Request made and server responded
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
      console.log("Fetch user Details hrrp")
    });
  
    const users = [];
    for (const key in response.data) {
      const userObj = {
        id: key,
        email:response.data[key].email,
        fname: response.data[key].fname,
        lname: response.data[key].lname,
        mname: response.data[key].mname,
        phoneno:response.data[key].phoneno,
        street:response.data[key].street,
        unit:response.data[key].unit,
        city:response.data[key].city,
        state:response.data[key].state,
        postalcode:response.data[key].postalcode,
        country:response.data[key].country,
        dateofbirth:response.data[key].dateofbirth,
        cntrytaxresidence:response.data[key].cntrytaxresidence,
        fundingsource:response.data[key].fundingsource,
      };
      users.push(userObj);
    }
  
    return users;
  }

  export async function updateUser(id, userData, token) {
    return axios.put(STRIPEFB_BACKEND_URL + `/users/${id}.json?auth=${token}`, userData).catch(function (error) {
      if (error.response) {
        // Request made and server responded
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
  
    });
  }


  export async function storeParty(expenseData, token) {  
    const response = await axios.post(`${STRIPEFB_BACKEND_URL}/parties.json?auth=${token}`, expenseData).catch(function (error) {
      if (error.response) {
        // Request made and server responded
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
  
    });
    const id = response.data.name;
    return id;
  }
  
  export async function fetchParties(token, uid) {
    console.log("Fetch parties ", STRIPEFB_BACKEND_URL, token, uid);
      const response = await axios.get(STRIPEFB_BACKEND_URL + '/parties.json?auth='+ token).catch(function (error) {
      //const response = await axios.get(`${STRIPEFB_BACKEND_URL}/parties.json?auth=${token}&orderBy=${uid}`).catch(function (error) {
      if (error.response) {
        // Request made and server responded
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
  
    });
  
    const parties = [];
    console.log("Fetch parties response ", response.data);
    for (const key in response.data) {
      const parrtyObj = {
        id: key,
        location: response.data[key].location,
        date: new Date(response.data[key].date),
        description: response.data[key].description,
        uid: response.data[key].uid
      };
      if(parrtyObj.uid === uid)
        parties.push(parrtyObj);
    }
    console.log("Fetch parties response 1", parties);
    return parties;
  }
  
  export async function updateParty(id, expenseData, token) {
    return axios.put(STRIPEFB_BACKEND_URL + `/parties/${id}.json?auth=${token}`, expenseData).catch(function (error) {
      if (error.response) {
        // Request made and server responded
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
  
    });
  }
  
  export async function deleteParty(id, token) {
    return axios.delete(STRIPEFB_BACKEND_URL + `/parties/${id}.json?auth=${token}`).catch(function (error) {
      if (error.response) {
        // Request made and server responded
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
  
    });
  }

  export async function storeContact(contactData, token) {  
    const response = await axios.post(`${STRIPEFB_BACKEND_URL}/contacts.json?auth=${token}`, contactData).catch(function (error) {
      if (error.response) {
        // Request made and server responded
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
  
    });
    const id = response.data.name;
    return id;
  }
  
  export async function fetchContacts(token, uid) {
    console.log("Fetch contacts ", STRIPEFB_BACKEND_URL, token, uid);
      const response = await axios.get(STRIPEFB_BACKEND_URL + '/contacts.json?auth='+ token).catch(function (error) {
      //const response = await axios.get(`${STRIPEFB_BACKEND_URL}/parties.json?auth=${token}&orderBy=${uid}`).catch(function (error) {
      if (error.response) {
        // Request made and server responded
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
  
    });
  
    const parties = [];
    console.log("Fetch contact response ", response.data);
    for (const key in response.data) {
      const contactObj = {
        id: key,
        firstname: response.data[key].firstname,
        lastname: new Date(response.data[key].lastname),
        email: response.data[key].email,
        phoneno: response.data[key].phoneno,
        uid: response.data[key].uid,
      };
      if(contactObj.uid === uid)
        parties.push(contactObj);
    }
    console.log("Fetch parties response 1", parties);
    return parties;
  }
  
  export async function updateContact(id, expenseData, token) {
    return axios.put(STRIPEFB_BACKEND_URL + `/contacts/${id}.json?auth=${token}`, expenseData).catch(function (error) {
      if (error.response) {
        // Request made and server responded
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
  
    });
  }
  
  export async function deleteContact(id, token) {
    return axios.delete(STRIPEFB_BACKEND_URL + `/contacts/${id}.json?auth=${token}`).catch(function (error) {
      if (error.response) {
        // Request made and server responded
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
  
    });
  }