import { View, Text, Pressable, StyleSheet, TextInput } from "react-native";
import React, { useLayoutEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
//import { styles } from "../constants/chatstyles";

const GoalComponent = ({ item }) => {
    const navigation = useNavigation();
    const [goals, setGoals] = useState({});
    console.log('Inside GoalComponent', item);
    //👇🏻 Retrieves the last message in the array from the item prop
    useLayoutEffect(() => {
        setGoals(item);
    }, []);

    ///👇🏻 Navigates to the Messaging screen
    const handleNavigation = () => {
        navigation.navigate("Messaging", {
            id: item.id,
            name: item.name,
        });
    };

    return (
        <Pressable style={styles.goal} onPress={handleNavigation}>
            {/* <Ionicons
                name='person-circle-outline'
                size={45}
                color='black'
                style={styles.cavatar}
            /> */}

            {
                item.name === 'Flight' ? <MaterialIcons name="flight" size={24} color="black" /> :
                    item.name === "Food" ? <MaterialCommunityIcons name="food" size={24} color="black" /> :
                        item.name === 'Stay' ? <MaterialIcons name="hotel" size={24} color="black" /> :
                            item.name === 'Drinks' ? <MaterialIcons name="liquor" size={24} color="black" /> :
                            <MaterialIcons name="liquor" size={24} color="black" />
            }

            

            <View style={styles.goalrightContainer}>
                <View>
                    <Text style={styles.goalname}>{item.name}</Text>

                    <Text style={styles.goalprogress}>
                        {goals?.text ? goals.text : "Progress"}
                    </Text>
                </View>
                <View>
                        {
                            goals?.value ? "Rs: " + goals.value : "Rs: 0"
                        }
                    <TextInput style={styles.goalvalue}>
                        
                    </TextInput>
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    loginscreen: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#EEF1FF",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        width: "100%",
    },
    loginheading: {
        fontSize: 26,
        marginBottom: 10,
    },
    logininputContainer: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    logininput: {
        borderWidth: 1,
        width: "90%",
        padding: 8,
        borderRadius: 2,
    },
    loginbutton: {
        backgroundColor: "green",
        padding: 12,
        marginVertical: 10,
        width: "60%",
        borderRadius: "50%",
        elevation: 1,
    },
    loginbuttonText: {
        textAlign: "center",
        color: "#fff",
        fontWeight: "600",
    },
    chatscreen: {
        backgroundColor: "#F7F7F7",
        flex: 1,
        padding: 10,
        position: "relative",
    },
    chatheading: {
        fontSize: 24,
        fontWeight: "bold",
        color: "green",
    },
    chattopContainer: {
        backgroundColor: "#F7F7F7",
        height: 70,
        width: "100%",
        padding: 20,
        justifyContent: "center",
        marginBottom: 15,
        elevation: 2,
    },
    chatheader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    chatlistContainer: {
        paddingHorizontal: 10,
    },
    chatemptyContainer: {
        width: "100%",
        height: "80%",
        alignItems: "center",
        justifyContent: "center",
    },
    chatemptyText: { fontWeight: "bold", fontSize: 24, paddingBottom: 30 },
    messagingscreen: {
        flex: 1,
    },
    messaginginputContainer: {
        width: "100%",
        minHeight: 100,
        backgroundColor: "white",
        paddingVertical: 30,
        paddingHorizontal: 15,
        justifyContent: "center",
        flexDirection: "row",
    },
    messaginginput: {
        borderWidth: 1,
        padding: 15,
        flex: 1,
        marginRight: 10,
        borderRadius: 20,
    },
    messagingbuttonContainer: {
        width: "30%",
        backgroundColor: "green",
        borderRadius: 3,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 50,
    },
    modalbutton: {
        width: "40%",
        height: 45,
        backgroundColor: "green",
        borderRadius: 5,
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
    },
    modalbuttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },
    modaltext: {
        color: "#fff",
    },
    modalContainer: {
        width: "100%",
        borderTopColor: "#ddd",
        borderTopWidth: 1,
        elevation: 1,
        height: 400,
        backgroundColor: "#fff",
        position: "absolute",
        bottom: 0,
        zIndex: 10,
        paddingVertical: 50,
        paddingHorizontal: 20,
    },
    modalinput: {
        borderWidth: 2,
        padding: 15,
    },
    modalsubheading: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
    },
    mmessageWrapper: {
        width: "100%",
        alignItems: "flex-start",
        marginBottom: 15,
    },
    mmessage: {
        maxWidth: "50%",
        backgroundColor: "#f5ccc2",
        padding: 15,
        borderRadius: 10,
        marginBottom: 2,
    },
    mvatar: {
        marginRight: 5,
    },
    goal: {
        flex:1,
        width: "50%",
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 5,
        paddingHorizontal: 15,
        backgroundColor: "#fff",
        height: 80,
        marginBottom: 5,
        marginRight:5,
    },
    cavatar: {
        marginRight: 15,
    },
    goalname: {
        fontSize: 18,
        marginBottom: 5,
        fontWeight: "bold",
    },
    goalprogress: {
        fontSize: 14,
        opacity: 0.7,
    },
    goalrightContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        flex: 1,
    },
    goalvalue: {
        opacity: 0.5,
    },
  });

export default GoalComponent;