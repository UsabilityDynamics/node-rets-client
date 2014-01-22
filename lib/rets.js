/**
 * RETS Client
 * ===========
 *
 * ### Event Types
 * - digest.error
 * - connection: General connection event - could mean success or error.
 * - connection.success: Successful connection only
 * - connection.error: General connection error.
 * - connection.parse.error: General connection parsing error.
 * - connection.closed: Digest authentication connection closed.
 * - request.error: General request error.
 * - request.parse.error: Request successful, but parsing failed.
 * - request.{TYPE}.complete: Request complete.
 * - get_meta.complete: Meta loaded
 *
 *
 * * www-authenticate
 * * cache-control
 * * rets-server
 * * server
 * * transfer-encoding
 * * set-cookie
 * * rets-version
 * * content-type
 *
 * ### Response Types
 * classes -
 *
 * @constructor
 * @module RETS
 * @param settings
 * @param cb
 * @returns {*}
 * @constructor
 */
function RETS( settings, cb ) {

  // Make sure context is correct otherwise we could screw up the global scope.
  if( !( this instanceof RETS ) ) {
    return new RETS( settings, cb );
  }

  // Mixin Settings and EventEmitter
  require( 'object-settings' ).mixin( this );
  require( 'object-emitter' ).mixin( this );

  // Primary and Default Settings.
  this.set( 'settings', this.utility.defaults( settings, {
    protocol: 'http:',
    port: 80,
    agent: {
      user: 'RETS-Connector/1.2'
    }
  }));

  // Capabilities.
  this.set( 'capabilities', {
    Action: 1,
    ChangePassword: 1,
    GetObject: 1,
    Login: 1,
    LoginComplete: 1,
    Logout: 1,
    Search: 1,
    GetMetadata: 1,
    ServerInformation: 1,
    Update: 1,
    PostObject: 1,
    GetPayloadList: 1
  });

  this.set( 'settings.headers.rets-version', 'RETS/' + settings.version );
  this.set( 'settings.headers.user-agent', settings.agent.user );
  this.set( 'settings.headers.accept', '*/*' );

  if( settings.agent && settings.agent.password ) {
    var sid_to_calculate = ''; // use_interealty_ua_auth == true => this.get( 'session' );
    var request_id = '';
    var ua_a1 = this.utility.md5( this.get( 'settings.agent.user' ) + ':' + this.get( 'settings.agent.password' ) );
    var ua_dig_resp = this.utility.md5( ua_a1.trim() + ':' + request_id.trim() + ':' + sid_to_calculate.trim() + ':' + this.get( 'settings.version' ).trim() );
    this.set( 'settings.headers.rets-ua-authorization', 'Digest ' + ua_dig_resp );
  }

  this.utility.digest( settings.user, settings.pass ).request({
    method: 'GET',
    host: settings.host,
    path: settings.path,
    port: settings.port,
    protocol: settings.protocol,
    headers: settings.headers
  }, this.Authorization.bind( this ) );

  // Return context.
  return this;

}

/**
 * RETS Instance Properties.
 *
 */
Object.defineProperties( RETS.prototype, {
  Authorization: {
    /**
     * Authentication Handler
     *
     * @todo Make sure set-cookie is returned as an array.
     *
     * @param res
     * @constructor
     */
    value: function Authorization( res ) {
      RETS.debug( 'Authorization' );

      var _connection_data = [];

      var Instance = this;

      // e.g. ECONNRESET
      this.on( 'error', function error( error ) {
        RETS.debug( 'Authorization::error', error );

        if( error.message === 'ECONNRESET' ) {
          Instance.emit( 'connection.closed', Instance );
        } else {
          console.error( 'Uncaught RETS error:', error.message );
        }

      });

      // Connection complete.
      res.on( 'end', function digest_end() {
        RETS.debug( 'Authorization::end' );

        // Save Server details.
        Instance.set( 'server.name',  this.headers[ 'server' ] );
        Instance.set( 'server.version', this.headers[ 'rets-version' ] );

        if( this.headers[ 'www-authenticate' ] ) {
          if( this.headers[ 'www-authenticate' ].indexOf( 'Basic' ) === 0 ) {
            Instance.set( 'support.basic', true );
          }

          if( this.headers[ 'www-authenticate' ].indexOf( 'Digest' ) === 0 ) {
            Instance.set( 'support.digest', true );
          }
        }

        if( this.headers[ 'set-cookie' ] ) {

          this.headers[ 'set-cookie' ].forEach( function( value ) {

            if( value.indexOf( 'RETS-Session-ID') === 0 ) {

              // e.g. "RETS-Session-ID=y24mpczv2i0ts3d5lkv4c4te; path=/" => "y24mpczv2i0ts3d5lkv4c4te"
              var _match = value.match( /RETS-Session-ID\=(.*?)(\;|\s+|$)/ );

              Instance.set( 'session', _match[1] );
            }

          });

        }

        // Parse connection data.
        Instance._parse( _connection_data, function parsed( error, data ) {
          RETS.debug( 'Authorization::end->parsed' );

          // Parse Error of connection data.
          if( error ) {
            return Instance.emit( 'connection.parse.error', error, data );
          }

          // Connection response code must be 0.
          if( data.code != 0 ) {
            return Instance.emit( 'connection.error', new Error( 'Connection response code not the expected 0.' ), data );
          }

          // Save general provider information.
          Instance.set( 'provider.name', data.data.MemberName );
          Instance.set( 'provider.user', data.data.User );
          Instance.set( 'provider.broker', data.data.Broker );

          // Save meta data.
          Instance.set( 'meta.version', data.data.MetadataVersion );
          Instance.set( 'meta.min_version', data.data.MinMetadataVersion );
          Instance.set( 'meta.timestamp', data.data.MetadataTimestamp );

          // Save connection URLs.
          Instance.set( 'url.login', data.data.Login );
          Instance.set( 'url.get_meta', data.data.GetMetadata );
          Instance.set( 'url.get_object', data.data.GetObject );
          Instance.set( 'url.logout', data.data.Logout );
          Instance.set( 'url.search', data.data.Search );

          // Emit connection success.
          Instance.emit( 'connection', null, Instance );
          Instance.emit( 'connection.success', Instance );

        });

      });

      // Connection failure.
      res.on( 'error', function onError( error ) {
        RETS.debug( 'Authorization::error', error  );
        Instance.emit( 'connection', error, Instance );
        Instance.emit( 'connection.error', error, Instance );
      });

      // Connection data.
      res.on( 'data', function onData( data ) {
        // RETS.debug( 'Authorization::data', data.toString() );
        _connection_data.push( data.toString() );
      });

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  request: {
    /**
     * Abstract RETS Query wrapper.
     *
     *
     * // http://sef.rets.interealty.com:80/GetMetadata.asmx/GetMetadata?Type=METADATA-CLASS&ID=Property&Format=STANDARD-XML
     *
     * @async
     * @method request
     *
     * @param action
     * @param args
     * @param cb
     * @returns {*}
     */
    value: function request( action, args, cb ) {
      RETS.debug( 'request' );

      var Instance = this;

      var url = [ "http://", Instance.get( 'settings.host' ), ':', Instance.get( 'settings.post', 80 ), Instance.get( action ) ].join( '' );

      // Callback Method.
      cb = 'function' === typeof cb ? cb : this.utility.noop;

      /**
       * Have Response
       *
       * @param error
       * @param res
       * @param body
       * @returns {*}
       */
      function haveResponse( error, res, body ) {
        // console.log( 'haveResponse', body );

        // Request error.
        if( error ) {
          return Instance.emit( 'request.error', error, res, cb( error, res ) );
        }

        Instance._parse( body, function parsed( error, data ) {

          if( error ) {
            return Instance.emit( 'request.parse.error', error, res, cb( error, res ) );
          }

          // Emit response and trigger callback.
          return Instance.emit( [ 'request', args.Type.toLowerCase(), 'complete' ].join( '.' ), null, data, cb( null, data ) );

        });

      }

      var _request ={
        method: 'GET',
        url:  [ Instance.get( 'settings.protocol' ), '//', Instance.get( 'settings.host' ), ':', Instance.get( 'settings.post', 80 ), Instance.get( action ) ].join( '' ),
        qs: this.utility.defaults( args, {
          Type: 'METADATA-CLASS',
          ID: 'Property',
          Format: 'STANDARD-XML'
        }),
        auth: {
          user: Instance.get( 'settings.user' ),
          pass: Instance.get( 'settings.pass' ),
          sendImmediately: false
        },
        headers: Instance.get( 'settings.headers' )
      };

      this.utility.request( _request , haveResponse );

      return this;

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  getClasses: {
    /**
     * Get Classification Meta Data
     *
     * @async
     * @chainable
     * @method getClasses
     * @param type {String} Resource type..
     * @param cb {Function} Callback function.
     * @returns {Object} Context
     */
    value: function getClasses( type, cb ) {
      return this.request( 'url.get_meta', { Type: 'METADATA-CLASS', ID: type || 'Property' }, cb );
    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  GetObject: {
    value: function GetObject() {},
    enumerable: true,
    configurable: true,
    writable: true
  },
  GetAllTransactions: {
    value: function GetAllTransactions() {},
    enumerable: true,
    configurable: true,
    writable: true
  },
  GetMetadataObjects: {
    value: function GetMetadataObjects() {},
    enumerable: true,
    configurable: true,
    writable: true
  },
  GetMetadataResources: {
    value: function GetMetadataResources() {
      RETS.debug( 'GetMetadataResources' );

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  GetMetadataClasses: {
    value: function GetMetadataClasses() {},
    enumerable: true,
    configurable: true,
    writable: true
  },
  GetLookupValues: {
    value: function GetLookupValues() {},
    enumerable: true,
    configurable: true,
    writable: true
  },
  _parse: {
    /**
     * Parse RETS response and return an Object.
     *
     * @async
     * @chainable
     * @method _parse
     * @private
     *
     * @param data {String}
     * @returns {*} Instance.
     */
    value: function _parse( data, cb ) {
      RETS.debug( '_parse' );

      var Instance = this;

      var parsed = {
        code: undefined,
        text: undefined,
        type: undefined,
        resource: undefined,
        data: {}
      };

      // Parse XML
      this.utility.parseString( data, function xml_parsed( error, data ) {
        RETS.debug( '_parse->xml_parsed' );

        try {

          if( error ) {
            throw new Error( 'Response parse error: ' + error.message );
          }

          if( !data ) {
            throw new Error( 'No data to parse.' );
          }

          if( 'object' !== typeof data.RETS ) {
            throw new Error( 'Response does not contain a proper RETS property. ' );
          }

          // Standard response code and text, response type and empty data container.
          Instance.utility.extend( parsed, {
            code: parseInt( data.RETS[ '$' ].ReplyCode ),
            text: data.RETS[ '$' ].ReplyText
          });

          // Authentication required, invalid parameters passed
          if( parsed.code === 20036 ) {
            throw new Error( 'Authentication required, invalid parameters passed.' );
          }

          // Connection data. @wiki: https://github.com/UsabilityDynamics/node-rets/wiki/Connection-Response
          if( data.RETS[ 'RETS-RESPONSE' ] ) {

            parsed.type = 'connection';

            // Iterate through each line and convert to key and value pair.
            // @note looks like sometimes uses "\r\n," and sometimes just "\n"

            data.RETS[ 'RETS-RESPONSE' ][0].split( "\r\n" ).forEach( function line_parser( line, index ) {

              // Ignore completely blank lines.
              if( !line ) {
                return;
              }

              var split   = line.split( '=' );
              var key     =  split[0].replace(/^\s+|\s+$/g, '' );
              var value   =  split[1].replace(/^\s+|\s+$/g, '' );

              parsed.data[ key ] = value;

            });

            // Trigger callback with parsed data.
            return cb( null, parsed );

          }

          // Some sort of meta.
          if( data.RETS[ 'METADATA' ] && Instance.utility.first( data.RETS[ 'METADATA' ] ) ) {

            // Classification meta.
            if( Instance.utility.first( data.RETS[ 'METADATA' ][0][ 'METADATA-CLASS' ] ) ) {
              parsed.type = 'classifications';
              parsed.resource = data.RETS[ 'METADATA' ][0][ 'METADATA-CLASS' ][0]['$'].Resource;

              // Iterate through each class data type and create object
              data.RETS[ 'METADATA' ][0][ 'METADATA-CLASS' ][0].Class.forEach( function iterate( class_data ) {
                parsed.data[ class_data.ClassName ] = class_data;
              });

              // Trigger callback with parsed data.
              return cb( null, parsed );

            }

            throw new Error( 'Unknown RETS METADATA response sub-type.' );

          }

          throw new Error( 'Unknown RETS response type, could not identify nor parse.' );

        } catch( error ) {
          RETS.debug( error.message );
          cb( error, parsed )
        }

      });

      // Chainable.
      return this;

    },
    enumerable: false,
    configurable: true,
    writable: true
  },
  utility: {
    value: require( './utility' ),
    enumerable: false,
    configurable: true,
    writable: true
  }
});

/**
 * RETS Constructor Properties.
 *
 */
Object.defineProperties( module.exports = RETS, {
  debug: {
    /**
     * RETS Debugger
     *
     * @esample
     *    RETS.debug( 'Debug Mesage' );
     *
     */
    value: require( 'debug' )( 'RETS' ),
    enumerable: true,
    configurable: true,
    writable: true
  },
  createConnection: {
    /**
     * Create new Connection
     *
     * @param settings
     * @param cb
     * @returns {RETS}
     */
    value: function createConnection( settings, cb ) {
      return new RETS( settings, cb )
    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});