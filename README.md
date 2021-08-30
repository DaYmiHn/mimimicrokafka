# mimiMicroKafka
Node.js Library for building microservices communicating via Kafka

[![npm package](https://img.shields.io/badge/npm%20i-mimimicrokafka-darkgreen)](https://www.npmjs.com/package/mimimicrokafka) 
[![status](https://img.shields.io/badge/status-realese-darkgreen)](https://www.npmjs.com/package/mimimicrokafka) 
[![version number](https://img.shields.io/npm/v/mimimicrokafka?color=darkgreen&label=version)](https://github.com/daymihn/mimimicrokafka/releases) 
[![License](https://img.shields.io/github/license/daymihn/mimimicrokafka)](https://github.com/DaYmiHn/mimimicrokafka/blob/main/LICENSE)
<!-- [![Actions Status](https://github.com/daymihn/mimimicrokafka/workflows/Test/badge.svg)](https://github.com/daymihn/mimimicrokafka/actions)  -->

## Install

```sh
$ npm i mimimicrokafka
```

## Usage

```js
import { Gateway, Microservice } from 'mimimicrokafka';
```

## API:

### Gateway

#### constructor(options)
- `options` <[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>
  - `name` <[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)> Uniq name for gateway.
  - `microservices` <[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)>> Microservices for connect.
  - `brokers` <[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)>> Uri for connection to brokers.
  
#### Use gateway
```js
const gateway = new Gateway({
  name: 'gateway',
  microservices: ['orders'],
  brokers: ['localhost:9092'],
});

app.use(gateway.middleware());
```

#### res.delegate(nameMicroservice)
After initializat middleware, you can redirect requests from gateway to any microservice
```js
app.use('/orders', async (req, res) => res.delegate('orders'));
```
#### microservice.ask(nameMicroservice)\[metod\](params, req)
Sends a request to another microservice from any service
- `microservice` <[Gateway | Microservice](#)> Class of any microservice.
- `nameMicroservice` <[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)> Name microservice which we are sending the request.
- `metod` <[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)> post | get | put | delete
  - `params` <[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)> Here you can complete request.
  - `req` <[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)> Raw req from parent request.
```js
app.use(async (req, res, next) => {
  const data = await gateway.ask('jwt').post({path: '/jwt/check'}, req);
  req.user = data.req.user;
  next();
});
```
## For example:

### index.js
```js
import express from 'express'
import bodyParser from 'body-parser'
import { Gateway } from 'mimimicrokafka'

const app = express();
app.use(bodyParser.json());

const gateway = new Gateway({
  name: 'gateway',
  microservices: ['orders'],
  brokers: ['localhost:9092'],
});

app.use(gateway.middleware());

app.use(async (req, res, next) => {
  const data = await gateway.ask('jwt').post({path: '/jwt/check'}, req);
  req.user = data.req.user;
  next();
});

app.use('/orders', async (req, res) => res.delegate('orders'));
app.use('/users', async (req, res) => res.delegate('users'));
app.use('/auth', async (req, res) => res.delegate('auth'));

app.listen(8080, () => console.log('listening 8080...'));
```

### orders.js
```js
import { Microservice } from 'mimimicrokafka'

const app = new Microservice({
  microservice: 'orders',
  brokers: ['localhost:9092'],
});

app.get('/orders', async (req, res) => res.send('req.body'));

app.post('/orders', async (req, res) => res.json(req.body));

app.post('/orders/123', async (req, res) => {
  const {data} = await app.ask('users').post({path: '/users', body: {
    data: req.body.data + 1,
  }}, req);
  console.log(req.user);
  return res.json(data);
});

app.start();
```

## TODO:
-  add KafkaStreams capability
-  optimize the route for returning the answer to gateway
-  add the ability to raise your server through the "http" library without "express"

### Pull request welcome ✌🏻