import { StyleSheet, Text, View } from 'react-native';

import { GlobalStyles } from '../../constants/styles';
import FriendsList from './FriendsList';
import FriendsSummary from './FriendsSummary';

function FriendsOutput({ friends, fallbackText }) {
  let content = <Text style={styles.infoText}>{fallbackText}</Text>;
    console.log("Friends Output ", friends);
  if (friends.length > 0) {
    content = <FriendsList friends={friends} />;
  }

  console.log("Friends Output 1", content);

  return (
    <View style={styles.container}>
      {/* <FriendsSummary friends={friends} /> */}
      {content}
    </View>
  );
}

export default FriendsOutput;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 0,
    backgroundColor: GlobalStyles.colors.primary700,
  },
  infoText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
});