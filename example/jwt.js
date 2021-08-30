import crypto from 'crypto';
import { Microservice } from './../src/index.js';

const app = new Microservice({
  microservice: 'jwt',
  brokers: ['localhost:9092'],
});

const users = [
  {
    id: '321',
    login: 'denis',
    password: '123456',
  },
];

const tokenKey = '1a2b-6784-2579-dfg4';

app.post('/jwt/check', async (req, res) => {
  if (req.headers.authorization) {
    const tokenParts = req.headers.authorization.split(' ')[1].split('.');

    const signature = crypto
      .createHmac('SHA256', tokenKey)
      .update(`${tokenParts[0]}.${tokenParts[1]}`)
      .digest('base64');

    if (signature === tokenParts[2]) {
      req.user = JSON.parse(
        Buffer.from(tokenParts[1], 'base64').toString('utf8')
      );
    } else {
      req.user = { jopa: '324345345' };
    }
  }
  res.json({ success: true });
});

app.post('/jwt/auth', async (req, res) => {
  for (const user of users) {
    if (req.body.login === user.login && req.body.password === user.password) {
      const head = Buffer.from(
        JSON.stringify({ alg: 'HS256', typ: 'jwt' })
      ).toString('base64');
      const body = Buffer.from(JSON.stringify(user)).toString('base64');
      const signature = crypto
        .createHmac('SHA256', tokenKey)
        .update(`${head}.${body}`)
        .digest('base64');

      return res.status(200).json({
        id: user.id,
        login: user.login,
        token: `${head}.${body}.${signature}`,
      });
    }
  }

  return res.json({ token: false });
});

app.start();
