import React from 'react';
import {
  AppRegistry,
  Alert,
  StatusBar,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import { AppLoading, Notifications } from 'expo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Images from './constants/Images';
import RootNavigation from './navigation/RootNavigation';
import Colors from './constants/Colors';
import cacheAssetsAsync from './utilities/cacheAssetsAsync';
import NavigationEvents from './utilities/NavigationEvents';

console.disableYellowBox = true;

export default class App extends React.Component {
  state = {
    appIsReady: false,
  };
  UNSAFE_componentWillMount() {
    this._initializeAsync();
    this._listenForNotifications();
  }

  _listenForNotifications = () => {
    Notifications.addListener(notification => {
      if (notification.origin === 'received' && Platform.OS === 'ios') {
        Alert.alert(
          'A friendly reminder',
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
            'Montserrat-Bold': require('./assets/fonts/Montserrat-Bold.ttf'),
          },
          {
            'Montserrat-SemiBold': require('./assets/fonts/Montserrat-SemiBold.ttf'),
          },
          {
            'Montserrat-Medium': require('./assets/fonts/Montserrat-Medium.ttf'),
          },
          {
            'Montserrat-Light': require('./assets/fonts/Montserrat-Light.ttf'),
          },
          {
            'Montserrat-Regular': require('./assets/fonts/Montserrat-Regular.ttf'),
          },
        ],
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
        <View style={styles.container}>
          <RootNavigation
            onNavigationStateChange={(prevState, currentState) => {
              NavigationEvents.emit('change', { prevState, currentState });
            }}
          />
          <StatusBar barStyle="light-content" backgroundColor={Colors.purple} />
        </View>
      );
    } else {
      return <AppLoading />;
    }
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#140034',
  },
});

AppRegistry.registerComponent('Conference', () => App);
