import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import React from 'react';
import ReactDOM from 'react-dom';

import App from '~/App';

const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: 'http://localhost:2020/graphql',
});

ReactDOM.render(
  <ApolloProvider client={client}>
    <App />{' '}
  </ApolloProvider>,
  document.getElementById('root'),
);
