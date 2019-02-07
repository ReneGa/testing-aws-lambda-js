const response = (statusCode, body, additionalHeaders) => ({
  statusCode,
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json', ...additionalHeaders },
});

// Factory function creating and returning the handler function
module.exports = deps => async (event) => {
  try {
    switch (event.httpMethod) {
      case 'GET': return response('200', await deps.dynamo.scan(
        { TableName: event.queryStringParameters.TableName }).promise());

      case 'POST': return response('204', await deps.dynamo.putItem(
        JSON.parse(event.body)).promise());

      default: return response('405',
        { message: `Unsupported method: ${event.httpMethod}` },
        { Allow: 'GET, POST' });
    }
  } catch (err) {
    console.error(err);
    return response('400', { message: err.message });
  }
};
