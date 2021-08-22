import KafkaApp from './KafkaApp';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default class MicroService extends KafkaApp {
  post: any;
  get: any;
  put: any;
  delete: any;
  _endpoints: any;
  resMock: any;
  _consumersStarting: any;
  _name: any;
  _requests: any;
  resolveRequest: any;
  listenMessages: any;
  createConsumeConnection: any;
  createMessage: any;
  sendMessage: any;
  createProducerConnection: any;

  constructor(options: any) {
    super(options);
    this._endpoints = {};

    ['post', 'get', 'put', 'delete'].forEach((method) => {
      this[method as keyof MicroService] = this.endpointSaver(method);
    });

    this.resMock = ['send', 'json'].reduce(
      (res, cur) => ({
        ...res,
        [cur]: (data: any) => data,
      }),
      {}
    );
  }

  async _startConsumers() {
    if (!this._consumersStarting) {
      await this.createConsumeConnection(this._name);

      const eachBatch = async ({ batch, isRunning, isStale }: any) => {
        for (const message of batch.messages) {
          if (!isRunning() || isStale()) break;

          const messageObj = JSON.parse(message.value.toString());
          const { sender, path, method, data, ask, requestId } = messageObj;

          console.log(
            '\x1b[36m%s\x1b[0m',
            `pass message from "${sender}"\t id - "${requestId}"`
          );

          const endpoint =
            this._endpoints[path] && this._endpoints[path][method];

          if (endpoint) {
            const response = endpoint(messageObj, this.resMock);
            response.then((data: any) => {
              const newMessage = this.createMessage(messageObj, {
                requestId: messageObj.requestId,
                data,
                req: messageObj,
                ask,
              });

              if (!this._requests.get(requestId)) {
                this.sendMessage(sender, newMessage);
              } else {
                this.resolveRequest(requestId, data, messageObj);
              }
            });
          } else {
            this.resolveRequest(requestId, data, messageObj);
          }
        }
      };
      this.listenMessages({ eachBatch });
      this._consumersStarting = true;
    }
  }

  endpointSaver(method: any) {
    return (endpoint: string, callback: void) => {
      this._endpoints[endpoint] = {
        ...this._endpoints[endpoint],
        [method]: callback,
      };
    };
  }

  async start() {
    await this.createProducerConnection();
    await this._startConsumers();
  }
}
