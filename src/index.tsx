import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { ApolloClient, InMemoryCache, ApolloProvider, DefaultOptions } from '@apollo/client';
import React from 'react';
import ReactDOM from 'react-dom';

import App from '~/App';

const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'ignore',
  },
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
};

const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: 'http://localhost:2020/graphql',
  defaultOptions,
});

ReactDOM.render(
  <ApolloProvider client={client}>
    <App />{' '}
  </ApolloProvider>,
  document.getElementById('root'),
);
