import React from "react";
import { useContext, useState, useEffect } from 'react';
import { View, Text, Pressable, SafeAreaView, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getAllUsers } from "../util/friend";
import { AuthContext } from "../store/auth-context";
import { FriendsContext } from "../store/friends-context";
import ErrorOverlay from '../components/ui/ErrorOverlay';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { Card } from 'react-native-paper';

export default function AddFriend({ navigation }) {
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState();
    const authCtx = useContext(AuthContext);
    const token = authCtx.token;
    const friendsCtx = useContext(FriendsContext);
    const [allUsers, setAllUsers] = useState([]);
    const [renderData, setRenderData] = useState();
    const [selected, setSelected] = useState([]);

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
                users.users.forEach(element => {
                    element.selected = false;
                    console.log("For eavch ", element.selected)
                });
                // for(let data in users.users){
                //     console.log("########", data);
                // }
                setRenderData(users.users);
                console.log("Render Data Set", renderData);

            } catch (error) {
                setError('Could not fetch accounts!');
            }
            setIsFetching(false);
            console.log("Render Data 1", renderData);
        }

        getUsers();
    }, []);

    if (error && !isFetching) {
        return <ErrorOverlay message={error} />;
    }

    if (isFetching) {
        return <LoadingOverlay />;
    }

    function onPressHandler(item) {
        console.log("Render Data asasasas ", item, item.selected);
        console.log("Render Data 111", renderData);
        item.selected = true;
        // let renderDataTemp = [...renderData];
        // console.log("Select 1", renderDataTemp);
        // for(let data of renderDataTemp){            
        //     if (data.id === item.id) {
        //         console.log("Data", data, item);
        //         if(data.selected == true){
        //             data.selected = false;
        //             item.selected = false;
        //         }else{
        //             data.selected = true;
        //             item.selected = true;
        //         }
        //     }
        //     console.log("Selected item equals end", item.selected, data.selected);
        // }

        // for (let data of renderDataTemp) {
        //     console.log("Selected item equals 1", data.id, data.selected);
        //     console.log("Selected item equals 2", item.id, item.selected);
        //     if (data.id === item.id) {
        //         console.log("Selected item equals", data.id, data.selected);

        //         if(data.selected === "undefined"){
        //             // data.selected = true;
        //             // item.selected = true;
        //         }else if(data.selected == true){
        //             data.selected = false;
        //             item.selected = false;
        //         }else{
        //             data.selected = true;
        //             item.selected = true;
        //         }

        //         console.log("Selected item equals end", item.selected, data.selected);
        //         //data.selected = (data.selected == "undefined") ? true : !data.selected;
        //         //item.selected = (item.selected == "undefined") ? true : !item.selected;
        //         break;
        //     }
        // }
        // console.log("Select 2", renderDataTemp);
        // console.log("Select 3", {renderDataTemp});
        // //setSelected({renderData});
        setRenderData(renderData);
        console.log("Select 4", renderData);
    }

    return (
        <View>
            <FlatList
                //horizontal={true}
                data={renderData}
                keyExtractor={item => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => onPressHandler(item)}>
                        <Card
                            style={
                                item.selected == true
                                    ? {
                                        padding: 10,
                                        borderRadius: 5,
                                        backgroundColor: '#463',
                                    }
                                    : {
                                        padding: 10,
                                        borderRadius: 5,
                                        backgroundColor: '#958',
                                    }
                            }>
                            <Text>{item.email}</Text>
                        </Card>
                    </TouchableOpacity>
                )}
            // renderItem={({ item }) => {
            //     console.log('item: ', item);
            //     <TouchableOpacity onPress={() => onPressHandler(item)}>

            //         <Text>{item.email}</Text>
            //     </TouchableOpacity>
            //   }
            //renderItem={({ item }) => (

            // <TouchableOpacity onPress={() => onPressHandler(item)}>
            //     <Card
            //         style={
            //             item.selected == true
            //                 ? {
            //                     padding: 10,
            //                     borderRadius: 5,
            //                     backgroundColor: '#000000',
            //                 }
            //                 : {
            //                     padding: 10,
            //                     borderRadius: 5,
            //                     backgroundColor: '#a1a1a1',
            //                 }
            //         }>
            //         <Text>{item.first_name}</Text>
            //     </Card>
            // </TouchableOpacity>
            //)
            //}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    image: {
        flex: 1,
        justifyContent: 'center',
    },
    text: {
        color: 'white',
        fontSize: 42,
        lineHeight: 84,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: '#000000c0',
    },
});