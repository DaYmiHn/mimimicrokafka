# Node.js Library for building microservices communicating via Kafka

[![npm package](https://img.shields.io/badge/npm%20i-mimimicrokafka-darkgreen)](https://www.npmjs.com/package/mimimicrokafka) 
[![status](https://img.shields.io/badge/status-in%20dev-yellow)](https://www.npmjs.com/package/mimimicrokafka) 
[![version number](https://img.shields.io/npm/v/mimimicrokafka?color=green&label=version)](https://github.com/daymihn/mimimicrokafka/releases) 
[![License](https://img.shields.io/github/license/daymihn/mimimicrokafka)](https://github.com/DaYmiHn/mimimicrokafka/blob/main/LICENSE)
<!-- [![Actions Status](https://github.com/daymihn/mimimicrokafka/workflows/Test/badge.svg)](https://github.com/daymihn/mimimicrokafka/actions)  -->


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
  const data = await gateway.ask('jwt', {
    path: '/jwt/check',
    method: 'post',
  }, req);

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
import { Microservice } from 'example-typescript-package'

const app = new Microservice({
  microservice: 'orders',
  brokers: ['localhost:9092'],
});

app.get('/orders', async (req, res) => res.send('req.body'));

app.post('/orders', async (req, res) => res.json(req.body));

app.post('/orders/123', async (req, res) => {
  const { data } = await app.ask('users', {
    path: '/users',
    method: 'post',
    body: {
      data: 228,
    },
  }, req);
  console.log(req.user);
  return res.json(data);
});

app.start();
```

## TODO:
- [ ] add KafkaStreams capability
- [ ] optimize the route for returning the answer to gateway
- [ ] add the ability to raise your server through the "http" library without "express"