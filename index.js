var server = require('./server');
var router = require('./router');

var handle = {};
handle['/'] = home;

server.start(router.route, handle);

function home(res, req) {
  console.log('Request handler \'home\' was called.');
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.write('<p>Hello World!</p>');
  response.end();
}
