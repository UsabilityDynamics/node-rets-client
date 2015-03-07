//
// # Digest Client
//
// Use together with HTTP Client to perform requests to servers protected
// by digest authentication.
//

var HTTPDigest = function() {
	var curl = require( 'node-curl/lib/Curl' );
	var utility = require('./utility');

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

		var headers = [];
		for (var i in options.headers) {
			var val = options.headers[i] || '';
			if (val.length) val = ': ' + val;
			headers.push(i + val);
		}

		if (options.protocol === 'https:') {
			request.setopt('USE_SSL', true);
			/**
			 * Many RETS servers have outdated or invalid certificates.
			 * Technically we don't want to do this, but we can't do much about
			 * their bad behavior.
			 */
			request.setopt('SSL_VERIFYPEER', false);
		}
		
		request.setopt('URL', options.protocol + '//' + options.host + ':' + options.port + options.path );
		request.setopt('COOKIEJAR', options.cookie);
		request.setopt('COOKIEFILE', options.cookie);
		request.setopt('HTTPAUTH', 2); // Digest auth
		request.setopt('USERNAME', options.username);
		request.setopt('PASSWORD', options.password);
		request.setopt('USERAGENT', options.agent.user);
		request.setopt('HTTPHEADER', headers);
		// request.setopt('CRLF',1);

		var body = ''; //empty buffer for full response
		var responseHeaders = [];
		var cookies = []

		request.on('data', function(chunk) {
			/** buffer the response */
			if (options.buffer === true) body += chunk;
			return chunk.length;
		});

		request.on('header', function(chunk) {
			/** parse headers */
			var h = chunk.toString('utf8').trim().split(':');
			var key = h[0].toString('utf8').trim();
			var val = (h[1]) ? h[1].toString('utf8').trim() : '';

			if (key == 'Set-Cookie') cookies.push(val);
			// if (key.indexOf('Set-Cookie') > -1) console.log('Received Cookie',key,val);
			else if (key) responseHeaders[key] = val;

			return chunk.length;
		});

		// curl.close() should be called in event 'error' and 'end' if the curl won't use any more.
		// or the resource will not release until V8 garbage mark sweep.
		request.on('error', function(e) {
			console.trace("error: " + e.message);
			console.log(options);

			request.close();
			process.nextTick(function(){
				callback(e, { headers:responseHeaders, body: body }, null);
			});
		});

		request.on('end', function() {


				responseHeaders['Set-Cookie'] = cookies;

				// var util = require('util');
				// console.log( 'Error: we received an http - likely an HTML response to follow', request.getinfo('RESPONSE_CODE'), responseHeaders, body);
				// console.log('Sent:', headers);
				// console.log('Received', responseHeaders);
				// console.log('Received Cookies', util.inspect(request.getinfo('COOKIELIST')));
			// TODO: error handle / passing based on request.getinfo('RESPONSE_CODE');
			if (request.getinfo('RESPONSE_CODE') !== 200) {
				return callback( { code: request.getinfo('RESPONSE_CODE'), request: request }, null, null );
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

