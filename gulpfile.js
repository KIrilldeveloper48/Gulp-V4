let projectFolder = 'dist';
let sourceFolder = 'app';

//Используемые пути до файлов
let path = {

  build: {
    html: projectFolder + '/',
    css: projectFolder + '/css/',
    js: projectFolder + '/js/',
    img: projectFolder + '/img/',
    fonts: projectFolder + '/fonts/'
  },

  src: {
    html: sourceFolder + '/*.html',
    css: sourceFolder + '/sass/*.scss',
    js: sourceFolder + '/js/*.js',
    img: sourceFolder + '/img/**/*',
    fonts: sourceFolder + '/fonts/*.ttf'
  },

  watch: {
    html: sourceFolder + '/**/*.html',
    css: sourceFolder + '/sass/**/*.scss',
    js: sourceFolder + '/js/**/*.js',
    img: sourceFolder + '/img/**/*'
  },

  clean: './' + projectFolder + '/**/*'
}
//Константы для gulp
const {
  src,
  dest,
  parallel,
  series,
  watch
} = require('gulp');

//===Общие====//
//Онлайн сервер
const browserSync = require('browser-sync').create();
//Удаление файлов
const del = require('del');
//Объединение файлов с помощью @@include('')
const fileinclude = require('gulp-file-include');
//Переименование файлов
const rename = require('gulp-rename');
//===CSS====//
//Компилятор
const sass = require('gulp-sass');
//Автоматические вендорные префиксы
const autoprefixer = require('gulp-autoprefixer');
//Сжатие css
const cleanCss = require('gulp-clean-css');
//===JS====//
//Сжатие js
const uglify = require('gulp-uglify-es').default;
//===Изображения===//
//Сжатие изображений
const imagemin = require('gulp-imagemin');
//Проверка, было ли изображение сжато
const newer = require('gulp-newer');
//Перевод изображение в формат WEBP
//const webp = require('gulp-webp');
//===Шрифты===//
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');

//===Онлайн сервер====//
function browSync() {
  browserSync.init({
    //Директория для отслеживания файлов
    server: {
      baseDir: './' + projectFolder + '/'
    },
    //Отключаем уведомления при запуске
    notify: false,
    //Определяет будет ли проекту присваиваться ip адрес для работы в локальной сети
    online: true
  })
};

//===HTML====//
//Выбираем файлы, собираем целый html из шаблонов и помещаем в папку проекта
function html() {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(dest(path.build.html))
    .pipe(browserSync.stream())
};

//===CSS====//
//Собираем основные файлы, добавляем префиксы, преобразовываем в css, выгружаем несжатые файлы, затем сжимаем их полные копии, переименовываем, и также выгружаем. На выходе мы имеем по две версии одного и того же файла - сжатую и несжатую
function css() {
  return src(path.src.css)
    .pipe(sass({
      outputStyle: 'expanded'
    }))
    .pipe(autoprefixer({
      overrideBrowserslist: ['Last 10 versions'],
      grid: true
    }))
    .pipe(dest(path.build.css))
    .pipe(cleanCss())
    .pipe(rename({
      extname: '.min.css'
    }))
    .pipe(dest(path.build.css))
    .pipe(browserSync.stream())
};

//===JS====//
//Собираем файлы, объединяем и выгружаем, затем сжимаем копии, переименовываем и также выгружаем
function js() {
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(rename({
      extname: '.min.js'
    }))
    .pipe(dest(path.build.js))
    .pipe(browserSync.stream())
};

//===Изображения====//
function images() {
  return src([path.src.img], { base: 'app/img' })
    .pipe(newer(path.build.img))
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{ removeViewBox: false }],
      interlaced: true,
      optimizationLevel: 3
    }))
    .pipe(dest(path.build.img))
};

//===Шрифты====//
function fonts() {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts));
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts));
};

//===Наблюдение====//
function startWatch() {
  watch([path.watch.html], html);
  watch([path.watch.css], css);
  watch([path.watch.js], js);
  watch([path.watch.img], images);
};

//===Очистка====//
function cleanDist() {
  return del(path.clean, {
    force: true
  })
};

//===Присваивание функций====//
exports.browSync = browSync;
exports.html = html;
exports.css = css;
exports.js = js;
exports.images = images;
exports.fonts = fonts;
exports.cleanDist = cleanDist;

let build = series(cleanDist, parallel(html, css, js, images, fonts));

exports.default = parallel(build, browSync, startWatch);