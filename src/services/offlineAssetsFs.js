'use strict';

function offlineAssetsFsService($q, $log){ 'ngInject';
  
  //////////////////////////////////////////////////////////////////////////////
  // Attributos globales
  var attrs = {
    // Tamaño del bloque de memoria q se ira pidiendo cada vez que se sobre pase
    // la cuota de almacenamiento
    blockSize: 16 * 1014 * 1024,

    // Espacio de la cuota de almacenamiento
    dest:  'oa/',

  };

  // Instancia del manejador del file system
  var fs = null;

  // Defarredes
  var apiLoadedDeferred = $q.defer();
  var quotaInfoDeferred = $q.defer();
  var readyDeferred = $q.all([
    apiLoadedDeferred.promise,
    quotaInfoDeferred.promise
  ]);
  
  // API HTML5 para manejo de archivos
  var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
  var pStorage = navigator.webkitPersistentStorage || {
    requestQuota: function(){},
    queryUsageAndQuota: function(){},
  };

  // Load action when loaded fileSystem
  if (typeof cordova !== 'undefined') {
    $log.log('cordova on');
    document.addEventListener('deviceready', function() {
      $log.log('devideready');
      requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(){
        $log.log('requestFileSystem');

        attrs.dest = cordova.file.externalDataDirectory || cordova.file.dataDirectory;

        apiLoadedDeferred.resolve();
        quotaInfoDeferred.resolve(-1,-1);
      }, function (err) {
        apiLoadedDeferred.reject(err);
        quotaInfoDeferred.reject(err);
      });
    }, false);

  } else {
    $log.log('cordova off');
    pStorage.queryUsageAndQuota(function(used, granted){
      $log.log(['queryUsageAndQuota:', used, ', ', granted].join(''));
      attrs.currentQuota = granted;
      attrs.currentUsage = used;
      quotaInfoDeferred.resolve(used, granted);
    }, function (err) {
      quotaInfoDeferred.reject(err);
    });

    requestFileSystem(window.PERSISTENT, 0, function(pFs){
      $log.log('requestFileSystem');
      fs = pFs;
      apiLoadedDeferred.resolve();
    }, function (err) {
      apiLoadedDeferred.reject(err);
    });

  }

  readyDeferred.then(function(){
    $log.log('ready');
  }).catch($log.error);

  function ready(fn) {
    if(!fn) return readyDeferred;
    return function () {
      var deferred = $q.defer();
      var args = [];
      angular.forEach(arguments, function (valor) {
        args.push(valor);
      });
      args.unshift(deferred);
      readyDeferred.then(function () {
        fn.apply(fn, args);
      });

      return deferred.promise;
    }
  }

  /**
   * Call to resolve local file system
   * - pathfile: File URL to get
   */
  var getFileEntry = ready(function(deferred, pathfile) {
    $log.log(['getFileEntry:', pathfile].join(''));

    // If can't check if file exists then call success directly
    if (window.resolveLocalFileSystemURL) {
      window.resolveLocalFileSystemURL(pathfile,
        function(fileEntry){
          deferred.resolve(fileEntry);
        }, function(err){
          deferred.reject(err);
        });
    } else if (fs) {
      fs.root.getFile(pathfile, {create: false},
        function(fileEntry){
          deferred.resolve(fileEntry);
        }, function(err){
          deferred.reject(err);
        });
    } else {
      deferred.reject({
        code: 0,
        name: 'NotInstanceToGetFileEntry',
        message: 'No handler instance to get file entry instance'
      });
    }

  });

  /**
   * Get instance if File(cordova) of physycal file
   * - pathfile: URL to download
   */
  var getFile = ready(function(deferred, pathfile) {
    $log.log(['getFile:', pathfile].join(''));
    
    // Check if file exist.
    getFileEntry(pathfile).then(function (fileEntry){
      fileEntry.file(function(file){
        deferred.resolve(file);
      }, function(err){
        deferred.reject(err);
      });
    })
    .catch(function (err) {
      deferred.reject(err);
    });

  });

  return {
    ready: ready,
    getFileEntry : getFileEntry,
    getFile : getFile
  };

}

export var _name = 'offlineAssetsFs';
export default angular.module(_name, [])
  .factory([_name, 'Service'].join(''), offlineAssetsFsService);