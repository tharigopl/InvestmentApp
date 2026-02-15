import { Pressable, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useState, useContext } from 'react';
import { FriendsContext } from '../../store/friends-context';
import { GlobalStyles } from '../../constants/styles';


function FriendItem({ id, email, firstname, lastname, isMarkedForDeletion }) {
    const navigation = useNavigation();
    const [selected, setSelected] = useState('');
    

    const friendsCtx = useContext(FriendsContext);
    console.log("Is Selected Friend Item ", friendsCtx.friends);

    function friendPressHandler() {
        // navigation.navigate('ManageFriend', {
        //   friendId: id
        // });

    }

    return (        
        <Pressable
          onPress={friendPressHandler}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <View style={styles.friendItem}>
            <View>
              <Text style={[styles.textBase, styles.email]}>
                {email}
              </Text>
              {/* <Text style={styles.textBase}>{lastname}</Text> */}
            </View>
            {/* <View style={styles.firstnameContainer}>
              <Text style={styles.firstname}>{firstname}</Text>
            </View> */}
          </View>
        </Pressable>
    );
}

export default FriendItem;

const styles = StyleSheet.create({
    pressed: {
        opacity: 0.75,
    },
    friendItem: {
        padding: 12,
        marginVertical: 8,
        backgroundColor: GlobalStyles.colors.primary500,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderRadius: 6,
        elevation: 3,
        shadowColor: GlobalStyles.colors.gray500,
        shadowRadius: 4,
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.4,
    },
    friendItemSelected: {
        padding: 12,
        marginVertical: 8,
        backgroundColor: GlobalStyles.colors.primary800,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderRadius: 6,
        elevation: 3,
        shadowColor: GlobalStyles.colors.gray500,
        shadowRadius: 4,
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.4,
    },
    textBase: {
        color: GlobalStyles.colors.primary50,
    },
    email: {
        fontSize: 16,
        marginBottom: 4,
        fontWeight: 'bold',
    },
    firstnameContainer: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
        minWidth: 80,
    },
    firstname: {
        color: GlobalStyles.colors.primary500,
        fontWeight: 'bold',
    },
});
