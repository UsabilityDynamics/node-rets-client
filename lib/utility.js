Object.defineProperties( module.exports, {
  Setting: {
    /**
     * Object Settings Mixin.
     *
     * @for Utility
     * @method Setting
     */
    value: require( 'object-settings' ).mixin,
    enumerable: true,
    configurable: true,
    writable: true
  },
  Emitter: {
    /**
     * Object Emitter Mixin.
     *
     * @for Utility
     * @method Emitter
     */
    value: require( 'object-emitter' ).mixin,
    enumerable: true,
    configurable: true,
    writable: true
  },
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
  curl: {
    value: require( 'curl' ),
    enumerable: true,
    configurable: true,
    writable: true
  },
  libcurl: {
    value: require( 'curl' ),
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
  },
  XmlStream: {
    value: require( 'xml-stream' ),
    enumerable: true,
    configurable: true,
    writable: true    
  }
});