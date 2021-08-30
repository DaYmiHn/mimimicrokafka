import { Microservice } from './../src/index.js';

const app = new Microservice({
  microservice: 'auth',
  brokers: ['localhost:9092'],
});

app.post('/auth', async (req, res) => {
  const { data } = await app.ask('users').get({ path: '/users/14' }, req);
  console.log(req.user);
  return res.json(data);
});

app.start();
