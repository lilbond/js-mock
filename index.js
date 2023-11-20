const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const kafka = require('kafka-node');

const KafkaConfig = {
	topic: 'tenant.config.events',
	server: 'localhost:29092',
};

const MessageMeta = {
	tenantId: 't1',
	configType: 'c1',
	operation: 'o1',
	config: {
		A: 'a',
		B: 'b',
	},
};

class KafkaMessageProducer {
	getKey = () => {
		return (
			MessageMeta.tenantId +
			'~' +
			MessageMeta.configType +
			'~' +
			MessageMeta.operation
		);
	};
	produce = () => {
		try {
			const Producer = kafka.Producer;
			const client = new kafka.KafkaClient({
				kafkaHost: KafkaConfig.server,
				requestTimeout: 1000,
				connectTimeout: 1000,
			});
			const producer = new Producer(client);

			let payloads = [
				{
					topic: KafkaConfig.topic,
					messages: JSON.stringify(MessageMeta),
					key: this.getKey(),
				},
			];

			producer.on('ready', async function () {
				producer.send(payloads, (err, data) => {
					if (err) {
						console.log(err);
						throw err;
					} else {
						console.log('Send Success');
					}
				});
			});

			producer.on('error', function (err) {
				console.log(err);
				throw err;
			});
		} catch (e) {
			console.log(e);
		}
	};
}

const kafkaMessageProducer = new KafkaMessageProducer();

class Dispatcher {
	constructor() {
		this.mapping = [];
		this.mapping['/mock'] = this._mock;
		this.mapping['/greetings'] = this._greetings;
		this.mapping['/delayed'] = this._delayed;
		this.mapping['/error/500'] = this._serverError;
		this.mapping['/produce'] = this._produce;
	}

	_produce = (req, res) => {
		let success = kafkaMessageProducer.produce();
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ result: 'Initiated' }));
	};

	_mock = (req, res) => {
		const filePath = path.join(__dirname, '/data', req.url + '.json');
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(fs.readFileSync(filePath, 'utf8'));
	};

	// Delay should be a valid number
	_delayed = async (req, res) => {
		let stime = performance.now();
		let urlParts = url.parse(req.url, true);
		let delay = parseInt(urlParts.query.delay || 5000);
		await new Promise((resolve) => setTimeout(resolve, delay));
		let ftime = performance.now();
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ timeTaken: ftime - stime }));
	};

	_greetings = (req, res) => {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ url: req.url }));
	};

	_notFound = (req, res) => {
		res.writeHead(404, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ url: req.url }));
	};

	_serverError = (req, res) => {
		res.writeHead(500, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ url: req.url }));
	};

	handle = (req, res) => {
		let reqUrl = req.url;
		let urlParts = url.parse(reqUrl, true);
		const func = this.mapping[urlParts.pathname];
		if (func) {
			func(req, res);
		} else {
			this._notFound(req, res);
		}
	};
}

const dispatcher = new Dispatcher();
const requestListener = function (req, res) {
	dispatcher.handle(req, res);
};

// pass on the request listener
const server = http.createServer(requestListener);

// set port number as per choice
server.listen(7000);
