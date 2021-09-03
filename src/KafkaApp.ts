import { Kafka, Producer, Consumer, SASLOptions } from 'kafkajs';
import { nanoid } from 'nanoid';

type TConnectionType = '_producerConnection' | '_consumerConnection';

interface OptionI {
  name: string,
  brokers: string[],
  sasl: SASLOptions,
  ssl: boolean,
  requestTimeout?: number,
}

export default class KafkaApp {
  options: OptionI;
  _producerConnection: any;
  _consumerConnection: any;
  _requests: any;
  _name: string;
  _admin: any;

  constructor(options: OptionI) {
    this.options = options;
    this._requests = new Map();
    this._name = options.name;
  }

  async createConnection({
    type,
    options = undefined,
  }: {
    type: 'producer' | 'consumer';
    options?: any;
  }) {
    const connectionType: TConnectionType =
      `_${type}Connection` as TConnectionType;

    if (!this[connectionType]) {
      this[connectionType] = new Kafka({
        clientId: 'my-app',
        ...this.options
      });

      this._admin = this[connectionType].admin();

      this[connectionType] = this[connectionType][type](options) as Producer | Consumer;

      await this[connectionType].connect();
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

  async sendMessage(service: string, payload: any) {
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
    type MethodT = { post?: Function; get?: Function; put?: Function; delete?: Function };

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
