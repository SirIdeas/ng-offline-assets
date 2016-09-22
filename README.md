# ng-offline-assets

## Installation

## Dependencies

* AngularJS

Use bower:

```
$ bower install angular-toastr
```

Or you can download the package and add javascript file:

```html
<script type="text/javascript" src="angular-toastr.tpls.js"></script>
```

Finally you must add `ngOfflineAssets` to your module dependencies:

```javascript
angular.module('app', ['ngOfflineAssets'])
```

## Usage

You can use the directives `oa-bg` and `oa-src` to sync images into filesystem and to access them in offline way.

```html
<img oa-src="http://localhost:3000/assets/sirideas.png">

<!-- Save imagen in /localhost/3000/assets/sirideas.png and generate: -->
<img oa-src="http://localhost:3000/assets/sirideas.png"
  src="filesystem:http:/localhost:3000/persistent/localhost/3100/assets/sirideas.png">
```

## Licence
Released under [the MIT license](https://github.com/SirIdeas/ng-offline-assets/blob/master/LICENSE)

## Changelog

### V0.0.1
* First release
* Directives `oa-bg` and `oa-src`
* Service `offlineAssets` with the main uses.

