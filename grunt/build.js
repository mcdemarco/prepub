var _ = require('underscore');

module.exports = function(grunt) {
	var pkg = require('../package.json');

	grunt.config.merge({
		browserify: {
			default: {
				files: {
					'build/prepub.js': 'src/index.js'
				},
				options: {
					browserifyOptions: {
						debug: true,
						detectGlobals: false
					},
					watch: true
				}
			},
			release: {
				files: {
					'build/prepub.js': 'src/index.js'
				},
				options: {
					browserifyOptions: {
						debug: false,
						detectGlobals: false
					},
					transform: [['uglifyify', { global: true }]]
				}
			}
		},
		watch: {
			template: {
				files: 'src/index.html',
				tasks: ['html']
			}
		}
	});

	grunt.registerTask('html:release', function() {
		var template = _.template(grunt.file.read('src/index.html'));

		var data = {
			name: '{{STORY_NAME}}',
			passages: '{{STORY_DATA}}',
			year: grunt.template.today('yyyy'),
			version: pkg.version,
			script: '<script>' + grunt.file.read('build/prepub.js') + '</script>'
		};

		grunt.file.write('build/format.html', template(data));
	});

	grunt.registerTask('html:backport', function() {
		var template = _.template(grunt.file.read('src/index.html'));

		var data = {
			name: 'Story',
			passages: '<div id="storeArea" data-size="STORY_SIZE" hidden>"STORY"</div>',
			year: grunt.template.today('yyyy'),
			version: pkg.version,
			script: '<script>' + grunt.file.read('build/prepub.js') + '</script>'
		};

		grunt.file.write('build/header.html', template(data));
	});

	grunt.registerTask('build', ['browserify:default']);
	grunt.registerTask('build:release', ['browserify:release', 'html:release', 'html:backport']);
	grunt.registerTask('default', ['build']);
	grunt.registerTask('dev', ['build', 'watch']);
};
