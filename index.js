const doc = require('dynamodb-doc');

module.exports.handler = require('./handler')({
  dynamo: new doc.DynamoDB(),
});
