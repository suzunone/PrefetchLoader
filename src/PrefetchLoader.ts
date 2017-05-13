/*! PrefetchLoader v1.0.0 | (c) Suzunone | BSD 2-Clause License */

// エラー防止
interface HTMLLinkElement
{
    as: string;
    crossorigin: string;
    relList: any;
}

namespace Prefetch
{
    export class Loader
    {
        /**
         * link hrefにセットする値が格納されている、要素名
         *
         * @var         string
         */
        private href_attribute_name: string  = 'pre-href';

        /**
         * link asにセットする値が格納されている、要素名
         *
         * @var         string
         */
        private resource_type_attribute_name: string  = 'pre-as';

        /**
         * リソースタイプ自動取得時のデフォルト値
         *
         * @var         string
         */
        private default_resource: string = 'document';

        /**
         * preload 成功時のcallback
         *
         * @var         callback
         */
        private preload_success: any = null;


        /**
         * preload 失敗時のcallback
         *
         * @var         callback
         */
        private preload_error: any = null;


        /**
         * preload 済みのリスト
         *
         * @access      private
         * @var         var_type
         */
        private preloaded_src : any  = {};

        /**
         * preload 済みのリスト
         *
         * @access      private
         * @var         var_type
         */
        private preloaded_media_src : any  = {};

        /**
         * preload リスト
         *
         * @access      private
         * @var         var_type
         */
        private preload_src : any  = {};

        /**
         * preload リソースタイプ リスト
         *
         * @access      private
         * @var         var_type
         */
        private preload_type : any  = {};

        /**
         * preload メディア リスト
         *
         * @access      private
         * @var         var_type
         */
        private preload_media : any  = {};


        /**
         * CSSのasync読み込みを行う
         *
         * @access      private
         * @var         var_type
         */
        private using_async_css_load = false;

        /**
         * CSSのdefer読み込みを行う
         *
         * @access      private
         * @var         var_type
         */
        private using_defer_css_load = false;


        /**
         * preloadはヘッダに、実際のCSS使用場所は別に指定する
         *
         * @access      private
         * @var         var_type
         */
        private using_divide_css_load = false;

        /**
         * using_divide_css_load時に埋め込むタグのID
         *
         * @access      private
         * @var         var_type
         */
        private divide_css_load_mount_selector = 'head';


        /**
         * CSSのdefer読み込み時、実行はwindow.onload以降に行う
         *
         * @access      private
         * @var         var_type
         */
        private defer_css_load_is_after_window_onload = false;

        private preload_rel : string  = 'preload';

        private is_enable: boolean = true;
        private type_count =  {
            audio: 0,
            document: 0,
            font: 0,
            image: 0,
            script: 0,
            style: 0,
            track: 0,
            video: 0
        };

        private css_load_count : number = 0;

        private is_window_onload: boolean = true;

        private is_defer_executed: boolean = false;


        /**
         * コンストラクタ
         *
         * @return void
         */
        constructor(setting: any = {})
        {
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
                setting.urls.forEach((src : any, key : string, list : any) => {
                    this.setpreloadPointBySrc(src);
                });
            }

            if (setting.selector !== undefined) {
                this.setpreloadPointBySelector(setting.selector);
            }

            this.is_enable = this.isEnable();

            var raf = (<any>window).requestAnimationFrame || (<any>window).mozRequestAnimationFrame || (<any>window).webkitRequestAnimationFrame || (<any>window).msRequestAnimationFrame;

            if (raf) {
                raf(()=>{
                    this.windosOnLoad();
                });
            } else {
                window.addEventListener('load', ()=>{
                    this.windosOnLoad();
                }, false );
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
        public createpreload(url: string, as_type: string = '') : void
        {
            var link_element   = document.createElement('link');

            link_element.rel   = this.preload_rel;

            as_type    = as_type || this.detectResourceType(url);

            if (!this.is_enable) {
                if (as_type === 'style' && (this.using_async_css_load || this.using_defer_css_load)) {
                    // preloadが使用できない場合は、cssとする
                    link_element.rel = 'stylesheet';
                }
            }

            try{
                link_element.as = as_type;
            } catch (e) {
                link_element.setAttribute('as', as_type);
            }

            if (as_type === 'font') {
                try{
                    // fontはドメインを調べてcrossoriginを付与
                    if (this.getDomain(url) !== this.getDomain(location.href)) {
                        link_element.crossorigin = 'use-credentials';
                    } else if (window.navigator.userAgent.toLowerCase().indexOf('chrome') != -1) {
                        // choromeはcrossoriginが必須
                        link_element.crossorigin = 'use-credentials';
                    }
                    // typeを付与
                    link_element.type = 'font/' + this.getFileExtension(url);
                } catch (e) {
                    if (this.getDomain(url) !== this.getDomain(location.href)) {
                        link_element.setAttribute('crossorigin', 'use-credentials');
                    } else if (window.navigator.userAgent.toLowerCase().indexOf('chrome') != -1) {
                        // choromeはcrossoriginが必須
                        link_element.setAttribute('crossorigin', 'use-credentials');
                    }
                    link_element.setAttribute('type', 'font/' + this.getFileExtension(url));
                }
            }

            link_element.href  = url;

            var that = this;

            if (this.is_enable) {
                link_element.onload = function (event){that.preloadOnLoad(event, <HTMLLinkElement>this);};
                link_element.onerror = function (event){that.preloadOnError(event, <HTMLLinkElement>this);};
            }

            this.is_defer_executed = false;

            if (this.preload_media[link_element.href] === undefined) {
                document.head.appendChild(link_element);
                this.preloaded_src[link_element.href] = link_element;
            } else if (link_element.as === 'style' && (this.using_async_css_load || this.using_defer_css_load)) {
                document.head.appendChild(link_element);
                this.preloaded_src[link_element.href] = link_element;
            } else {
                this.preload_media[link_element.href].forEach((media : string, key : string, origin : any) => {
                    var sub_link_element   = document.createElement('link');
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
                    this.preloaded_media_src[link_element.href][link_element.media] = sub_link_element;
                });

                this.preloaded_src[link_element.href] = link_element;
            }

        }
        /* ----------------------------------------- */


        /**
         * ロード成功
         *
         * @access      private
         * @param event Event
         * @param self HTMLLinkElement
         * @return void
         */
        private preloadOnLoad(event : Event, self : HTMLLinkElement) : void
        {
            if (self.as === 'style' && this.using_async_css_load) {
                this.cssAsyncLoad(self);
            }
            if (self.as === 'style' && this.using_defer_css_load) {
                this.cssDeferLoad(self);
            }

            if (this.preload_success) {
                this.preload_success(event, self);
            }
        }
        /* ----------------------------------------- */

        /**
         * ロードエラー
         *
         * @access      private
         * @param event Event
         * @param self HTMLLinkElement
         * @return void
         */
        private preloadOnError(event : Event, self : HTMLLinkElement) : void
        {
            if (self.as === 'style' && this.using_async_css_load) {
                this.cssAsyncLoad(self);
            }
            if (self.as === 'style' && this.using_defer_css_load) {
                this.cssDeferLoad(self);
            }
            if (this.preload_error) {
                this.preload_error(event, self);
            }
        }
        /* ----------------------------------------- */

        /**
         * 登録されたすべてのSrcのプレフェッチタグを作成
         *
         * @param selector string OPTIONAL: NULL
         * @return void
         */
        public all(selector: string = null) : void
        {
            if (selector !== null) {
                this.setpreloadPointBySelector(selector);
            }

            Object.keys(this.preload_src).forEach((url, key, origin) => {
                if (this.preloaded_src[url] === undefined) {
                    if (this.preload_type[url] === undefined) {
                        this.createpreload(url);
                    } else {
                        this.createpreload(url, this.preload_type[url]);
                    }
                }
            });
        }
        /* ----------------------------------------- */


        /**
         * プレフェッチポイントをCSSセレクタでセットする
         *
         * @param selector string
         * @return void
         */
        public setpreloadPointBySelector(selector: string) : void
        {
            Array.prototype.forEach.call(document.querySelectorAll(selector),
                (value : any , index : string, list : any) => {
                    this.setpreloadSrcByElement(value);
                }
            );
        }
        /* ----------------------------------------- */

        /**
         * urlをプレフェッチに登録する
         *
         * @param url any 登録するsrc
         * @return void
         */
        public setpreloadPointBySrc(src: any) : void
        {
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
        }
        /* ----------------------------------------- */


        /**
         * urlをプレフェッチに登録する
         *
         * @param url string 登録するurl
         * @return void
         */
        public setpreloadSrcByUrl(url: string, type: string = '', media = '') : void
        {
            // 絶対パスに変換して登録する
            url = this.getAbsolutePath(url);

            if (media) {
                if (this.preload_media[url] === undefined) {
                    this.preload_media[url] = [media]
                } else {
                    this.preload_media[url][this.preload_media[url].length] = media;
                }
            }

            if (type) {
                this.preload_type[url] = type;
            } else {
                this.preload_type[url] = this.detectResourceType(url);
            }

            if (this.preload_src[url] === undefined) {
                this.type_count[<string>this.preload_type[url]]++;
            }

            this.preload_src[url] = url;
        }
        /* ----------------------------------------- */

        /**
         * プレフェッチポイントをElementオブジェクトからセットする
         *
         * @param element Element
         * @return void
         */
        public setpreloadSrcByElement(element: Element) : void
        {
            var url = this.getpreloadSrc(element);
            var type = this.getpreloadType(element);

            if (url) {
                this.setpreloadSrcByUrl(url, type);
            }
        }
        /* ----------------------------------------- */

        /**
         * 利用可能かどうか
         *
         * @access      public
         * @var         bool
         */
        public isEnable()
        {
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
            } catch (e) {
                var ua = window.navigator.userAgent.toLowerCase();
                return ua.indexOf('trident') >= 0 && ua.indexOf('rv:11') >= 0;
            }
            return false;
        }
        /* ----------------------------------------- */

        /**
         * CSSの遅延Load。実行順序は守る
         *
         * @access      private
         * @param link_element Element
         * @return void
         */
        private cssDeferLoad(link_element: Element) : void
        {
            if (link_element.getAttribute('as') !== 'style') {
                return;
            }
            this.css_load_count++;
            this.cssDeferExecute();
        }
        /* ----------------------------------------- */

        /**
         * cssDeferLoad時のCSSの遅延実行。
         *
         * @access      private
         * @return void
         */
        private cssDeferExecute() : void
        {
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
                Object.keys(this.preloaded_src).forEach((url, key, origin) => {
                    this.addCssDivide(url, after_element);
                });
                return;
            }



            Object.keys(this.preloaded_src).forEach((url, key, origin) => {
               var link_element = this.preloaded_src[url];
                if (link_element.as === 'style' && link_element.rel === this.preload_rel) {
                    if (this.preload_media[link_element.href] !== undefined && this.preload_media[link_element.href].length === 1) {
                        link_element.media = this.preload_media[link_element.href][0];
                    }

                    link_element.rel = 'stylesheet';
                }
            });
            this.is_defer_executed = true;
        }
        /* ----------------------------------------- */

        /**
         * cssDivideLoad時のCSSの遅延実行。
         *
         * @access      private
         * @return void
         */
        private cssDivideExecute() : void
        {
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

            Object.keys(this.preloaded_src).forEach((url, key, origin) => {
                if (this.preloaded_src[url].as === 'style' && this.preloaded_src[url].rel === this.preload_rel) {
                    this.addCssDivide(url, after_element);
                }
            });
            this.is_defer_executed = true;
        }
        /* ----------------------------------------- */

        private addCssDivide(url: string, after_element: Element = null)
        {
            if (after_element === null) {
                after_element = this.divide_css_load_mount_selector === 'head' ? document.head : document.querySelectorAll(this.divide_css_load_mount_selector)[0];
            }

            if (this.preload_media[url] !== undefined) {
                // メディア設定がある場合はすべて書き出す
                this.preload_media[url].forEach((media, k, o) => {
                    var css_link_element = document.createElement('link');
                    css_link_element.href  = url;
                    css_link_element.rel = 'stylesheet';
                    css_link_element.media = media;
                    after_element.appendChild(css_link_element);

                });
            } else {
                var css_link_element = document.createElement('link');
                css_link_element.href  = url;
                css_link_element.rel = 'stylesheet';
                after_element.appendChild(css_link_element);
            }
        }

        /**
         * CSSの遅延Load。読み込み完了後に実行
         *
         * @access      private
         * @param link_element HTMLLinkElement
         * @return void
         */
        private cssAsyncLoad(link_element: HTMLLinkElement) : void
        {
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
        }
        /* ----------------------------------------- */


        /**
         * プレフェッチ用のリソースタイプを取得する
         *
         * @param element Element
         * @return string
         */
        private getpreloadType(element: Element) : string
        {
            var type = element.getAttribute(this.resource_type_attribute_name);
            if (type) {
                return type;
            }
            return '';
        }
        /* ----------------------------------------- */


        /**
         * プレフェッチ用のURLを取得する
         *
         * @param element Element
         * @return string
         */
        private getpreloadSrc(element: Element) : string
        {
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
        }
        /* ----------------------------------------- */

        /**
         * パスからリソースタイプを取得する
         *
         * @param url string 調べるurl
         * @return string
         */
        private detectResourceType(url) : string
        {
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
        }
        /* ----------------------------------------- */

        /**
         * 絶対パスの取得
         *
         * @param url string 調べるurl
         * @access      private
         * @return string
         */
        private getAbsolutePath(url)
        {
            var element = document.createElement('a');
            element.href = url;
            return element.href;
        }
        /* ----------------------------------------- */

        /**
         * ドメインを取得する
         *
         * @param url string 調べるurl
         * @access      private
         * @return string
         */
        private getDomain(url)
        {
            return this.getAbsolutePath(url).split('/')[2];
        }
        /* ----------------------------------------- */

        /**
         * パスから拡張子を取得する
         *
         * @param url string 調べるurl
         * @return string
         */
        private getFileExtension(url) : string
        {
            var reg=/(.*)(?:\.([^.]+$))/;

            return reg.test(url) ? url.match(reg)[2] : '';
        }
        /* ----------------------------------------- */

        /**
         * window onLoadイベント
         *
         * @access      private
         * @var         var_type
         */
        private windosOnLoad()
        {
            this.is_window_onload = true;
            this.cssDeferExecute();
            this.cssDivideExecute();
        }
        /* ----------------------------------------- */
    }


    export class Sequence
    {
        private tasks: any = [];
        private promises: any = [];
        private is_promise: boolean = false;

        /**
         * コンストラクタ
         *
         * @return void
         */
        constructor(sequence: any = {})
        {
            try {
                var promise = new Promise(function (x, y) {});
                this.is_promise = true;
            } catch (e) {
                this.is_promise = false;
            }

            sequence.forEach((setting, key) => {
                this.tasks[key] = new Loader(setting);
                if (this.is_promise) {
                    this.promises[key] = new Promise((resolve, reject) => {
                        this.tasks[key].all();
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
        public allAsync()
        {
            if (this.is_promise) {
                Promise.all(this.promises);
            } else {
                this.all();
            }
        }
        /* ----------------------------------------- */

        /**
         * すべてを順番に実行する
         *
         * @access      public
         * @return void
         */
        public all()
        {
            this.tasks.forEach((setting, key) => {
                this.tasks[key].all();
            });
        }
        /* ----------------------------------------- */
    }
}
import PrefetchSequence = Prefetch.Sequence;
import PrefetchLoader = Prefetch.Loader;

