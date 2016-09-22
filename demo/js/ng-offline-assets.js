/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _oaBg = __webpack_require__(1);
	
	var _oaSrc = __webpack_require__(5);
	
	angular.module('ngOfflineAssets', [_oaBg._name, _oaSrc._name]).constant('OA_VERSION', '0.0.1');

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	oaBgDirective.$inject = ["offlineAssetsService", "$timeout"];
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports._name = undefined;
	
	var _offlineAssets = __webpack_require__(2);
	
	function oaBgDirective(offlineAssetsService, $timeout) {
	  'ngInject';
	
	  return {
	    restrict: 'A',
	    scope: {
	      url: '=oaBg',
	      localUrl: '=oaLocalUrl'
	    },
	    link: function link(scope, element, attrs) {
	      offlineAssetsService.download(scope.url, function (url) {
	        scope.localUrl = url;
	        // Set src to image attrs
	        $timeout(function () {
	          element.css('background-image', 'url(' + url + ')');
	        }, 10);
	      });
	    }
	  };
	};
	
	var _name = exports._name = 'oaBg';
	exports.default = angular.module(_name, [_offlineAssets._name]).directive(_name, oaBgDirective);

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	offlineAssetsService.$inject = ["offlineAssetsFsService", "work", "$q", "$log", "$http"];
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports._name = undefined;
	
	var _offlineAssetsFs = __webpack_require__(3);
	
	var _work = __webpack_require__(4);
	
	function offlineAssetsService(offlineAssetsFsService, work, $q, $log, $http) {
	  'ngInject';
	
	  var fs = offlineAssetsFsService;
	
	  // Realiza el llamado de una lista de callbacks pasando por parametro una url
	  function resolvedUrl(item, url) {
	    item.$resolvedUrl = url + '?' + item.$version++;
	    item.$cbs = item.$cbs || [];
	    angular.forEach(item.$cbs, function (cb) {
	      if (cb) cb(item.$resolvedUrl);
	    });
	  }
	
	  var dest = null;
	
	  var getFileNameTo = function getFileNameTo(url) {
	
	    return [].concat((fs.getDest() || '/').split('/')).concat(dest || []).concat(url.host.split(':')).concat(url.pathname.split('/')).filter(function (valor) {
	      return (valor || '').trim() != '';
	    }).join('/');
	  };
	
	  // Lista de descargas
	  var queue = new work(function (idx, item, next) {
	    var pathfile = getFileNameTo(item.$url);
	    fs.download(item.$url, pathfile).then(function (fileEntry) {
	      $log.log(['downloaded:', item.$url].join(''));
	      resolvedUrl(item, fileEntry.toURL());
	      next();
	    }).catch(function (err) {
	      $log.error([idx, err]);
	      next();
	    });
	  });
	
	  // Funciona para inicar la descarga de un archivo
	  function download(url, cb) {
	    // $log.log(['download:', url].join(''));
	
	    // Obtener elemento correspondiente a la URL
	    var item = queue.get(url);
	
	    // No existe un elemento para la URL
	    if (!item) {
	      (function () {
	        // Lista de callbacks del elemento
	
	        var addToQueue = function addToQueue() {
	          // Agregar al archivo de descargas
	          queue.add(url, item);
	          // Si no se ha iniciado la descargar iniciarla al terminar la carga
	          // del FS.
	          if (!queue.started()) {
	            queue.start();
	            queue.next();
	          }
	        };
	
	        // Crear el elemento
	        item = {};
	        item.$version = 1;
	
	        try {
	          item.$url = new URL(url);
	        } catch (e) {
	          item.$url = (location.origin + location.pathname).split('/');
	          item.$url.pop();
	          item.$url = item.$url.join('/') + url;
	          item.$url = new URL(item.$url);
	        }
	
	        url = item.$url.toString();
	
	        item.$cbs = [];
	
	        fs.ready().then(function () {
	
	          var pathfile = getFileNameTo(item.$url);
	          // Obtener la instancia del archivo
	          fs.getFile(pathfile).then(function (ff) {
	
	            resolvedUrl(item, ff.fileEntry.toURL());
	
	            // Obtener las cabeceras del archivo
	            $http.head(url).then(function (res) {
	
	              var isUpdate = (!res.headers('content-length') || ff.file.size == parseInt(res.headers('content-length'))) && (!res.headers('last-modified') || ff.file.lastModifiedDate > new Date(res.headers('last-modified')));
	
	              if (!isUpdate) {
	                addToQueue();
	              }
	            });
	          })
	
	          // Si no existe el archivo
	          .catch(addToQueue);
	        });
	      })();
	    } else if (item.$resolvedUrl) {
	      cb(item.$resolvedUrl);
	    }
	
	    // Agregar el cb recibido por parámetro a la lista de callbacks
	    item.$cbs.push(cb);
	  }
	
	  // Remueve un cb
	  function release(url, cb) {
	
	    var item = queue.get(url);
	    if (item) {
	      var idx = item.$cbs.indexOf(cb);
	      if (idx != -1) item.$cbs.splice(idx, 1);
	    }
	  }
	
	  // Asigna el directorio destino para los archivos
	  function setDest(pDest) {
	
	    dest = pDest;
	  }
	
	  return {
	    download: download,
	    release: release,
	    setDir: setDest
	  };
	}
	
	var _name = exports._name = 'offlineAssets';
	exports.default = angular.module(_name, [_offlineAssetsFs._name, _work._name]).factory([_name, 'Service'].join(''), offlineAssetsService);

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';
	
	offlineAssetsFsService.$inject = ["$q", "$log"];
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	function offlineAssetsFsService($q, $log) {
	  'ngInject';
	
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
	    dest: ''
	
	  };
	
	  // Instancia del manejador del file system
	  var fs = null;
	
	  // Defarredes
	  var apiLoadedDeferred = $q.defer();
	  var quotaInfoDeferred = $q.defer();
	  var readyDeferred = $q.all([apiLoadedDeferred.promise, quotaInfoDeferred.promise]);
	
	  // API HTML5 para manejo de archivos
	  var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
	  var pStorage = navigator.webkitPersistentStorage || {
	    requestQuota: function requestQuota() {},
	    queryUsageAndQuota: function queryUsageAndQuota() {}
	  };
	
	  // Load action when loaded fileSystem
	  if (typeof cordova !== 'undefined') {
	    $log.log('cordova on');
	    document.addEventListener('deviceready', function () {
	      $log.log('devideready');
	      requestFileSystem(LocalFileSystem.PERSISTENT, 0, function () {
	        $log.log('requestFileSystem');
	
	        attrs.dest = cordova.file.externalDataDirectory || cordova.file.dataDirectory;
	
	        apiLoadedDeferred.resolve();
	        quotaInfoDeferred.resolve(-1, -1);
	      }, function (err) {
	        apiLoadedDeferred.reject(err);
	        quotaInfoDeferred.reject(err);
	      });
	    }, false);
	  } else {
	    // $log.log('cordova off');
	    pStorage.queryUsageAndQuota(function (used, granted) {
	      $log.log(['queryUsageAndQuota:', used, ', ', granted, ', ', granted - used, ', ', attrs.blockSize].join(''));
	      attrs.currentQuota = granted;
	      attrs.currentUsage = used;
	      if (granted - used < attrs.blockSize / 2) {
	        requestStorageQuota().then(quotaInfoDeferred.resolve, quotaInfoDeferred.reject);
	      } else {
	        quotaInfoDeferred.resolve(used, granted);
	      }
	    }, function (err) {
	      quotaInfoDeferred.reject(err);
	    });
	
	    requestFileSystem(window.PERSISTENT, 0, function (pFs) {
	      // $log.log('requestFileSystem');
	      fs = pFs;
	      apiLoadedDeferred.resolve();
	    }, function (err) {
	      apiLoadedDeferred.reject(err);
	    });
	  }
	
	  readyDeferred.then(function () {
	    $log.log('ready');
	  }).catch($log.error);
	
	  function ready(fn) {
	    if (!fn) return readyDeferred;
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
	    };
	  }
	
	  /**
	   * Call to resolve local file system
	   * - pathfile: File URL to get
	   */
	  var getFileEntry = ready(function (deferred, pathfile, create) {
	    // $log.log(['getFileEntry:', pathfile].join(''));
	
	    // If can't check if file exists then call success directly
	    if (window.resolveLocalFileSystemURL) {
	      window.resolveLocalFileSystemURL(pathfile, deferred.resolve, deferred.reject);
	    } else if (fs) {
	      fs.root.getFile(pathfile, { create: !!create }, function (e) {
	        deferred.resolve(e);
	      }, function (e) {
	        deferred.reject(e);
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
	  var getFile = ready(function (deferred, pathfile) {
	    // $log.log(['getFile:', pathfile].join(''));
	
	    // Check if file exist.
	    getFileEntry(pathfile).then(function (fileEntry) {
	      fileEntry.file(function (file) {
	        deferred.resolve({
	          fileEntry: fileEntry,
	          file: file
	        });
	      }, function (err) {
	        deferred.reject(err);
	      });
	    }).catch(function (err) {
	      deferred.reject(err);
	    });
	  });
	
	  // Indicate if any quota request was be rejected
	  var anyQuotaRequestReject = false;
	
	  /**
	   * Solicitar espacio de almacenamiento
	   */
	  function requestStorageQuota(requiredBytes) {
	
	    var deferred = $q.defer();
	    var quotaRequestRejectedError = function quotaRequestRejectedError() {
	      return { code: 0, name: 'QuotaRequestRejected' };
	    };
	
	    if (anyQuotaRequestReject) {
	      deferred.reject(quotaRequestRejectedError());
	    } else {
	
	      if (!requiredBytes) {
	        requiredBytes = 0;
	      }
	
	      requiredBytes = attrs.currentQuota + Math.max(requiredBytes, attrs.blockSize);
	
	      pStorage.requestQuota(requiredBytes, function (bytesGranted) {
	        if (!bytesGranted) {
	          // log(['requestQuotaReject']);
	          anyQuotaRequestReject = true;
	          deferred.reject(quotaRequestRejectedError());
	        } else {
	          $log.log(['requestQuotaGranted', bytesGranted]);
	          attrs.currentQuota = bytesGranted;
	          deferred.resolve(bytesGranted);
	        }
	      }, function (err) {
	        deferred.reject(err);
	      });
	    }
	
	    return deferred.promise;
	  };
	
	  /**
	   * Solicita mas bytes si es necesario
	   */
	  function requestStorageQuotaIfRequired(neededBytes) {
	
	    var deferred = $q.defer();
	
	    var missingBytes = attrs.currentUsage + neededBytes - attrs.currentQuota;
	
	    if (missingBytes > 0) {
	      requestStorageQuota(missingBytes + 10 * 1024).then(function (bytesGranted) {
	        deferred.resolve();
	      }, function (e) {
	        deferred.reject(e);
	      });
	    } else {
	      deferred.resolve();
	    }
	
	    return deferred.promise;
	  }
	
	  /**
	   * Crear un directorio
	   */
	  function mkdir(dir) {
	    var deferred = $q.defer();
	
	    var dirs = dir.split('/');
	
	    var _mkdir = function _mkdir(folders, rootDirEntry) {
	      if (folders[0] == '.' || folders[0] == '') {
	        folders = folders.slice(1);
	      }
	
	      if (!folders.length) {
	        deferred.resolve(dir);
	        return;
	      }
	
	      rootDirEntry.getDirectory(folders[0], { create: true }, function (dirEntry) {
	        _mkdir(folders.slice(1), dirEntry);
	      }, function (err) {
	        deferred.reject(err);
	      });
	    };
	
	    _mkdir(dirs, fs.root);
	
	    return deferred.promise;
	  }
	
	  /**
	   * Remove physical file.
	   * - params.fileEntry: FileEntry(cordova) instance
	   * - params.success: callback when is success
	   * - params.fail: callback when is fail
	   */
	  var removeFile = function removeFile(fileEntry) {
	    // $log.log(['removeFile']);
	    if (!fileEntry) return;
	
	    var deferred = $q.defer();
	
	    fileEntry.remove(function (file) {
	      deferred.resolve(fileEntry);
	    }, function (err) {
	      deferred.reject(err);
	    });
	
	    return deferred.promise;
	  };
	
	  /**
	   * Call API to download file
	   * - fromUrl: External URL of fila
	   * - localUrl: File URL to get
	   */
	  function download(fromUrl, localUrl) {
	    // $log.log(['callDownloadFile:', fromUrl, localUrl].join(' '));
	
	    var deferred = $q.defer();
	
	    function customErrorHandler(msg) {
	      return function (err) {
	        if (err.name === 'QuotaExceededError') {
	          requestStorageQuota().then(customDownloadFile, deferred.reject);
	        } else {
	          console.log(msg);
	          deferred.reject(err);
	        }
	      };
	    }
	
	    function customDownloadFile() {
	
	      var dirs = localUrl.split('/');
	      var filename = dirs.pop();
	
	      // Crear Directorio
	      $q.when().then(function () {
	        return mkdir(dirs.join('/'));
	      }, customErrorHandler('mkdir'))
	
	      // Obtener el fileEntry para borrarlo
	      .then(function () {
	        return getFileEntry(localUrl);
	      }, function () {})
	
	      // Obtener el fileEntry
	      .then(function (fileEntry) {
	        return removeFile(fileEntry);
	      }, function () {})
	
	      // Obtener el fileEntry
	      .then(function () {
	        return getFileEntry(localUrl, true);
	      }, customErrorHandler('getFileEntry'))
	
	      // Obtener la instancia del writer para el archivo
	      .then(function (fileEntry) {
	        if (!fileEntry) return;
	        var localDeferred = $q.defer();
	        fileEntry.createWriter(function (writer) {
	
	          writer.onwriteend = function () {
	            deferred.resolve(fileEntry);
	          };
	
	          writer.onerror = customErrorHandler('writer');
	
	          localDeferred.resolve(writer);
	        }, localDeferred.reject);
	        return localDeferred.promise;
	      }, customErrorHandler('createWriter'))
	
	      // Obtener el archivo por AJAX y escribir en el archivo
	      .then(function (writer) {
	        if (!writer) return;
	
	        var xhr = new XMLHttpRequest();
	        xhr.open('GET', fromUrl, true);
	        xhr.responseType = 'blob';
	        xhr.onload = function () {
	          if (xhr.status == 200) {
	            window.blob = xhr.response;
	            requestStorageQuotaIfRequired(xhr.response.size).then(function () {
	              writer.write(xhr.response);
	              attrs.currentUsage += xhr.response.size;
	            }, customErrorHandler('requestStorageQuotaIfRequired'));
	          }
	        };
	
	        xhr.send(null);
	      }, customErrorHandler('finish'));
	    }
	
	    customDownloadFile();
	
	    return deferred.promise;
	  }
	
	  function getDest() {
	    return attrs.dest;
	  }
	
	  return {
	    ready: ready,
	    getFileEntry: getFileEntry,
	    getFile: getFile,
	    requestStorageQuota: requestStorageQuota,
	    requestStorageQuotaIfRequired: requestStorageQuotaIfRequired,
	    mkdir: mkdir,
	    download: download,
	    getDest: getDest
	  };
	}
	
	var _name = exports._name = 'offlineAssetsFs';
	exports.default = angular.module(_name, []).factory([_name, 'Service'].join(''), offlineAssetsFsService);

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';
	
	work.$inject = ["$q", "$log"];
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	function work($q, $log) {
	  'ngInject';
	
	  return function (cb) {
	    var self = this;
	
	    var items = {}; // Elemento de la cola
	    var idxs = []; // Indices de la cola
	    var _working = false; // Indica si la cola esta trabajando
	    var _started = false; // Indica si el trabajo se inicio
	
	    // Agrega un elemento a la cola
	    self.add = function (idx, item) {
	      items[idx] = item;
	      idxs.push(idx);
	
	      // Iniciar el trabajo
	      if (!_working) {
	        _working = true;
	        // Si ya se inicio entonce inicar la descarga
	        if (_started) {
	          self.next();
	        }
	      }
	    };
	
	    // Inicia el trabajo de la cola
	    self.start = function () {
	      _started = true;
	    };
	
	    // Devuelve si la cola esta procesando
	    self.working = function () {
	      return _working;
	    };
	
	    // Devuelve si la cola esta procesando
	    self.started = function () {
	      return _started;
	    };
	
	    // Devuelve un elemento por el IDX
	    self.get = function (idx) {
	      return items[idx];
	    };
	
	    // Procesa el siguiente elemento de la cola
	    self.next = function () {
	      _working = !!idxs.length;
	      if (!_working) return;
	      var idx = idxs.shift();
	      var item = items[idx];
	      cb(idx, item, function () {
	        self.next();
	      });
	    };
	  };
	}
	
	var _name = exports._name = 'work';
	exports.default = angular.module(_name, []).factory([_name].join(''), work);

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	oaSrcDirective.$inject = ["offlineAssetsService", "$timeout"];
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports._name = undefined;
	
	var _offlineAssets = __webpack_require__(2);
	
	function oaSrcDirective(offlineAssetsService, $timeout) {
	  'ngInject';
	
	  return {
	    restrict: 'A',
	    scope: {
	      url: '=oaSrc',
	      localUrl: '=oaLocalUrl'
	    },
	    link: function link(scope, element, attrs) {
	
	      function cb(url) {
	        scope.localUrl = url;
	        // Set src to image attrs
	        $timeout(function () {
	          element.attr('src', url);
	        }, 10);
	      }
	      offlineAssetsService.download(scope.url, cb);
	      element.on('$destroy', function () {
	        offlineAssetsService.release(scope.url, cb);
	      });
	    }
	  };
	};
	
	var _name = exports._name = 'oaSrc';
	exports.default = angular.module(_name, [_offlineAssets._name]).directive(_name, oaSrcDirective);

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMmM4YTZkMGJhZTI1ZDA1MTU1OTYiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9kaXJlY3RpdmVzL29hQmcuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2RpcmVjdGl2ZXMvb2FCZy5qcz8xN2ViIiwid2VicGFjazovLy8uL3NyYy9zZXJ2aWNlcy9vZmZsaW5lQXNzZXRzLmpzIiwid2VicGFjazovLy8uL3NyYy9zZXJ2aWNlcy9vZmZsaW5lQXNzZXRzLmpzPzViNWMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3NlcnZpY2VzL29mZmxpbmVBc3NldHNGcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvc2VydmljZXMvb2ZmbGluZUFzc2V0c0ZzLmpzPzU5OTQiLCJ3ZWJwYWNrOi8vLy4vc3JjL3NlcnZpY2VzL3dvcmsuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3NlcnZpY2VzL3dvcmsuanM/MjQ2ZCIsIndlYnBhY2s6Ly8vLi9zcmMvZGlyZWN0aXZlcy9vYVNyYy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvZGlyZWN0aXZlcy9vYVNyYy5qcz80NGRiIl0sIm5hbWVzIjpbImFuZ3VsYXIiLCJtb2R1bGUiLCJjb25zdGFudCIsIm9hQmdEaXJlY3RpdmUiLCJvZmZsaW5lQXNzZXRzU2VydmljZSIsIiR0aW1lb3V0IiwicmVzdHJpY3QiLCJzY29wZSIsInVybCIsImxvY2FsVXJsIiwibGluayIsImVsZW1lbnQiLCJhdHRycyIsImRvd25sb2FkIiwiY3NzIiwiX25hbWUiLCJkaXJlY3RpdmUiLCJvZmZsaW5lQXNzZXRzRnNTZXJ2aWNlIiwid29yayIsIiRxIiwiJGxvZyIsIiRodHRwIiwiZnMiLCJyZXNvbHZlZFVybCIsIml0ZW0iLCIkcmVzb2x2ZWRVcmwiLCIkdmVyc2lvbiIsIiRjYnMiLCJmb3JFYWNoIiwiY2IiLCJkZXN0IiwiZ2V0RmlsZU5hbWVUbyIsImNvbmNhdCIsImdldERlc3QiLCJzcGxpdCIsImhvc3QiLCJwYXRobmFtZSIsImZpbHRlciIsInZhbG9yIiwidHJpbSIsImpvaW4iLCJxdWV1ZSIsImlkeCIsIm5leHQiLCJwYXRoZmlsZSIsIiR1cmwiLCJ0aGVuIiwiZmlsZUVudHJ5IiwibG9nIiwidG9VUkwiLCJjYXRjaCIsImVyciIsImVycm9yIiwiZ2V0IiwiYWRkVG9RdWV1ZSIsImFkZCIsInN0YXJ0ZWQiLCJzdGFydCIsIlVSTCIsImUiLCJsb2NhdGlvbiIsIm9yaWdpbiIsInBvcCIsInRvU3RyaW5nIiwicmVhZHkiLCJnZXRGaWxlIiwiZmYiLCJoZWFkIiwicmVzIiwiaXNVcGRhdGUiLCJoZWFkZXJzIiwiZmlsZSIsInNpemUiLCJwYXJzZUludCIsImxhc3RNb2RpZmllZERhdGUiLCJEYXRlIiwicHVzaCIsInJlbGVhc2UiLCJpbmRleE9mIiwic3BsaWNlIiwic2V0RGVzdCIsInBEZXN0Iiwic2V0RGlyIiwiZmFjdG9yeSIsImJsb2NrU2l6ZSIsImN1cnJlbnRRdW90YSIsImN1cnJlbnRVc2FnZSIsImFwaUxvYWRlZERlZmVycmVkIiwiZGVmZXIiLCJxdW90YUluZm9EZWZlcnJlZCIsInJlYWR5RGVmZXJyZWQiLCJhbGwiLCJwcm9taXNlIiwicmVxdWVzdEZpbGVTeXN0ZW0iLCJ3aW5kb3ciLCJ3ZWJraXRSZXF1ZXN0RmlsZVN5c3RlbSIsInBTdG9yYWdlIiwibmF2aWdhdG9yIiwid2Via2l0UGVyc2lzdGVudFN0b3JhZ2UiLCJyZXF1ZXN0UXVvdGEiLCJxdWVyeVVzYWdlQW5kUXVvdGEiLCJjb3Jkb3ZhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiTG9jYWxGaWxlU3lzdGVtIiwiUEVSU0lTVEVOVCIsImV4dGVybmFsRGF0YURpcmVjdG9yeSIsImRhdGFEaXJlY3RvcnkiLCJyZXNvbHZlIiwicmVqZWN0IiwidXNlZCIsImdyYW50ZWQiLCJyZXF1ZXN0U3RvcmFnZVF1b3RhIiwicEZzIiwiZm4iLCJkZWZlcnJlZCIsImFyZ3MiLCJhcmd1bWVudHMiLCJ1bnNoaWZ0IiwiYXBwbHkiLCJnZXRGaWxlRW50cnkiLCJjcmVhdGUiLCJyZXNvbHZlTG9jYWxGaWxlU3lzdGVtVVJMIiwicm9vdCIsImNvZGUiLCJuYW1lIiwibWVzc2FnZSIsImFueVF1b3RhUmVxdWVzdFJlamVjdCIsInJlcXVpcmVkQnl0ZXMiLCJxdW90YVJlcXVlc3RSZWplY3RlZEVycm9yIiwiTWF0aCIsIm1heCIsImJ5dGVzR3JhbnRlZCIsInJlcXVlc3RTdG9yYWdlUXVvdGFJZlJlcXVpcmVkIiwibmVlZGVkQnl0ZXMiLCJtaXNzaW5nQnl0ZXMiLCJta2RpciIsImRpciIsImRpcnMiLCJfbWtkaXIiLCJmb2xkZXJzIiwicm9vdERpckVudHJ5Iiwic2xpY2UiLCJsZW5ndGgiLCJnZXREaXJlY3RvcnkiLCJkaXJFbnRyeSIsInJlbW92ZUZpbGUiLCJyZW1vdmUiLCJmcm9tVXJsIiwiY3VzdG9tRXJyb3JIYW5kbGVyIiwibXNnIiwiY3VzdG9tRG93bmxvYWRGaWxlIiwiY29uc29sZSIsImZpbGVuYW1lIiwid2hlbiIsImxvY2FsRGVmZXJyZWQiLCJjcmVhdGVXcml0ZXIiLCJ3cml0ZXIiLCJvbndyaXRlZW5kIiwib25lcnJvciIsInhociIsIlhNTEh0dHBSZXF1ZXN0Iiwib3BlbiIsInJlc3BvbnNlVHlwZSIsIm9ubG9hZCIsInN0YXR1cyIsImJsb2IiLCJyZXNwb25zZSIsIndyaXRlIiwic2VuZCIsInNlbGYiLCJpdGVtcyIsImlkeHMiLCJfd29ya2luZyIsIl9zdGFydGVkIiwid29ya2luZyIsInNoaWZ0Iiwib2FTcmNEaXJlY3RpdmUiLCJhdHRyIiwib24iXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7O0FDdENBOztBQUVBOztBQUNBOztB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Tyx3QkFHbENDLFVBQVVELE9BQU9rSyxnQiIsImZpbGUiOiJuZy1vZmZsaW5lLWFzc2V0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgMmM4YTZkMGJhZTI1ZDA1MTU1OTZcbiAqKi8iLCIndXNlIHN0cmljdCc7XHJcblxyXG5pbXBvcnQgeyBfbmFtZSBhcyBvYUJnIH0gZnJvbSAnLi9kaXJlY3RpdmVzL29hQmcnO1xyXG5pbXBvcnQgeyBfbmFtZSBhcyBvYVNyYyB9IGZyb20gJy4vZGlyZWN0aXZlcy9vYVNyYyc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnbmdPZmZsaW5lQXNzZXRzJywgW1xyXG4gIG9hQmcsXHJcbiAgb2FTcmNcclxuXSlcclxuXHJcbi5jb25zdGFudCgnT0FfVkVSU0lPTicsICcwLjAuMScpXHJcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2luZGV4LmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gb2FCZ0RpcmVjdGl2ZShvZmZsaW5lQXNzZXRzU2VydmljZSwgJHRpbWVvdXQpIHsgJ25nSW5qZWN0JztcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgIHNjb3BlOiB7XHJcbiAgICAgIHVybDogJz1vYUJnJyxcclxuICAgICAgbG9jYWxVcmw6ICc9b2FMb2NhbFVybCcsXHJcbiAgICB9LFxyXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgIG9mZmxpbmVBc3NldHNTZXJ2aWNlLmRvd25sb2FkKHNjb3BlLnVybCwgZnVuY3Rpb24gKHVybCkge1xyXG4gICAgICAgIHNjb3BlLmxvY2FsVXJsID0gdXJsO1xyXG4gICAgICAgIC8vIFNldCBzcmMgdG8gaW1hZ2UgYXR0cnNcclxuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgZWxlbWVudC5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCAndXJsKCcgKyB1cmwgKyAnKScpO1xyXG4gICAgICAgIH0sIDEwKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxufTtcclxuXHJcbmltcG9ydCB7IF9uYW1lIGFzIG9mZmxpbmVBc3NldHMgfSBmcm9tICcuLi9zZXJ2aWNlcy9vZmZsaW5lQXNzZXRzJztcclxuXHJcbmV4cG9ydCB2YXIgX25hbWUgPSAnb2FCZyc7XHJcbmV4cG9ydCBkZWZhdWx0IGFuZ3VsYXIubW9kdWxlKF9uYW1lLCBbXHJcbiAgb2ZmbGluZUFzc2V0c1xyXG5dKVxyXG4gIC5kaXJlY3RpdmUoX25hbWUsIG9hQmdEaXJlY3RpdmUpO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2RpcmVjdGl2ZXMvb2FCZy5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuX25hbWUgPSB1bmRlZmluZWQ7XG5cbnZhciBfb2ZmbGluZUFzc2V0cyA9IHJlcXVpcmUoJy4uL3NlcnZpY2VzL29mZmxpbmVBc3NldHMnKTtcblxuZnVuY3Rpb24gb2FCZ0RpcmVjdGl2ZShvZmZsaW5lQXNzZXRzU2VydmljZSwgJHRpbWVvdXQpIHtcbiAgJ25nSW5qZWN0JztcblxuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgc2NvcGU6IHtcbiAgICAgIHVybDogJz1vYUJnJyxcbiAgICAgIGxvY2FsVXJsOiAnPW9hTG9jYWxVcmwnXG4gICAgfSxcbiAgICBsaW5rOiBmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgb2ZmbGluZUFzc2V0c1NlcnZpY2UuZG93bmxvYWQoc2NvcGUudXJsLCBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgIHNjb3BlLmxvY2FsVXJsID0gdXJsO1xuICAgICAgICAvLyBTZXQgc3JjIHRvIGltYWdlIGF0dHJzXG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBlbGVtZW50LmNzcygnYmFja2dyb3VuZC1pbWFnZScsICd1cmwoJyArIHVybCArICcpJyk7XG4gICAgICAgIH0sIDEwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn07XG5cbnZhciBfbmFtZSA9IGV4cG9ydHMuX25hbWUgPSAnb2FCZyc7XG5leHBvcnRzLmRlZmF1bHQgPSBhbmd1bGFyLm1vZHVsZShfbmFtZSwgW19vZmZsaW5lQXNzZXRzLl9uYW1lXSkuZGlyZWN0aXZlKF9uYW1lLCBvYUJnRGlyZWN0aXZlKTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9kaXJlY3RpdmVzL29hQmcuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiBvZmZsaW5lQXNzZXRzU2VydmljZShvZmZsaW5lQXNzZXRzRnNTZXJ2aWNlLCB3b3JrLCAkcSwgJGxvZywgJGh0dHApIHsgJ25nSW5qZWN0JztcclxuICB2YXIgZnMgPSBvZmZsaW5lQXNzZXRzRnNTZXJ2aWNlO1xyXG5cclxuICAvLyBSZWFsaXphIGVsIGxsYW1hZG8gZGUgdW5hIGxpc3RhIGRlIGNhbGxiYWNrcyBwYXNhbmRvIHBvciBwYXJhbWV0cm8gdW5hIHVybFxyXG4gIGZ1bmN0aW9uIHJlc29sdmVkVXJsKGl0ZW0sIHVybCl7XHJcbiAgICBpdGVtLiRyZXNvbHZlZFVybCA9IHVybCArICc/JyArIGl0ZW0uJHZlcnNpb24rKztcclxuICAgIGl0ZW0uJGNicyA9IGl0ZW0uJGNicyB8fCBbXTtcclxuICAgIGFuZ3VsYXIuZm9yRWFjaChpdGVtLiRjYnMsIGZ1bmN0aW9uIChjYikge1xyXG4gICAgICBpZihjYikgY2IoaXRlbS4kcmVzb2x2ZWRVcmwpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICB2YXIgZGVzdCA9IG51bGw7XHJcblxyXG4gIHZhciBnZXRGaWxlTmFtZVRvID0gZnVuY3Rpb24gKHVybCkge1xyXG5cclxuICAgIHJldHVybiBbXVxyXG4gICAgICAuY29uY2F0KChmcy5nZXREZXN0KCkgfHwgJy8nKS5zcGxpdCgnLycpKVxyXG4gICAgICAuY29uY2F0KGRlc3QgfHwgW10pXHJcbiAgICAgIC5jb25jYXQodXJsLmhvc3Quc3BsaXQoJzonKSlcclxuICAgICAgLmNvbmNhdCh1cmwucGF0aG5hbWUuc3BsaXQoJy8nKSlcclxuICAgICAgLmZpbHRlcihmdW5jdGlvbiAodmFsb3IpIHtcclxuICAgICAgICByZXR1cm4gKHZhbG9yIHx8ICcnKS50cmltKCkgIT0gJyc7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5qb2luKCcvJyk7XHJcblxyXG4gIH07XHJcbiAgXHJcbiAgLy8gTGlzdGEgZGUgZGVzY2FyZ2FzXHJcbiAgdmFyIHF1ZXVlID0gbmV3IHdvcmsoZnVuY3Rpb24gKGlkeCwgaXRlbSwgbmV4dCkge1xyXG4gICAgdmFyIHBhdGhmaWxlID0gZ2V0RmlsZU5hbWVUbyhpdGVtLiR1cmwpO1xyXG4gICAgZnMuZG93bmxvYWQoaXRlbS4kdXJsLCBwYXRoZmlsZSkudGhlbihmdW5jdGlvbiAoZmlsZUVudHJ5KSB7XHJcbiAgICAgICRsb2cubG9nKFsnZG93bmxvYWRlZDonLGl0ZW0uJHVybF0uam9pbignJykpO1xyXG4gICAgICByZXNvbHZlZFVybChpdGVtLCBmaWxlRW50cnkudG9VUkwoKSk7XHJcbiAgICAgIG5leHQoKTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAkbG9nLmVycm9yKFtpZHgsIGVycl0pO1xyXG4gICAgICBuZXh0KCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcblxyXG4gIC8vIEZ1bmNpb25hIHBhcmEgaW5pY2FyIGxhIGRlc2NhcmdhIGRlIHVuIGFyY2hpdm9cclxuICBmdW5jdGlvbiBkb3dubG9hZCAodXJsLCBjYikge1xyXG4gICAgLy8gJGxvZy5sb2coWydkb3dubG9hZDonLCB1cmxdLmpvaW4oJycpKTtcclxuXHJcbiAgICAvLyBPYnRlbmVyIGVsZW1lbnRvIGNvcnJlc3BvbmRpZW50ZSBhIGxhIFVSTFxyXG4gICAgdmFyIGl0ZW0gPSBxdWV1ZS5nZXQodXJsKTtcclxuXHJcbiAgICAvLyBObyBleGlzdGUgdW4gZWxlbWVudG8gcGFyYSBsYSBVUkxcclxuICAgIGlmICghaXRlbSkge1xyXG5cclxuICAgICAgLy8gQ3JlYXIgZWwgZWxlbWVudG9cclxuICAgICAgaXRlbSA9IHt9O1xyXG4gICAgICBpdGVtLiR2ZXJzaW9uID0gMTtcclxuXHJcbiAgICAgIHRyeXtcclxuICAgICAgICBpdGVtLiR1cmwgPSBuZXcgVVJMKHVybCk7XHJcbiAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBpdGVtLiR1cmwgPSAobG9jYXRpb24ub3JpZ2luICsgbG9jYXRpb24ucGF0aG5hbWUpLnNwbGl0KCcvJyk7XHJcbiAgICAgICAgaXRlbS4kdXJsLnBvcCgpO1xyXG4gICAgICAgIGl0ZW0uJHVybCA9IGl0ZW0uJHVybC5qb2luKCcvJykgKyB1cmw7XHJcbiAgICAgICAgaXRlbS4kdXJsID0gbmV3IFVSTChpdGVtLiR1cmwpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB1cmwgPSBpdGVtLiR1cmwudG9TdHJpbmcoKTtcclxuXHJcbiAgICAgIGl0ZW0uJGNicyA9IFtdOyAvLyBMaXN0YSBkZSBjYWxsYmFja3MgZGVsIGVsZW1lbnRvXHJcbiAgICAgICAgXHJcbiAgICAgIGZ1bmN0aW9uIGFkZFRvUXVldWUgKCkge1xyXG4gICAgICAgIC8vIEFncmVnYXIgYWwgYXJjaGl2byBkZSBkZXNjYXJnYXNcclxuICAgICAgICBxdWV1ZS5hZGQodXJsLCBpdGVtKTtcclxuICAgICAgICAvLyBTaSBubyBzZSBoYSBpbmljaWFkbyBsYSBkZXNjYXJnYXIgaW5pY2lhcmxhIGFsIHRlcm1pbmFyIGxhIGNhcmdhXHJcbiAgICAgICAgLy8gZGVsIEZTLlxyXG4gICAgICAgIGlmICghcXVldWUuc3RhcnRlZCgpKSB7XHJcbiAgICAgICAgICBxdWV1ZS5zdGFydCgpO1xyXG4gICAgICAgICAgcXVldWUubmV4dCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgZnMucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdmFyIHBhdGhmaWxlID0gZ2V0RmlsZU5hbWVUbyhpdGVtLiR1cmwpO1xyXG4gICAgICAgIC8vIE9idGVuZXIgbGEgaW5zdGFuY2lhIGRlbCBhcmNoaXZvXHJcbiAgICAgICAgZnMuZ2V0RmlsZShwYXRoZmlsZSkudGhlbihmdW5jdGlvbiAoZmYpIHtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgcmVzb2x2ZWRVcmwoaXRlbSwgZmYuZmlsZUVudHJ5LnRvVVJMKCkpO1xyXG5cclxuICAgICAgICAgIC8vIE9idGVuZXIgbGFzIGNhYmVjZXJhcyBkZWwgYXJjaGl2b1xyXG4gICAgICAgICAgJGh0dHAuaGVhZCh1cmwpLnRoZW4oZnVuY3Rpb24gKHJlcykge1xyXG5cclxuICAgICAgICAgICAgdmFyIGlzVXBkYXRlID0gKCFyZXMuaGVhZGVycygnY29udGVudC1sZW5ndGgnKSB8fCBmZi5maWxlLnNpemUgPT0gcGFyc2VJbnQocmVzLmhlYWRlcnMoJ2NvbnRlbnQtbGVuZ3RoJykpKSAmJlxyXG4gICAgICAgICAgICAgICghcmVzLmhlYWRlcnMoJ2xhc3QtbW9kaWZpZWQnKSB8fCBmZi5maWxlLmxhc3RNb2RpZmllZERhdGUgPiBuZXcgRGF0ZShyZXMuaGVhZGVycygnbGFzdC1tb2RpZmllZCcpKSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWlzVXBkYXRlKSB7XHJcbiAgICAgICAgICAgICAgYWRkVG9RdWV1ZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIC8vIFNpIG5vIGV4aXN0ZSBlbCBhcmNoaXZvXHJcbiAgICAgICAgLmNhdGNoKGFkZFRvUXVldWUpO1xyXG4gICAgICAgIFxyXG4gICAgICB9KTtcclxuXHJcbiAgICB9IGVsc2UgaWYgKGl0ZW0uJHJlc29sdmVkVXJsKXtcclxuICAgICAgY2IoaXRlbS4kcmVzb2x2ZWRVcmwpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFncmVnYXIgZWwgY2IgcmVjaWJpZG8gcG9yIHBhcsOhbWV0cm8gYSBsYSBsaXN0YSBkZSBjYWxsYmFja3NcclxuICAgIGl0ZW0uJGNicy5wdXNoKGNiKTtcclxuXHJcbiAgfVxyXG5cclxuICAvLyBSZW11ZXZlIHVuIGNiXHJcbiAgZnVuY3Rpb24gcmVsZWFzZSAodXJsLCBjYikge1xyXG5cclxuICAgIHZhciBpdGVtID0gcXVldWUuZ2V0KHVybCk7XHJcbiAgICBpZiAoaXRlbSkge1xyXG4gICAgICB2YXIgaWR4ID0gaXRlbS4kY2JzLmluZGV4T2YoY2IpO1xyXG4gICAgICBpZiAoaWR4ICE9IC0xKSBpdGVtLiRjYnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbiAgLy8gQXNpZ25hIGVsIGRpcmVjdG9yaW8gZGVzdGlubyBwYXJhIGxvcyBhcmNoaXZvc1xyXG4gIGZ1bmN0aW9uIHNldERlc3QgKHBEZXN0KSB7XHJcblxyXG4gICAgZGVzdCA9IHBEZXN0O1xyXG5cclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBkb3dubG9hZCA6IGRvd25sb2FkLFxyXG4gICAgcmVsZWFzZSA6IHJlbGVhc2UsXHJcbiAgICBzZXREaXI6IHNldERlc3QsXHJcbiAgfTtcclxuXHJcbn1cclxuXHJcbmltcG9ydCB7IF9uYW1lIGFzIG9mZmxpbmVBc3NldHNGcyB9IGZyb20gJy4vb2ZmbGluZUFzc2V0c0ZzJztcclxuaW1wb3J0IHsgX25hbWUgYXMgd29yayB9IGZyb20gJy4vd29yayc7XHJcblxyXG5leHBvcnQgdmFyIF9uYW1lID0gJ29mZmxpbmVBc3NldHMnO1xyXG5leHBvcnQgZGVmYXVsdCBhbmd1bGFyLm1vZHVsZShfbmFtZSwgW1xyXG4gIG9mZmxpbmVBc3NldHNGcyxcclxuICB3b3JrXHJcbl0pXHJcbiAgLmZhY3RvcnkoW19uYW1lLCAnU2VydmljZSddLmpvaW4oJycpLCBvZmZsaW5lQXNzZXRzU2VydmljZSk7XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvc2VydmljZXMvb2ZmbGluZUFzc2V0cy5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuX25hbWUgPSB1bmRlZmluZWQ7XG5cbnZhciBfb2ZmbGluZUFzc2V0c0ZzID0gcmVxdWlyZSgnLi9vZmZsaW5lQXNzZXRzRnMnKTtcblxudmFyIF93b3JrID0gcmVxdWlyZSgnLi93b3JrJyk7XG5cbmZ1bmN0aW9uIG9mZmxpbmVBc3NldHNTZXJ2aWNlKG9mZmxpbmVBc3NldHNGc1NlcnZpY2UsIHdvcmssICRxLCAkbG9nLCAkaHR0cCkge1xuICAnbmdJbmplY3QnO1xuXG4gIHZhciBmcyA9IG9mZmxpbmVBc3NldHNGc1NlcnZpY2U7XG5cbiAgLy8gUmVhbGl6YSBlbCBsbGFtYWRvIGRlIHVuYSBsaXN0YSBkZSBjYWxsYmFja3MgcGFzYW5kbyBwb3IgcGFyYW1ldHJvIHVuYSB1cmxcbiAgZnVuY3Rpb24gcmVzb2x2ZWRVcmwoaXRlbSwgdXJsKSB7XG4gICAgaXRlbS4kcmVzb2x2ZWRVcmwgPSB1cmwgKyAnPycgKyBpdGVtLiR2ZXJzaW9uKys7XG4gICAgaXRlbS4kY2JzID0gaXRlbS4kY2JzIHx8IFtdO1xuICAgIGFuZ3VsYXIuZm9yRWFjaChpdGVtLiRjYnMsIGZ1bmN0aW9uIChjYikge1xuICAgICAgaWYgKGNiKSBjYihpdGVtLiRyZXNvbHZlZFVybCk7XG4gICAgfSk7XG4gIH1cblxuICB2YXIgZGVzdCA9IG51bGw7XG5cbiAgdmFyIGdldEZpbGVOYW1lVG8gPSBmdW5jdGlvbiBnZXRGaWxlTmFtZVRvKHVybCkge1xuXG4gICAgcmV0dXJuIFtdLmNvbmNhdCgoZnMuZ2V0RGVzdCgpIHx8ICcvJykuc3BsaXQoJy8nKSkuY29uY2F0KGRlc3QgfHwgW10pLmNvbmNhdCh1cmwuaG9zdC5zcGxpdCgnOicpKS5jb25jYXQodXJsLnBhdGhuYW1lLnNwbGl0KCcvJykpLmZpbHRlcihmdW5jdGlvbiAodmFsb3IpIHtcbiAgICAgIHJldHVybiAodmFsb3IgfHwgJycpLnRyaW0oKSAhPSAnJztcbiAgICB9KS5qb2luKCcvJyk7XG4gIH07XG5cbiAgLy8gTGlzdGEgZGUgZGVzY2FyZ2FzXG4gIHZhciBxdWV1ZSA9IG5ldyB3b3JrKGZ1bmN0aW9uIChpZHgsIGl0ZW0sIG5leHQpIHtcbiAgICB2YXIgcGF0aGZpbGUgPSBnZXRGaWxlTmFtZVRvKGl0ZW0uJHVybCk7XG4gICAgZnMuZG93bmxvYWQoaXRlbS4kdXJsLCBwYXRoZmlsZSkudGhlbihmdW5jdGlvbiAoZmlsZUVudHJ5KSB7XG4gICAgICAkbG9nLmxvZyhbJ2Rvd25sb2FkZWQ6JywgaXRlbS4kdXJsXS5qb2luKCcnKSk7XG4gICAgICByZXNvbHZlZFVybChpdGVtLCBmaWxlRW50cnkudG9VUkwoKSk7XG4gICAgICBuZXh0KCk7XG4gICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgJGxvZy5lcnJvcihbaWR4LCBlcnJdKTtcbiAgICAgIG5leHQoKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gRnVuY2lvbmEgcGFyYSBpbmljYXIgbGEgZGVzY2FyZ2EgZGUgdW4gYXJjaGl2b1xuICBmdW5jdGlvbiBkb3dubG9hZCh1cmwsIGNiKSB7XG4gICAgLy8gJGxvZy5sb2coWydkb3dubG9hZDonLCB1cmxdLmpvaW4oJycpKTtcblxuICAgIC8vIE9idGVuZXIgZWxlbWVudG8gY29ycmVzcG9uZGllbnRlIGEgbGEgVVJMXG4gICAgdmFyIGl0ZW0gPSBxdWV1ZS5nZXQodXJsKTtcblxuICAgIC8vIE5vIGV4aXN0ZSB1biBlbGVtZW50byBwYXJhIGxhIFVSTFxuICAgIGlmICghaXRlbSkge1xuICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gTGlzdGEgZGUgY2FsbGJhY2tzIGRlbCBlbGVtZW50b1xuXG4gICAgICAgIHZhciBhZGRUb1F1ZXVlID0gZnVuY3Rpb24gYWRkVG9RdWV1ZSgpIHtcbiAgICAgICAgICAvLyBBZ3JlZ2FyIGFsIGFyY2hpdm8gZGUgZGVzY2FyZ2FzXG4gICAgICAgICAgcXVldWUuYWRkKHVybCwgaXRlbSk7XG4gICAgICAgICAgLy8gU2kgbm8gc2UgaGEgaW5pY2lhZG8gbGEgZGVzY2FyZ2FyIGluaWNpYXJsYSBhbCB0ZXJtaW5hciBsYSBjYXJnYVxuICAgICAgICAgIC8vIGRlbCBGUy5cbiAgICAgICAgICBpZiAoIXF1ZXVlLnN0YXJ0ZWQoKSkge1xuICAgICAgICAgICAgcXVldWUuc3RhcnQoKTtcbiAgICAgICAgICAgIHF1ZXVlLm5leHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQ3JlYXIgZWwgZWxlbWVudG9cbiAgICAgICAgaXRlbSA9IHt9O1xuICAgICAgICBpdGVtLiR2ZXJzaW9uID0gMTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGl0ZW0uJHVybCA9IG5ldyBVUkwodXJsKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGl0ZW0uJHVybCA9IChsb2NhdGlvbi5vcmlnaW4gKyBsb2NhdGlvbi5wYXRobmFtZSkuc3BsaXQoJy8nKTtcbiAgICAgICAgICBpdGVtLiR1cmwucG9wKCk7XG4gICAgICAgICAgaXRlbS4kdXJsID0gaXRlbS4kdXJsLmpvaW4oJy8nKSArIHVybDtcbiAgICAgICAgICBpdGVtLiR1cmwgPSBuZXcgVVJMKGl0ZW0uJHVybCk7XG4gICAgICAgIH1cblxuICAgICAgICB1cmwgPSBpdGVtLiR1cmwudG9TdHJpbmcoKTtcblxuICAgICAgICBpdGVtLiRjYnMgPSBbXTtcblxuICAgICAgICBmcy5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgdmFyIHBhdGhmaWxlID0gZ2V0RmlsZU5hbWVUbyhpdGVtLiR1cmwpO1xuICAgICAgICAgIC8vIE9idGVuZXIgbGEgaW5zdGFuY2lhIGRlbCBhcmNoaXZvXG4gICAgICAgICAgZnMuZ2V0RmlsZShwYXRoZmlsZSkudGhlbihmdW5jdGlvbiAoZmYpIHtcblxuICAgICAgICAgICAgcmVzb2x2ZWRVcmwoaXRlbSwgZmYuZmlsZUVudHJ5LnRvVVJMKCkpO1xuXG4gICAgICAgICAgICAvLyBPYnRlbmVyIGxhcyBjYWJlY2VyYXMgZGVsIGFyY2hpdm9cbiAgICAgICAgICAgICRodHRwLmhlYWQodXJsKS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcblxuICAgICAgICAgICAgICB2YXIgaXNVcGRhdGUgPSAoIXJlcy5oZWFkZXJzKCdjb250ZW50LWxlbmd0aCcpIHx8IGZmLmZpbGUuc2l6ZSA9PSBwYXJzZUludChyZXMuaGVhZGVycygnY29udGVudC1sZW5ndGgnKSkpICYmICghcmVzLmhlYWRlcnMoJ2xhc3QtbW9kaWZpZWQnKSB8fCBmZi5maWxlLmxhc3RNb2RpZmllZERhdGUgPiBuZXcgRGF0ZShyZXMuaGVhZGVycygnbGFzdC1tb2RpZmllZCcpKSk7XG5cbiAgICAgICAgICAgICAgaWYgKCFpc1VwZGF0ZSkge1xuICAgICAgICAgICAgICAgIGFkZFRvUXVldWUoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIC8vIFNpIG5vIGV4aXN0ZSBlbCBhcmNoaXZvXG4gICAgICAgICAgLmNhdGNoKGFkZFRvUXVldWUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pKCk7XG4gICAgfSBlbHNlIGlmIChpdGVtLiRyZXNvbHZlZFVybCkge1xuICAgICAgY2IoaXRlbS4kcmVzb2x2ZWRVcmwpO1xuICAgIH1cblxuICAgIC8vIEFncmVnYXIgZWwgY2IgcmVjaWJpZG8gcG9yIHBhcsOhbWV0cm8gYSBsYSBsaXN0YSBkZSBjYWxsYmFja3NcbiAgICBpdGVtLiRjYnMucHVzaChjYik7XG4gIH1cblxuICAvLyBSZW11ZXZlIHVuIGNiXG4gIGZ1bmN0aW9uIHJlbGVhc2UodXJsLCBjYikge1xuXG4gICAgdmFyIGl0ZW0gPSBxdWV1ZS5nZXQodXJsKTtcbiAgICBpZiAoaXRlbSkge1xuICAgICAgdmFyIGlkeCA9IGl0ZW0uJGNicy5pbmRleE9mKGNiKTtcbiAgICAgIGlmIChpZHggIT0gLTEpIGl0ZW0uJGNicy5zcGxpY2UoaWR4LCAxKTtcbiAgICB9XG4gIH1cblxuICAvLyBBc2lnbmEgZWwgZGlyZWN0b3JpbyBkZXN0aW5vIHBhcmEgbG9zIGFyY2hpdm9zXG4gIGZ1bmN0aW9uIHNldERlc3QocERlc3QpIHtcblxuICAgIGRlc3QgPSBwRGVzdDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZG93bmxvYWQ6IGRvd25sb2FkLFxuICAgIHJlbGVhc2U6IHJlbGVhc2UsXG4gICAgc2V0RGlyOiBzZXREZXN0XG4gIH07XG59XG5cbnZhciBfbmFtZSA9IGV4cG9ydHMuX25hbWUgPSAnb2ZmbGluZUFzc2V0cyc7XG5leHBvcnRzLmRlZmF1bHQgPSBhbmd1bGFyLm1vZHVsZShfbmFtZSwgW19vZmZsaW5lQXNzZXRzRnMuX25hbWUsIF93b3JrLl9uYW1lXSkuZmFjdG9yeShbX25hbWUsICdTZXJ2aWNlJ10uam9pbignJyksIG9mZmxpbmVBc3NldHNTZXJ2aWNlKTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9zZXJ2aWNlcy9vZmZsaW5lQXNzZXRzLmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gb2ZmbGluZUFzc2V0c0ZzU2VydmljZSgkcSwgJGxvZykgeyAnbmdJbmplY3QnO1xyXG4gIFxyXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gIC8vIEF0dHJpYnV0b3MgZ2xvYmFsZXNcclxuICB2YXIgYXR0cnMgPSB7XHJcbiAgICAvLyBUYW1hw7FvIGRlbCBibG9xdWUgZGUgbWVtb3JpYSBxIHNlIGlyYSBwaWRpZW5kbyBjYWRhIHZleiBxdWUgc2Ugc29icmUgcGFzZVxyXG4gICAgLy8gbGEgY3VvdGEgZGUgYWxtYWNlbmFtaWVudG9cclxuICAgIGJsb2NrU2l6ZTogMTYgKiAxMDE0ICogMTAyNCxcclxuXHJcbiAgICAvLyBFc3BhY2lvIGRlIGxhIGN1b3RhIGRlIGFsbWFjZW5hbWllbnRvXHJcbiAgICBjdXJyZW50UXVvdGE6IDAsXHJcblxyXG4gICAgLy8gRXNwYWNpbyB1c2FkbyBkZSBsYSBjdW90YSBkZSBhbG1hY2VuYW1pZW50b1xyXG4gICAgY3VycmVudFVzYWdlOiAwLFxyXG5cclxuICAgIC8vIEVzcGFjaW8gZGUgbGEgY3VvdGEgZGUgYWxtYWNlbmFtaWVudG9cclxuICAgIGRlc3Q6ICAnJyxcclxuXHJcbiAgfTtcclxuXHJcbiAgLy8gSW5zdGFuY2lhIGRlbCBtYW5lamFkb3IgZGVsIGZpbGUgc3lzdGVtXHJcbiAgdmFyIGZzID0gbnVsbDtcclxuXHJcbiAgLy8gRGVmYXJyZWRlc1xyXG4gIHZhciBhcGlMb2FkZWREZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcbiAgdmFyIHF1b3RhSW5mb0RlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuICB2YXIgcmVhZHlEZWZlcnJlZCA9ICRxLmFsbChbXHJcbiAgICBhcGlMb2FkZWREZWZlcnJlZC5wcm9taXNlLFxyXG4gICAgcXVvdGFJbmZvRGVmZXJyZWQucHJvbWlzZVxyXG4gIF0pO1xyXG4gIFxyXG4gIC8vIEFQSSBIVE1MNSBwYXJhIG1hbmVqbyBkZSBhcmNoaXZvc1xyXG4gIHZhciByZXF1ZXN0RmlsZVN5c3RlbSA9IHdpbmRvdy5yZXF1ZXN0RmlsZVN5c3RlbSB8fCB3aW5kb3cud2Via2l0UmVxdWVzdEZpbGVTeXN0ZW07XHJcbiAgdmFyIHBTdG9yYWdlID0gbmF2aWdhdG9yLndlYmtpdFBlcnNpc3RlbnRTdG9yYWdlIHx8IHtcclxuICAgIHJlcXVlc3RRdW90YTogZnVuY3Rpb24oKSB7fSxcclxuICAgIHF1ZXJ5VXNhZ2VBbmRRdW90YTogZnVuY3Rpb24oKSB7fSxcclxuICB9O1xyXG5cclxuICAvLyBMb2FkIGFjdGlvbiB3aGVuIGxvYWRlZCBmaWxlU3lzdGVtXHJcbiAgaWYgKHR5cGVvZiBjb3Jkb3ZhICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgJGxvZy5sb2coJ2NvcmRvdmEgb24nKTtcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2RldmljZXJlYWR5JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICRsb2cubG9nKCdkZXZpZGVyZWFkeScpO1xyXG4gICAgICByZXF1ZXN0RmlsZVN5c3RlbShMb2NhbEZpbGVTeXN0ZW0uUEVSU0lTVEVOVCwgMCwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJGxvZy5sb2coJ3JlcXVlc3RGaWxlU3lzdGVtJyk7XHJcblxyXG4gICAgICAgIGF0dHJzLmRlc3QgPSBjb3Jkb3ZhLmZpbGUuZXh0ZXJuYWxEYXRhRGlyZWN0b3J5IHx8IGNvcmRvdmEuZmlsZS5kYXRhRGlyZWN0b3J5O1xyXG5cclxuICAgICAgICBhcGlMb2FkZWREZWZlcnJlZC5yZXNvbHZlKCk7XHJcbiAgICAgICAgcXVvdGFJbmZvRGVmZXJyZWQucmVzb2x2ZSgtMSwtMSk7XHJcbiAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICBhcGlMb2FkZWREZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuICAgICAgICBxdW90YUluZm9EZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuICAgICAgfSk7XHJcbiAgICB9LCBmYWxzZSk7XHJcblxyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyAkbG9nLmxvZygnY29yZG92YSBvZmYnKTtcclxuICAgIHBTdG9yYWdlLnF1ZXJ5VXNhZ2VBbmRRdW90YShmdW5jdGlvbih1c2VkLCBncmFudGVkKSB7XHJcbiAgICAgICRsb2cubG9nKFsncXVlcnlVc2FnZUFuZFF1b3RhOicsIHVzZWQsICcsICcsIGdyYW50ZWQsICcsICcsIGdyYW50ZWQtdXNlZCwgJywgJywgYXR0cnMuYmxvY2tTaXplXS5qb2luKCcnKSk7XHJcbiAgICAgIGF0dHJzLmN1cnJlbnRRdW90YSA9IGdyYW50ZWQ7XHJcbiAgICAgIGF0dHJzLmN1cnJlbnRVc2FnZSA9IHVzZWQ7XHJcbiAgICAgIGlmICgoZ3JhbnRlZC11c2VkKTxhdHRycy5ibG9ja1NpemUvMikge1xyXG4gICAgICAgIHJlcXVlc3RTdG9yYWdlUXVvdGEoKVxyXG4gICAgICAgICAgLnRoZW4ocXVvdGFJbmZvRGVmZXJyZWQucmVzb2x2ZSwgcXVvdGFJbmZvRGVmZXJyZWQucmVqZWN0KTtcclxuICAgICAgfWVsc2Uge1xyXG4gICAgICAgIHF1b3RhSW5mb0RlZmVycmVkLnJlc29sdmUodXNlZCwgZ3JhbnRlZCk7XHJcbiAgICAgIH1cclxuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgcXVvdGFJbmZvRGVmZXJyZWQucmVqZWN0KGVycik7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXF1ZXN0RmlsZVN5c3RlbSh3aW5kb3cuUEVSU0lTVEVOVCwgMCwgZnVuY3Rpb24ocEZzKSB7XHJcbiAgICAgIC8vICRsb2cubG9nKCdyZXF1ZXN0RmlsZVN5c3RlbScpO1xyXG4gICAgICBmcyA9IHBGcztcclxuICAgICAgYXBpTG9hZGVkRGVmZXJyZWQucmVzb2x2ZSgpO1xyXG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICBhcGlMb2FkZWREZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuICAgIH0pO1xyXG5cclxuICB9XHJcblxyXG4gIHJlYWR5RGVmZXJyZWQudGhlbihmdW5jdGlvbigpIHtcclxuICAgICRsb2cubG9nKCdyZWFkeScpO1xyXG4gIH0pLmNhdGNoKCRsb2cuZXJyb3IpO1xyXG5cclxuICBmdW5jdGlvbiByZWFkeShmbikge1xyXG4gICAgaWYoIWZuKSByZXR1cm4gcmVhZHlEZWZlcnJlZDtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcbiAgICAgIHZhciBhcmdzID0gW107XHJcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChhcmd1bWVudHMsIGZ1bmN0aW9uICh2YWxvcikge1xyXG4gICAgICAgIGFyZ3MucHVzaCh2YWxvcik7XHJcbiAgICAgIH0pO1xyXG4gICAgICBhcmdzLnVuc2hpZnQoZGVmZXJyZWQpO1xyXG4gICAgICByZWFkeURlZmVycmVkLnRoZW4oZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGZuLmFwcGx5KGZuLCBhcmdzKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGwgdG8gcmVzb2x2ZSBsb2NhbCBmaWxlIHN5c3RlbVxyXG4gICAqIC0gcGF0aGZpbGU6IEZpbGUgVVJMIHRvIGdldFxyXG4gICAqL1xyXG4gIHZhciBnZXRGaWxlRW50cnkgPSByZWFkeShmdW5jdGlvbihkZWZlcnJlZCwgcGF0aGZpbGUsIGNyZWF0ZSkge1xyXG4gICAgLy8gJGxvZy5sb2coWydnZXRGaWxlRW50cnk6JywgcGF0aGZpbGVdLmpvaW4oJycpKTtcclxuXHJcbiAgICAvLyBJZiBjYW4ndCBjaGVjayBpZiBmaWxlIGV4aXN0cyB0aGVuIGNhbGwgc3VjY2VzcyBkaXJlY3RseVxyXG4gICAgaWYgKHdpbmRvdy5yZXNvbHZlTG9jYWxGaWxlU3lzdGVtVVJMKSB7XHJcbiAgICAgIHdpbmRvdy5yZXNvbHZlTG9jYWxGaWxlU3lzdGVtVVJMKHBhdGhmaWxlLCBkZWZlcnJlZC5yZXNvbHZlLCBkZWZlcnJlZC5yZWplY3QpO1xyXG4gICAgfSBlbHNlIGlmIChmcykge1xyXG4gICAgICBmcy5yb290LmdldEZpbGUocGF0aGZpbGUsIHtjcmVhdGU6ICEhY3JlYXRlfSwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGUpO1xyXG4gICAgICB9LCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlKTtcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkZWZlcnJlZC5yZWplY3Qoe1xyXG4gICAgICAgIGNvZGU6IDAsXHJcbiAgICAgICAgbmFtZTogJ05vdEluc3RhbmNlVG9HZXRGaWxlRW50cnknLFxyXG4gICAgICAgIG1lc3NhZ2U6ICdObyBoYW5kbGVyIGluc3RhbmNlIHRvIGdldCBmaWxlIGVudHJ5IGluc3RhbmNlJ1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBpbnN0YW5jZSBpZiBGaWxlKGNvcmRvdmEpIG9mIHBoeXN5Y2FsIGZpbGVcclxuICAgKiAtIHBhdGhmaWxlOiBVUkwgdG8gZG93bmxvYWRcclxuICAgKi9cclxuICB2YXIgZ2V0RmlsZSA9IHJlYWR5KGZ1bmN0aW9uKGRlZmVycmVkLCBwYXRoZmlsZSkge1xyXG4gICAgLy8gJGxvZy5sb2coWydnZXRGaWxlOicsIHBhdGhmaWxlXS5qb2luKCcnKSk7XHJcbiAgICBcclxuICAgIC8vIENoZWNrIGlmIGZpbGUgZXhpc3QuXHJcbiAgICBnZXRGaWxlRW50cnkocGF0aGZpbGUpLnRoZW4oZnVuY3Rpb24gKGZpbGVFbnRyeSkge1xyXG4gICAgICBmaWxlRW50cnkuZmlsZShmdW5jdGlvbihmaWxlKSB7XHJcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh7XHJcbiAgICAgICAgICBmaWxlRW50cnk6IGZpbGVFbnRyeSxcclxuICAgICAgICAgIGZpbGU6IGZpbGVcclxuICAgICAgICB9KTtcclxuICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XHJcbiAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG4gICAgfSk7XHJcblxyXG4gIH0pO1xyXG5cclxuICAvLyBJbmRpY2F0ZSBpZiBhbnkgcXVvdGEgcmVxdWVzdCB3YXMgYmUgcmVqZWN0ZWRcclxuICB2YXIgYW55UXVvdGFSZXF1ZXN0UmVqZWN0ID0gZmFsc2U7XHJcblxyXG4gIC8qKlxyXG4gICAqIFNvbGljaXRhciBlc3BhY2lvIGRlIGFsbWFjZW5hbWllbnRvXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gcmVxdWVzdFN0b3JhZ2VRdW90YSAocmVxdWlyZWRCeXRlcykge1xyXG5cclxuICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcbiAgICB2YXIgcXVvdGFSZXF1ZXN0UmVqZWN0ZWRFcnJvciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4geyBjb2RlOiAwLCBuYW1lOiAnUXVvdGFSZXF1ZXN0UmVqZWN0ZWQnIH1cclxuICAgIH07XHJcblxyXG4gICAgaWYoYW55UXVvdGFSZXF1ZXN0UmVqZWN0KSB7XHJcbiAgICAgIGRlZmVycmVkLnJlamVjdChxdW90YVJlcXVlc3RSZWplY3RlZEVycm9yKCkpO1xyXG5cclxuICAgIH1lbHNle1xyXG5cclxuICAgICAgaWYoIXJlcXVpcmVkQnl0ZXMpIHtcclxuICAgICAgICByZXF1aXJlZEJ5dGVzID0gMDtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmVxdWlyZWRCeXRlcyA9IGF0dHJzLmN1cnJlbnRRdW90YSArIE1hdGgubWF4KHJlcXVpcmVkQnl0ZXMsIGF0dHJzLmJsb2NrU2l6ZSk7XHJcblxyXG4gICAgICBwU3RvcmFnZS5yZXF1ZXN0UXVvdGEocmVxdWlyZWRCeXRlcyxcclxuICAgICAgICBmdW5jdGlvbihieXRlc0dyYW50ZWQpIHtcclxuICAgICAgICAgIGlmKCFieXRlc0dyYW50ZWQpIHtcclxuICAgICAgICAgICAgLy8gbG9nKFsncmVxdWVzdFF1b3RhUmVqZWN0J10pO1xyXG4gICAgICAgICAgICBhbnlRdW90YVJlcXVlc3RSZWplY3QgPSB0cnVlO1xyXG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocXVvdGFSZXF1ZXN0UmVqZWN0ZWRFcnJvcigpKTtcclxuICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAkbG9nLmxvZyhbJ3JlcXVlc3RRdW90YUdyYW50ZWQnLCBieXRlc0dyYW50ZWRdKTtcclxuICAgICAgICAgICAgYXR0cnMuY3VycmVudFF1b3RhID0gYnl0ZXNHcmFudGVkO1xyXG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGJ5dGVzR3JhbnRlZCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgICk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBTb2xpY2l0YSBtYXMgYnl0ZXMgc2kgZXMgbmVjZXNhcmlvXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gcmVxdWVzdFN0b3JhZ2VRdW90YUlmUmVxdWlyZWQgKG5lZWRlZEJ5dGVzKSB7XHJcblxyXG4gICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcbiAgICB2YXIgbWlzc2luZ0J5dGVzID0gYXR0cnMuY3VycmVudFVzYWdlICsgbmVlZGVkQnl0ZXMgLSBhdHRycy5jdXJyZW50UXVvdGE7XHJcblxyXG4gICAgaWYobWlzc2luZ0J5dGVzID4gMCkge1xyXG4gICAgICByZXF1ZXN0U3RvcmFnZVF1b3RhKG1pc3NpbmdCeXRlcyArIDEwICogMTAyNClcclxuICAgICAgICAudGhlbihmdW5jdGlvbihieXRlc0dyYW50ZWQpIHtcclxuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcclxuICAgICAgICB9LCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXIgdW4gZGlyZWN0b3Jpb1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIG1rZGlyIChkaXIpIHtcclxuICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG4gICAgdmFyIGRpcnMgPSBkaXIuc3BsaXQoJy8nKTtcclxuXHJcbiAgICB2YXIgX21rZGlyID0gZnVuY3Rpb24oZm9sZGVycywgcm9vdERpckVudHJ5KSB7XHJcbiAgICAgIGlmIChmb2xkZXJzWzBdID09ICcuJyB8fCBmb2xkZXJzWzBdID09ICcnKSB7XHJcbiAgICAgICAgZm9sZGVycyA9IGZvbGRlcnMuc2xpY2UoMSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghZm9sZGVycy5sZW5ndGgpIHtcclxuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGRpcik7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByb290RGlyRW50cnkuZ2V0RGlyZWN0b3J5KGZvbGRlcnNbMF0sIHtjcmVhdGU6IHRydWV9LCBmdW5jdGlvbihkaXJFbnRyeSkge1xyXG4gICAgICAgIF9ta2Rpcihmb2xkZXJzLnNsaWNlKDEpLCBkaXJFbnRyeSk7XHJcbiAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBfbWtkaXIoZGlycywgZnMucm9vdCk7XHJcblxyXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIHBoeXNpY2FsIGZpbGUuXHJcbiAgICogLSBwYXJhbXMuZmlsZUVudHJ5OiBGaWxlRW50cnkoY29yZG92YSkgaW5zdGFuY2VcclxuICAgKiAtIHBhcmFtcy5zdWNjZXNzOiBjYWxsYmFjayB3aGVuIGlzIHN1Y2Nlc3NcclxuICAgKiAtIHBhcmFtcy5mYWlsOiBjYWxsYmFjayB3aGVuIGlzIGZhaWxcclxuICAgKi9cclxuICB2YXIgcmVtb3ZlRmlsZSA9IGZ1bmN0aW9uKGZpbGVFbnRyeSkge1xyXG4gICAgLy8gJGxvZy5sb2coWydyZW1vdmVGaWxlJ10pO1xyXG4gICAgaWYoIWZpbGVFbnRyeSkgcmV0dXJuO1xyXG5cclxuICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG4gICAgZmlsZUVudHJ5LnJlbW92ZShmdW5jdGlvbihmaWxlKXtcclxuICAgICAgZGVmZXJyZWQucmVzb2x2ZShmaWxlRW50cnkpO1xyXG4gICAgfSwgZnVuY3Rpb24oZXJyKXtcclxuICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbCBBUEkgdG8gZG93bmxvYWQgZmlsZVxyXG4gICAqIC0gZnJvbVVybDogRXh0ZXJuYWwgVVJMIG9mIGZpbGFcclxuICAgKiAtIGxvY2FsVXJsOiBGaWxlIFVSTCB0byBnZXRcclxuICAgKi9cclxuICBmdW5jdGlvbiBkb3dubG9hZChmcm9tVXJsLCBsb2NhbFVybCkge1xyXG4gICAgLy8gJGxvZy5sb2coWydjYWxsRG93bmxvYWRGaWxlOicsIGZyb21VcmwsIGxvY2FsVXJsXS5qb2luKCcgJykpO1xyXG5cclxuICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG4gICAgZnVuY3Rpb24gY3VzdG9tRXJyb3JIYW5kbGVyIChtc2cpIHtcclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICBpZihlcnIubmFtZSA9PT0gJ1F1b3RhRXhjZWVkZWRFcnJvcicpIHtcclxuICAgICAgICAgIHJlcXVlc3RTdG9yYWdlUXVvdGEoKVxyXG4gICAgICAgICAgICAudGhlbihjdXN0b21Eb3dubG9hZEZpbGUsIGRlZmVycmVkLnJlamVjdCk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhtc2cpO1xyXG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGN1c3RvbURvd25sb2FkRmlsZSAoKSB7XHJcblxyXG4gICAgICB2YXIgZGlycyA9IGxvY2FsVXJsLnNwbGl0KCcvJyk7XHJcbiAgICAgIHZhciBmaWxlbmFtZSA9IGRpcnMucG9wKCk7XHJcblxyXG4gICAgICAvLyBDcmVhciBEaXJlY3RvcmlvXHJcbiAgICAgICRxLndoZW4oKS50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbWtkaXIoZGlycy5qb2luKCcvJykpO1xyXG5cclxuICAgICAgfSwgY3VzdG9tRXJyb3JIYW5kbGVyKCdta2RpcicpKVxyXG5cclxuICAgICAgLy8gT2J0ZW5lciBlbCBmaWxlRW50cnkgcGFyYSBib3JyYXJsb1xyXG4gICAgICAudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIGdldEZpbGVFbnRyeShsb2NhbFVybCk7XHJcblxyXG4gICAgICB9LCBmdW5jdGlvbiAoKSB7fSlcclxuXHJcbiAgICAgIC8vIE9idGVuZXIgZWwgZmlsZUVudHJ5XHJcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChmaWxlRW50cnkpIHtcclxuICAgICAgICByZXR1cm4gcmVtb3ZlRmlsZShmaWxlRW50cnkpO1xyXG5cclxuICAgICAgfSwgZnVuY3Rpb24gKCkge30pXHJcblxyXG4gICAgICAvLyBPYnRlbmVyIGVsIGZpbGVFbnRyeVxyXG4gICAgICAudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIGdldEZpbGVFbnRyeShsb2NhbFVybCwgdHJ1ZSk7XHJcblxyXG4gICAgICB9LCBjdXN0b21FcnJvckhhbmRsZXIoJ2dldEZpbGVFbnRyeScpKVxyXG5cclxuICAgICAgLy8gT2J0ZW5lciBsYSBpbnN0YW5jaWEgZGVsIHdyaXRlciBwYXJhIGVsIGFyY2hpdm9cclxuICAgICAgLnRoZW4oZnVuY3Rpb24gKGZpbGVFbnRyeSkge1xyXG4gICAgICAgIGlmICghZmlsZUVudHJ5KSByZXR1cm47XHJcbiAgICAgICAgdmFyIGxvY2FsRGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG4gICAgICAgIGZpbGVFbnRyeS5jcmVhdGVXcml0ZXIoZnVuY3Rpb24gKHdyaXRlcikge1xyXG5cclxuICAgICAgICAgIHdyaXRlci5vbndyaXRlZW5kID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoZmlsZUVudHJ5KTtcclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgd3JpdGVyLm9uZXJyb3IgPSBjdXN0b21FcnJvckhhbmRsZXIoJ3dyaXRlcicpO1xyXG5cclxuICAgICAgICAgIGxvY2FsRGVmZXJyZWQucmVzb2x2ZSh3cml0ZXIpO1xyXG5cclxuICAgICAgICB9LCBsb2NhbERlZmVycmVkLnJlamVjdCk7XHJcbiAgICAgICAgcmV0dXJuIGxvY2FsRGVmZXJyZWQucHJvbWlzZTtcclxuXHJcbiAgICAgIH0sIGN1c3RvbUVycm9ySGFuZGxlcignY3JlYXRlV3JpdGVyJykpXHJcblxyXG4gICAgICAvLyBPYnRlbmVyIGVsIGFyY2hpdm8gcG9yIEFKQVggeSBlc2NyaWJpciBlbiBlbCBhcmNoaXZvXHJcbiAgICAgIC50aGVuKGZ1bmN0aW9uICh3cml0ZXIpIHtcclxuICAgICAgICBpZiAoIXdyaXRlcikgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7IFxyXG4gICAgICAgIHhoci5vcGVuKCdHRVQnLCBmcm9tVXJsLCB0cnVlKTsgXHJcbiAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdibG9iJztcclxuICAgICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZih4aHIuc3RhdHVzID09IDIwMCkge1xyXG4gICAgICAgICAgICB3aW5kb3cuYmxvYiA9IHhoci5yZXNwb25zZTtcclxuICAgICAgICAgICAgcmVxdWVzdFN0b3JhZ2VRdW90YUlmUmVxdWlyZWQoeGhyLnJlc3BvbnNlLnNpemUpLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgd3JpdGVyLndyaXRlKHhoci5yZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgYXR0cnMuY3VycmVudFVzYWdlICs9IHhoci5yZXNwb25zZS5zaXplO1xyXG4gICAgICAgICAgICB9LCBjdXN0b21FcnJvckhhbmRsZXIoJ3JlcXVlc3RTdG9yYWdlUXVvdGFJZlJlcXVpcmVkJykpO1xyXG5cclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB4aHIuc2VuZChudWxsKTtcclxuXHJcbiAgICAgIH0sIGN1c3RvbUVycm9ySGFuZGxlcignZmluaXNoJykpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjdXN0b21Eb3dubG9hZEZpbGUoKTtcclxuXHJcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuXHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZXREZXN0ICgpIHtcclxuICAgIHJldHVybiBhdHRycy5kZXN0O1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHJlYWR5OiByZWFkeSxcclxuICAgIGdldEZpbGVFbnRyeSA6IGdldEZpbGVFbnRyeSxcclxuICAgIGdldEZpbGUgOiBnZXRGaWxlLFxyXG4gICAgcmVxdWVzdFN0b3JhZ2VRdW90YTogcmVxdWVzdFN0b3JhZ2VRdW90YSxcclxuICAgIHJlcXVlc3RTdG9yYWdlUXVvdGFJZlJlcXVpcmVkOiByZXF1ZXN0U3RvcmFnZVF1b3RhSWZSZXF1aXJlZCxcclxuICAgIG1rZGlyOiBta2RpcixcclxuICAgIGRvd25sb2FkOiBkb3dubG9hZCxcclxuICAgIGdldERlc3Q6IGdldERlc3QsXHJcbiAgfTtcclxuXHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX25hbWUgPSAnb2ZmbGluZUFzc2V0c0ZzJztcclxuZXhwb3J0IGRlZmF1bHQgYW5ndWxhci5tb2R1bGUoX25hbWUsIFtdKVxyXG4gIC5mYWN0b3J5KFtfbmFtZSwgJ1NlcnZpY2UnXS5qb2luKCcnKSwgb2ZmbGluZUFzc2V0c0ZzU2VydmljZSk7XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvc2VydmljZXMvb2ZmbGluZUFzc2V0c0ZzLmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZnVuY3Rpb24gb2ZmbGluZUFzc2V0c0ZzU2VydmljZSgkcSwgJGxvZykge1xuICAnbmdJbmplY3QnO1xuXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyBBdHRyaWJ1dG9zIGdsb2JhbGVzXG5cbiAgdmFyIGF0dHJzID0ge1xuICAgIC8vIFRhbWHDsW8gZGVsIGJsb3F1ZSBkZSBtZW1vcmlhIHEgc2UgaXJhIHBpZGllbmRvIGNhZGEgdmV6IHF1ZSBzZSBzb2JyZSBwYXNlXG4gICAgLy8gbGEgY3VvdGEgZGUgYWxtYWNlbmFtaWVudG9cbiAgICBibG9ja1NpemU6IDE2ICogMTAxNCAqIDEwMjQsXG5cbiAgICAvLyBFc3BhY2lvIGRlIGxhIGN1b3RhIGRlIGFsbWFjZW5hbWllbnRvXG4gICAgY3VycmVudFF1b3RhOiAwLFxuXG4gICAgLy8gRXNwYWNpbyB1c2FkbyBkZSBsYSBjdW90YSBkZSBhbG1hY2VuYW1pZW50b1xuICAgIGN1cnJlbnRVc2FnZTogMCxcblxuICAgIC8vIEVzcGFjaW8gZGUgbGEgY3VvdGEgZGUgYWxtYWNlbmFtaWVudG9cbiAgICBkZXN0OiAnJ1xuXG4gIH07XG5cbiAgLy8gSW5zdGFuY2lhIGRlbCBtYW5lamFkb3IgZGVsIGZpbGUgc3lzdGVtXG4gIHZhciBmcyA9IG51bGw7XG5cbiAgLy8gRGVmYXJyZWRlc1xuICB2YXIgYXBpTG9hZGVkRGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICB2YXIgcXVvdGFJbmZvRGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICB2YXIgcmVhZHlEZWZlcnJlZCA9ICRxLmFsbChbYXBpTG9hZGVkRGVmZXJyZWQucHJvbWlzZSwgcXVvdGFJbmZvRGVmZXJyZWQucHJvbWlzZV0pO1xuXG4gIC8vIEFQSSBIVE1MNSBwYXJhIG1hbmVqbyBkZSBhcmNoaXZvc1xuICB2YXIgcmVxdWVzdEZpbGVTeXN0ZW0gPSB3aW5kb3cucmVxdWVzdEZpbGVTeXN0ZW0gfHwgd2luZG93LndlYmtpdFJlcXVlc3RGaWxlU3lzdGVtO1xuICB2YXIgcFN0b3JhZ2UgPSBuYXZpZ2F0b3Iud2Via2l0UGVyc2lzdGVudFN0b3JhZ2UgfHwge1xuICAgIHJlcXVlc3RRdW90YTogZnVuY3Rpb24gcmVxdWVzdFF1b3RhKCkge30sXG4gICAgcXVlcnlVc2FnZUFuZFF1b3RhOiBmdW5jdGlvbiBxdWVyeVVzYWdlQW5kUXVvdGEoKSB7fVxuICB9O1xuXG4gIC8vIExvYWQgYWN0aW9uIHdoZW4gbG9hZGVkIGZpbGVTeXN0ZW1cbiAgaWYgKHR5cGVvZiBjb3Jkb3ZhICE9PSAndW5kZWZpbmVkJykge1xuICAgICRsb2cubG9nKCdjb3Jkb3ZhIG9uJyk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZGV2aWNlcmVhZHknLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkbG9nLmxvZygnZGV2aWRlcmVhZHknKTtcbiAgICAgIHJlcXVlc3RGaWxlU3lzdGVtKExvY2FsRmlsZVN5c3RlbS5QRVJTSVNURU5ULCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICRsb2cubG9nKCdyZXF1ZXN0RmlsZVN5c3RlbScpO1xuXG4gICAgICAgIGF0dHJzLmRlc3QgPSBjb3Jkb3ZhLmZpbGUuZXh0ZXJuYWxEYXRhRGlyZWN0b3J5IHx8IGNvcmRvdmEuZmlsZS5kYXRhRGlyZWN0b3J5O1xuXG4gICAgICAgIGFwaUxvYWRlZERlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgcXVvdGFJbmZvRGVmZXJyZWQucmVzb2x2ZSgtMSwgLTEpO1xuICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBhcGlMb2FkZWREZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICAgICAgcXVvdGFJbmZvRGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgICB9KTtcbiAgICB9LCBmYWxzZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gJGxvZy5sb2coJ2NvcmRvdmEgb2ZmJyk7XG4gICAgcFN0b3JhZ2UucXVlcnlVc2FnZUFuZFF1b3RhKGZ1bmN0aW9uICh1c2VkLCBncmFudGVkKSB7XG4gICAgICAkbG9nLmxvZyhbJ3F1ZXJ5VXNhZ2VBbmRRdW90YTonLCB1c2VkLCAnLCAnLCBncmFudGVkLCAnLCAnLCBncmFudGVkIC0gdXNlZCwgJywgJywgYXR0cnMuYmxvY2tTaXplXS5qb2luKCcnKSk7XG4gICAgICBhdHRycy5jdXJyZW50UXVvdGEgPSBncmFudGVkO1xuICAgICAgYXR0cnMuY3VycmVudFVzYWdlID0gdXNlZDtcbiAgICAgIGlmIChncmFudGVkIC0gdXNlZCA8IGF0dHJzLmJsb2NrU2l6ZSAvIDIpIHtcbiAgICAgICAgcmVxdWVzdFN0b3JhZ2VRdW90YSgpLnRoZW4ocXVvdGFJbmZvRGVmZXJyZWQucmVzb2x2ZSwgcXVvdGFJbmZvRGVmZXJyZWQucmVqZWN0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHF1b3RhSW5mb0RlZmVycmVkLnJlc29sdmUodXNlZCwgZ3JhbnRlZCk7XG4gICAgICB9XG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgcXVvdGFJbmZvRGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgfSk7XG5cbiAgICByZXF1ZXN0RmlsZVN5c3RlbSh3aW5kb3cuUEVSU0lTVEVOVCwgMCwgZnVuY3Rpb24gKHBGcykge1xuICAgICAgLy8gJGxvZy5sb2coJ3JlcXVlc3RGaWxlU3lzdGVtJyk7XG4gICAgICBmcyA9IHBGcztcbiAgICAgIGFwaUxvYWRlZERlZmVycmVkLnJlc29sdmUoKTtcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBhcGlMb2FkZWREZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlYWR5RGVmZXJyZWQudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgJGxvZy5sb2coJ3JlYWR5Jyk7XG4gIH0pLmNhdGNoKCRsb2cuZXJyb3IpO1xuXG4gIGZ1bmN0aW9uIHJlYWR5KGZuKSB7XG4gICAgaWYgKCFmbikgcmV0dXJuIHJlYWR5RGVmZXJyZWQ7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgYW5ndWxhci5mb3JFYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24gKHZhbG9yKSB7XG4gICAgICAgIGFyZ3MucHVzaCh2YWxvcik7XG4gICAgICB9KTtcbiAgICAgIGFyZ3MudW5zaGlmdChkZWZlcnJlZCk7XG4gICAgICByZWFkeURlZmVycmVkLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICBmbi5hcHBseShmbiwgYXJncyk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxyXG4gICAqIENhbGwgdG8gcmVzb2x2ZSBsb2NhbCBmaWxlIHN5c3RlbVxyXG4gICAqIC0gcGF0aGZpbGU6IEZpbGUgVVJMIHRvIGdldFxyXG4gICAqL1xuICB2YXIgZ2V0RmlsZUVudHJ5ID0gcmVhZHkoZnVuY3Rpb24gKGRlZmVycmVkLCBwYXRoZmlsZSwgY3JlYXRlKSB7XG4gICAgLy8gJGxvZy5sb2coWydnZXRGaWxlRW50cnk6JywgcGF0aGZpbGVdLmpvaW4oJycpKTtcblxuICAgIC8vIElmIGNhbid0IGNoZWNrIGlmIGZpbGUgZXhpc3RzIHRoZW4gY2FsbCBzdWNjZXNzIGRpcmVjdGx5XG4gICAgaWYgKHdpbmRvdy5yZXNvbHZlTG9jYWxGaWxlU3lzdGVtVVJMKSB7XG4gICAgICB3aW5kb3cucmVzb2x2ZUxvY2FsRmlsZVN5c3RlbVVSTChwYXRoZmlsZSwgZGVmZXJyZWQucmVzb2x2ZSwgZGVmZXJyZWQucmVqZWN0KTtcbiAgICB9IGVsc2UgaWYgKGZzKSB7XG4gICAgICBmcy5yb290LmdldEZpbGUocGF0aGZpbGUsIHsgY3JlYXRlOiAhIWNyZWF0ZSB9LCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGUpO1xuICAgICAgfSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGUpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlZmVycmVkLnJlamVjdCh7XG4gICAgICAgIGNvZGU6IDAsXG4gICAgICAgIG5hbWU6ICdOb3RJbnN0YW5jZVRvR2V0RmlsZUVudHJ5JyxcbiAgICAgICAgbWVzc2FnZTogJ05vIGhhbmRsZXIgaW5zdGFuY2UgdG8gZ2V0IGZpbGUgZW50cnkgaW5zdGFuY2UnXG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIC8qKlxyXG4gICAqIEdldCBpbnN0YW5jZSBpZiBGaWxlKGNvcmRvdmEpIG9mIHBoeXN5Y2FsIGZpbGVcclxuICAgKiAtIHBhdGhmaWxlOiBVUkwgdG8gZG93bmxvYWRcclxuICAgKi9cbiAgdmFyIGdldEZpbGUgPSByZWFkeShmdW5jdGlvbiAoZGVmZXJyZWQsIHBhdGhmaWxlKSB7XG4gICAgLy8gJGxvZy5sb2coWydnZXRGaWxlOicsIHBhdGhmaWxlXS5qb2luKCcnKSk7XG5cbiAgICAvLyBDaGVjayBpZiBmaWxlIGV4aXN0LlxuICAgIGdldEZpbGVFbnRyeShwYXRoZmlsZSkudGhlbihmdW5jdGlvbiAoZmlsZUVudHJ5KSB7XG4gICAgICBmaWxlRW50cnkuZmlsZShmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHtcbiAgICAgICAgICBmaWxlRW50cnk6IGZpbGVFbnRyeSxcbiAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgIH0pO1xuICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgIH0pO1xuICB9KTtcblxuICAvLyBJbmRpY2F0ZSBpZiBhbnkgcXVvdGEgcmVxdWVzdCB3YXMgYmUgcmVqZWN0ZWRcbiAgdmFyIGFueVF1b3RhUmVxdWVzdFJlamVjdCA9IGZhbHNlO1xuXG4gIC8qKlxyXG4gICAqIFNvbGljaXRhciBlc3BhY2lvIGRlIGFsbWFjZW5hbWllbnRvXHJcbiAgICovXG4gIGZ1bmN0aW9uIHJlcXVlc3RTdG9yYWdlUXVvdGEocmVxdWlyZWRCeXRlcykge1xuXG4gICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICB2YXIgcXVvdGFSZXF1ZXN0UmVqZWN0ZWRFcnJvciA9IGZ1bmN0aW9uIHF1b3RhUmVxdWVzdFJlamVjdGVkRXJyb3IoKSB7XG4gICAgICByZXR1cm4geyBjb2RlOiAwLCBuYW1lOiAnUXVvdGFSZXF1ZXN0UmVqZWN0ZWQnIH07XG4gICAgfTtcblxuICAgIGlmIChhbnlRdW90YVJlcXVlc3RSZWplY3QpIHtcbiAgICAgIGRlZmVycmVkLnJlamVjdChxdW90YVJlcXVlc3RSZWplY3RlZEVycm9yKCkpO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgIGlmICghcmVxdWlyZWRCeXRlcykge1xuICAgICAgICByZXF1aXJlZEJ5dGVzID0gMDtcbiAgICAgIH1cblxuICAgICAgcmVxdWlyZWRCeXRlcyA9IGF0dHJzLmN1cnJlbnRRdW90YSArIE1hdGgubWF4KHJlcXVpcmVkQnl0ZXMsIGF0dHJzLmJsb2NrU2l6ZSk7XG5cbiAgICAgIHBTdG9yYWdlLnJlcXVlc3RRdW90YShyZXF1aXJlZEJ5dGVzLCBmdW5jdGlvbiAoYnl0ZXNHcmFudGVkKSB7XG4gICAgICAgIGlmICghYnl0ZXNHcmFudGVkKSB7XG4gICAgICAgICAgLy8gbG9nKFsncmVxdWVzdFF1b3RhUmVqZWN0J10pO1xuICAgICAgICAgIGFueVF1b3RhUmVxdWVzdFJlamVjdCA9IHRydWU7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHF1b3RhUmVxdWVzdFJlamVjdGVkRXJyb3IoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJGxvZy5sb2coWydyZXF1ZXN0UXVvdGFHcmFudGVkJywgYnl0ZXNHcmFudGVkXSk7XG4gICAgICAgICAgYXR0cnMuY3VycmVudFF1b3RhID0gYnl0ZXNHcmFudGVkO1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoYnl0ZXNHcmFudGVkKTtcbiAgICAgICAgfVxuICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICB9O1xuXG4gIC8qKlxyXG4gICAqIFNvbGljaXRhIG1hcyBieXRlcyBzaSBlcyBuZWNlc2FyaW9cclxuICAgKi9cbiAgZnVuY3Rpb24gcmVxdWVzdFN0b3JhZ2VRdW90YUlmUmVxdWlyZWQobmVlZGVkQnl0ZXMpIHtcblxuICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICB2YXIgbWlzc2luZ0J5dGVzID0gYXR0cnMuY3VycmVudFVzYWdlICsgbmVlZGVkQnl0ZXMgLSBhdHRycy5jdXJyZW50UXVvdGE7XG5cbiAgICBpZiAobWlzc2luZ0J5dGVzID4gMCkge1xuICAgICAgcmVxdWVzdFN0b3JhZ2VRdW90YShtaXNzaW5nQnl0ZXMgKyAxMCAqIDEwMjQpLnRoZW4oZnVuY3Rpb24gKGJ5dGVzR3JhbnRlZCkge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICB9LCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICB9XG5cbiAgLyoqXHJcbiAgICogQ3JlYXIgdW4gZGlyZWN0b3Jpb1xyXG4gICAqL1xuICBmdW5jdGlvbiBta2RpcihkaXIpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgdmFyIGRpcnMgPSBkaXIuc3BsaXQoJy8nKTtcblxuICAgIHZhciBfbWtkaXIgPSBmdW5jdGlvbiBfbWtkaXIoZm9sZGVycywgcm9vdERpckVudHJ5KSB7XG4gICAgICBpZiAoZm9sZGVyc1swXSA9PSAnLicgfHwgZm9sZGVyc1swXSA9PSAnJykge1xuICAgICAgICBmb2xkZXJzID0gZm9sZGVycy5zbGljZSgxKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFmb2xkZXJzLmxlbmd0aCkge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGRpcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcm9vdERpckVudHJ5LmdldERpcmVjdG9yeShmb2xkZXJzWzBdLCB7IGNyZWF0ZTogdHJ1ZSB9LCBmdW5jdGlvbiAoZGlyRW50cnkpIHtcbiAgICAgICAgX21rZGlyKGZvbGRlcnMuc2xpY2UoMSksIGRpckVudHJ5KTtcbiAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgX21rZGlyKGRpcnMsIGZzLnJvb3QpO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gIH1cblxuICAvKipcclxuICAgKiBSZW1vdmUgcGh5c2ljYWwgZmlsZS5cclxuICAgKiAtIHBhcmFtcy5maWxlRW50cnk6IEZpbGVFbnRyeShjb3Jkb3ZhKSBpbnN0YW5jZVxyXG4gICAqIC0gcGFyYW1zLnN1Y2Nlc3M6IGNhbGxiYWNrIHdoZW4gaXMgc3VjY2Vzc1xyXG4gICAqIC0gcGFyYW1zLmZhaWw6IGNhbGxiYWNrIHdoZW4gaXMgZmFpbFxyXG4gICAqL1xuICB2YXIgcmVtb3ZlRmlsZSA9IGZ1bmN0aW9uIHJlbW92ZUZpbGUoZmlsZUVudHJ5KSB7XG4gICAgLy8gJGxvZy5sb2coWydyZW1vdmVGaWxlJ10pO1xuICAgIGlmICghZmlsZUVudHJ5KSByZXR1cm47XG5cbiAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgZmlsZUVudHJ5LnJlbW92ZShmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgZGVmZXJyZWQucmVzb2x2ZShmaWxlRW50cnkpO1xuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gIH07XG5cbiAgLyoqXHJcbiAgICogQ2FsbCBBUEkgdG8gZG93bmxvYWQgZmlsZVxyXG4gICAqIC0gZnJvbVVybDogRXh0ZXJuYWwgVVJMIG9mIGZpbGFcclxuICAgKiAtIGxvY2FsVXJsOiBGaWxlIFVSTCB0byBnZXRcclxuICAgKi9cbiAgZnVuY3Rpb24gZG93bmxvYWQoZnJvbVVybCwgbG9jYWxVcmwpIHtcbiAgICAvLyAkbG9nLmxvZyhbJ2NhbGxEb3dubG9hZEZpbGU6JywgZnJvbVVybCwgbG9jYWxVcmxdLmpvaW4oJyAnKSk7XG5cbiAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgZnVuY3Rpb24gY3VzdG9tRXJyb3JIYW5kbGVyKG1zZykge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgaWYgKGVyci5uYW1lID09PSAnUXVvdGFFeGNlZWRlZEVycm9yJykge1xuICAgICAgICAgIHJlcXVlc3RTdG9yYWdlUXVvdGEoKS50aGVuKGN1c3RvbURvd25sb2FkRmlsZSwgZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhtc2cpO1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGN1c3RvbURvd25sb2FkRmlsZSgpIHtcblxuICAgICAgdmFyIGRpcnMgPSBsb2NhbFVybC5zcGxpdCgnLycpO1xuICAgICAgdmFyIGZpbGVuYW1lID0gZGlycy5wb3AoKTtcblxuICAgICAgLy8gQ3JlYXIgRGlyZWN0b3Jpb1xuICAgICAgJHEud2hlbigpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbWtkaXIoZGlycy5qb2luKCcvJykpO1xuICAgICAgfSwgY3VzdG9tRXJyb3JIYW5kbGVyKCdta2RpcicpKVxuXG4gICAgICAvLyBPYnRlbmVyIGVsIGZpbGVFbnRyeSBwYXJhIGJvcnJhcmxvXG4gICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBnZXRGaWxlRW50cnkobG9jYWxVcmwpO1xuICAgICAgfSwgZnVuY3Rpb24gKCkge30pXG5cbiAgICAgIC8vIE9idGVuZXIgZWwgZmlsZUVudHJ5XG4gICAgICAudGhlbihmdW5jdGlvbiAoZmlsZUVudHJ5KSB7XG4gICAgICAgIHJldHVybiByZW1vdmVGaWxlKGZpbGVFbnRyeSk7XG4gICAgICB9LCBmdW5jdGlvbiAoKSB7fSlcblxuICAgICAgLy8gT2J0ZW5lciBlbCBmaWxlRW50cnlcbiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGdldEZpbGVFbnRyeShsb2NhbFVybCwgdHJ1ZSk7XG4gICAgICB9LCBjdXN0b21FcnJvckhhbmRsZXIoJ2dldEZpbGVFbnRyeScpKVxuXG4gICAgICAvLyBPYnRlbmVyIGxhIGluc3RhbmNpYSBkZWwgd3JpdGVyIHBhcmEgZWwgYXJjaGl2b1xuICAgICAgLnRoZW4oZnVuY3Rpb24gKGZpbGVFbnRyeSkge1xuICAgICAgICBpZiAoIWZpbGVFbnRyeSkgcmV0dXJuO1xuICAgICAgICB2YXIgbG9jYWxEZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgIGZpbGVFbnRyeS5jcmVhdGVXcml0ZXIoZnVuY3Rpb24gKHdyaXRlcikge1xuXG4gICAgICAgICAgd3JpdGVyLm9ud3JpdGVlbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGZpbGVFbnRyeSk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHdyaXRlci5vbmVycm9yID0gY3VzdG9tRXJyb3JIYW5kbGVyKCd3cml0ZXInKTtcblxuICAgICAgICAgIGxvY2FsRGVmZXJyZWQucmVzb2x2ZSh3cml0ZXIpO1xuICAgICAgICB9LCBsb2NhbERlZmVycmVkLnJlamVjdCk7XG4gICAgICAgIHJldHVybiBsb2NhbERlZmVycmVkLnByb21pc2U7XG4gICAgICB9LCBjdXN0b21FcnJvckhhbmRsZXIoJ2NyZWF0ZVdyaXRlcicpKVxuXG4gICAgICAvLyBPYnRlbmVyIGVsIGFyY2hpdm8gcG9yIEFKQVggeSBlc2NyaWJpciBlbiBlbCBhcmNoaXZvXG4gICAgICAudGhlbihmdW5jdGlvbiAod3JpdGVyKSB7XG4gICAgICAgIGlmICghd3JpdGVyKSByZXR1cm47XG5cbiAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICB4aHIub3BlbignR0VUJywgZnJvbVVybCwgdHJ1ZSk7XG4gICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYmxvYic7XG4gICAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT0gMjAwKSB7XG4gICAgICAgICAgICB3aW5kb3cuYmxvYiA9IHhoci5yZXNwb25zZTtcbiAgICAgICAgICAgIHJlcXVlc3RTdG9yYWdlUXVvdGFJZlJlcXVpcmVkKHhoci5yZXNwb25zZS5zaXplKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgd3JpdGVyLndyaXRlKHhoci5yZXNwb25zZSk7XG4gICAgICAgICAgICAgIGF0dHJzLmN1cnJlbnRVc2FnZSArPSB4aHIucmVzcG9uc2Uuc2l6ZTtcbiAgICAgICAgICAgIH0sIGN1c3RvbUVycm9ySGFuZGxlcigncmVxdWVzdFN0b3JhZ2VRdW90YUlmUmVxdWlyZWQnKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHhoci5zZW5kKG51bGwpO1xuICAgICAgfSwgY3VzdG9tRXJyb3JIYW5kbGVyKCdmaW5pc2gnKSk7XG4gICAgfVxuXG4gICAgY3VzdG9tRG93bmxvYWRGaWxlKCk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldERlc3QoKSB7XG4gICAgcmV0dXJuIGF0dHJzLmRlc3Q7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHJlYWR5OiByZWFkeSxcbiAgICBnZXRGaWxlRW50cnk6IGdldEZpbGVFbnRyeSxcbiAgICBnZXRGaWxlOiBnZXRGaWxlLFxuICAgIHJlcXVlc3RTdG9yYWdlUXVvdGE6IHJlcXVlc3RTdG9yYWdlUXVvdGEsXG4gICAgcmVxdWVzdFN0b3JhZ2VRdW90YUlmUmVxdWlyZWQ6IHJlcXVlc3RTdG9yYWdlUXVvdGFJZlJlcXVpcmVkLFxuICAgIG1rZGlyOiBta2RpcixcbiAgICBkb3dubG9hZDogZG93bmxvYWQsXG4gICAgZ2V0RGVzdDogZ2V0RGVzdFxuICB9O1xufVxuXG52YXIgX25hbWUgPSBleHBvcnRzLl9uYW1lID0gJ29mZmxpbmVBc3NldHNGcyc7XG5leHBvcnRzLmRlZmF1bHQgPSBhbmd1bGFyLm1vZHVsZShfbmFtZSwgW10pLmZhY3RvcnkoW19uYW1lLCAnU2VydmljZSddLmpvaW4oJycpLCBvZmZsaW5lQXNzZXRzRnNTZXJ2aWNlKTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9zZXJ2aWNlcy9vZmZsaW5lQXNzZXRzRnMuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiB3b3JrKCRxLCAkbG9nKSB7ICduZ0luamVjdCc7XHJcblxyXG4gIHJldHVybiBmdW5jdGlvbiAoY2IpIHsgdmFyICBzZWxmID0gdGhpcztcclxuICAgIFxyXG4gICAgdmFyIGl0ZW1zID0ge307IC8vIEVsZW1lbnRvIGRlIGxhIGNvbGFcclxuICAgIHZhciBpZHhzID0gW107ICAvLyBJbmRpY2VzIGRlIGxhIGNvbGFcclxuICAgIHZhciBfd29ya2luZyA9IGZhbHNlOyAvLyBJbmRpY2Egc2kgbGEgY29sYSBlc3RhIHRyYWJhamFuZG9cclxuICAgIHZhciBfc3RhcnRlZCA9IGZhbHNlOyAvLyBJbmRpY2Egc2kgZWwgdHJhYmFqbyBzZSBpbmljaW9cclxuXHJcbiAgICAvLyBBZ3JlZ2EgdW4gZWxlbWVudG8gYSBsYSBjb2xhXHJcbiAgICBzZWxmLmFkZCA9IGZ1bmN0aW9uIChpZHgsIGl0ZW0pIHtcclxuICAgICAgaXRlbXNbaWR4XSA9IGl0ZW07XHJcbiAgICAgIGlkeHMucHVzaChpZHgpO1xyXG4gICAgICBcclxuICAgICAgLy8gSW5pY2lhciBlbCB0cmFiYWpvXHJcbiAgICAgIGlmICghX3dvcmtpbmcpIHtcclxuICAgICAgICBfd29ya2luZyA9IHRydWU7XHJcbiAgICAgICAgLy8gU2kgeWEgc2UgaW5pY2lvIGVudG9uY2UgaW5pY2FyIGxhIGRlc2NhcmdhXHJcbiAgICAgICAgaWYgKF9zdGFydGVkKSB7XHJcbiAgICAgICAgICBzZWxmLm5leHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEluaWNpYSBlbCB0cmFiYWpvIGRlIGxhIGNvbGFcclxuICAgIHNlbGYuc3RhcnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIF9zdGFydGVkID0gdHJ1ZTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gRGV2dWVsdmUgc2kgbGEgY29sYSBlc3RhIHByb2Nlc2FuZG9cclxuICAgIHNlbGYud29ya2luZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIF93b3JraW5nO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBEZXZ1ZWx2ZSBzaSBsYSBjb2xhIGVzdGEgcHJvY2VzYW5kb1xyXG4gICAgc2VsZi5zdGFydGVkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gX3N0YXJ0ZWQ7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIERldnVlbHZlIHVuIGVsZW1lbnRvIHBvciBlbCBJRFhcclxuICAgIHNlbGYuZ2V0ID0gZnVuY3Rpb24gKGlkeCkge1xyXG4gICAgICByZXR1cm4gaXRlbXNbaWR4XTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gUHJvY2VzYSBlbCBzaWd1aWVudGUgZWxlbWVudG8gZGUgbGEgY29sYVxyXG4gICAgc2VsZi5uZXh0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIF93b3JraW5nID0gISFpZHhzLmxlbmd0aDtcclxuICAgICAgaWYgKCFfd29ya2luZykgcmV0dXJuO1xyXG4gICAgICB2YXIgaWR4ID0gaWR4cy5zaGlmdCgpO1xyXG4gICAgICB2YXIgaXRlbSA9IGl0ZW1zW2lkeF07XHJcbiAgICAgIGNiKGlkeCwgaXRlbSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHNlbGYubmV4dCgpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX25hbWUgPSAnd29yayc7XHJcbmV4cG9ydCBkZWZhdWx0IGFuZ3VsYXIubW9kdWxlKF9uYW1lLCBbXSlcclxuICAuZmFjdG9yeShbX25hbWVdLmpvaW4oJycpLCB3b3JrKTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9zZXJ2aWNlcy93b3JrLmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZnVuY3Rpb24gd29yaygkcSwgJGxvZykge1xuICAnbmdJbmplY3QnO1xuXG4gIHJldHVybiBmdW5jdGlvbiAoY2IpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB2YXIgaXRlbXMgPSB7fTsgLy8gRWxlbWVudG8gZGUgbGEgY29sYVxuICAgIHZhciBpZHhzID0gW107IC8vIEluZGljZXMgZGUgbGEgY29sYVxuICAgIHZhciBfd29ya2luZyA9IGZhbHNlOyAvLyBJbmRpY2Egc2kgbGEgY29sYSBlc3RhIHRyYWJhamFuZG9cbiAgICB2YXIgX3N0YXJ0ZWQgPSBmYWxzZTsgLy8gSW5kaWNhIHNpIGVsIHRyYWJham8gc2UgaW5pY2lvXG5cbiAgICAvLyBBZ3JlZ2EgdW4gZWxlbWVudG8gYSBsYSBjb2xhXG4gICAgc2VsZi5hZGQgPSBmdW5jdGlvbiAoaWR4LCBpdGVtKSB7XG4gICAgICBpdGVtc1tpZHhdID0gaXRlbTtcbiAgICAgIGlkeHMucHVzaChpZHgpO1xuXG4gICAgICAvLyBJbmljaWFyIGVsIHRyYWJham9cbiAgICAgIGlmICghX3dvcmtpbmcpIHtcbiAgICAgICAgX3dvcmtpbmcgPSB0cnVlO1xuICAgICAgICAvLyBTaSB5YSBzZSBpbmljaW8gZW50b25jZSBpbmljYXIgbGEgZGVzY2FyZ2FcbiAgICAgICAgaWYgKF9zdGFydGVkKSB7XG4gICAgICAgICAgc2VsZi5uZXh0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gSW5pY2lhIGVsIHRyYWJham8gZGUgbGEgY29sYVxuICAgIHNlbGYuc3RhcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBfc3RhcnRlZCA9IHRydWU7XG4gICAgfTtcblxuICAgIC8vIERldnVlbHZlIHNpIGxhIGNvbGEgZXN0YSBwcm9jZXNhbmRvXG4gICAgc2VsZi53b3JraW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIF93b3JraW5nO1xuICAgIH07XG5cbiAgICAvLyBEZXZ1ZWx2ZSBzaSBsYSBjb2xhIGVzdGEgcHJvY2VzYW5kb1xuICAgIHNlbGYuc3RhcnRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBfc3RhcnRlZDtcbiAgICB9O1xuXG4gICAgLy8gRGV2dWVsdmUgdW4gZWxlbWVudG8gcG9yIGVsIElEWFxuICAgIHNlbGYuZ2V0ID0gZnVuY3Rpb24gKGlkeCkge1xuICAgICAgcmV0dXJuIGl0ZW1zW2lkeF07XG4gICAgfTtcblxuICAgIC8vIFByb2Nlc2EgZWwgc2lndWllbnRlIGVsZW1lbnRvIGRlIGxhIGNvbGFcbiAgICBzZWxmLm5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBfd29ya2luZyA9ICEhaWR4cy5sZW5ndGg7XG4gICAgICBpZiAoIV93b3JraW5nKSByZXR1cm47XG4gICAgICB2YXIgaWR4ID0gaWR4cy5zaGlmdCgpO1xuICAgICAgdmFyIGl0ZW0gPSBpdGVtc1tpZHhdO1xuICAgICAgY2IoaWR4LCBpdGVtLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYubmV4dCgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfTtcbn1cblxudmFyIF9uYW1lID0gZXhwb3J0cy5fbmFtZSA9ICd3b3JrJztcbmV4cG9ydHMuZGVmYXVsdCA9IGFuZ3VsYXIubW9kdWxlKF9uYW1lLCBbXSkuZmFjdG9yeShbX25hbWVdLmpvaW4oJycpLCB3b3JrKTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9zZXJ2aWNlcy93b3JrLmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gb2FTcmNEaXJlY3RpdmUob2ZmbGluZUFzc2V0c1NlcnZpY2UsICR0aW1lb3V0KSB7ICduZ0luamVjdCc7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICBzY29wZToge1xyXG4gICAgICB1cmw6ICc9b2FTcmMnLFxyXG4gICAgICBsb2NhbFVybDogJz1vYUxvY2FsVXJsJyxcclxuICAgIH0sXHJcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIGNiKHVybCkge1xyXG4gICAgICAgIHNjb3BlLmxvY2FsVXJsID0gdXJsO1xyXG4gICAgICAgIC8vIFNldCBzcmMgdG8gaW1hZ2UgYXR0cnNcclxuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgZWxlbWVudC5hdHRyKCdzcmMnLCB1cmwpO1xyXG4gICAgICAgIH0sIDEwKTtcclxuICAgICAgfVxyXG4gICAgICBvZmZsaW5lQXNzZXRzU2VydmljZS5kb3dubG9hZChzY29wZS51cmwsIGNiKTtcclxuICAgICAgZWxlbWVudC5vbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgb2ZmbGluZUFzc2V0c1NlcnZpY2UucmVsZWFzZShzY29wZS51cmwsIGNiKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG4gIH07XHJcbn07XHJcblxyXG5pbXBvcnQgeyBfbmFtZSBhcyBvZmZsaW5lQXNzZXRzIH0gZnJvbSAnLi4vc2VydmljZXMvb2ZmbGluZUFzc2V0cyc7XHJcblxyXG5leHBvcnQgdmFyIF9uYW1lID0gJ29hU3JjJztcclxuZXhwb3J0IGRlZmF1bHQgYW5ndWxhci5tb2R1bGUoX25hbWUsIFtcclxuICBvZmZsaW5lQXNzZXRzXHJcbl0pXHJcbiAgLmRpcmVjdGl2ZShfbmFtZSwgb2FTcmNEaXJlY3RpdmUpO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2RpcmVjdGl2ZXMvb2FTcmMuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLl9uYW1lID0gdW5kZWZpbmVkO1xuXG52YXIgX29mZmxpbmVBc3NldHMgPSByZXF1aXJlKCcuLi9zZXJ2aWNlcy9vZmZsaW5lQXNzZXRzJyk7XG5cbmZ1bmN0aW9uIG9hU3JjRGlyZWN0aXZlKG9mZmxpbmVBc3NldHNTZXJ2aWNlLCAkdGltZW91dCkge1xuICAnbmdJbmplY3QnO1xuXG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICBzY29wZToge1xuICAgICAgdXJsOiAnPW9hU3JjJyxcbiAgICAgIGxvY2FsVXJsOiAnPW9hTG9jYWxVcmwnXG4gICAgfSxcbiAgICBsaW5rOiBmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXG4gICAgICBmdW5jdGlvbiBjYih1cmwpIHtcbiAgICAgICAgc2NvcGUubG9jYWxVcmwgPSB1cmw7XG4gICAgICAgIC8vIFNldCBzcmMgdG8gaW1hZ2UgYXR0cnNcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGVsZW1lbnQuYXR0cignc3JjJywgdXJsKTtcbiAgICAgICAgfSwgMTApO1xuICAgICAgfVxuICAgICAgb2ZmbGluZUFzc2V0c1NlcnZpY2UuZG93bmxvYWQoc2NvcGUudXJsLCBjYik7XG4gICAgICBlbGVtZW50Lm9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgb2ZmbGluZUFzc2V0c1NlcnZpY2UucmVsZWFzZShzY29wZS51cmwsIGNiKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn07XG5cbnZhciBfbmFtZSA9IGV4cG9ydHMuX25hbWUgPSAnb2FTcmMnO1xuZXhwb3J0cy5kZWZhdWx0ID0gYW5ndWxhci5tb2R1bGUoX25hbWUsIFtfb2ZmbGluZUFzc2V0cy5fbmFtZV0pLmRpcmVjdGl2ZShfbmFtZSwgb2FTcmNEaXJlY3RpdmUpO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2RpcmVjdGl2ZXMvb2FTcmMuanNcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9