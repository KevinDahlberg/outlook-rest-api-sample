# Outlook REST API Sample

## Description
Toy app that is a practice implementation of the Outlook REST API.

This toy app is taken from:
https://docs.microsoft.com/en-us/outlook/rest/node-tutorial

## Setup
* Download Repo
* Add the Following File:
  - authHelper.js
  ```
  var credentials = {
    client: {
      id: 'another app id',
      secret: 'YOUR APP PASSWORD HERE'
    },
    auth: {
      tokenHost: 'https://login.microsoftonline.com',
      authorizePath: 'common/oauth2/v2.0/authorize',
      tokenPath: 'common/oauth2/v2.0/token'
    }
  };

  var oauth2 = require('simple-oauth2').create(credentials);

  var redirectUri = 'http://localhost:8000/authorize';

  //The scopes the app requires
  var scopes = [ 'openid', 'User.Read', 'Mail.Read' ];

  function getAuthUrl() {
    var returnVal = oauth2.authorizationCode.authorizeURL({
      redirect_uri: redirectUri,
      scope: scopes.join(' ')
    });
    console.log('Generated auth url: ', returnVal);
    return returnVal;
  }
  ```
  
