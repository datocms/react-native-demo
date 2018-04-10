import React from "react";
import {
  TouchableOpacity,
  Image,
  View,
  Text,
  StyleSheet,
  LayoutAnimation
} from "react-native";
import Touchable from "react-native-platform-touchable";
import FadeIn from "react-native-fade-in-image";
import Ionicons from "react-native-vector-icons/Ionicons";

import { Colors, Fonts, Images, Layout } from "../constants";
import openExternalMapApp from "../utilities/openExternalMapApp";

import { graphql } from "react-apollo";
import gql from "graphql-tag";
import moment from "moment";
import _ from "lodash";

//const NearbySites = require("../dato/nearby.json");
//const NearbySiteNames = Object.keys(NearbySites);

class NearbySitesGallery extends React.PureComponent {
  state = {
    activeTab: null,
    shouldRenderTabs: false,
    nearbySites: null,
    nearbySiteNames: null
  };

  componentWillMount() {
    requestIdleCallback(() => {
      this.setState({ shouldRenderTabs: true });
    });
  }

  componentWillReceiveProps(next) {
    if (next.data.allNearbies) this._formatData(next.data);
  }

  // todo(brentvatne): improve perf of switching tabs here
  render() {
    if (!this.state.nearbySites || !this.state.shouldRenderTabs) {
      return null;
    }
    const { activeTab, nearbySites, nearbySiteNames } = this.state;
    let result = nearbySites.find(i => i.category == activeTab);
    return (
      <View style={styles.container}>
        <View style={styles.tabs}>
          {nearbySiteNames.map(t => this._renderTab(t))}
        </View>

        <View style={styles.gallery}>{result.items.map(this._renderItem)}</View>
      </View>
    );
  }

  _formatData = data => {
    console.log("FORMAT DATA");
    let nearbySites = _.chain(data.allNearbies)
      .map(nb => {
        let nearby = Object.assign({}, nb);
        delete nearby.category;
        nearby.category = nb.category.name;
        return nearby;
      })
      .groupBy("category")
      .toPairs()
      .map(currentItem => {
        return _.zipObject(["category", "items"], currentItem);
      })

      .value();

    let nearbySiteNames = nearbySites.map(nb => nb.category);
    let activeTab = nearbySiteNames[0];
    let state = { nearbySites, nearbySiteNames, activeTab };
    this.setState(state);
  };

  _setActiveTab = tab => {
    LayoutAnimation.configureNext({
      ...LayoutAnimation.Presets.linear,
      duration: 250
    });

    this.setState({ activeTab: tab });
  };

  _renderTab = tab => {
    const { activeTab } = this.state;
    const isActive = activeTab === tab;

    return (
      <TouchableOpacity
        key={tab}
        style={[styles.tab, isActive && styles.activeTab]}
        onPress={() => this._setActiveTab(tab)}
      >
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
          {tab}
        </Text>
      </TouchableOpacity>
    );
  };

  _renderItem = data => {
    const { name, image, address } = data;

    return (
      <Touchable
        foreground={Touchable.Ripple("#ccc", false)}
        key={name}
        style={styles.item}
        onPress={() => this._handlePress(address)}
      >
        <View>
          <FadeIn placeholderStyle={{ backgroundColor: "#eee" }}>
            <Image
              source={Images[image]}
              resizeMode={"cover"}
              style={[styles.itemImage, { height: 100 }]}
            />
          </FadeIn>
          <View style={styles.itemDetail}>
            <Text style={styles.itemTitle}>{name}</Text>
            <Text style={styles.itemAction}>
              Directions&nbsp;
              <Ionicons
                name="md-arrow-forward"
                size={10}
                style={{ color: Colors.darkPurple, marginBottom: -2 }}
              />
            </Text>
          </View>
        </View>
      </Touchable>
    );
  };

  _handlePress = address => {
    openExternalMapApp(address.replace(/\s/, "+"));
  };
}

const nearbyQuery = gql`
  query NearbyQuery {
    allNearbies {
      name
      address
      image
      category {
        name
      }
    }
  }
`;
export default graphql(nearbyQuery)(NearbySitesGallery);

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  tabs: {
    flexDirection: "row",
    marginTop: 20
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(253,229,255,0.5)",
    padding: 5
  },
  tabText: {
    fontFamily: Fonts.type.base,
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: 0.47,
    color: "rgba(253,229,255,0.5)"
  },
  activeTab: {
    borderBottomColor: Colors.snow
  },
  activeTabText: {
    color: Colors.snow
  },
  gallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
    paddingBottom: 15
  },
  item: {
    margin: 5,
    overflow: "hidden",
    borderRadius: 3,
    width: Layout.screenWidth / 2 - 10
  },
  itemImage: {
    width: Layout.screenWidth / 2 - 10 + 1
  },
  itemDetail: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.snow
  },
  itemTitle: {
    fontFamily: Fonts.type.semiBold,
    fontSize: 15,
    letterSpacing: 0,
    minHeight: 40,
    color: Colors.darkPurple
  },
  itemAction: {
    fontFamily: Fonts.type.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    color: Colors.darkPurple
  }
});
