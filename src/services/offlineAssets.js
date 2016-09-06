'use strict';

function offlineAssetsService(offlineAssetsFsService, work, $q, $log, $http) { 'ngInject';
  var fs = offlineAssetsFsService;

  // Realiza el llamado de una lista de callbacks pasando por parametro una url
  function resolvedUrl(item, url){
    item.$resolvedUrl = url + '?' + item.$version++;
    item.$cbs = item.$cbs || [];
    angular.forEach(item.$cbs, function (cb) {
      if(cb) cb(item.$resolvedUrl);
    });
  }

  var dest = null;

  var getFileNameTo = function (url) {

    return []
      .concat((fs.getDest() || '/').split('/'))
      .concat(dest || [])
      .concat(url.host.split(':'))
      .concat(url.pathname.split('/'))
      .filter(function (valor) {
        return (valor || '').trim() != '';
      })
      .join('/');

  };
  
  // Lista de descargas
  var queue = new work(function (idx, item, next) {
    var pathfile = getFileNameTo(item.$url);
    fs.download(item.$url, pathfile).then(function (fileEntry) {
      $log.log(['downloaded:',item.$url].join(''));
      resolvedUrl(item, fileEntry.toURL());
      next();
    })
    .catch(function (err) {
      $log.error([idx, err]);
      next();
    });
  });


  // Funciona para inicar la descarga de un archivo
  function download (url, cb) {
    // $log.log(['download:', url].join(''));

    // Obtener elemento correspondiente a la URL
    var item = queue.get(url);

    // No existe un elemento para la URL
    if (!item) {

      // Crear el elemento
      item = {};
      item.$version = 1;
      item.$url = new URL(url);
      item.$cbs = []; // Lista de callbacks del elemento
        
      function addToQueue () {
        // Agregar al archivo de descargas
        queue.add(url, item);
        // Si no se ha iniciado la descargar iniciarla al terminar la carga
        // del FS.
        if (!queue.started()) {
          queue.start();
          queue.next();
        }
      }

      fs.ready().then(function () {

        var pathfile = getFileNameTo(item.$url);

        // Obtener la instancia del archivo
        fs.getFile(pathfile).then(function (ff) {
          resolvedUrl(item, ff.fileEntry.toURL());

          // Obtener las cabeceras del archivo
          $http.head(url).then(function (res) {
            var isUpdate = (!res.headers('content-length') || ff.file.size == parseInt(res.headers('content-length'))) &&
              (!res.headers('last-modified') || ff.file.lastModifiedDate > new Date(res.headers('last-modified')));
            
            if (!isUpdate) {
              addToQueue();
            }

          });

        })

        // Si no existe el archivo
        .catch(addToQueue);
        
      });

    } else if (item.$resolvedUrl){
      cb(item.$resolvedUrl);
    }

    // Agregar el cb recibido por parámetro a la lista de callbacks
    item.$cbs.push(cb);

  }

  // Remueve un cb
  function release (url, cb) {

    var item = queue.get(url);
    if (item) {
      var idx = item.$cbs.indexOf(cb);
      if (idx != -1) item.$cbs.splice(idx, 1);
    }

  }

  // Asigna el directorio destino para los archivos
  function setDest (pDest) {

    dest = pDest;

  }

  return {
    download : download,
    release : release,
    setDir: setDest,
  };

}

import { _name as offlineAssetsFs } from './offlineAssetsFs';
import { _name as work } from './work';

export var _name = 'offlineAssets';
export default angular.module(_name, [
  offlineAssetsFs,
  work
])
  .factory([_name, 'Service'].join(''), offlineAssetsService);