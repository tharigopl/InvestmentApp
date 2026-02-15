import { SafeAreaView, StyleSheet, Text, View, FlatList, Pressable, Button } from 'react-native';
import React from 'react';
import { Feather } from "@expo/vector-icons";
import GoalComponent from '../components/GoalComponent';

export default function ThaiTripScreen() {

    const goals = [
        {
            id: "1",
            name: "Flight",
            value:"20000",
        },
        {
            id: "2",
            name: "Food",
            value:"6000",
        },
        {
            id: "3",
            name: "Stay",
            value:"10000",
        },
        {
            id: "4",
            name: "Drinks",
            value:"20000",
        },
    ];

  return (
    <SafeAreaView style={styles.thaitripscreen}>
    <View style={styles.goalstopContainer}>
		<View style={styles.goalsheader}>
			<Text style={styles.goalsheading}>Goals</Text>

	{/* 👇🏻 Logs "ButtonPressed" to the console when the icon is clicked */}
			<Pressable onPress={() => console.log("Button Pressed!")}>
				<Feather name='edit' size={24} color='green' />
			</Pressable>
		</View>
	</View>
    <View style={styles.goallistContainer}>
        {goals.length > 0 ? (
            <FlatList
                data={goals}
                renderItem={({ item }) => <GoalComponent item={item} />}
                keyExtractor={(item) => item.id}
                numColumns={2}
            />
        ) : (
            <View style={styles.goalemptyContainer}>
                <Text style={styles.goalemptyText}>No goals created!</Text>
                <Text>Click the icon above to create a goal room</Text>
            </View>
        )}
    </View>
    
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
    thaitripscreen: {
        backgroundColor: "#F7F7F7",
        flex: 1,
        padding: 10,
        position: "relative",
    },
    goalstopContainer: {
        backgroundColor: "#F7F7F7",
        height: 70,
        width: "100%",
        padding: 20,
        justifyContent: "center",
        marginBottom: 15,
        elevation: 2,
    },
    goalsheader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    goalsheading: {
        fontSize: 24,
        fontWeight: "bold",
        color: "green",
    },
    goallistContainer: {
        paddingHorizontal: 10,
        flexDirection: "row",
    },
    goalemptyContainer: {
        width: "100%",
        height: "80%",
        alignItems: "center",
        justifyContent: "center",
    },
    goalemptyText: { fontWeight: "bold", fontSize: 24, paddingBottom: 30 },
    messagingscreen: {
        flex: 1,
    },
})