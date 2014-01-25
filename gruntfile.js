/**
 * Build Module.
 *
 * @author potanin@UD
 * @version 1.2.1
 * @param grunt
 */
module.exports = function( grunt ) {

  // Build Configuration.
  grunt.initConfig({

    // Get Package.
    pkg: grunt.file.readJSON( 'package.json' ),

    // Generate YUIDoc documentation.
    yuidoc: {
      compile: {
        name: '<%= pkg.name %>',
        description: '<%= pkg.description %>',
        version: '<%= pkg.version %>',
        url: '<%= pkg.homepage %>',
        options: {
          paths: 'lib',
          outdir: 'static/codex/'
        }
      }
    },

    // Watch for Development.
    watch: {
      options: {
        interval: 100,
        debounceDelay: 500
      },
      yuidoc: {
        files: [ 'lib/*.js' ],
        tasks: [ 'yuidoc' ]
      },
      markdown: {
        files: [ 'readme.md' ],
        tasks: [ 'markdown' ]
      }
    },

    // Generate Markdown Documentation.
    markdown: {
      all: {
        files: [
          {
            expand: true,
            src: 'readme.md',
            dest: 'static/',
            ext: '.html'
          }
        ],
        options: {
          markdownOptions: {
            gfm: true,
            codeLines: {
              before: '<span>',
              after: '</span>'
            }
          }
        }
      }
    }

  });

  // Load NPM Tasks.
  grunt.loadNpmTasks( 'grunt-contrib-yuidoc' );
  grunt.loadNpmTasks( 'grunt-contrib-watch' );
  grunt.loadNpmTasks( 'grunt-contrib-less' );
  grunt.loadNpmTasks( 'grunt-markdown' );

  // Register NPM Tasks.
  grunt.registerTask( 'default', [ 'markdown', 'yuidoc' ] );

};