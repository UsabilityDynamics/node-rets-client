Object.defineProperties( module.exports, {
  md5: {
    value: require( 'MD5' ),
    enumerable: true,
    configurable: true,
    writable: true
  },
  digest: {
    value: require( './digest' ),
    enumerable: true,
    configurable: true,
    writable: true
  },
  noop: {
    value: function noop() {},
    enumerable: true,
    configurable: true,
    writable: true
  },
  request: {
    value: require( 'request' ),
    enumerable: true,
    configurable: true,
    writable: true
  },
  defaults: {
    value: require( 'lodash' ).defaults,
    enumerable: true,
    configurable: true,
    writable: true
  },
  extend: {
    value: require( 'lodash' ).extend,
    enumerable: true,
    configurable: true,
    writable: true
  },
  first: {
    value: require( 'lodash' ).first,
    enumerable: true,
    configurable: true,
    writable: true
  },
  parseString: {
    value: require( 'xml2js' ).parseString,
    enumerable: true,
    configurable: true,
    writable: true
  }
});