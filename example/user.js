import { Microservice } from './../src/index.js'

const app = new Microservice({
  microservice: 'users',
  brokers: ['localhost:9092'],
});

app.post('/users', async (req, res) => {
  var { data } = await app.ask('users', {
    path: '/users/14',
    method: 'get',
    body: {
      data: req.body.data + 12,
    },
  }, req);

  var { data } = await app.ask('auth', {
    path: '/auth',
    method: 'post',
  }, req);
  console.log(req.user);
  return res.json(data);
});

app.get('/users/14', async (req, res) => res.json(req.body));

app.start();
