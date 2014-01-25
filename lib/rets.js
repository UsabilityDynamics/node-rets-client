/**
 * RETS Client
 * -----------
 *
 * Event Types
 * ===========
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
 * Response Headers
 * ================
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
 * @version 1.1.0
 * @module RETS
 * @param settings
 * @param callback
 * @returns {*}
 * @constructor
 */
function RETS( settings, callback ) {

  // Make sure context is correct otherwise we could screw up the global scope.
  if( !( this instanceof RETS ) ) {
    return new RETS( settings, callback );
  }

  // Mixin Settings and ObjectEmitter.
  this.utility.Setting( this );
  this.utility.Emitter( this );

  // Primary and Default Settings.
  this.set( 'settings', this.utility.defaults( settings, {
    protocol: process.env.RETS_PROTOCOL || 'http:',
    host: process.env.RETS_HOST,
    path: process.env.RETS_PATH,
    user: process.env.RETS_USER,
    pass: process.env.RETS_PASS,
    port: process.env.RETS_PORT || 80,
    version: process.env.RETS_VERSION || '1.7',
    agent: {
      user: process.env.RETS_AGENT || 'RETS-Node-Client/1.0',
      password: process.env.RETS_AGENT_PASSWORD
    }
  }));

  // console.log( this.get( 'settings' ) );

  // Capabilities.
  this.set( 'capabilities', {
    Action: undefined,
    ChangePassword: undefined,
    GetObject: undefined,
    Login: undefined,
    LoginComplete: undefined,
    Logout: undefined,
    Search: undefined,
    GetMetadata: undefined,
    ServerInformation: undefined,
    Update: undefined,
    PostObject: undefined,
    GetPayloadList: undefined
  });

  this.set( 'settings.headers.rets-version', 'RETS/' + settings.version );
  this.set( 'settings.headers.user-agent', settings.agent.user );
  this.set( 'settings.headers.accept', '*/*' );

  if( settings.agent && settings.agent.password ) {
    var sid_to_calculate = ''; // use_interealty_ua_auth == true => this.get( 'session' );
    var request_id = '';
    var ua_a1 = this.utility.md5( this.get( 'settings.agent.user' ) + ':' + this.get( 'settings.agent.password' ) );
    var ua_dig_resp = this.utility.md5( ua_a1.trim() + ':' + request_id.trim() + ':' + sid_to_calculate.trim() + ':' + this.get( 'settings.version', '' ).trim() );
    this.set( 'settings.headers.rets-ua-authorization', 'Digest ' + ua_dig_resp );
  }

  this.utility.digest( settings.user, settings.pass ).request({
    method: 'GET',
    host: settings.host,
    path: settings.path,
    port: settings.port,
    protocol: settings.protocol,
    headers: settings.headers
  }, this._authorization.bind( this ) );

  // Return context.
  return this;

}

/**
 * RETS Instance Properties.
 *
 */
Object.defineProperties( RETS.prototype, {
  getAllLookupValues: {
    /**
     * Get All Lookup Values for a Resource
     *
     * @example
     *
     *      // Get all lookup values for "Property" resource and output to console
     *      client.getAllLookupValues( 'Property', console.log );
     *
     * @method getAllLookupValues
     * @param resource {String} Resource ID.
     * @param callback {Function} Callback method.
     * @returns this {Object} RETS Client instance.
     */
    value: function getAllLookupValues( resource, callback ) {
      RETS.debug( 'getAllLookupValues( %s )', resource );

      // @chainable
      return this;

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  getClassifications: {
    /**
     * Get Classification Meta Data
     *
     * @async
     * @chainable
     * @method getClassifications
     * @param type {String} Resource type..
     * @param callback {Function} Callback function.
     * @returns {Object} Context
     */
    value: function getClassifications( type, callback ) {
      return this.request( 'url.get_meta', { Type: 'METADATA-CLASS', ID: type || 'Property' }, callback );
    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  getLookupValues: {
    value: function getLookupValues() {
      RETS.debug( 'getLookupValues' );

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  getMetadataResources: {
    value: function getMetadataResources() {
      RETS.debug( 'getMetadataResources' );

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  getMetadataInfo: {
    value: function getMetadataInfo() {
      RETS.debug( 'getMetadataInfo' );

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  getObject: {
    value: function getObject() {},
    enumerable: true,
    configurable: true,
    writable: true
  },
  getAllTransactions: {
    value: function GetAllTransactions() {},
    enumerable: true,
    configurable: true,
    writable: true
  },
  getMetadataObjects: {
    value: function GetMetadataObjects() {},
    enumerable: true,
    configurable: true,
    writable: true
  },
  getMetadataTable: {
    /**
     * Get Metadata Table
     *
     * @method getMetadataTable
     * @for RETS
     *
     * @param resource
     * @param classification
     * @param callback
     * @returns {*}
     */
    value: function getMetadataTable( resource, classification, callback ) {
      RETS.debug( 'getMetadataTable( %s, %s )', resource, classification );

      // @chainable
      return this;

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  getMetadataClasses: {
    /**
     *
     * @async
     * @param resource
     * @param callback
     * @returns {*}
     */
    value: function getMetadataClasses( resource, callback ) {
      RETS.debug( 'getMetadataClasses( %s )', resource );

      // @chainable
      return this;

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
     * @async
     * @method request
     * @param action
     * @param args
     * @param callback
     * @returns {*}
     */
    value: function request( action, args, callback ) {
      RETS.debug( 'request' );

      var Instance = this;

      var url = [ "http://", Instance.get( 'settings.host' ), ':', Instance.get( 'settings.post', 80 ), Instance.get( action ) ].join( '' );

      // Callback Method.
      callback = 'function' === typeof callback ? callback : this.utility.noop;

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
          return Instance.emit( 'request.error', error, res, callback( error, res ) );
        }

        Instance._parse( body, function parsed( error, data ) {

          if( error ) {
            return Instance.emit( 'request.parse.error', error, res, callback( error, res ) );
          }

          // Emit response and trigger callback.
          return Instance.emit( [ 'request', args.Type.toLowerCase(), 'complete' ].join( '.' ), null, data, callback( null, data ) );

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
  utility: {
    value: require( './utility' ),
    enumerable: false,
    configurable: true,
    writable: true
  },
  _authorization: {
    /**
     * Authentication Handler
     *
     * @todo Make sure set-cookie is returned as an array.
     *
     * @param res
     * @constructor
     */
    value: function _authorization( res ) {
      RETS.debug( '_authorization' );

      var _data = [];

      var Instance = this;

      // e.g. ECONNRESET
      this.on( 'error', function error( error ) {
        RETS.debug( '_authorization::error', error );

        if( error.message === 'ECONNRESET' ) {
          Instance.emit( 'connection.closed', Instance );
        } else {
          console.error( 'Uncaught RETS error:', error.message );
        }

      });

      // Connection complete.
      res.on( 'end', function digest_end() {
        RETS.debug( '_authorization::end' );

        // Save Returned Server details.
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
        Instance._parse( _data, function parsed( error, data ) {
          RETS.debug( '_authorization::end->parsed' );

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
        RETS.debug( '_authorization::error', error  );
        Instance.emit( 'connection', error, Instance );
        Instance.emit( 'connection.error', error, Instance );
      });

      // Connection data.
      res.on( 'data', function onData( data ) {
        // RETS.debug( '_authorization::data', data.toString() );
        _data.push( data.toString() );
      });

    },
    enumerable: false,
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
     * @param data {String} Data string to parse.
     * @param callback {Function} Callback method.
     * @returns {*} Instance.
     */
    value: function _parse( data, callback ) {
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

          // Error: Authentication required, invalid parameters passed
          if( parsed.code === 20036 ) {
            throw new Error( 'Authentication required, invalid parameters passed.' );
          }

          // Error: User Agent not registered or denied
          if( parsed.code === 20037 ) {
            throw new Error( 'User Agent not registered or denied.' );
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
            return callback( null, parsed );

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
              return callback( null, parsed );

            }

            throw new Error( 'Unknown RETS METADATA response sub-type.' );

          }

          throw new Error( 'Unknown RETS response type, could not identify nor parse.' );

        } catch( error ) {
          RETS.debug( error.message );
          callback( error, parsed )
        }

      });

      // Chainable.
      return this;

    },
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
  connect: {
    /**
     * Create new Connection
     *
     * @param settings
     * @param callback
     * @returns {RETS}
     */
    value: function connect( settings, callback ) {
      RETS.debug( 'connect' );
      return new RETS( settings, callback || RETS.prototype.utility.noop )
    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  createConnection: {
    /**
     * Create new Connection
     *
     * @param settings
     * @param callback
     * @returns {RETS}
     */
    value: function createConnection( settings, callback ) {
      RETS.debug( 'createConnection' );
      return new RETS( settings, RETS.prototype.utility.noop )
    },
    enumerable: true,
    configurable: true,
    writable: true
  }
});