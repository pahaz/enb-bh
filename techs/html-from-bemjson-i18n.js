/**
 * html-from-bemjson-i18n
 * ======================
 *
 * Собирает *html*-файл с помощью *bemjson*, *bh*, *lang.all* и *lang.{lang}*.
 *
 * **Опции**
 *
 * * *String* **bhFile** — Исходный BH-файл. По умолчанию — `?.bh.js`.
 * * *String* **bemjsonFile** — Исходный BEMJSON-файл. По умолчанию — `?.bemjson.js`.
 * * *String* **langAllFile** — Исходный langAll-файл. По умолчанию — `?.lang.all.js`.
 * * *String* **langFile** — Исходный lang-файл. По умолчанию — `?.lang.{lang}.js`.
 *   Если параметр lang не указан, берется первый из объявленных в проекте языков
 * * *String* **target** — Результирующий HTML-файл. По умолчанию — `?.{lang}.html`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb-bh/techs/html-from-bemjson-i18n'));
 * ```
 */
var vm = require('vm');
var vow = require('vow');
var vfs = require('enb/lib/fs/async-fs');
var requireOrEval = require('enb/lib/fs/require-or-eval');
var asyncRequire = require('enb/lib/fs/async-require');
var dropRequireCache = require('enb/lib/fs/drop-require-cache');

module.exports = require('enb/lib/build-flow').create()
    .name('html-from-bemjson-i18n')
    .target('target', '?.{lang}.html')
    .useSourceFilename('bhFile', '?.bh.js')
    .useSourceFilename('bemjsonFile', '?.bemjson.js')
    .useSourceFilename('langAllFile', '?.lang.all.js')
    .useSourceFilename('langFile', '?.lang.{lang}.js')
    .optionAlias('bhFile', 'bhTarget')
    .optionAlias('bemjsonFile', 'bemjsonTarget')
    .optionAlias('langAllFile', 'langAllTarget')
    .optionAlias('langFile', 'langTarget')
    .optionAlias('target', 'destTarget')
    .needRebuild(function (cache) {
        return cache.needRebuildFile('bh-file', this.node.resolvePath(this._bhFile)) ||
            cache.needRebuildFile('bemjson-file', this.node.resolvePath(this._bemjsonFile)) ||
            cache.needRebuildFile('allLang-file', this.node.resolvePath(this._langAllFile)) ||
            cache.needRebuildFile('lang-file', this.node.resolvePath(this._langFile)) ||
            cache.needRebuildFile('html-file', this.node.resolvePath(this._target));
    })
    .saveCache(function (cache) {
        cache.cacheFileInfo('bh-file', this.node.resolvePath(this._bhFile));
        cache.cacheFileInfo('bemjson-file', this.node.resolvePath(this._bemjsonFile));
        cache.cacheFileInfo('allLang-file', this.node.resolvePath(this._langAllFile));
        cache.cacheFileInfo('lang-file', this.node.resolvePath(this._langFile));
        cache.cacheFileInfo('html-file', this.node.resolvePath(this._target));
    })
    .builder(function (bhFilename, bemjsonFilename, allLangFilename, langFilename) {
        dropRequireCache(require, bhFilename);
        dropRequireCache(require, bemjsonFilename);
        return vow.all([
            asyncRequire(bhFilename),
            requireOrEval(bemjsonFilename),
            vfs.read(allLangFilename),
            vfs.read(langFilename)
        ]).spread(function (bh, bemjson, allLangSource, langSource) {
            vm.runInThisContext(allLangSource, allLangFilename);
            vm.runInThisContext(langSource, langFilename);

            return bh.apply(bemjson);
        });
    })
    .createTech();
