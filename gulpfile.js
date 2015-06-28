var gulp = require('gulp'),
    g = {
        browserify: require('gulp-browserify'),
        concat: require('gulp-concat')
    };

gulp.task('default', function() {
    return gulp.src('ooee/globalExport.js')
        .pipe(g.browserify())
        .pipe(g.concat('ooee.js'))
        .pipe(gulp.dest('.'));
});
