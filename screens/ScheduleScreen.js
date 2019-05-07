import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  FlatList,
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback
} from 'react-native';
import { TabViewAnimated, TabViewPagerScroll } from 'react-native-tab-view';
import Touchable from 'react-native-platform-touchable';
import { DATO_API_KEY } from 'react-native-dotenv';

//import scheduleByDay from "../data/scheduleByDay.json";
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import PurpleGradient from '../components/PurpleGradient';
import DayToggle from '../components/DayToggle';
import TalkCard from '../components/TalkCard';
import BreakCard from '../components/BreakCard';
import NavigationEvents from '../utilities/NavigationEvents';

import moment from 'moment';
import _ from 'lodash';

let LIMIT = 10;
let eventDates = ['2018-06-21', '2018-06-22', '2018-06-23', '2018-06-24'];

class ScheduleScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      index: 0,
      routes: [
        { key: 'd1', day: 0 },
        { key: 'd2', day: 1 },
        { key: 'd3', day: 2 }
      ],
      events: null,
      offsets: [0, 0, 0],
      loading: true
    };
  }
  _scheduleDayRef = {};

  static navigationOptions = {
    title: 'Schedule'
  };

  componentWillMount() {
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

  // componentWillReceiveProps(next) {
  //   if (next.data.d1) {
  //     let events = [];
  //     let { d1, d2, d3 } = next.data;
  //     events[0] = d1.map(e => this._formatEvent(e));
  //     events[1] = d2.map(e => this._formatEvent(e));
  //     events[2] = d3.map(e => this._formatEvent(e));

  //     console.log(events);
  //     this.setState({ events });
  //   }
  //   //this._formatData(next.data);
  // }

  async doQuery(payload) {
    try {
      return await fetch('https://graphql.datocms.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${DATO_API_KEY}`
        },
        body: JSON.stringify(payload)
      }).then(res => res.json());
    } catch (error) {
      console.log('QUERY ERROR', error, 'on query', payload);
      throw error;
    }
  }

  _loadmore(index) {
    console.log('loadMore ');
    this.setState({ loading: true });
    this.loadMore(index);
  }
  async loadMore(index) {
    let { events, offsets } = this.state;
    let _offset = offsets[index] + LIMIT;
    let loading = false;
    console.log('loadMore ', {
      limit: LIMIT,
      offset: _offset,
      start: eventDates[index],
      end: eventDates[index + 1]
    });

    try {
      let response = await this.doQuery({
        query: eventsXday,
        variables: {
          limit: LIMIT,
          offset: _offset,
          start: eventDates[index],
          end: eventDates[index + 1]
        }
      });
      console.log('loadMore OK');
      if (response.data) {
        next_events = response.data.allTalks.map(e => this._formatEvent(e));
        events[index] = [...events[index], ...next_events];
        //events[index] = next_events;
        events[index] = _.uniqBy(events[index], e => e.id);
        offsets[index] = _offset;
        this.setState({ events, loading, offsets });
      }
    } catch (err) {
      console.log('catch', err);
    }
  }

  async getData() {
    console.log('get data');
    let loading = false;
    try {
      let response = await this.doQuery({
        query: eventsQuery,
        variables: { limit: LIMIT, offset: 0 }
      });
      if (response.data) {
        let { d1, d2, d3 } = response.data;
        console.log('OK');
        let events = [];
        events[0] = d1.map(e => this._formatEvent(e));
        events[1] = d2.map(e => this._formatEvent(e));
        events[2] = d3.map(e => this._formatEvent(e));

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
              Layout.dayToggleHeight
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
        loadMore={this._loadmore.bind(this)}
      />
    );
  };

  _formatEvent = e => {
    let event = Object.assign({}, e);
    // if (e.image && e.image.url) event.avatarURL = e.image.url;
    let d = moment(e.time).format('YYYY-MM-DD');
    event.d = '' + d;
    event.eventStart = event.time;
    event.eventEnd = moment(event.time).add(event.duration, 'mins');
    event.type = event.speakerInfo.length ? 'talk' : 'boh';
    if (event.speakerInfo.length == 0) {
      event.options = []; //e.options.split("\n");
      event.veganOptions = [];
    } else {
      event.avatarURL = event.speakerInfo[0].image.url;
    }
    return event;
  };

  _formatData = data => {
    //let { data } = this.props;
    console.log('LEN' + data.allEvents.length);
    var events = _.chain(data.allEvents)
      .map(e => {
        return this._formatEvent(e);
      })
      .groupBy('d')
      .toPairs()
      .map(function(currentItem) {
        // console.log(currentItem);
        return _.zipObject(['day', 'items'], currentItem);
      })
      .value();

    //console.log(events);

    this.setState({ events });
  };
}

const frag = `
  fragment commonFields on TalkRecord {
    description
    id
    title
    time
    duration
    speakerInfo: speakers {
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
    allTalks(
      first: $limit
      skip: $offset
      orderBy: time_ASC
      filter: { time: { gt: $start, lt: $end } }
    ) {
      ...commonFields
    }
  }

  ${frag}
`;

const eventsQuery = `
  query Days($limit: IntType!, $offset: IntType) {
    d1: allTalks(
      first: $limit
      skip: $offset
      orderBy: time_ASC
      filter: { time: { gt: "2018-06-21", lt: "2018-06-22" } }
    ) {
      ...commonFields
    }
    d2: allTalks(
      first: $limit
      skip: $offset
      orderBy: time_ASC
      filter: { time: { gt: "2018-06-22", lt: "2018-06-23" } }
    ) {
      ...commonFields
    }
    d3: allTalks(
      first: $limit
      skip: $offset
      orderBy: time_ASC
      filter: { time: { gt: "2018-06-23", lt: "2018-06-24" } }
    ) {
      ...commonFields
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
      waitingToRender: !!props.fadeInOnRender
    };
  }

  componentWillMount() {
    if (this.props.fadeInOnRender) {
      requestAnimationFrame(() => {
        this.setState({ waitingToRender: false }, () => {
          Animated.timing(this.state.visible, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true
          }).start();
        });
      });
    }
  }

  render() {
    if (this.state.waitingToRender) {
      return (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
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
            backgroundColor: 'transparent'
          }}
        >
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

        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Touchable
            style={styles.touchable}
            background={Touchable.Ripple('#ccc', false)}
            fallback={TouchableWithoutFeedback}
            onPress={e => {
              console.log('click');
              this.props.loadMore(this.props.index);
            }}
          >
            <View>
              <Text style={{ color: 'white' }}>Load more...</Text>
            </View>
          </Touchable>
        </View>
      </View>
    );
  }

  scrollToTop = () => {
    this._list.scrollToOffset({ x: 0, y: 0 });
  };

  _renderItem = ({ item }) => {
    if (item.type === 'talk') {
      return <TalkCard details={item} />;
      // } else if (item.type === "loadmore") {
      //   return <LoadCard {...props} />;
    } else {
      return <BreakCard details={item} />;
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  page: {
    width: Layout.window.width
  },
  row: {
    flex: 1,
    backgroundColor: Colors.snow,
    marginVertical: Layout.smallMargin
  },
  boldLabel: {
    fontWeight: 'bold',
    color: Colors.text
  },
  label: {
    color: Colors.text
  },
  listContent: {
    paddingTop: Layout.baseMargin,
    paddingBottom: 20
  },
  timeline: {
    width: 2,
    backgroundColor: '#6E3C7B',
    position: 'absolute',
    top: 85,
    bottom: 0,
    right: 11
  }
});
