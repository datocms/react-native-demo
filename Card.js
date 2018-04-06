import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  duration: {
    fontSize: 13,
    color: '#555',
  }
});

const Card = ({ event }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {event.title}
      </Text>
      <Text style={styles.duration}>
        {event.duration} minutes
      </Text>
    </View>
  );
}

export default Card;
