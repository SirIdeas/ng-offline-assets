# ng-offline-assets

Easy to use bower package to use assets files offline, downloading these into local file system with the HTML5 api.

## Dependencies

* AngularJS

## Installation

Bower:

```
$ bower install angular-toastr
```

Or you can download the package [here](https://codeload.github.com/SirIdeas/ng-offline-assets/zip/master).

Add javascript file to html file, for example:

```html
<script src="ng-offline-assets/ng-offline-assets.js"></script>
```

Finally you must add `ngOfflineAssets` to your module dependencies:

```javascript
angular.module('app', ['ngOfflineAssets'])
```

## Usage

You can use the directives `oa-bg` and `oa-src` to sync images into filesystem and to access them in offline way.

#### Absolute URL
```html
<!-- Save imagen in /sirideas.github.io/ng-offline-assets/assets/sirideas.png -->
<img oa-src="'http://sirideas.github.io/ng-offline-assets/assets/sirideas.png'">
```

#### Relative URL
```html
<!-- Save imagen in /<HOST>/<PORT>/assets/sirideas.png -->
<dvi oa-bg="'assets/sirideas.png'">
```

## Licence
Released under [the MIT license](https://github.com/SirIdeas/ng-offline-assets/blob/master/LICENSE)

## Changelog

### V0.0.1
* First release
* Directives `oa-bg` and `oa-src`
* Service `offlineAssets` with the main uses.

