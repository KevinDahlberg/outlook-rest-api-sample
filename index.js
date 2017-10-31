var server = require('./server');
var router = require('./router');
var authHelper = require('./authHelper');
var microsoftGraph = require('@microsoft/microsoft-graph-client');


var handle = {};
handle['/'] = home;
handle['/authorize'] = authorize;
handle['/mail'] = mail;

server.start(router.route, handle);

function home(res, req) {
  console.log('Request handler \'home\' was called.');
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write('<p>Please <a href="' + authHelper.getAuthUrl() + '">sign in</a> with your Office 365 or Outlook.com account</p>');
  res.end();
}

var url = require('url');
function authorize(res, req) {
  console.log('Request handler \'authorize\' was called.');

  //the auth code is passed as a query param
  var url_parts = url.parse(req.url, true);
  var code = url_parts.query.code;
  console.log('Code: ', code);
  authHelper.getTokenFromCode(code, tokenReceived, res);
}

function getUserEmail(token, callback) {
  console.log('get user email called');
  // Create a Graph client
  var client = microsoftGraph.Client.init({
    authProvider: (done) => {
      // Just return the token
      done(null, token);
    }
  });

  //Get the Graph /Me endpoint to get user email address
  client
    .api('/me')
    .get((err, res) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, res.mail)
      }
    });
}

function tokenReceived(response, error, token) {
  console.log('tokenReceived called');
  if (error) {
    console.log('Access token error 1: ', error.message);
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write('<p>Error: ' + error + '</p>');
    response.end();
  } else {
    getUserEmail(token.token.access_token, function(error, email) {
      if (error) {
        console.log('getUserEmail returned an error: ' + error);
        response.write('<p>Error: ' + error + '</p>');
        response.end();
      } else if (email) {
        var cookies = ['node-tutorial-token=' + token.token.access_token + ';Max-Age=4000',
                        'node-tutorial-refresh-token=' + token.token.refresh_token + ';Max-Age=4000',
                        'node-tutorial-token-expires=' + token.token.expires_at.getTime() + ';Max-Age=4000',
                        'node-tutorial-email=' + email + ';Max-Age=4000'];
        response.setHeader('Set-Cookie', cookies);
        response.writeHead(302, {'Location': 'http://localhost:8000/mail'});
        response.end();
      }
    });
  }
}

function getAccessToken(request, response, callback) {
  console.log('get access token called');
  var expiration = new Date(parseFloat(getValueFromCookie('node-tutorial-token-expires', request.headers.cookie)));

  if (expiration <= new Date()) {
    //refresh token
    console.log('Token Expired, Refreshing');
    var refresh_token = getValueFromCookie('node-tutorial-refresh-token', request.headers.cookie);
    authHelper.refreshAccessToken(refresh_token, function(error, newToken){
      if (error) {
        callback (error, null);
      } else if (newToken) {
        var cookies = ['node-tutorial-token=' + newToken.token.access_token + ';Max-Age=4000',
                        'node-tutorial-refresh-token=' + newToken.token.refresh_token + ';Max-Age=4000',
                        'node-tutorial-token-expires=' + newToken.token.expires_at.getTime() + ';Max-Age=4000'];
        response.setHeader('Set-Cookie', cookies);
        callback(null, newToken.token.access_token);
      }
    });
  } else {
    //Return cached token
    var access_token = getValueFromCookie('node-tutorial-token', request.headers.cookie);
    callback(null, access_token);
  }
}

function getValueFromCookie(valueName, cookie) {
  console.log('get value from cookie found');
  if (cookie.indexOf(valueName) !== -1) {
    var start = cookie.indexOf(valueName) + valueName.length + 1;
    var end = cookie.indexOf(';', start);
    end = end === -1 ? cookie.length : end;
    return cookie.substring(start, end);
  }
}

function mail(response, request) {
  console.log('mail function found');
  getAccessToken(request, response, function(error, token) {
    console.log('Token found in cookie: ', token);
    var email = getValueFromCookie('node-tutorial-email', request.headers.cookie);
    console.log('Email found in cookie: ', email);
    if (token) {
      response.writeHead(200, {'Content-Type': 'text/html'});
      response.write('<div><h1>Your inbox</h1>/div>');

      //Create a Graph client
      var client = microsoftGraph.Client.init({
        authProvider: (done) => {
          // Just return the token
          done(null, token);
        }
      })

      //Get the 10 newest messages
      client
        .api('/me/mailfolders/inbox/messages')
        .header('X-AnchorMailbox', email)
        .top(10)
        .select('subject,from,receivedDateTime,isRead')
        .orderby('receivedDateTime DESC')
        .get((err, res) => {
          if (err) {
            console.log('getMessages returned an error: ', err);
            response.write('<p>Error: ' + err + '</p>');
            response.end();
          } else {
            console.log('getMessages returned ' + res.value.length + ' messages.');
            response.write('<table><tr><th>From</th><th>Subject</th><th>Received</th></th>');
            res.value.forEach(function(message) {
              console.log(' Subject: ' + message.subject);
              var from = message.from ? message.from.emailAddress.name : 'NONE';
              response.write('<tr><td>' + from +
                '</td><td>' + (message.isRead ? '' : '<b>') + message.subject + (message.isRead ? '' : '</b>') +
                '</td><td>' + message.receivedDateTime.toString() + '</td></tr>');
            });

            response.write('</table>');
            response.end();
          }
        });
    } else {
      response.writeHead(200, {'Content-Type': 'text/html'});
      response.write('<p>No token found in cookie!</p>');
      response.end();
    }
  })
}
