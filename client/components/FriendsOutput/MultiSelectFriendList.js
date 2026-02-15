import React, { useState } from 'react';
import { View, FlatList, Text, TouchableOpacity } from 'react-native';
import { addFriends } from "../../util/user";

const MultiSelectFriendList = ({ data, selectedItems, onSelectedItemsChange }) => {
    const toggleItemSelection = (item) => {
        const updatedSelectedItems = selectedItems.includes(item)
          ? selectedItems.filter((selected) => selected !== item)
          : [...selectedItems, item];
    
        onSelectedItemsChange(updatedSelectedItems);
      };

  const renderItem = ({ item }) => {
    const isSelected = selectedItems.includes(item);

    return (
      <TouchableOpacity
        style={{
          padding: 10,
          backgroundColor: isSelected ? 'lightblue' : 'white',
          borderBottomWidth: 1,
          borderColor: 'gray',
        }}
        onPress={() => toggleItemSelection(item)}
      >
        <Text>{item.email}</Text>
      </TouchableOpacity>
    );
  };

  

  return (
    <View>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
      <Text>Selected items: {selectedItems.map(item => item.email).join(', ')}</Text>
    </View>
  );
};

export default MultiSelectFriendList;
