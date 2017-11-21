module.exports = function(binarydata) {

  var fs = require('fs');
  var uri = 'https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=true';

  var options = {
    'method': 'POST',
    'uri': uri,
    'headers': {
      'Content-Type': 'application/octet-stream',
      'Ocp-Apim-Subscription-Key': 'dfae92dbabf4495d8ecfc0530e1ad33c'
    },
    'body': binarydata,
    'encoding': 'binary'
  };

  return options;

}
