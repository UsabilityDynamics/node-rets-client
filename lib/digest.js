//
// # Digest Client
//
// Use together with HTTP Client to perform requests to servers protected
// by digest authentication.
//

var HTTPDigest = function() {
  var curl = require( 'node-curl/lib/Curl' );

  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'; // SSL

  var HTTPDigest = function( options, callback ) {

    this.options = options;

    this.nc = options.nc || 0;
    this.username = options.username;
    this.password = options.password;

    this.request({
      method: options.method,
      host: options.host,
      port: options.port,
      path: options.path,
      protocol: options.protocol,
      headers: options.headers,
      cookie: options.cookie
    }, 'function' === typeof callback ? callback : function noop() {} );

    return this;

  };

  //
  // ## Make request
  //
  // Wraps the http.request function to apply digest authorization.
  //
  HTTPDigest.prototype.request = function( options, callback ) {
    var self = this;

    var request = new curl();
    request.setopt('URL', '');
    request.setopt('COOKIEJAR', ''); // Cookies are kinda important for sessions
    request.setopt('HTTPAUTH', 2); // Digest auth
    request.setopt('USERNAME', '');
    request.setopt('PASSWORD', '');

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
        request.close();
        process.nextTick(function(){
          callback(null, { headers:headers, body: body }, body);
        });
    });

    request.perform();
  };

  // Return response handler
  return HTTPDigest;

}();

module.exports = function createDigestClient( options, callback ) {
  return new HTTPDigest( options, callback );
};

