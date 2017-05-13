'use strict';

var gulp            = require('gulp');
var typescript      = require('gulp-typescript');

var uglify          = require('gulp-uglify');
var plumber         = require('gulp-plumber');
var run_sequence    = require('run-sequence');
var changed         = require('gulp-changed');
var rename          = require('gulp-rename');




/* ----------------------------------------- */

/**
 * +-- typescript
 */
gulp.task('ts.compile', function () {
    // typescriptのコンパイル
    return gulp.src(['src/**/*.ts'])
        .pipe(plumber())
        .pipe(changed('dist/', { extension: '.js' }))
        .pipe(typescript({
            sourceMap: true,
            lib: [
                "es5",
                "es2015",
                "es2017",
                "dom",
                "scripthost"
            ]
        }))
        .pipe(gulp.dest('dist/'));
});


/**
 * +-- JS圧縮
 */
gulp.task('ts.minify', function() {
    return gulp.src(
            [
              'dist/**/*.js',
              '!dist/**/*.min.js'
            ]
        )
        .pipe(plumber())
        .pipe(changed('dist/', { extension: '.min.js' }))
        .pipe(uglify({ preserveComments: 'some' }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist/'));
});

/**
 * +-- タスクのシーケンス実行
 */
gulp.task('ts', function() {

    run_sequence(
        'ts.compile',
        'ts.minify'
    );

});
/* ----------------------------------------- */

/**
 * +-- 監視
 */
gulp.task('watch', function() {
    gulp.watch('src/**/*.ts', ['ts']);

});
/* ----------------------------------------- */

/**
 * +--デフォルト
 */
gulp.task('default', ['ts', 'watch']);
