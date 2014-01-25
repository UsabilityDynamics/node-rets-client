/**
 * Usage Example with RETS User Agent and Password Authentication
 *
 */

// Load Module.
var RETS = require( '../' );

// Create Connection.
var client = RETS.createConnection({
  host: process.env.RETS_HOST,
  path: process.env.RETS_PATH,
  user: process.env.RETS_USER,
  pass: process.env.RETS_PASS,
  version: process.env.RETS_VERSION,
  agent: {
    user: process.env.RETS_AGENT,
    password: process.env.RETS_AGENT_PASSWORD
  }
});

// Trigger on successful connection.
client.once( 'connection.success', function connected( client ) {
  console.log( 'Connected to RETS as "%s".', client.get( 'provider.name' ) )

  // Fetch classifications
  client.getClassifications( function haveClassifications( error, meta ) {

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
