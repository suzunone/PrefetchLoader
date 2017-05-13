# PrefetchLoader
Read static content (CSS / JavaScript / Image) as Async or Defer

## Example

````
(function () {
var prefetch = new PrefetchSequence(
[
    {
        urls: [
            '//netdna.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css',
            '//netdna.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap-theme.min.css',
            '//cdnjs.cloudflare.com/ajax/libs/bootstrap-switch/3.3.4/css/bootstrap3/bootstrap-switch.min.css',
        ],
        default_resource: 'style',
        using_defer_css_load: true
    },
    {
        urls: [
            '//maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css',
            '//cdn.jsdelivr.net/sweetalert2/6.6.2/sweetalert2.min.css',
        ],
        default_resource: 'style',
        using_async_css_load: true
    },
    {
        urls: [
            '//cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js',
            '//netdna.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js',
            '//cdnjs.cloudflare.com/ajax/libs/bootstrap-switch/3.3.4/js/bootstrap-switch.min.js',
            '//cdn.jsdelivr.net/sweetalert2/6.6.2/sweetalert2.min.js'
        ],
        default_resource: 'script',
    },
    {
        urls: [
            '//cdnjs.cloudflare.com/ajax/libs/riot/3.3.2/riot.min.js',
        ],
        default_resource: 'script',
    }
]


);
prefetch.allAsync();


}());


window.addEventListener( 'load', function(){
    var prefetch = new PrefetchLoader({
        href_attribute_name:'data-src'
    });
    prefetch.all('img[data-src]');


}, false );


````