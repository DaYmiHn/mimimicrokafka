import KafkaApp from './KafkaApp';

interface OptionI {
  name: string,
  brokers: string[],
  ssl: boolean,
  sasl: any
}

export default class Gateway extends KafkaApp {
  _producerStarting: boolean;
  _consumerStarting: boolean;

  constructor(options: OptionI) {
    super({
      requestTimeout: 25000,
      ...options,
    });
    this._producerStarting = false;
    this._consumerStarting = false;
  }

  async _startProducer() {
    if (!this._producerStarting) {
      await this.createProducerConnection();
      this._producerStarting = true;
    }
  }

  async _startConsumers() {
    if (!this._consumerStarting) {
      await this.createConsumeConnection(this._name);

      const eachMessage = async ({ _, message }: any) => {
        const { requestId, data, req } = JSON.parse(message.value.toString());
        this.resolveRequest(requestId, data, req);
      };

      await this.listenMessages({ eachMessage });
      this._consumerStarting = true;
    }
  }

  middleware() {
    if (!this._producerStarting) {
      this._startProducer();
    }
    if (!this._consumerStarting) {
      this._startConsumers();
    }
    return async (req: any, res: any, next: Function) => {
      res.delegate = async (name: string) => {
        const message = this.createMessage(req, {});
        const promise = this.newRequest(message.requestId, res);

        await this.sendMessage(name, message);
        return promise;
      };

      return next();
    };
  }
}
