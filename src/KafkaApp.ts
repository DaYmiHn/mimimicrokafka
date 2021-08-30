import { Kafka } from 'kafkajs';
import { nanoid } from 'nanoid';

type TConnectionType = '_producerConnection' | '_consumerConnection';

export default class KafkaApp {
  options: any;
  _producerConnection: any;
  _consumerConnection: any;
  _requests: any;
  _name: any;
  _connection: any;
  _admin: any;

  constructor(options: any) {
    this.options = options;
    this._producerConnection = null;
    this._consumerConnection = null;
    this._requests = new Map();
    this._name = options.microservice || options.name;
  }

  async createConnection({
    type,
    options = undefined,
  }: {
    type: 'producer' | 'consumer';
    options?: any;
  }) {
    if (!this._connection) {
      const connectionType: TConnectionType =
        `_${type}Connection` as TConnectionType;

      this[connectionType as keyof KafkaApp] = new Kafka({
        clientId: 'my-app',
        brokers: this.options.brokers,
        requestTimeout: 25000,
      });

      this._admin = this[connectionType as keyof KafkaApp].admin();

      this[connectionType as keyof KafkaApp] =
        this[connectionType as keyof KafkaApp][type](options);

      await this[connectionType as keyof KafkaApp].connect();
      await this.addEventListenersForCrash(connectionType);
    }
  }

  async createProducerConnection() {
    await this.createConnection({
      type: 'producer',
    });
  }

  async createConsumeConnection(topic: string) {
    await this.createConnection({
      type: 'consumer',
      options: {
        groupId: nanoid(),
      },
    });
    await this._consumerConnection.subscribe({ topic });
  }

  async listenMessages({ eachMessage, eachBatch }: any) {
    await this._consumerConnection.run({
      eachMessage,
      eachBatch,
    });
  }

  async addEventListenersForCrash(
    type: '_producerConnection' | '_consumerConnection'
  ) {
    const connection = this[type];
    const { CRASH, DISCONNECT, REQUEST_TIMEOUT } = connection.events;

    [CRASH, DISCONNECT, REQUEST_TIMEOUT]
      .filter((el) => !!el)
      .forEach((event) => {
        connection.on(event, () => {
          this[type] = null;
          this.createConnection({
            type: 'consumer',
            options: {
              groupId: nanoid(),
            },
          });
        });
      });
  }

  newRequest(requestId: string, res = null) {
    let resolve;
    const promise = new Promise((r) => (resolve = r));

    this._requests.set(requestId, {
      resolve,
      res,
    });
    return promise;
  }

  resolveRequest(requestId: string, data: any, req: any) {
    const { res, resolve } = this._requests.get(requestId);
    res && res.send(data);
    resolve({ requestId, data, req });
    this._requests.delete(requestId);
  }

  async sendMessage(service: any, payload: any) {
    console.log(
      '\x1b[33m%s\x1b[0m',
      `send message to - "${service}" with id "${payload.requestId}"\n`
    );
    return await this._producerConnection.send({
      topic: service,
      timeout: 3000,
      messages: [
        {
          key: nanoid(),
          value: JSON.stringify(payload),
        },
      ],
    });
  }

  createMessage(req: any, newFields: any) {
    return {
      path: (req.originalUrl || req.url || req.path).split('?')[0],
      method: req.method.toLowerCase(),
      params: req.params,
      query: req.query,
      body: req.body,
      headers: req.headers,
      cookies: req.cookies,
      session: req.session,
      user: req.user,
      connection: {
        connecting: req.connection.connecting,
        destroyed: req.connection.destroyed,
        localAddress: req.connection.localAddress,
        localPort: req.connection.localPort,
        pending: req.connection.pending,
        remoteAddress: req.connection.remoteAddress,
        remoteFamily: req.connection.remoteFamily,
        remotePort: req.connection.remotePort,
      },
      sender: this._name,
      ...newFields,
      requestId: newFields.requestId || nanoid(),
    };
  }

  ask(name: string) {
    type MethodT = { post?: any; get?: any; put?: any; delete?: any };

    const methods: MethodT = {};

    ['post', 'get', 'put', 'delete'].forEach((method: string) => {
      methods[method as keyof MethodT] = (query: any, req: any) => {
        req.method = method;
        const message = this.createMessage(req, { ...query });
        const promise = this.newRequest(message.requestId);
        this.sendMessage(name, message);
        return promise;
      };
    });
    return methods;
  }
}
