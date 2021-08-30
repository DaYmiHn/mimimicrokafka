import express from 'express';
import bodyParser from 'body-parser';
import { Gateway } from './../src/index.js';

const app = express();
app.use(bodyParser.json());

const gateway = new Gateway({
  name: 'gateway',
  microservices: ['orders'],
  brokers: ['localhost:9092'],
});

app.use(gateway.middleware());

app.use(async (req, res, next) => {
  const data = await gateway.ask('jwt').post({ path: '/jwt/check' }, req);
  req.user = data.req.user;
  next();
});

app.use('/orders', async (req, res) => res.delegate('orders'));
app.use('/users', async (req, res) => res.delegate('users'));
app.use('/auth', async (req, res) => res.delegate('auth'));

app.listen(8080, () => console.log('listening 8080...'));
