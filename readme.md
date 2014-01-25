## Node.js RETS Client
This is a (very) beta Node.js RETS client. The purpose of this module is to establish a connection to a RETS provider and perform most of the common queries.
If you are experienced with RETS and would like to assist with this development your help would be very welcome.

## Terminology

* Classification - A sub-type of resource. In case of "Property" resource this could be something like "Residential".
* Resource
* User Agent
* User Agent Password

## Methods
The methods attempt to model phRETS for convinience.

* getAllLookupValues - Get all lookup values for a resource.
* getClassifications - Get classifications for a particular resource type.
* getLoginURL
* getLookupValues
* getMetadataResources
* getMetadataInfo
* getMetadataTable
* getMetadata
* getMetadataClasses
* getMetadataTypes
* getObject
* getServerSoftware
* getServerVersion
* getAllTransactions
* getServerInformation
* request - Abstract RETS request.
* search - General resource search.
* serverDetail - Get server detail.

## Code Concepts

* All instance methods accept a callback method as the last argument.
* All callback methods accept two parameters, the first being an instance of Error or null, the second being data.

## Usage Example
Below is a very simple example that simply establishes a RETS connection with digest authentication and then loads an object containing all available classifications.

```javascript

var RETS = require( 'rets-client' );

// Create Connection.
var client = RETS.createConnection({
  host: 'www.some-rets-provider.com',
  path: '/login.asps',
  user: 'ricky-bobby',
  pass: 'talladega'
});

// Trigger on successful connection.
client.once( 'connection.success', function connected( client ) {
  console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) )

  // Fetch classifications
  client.getClassifications( function have_meta( error, meta ) {

    if( error ) {
      console.log( 'Error while fetching classifications: %s.', error.message );
    } else {
      console.log( 'Fetched %d classifications.', Object.keys( meta.data ).length );
      console.log( 'Classification keys: %s.', Object.keys( meta.data ) );
    }

  });

});

// Trigger on connection failure.
client.once( 'connection.error', function connection_error( error, client ) {
  console.error( 'Connection failed: %s.', error.message );
});
```

If there are no errors, the above code should result in the following console messages:

 - Connected to RETS as "Ricky Bobby, Inc.".
 - Fetched 6 classifications.
 - Classification keys: REN,CML,MUL,LND,CMS,RES.

## Environment Variables
Used mostly for testing, the following environment variables are recognized by the module.

```shell
export RETS_HOST=sef.rets.interealty.com
export RETS_PROTOCOL=http:
export RETS_VERSION=1.7
export RETS_PORT=80
export RETS_PATH=/Login.asmx/Login
export RETS_USER=ricky-bobby
export RETS_PASS=talladega
export RETS_AGENT=RETS-Connector/1.2
export RETS_AGENT_PASSWORD=password
```

## License

(The MIT License)

Copyright (c) 2013-2014 Usability Dynamics, Inc. &lt;info@usabilitydynamics.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.