var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var bodyParser = require('body-parser'); // "body-parser" library
var fs = require('fs');
var https = require('https');
var app = express();

require('dotenv').config();
var port = 3000;

var apikey = process.env.faceAPIKey;

// simple GET method starts here ->
app.use(express.static(__dirname + '/public'))
  //.use(cookieParser())
  //  .use(bodyParser.json())
  .use(bodyParser.raw({
    type: 'application/base64',
    limit: '50mb'
  }));
// .use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.post('/api/savepic', function(req, res) {

  var textChunk = req.body.toString('utf8');
  var base64Data = textChunk.replace(/^data:image\/png;base64,/, "");

  var path = 'out.png';

  const writeFace = function(path, base64Data) {

    return new Promise(function(resolve, reject) {
      console.log(new Date() + ' writing file: ' + path)
      fs.writeFileSync(path, base64Data, 'base64');
      if (fs.existsSync(path)) {
        console.log('file exists');
      }
      resolve(path)
    });

  };

  writeFace(path, base64Data).then(respond => {
    console.log(respond);
    res.type('applicatio/json');
    res.set('Content-Length', Buffer.byteLength('Picture taken'));
    res.status(200).send('Picture taken');
  });

});

app.get('/api/getauth', function(req,res) {

  var path = 'out.png';

  const identifyFace = function(options) {

    console.log(new Date() + 'identifyFace');
    return new Promise(function(resolve, reject) {
      if (options == 'no response') {
        resolve('no response');
      } else {
        request(options, function(error, response, body) {
          if (error) {
            resolve(error.message)
          }
          var message = JSON.parse(body);
          console.log(JSON.stringify(message));
          // console.log(message[0].candidates[0].hasOwnProperty('personId'));
          if (message[0].candidates.length > 0) {
            var return_message = message[0].candidates[0].personId;
          } else {
            var return_message = 'no response';
          }
          resolve(return_message)
        });
      }
    });
  };

  const preparerequest = function(body) {
    console.log(new Date() + 'preparerequest');
    return new Promise(function(resolve, reject) {
      if (body == 'no response') {
        resolve('no response');
      } else {
        var uri = 'https://northeurope.api.cognitive.microsoft.com/face/v1.0/identify';

        var options = {
          'method': 'POST',
          'uri': uri,
          'headers': {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': apikey
          },
          'body': body
        };
        console.log(JSON.stringify(options));
        resolve(options);
      }
    });
  };

  const detectFace = function(path) {
    console.log(new Date() + 'detectFace');
    return new Promise(function(resolve, reject) {
      fs.readFile(path, function(err, data) {
        if (err)
          console.log("read image fail " + err);
        else {
          console.log('data length: ' + data.length);
          var post_options = {
            host: 'northeurope.api.cognitive.microsoft.com',
            method: 'POST',
            data: data,
            path: '/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false',
            headers: {
              'Content-Type': 'application/octet-stream',
              'Ocp-Apim-Subscription-Key': apikey,
              'Content-Length': data.length
            }
          };
          // console.log('options: ' + JSON.stringify(post_options));
          var post_req = https.request(post_options, function(response) {
            console.log('Status Code: ' + response.statusCode);
            console.log('response headers ' + JSON.stringify(response.headers));
            console.log('response body ' + JSON.stringify(response.body));
            var responseText = '';
            var responseParts = [];
            response.on('data', function(rdata) {

              console.log('response on data ' + rdata);
              responseText += rdata;
              responseParts.push(rdata);
            });
            response.on('end', function() {
              console.log('response body n end ' + JSON.stringify(response.body));
              console.log('end ' + responseText);
              console.log('parts ' + JSON.stringify(responseParts));
              // console.log(response);
              jsonContent = JSON.parse(responseText);
              if (responseText == '[]') {
                console.log('detectface response is empty');
                fs.unlink(path);
                resolve('no response');
              } else {
                var detectFaceId = jsonContent[0].faceId;
                console.log(detectFaceId);
                var identifyRequest = {
                  'personGroupId': 'digia',
                  'faceIds': [
                    detectFaceId
                  ],
                  'maxNumOfCandidatesReturned': 1,
                  'confidenceThreshold': 0.5
                }
                console.log(JSON.stringify(identifyRequest));
                fs.unlink(path);
                resolve(JSON.stringify(identifyRequest));
              }
            });
          });
          post_req.write(data);
          post_req.end();
        }
      });
    });
  };

  const prepareGetPerson = function(personid) {
    console.log(new Date() + 'prepareGetPerson: params: ' + personid);
    return new Promise(function(resolve, reject) {
      if (personid == 'no response') {
        resolve('no response');
      } else {
        var uri = 'https://northeurope.api.cognitive.microsoft.com/face/v1.0/persongroups/digia/persons/' + personid;

        var options = {
          'method': 'GET',
          'uri': uri,
          'headers': {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': apikey,
          }
        };
        console.log(JSON.stringify(options));
        resolve(options);
      }
    });
  }
  const getperson = function(options) {
    console.log(new Date() + 'GetPerson, params: ' + JSON.stringify(options));
    return new Promise(function(resolve, reject) {
      if (options == 'no response') {
        resolve('unauthorized person');
      } else {
        request(options, function(error, response, body) {
          if (error) {
            resolve(error.message)
          }
          var message = JSON.parse(body);
          var return_message = 'Hello ' + message.name + '. ' + message.userData;

          resolve(return_message)
        });
      }
    });
  }

  detectFace(path).then(preparerequest).then(identifyFace).then(prepareGetPerson).then(getperson).then(respond => {
    console.log(respond);
    res.type('applicatio/json');
    res.set('Content-Length', Buffer.byteLength(respond));
    res.status(200).send(respond);
  });

});

app.post('/api/identifyperson', function(req, res) {

  var textChunk = req.body.toString('utf8');
  var base64Data = textChunk.replace(/^data:image\/png;base64,/, "");

  var path = 'out.png';
  var defaultFace = 'e6cfc182-b5d7-455d-a4d8-fd82c040f593';

  const writeFace = function(path, base64Data) {

    return new Promise(function(resolve, reject) {
      console.log(new Date() + ' writing file: ' + path)
      fs.writeFileSync(path, base64Data, 'base64');
      if (fs.existsSync(path)) {
        console.log('file exists');
      }
      resolve(path)
    });

  };

  const identifyFace = function(options) {

    console.log(new Date() + 'identifyFace');
    return new Promise(function(resolve, reject) {
      if (options == 'no response') {
        resolve('no response');
      } else {
        request(options, function(error, response, body) {
          if (error) {
            resolve(error.message)
          }
          var message = JSON.parse(body);
          console.log(JSON.stringify(message));
          console.log(message[0].candidates[0].hasOwnProperty('personId'));
          if (message[0].candidates.length > 0) {
            var return_message = message[0].candidates[0].personId;
          } else {
            var return_message = 'no response';
          }
          resolve(return_message)
        });
      }
    });
  };

  const preparerequest = function(body) {
    console.log(new Date() + 'preparerequest');
    return new Promise(function(resolve, reject) {
      if (body == 'no response') {
        resolve('no response');
      } else {
        var uri = 'https://northeurope.api.cognitive.microsoft.com/face/v1.0/identify';

        var options = {
          'method': 'POST',
          'uri': uri,
          'headers': {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': apikey
          },
          'body': body
        };
        console.log(JSON.stringify(options));
        resolve(options);
      }
    });
  };

  const detectFace = function(path) {
    console.log(new Date() + 'detectFace');
    return new Promise(function(resolve, reject) {
      fs.readFile(path, function(err, data) {
        if (err)
          console.log("read image fail " + err);
        else {
          console.log('data length: ' + data.length);
          var post_options = {
            host: 'northeurope.api.cognitive.microsoft.com',
            method: 'POST',
            data: data,
            path: '/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false',
            agent: false,
            headers: {
              'Content-Type': 'application/octet-stream',
              'Ocp-Apim-Subscription-Key': apikey,
              'Content-Length': data.length
            }
          };
          // console.log('options: ' + JSON.stringify(post_options));
          var post_req = https.request(post_options, function(response) {
            console.log('Status Code: ' + response.statusCode);
            console.log('response headers ' + JSON.stringify(response.headers));
            console.log('response body ' + JSON.stringify(response.body));
            var responseText = '';
            var responseParts = [];
            response.on('data', function(rdata) {

              console.log('response on data ' + rdata);
              responseText += rdata;
              responseParts.push(rdata);
            });
            response.on('end', function() {
              console.log('response body n end ' + JSON.stringify(response.body));
              console.log('end ' + responseText);
              console.log('parts ' + JSON.stringify(responseParts));
              // console.log(response);
              jsonContent = JSON.parse(responseText);
              if (responseText == '[]') {
                console.log('detectface response is empty');
                fs.unlink(path);
                resolve('no response');
              } else {
                var detectFaceId = jsonContent[0].faceId;
                console.log(detectFaceId);
                var identifyRequest = {
                  'personGroupId': 'digia',
                  'faceIds': [
                    detectFaceId
                  ],
                  'maxNumOfCandidatesReturned': 1,
                  'confidenceThreshold': 0.5
                }
                console.log(JSON.stringify(identifyRequest));
                fs.unlink(path);
                resolve(JSON.stringify(identifyRequest));
              }
            });
          });
          post_req.write(data);
          post_req.end();
        }
      });
    });
  };

  const prepareGetPerson = function(personid) {
    console.log(new Date() + 'prepareGetPerson: params: ' + personid);
    return new Promise(function(resolve, reject) {
      if (personid == 'no response') {
        resolve('no response');
      } else {
        var uri = 'https://northeurope.api.cognitive.microsoft.com/face/v1.0/persongroups/digia/persons/' + personid;

        var options = {
          'method': 'GET',
          'uri': uri,
          'headers': {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': apikey,
          }
        };
        console.log(JSON.stringify(options));
        resolve(options);
      }
    });
  }
  const getperson = function(options) {
    console.log(new Date() + 'GetPerson, params: ' + JSON.stringify(options));
    return new Promise(function(resolve, reject) {
      if (options == 'no response') {
        resolve('unauthorized person');
      } else {
        request(options, function(error, response, body) {
          if (error) {
            resolve(error.message)
          }
          var message = JSON.parse(body);
          var return_message = 'Hello ' + message.name + '. ' + message.userData;

          resolve(return_message)
        });
      }
    });
  }
  writeFace(path, base64Data).then(detectFace).then(preparerequest).then(identifyFace).then(prepareGetPerson).then(getperson).then(respond => {
    console.log(respond);
    res.type('applicatio/json');
    res.set('Content-Length', Buffer.byteLength(respond));
    res.status(200).send(respond);
  });

});

app.post('/api/detectface', function(req, res) {

  console.time("detectface");
  var textChunk = req.body.toString('utf8');
  var base64Data = textChunk.replace(/^data:image\/png;base64,/, "");

  var path = 'out.png';
  var defaultFace = 'e6cfc182-b5d7-455d-a4d8-fd82c040f593';

  const writeFace = function(path, base64Data) {

    return new Promise(function(resolve, reject) {
      console.log(new Date() + ' writing file: ' + path)
      console.timeEnd("detectface");
      fs.writeFileSync(path, base64Data, 'base64');
      if (fs.existsSync(path)) {
        console.log('file exists');
      }
      resolve(path)
    });

  };

  const verifyFace = function(options) {
    // return Promise.resolve(persOptions);
    console.log(new Date() + 'verifyFace');
    return new Promise(function(resolve, reject) {
      if (options == 'no response') {
        resolve('no response, try again');
      } else {
        request(options, function(error, response, body) {
          if (error) {
            resolve(error.message)
          }
          var message = JSON.parse(body);
          if (message.isIdentical == true) {
            var return_message = 'Hello Master, how are you today?';
          } else {
            var return_message = 'I couldn\'t recognize you. I\'m confident your not my master, with confidence factor: ' + message.confidence;
          }
          resolve(return_message)
        });
      }
    });
  };

  const preparerequest = function(body) {
    console.log(new Date() + 'preparerequest');
    return new Promise(function(resolve, reject) {
      if (options == 'no response') {
        resolve('no response');
      } else {
        var uri = 'https://northeurope.api.cognitive.microsoft.com/face/v1.0/verify';

        var options = {
          'method': 'POST',
          'uri': uri,
          'headers': {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': apikey
          },
          'body': body
        };
        console.log(JSON.stringify(options));
        resolve(options);
      }
    });
  };

  const detectFace = function(path) {
    console.log(new Date() + 'detectFace');
    console.timeEnd("detectface");
    // setTimeout(function() {
    //     console.log(new Date() + 'waiting until file is written');
    // }, 3000);
    console.log(new Date() + 'detectFace after wait');
    return new Promise(function(resolve, reject) {
      fs.readFile(path, function(err, data) {
        if (err)
          console.log("read image fail " + err);
        else {
          console.log('data length: ' + data.length);
          var post_options = {
            host: 'northeurope.api.cognitive.microsoft.com',
            method: 'POST',
            data: data,
            path: '/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=true',
            headers: {
              'Content-Type': 'application/octet-stream',
              'Ocp-Apim-Subscription-Key': apikey,
              'Content-Length': data.length
            }
          };
          console.log('options: ' + post_options);
          var post_req = https.request(post_options, function(response) {
            var responseText = '';
            response.on('data', function(rdata) {
              console.log('response on data');
              responseText += rdata;
            });
            response.on('end', function() {
              console.log('end ' + responseText);
              // console.log(response);
              jsonContent = JSON.parse(responseText);
              if (responseText == '[]') {
                console.log('ei mitään');
                fs.unlink(path);
                resolve('no response');
              } else {
                var detectFaceId = jsonContent[0].faceId;
                console.log(detectFaceId);
                var verifyRequest = {
                  'faceId1': defaultFace,
                  'faceId2': detectFaceId
                }
                console.log(JSON.stringify(verifyRequest));
                fs.unlink(path);
                resolve(JSON.stringify(verifyRequest));
              }
            });
          });

          post_req.write(data);
          post_req.end();
        }
      });
    });
  };

  writeFace(path, base64Data).then(detectFace).then(preparerequest).then(verifyFace).then(respond => {
    //console.log(respond);
    console.log(respond);
    res.type('applicatio/json');
    res.set('Content-Length', Buffer.byteLength(respond));
    res.status(200).send(respond);
  });

});

console.log('Listening on ' + port);
app.listen(process.env.PORT || port);
