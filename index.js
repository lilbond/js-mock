const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

class Dispatcher {
	constructor() {
		this.mapping = [];
		this.mapping['/mock'] = this._mock;
		this.mapping['/greetings'] = this._greetings;
		this.mapping['/delayed'] = this._delayed;
		this.mapping['/error/500'] = this._serverError;
	}

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
