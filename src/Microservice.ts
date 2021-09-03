import KafkaApp from './KafkaApp';

interface OptionI {
  name: string,
  brokers: string[],
  ssl: boolean,
  sasl: any
}

export default class MicroService extends KafkaApp {
  post?: Function;
  get?: Function;
  put?: Function;
  delete?: Function;
  _endpoints: any;
  resMock: object;
  _consumersStarting: boolean;

  constructor(options: OptionI) {
    super({
      requestTimeout: 25000,
      ...options,
    });
    this._endpoints = {};
    this._consumersStarting = false;

    ['post', 'get', 'put', 'delete'].forEach((method: string) => {
      let endpoint = method as 'post' | 'get' | 'put' | 'delete'
      this[endpoint] = this.endpointSaver(method);
    });
    
    this.resMock = ['send', 'json'].reduce(
      (res, cur) => ({
        ...res,
        [cur]: (data: any) => data,
      }),
      {}
    );
  }

  async _startConsumers():Promise<void> {
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

  endpointSaver(method: string):Function {
    return (endpoint: string, callback: void) => {
      this._endpoints[endpoint] = {
        ...this._endpoints[endpoint],
        [method]: callback,
      };
    };
  }

  async start():Promise<void> {
    await this.createProducerConnection();
    await this._startConsumers();
  }
}
