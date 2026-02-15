import { createContext, useReducer } from 'react';

export const FriendsContext = createContext({
  friends: [],
  addFriend: ({ email, firstname, lastname }) => {},
  setFriends: (friends) => {},
  deleteFriend: (id) => {},
  updateFriend: (id, { email, firstname, lastname }) => {},
});

function friendsReducer(state, action) {
  switch (action.type) {
    case 'ADD':
        {
            console.log("Action payload", action.payload);
            return [action.payload, ...state];
        }      
    case 'SET':
      {
        console.log("Action payload", action.payload)
        const inverted = action.payload.reverse();
        return inverted;
      }
    case 'UPDATE':
      const updatableFriendIndex = state.findIndex(
        (friend) => friend.id === action.payload.id
      );
      const updatableFriend = state[updatableFriendIndex];
      const updatedItem = { ...updatableFriend, ...action.payload.data };
      const updatedFriends = [...state];
      updatedFriends[updatableFriendIndex] = updatedItem;
      return updatedFriends;
    case 'DELETE':
      return state.filter((friend) => friend.id !== action.payload);
    default:
      return state;
  }
}

function FriendsContextProvider({ children }) {
  const [friendsState, dispatch] = useReducer(friendsReducer, []);

  function addFriend(friendData) {
    dispatch({ type: 'ADD', payload: friendData });
  }

  function setFriends(friends) {
    dispatch({ type: 'SET', payload: friends });
  }

  function deleteFriend(id) {
    dispatch({ type: 'DELETE', payload: id });
  }

  function updateFriend(id, friendData) {
    dispatch({ type: 'UPDATE', payload: { id: id, data: friendData } });
  }

  const value = {
    friends: friendsState,
    setFriends: setFriends,
    addFriend: addFriend,
    deleteFriend: deleteFriend,
    updateFriend: updateFriend,
  };

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
}

export default FriendsContextProvider;