import { StyleSheet, View, TextInput, Text, KeyboardAvoidingView } from 'react-native';
import UserForm  from "../components/ManageUser/UserForm";
import contactData from '../data/contact.json';
import { GlobalStyles } from '../constants/styles';
import { USERDETAIL } from '../data/dummy-data';
import { storeUser, fetchUserDetails } from '../util/http';
import { updateUser } from '../util/user';
import { AuthContext } from '../store/auth-context';
import { useContext, useLayoutEffect, useState, useEffect } from 'react';
import { UserContext } from '../store/user-context';

function ManageUser({ route, navigation }){
    
/*     const userDetail = {USERDETAIL};

    const selectedUser = userDetail.USERDETAIL;
    console.log("UserDetail sfsd ", userDetail.USERDETAIL); */

    const [isSubmitting, setIsSubmitting] = useState(false); 
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState();
  

    const authCtx = useContext(AuthContext);
    const token = authCtx.token;
    const userCtx = useContext(UserContext);
    console.log("Manage Users Ctx",userCtx);

    //const editedUserId = route.params?.editedUserId;
    //const isEditing = !!editedUserId;
    const isEditing = true;
    const selectedUser = userCtx.useraccount;
  
    console.log("Edited User", selectedUser);
    

    /* useLayoutEffect(() => {
      navigation.setOptions({
        title: isEditing ? 'Edit User' : 'Add User',
      });
    }, [navigation, isEditing]);
 */
    function cancelHandler() {
        navigation.goBack();
      }
    
      async function confirmHandler(userData) {
        console.log("Confirm Handler", isEditing);
        try {
          if (isEditing) {
            const user = await updateUser(token, authCtx.uid, userData);
            console.log("Confirm Handler 1", user);
            userCtx.setuseraccount(user);
            //userCtx.updateUser(editedUserId, userData);
            //await updateUser(editedUserId, userData, token);
          } else {
            //const id = await storeUser(userData, token);
            
            //userCtx.addUser({ ...userData, id: id });
          }
          navigation.goBack();
        } catch (error) {
         /*  setError('Could not save data - please try again later!');
          setIsSubmitting(false); */
        }
      }


  return (
    <KeyboardAvoidingView style={styles.container}>
      <UserForm
        submitButtonLabel={isEditing ? 'Update' : 'Add'}
        onSubmit={confirmHandler}
        onCancel={cancelHandler}
        defaultValues={selectedUser}
      />
    </KeyboardAvoidingView>
  );
}

export default ManageUser;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      //paddingHorizontal:20,
      //paddingVertical:35,
       paddingTop: 40,
       paddingBottom: 20,
       paddingLeft: 20,
       paddingRight: 20,
      backgroundColor: GlobalStyles.colors.primary800,
    },
    deleteContainer: {
      marginTop: 16,
      paddingTop: 8,
      borderTopWidth: 2,
      borderTopColor: GlobalStyles.colors.primary200,
      alignItems: 'center',
    },
  });