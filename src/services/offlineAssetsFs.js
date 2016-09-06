'use strict';

function offlineAssetsFsService($q, $log) { 'ngInject';
  
  //////////////////////////////////////////////////////////////////////////////
  // Attributos globales
  var attrs = {
    // Tamaño del bloque de memoria q se ira pidiendo cada vez que se sobre pase
    // la cuota de almacenamiento
    blockSize: 16 * 1014 * 1024,

    // Espacio de la cuota de almacenamiento
    currentQuota: 0,

    // Espacio usado de la cuota de almacenamiento
    currentUsage: 0,

    // Espacio de la cuota de almacenamiento
    dest:  '',

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
    requestQuota: function() {},
    queryUsageAndQuota: function() {},
  };

  // Load action when loaded fileSystem
  if (typeof cordova !== 'undefined') {
    $log.log('cordova on');
    document.addEventListener('deviceready', function() {
      $log.log('devideready');
      requestFileSystem(LocalFileSystem.PERSISTENT, 0, function() {
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
    pStorage.queryUsageAndQuota(function(used, granted) {
      $log.log(['queryUsageAndQuota:', used, ', ', granted].join(''));
      attrs.currentQuota = granted;
      attrs.currentUsage = used;
      quotaInfoDeferred.resolve(used, granted);
    }, function (err) {
      quotaInfoDeferred.reject(err);
    });

    requestFileSystem(window.PERSISTENT, 0, function(pFs) {
      $log.log('requestFileSystem');
      fs = pFs;
      apiLoadedDeferred.resolve();
    }, function (err) {
      apiLoadedDeferred.reject(err);
    });

  }

  readyDeferred.then(function() {
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
  var getFileEntry = ready(function(deferred, pathfile, create) {
    // $log.log(['getFileEntry:', pathfile].join(''));

    // If can't check if file exists then call success directly
    if (window.resolveLocalFileSystemURL) {
      window.resolveLocalFileSystemURL(pathfile,
        function(fileEntry) {
          deferred.resolve(fileEntry);
        }, function(err) {
          deferred.reject(err);
        });
    } else if (fs) {
      fs.root.getFile(pathfile, {create: !!create},
        function(fileEntry) {
          deferred.resolve(fileEntry);
        }, function(err) {
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
    // $log.log(['getFile:', pathfile].join(''));
    
    // Check if file exist.
    getFileEntry(pathfile).then(function (fileEntry) {
      fileEntry.file(function(file) {
        deferred.resolve({
          fileEntry: fileEntry,
          file: file
        });
      }, function(err) {
        deferred.reject(err);
      });
    })
    .catch(function (err) {
      deferred.reject(err);
    });

  });

  // Indicate if any quota request was be rejected
  var anyQuotaRequestReject = false;

  /**
   * Solicitar espacio de almacenamiento
   */
  function requestStorageQuota (requiredBytes) {

    var deferred = $q.defer();
    var quotaRequestRejectedError = function() {
      return { code: 0, name: 'QuotaRequestRejected' }
    };

    if(anyQuotaRequestReject) {
      deferred.reject(quotaRequestRejectedError());

    }else{

      if(!requiredBytes) {
        requiredBytes = 0;
      }

      requiredBytes = attrs.currentQuota + Math.max(requiredBytes, attrs.blockSize);

      pStorage.requestQuota(requiredBytes,
        function(bytesGranted) {
          if(!bytesGranted) {
            // log(['requestQuotaReject']);
            anyQuotaRequestReject = true;
            deferred.reject(quotaRequestRejectedError());
          }else{
            // log(['requestQuotaGranted', bytesGranted]);
            attrs.currentQuota = bytesGranted;
            deferred.resolve(bytesGranted);
          }
        }, function(err) {
          deferred.reject(err);
        }
      );

    }

    return deferred.promise;

  };

  /**
   * Solicita mas bytes si es necesario
   */
  function requestStorageQuotaIfRequired (neededBytes) {

    var deferred = $q.defer();

    var missingBytes = attrs.currentUsage + neededBytes - attrs.currentQuota;

    if(missingBytes > 0) {
      requestStorageQuota(missingBytes + 10 * 1024)
        .then(function(bytesGranted) {
          deferred.resolve();
        }, function(e) {
          deferred.reject(e);
        });
    }else{
      deferred.resolve();
    }

    return deferred.promise;
  }

  /**
   * Crear un directorio
   */
  function mkdir (dir) {

    var deferred = $q.defer();

    var dirs = dir.split('/');

    var _mkdir = function(folders, rootDirEntry) {
      if (folders[0] == '.' || folders[0] == '') {
        folders = folders.slice(1);
      }

      if (!folders.length) {
        deferred.resolve();
        return;
      }

      rootDirEntry.getDirectory(folders[0], {create: true}, function(dirEntry) {
        _mkdir(folders.slice(1), dirEntry);
      }, deferred.reject);

    };

    _mkdir(dirs, fs.root);

    return deferred.promise;

  }

  /**
   * Call API to download file
   * - fromUrl: External URL of fila
   * - localUrl: File URL to get
   */
  function download(fromUrl, localUrl) {
    // $log.log(['callDownloadFile:', fromUrl, localUrl].join(' '));

    var deferred = $q.defer();

    function customErrorHandler (err) {
      if(err.name === 'QuotaExceededError') {
        requestStorageQuota()
          .then(customDownloadFile, deferred.reject);
      }else{
        deferred.reject(err);
      }
    }

    function customDownloadFile () {

      var dirs = localUrl.split('/');
      var fileName = dirs.pop();

      // Crear Directorio
      $q.when().then(function () {
        return mkdir(dirs.join('/'));

      }, customErrorHandler)

      // Obtener el fileEntry
      .then(function () {
        return getFileEntry(localUrl, true);

      }, customErrorHandler)

      // Obtener la instancia del writer para el archivo
      .then(function (fileEntry) {
        if (!fileEntry) return;
        
        var localDeferred = $q.defer();
        fileEntry.createWriter(function (writer) {

          writer.onwriteend = function() {
            deferred.resolve(fileEntry);
          };

          writer.onerror = customErrorHandler;

          localDeferred.resolve(writer);

        }, localDeferred.reject);
        return localDeferred.promise;

      }, customErrorHandler)

      // Obtener el archivo por AJAX y escribir en el archivo
      .then(function (writer) {
        if (!writer) return;

        var xhr = new XMLHttpRequest(); 
        xhr.open('GET', fromUrl, true); 
        xhr.responseType = 'blob';
        xhr.onload = function() {
          if(xhr.status == 200) {
            window.blob = xhr.response;
            requestStorageQuotaIfRequired(xhr.response.size).then(function() {
              writer.write(xhr.response);
              attrs.currentUsage += xhr.response.size;
            }, customErrorHandler);

          }
        };

        xhr.send(null);

      }, customErrorHandler);

    }

    customDownloadFile();

    return deferred.promise;

  }

  function getDest () {
    return attrs.dest;
  }

  return {
    ready: ready,
    getFileEntry : getFileEntry,
    getFile : getFile,
    requestStorageQuota: requestStorageQuota,
    requestStorageQuotaIfRequired: requestStorageQuotaIfRequired,
    mkdir: mkdir,
    download: download,
    getDest: getDest,
  };

}

export var _name = 'offlineAssetsFs';
export default angular.module(_name, [])
  .factory([_name, 'Service'].join(''), offlineAssetsFsService);