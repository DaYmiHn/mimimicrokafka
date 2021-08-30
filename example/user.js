import { Microservice } from './../src/index.js';

const app = new Microservice({
  microservice: 'users',
  brokers: ['localhost:9092'],
});

app.post('/users', async (req, res) => {
  var { data } = await app.ask('users').post(
    {
      path: '/users/14',
      body: {
        data: req.body.data + 12,
      },
    },
    req
  );

  console.log(req.user);
  var { data } = await app.ask('auth').post({ path: '/auth' }, req);

  return res.json(data);
});

app.get('/users/14', async (req, res) => res.json(req.body));

app.start();
