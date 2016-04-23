var gulp        = require('gulp');
var jshint      = require('gulp-jshint');
var rimraf      = require('gulp-rimraf');
var env         = require('gulp-env');
var runSequence = require('run-sequence');
var fs          = require('fs');
var coveralls   = require('gulp-coveralls');
var istanbul    = require('gulp-istanbul');
var isparta     = require('isparta');
var mocha       = require('gulp-mocha-co');
require('shelljs/global');

gulp.task('no.onlys', function (callback) {
	exec('find . -path "*/*.spec.js" -type f -exec grep -l "describe.only" {} + \n find . -path "*/*.spec.js" -type f -exec grep -l "it.only" {} +', function (code, output) { // jshint ignore:line
		if (output) return callback(new Error("The following files contain .only in their tests"));
		return callback();
	});
});


gulp.task('lint', ['clean'], function () {
	return gulp.src(['**/*.js', '!**/node_modules/**', '!**/server/migration/**', '!coverage/**/*.js'])
		.pipe(jshint({lookup: true}))
		.pipe(jshint.reporter('default'))
		.pipe(jshint.reporter('fail'));
});

gulp.task('set_unit_env_vars', function () {
	env({
		vars: {
			GITHUBTESTTOKEN1: '22cfa1d86f9de4185af8da5bdd6580b6760b4185',
			GITHUBTESTTOKEN2: '63142aba614b4cd9a41f8d7ec0dcf5f75e259021',
			TAG_CONFIG_FILE_PATH: '../test/tag',
			NODE_ENV: "test",
			TEST_MONGO_URI: process.env.TEST_MONGO_URI || "192.168.99.100:27017/unit_test",
			MAIL_CHIMP_KEY: "e58cff2e15d5b14514f5605e3da938be-us9"
		}
	});
});

gulp.task('unit_pre', function () {
	return gulp.src(['**/*.js', '!**/*.spec.js', '!**/node_modules/**/*.js', '!.debug/**/*.js', '!gulpfile.js', '!coverage/**/*.js'])
		.pipe(istanbul({ // Covering files
			instrumenter: isparta.Instrumenter,
			includeUntested: true
		}))
		.pipe(istanbul.hookRequire()) // Force `require` to return covered files
		.on('finish', function () {
			gulp.src(['**/*.unit.spec.js', '!**/node_modules/**/*.js'], {read: false})
				.pipe(mocha({reporter: 'spec', timeout: '10000'}))
				.pipe(istanbul.writeReports({
					dir: 'coverage',
					reportOpts: {dir: 'coverage'},
					reporters: ['lcov']
				}));
		});
});


gulp.task('set_integ_env_vars', function () {
	env({
		vars: {
			GITHUBTESTTOKEN1: '22cfa1d86f9de4185af8da5bdd6580b6760b4185',
			GITHUBTESTTOKEN2: '63142aba614b4cd9a41f8d7ec0dcf5f75e259021',
			TAG_CONFIG_FILE_PATH: '../test/tag',
			NODE_ENV: "test",
			TEST_MONGO_URI: process.env.TEST_MONGO_URI || "192.168.99.100:27017/integ_test"
		}
	});
});

gulp.task('integ_pre', function () {
	return gulp.src(['**/*.js', '!**/*.integ.spec.js', '!**/node_modules/**/*.js', '!.debug/**/*.js', '!gulpfile.js', '!coverage/**/*.js'], {read: false})
		.pipe(mocha({reporter: 'spec', timeout: '10000'}));
});



gulp.task('clean', function () {
	return gulp.src(['.coverdata', '.debug', '.coverrun'], {read: false})
		.pipe(rimraf());
});


gulp.task('unit_test', function (callback) {
	runSequence('set_unit_env_vars',
		'unit_pre',
		callback);
});

gulp.task('integ_test', function (callback) {
	runSequence('set_integ_env_vars',
		'integ_pre',
		callback);
});

gulp.task('coveralls', function (callback) {
	var repo_token = process.env.COVERALLS_TOKEN;
	if (!repo_token) {
		return callback(new Error("COVERALLS_TOKEN environment variable is missing"));
	}
	else {
		fs.writeFile(".coveralls.yml", "service_name: codefresh-io\nrepo_token: " + repo_token, function (err) {
			if (err) {
				callback(err);
			}
			else {
				gulp.src('coverage/coverage-unit.info')
					.pipe(coveralls());
			}
		});
	}
});
