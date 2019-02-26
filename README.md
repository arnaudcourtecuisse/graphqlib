# GraphQLib

GraphQLib is a GraphQL client library for node.js that includes a dynamic request builder with fragments support.

## Install
```
yarn add graphqlib
```
```
npm install --save graphqlib
```

## Supported features

* queries
* fragments

## Usage

```javascript
const graphqlib = require('graphqlib');

const client = graphqlib.client({
  uri: 'https://my-graphql-server.com',
  token 'm7sup3rs3cr3tt0k3n',
});

// Hmm, what should I order ?
const pizzaQuery = graphqlib.query('pizzaList')
  .addSubfields('ingredients', 'price');
const availablePizzas = await client.send(pizzaQuery);

// Oh, no, I'm broke !
const cheapPizzaQuery = pizzaRequest.addArgs({ maxPrice: 6 });
const cheapPizzas = await client.send(cheapPizzaQuery);
```

### Use fragments

```javascript
// Create the fragment
const pizzaFragment = graphlib
  .fragment('pizza', 'Pizza')
  .addSubfields('ingredients', 'price');

// Declare the fragment to the client
const client = graphqlib.client({ uri, token }, [pizzaFragment]);

// Build the query with the fragment
const pizzaQuery = graphqlib.query('pizzaList').addFragments('pizza');

// The client will now include the fragment in the request
const pizzas = await client.send(pizzaQuery);

// OK ?
```
## Client options
```javascript
options = {
  uri, // required. the URI to the server
  token, // required. the auth token
  removeEdges: false, // will format the response : { data: { edges: [{ node: { answer: 42 } }] } } => [{ answer: 42 }]
}
```

## Feedback and contribution

This is a very early-stage work.
Any contribution and feedback is welcome.

Please submit your issues and contributions to the [github.com repository](https://github.com/cyctemic/graphqlib)
