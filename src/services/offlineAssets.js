'use strict';

function offlineAssetsService(offlineAssetsFsService, $q, $log, $http){ 'ngInject';
  var fs = offlineAssetsFsService
  // Lista de descargas
  var items = {};
  var queue = [];
  var isDownloading = false;

  function dequeued () {
    isDownloading = !!queue.length;
    if (!isDownloading) return;
    var idx = queue.shift();
    var item = items[idx];

    fs.getFile(item.$pathfile).then(function (file) {
      $log.log([file, item]);
    })

    .catch(function (err) {

      // var url = new URL('http://localhost:3000/_file');
      // url.searchParams.append('url', encodeURIComponent(item.$url));
      // var urlGet = url.toString();
      // url.searchParams.append('head', 1);
      // var urlHead = url.toString();

      // console.log(urlGet);
      // console.log(urlHead);

      var url = item.$url.toString();

      $http.head(url).then(function (res) {
        window.a = res.headers;
        console.log([
          parseInt(res.headers('content-length')),
          new Date(res.headers('last-modified')),
          res.headers(),
        ]);
      });

    });
    
  }

  // Funciona para inicar la descarga de un archivo
  function download (url){
    // $log.log(['download:', url].join(''));

    if (!items[url]) {
      
      queue.push(url);
      items[url] = {};

      var url = items[url].$url = new URL(url);
      var deferred = items[url].$deferred = $q.defer();

      items[url].$promise = deferred.promise;
      items[url].$pathfile = url.host.split(':').concat(url.pathname.split('/')).join('/');

      // Iniciar descarga
      if (!isDownloading) {
        isDownloading = true;
        fs.ready().then(dequeued);
      }

    }

    // Retornar el item
    return items[url];

  }

  return {
    download : download
  };

}

import { _name as offlineAssetsFs } from './offlineAssetsFs';

export var _name = 'offlineAssets';
export default angular.module(_name, [
  offlineAssetsFs
])
  .factory([_name, 'Service'].join(''), offlineAssetsService);