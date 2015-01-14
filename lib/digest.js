//
// # Digest Client
//
// Use together with HTTP Client to perform requests to servers protected
// by digest authentication.
//

var HTTPDigest = function() {
	var curl = require( 'node-curl/lib/Curl' );
	var utility = require('./utility');
	var session = null;

	process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'; // SSL

	var HTTPDigest = function( options, callback ) {
		return this.request(options, 'function' === typeof callback ? callback : function noop() {} );
	};

	//
	// ## Make request
	//
	// Wraps the http.request function to apply digest authorization.
	//
	HTTPDigest.prototype.request = function( options, callback ) {
		var self = this;

		var request = new curl();

		// console.log(options);

		var headers = [ 'RETS-Version: '+ options.version ];
		// var headers = ['RETS-Version: '+this.get('authorization.version'), 'Transfer-Encoding: chunked']; // Damn - this kills things

		if (options.protocol === 'https:') {
			request.setopt('USE_SSL', true);
			request.setopt('SSL_VERIFYPEER', false);
		}

		// calculate RETS-UA-Authorization header
		if (options.agent.pass && session) {
			var ua_a1 = utility.md5(options.agent.user + ':' + options.agent.pass);
			var session_id_to_calculate_with = session;
			var ua_dig_resp = utility.md5(ua_a1.trim() + ':' + '' + ':' + session_id_to_calculate_with.trim())
			headers.push('RETS-UA-Authorization: Digest ' + ua_dig_resp);
		}

		// RETS.debug(headers);
		
		request.setopt('URL', options.protocol + '//' + options.host + ':' + options.port + options.path );
		request.setopt('COOKIEJAR', options.cookie); // Cookies are kinda important for sessions
		request.setopt('HTTPAUTH', 2); // Digest auth
		// request.setopt('CRLF',1);
		request.setopt('USERNAME', options.username);
		request.setopt('PASSWORD', options.password);
		request.setopt('USERAGENT', options.agent.user);
		request.setopt('HTTPHEADER', headers);

		var body = ''; //empty buffer for full response
		var responseHeaders = [];

		request.on('data', function(chunk) {
			/** buffer the response */
			if (options.buffer === true) body += chunk;
			return chunk.length;
		});

		request.on('header', function(chunk) {
			/** parse headers */
			var h = chunk.toString().split(':');
			responseHeaders[h[0]] = h[1];

			return chunk.length;
		});

		// curl.close() should be called in event 'error' and 'end' if the curl won't use any more.
		// or the resource will not release until V8 garbage mark sweep.
		request.on('error', function(e) {
			// RETS.debug('Curl request error')
			console.trace("error: " + e.message);

			request.close();
			process.nextTick(function(){
				callback(e, { headers:responseHeaders, body: body }, null);
			});
		});

		request.on('end', function() {
				// TODO: error handle / passing based on request.getinfo('RESPONSE_CODE');
			if (request.getinfo('RESPONSE_CODE') !== 200) {
				// RETS.debug( 'Error: we received an http - likely an HTML response to follow', request.getinfo('RESPONSE_CODE'), responseHeaders, body);
				return callback( { code: request.getinfo('RESPONSE_CODE'), request: request }, null, null );
			}

			// Make sure to store the session for later
			if (responseHeaders['Set-Cookie']) {
				session = responseHeaders['Set-Cookie'].split(';')[0].split('=')[0];
			}

			request.close();
			process.nextTick(function(){
				callback(null, { headers:responseHeaders, body: body }, body);
			});
		});

		return request;
	};

	// Return response handler
	return HTTPDigest;

}();

module.exports = function createDigestClient( options, callback ) {
	return new HTTPDigest( options, callback );
};

