/**
 * Basic Usage Example with wildcard event monitoring
 *
 */

// Load Module.
var RETS = require( '../' );

// Create Connection.
var client = RETS.createConnection({
  host: process.env.RETS_HOST,
  path: process.env.RETS_PATH,
  user: process.env.RETS_USER,
  pass: process.env.RETS_PASS
});

// Trigger on successful connection.
client.once( 'connection.success', function connected( client ) {
  console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) )

  // Fetch classifications
  client.getClassifications( function have_meta( error, meta ) {

    if( error ) {
      console.log( 'Error while fetching classifications: %s.', error.message );
    } else {
      console.log( 'Fetched %d classifications, keys: %s.', Object.keys( meta.data ).length, Object.keys( meta.data ) );
    }

  });

});

// Wildcard event monitoring of all events. (Object Emitter module)
client.on( '#', function( error, data, cb ) {
  console.log( this.event );
});

/**
 * Event Order for the above example:
 *
 * - set.headers
 * - set.rets.version
 * - set.rets.server
 * - set.rets.cookie
 * - set.provider.name
 * - set.provider.user
 * - set.provider.broker
 * - set.meta.version
 * - set.meta.min_version
 * - set.meta.timestamp
 * - set.url.get_meta
 * - set.url.get_object
 * - set.url.login
 * - set.url.logout
 * - set.url.search
 * - connection
 * - connection.success
 * - request.metadata-class.complete
 *
 */