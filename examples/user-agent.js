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

  // console.log( require( 'util' ).inspect( client.get(), { showHidden: false, colors: true, depth: 2 } ) )

  // Fetch classifications

  client.searchQuery({
    resource: 'Property',
    class: '1',
    dmql: '(246=A),(276=MOBILE),(61=DADE,BROWARD,PALMBCH),(1=RE1)',
    limit: 100
  }, function( error, data ) {

    console.log( require( 'util' ).inspect( data, { showHidden: false, colors: true, depth: 5 } ) )

  });

});

// Trigger on connection failure.
client.once( 'connection.error', function connection_error( error, client ) {
  console.error( 'Connection failed: %s.', error.message );
});
