/*! PrefetchLoader v1.0.0 | (c) Suzunone | BSD 2-Clause License */
var Prefetch;
(function (Prefetch) {
    var Loader = (function () {
        /**
         * コンストラクタ
         *
         * @return void
         */
        function Loader(setting) {
            if (setting === void 0) { setting = {}; }
            var _this = this;
            /**
             * link hrefにセットする値が格納されている、要素名
             *
             * @var         string
             */
            this.href_attribute_name = 'pre-href';
            /**
             * link asにセットする値が格納されている、要素名
             *
             * @var         string
             */
            this.resource_type_attribute_name = 'pre-as';
            /**
             * リソースタイプ自動取得時のデフォルト値
             *
             * @var         string
             */
            this.default_resource = 'document';
            /**
             * preload 成功時のcallback
             *
             * @var         callback
             */
            this.preload_success = null;
            /**
             * preload 失敗時のcallback
             *
             * @var         callback
             */
            this.preload_error = null;
            /**
             * preload 済みのリスト
             *
             * @access      private
             * @var         var_type
             */
            this.preloaded_src = {};
            /**
             * preload 済みのリスト
             *
             * @access      private
             * @var         var_type
             */
            this.preloaded_media_src = {};
            /**
             * preload リスト
             *
             * @access      private
             * @var         var_type
             */
            this.preload_src = {};
            /**
             * preload リソースタイプ リスト
             *
             * @access      private
             * @var         var_type
             */
            this.preload_type = {};
            /**
             * preload メディア リスト
             *
             * @access      private
             * @var         var_type
             */
            this.preload_media = {};
            /**
             * CSSのasync読み込みを行う
             *
             * @access      private
             * @var         var_type
             */
            this.using_async_css_load = false;
            /**
             * CSSのdefer読み込みを行う
             *
             * @access      private
             * @var         var_type
             */
            this.using_defer_css_load = false;
            /**
             * preloadはヘッダに、実際のCSS使用場所は別に指定する
             *
             * @access      private
             * @var         var_type
             */
            this.using_divide_css_load = false;
            /**
             * using_divide_css_load時に埋め込むタグのID
             *
             * @access      private
             * @var         var_type
             */
            this.divide_css_load_mount_selector = 'head';
            /**
             * CSSのdefer読み込み時、実行はwindow.onload以降に行う
             *
             * @access      private
             * @var         var_type
             */
            this.defer_css_load_is_after_window_onload = false;
            this.preload_rel = 'preload';
            this.is_enable = true;
            this.type_count = {
                audio: 0,
                document: 0,
                font: 0,
                image: 0,
                script: 0,
                style: 0,
                track: 0,
                video: 0
            };
            this.css_load_count = 0;
            this.is_window_onload = true;
            this.is_defer_executed = false;
            if (setting.using_async_css_load !== undefined) {
                this.using_async_css_load = setting.using_async_css_load;
            }
            if (setting.using_defer_css_load !== undefined) {
                this.using_defer_css_load = setting.using_defer_css_load;
            }
            if (setting.defer_css_load_is_after_window_onload !== undefined) {
                this.defer_css_load_is_after_window_onload = setting.defer_css_load_is_after_window_onload;
            }
            if (setting.using_divide_css_load !== undefined) {
                this.using_divide_css_load = setting.using_divide_css_load;
            }
            if (setting.divide_css_load_mount_selector !== undefined) {
                this.divide_css_load_mount_selector = setting.divide_css_load_mount_selector;
            }
            // CSSロードモードはどちらか一つのみ選択可能にする
            if (this.using_async_css_load) {
                this.using_defer_css_load = false;
            }
            if (this.using_defer_css_load) {
                this.using_async_css_load = false;
            }
            if (setting.href_attribute_name !== undefined) {
                this.href_attribute_name = setting.href_attribute_name;
            }
            if (setting.resource_type_attribute_name !== undefined) {
                this.resource_type_attribute_name = setting.resource_type_attribute_name;
            }
            if (setting.default_resource !== undefined) {
                this.default_resource = setting.default_resource;
            }
            if (setting.preload_success !== undefined) {
                this.preload_success = setting.preload_success;
            }
            if (setting.preload_error !== undefined) {
                this.preload_error = setting.preload_error;
            }
            if (setting.urls !== undefined) {
                setting.urls.forEach(function (src, key, list) {
                    _this.setpreloadPointBySrc(src);
                });
            }
            if (setting.selector !== undefined) {
                this.setpreloadPointBySelector(setting.selector);
            }
            this.is_enable = this.isEnable();
            var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
            if (raf) {
                raf(function () {
                    _this.windosOnLoad();
                });
            }
            else {
                window.addEventListener('load', function () {
                    _this.windosOnLoad();
                }, false);
            }
        }
        /* ----------------------------------------- */
        /**
         * プレフェッチタグを作成
         *
         * @param string url
         * @param string as_type
         * @return void
         */
        Loader.prototype.createpreload = function (url, as_type) {
            var _this = this;
            if (as_type === void 0) { as_type = ''; }
            var link_element = document.createElement('link');
            link_element.rel = this.preload_rel;
            as_type = as_type || this.detectResourceType(url);
            if (!this.is_enable) {
                if (as_type === 'style' && (this.using_async_css_load || this.using_defer_css_load)) {
                    // preloadが使用できない場合は、cssとする
                    link_element.rel = 'stylesheet';
                }
            }
            try {
                link_element.as = as_type;
            }
            catch (e) {
                link_element.setAttribute('as', as_type);
            }
            if (as_type === 'font') {
                try {
                    // fontはドメインを調べてcrossoriginを付与
                    if (this.getDomain(url) !== this.getDomain(location.href)) {
                        link_element.crossorigin = 'use-credentials';
                    }
                    else if (window.navigator.userAgent.toLowerCase().indexOf('chrome') != -1) {
                        // choromeはcrossoriginが必須
                        link_element.crossorigin = 'use-credentials';
                    }
                    // typeを付与
                    link_element.type = 'font/' + this.getFileExtension(url);
                }
                catch (e) {
                    if (this.getDomain(url) !== this.getDomain(location.href)) {
                        link_element.setAttribute('crossorigin', 'use-credentials');
                    }
                    else if (window.navigator.userAgent.toLowerCase().indexOf('chrome') != -1) {
                        // choromeはcrossoriginが必須
                        link_element.setAttribute('crossorigin', 'use-credentials');
                    }
                    link_element.setAttribute('type', 'font/' + this.getFileExtension(url));
                }
            }
            link_element.href = url;
            var that = this;
            if (this.is_enable) {
                link_element.onload = function (event) { that.preloadOnLoad(event, this); };
                link_element.onerror = function (event) { that.preloadOnError(event, this); };
            }
            this.is_defer_executed = false;
            if (this.preload_media[link_element.href] === undefined) {
                document.head.appendChild(link_element);
                this.preloaded_src[link_element.href] = link_element;
            }
            else if (link_element.as === 'style' && (this.using_async_css_load || this.using_defer_css_load)) {
                document.head.appendChild(link_element);
                this.preloaded_src[link_element.href] = link_element;
            }
            else {
                this.preload_media[link_element.href].forEach(function (media, key, origin) {
                    var sub_link_element = document.createElement('link');
                    sub_link_element.media = media;
                    sub_link_element.as = link_element.as;
                    sub_link_element.href = link_element.href;
                    sub_link_element.rel = link_element.rel;
                    sub_link_element.onload = link_element.onload;
                    sub_link_element.onerror = link_element.onerror;
                    if (link_element.type !== undefined && link_element.type) {
                        sub_link_element.type = link_element.type;
                    }
                    if (link_element.crossorigin !== undefined && link_element.crossorigin) {
                        sub_link_element.crossorigin = link_element.crossorigin;
                    }
                    document.head.appendChild(sub_link_element);
                    _this.preloaded_media_src[link_element.href][link_element.media] = sub_link_element;
                });
                this.preloaded_src[link_element.href] = link_element;
            }
        };
        /* ----------------------------------------- */
        /**
         * ロード成功
         *
         * @access      private
         * @param event Event
         * @param self HTMLLinkElement
         * @return void
         */
        Loader.prototype.preloadOnLoad = function (event, self) {
            if (self.as === 'style' && this.using_async_css_load) {
                this.cssAsyncLoad(self);
            }
            if (self.as === 'style' && this.using_defer_css_load) {
                this.cssDeferLoad(self);
            }
            if (this.preload_success) {
                this.preload_success(event, self);
            }
        };
        /* ----------------------------------------- */
        /**
         * ロードエラー
         *
         * @access      private
         * @param event Event
         * @param self HTMLLinkElement
         * @return void
         */
        Loader.prototype.preloadOnError = function (event, self) {
            if (self.as === 'style' && this.using_async_css_load) {
                this.cssAsyncLoad(self);
            }
            if (self.as === 'style' && this.using_defer_css_load) {
                this.cssDeferLoad(self);
            }
            if (this.preload_error) {
                this.preload_error(event, self);
            }
        };
        /* ----------------------------------------- */
        /**
         * 登録されたすべてのSrcのプレフェッチタグを作成
         *
         * @param selector string OPTIONAL: NULL
         * @return void
         */
        Loader.prototype.all = function (selector) {
            var _this = this;
            if (selector === void 0) { selector = null; }
            if (selector !== null) {
                this.setpreloadPointBySelector(selector);
            }
            Object.keys(this.preload_src).forEach(function (url, key, origin) {
                if (_this.preloaded_src[url] === undefined) {
                    if (_this.preload_type[url] === undefined) {
                        _this.createpreload(url);
                    }
                    else {
                        _this.createpreload(url, _this.preload_type[url]);
                    }
                }
            });
        };
        /* ----------------------------------------- */
        /**
         * プレフェッチポイントをCSSセレクタでセットする
         *
         * @param selector string
         * @return void
         */
        Loader.prototype.setpreloadPointBySelector = function (selector) {
            var _this = this;
            Array.prototype.forEach.call(document.querySelectorAll(selector), function (value, index, list) {
                _this.setpreloadSrcByElement(value);
            });
        };
        /* ----------------------------------------- */
        /**
         * urlをプレフェッチに登録する
         *
         * @param url any 登録するsrc
         * @return void
         */
        Loader.prototype.setpreloadPointBySrc = function (src) {
            if ((typeof src) === 'string') {
                this.setpreloadSrcByUrl(src);
                return;
            }
            if (src.url === undefined) {
                return;
            }
            var url = src.url;
            var type = '';
            if (src.type !== undefined) {
                type = src.type;
            }
            this.setpreloadSrcByUrl(url, type);
        };
        /* ----------------------------------------- */
        /**
         * urlをプレフェッチに登録する
         *
         * @param url string 登録するurl
         * @return void
         */
        Loader.prototype.setpreloadSrcByUrl = function (url, type, media) {
            if (type === void 0) { type = ''; }
            if (media === void 0) { media = ''; }
            // 絶対パスに変換して登録する
            url = this.getAbsolutePath(url);
            if (media) {
                if (this.preload_media[url] === undefined) {
                    this.preload_media[url] = [media];
                }
                else {
                    this.preload_media[url][this.preload_media[url].length] = media;
                }
            }
            if (type) {
                this.preload_type[url] = type;
            }
            else {
                this.preload_type[url] = this.detectResourceType(url);
            }
            if (this.preload_src[url] === undefined) {
                this.type_count[this.preload_type[url]]++;
            }
            this.preload_src[url] = url;
        };
        /* ----------------------------------------- */
        /**
         * プレフェッチポイントをElementオブジェクトからセットする
         *
         * @param element Element
         * @return void
         */
        Loader.prototype.setpreloadSrcByElement = function (element) {
            var url = this.getpreloadSrc(element);
            var type = this.getpreloadType(element);
            if (url) {
                this.setpreloadSrcByUrl(url, type);
            }
        };
        /* ----------------------------------------- */
        /**
         * 利用可能かどうか
         *
         * @access      public
         * @var         bool
         */
        Loader.prototype.isEnable = function () {
            var link = document.createElement('link');
            try {
                if (link.relList.supports('preload')) {
                    this.preload_rel = 'preload';
                    return true;
                }
                if (link.relList.supports('prefetch')) {
                    this.preload_rel = 'prefetch';
                    return true;
                }
            }
            catch (e) {
                var ua = window.navigator.userAgent.toLowerCase();
                return ua.indexOf('trident') >= 0 && ua.indexOf('rv:11') >= 0;
            }
            return false;
        };
        /* ----------------------------------------- */
        /**
         * CSSの遅延Load。実行順序は守る
         *
         * @access      private
         * @param link_element Element
         * @return void
         */
        Loader.prototype.cssDeferLoad = function (link_element) {
            if (link_element.getAttribute('as') !== 'style') {
                return;
            }
            this.css_load_count++;
            this.cssDeferExecute();
        };
        /* ----------------------------------------- */
        /**
         * cssDeferLoad時のCSSの遅延実行。
         *
         * @access      private
         * @return void
         */
        Loader.prototype.cssDeferExecute = function () {
            var _this = this;
            if (!this.is_window_onload && this.defer_css_load_is_after_window_onload) {
                // windos.onloadの監視の有無と、windos.onloadしているかどうか
                return;
            }
            if (this.css_load_count < this.type_count.style) {
                // 未だすべてを読み込み終わっていない
                return;
            }
            if (!this.using_defer_css_load) {
                // defer_css_loadを使用しない
                return;
            }
            if (this.is_defer_executed) {
                // 実行済み
                return;
            }
            if (this.using_divide_css_load) {
                var after_element = this.divide_css_load_mount_selector === 'head' ? document.head : document.querySelectorAll(this.divide_css_load_mount_selector)[0];
                Object.keys(this.preloaded_src).forEach(function (url, key, origin) {
                    _this.addCssDivide(url, after_element);
                });
                return;
            }
            Object.keys(this.preloaded_src).forEach(function (url, key, origin) {
                var link_element = _this.preloaded_src[url];
                if (link_element.as === 'style' && link_element.rel === _this.preload_rel) {
                    if (_this.preload_media[link_element.href] !== undefined && _this.preload_media[link_element.href].length === 1) {
                        link_element.media = _this.preload_media[link_element.href][0];
                    }
                    link_element.rel = 'stylesheet';
                }
            });
            this.is_defer_executed = true;
        };
        /* ----------------------------------------- */
        /**
         * cssDivideLoad時のCSSの遅延実行。
         *
         * @access      private
         * @return void
         */
        Loader.prototype.cssDivideExecute = function () {
            var _this = this;
            if (!this.is_window_onload && this.using_divide_css_load) {
                // using_divide_css_loadかどうかと、windos.onloadしているかどうか
                return;
            }
            if (this.is_defer_executed) {
                // 実行済み
                return;
            }
            if (this.using_defer_css_load || this.using_async_css_load) {
                // using_defer_css_loadかusing_async_css_loadが有効
                return;
            }
            var after_element = this.divide_css_load_mount_selector === 'head' ? document.head : document.querySelectorAll(this.divide_css_load_mount_selector)[0];
            Object.keys(this.preloaded_src).forEach(function (url, key, origin) {
                if (_this.preloaded_src[url].as === 'style' && _this.preloaded_src[url].rel === _this.preload_rel) {
                    _this.addCssDivide(url, after_element);
                }
            });
            this.is_defer_executed = true;
        };
        /* ----------------------------------------- */
        Loader.prototype.addCssDivide = function (url, after_element) {
            if (after_element === void 0) { after_element = null; }
            if (after_element === null) {
                after_element = this.divide_css_load_mount_selector === 'head' ? document.head : document.querySelectorAll(this.divide_css_load_mount_selector)[0];
            }
            if (this.preload_media[url] !== undefined) {
                // メディア設定がある場合はすべて書き出す
                this.preload_media[url].forEach(function (media, k, o) {
                    var css_link_element = document.createElement('link');
                    css_link_element.href = url;
                    css_link_element.rel = 'stylesheet';
                    css_link_element.media = media;
                    after_element.appendChild(css_link_element);
                });
            }
            else {
                var css_link_element = document.createElement('link');
                css_link_element.href = url;
                css_link_element.rel = 'stylesheet';
                after_element.appendChild(css_link_element);
            }
        };
        /**
         * CSSの遅延Load。読み込み完了後に実行
         *
         * @access      private
         * @param link_element HTMLLinkElement
         * @return void
         */
        Loader.prototype.cssAsyncLoad = function (link_element) {
            if (link_element.as !== 'style') {
                return;
            }
            if (this.using_divide_css_load) {
                this.addCssDivide(link_element.href);
                return;
            }
            if (this.preload_media[link_element.href] !== undefined && this.preload_media[link_element.href].length === 1) {
                link_element.media = this.preload_media[link_element.href][0];
            }
            link_element.rel = 'stylesheet';
        };
        /* ----------------------------------------- */
        /**
         * プレフェッチ用のリソースタイプを取得する
         *
         * @param element Element
         * @return string
         */
        Loader.prototype.getpreloadType = function (element) {
            var type = element.getAttribute(this.resource_type_attribute_name);
            if (type) {
                return type;
            }
            return '';
        };
        /* ----------------------------------------- */
        /**
         * プレフェッチ用のURLを取得する
         *
         * @param element Element
         * @return string
         */
        Loader.prototype.getpreloadSrc = function (element) {
            var src = element.getAttribute(this.href_attribute_name);
            if (src) {
                return src;
            }
            src = element.getAttribute('href');
            if (src) {
                return src;
            }
            src = element.getAttribute('src');
            if (src) {
                return src;
            }
            return '';
        };
        /* ----------------------------------------- */
        /**
         * パスからリソースタイプを取得する
         *
         * @param url string 調べるurl
         * @return string
         */
        Loader.prototype.detectResourceType = function (url) {
            var ext = this.getFileExtension(url).toLowerCase();
            switch (true) {
                case /js/.test(ext):
                    return 'script';
                case /css/.test(ext):
                    return 'style';
                case /html|htm|xml/.test(ext):
                    return 'document';
                case /otf|ttf|ttc|woff/.test(ext):
                    return 'font';
                case /webp|gif|png|jpg|jpeg|bmp/.test(ext):
                    return 'image';
            }
            return this.default_resource;
        };
        /* ----------------------------------------- */
        /**
         * 絶対パスの取得
         *
         * @param url string 調べるurl
         * @access      private
         * @return string
         */
        Loader.prototype.getAbsolutePath = function (url) {
            var element = document.createElement('a');
            element.href = url;
            return element.href;
        };
        /* ----------------------------------------- */
        /**
         * ドメインを取得する
         *
         * @param url string 調べるurl
         * @access      private
         * @return string
         */
        Loader.prototype.getDomain = function (url) {
            return this.getAbsolutePath(url).split('/')[2];
        };
        /* ----------------------------------------- */
        /**
         * パスから拡張子を取得する
         *
         * @param url string 調べるurl
         * @return string
         */
        Loader.prototype.getFileExtension = function (url) {
            var reg = /(.*)(?:\.([^.]+$))/;
            return reg.test(url) ? url.match(reg)[2] : '';
        };
        /* ----------------------------------------- */
        /**
         * window onLoadイベント
         *
         * @access      private
         * @var         var_type
         */
        Loader.prototype.windosOnLoad = function () {
            this.is_window_onload = true;
            this.cssDeferExecute();
            this.cssDivideExecute();
        };
        return Loader;
    }());
    Prefetch.Loader = Loader;
    var Sequence = (function () {
        /**
         * コンストラクタ
         *
         * @return void
         */
        function Sequence(sequence) {
            if (sequence === void 0) { sequence = {}; }
            var _this = this;
            this.tasks = [];
            this.promises = [];
            this.is_promise = false;
            try {
                var promise = new Promise(function (x, y) { });
                this.is_promise = true;
            }
            catch (e) {
                this.is_promise = false;
            }
            sequence.forEach(function (setting, key) {
                _this.tasks[key] = new Loader(setting);
                if (_this.is_promise) {
                    _this.promises[key] = new Promise(function (resolve, reject) {
                        _this.tasks[key].all();
                    });
                }
            });
        }
        /* ----------------------------------------- */
        /**
         * すべてを並列で実行する
         *
         * @access      public
         * @return void
         */
        Sequence.prototype.allAsync = function () {
            if (this.is_promise) {
                Promise.all(this.promises);
            }
            else {
                this.all();
            }
        };
        /* ----------------------------------------- */
        /**
         * すべてを順番に実行する
         *
         * @access      public
         * @return void
         */
        Sequence.prototype.all = function () {
            var _this = this;
            this.tasks.forEach(function (setting, key) {
                _this.tasks[key].all();
            });
        };
        return Sequence;
    }());
    Prefetch.Sequence = Sequence;
})(Prefetch || (Prefetch = {}));
var PrefetchSequence = Prefetch.Sequence;
var PrefetchLoader = Prefetch.Loader;
