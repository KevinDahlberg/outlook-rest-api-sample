var server = require('./server');
var router = require('./router');

var handle = {};
handle['/'] = home;

server.start(router.route, handle);

function home(res, req) {
  console.log('Request handler \'home\' was called.');
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write('<p>Hello World!</p>');
  res.end();
}
