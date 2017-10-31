var http = require('http');
var url = require('url');

function start(route, handle) {
  function onRequest(req, res) {
    var pathName = url.parse(req.url).pathname;
    console.log('Request for ' + pathName + ' received.');
    route(handle, pathName, res, req);
  }

  var port = 8000;
  http.createServer(onRequest).listen(port);
  console.log('Server on!  Listening on port: ', port, '...');
}

exports.start = start;
