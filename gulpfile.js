var gulp = require('gulp'),
    args = require('yargs').argv,
    g = {
        typeScript: require('gulp-typescript'),
        wrap: require('gulp-wrap')
    };

gulp.task('default', function() {
    return gulp.src('ts/*')
        .pipe(g.typeScript({out: 'ooee.js'}))
        .pipe(g.wrap(wrapTemplate()))
        .pipe(gulp.dest('.'));
});

function wrapTemplate() {
    if (args.wrap) return args.wrap;
    return [
        'var ooee = function() {',
            '<%= contents %>',
            'return OOEEmitter;',
        '}();'
    ].join('\n');
}
