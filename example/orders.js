import { Microservice } from './../src/index.js';

const app = new Microservice({
  microservice: 'orders',
  brokers: ['localhost:9092'],
});

app.get('/orders', async (req, res) => res.send('req.body'));

app.post('/orders', async (req, res) => res.json(req.body));

app.post('/orders/123', async (req, res) => {
  const { data } = await app.ask('users').post(
    {
      path: '/users',
      body: {
        data: req.body.data + 1,
      },
    },
    req
  );

  return res.json(data);
});

app.start();
