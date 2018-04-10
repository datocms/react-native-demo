import React from "react";
import { AppRegistry } from "react-native";
import { ApolloClient } from "apollo-client";
import { ApolloProvider } from "react-apollo";
import { createHttpLink } from "apollo-link-http";
import { setContext } from "apollo-link-context";
import {
  IntrospectionFragmentMatcher,
  InMemoryCache
} from "apollo-cache-inmemory";
import introspectionQueryResultData from "./fragmentTypes.json";
import Foo from "./Foo";

import {
  Alert,
  StatusBar,
  Platform,
  StyleSheet,
  Text,
  View
} from "react-native";
import { AppLoading, KeepAwake, Notifications } from "expo";
import { Provider } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";

import Images from "./constants/Images";
import RootNavigation from "./navigation/RootNavigation";
import Colors from "./constants/Colors";
import cacheAssetsAsync from "./utilities/cacheAssetsAsync";
import NavigationEvents from "./utilities/NavigationEvents";

console.disableYellowBox = true;
Text.defaultProps.allowFontScaling = false;

const token = "de09ccc913e5107b80a51e92247ae1";

const httpLink = createHttpLink({
  uri: "https://site-api.datocms.com/graphql"
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: Object.assign(headers || {}, {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    })
  };
});

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({ fragmentMatcher })
});

export default class App extends React.Component {
  state = {
    appIsReady: false
  };
  componentWillMount() {
    this._initializeAsync();
    this._listenForNotifications();
  }

  _listenForNotifications = () => {
    Notifications.addListener(notification => {
      if (notification.origin === "received" && Platform.OS === "ios") {
        Alert.alert(
          "A friendly reminder",
          `"${notification.data.title}" is starting soon!`
        );
      }
    });
  };

  async _initializeAsync() {
    try {
      await cacheAssetsAsync({
        images: Images.forLocalCache,
        fonts: [
          Ionicons.font,
          {
            "Montserrat-Bold": require("./assets/fonts/Montserrat-Bold.ttf")
          },
          {
            "Montserrat-SemiBold": require("./assets/fonts/Montserrat-SemiBold.ttf")
          },
          {
            "Montserrat-Medium": require("./assets/fonts/Montserrat-Medium.ttf")
          },
          {
            "Montserrat-Light": require("./assets/fonts/Montserrat-Light.ttf")
          },
          {
            "Montserrat-Regular": require("./assets/fonts/Montserrat-Regular.ttf")
          }
        ]
      });
    } catch (e) {
      console.log(e);
    } finally {
      this.setState({ appIsReady: true });
    }
  }

  render() {
    if (this.state.appIsReady) {
      return (
          <ApolloProvider client={client}>
            <View style={styles.container}>
              <RootNavigation
                onNavigationStateChange={(prevState, currentState) => {
                  NavigationEvents.emit("change", { prevState, currentState });
                }}
              />
              {__DEV__ && <KeepAwake />}
              <StatusBar
                barStyle="light-content"
                backgroundColor={Colors.purple}
              />
            </View>
          </ApolloProvider>
      );

    } else {
      return <AppLoading />;
    }
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#140034"
  }
});

AppRegistry.registerComponent("Conference", () => App);
