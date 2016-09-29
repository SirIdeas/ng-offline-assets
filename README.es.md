# ng-offline-assets

Paquete Bower para usar archivos assets de forma offline descargando estos en el sistema de archivos local mediante la [Api para Archivos de HTML5](https://dev.w3.org/2009/dap/file-system/file-dir-sys.html).

## Demo
[Demo](https://sirideas.github.io/ng-offline-assets)

## Dependencias

* AngularJS

## Instalación

Bower:

```
$ bower install ng-offline-assets
```

O puedes descargar el paquete [aquí](https://codeload.github.com/SirIdeas/ng-offline-assets/zip/master).

Agrega el archivo javascript al html, por ejemplo:

```html
<script src="ng-offline-assets/ng-offline-assets.js"></script>
```

Finalmente, debes agregar `ngOfflineAssets` a tu módulo de dependencias:

```javascript
angular.module('app', ['ngOfflineAssets'])
```

## Uso

Puedes usar las directivas `oa-bg` y `oa-src` para sincronizar imáges en el sistema de archivos y acceder a ellos de forma offline.

#### URL Absoluta
```html
<!-- Guarda la imagen en /sirideas.github.io/ng-offline-assets/assets/sirideas.png -->
<img oa-src="'http://sirideas.github.io/ng-offline-assets/assets/sirideas.png'">
```

#### Relative URL
```html
<!-- Guarda la imagen en /<HOST>/<PORT>/assets/sirideas.png -->
<dvi oa-bg="'assets/sirideas.png'">
```

## Versiones del README
[Inglés](README.md)
[Español](README.es.md)

## Licencia
Liberado bajo [la licencia MIT](https://github.com/SirIdeas/ng-offline-assets/blob/master/LICENSE)

## Log de cambios

### V0.0.1
* Primera liberación
* Directivas `oa-bg` y `oa-src`
* Servicio `offlineAssets` con los usos principales.