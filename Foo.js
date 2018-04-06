import { graphql } from "react-apollo";
import gql from "graphql-tag";
import React from "react";
import { StyleSheet, Text, View, Button, Image } from "react-native";

function Foo({ data }) {
  console.log(data);
  return (
    <View>
      {!(data && data.allEvents) && <Text>loading...</Text>}
      {data &&
        data.allEvents &&
        data.allEvents.map(item => <Text key={item.id}>{item.title}</Text>)}
    </View>
  );
}

export default graphql(gql`
  query TodoAppQuery {
    allEvents(
      orderBy: time_ASC
      first: 100
      filter: { time: { lt: "2017-07-11" } }
    ) {
      title
      time
      duration
      image {
        url
      }
      card {
        ... on TalkRecord {
          _modelApiKey
          speakers {
            name
          }
        }
        ... on BreakRecord {
          _modelApiKey
          breakType
        }
      }
    }
  }
`)(Foo);
