import React from "react";
import { useContext, useState, useEffect } from "react";
import Button from '../components/ui/Button';
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { getAllUsers } from "../util/friend";
import { AuthContext } from "../store/auth-context";
import { FriendsContext } from "../store/friends-context";
import ErrorOverlay from "../components/ui/ErrorOverlay";
import LoadingOverlay from "../components/ui/LoadingOverlay";
import { Card } from "react-native-paper";
import MultiSelectFriendList from "../components/FriendsOutput/MultiSelectFriendList";
import { addFriends } from "../util/user";

export default function MultiSelectAddFriend({navigation}) {
    const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState();
  const authCtx = useContext(AuthContext);
  const token = authCtx.token;
  const friendsCtx = useContext(FriendsContext);
  const [allUsers, setAllUsers] = useState([]);
  const [renderData, setRenderData] = useState();
  const [selected, setSelected] = useState([]);

  const [selectedItems, setSelectedItems] = useState([]);

  const handleSelectedItemsChange = (newSelectedItems) => {
    setSelectedItems(newSelectedItems);
  };

  useEffect(() => {
    async function getUsers() {
      setIsFetching(true);
      try {
        console.log("Inside Add friend " + token);
        const users = await getAllUsers(token);
        //setFetchedAccounts(accounts);
        console.log("Inside All users 99999 ", users.users);
        //console.log("Inside All users 99999 ", users.users);
        setAllUsers(users);
        users.users.forEach((element) => {
          element.selected = false;
          console.log("For eavch ", element.selected);
        });
        // for(let data in users.users){
        //     console.log("########", data);
        // }
        setRenderData(users.users);
        console.log("Render Data Set", renderData);
      } catch (error) {
        setError("Could not fetch accounts!");
      }
      setIsFetching(false);
      console.log("Render Data 1", renderData);
    }

    getUsers();
  }, []);

  const addFriend = async (emailidlist) => {
    console.log("Add Friend ", emailidlist);

    try {
      const response = await addFriends(
        authCtx.token,
        emailidlist,
        authCtx.uid
      );
      console.log(response.data);
      //setData(response.users); // Assuming the API response contains an array of data
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  function cancelHandler() {
    navigation.goBack();
  }

  const submitHandler = () => {
    // Check if the item is already selected, then remove it from selectedItems
    // Otherwise, add it to the selectedItems array
    console.log("selectedItems ", selectedItems);
    let selItemsTemp = [...selectedItems];
    let emailIdList = "";
    for (let data of selItemsTemp) {
      console.log("Selected Data ", data);
      emailIdList += data.email + ",";
    }

    console.log("Email List ", emailIdList.slice(0, -1));
    addFriend(emailIdList.slice(0, -1));
  };

  if (error && !isFetching) {
    return <ErrorOverlay message={error} />;
  }

  if (isFetching) {
    return <LoadingOverlay />;
  }

  return (
    <View style={styles.container}>
      <View>
        <MultiSelectFriendList
          data={renderData}
          selectedItems={selectedItems}
          onSelectedItemsChange={handleSelectedItemsChange}
        />
      </View>
      <View style={styles.buttons}>
        <Button style={styles.button} mode="flat" onPress={cancelHandler}>
          Cancel
        </Button>
        <Button style={styles.button} onPress={submitHandler}>
          Save
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    justifyContent: "center",
  },
  text: {
    color: "white",
    fontSize: 42,
    lineHeight: 84,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#000000c0",
  },
  button: {
    minWidth: 120,
    marginHorizontal: 8,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
