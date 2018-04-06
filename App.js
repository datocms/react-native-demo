import React from 'react';
import { AppRegistry } from 'react-native';
import { ApolloClient } from 'apollo-client';
import { ApolloProvider } from 'react-apollo';
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import {
  IntrospectionFragmentMatcher,
  InMemoryCache
} from 'apollo-cache-inmemory';
import introspectionQueryResultData from './fragmentTypes.json';
import Foo from './Foo';

const token = 'de09ccc913e5107b80a51e92247ae1';

const httpLink = createHttpLink({
  uri: 'https://site-api.datocms.com/graphql',
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: Object.assign(
      headers || {},
      {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    )
  }
});

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({ fragmentMatcher }),
});

export default class App extends React.Component {
  render() {
    return (
      <ApolloProvider client={client}>
        <Foo />
      </ApolloProvider>
    );
  }
}

AppRegistry.registerComponent('Conference', () => App);

