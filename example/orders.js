import { Microservice } from 'mimimicrokafka'

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
      data: 132,
    },
  }, req);
  console.log(req.user);
  return res.json(data);
});

app.start();
