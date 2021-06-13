module.exports = function(grunt) {
	var pkg = require('../package.json');

	grunt.registerTask('package:support', function() {
		grunt.file.copy('src/prepub.css', 'dist/extras/prepub.css');
		grunt.file.copy('src/prepub-para.css', 'dist/extras/prepub-para.css');
		grunt.file.copy('src/epub.yaml', 'dist/extras/epub.yaml');
		grunt.file.copy('src/html.yaml', 'dist/extras/html.yaml');
		grunt.file.copy('src/pdf.yaml', 'dist/extras/pdf.yaml');
	});

	grunt.registerTask('package:icon', function() {
		grunt.file.copy('src/icon.svg', 'dist/Twine2/icon.svg');
	});

	grunt.registerTask('package:format', function() {
		var formatData = {
			description: pkg.description,
			author: pkg.author.replace(/ <.*>/, ''),
			image: 'icon.svg',
			name: pkg.name,
			url: pkg.repository,
			version: pkg.version,
			proofing: true,
			source: grunt.file.read('build/format.html')
		};

		grunt.file.write(
			'dist/Twine2/format.js',
			'window.storyFormat(' + JSON.stringify(formatData) + ');'
		);
	});

	grunt.registerTask('package:header', function() {
		grunt.file.copy('build/header.html', 'dist/Twine1/header.html');
	});

	grunt.registerTask('package', ['build:release', 'package:support', 'package:icon', 'package:format', 'package:header']);
};
