/**
 * Mocha Test for RETS api
 *
 * mocha test/api.js --reporter list --ui exports --watch
 *
 * @author potanin@UD
 * @date 8/9/13
 * @type {Object}
 */
should = require('should');

module.exports = {

  'RETS API': {

    /**
     * -
     *
     */
    'returns expected constructor properties.': function() {
      var RETS = require( '../' );
      RETS.should.have.property( 'createConnection' );
    },

    /**
     * -
     *
     */
    'can establish connection to a provider.': function( done ) {
      this.timeout( 15000 );
      var RETS = require( '../' );

      var client = RETS.createConnection({
          host: '',
          port: '',
          protocol: '',
          path: '',
          user: '',
          pass: '',
          version: '1.7.2',
          agent: { user: '', password: '' }
      });

      client.once('connection.error',function(error, client){
          console.log( 'Connection failed: %s.', error.message );
          done();
      });

      client.once('connection.success',function(client){
          console.log( 'Connected to RETS as %s.', client.get( 'provider.name' ) );
          done();
      });

    }

  }

};