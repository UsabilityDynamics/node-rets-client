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

  this._curl = new this.utility.libcurl();

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

  // Authorization Variables.
  this.set( 'authorization', {
    request: undefined,
    version: [ 'RETS', this.get( 'settings.version' ) ].join( '/' ),
    session: undefined,
    nonce: undefined,
    realm: undefined,
    qop: undefined,
    opaque: undefined,
    uri: undefined,
    response: undefined,
    nc: undefined,
    cnonce: undefined
  });

  // Capabilities.
  this.set( 'capabilities', {
    //Action: undefined,
    //LoginComplete: undefined,
    // GetPayloadList: undefined
    ChangePassword: undefined,
    GetObject: undefined,
    Login: undefined,
    Logout: undefined,
    Search: undefined,
    GetMetadata: undefined,
    ServerInformation: undefined
    //Update: undefined
    //PostObject: undefined
  });

  if( 'function' === typeof callback ) {
    this.once( 'connection', callback );
  }

  /**
  * Sloppy cruft for now just to stub this out - move to a method here shortly
  */
  // Establish initial connection
  var request = this._curl;
  var Instance = this;

  var options = {
    username: this.get( 'settings.user' ) || this.get( 'settings.username' ),
    password: this.get( 'settings.pass' ) || this.get( 'settings.password' ),
    method: 'GET',
    host: this.get( 'settings.host' ),
    path: this.get( 'settings.path' ),
    port: this.get( 'settings.port' ),
    protocol: this.get( 'settings.protocol' )
    // headers: this._requestHeaders()
  };

  request.setopt('URL', options.protocol + '//' + options.host + ':' + options.port + options.path);
  request.setopt('COOKIEJAR', ''); // Cookies are kinda important for sessions
  request.setopt('HTTPAUTH', 2); // Digest auth
  request.setopt('USERNAME', options.username);
  request.setopt('PASSWORD', options.password);

  var body = ''; //empty buffer for full response
  var headers = [];

  request.on('data', function(chunk) {
    /**
     * meh - ideally we won't buffer the response, but we have to for now
     */
    body += chunk;
    return chunk.length;
  });

  request.on('header', function(chunk) {
    /**
     * meh - this is just to trick the rest of the stack for now
     * @type {[type]}
     */
    var h = chunk.toString().split(':');
    headers[h[0]] = h[1];

    return chunk.length;
  });

  // curl.close() should be called in event 'error' and 'end' if the curl won't use any more.
  // or the resource will not release until V8 garbage mark sweep.
  request.on('error', function(e) {
      console.log("error: " + e.message);
      // TODO: fire callback with error
      request.close();
  });

  request.on('end', function() {
      // TODO: error handle / passing based on request.getinfo('RESPONSE_CODE');
      // request.close();

      // Emit connection success.
      Instance.emit( 'connection', null, Instance );
      Instance.emit( 'connection.success', Instance );

      Instance._parseCapabilities( body );
  });

  request.perform();

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
      RETS.debug( 'getClassifications' );
      return this.sendRequest( 'url.GetMetadata', { Type: 'METADATA-CLASS', ID: type || 'Property' }, callback );
    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  getLookupValues: {
    value: function getLookupValues( resource, lookupname) {
      RETS.debug( 'getLookupValues' );
      return this.sendRequest( 'url.GetMetadata', { Type: 'METADATA-LOOKUP_TYPE', ID: resource + ':' + lookupname }, callback );
    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  getMetadataResources: {
    value: function getMetadataResources( id, callback) {
      RETS.debug( 'getMetadataResources' );
      return this.sendRequest( 'url.GetMetadata', { Type: 'METADATA-RESOURCE', ID: id || '0' }, callback );
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
      return this.sendRequest( 'url.GetMetadata', { Type: 'METADATA-TABLE', ID: resource +':'+classification }, callback );
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
      return this.sendRequest( 'url.GetMetadata', { Type: 'METADATA-CLASS', ID: resource || 'Property' }, callback );
    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  searchQuery: {
    /**
     *
     * @async
     * @method searchQuery
     * @param resource
     * @param callback
     * @returns {*}
     */
    value: function searchQuery( args, callback ) {
      RETS.debug( 'searchQuery( %s )', args );

      this.sendRequest( 'url.Search', {
        SearchType: args.SearchType || 'Property',
        Class: args.Class || 'A',
        Query: args.Query || '',
        QueryType: args.QueryType || 'DMQL2', // 'DMQL'
        Count: (args.Count === false || args.Count === 0) ? 0 : 1,
        Format: args.Format || 'STANDARD-XML', // "COMPACT-DECODED"
        Limit: args.Limit || 99,
        StandardNames: args.StandardNames || 0
      }, callback );

      // @chainable
      return this;

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  sendRequest: {
    /**
     * Abstract RETS Query wrapper.
     *
     *
     * @async
     * @method sendRequest
     * @param action
     * @param args
     * @param callback
     * @returns {*}
     */
    value: function sendRequest( action, args, callback ) {
      RETS.debug( 'sendRequest' );

      // Callback Method.
      callback = 'function' === typeof callback ? callback : this.utility.noop;

      var querystring = require( 'querystring' );
      var request = this._curl;
      var Instance = this;
      var _url = [ Instance.get( 'settings.protocol' ), "//", Instance.get( 'settings.host' ), ':', Instance.get( 'settings.post', 80 ), Instance.get( action ), '?', querystring.stringify( args ) ].join( '' );
      
      RETS.debug( 'sendRequest::_url', _url );

      // var request = new this.utility.libcurl();

      var options = {
        username: this.get( 'settings.user' ) || this.get( 'settings.username' ),
        password: this.get( 'settings.pass' ) || this.get( 'settings.password' ),
        method: 'GET',
        host: this.get( 'settings.host' ),
        path: this.get( 'settings.path' ),
        port: this.get( 'settings.port' ),
        protocol: this.get( 'settings.protocol' )
        // headers: this._requestHeaders()
      };

      request.setopt('URL', _url);
      request.setopt('COOKIEJAR', ''); // Cookies are kinda important for sessions
      request.setopt('HTTPAUTH', 2); // Digest auth
      request.setopt('USERNAME', options.username);
      request.setopt('PASSWORD', options.password);

      var body = ''; //empty buffer for full response
      var headers = [];

      request.on('data', function(chunk) {
        /**
         * meh - ideally we won't buffer the response, but we have to for now
         */
        body += chunk;
        return chunk.length;
      });

      request.on('header', function(chunk) {
        /**
         * meh - this is just to trick the rest of the stack for now
         * @type {[type]}
         */
        var h = chunk.toString().split(':');
        headers[h[0]] = h[1];

        return chunk.length;
      });

      // curl.close() should be called in event 'error' and 'end' if the curl won't use any more.
      // or the resource will not release until V8 garbage mark sweep.
      request.on('error', function(e) {
          console.log("error: " + e.message);
          // TODO: fire callback with error
          request.close();
      });

      request.on('end', function() {
          // TODO: error handle / passing based on request.getinfo('RESPONSE_CODE');
          // request.close();

          console.log(body);

          Instance._handleBody( body, function bodyParsed( error, data ) {
            RETS.debug( 'sendRequest->haveResponse->bodyParsed', typeof error, data );

            if( error ) {
              return callback( error, data );
            }

            // Callback Response.
            return callback( null, data );

          });
      });

      request.perform();

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
  _parseCapabilities: {
    value: function( data ) {
      RETS.debug( '_parseCapabilities');

      var Instance = this;

      Instance._handleBody( data, function parsed( error, data ) {
        RETS.debug( '_parseCapabilities::end->parsed', error, typeof data );

        // Parse Error of connection data.
        if( error ) {
          return Instance.emit( 'connection.parse.error', error, data ).emit( 'connection', error, data );
        }

        // Connection response code must be 0.
        if( data.code !== 0 ) {
          return Instance.emit( 'connection.error', new Error( 'Connection response code not the expected 0.' ), data );
        }

        console.log(data);

        // Save general provider information.
        Instance.set( 'provider.name', data.data.MemberName );
        Instance.set( 'provider.user', data.data.User );
        Instance.set( 'provider.broker', data.data.Broker );

        // Have Server Information.
        Instance.set( 'capabilities.ServerInformation', true );

        // Save meta data.
        Instance.set( 'meta.version', data.data.MetadataVersion );
        Instance.set( 'meta.min_version', data.data.MinMetadataVersion );
        Instance.set( 'meta.min_timestamp', data.data.MinMetadataTimeStamp );
        Instance.set( 'meta.timestamp', data.data.MetadataTimeStamp );
        Instance.set( 'meta.timeout', data.data.TimeoutSeconds );

        // Save connection URLs.
        if( data.data.GetObject ) {
          Instance.set( 'url.Login', data.data.Login );
          Instance.set( 'capabilities.Login', true );
        }

        if( data.data.ChangePassword ) {
          Instance.set( 'url.ChangePassword', data.data.ChangePassword );
          Instance.set( 'capabilities.ChangePassword', true );
        }

        if( data.data.GetObject ) {
          Instance.set( 'url.GetObject', data.data.GetObject );
          Instance.set( 'capabilities.GetObject', true );
        }

        if( data.data.GetObject ) {
          Instance.set( 'url.Logout', data.data.Logout );
          Instance.set( 'capabilities.Logout', true );
        }

        if( data.data.GetObject ) {
          Instance.set( 'url.Search', data.data.Search );
          Instance.set( 'capabilities.Search', true );
        }

        if( data.data.GetObject ) {
          Instance.set( 'url.GetMetadata', data.data.GetMetadata );
          Instance.set( 'capabilities.GetMetadata', true );
        }

        // Emit connection success.
        Instance.emit( 'connection', null, Instance );
        Instance.emit( 'connection.success', Instance );

      });

    },
    enumerable: true,
    configurable: true,
    writable: true
  },
  _handleBody: {
    /**
     * Parse RETS response and return an Object.
     *
     * @todo Load text for response codes from static/dada/codes.json
     *
     * @async
     * @chainable
     * @method _handleBody
     * @private
     *
     * @param data {String} Data string to parse.
     * @param callback {Function} Callback method.
     * @returns {*} Instance.
     */
    value: function _handleBody( data, callback ) {
      RETS.debug( '_handleBody' );

      var Instance = this;

      var parsed = {
        code: undefined,
        text: undefined,
        type: undefined,
        data: {}
      };

      // Parse XML
      this.utility.parseString( data, function xml_parsed( error, data ) {
        RETS.debug( '_handleBody->xml_parsed' );

        try {

          if( error ) {
            console.log( 'debug', data );
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

          // Listings in STANDARD-XML Format.
          if( data.RETS[ 'REData' ] ) {
            // console.log( require( 'util' ).inspect( data.RETS.COUNT, { showHidden: false, colors: true, depth: 4 } ) )
            // console.log( 'data.RETS.REData', data.RETS.REData[0] );

            //TODO: handle data for other resources; like agents

            parsed.type = 'data';
            parsed.data = data.RETS.REData[0].REProperties[0].ResidentialProperty;

            return callback( null, parsed );

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
            else if ( Instance.utility.first( data.RETS[ 'METADATA' ][0][ 'METADATA-RESOURCE' ] ) ) {
              parsed.type = 'resources';
              parsed.resource = data.RETS[ 'METADATA' ][0][ 'METADATA-RESOURCE' ][0]['$'].Resource;

              // Iterate through each class data type and create object
              data.RETS[ 'METADATA' ][0][ 'METADATA-RESOURCE' ][0]['Resource'].forEach( function iterate( class_data ) {
                parsed.data[ class_data.ResourceID ] = class_data;
              });

              // Trigger callback with parsed data.
              return callback( null, parsed );

            }
            else if ( Instance.utility.first( data.RETS[ 'METADATA' ][0][ 'METADATA-TABLE' ] ) ) {
              parsed.type = 'fields';
              parsed.resource = data.RETS[ 'METADATA' ][0][ 'METADATA-TABLE' ][0]['$'].Resource;

              // Iterate through each class data type and create object
              data.RETS[ 'METADATA' ][0][ 'METADATA-TABLE' ][0]['Field'].forEach( function iterate( class_data ) {
                parsed.data[ class_data.SystemName ] = class_data;
              });

              // Trigger callback with parsed data.
              return callback( null, parsed );

            }

            throw new Error( 'Unknown RETS METADATA response sub-type.' );

          }

          // Some servers use RETS-STATUS to tell us when there were no matching records found
          if( data.RETS[ 'RETS-STATUS' ] ) {
            parsed.type = 'status';
            return callback( null, parsed );
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
  },
  _requestHeaders: {
    /**
     * Prepare Outgoing Headers
     *
     * @method _requestHeaders
     */
    value: function _requestHeaders() {
      RETS.debug( '_requestHeaders' );

      this.set( 'settings.headers.rets-version', 'RETS/' + this.get( 'settings.version' ) );
      this.set( 'settings.headers.user-agent', this.get( 'settings.agent.user' ) );
      this.set( 'settings.headers.accept', '*/*' );

      if( this.get( 'settings.agent.user' ) && this.get( 'settings.agent.password' ) ) {

        var ua_a1 = this.utility.md5([
          this.get( 'settings.agent.user' ),
          this.get( 'settings.agent.password' )
        ].join( ':' ));

        var ua_dig_resp = this.utility.md5([
          ua_a1.trim(),
          this.get( 'authorization.request', '' ).trim(),
          this.get( 'authorization.session', '' ).trim(),
          this.get( 'authorization.version', '' ).trim()
        ].join( ':' ));

        this.set( 'settings.headers.rets-ua-authorization', 'Digest ' + ua_dig_resp );

      }

      if( this.get( 'authorization.cookies' ) ) {

        RETS.debug (' cookies ' , this.get( 'authorization.cookies' ));

        var _cookies = this.get( 'authorization.cookies' ).join( '; ' );

        // @ghetto
        _cookies = _cookies.replace( 'path=/;', '' );
        _cookies = _cookies.replace( 'path=/', '' );
        _cookies = _cookies.replace( 'HttpOnly;', '' );

        this.set( 'settings.headers.cookie', _cookies );
      }

      return this.get( 'settings.headers' );

    },
    enumerable: false,
    configurable: true,
    writable: true
  },
  _handleHeaders: {
    /**
     * Handle Response Headers
     *
     * @method _handleHeaders
     *
     * @param headers {Object}
     * @returns {*}
     * @private
     */
    value: function _handleHeaders( headers ) {
      RETS.debug( '_handleHeaders' );

      var Instance = this;

      // e.g. rets-version: RETS/1.7.2
      if( headers[ 'rets-version' ] ) {
        Instance.set( 'authorization.version', headers[ 'rets-version' ] );
      }

      // e.g. RETS-Request: whateva
      if( headers[ 'rets-request' ] ) {
        Instance.set( 'authorization.request', headers[ 'rets-request' ] );
      }

      // session-id. e.g. Set-Cookie: RETS-Session-ID=nhwbkuszwg2eck0evrhq5wsu; path=/
      if( headers[ 'set-cookie' ] ) {

        Instance.set( 'authorization.cookies', headers[ 'set-cookie' ] );

        headers[ 'set-cookie' ].forEach( function( value ) {

          if( value.indexOf( 'RETS-Session-ID' ) > -1 ) {

            // e.g. "RETS-Session-ID=y24mpczv2i0ts3d5lkv4c4te; path=/" => "y24mpczv2i0ts3d5lkv4c4te"
            var _match = value.match( /RETS-Session-ID\=(.*?)(\;|\s+|$)/ );

            Instance.set( 'authorization.session', _match[1] );
          }

        });

      }

      // .e.g Content-Type: text/xml
      if( headers[ 'content-type' ] ) {
        Instance.set( 'support.format', headers[ 'content-type' ] );
      }

      // e.g. X-Powered-By: ASP.NET
      if( headers[ 'x-powered-by' ] ) {
        Instance.set( 'server.powered', headers[ 'x-powered-by' ] );
      }

      // Save Returned Server details.
      if( headers[ 'server' ] ) {
        Instance.set( 'server.name',  headers[ 'server' ] );
      }

      // e.g. RETS-Server: Interealty-RETS/1.5.247.0
      if( headers[ 'rets-server' ] ) {
        Instance.set( 'server.rets',  headers[ 'rets-server' ] );
      }

      return this;

    },
    enumerable: false,
    configurable: true,
    writable: true
  },
  _handleDigest: {
    /**
     * Handle Response Headers
     *
     * @method _handleHeaders
     *
     * @param digest {Object}
     * @returns {*}
     * @private
     */
    value: function _handleDigest( digest ) {
      RETS.debug( '_handleDigest' );

      // @chainable
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
    value: require( 'debug' )( 'rets:client' ),
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