import { FlatList, StyleSheet, View } from 'react-native';
import Button from '../ui/Button';
import FriendItem from './FriendItem';
import { useState } from 'react';

function FriendsList({ friends }) {

  const [selectedId, setSelectedId] = useState([]);
  //console.log("Friends list ", friends);   

  function renderFriendItem(itemData) {

        return <FriendItem {...itemData.item} onPress={() => setSelectedId(itemData.item.id)} />;
    }

    function onSave() {
        console.log("Save Data", selectedId);        
    }

  return (
    <View>
        <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item._id}
            />
    </View>
    
  );
}

export default FriendsList;

const styles = StyleSheet.create({
    button: {
        minWidth: 120,
        marginHorizontal: 8,
      }
});