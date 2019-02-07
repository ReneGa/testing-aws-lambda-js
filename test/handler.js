const { expect } = require('chai');
const sinon = require('sinon');
const doc = require('dynamodb-doc');

const deps = {
  // Use actual dynamo client, to have all its methods fake-able by Sinon.JS
  dynamo: new doc.DynamoDB(),
};
const myHandler = require('../handler')(deps);

describe('handler', () => {

  beforeEach(() => {
    // Use sinon.stub(..) to prevent any calls to actual dependencies and enable faking of methods
    Object.values(deps).forEach(dep => sinon.stub(dep));
    // (Optional) keep test output free of error messages printed by our lambda function
    sinon.stub(console, 'error');
  });

  // Reset test doubles behavior for isolating individual test cases
  afterEach(() => sinon.restore());

  it('should call dynamo db scan(...) in case of HTTP GET and return the result', async () => {
    const event = {
      httpMethod: 'GET',
      queryStringParameters: {
        TableName: 'MyTable',
      },
      body: '{}',
    };
    // Fake DynamoDB client behavior
    deps.dynamo.scan.returns({ promise: sinon.fake.resolves('some content') });

    const { headers, statusCode, body } = await myHandler(event);

    sinon.assert.calledWith(deps.dynamo.scan, { TableName: 'MyTable' });
    expect(headers['Content-Type']).to.equal('application/json');
    expect(statusCode).to.equal('200');
    expect(body).to.equal('"some content"');
  });

  it('should return an error message if a dynamo db call fails', async () => {
    const event = {
      httpMethod: 'GET',
      queryStringParameters: {},
      body: '{}',
    };
    deps.dynamo.scan.returns({ promise: sinon.fake.rejects(new Error('fail')) });

    const { headers, statusCode, body } = await myHandler(event);

    sinon.assert.called(console.error);
    expect(headers['Content-Type']).to.equal('application/json');
    expect(statusCode).to.equal('400');
    expect(JSON.parse(body).message).to.equal('fail');
  });

  it('should call dynamo db putItem(...) in case of HTTP POST', async () => {
    const event = {
      httpMethod: 'POST',
      queryStringParameters: {},
      body: '{}',
    };

    await myHandler(event);

    sinon.assert.calledWith(deps.dynamo.putItem, {});
  });

  it('should reject unsupported HTTP methods', async () => {
    const event = {
      httpMethod: 'DELETE',
      queryStringParameters: {},
      body: '{}',
    };

    const { headers, statusCode, body } = await myHandler(event);

    expect(headers['Content-Type']).to.equal('application/json');
    expect(headers['Allow']).to.equal('GET, POST');
    expect(statusCode).to.equal('405');
    expect(JSON.parse(body).message).to.equal('Unsupported method: DELETE');
  });
});
