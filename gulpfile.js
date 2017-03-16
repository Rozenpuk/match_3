var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var watchify = require('watchify');
var babel = require('babelify');
var uglify = require('gulp-uglify');
var plumber = require('gulp-plumber');

function compile(watch) {
  var bundler = watchify(browserify('./src/main.js', { debug: true }).transform(babel));

  function rebundle() {
    bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source('build.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(uglify())
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./build'));
  }

  if (watch) {
    bundler.on('update', function() {
      console.log('-> bundling...');
      rebundle();
    });
  }

  rebundle();
}

function watch() {
  return compile(true);
};

gulp.task('assets', function()
{
    return gulp.src(['./src/assets/**'])
        .pipe(plumber())
        .pipe(gulp.dest('./build/assets'));
});

gulp.task('index', ['assets'], function()
{
    return gulp.src(['./src/index.html',
                     './src/phaser/v2/build/phaser.js'])
        .pipe(plumber())
        .pipe(gulp.dest('./build'));
});

// gulp.task('build', function() { return compile(); });
gulp.task('watch', ['index'], function() { return watch(); });

gulp.task('default', ['watch']);
