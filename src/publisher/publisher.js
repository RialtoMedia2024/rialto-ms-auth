const { Kafka, logLevel } = require("kafkajs");
//const { KAFKA_BROKER_1 } = require("../configs/constants");
console.clear();
/* the client ID lets kafka know who's producing the messages*/
const clientId = "ms-auth";
/*list of brokers in the cluster*/
const brokers = [process.env.KAFKA_BROKER_1];
var producer = undefined;

class Publisher {
  constructor() {
    // initialize a new kafka client and initialize a producer from it
    const kafka = new Kafka({ clientId, brokers, logLevel: logLevel.DEBUG });
    producer = kafka.producer({});
  }
  /* function that writes a new message */
  async send(topic, data) {
    try {
      await producer.connect();
      await producer.send({
        topic: topic,
        acks: 1,
        messages: [
          {
            key: "data",
            value: data,
          },
        ],
      });

      console.log("writes: ", data);
    } catch (err) {
      console.error("could not write message " + err);
    }
  }
}

module.exports = new Publisher();
