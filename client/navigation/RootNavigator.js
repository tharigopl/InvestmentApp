import { NavigationContainer } from "@react-navigation/native";
import HostStack from "./HostStack";

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <HostStack />
    </NavigationContainer>
  );
}