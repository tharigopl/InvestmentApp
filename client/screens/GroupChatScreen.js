import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';

const GroupChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [users, setUsers] = useState([
    { id: 1, name: 'User 1' },
    { id: 2, name: 'User 2' },
    { id: 3, name: 'User 3' },
  ]);
  const [currentUser, setCurrentUser] = useState(users[0]);

  // Function to handle sending a message
  const sendMessage = () => {
    // Perform any necessary logic before sending the message

    // Create a new message object
    const newMessage = {
      id: messages.length + 1, // Generate a unique ID for the message
      text: inputText,
      sender: currentUser,
    };

    // Update the messages state with the new message
    setMessages([...messages, newMessage]);

    // Clear the input field after sending the message
    setInputText('');
  };

  // Render each message in the FlatList
  const renderMessage = ({ item }) => (
    <View>
      <Text>{item.sender.name}: {item.text}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
      />

      {/* Input field for typing messages */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          style={{ flex: 1, height: 40, borderWidth: 1, paddingHorizontal: 10 }}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
        />
        <TouchableOpacity onPress={sendMessage} style={{ padding: 10 }}>
          <Text>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GroupChatScreen;