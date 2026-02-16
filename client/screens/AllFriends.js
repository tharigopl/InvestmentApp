import { useContext, useState, useEffect } from 'react';
import ErrorOverlay from '../components/ui/ErrorOverlay';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import FriendsOutput from '../components/FriendsOutput/FriendsOutput';
import { FriendsContext } from '../store/friends-context';
import { getAllUsersForFriends, getAllFriendsForUser } from '../util/friend';
import { AuthContext } from '../store/auth-context';

function AllFriends() {


  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState();
  const [selectedItems, setSelectedItems] = useState([]);

  const authCtx = useContext(AuthContext);
  const token = authCtx.token;
  const friendsCtx = useContext(FriendsContext);
  
  useEffect(() => {
    async function getUsersForFriendsList() {
      setIsFetching(true);
      try {
        console.log("All friends 1", token, authCtx.uid);
        const friends = await getAllFriendsForUser(token, authCtx.uid);
        console.log("All friends in Use Effect after getAllUsersForFriends",friends);
        console.log("test", friendsCtx.setFriends(friends));
        console.log("Inside Recent friends Auth  ",friendsCtx.friends);
      } catch (error) {
        setError('Could not fetch friends!');
      }
      setIsFetching(false);
    }

    getUsersForFriendsList();
  }, []);

  if (error && !isFetching) {
    return <ErrorOverlay message={error} />;
  }

  if (isFetching) {
    return <LoadingOverlay />;
  }


  return (
    <FriendsOutput
      friends={friendsCtx.friends}
      fallbackText="No registered friends found!"
    />
  );
}

export default AllFriends;