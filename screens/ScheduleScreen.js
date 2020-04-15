import React from 'react';
import { DATO_API_TOKEN } from 'react-native-dotenv';
import {
  ActivityIndicator,
  Animated,
  Platform,
  FlatList,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { TabViewAnimated, TabViewPagerScroll } from 'react-native-tab-view';

import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import PurpleGradient from '../components/PurpleGradient';
import DayToggle from '../components/DayToggle';
import TalkCard from '../components/TalkCard';
import BreakCard from '../components/BreakCard';
import NavigationEvents from '../utilities/NavigationEvents';
import Constants from 'expo-constants';

import moment from 'moment';
import _ from 'lodash';

let LIMIT = 20;

class ScheduleScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      index: 0,
      routes: [
        { key: 'd1', day: 0 },
        { key: 'd2', day: 1 },
      ],
      events: null,
      offsets: [0, 0, 0],
      loading: true,
    };
  }
  _scheduleDayRef = {};

  static navigationOptions = {
    title: 'Schedule',
  };

  UNSAFE_componentWillMount() {
    this._tabPressedListener = NavigationEvents.addListener(
      'selectedTabPressed',
      route => {
        if (route.key === 'Schedule') {
          this._scrollToTop();
        }
      }
    );
  }

  componentWillUnmount() {
    this._tabPressedListener.remove();
  }

  _scrollToTop = () => {
    let scheduleDay = this._scheduleDayRef[this.state.index];
    scheduleDay && scheduleDay.scrollToTop();
  };

  async doQuery(payload) {
    try {
      return await fetch('https://graphql.datocms.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${DATO_API_TOKEN}`,
        },
        body: JSON.stringify(payload),
      }).then(res => res.json());
    } catch (error) {
      console.log('QUERY ERROR', error, 'on query', payload);
      throw error;
    }
  }

  async getData() {
    let loading = false;
    try {
      let response = await this.doQuery({
        query: eventsQuery,
        variables: { limit: LIMIT, offset: 0 },
      });

      if (response.data) {
        let { d1, d2 } = response.data;
        let events = [];
        events[0] = d1.map(e => this._formatEvent(e));
        events[1] = d2.map(e => this._formatEvent(e));

        this.setState({ events, loading });
      }
    } catch (err) {
      console.log('catch', err);
    }
  }

  componentDidMount() {
    this.getData();
  }

  render() {
    let { events, loading, error } = this.state;

    if (!events || loading) {
      return <Text style={{ marginTop: 64, color: 'white' }}>Loading...</Text>;
    }

    if (error) {
      console.log(error);
      return (
        <View style={{ marginTop: 64, color: 'red' }}>
          An unexpected error occurred
        </View>
      );
    }

    return (
      <PurpleGradient style={styles.container}>
        <TabViewAnimated
          style={{ flex: 1 }}
          lazy={true}
          renderPager={props => <TabViewPagerScroll {...props} />}
          navigationState={this.state}
          renderScene={this._renderPage}
          renderHeader={this._renderHeader}
          onRequestChangeTab={this._handleChangeTab}
          onIndexChange={this._handleChangeTab}
          initialLayout={{
            width: Layout.window.width,
            height:
              Layout.window.height -
              Layout.tabBarHeight -
              Layout.dayToggleHeight,
          }}
        />
      </PurpleGradient>
    );
  }

  _handlePressTab = index => {
    // Scroll to the top if you double tap it
    if (this.state.index === index) {
      this._scrollToTop();
      return;
    }

    this._handleChangeTab(index);
  };

  _handleChangeTab = index => {
    if (Platform.OS === 'ios') {
      this.setState({ index });
    }

    // note(brentvatne): ViewPager is broken (https://github.com/facebook/react-native/issues/14296),
    // so we need to use TabViewPagerScroll, which uses ScrollView and has a small bug on Android
    // this is a workaround
    if (this._tabChangeTimer) {
      return;
    }

    this.setState({ index });
    this._tabChangeTimer = setTimeout(() => {
      this._tabChangeTimer = null;
    }, 300);
  };

  _renderHeader = props => {
    return (
      <DayToggle position={props.position} onPressDay={this._handlePressTab} />
    );
  };

  _renderPage = ({ route }) => {
    const { day } = route;

    return (
      <ScheduleDay
        ref={view => {
          this._scheduleDayRef[day] = view;
        }}
        events={this.state.events[day]}
        fadeInOnRender={day === 1}
        index={day}
      />
    );
  };

  _formatEvent = e => {
    let event = Object.assign({}, e);
    let d = moment(e.time).format('YYYY-MM-DD');
    event.d = '' + d;
    event.eventStart = event.time;
    event.eventEnd = moment(event.time).add(event.duration, 'mins');
    if (
      event.card &&
      event.card[0].speakers &&
      event.card[0].speakers[0].image
    ) {
      event.type = 'talk';
      event.avatarURL = event.card[0].speakers[0].image.url;
    } else {
      event.type = 'break';
      event.options = [];
      event.veganOptions = [];
    }
    return event;
  };

  _formatData = data => {
    var events = _.chain(data.allEvents)
      .map(e => {
        return this._formatEvent(e);
      })
      .groupBy('d')
      .toPairs()
      .map(function(currentItem) {
        return _.zipObject(['day', 'items'], currentItem);
      })
      .value();

    this.setState({ events });
  };
}

const frag = `
  fragment commonFields on TalkRecord {
    description
    id
    speakers {
      id
      company
      name
      image {
        url
        width
        height
      }
    }
    room {
      id
      color {
        alpha
        blue
        green
        hex
        red
      }
      name
    }
  }
`;

const eventsXday = `
  query SchedulesPerDay(
    $limit: IntType
    $offset: IntType
    $start: DateTime
    $end: DateTime
  ) {
    allEvents(
      first: $limit
      skip: $offset
      orderBy: time_ASC
      filter: { time: { gt: $start, lt: $end } }
    ) {
      title
      time
      duration
      card {
        ...commonFields
      }
    }
  }

  ${frag}
`;

const eventsQuery = `
  query Days($limit: IntType!, $offset: IntType) {
    d1: allEvents(
      first: $limit
      skip: $offset
      orderBy: time_ASC
      filter: { time: { gt: "2017-07-10", lt: "2017-07-11" } }
    ) {
      id
      title
      time
      duration
      card {
        ...commonFields
      }
    }
    d2: allEvents(
      first: $limit
      skip: $offset
      orderBy: time_ASC
      filter: { time: { gt: "2017-07-11", lt: "2017-07-12" } }
    ) {
      id
      title
      time
      duration
      card {
        ...commonFields
      }
    }
  }
  ${frag}
`;

export default ScheduleScreen;

class ScheduleDay extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      visible: new Animated.Value(props.fadeInOnRender ? 0 : 1),
      waitingToRender: !!props.fadeInOnRender,
    };
  }

  UNSAFE_componentWillMount() {
    if (this.props.fadeInOnRender) {
      requestAnimationFrame(() => {
        this.setState({ waitingToRender: false }, () => {
          Animated.timing(this.state.visible, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        });
      });
    }
  }

  render() {
    if (this.state.waitingToRender) {
      return (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
            flex: 9,
            opacity: this.state.visible,
            backgroundColor: 'transparent',
          }}>
          <FlatList
            data={this.props.events}
            ref={view => {
              this._list = view;
            }}
            renderItem={this._renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      </View>
    );
  }

  scrollToTop = () => {
    this._list.scrollToOffset({ x: 0, y: 0 });
  };

  _renderItem = ({ item }) => {
    if (item.type === 'talk') {
      return <TalkCard details={item} />;
    } else {
      return <BreakCard details={item} />;
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    width: Layout.window.width,
  },
  row: {
    flex: 1,
    backgroundColor: Colors.snow,
    marginVertical: Layout.smallMargin,
  },
  boldLabel: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  label: {
    color: Colors.text,
  },
  listContent: {
    paddingTop: Layout.baseMargin,
    paddingBottom: 20,
  },
  timeline: {
    width: 2,
    backgroundColor: '#6E3C7B',
    position: 'absolute',
    top: 85,
    bottom: 0,
    right: 11,
  },
});
