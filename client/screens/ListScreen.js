import { useContext, useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import { AuthContext } from "../store/auth-context";
import { getAllUsers } from "../util/friend";
import { addFriends } from "../util/user";
import Button from '../components/ui/Button';

const ListScreen = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const authCtx = useContext(AuthContext);


  useEffect(() => {
    // Fetch the list of values here
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await getAllUsers(authCtx.token);
      setData(response.users); // Assuming the API response contains an array of data
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleSelectItem = (item) => {
    // Check if the item is already selected, then remove it from selectedItems
    // Otherwise, add it to the selectedItems array
    setSelectedItems((prevSelectedItems) =>
      prevSelectedItems.some((selectedItem) => selectedItem.id === item.id)
        ? prevSelectedItems.filter((selectedItem) => selectedItem.id !== item.id)
        : [...prevSelectedItems, item]
    );
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedItems.some((selectedItem) => selectedItem.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.itemContainer, isSelected && styles.selectedItemContainer]}
        onPress={() => handleSelectItem(item)}
      >
        <Text style={styles.itemText}>{item.email}</Text>
        <View style={styles.checkboxContainer}>
          {isSelected && <View style={styles.checkbox} />}
        </View>
      </TouchableOpacity>
    );
  };

  const addFriend = async (emailidlist) => {

    console.log("Add Friend ", emailidlist)
    
    try {
      const response = await addFriends(authCtx.token, emailidlist, authCtx.uid);
      console.log(response.data);
      //setData(response.users); // Assuming the API response contains an array of data
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const submitHandler = () => {
    // Check if the item is already selected, then remove it from selectedItems
    // Otherwise, add it to the selectedItems array
    console.log("selectedItems ", selectedItems);
    let selItemsTemp = [...selectedItems];
    let emailIdList = "";
    for(let data of selItemsTemp){
        console.log("Selected Data ", data);
        emailIdList += data.email + ",";
      }

      console.log("Email List ", emailIdList.slice(0, -1));
      addFriend(emailIdList.slice(0, -1));
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()} // Replace "id" with the unique key of your data
      />
      <Button style={styles.button} onPress={submitHandler}>
          Save
        </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  selectedItemContainer: {
    backgroundColor: '#d3d3d3', // Change this to any color you prefer for selected items
  },
  itemText: {
    flex: 1,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#000', // Change this to any color you prefer for the checkbox
  },
  button: {
    minWidth: 120,
    marginHorizontal: 8,
  },
});

export default ListScreen;
