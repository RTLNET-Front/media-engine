'use strict';
module.exports = function(grunt) {

	// load all grunt tasks
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
	
	// grunt cfg 
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			my_target: {
				files: {
					'dist/me.min.js': ['src/*.js']
				}
			},
			options: {
				mangle: true,
				compress: true,
				report: 'gzip',
				banner: '/*! <%= pkg.name %> v<%= pkg.version %> | RTLnet */\n'
			}
		}
	});
	
	// default task, must be defined
	grunt.registerTask('default', function(){
		grunt.task.run('uglify');
	});
	
}
	