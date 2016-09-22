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
	        if (scope.localUrl) {
	          scope.localUrl = url;
	        }
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
	        if (scope.localUrl) {
	          scope.localUrl = url;
	        }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgODQ0MjE5OWFiZGVmMjI0MjdmNjgiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9kaXJlY3RpdmVzL29hQmcuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2RpcmVjdGl2ZXMvb2FCZy5qcz8xN2ViIiwid2VicGFjazovLy8uL3NyYy9zZXJ2aWNlcy9vZmZsaW5lQXNzZXRzLmpzIiwid2VicGFjazovLy8uL3NyYy9zZXJ2aWNlcy9vZmZsaW5lQXNzZXRzLmpzPzViNWMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3NlcnZpY2VzL29mZmxpbmVBc3NldHNGcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvc2VydmljZXMvb2ZmbGluZUFzc2V0c0ZzLmpzPzU5OTQiLCJ3ZWJwYWNrOi8vLy4vc3JjL3NlcnZpY2VzL3dvcmsuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3NlcnZpY2VzL3dvcmsuanM/MjQ2ZCIsIndlYnBhY2s6Ly8vLi9zcmMvZGlyZWN0aXZlcy9vYVNyYy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvZGlyZWN0aXZlcy9vYVNyYy5qcz80NGRiIl0sIm5hbWVzIjpbImFuZ3VsYXIiLCJtb2R1bGUiLCJjb25zdGFudCIsIm9hQmdEaXJlY3RpdmUiLCJvZmZsaW5lQXNzZXRzU2VydmljZSIsIiR0aW1lb3V0IiwicmVzdHJpY3QiLCJzY29wZSIsInVybCIsImxvY2FsVXJsIiwibGluayIsImVsZW1lbnQiLCJhdHRycyIsImRvd25sb2FkIiwiY3NzIiwiX25hbWUiLCJkaXJlY3RpdmUiLCJvZmZsaW5lQXNzZXRzRnNTZXJ2aWNlIiwid29yayIsIiRxIiwiJGxvZyIsIiRodHRwIiwiZnMiLCJyZXNvbHZlZFVybCIsIml0ZW0iLCIkcmVzb2x2ZWRVcmwiLCIkdmVyc2lvbiIsIiRjYnMiLCJmb3JFYWNoIiwiY2IiLCJkZXN0IiwiZ2V0RmlsZU5hbWVUbyIsImNvbmNhdCIsImdldERlc3QiLCJzcGxpdCIsImhvc3QiLCJwYXRobmFtZSIsImZpbHRlciIsInZhbG9yIiwidHJpbSIsImpvaW4iLCJxdWV1ZSIsImlkeCIsIm5leHQiLCJwYXRoZmlsZSIsIiR1cmwiLCJ0aGVuIiwiZmlsZUVudHJ5IiwibG9nIiwidG9VUkwiLCJjYXRjaCIsImVyciIsImVycm9yIiwiZ2V0IiwiYWRkVG9RdWV1ZSIsImFkZCIsInN0YXJ0ZWQiLCJzdGFydCIsIlVSTCIsImUiLCJsb2NhdGlvbiIsIm9yaWdpbiIsInBvcCIsInRvU3RyaW5nIiwicmVhZHkiLCJnZXRGaWxlIiwiZmYiLCJoZWFkIiwicmVzIiwiaXNVcGRhdGUiLCJoZWFkZXJzIiwiZmlsZSIsInNpemUiLCJwYXJzZUludCIsImxhc3RNb2RpZmllZERhdGUiLCJEYXRlIiwicHVzaCIsInJlbGVhc2UiLCJpbmRleE9mIiwic3BsaWNlIiwic2V0RGVzdCIsInBEZXN0Iiwic2V0RGlyIiwiZmFjdG9yeSIsImJsb2NrU2l6ZSIsImN1cnJlbnRRdW90YSIsImN1cnJlbnRVc2FnZSIsImFwaUxvYWRlZERlZmVycmVkIiwiZGVmZXIiLCJxdW90YUluZm9EZWZlcnJlZCIsInJlYWR5RGVmZXJyZWQiLCJhbGwiLCJwcm9taXNlIiwicmVxdWVzdEZpbGVTeXN0ZW0iLCJ3aW5kb3ciLCJ3ZWJraXRSZXF1ZXN0RmlsZVN5c3RlbSIsInBTdG9yYWdlIiwibmF2aWdhdG9yIiwid2Via2l0UGVyc2lzdGVudFN0b3JhZ2UiLCJyZXF1ZXN0UXVvdGEiLCJxdWVyeVVzYWdlQW5kUXVvdGEiLCJjb3Jkb3ZhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiTG9jYWxGaWxlU3lzdGVtIiwiUEVSU0lTVEVOVCIsImV4dGVybmFsRGF0YURpcmVjdG9yeSIsImRhdGFEaXJlY3RvcnkiLCJyZXNvbHZlIiwicmVqZWN0IiwidXNlZCIsImdyYW50ZWQiLCJyZXF1ZXN0U3RvcmFnZVF1b3RhIiwicEZzIiwiZm4iLCJkZWZlcnJlZCIsImFyZ3MiLCJhcmd1bWVudHMiLCJ1bnNoaWZ0IiwiYXBwbHkiLCJnZXRGaWxlRW50cnkiLCJjcmVhdGUiLCJyZXNvbHZlTG9jYWxGaWxlU3lzdGVtVVJMIiwicm9vdCIsImNvZGUiLCJuYW1lIiwibWVzc2FnZSIsImFueVF1b3RhUmVxdWVzdFJlamVjdCIsInJlcXVpcmVkQnl0ZXMiLCJxdW90YVJlcXVlc3RSZWplY3RlZEVycm9yIiwiTWF0aCIsIm1heCIsImJ5dGVzR3JhbnRlZCIsInJlcXVlc3RTdG9yYWdlUXVvdGFJZlJlcXVpcmVkIiwibmVlZGVkQnl0ZXMiLCJtaXNzaW5nQnl0ZXMiLCJta2RpciIsImRpciIsImRpcnMiLCJfbWtkaXIiLCJmb2xkZXJzIiwicm9vdERpckVudHJ5Iiwic2xpY2UiLCJsZW5ndGgiLCJnZXREaXJlY3RvcnkiLCJkaXJFbnRyeSIsInJlbW92ZUZpbGUiLCJyZW1vdmUiLCJmcm9tVXJsIiwiY3VzdG9tRXJyb3JIYW5kbGVyIiwibXNnIiwiY3VzdG9tRG93bmxvYWRGaWxlIiwiY29uc29sZSIsImZpbGVuYW1lIiwid2hlbiIsImxvY2FsRGVmZXJyZWQiLCJjcmVhdGVXcml0ZXIiLCJ3cml0ZXIiLCJvbndyaXRlZW5kIiwib25lcnJvciIsInhociIsIlhNTEh0dHBSZXF1ZXN0Iiwib3BlbiIsInJlc3BvbnNlVHlwZSIsIm9ubG9hZCIsInN0YXR1cyIsImJsb2IiLCJyZXNwb25zZSIsIndyaXRlIiwic2VuZCIsInNlbGYiLCJpdGVtcyIsImlkeHMiLCJfd29ya2luZyIsIl9zdGFydGVkIiwid29ya2luZyIsInNoaWZ0Iiwib2FTcmNEaXJlY3RpdmUiLCJhdHRyIiwib24iXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7O0FDdENBOztBQUVBOztBQUNBOztB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QUlNLEtBQUlkLHdCQUFRO0FDT25CLFNBQVEsVUROT2YsUUFBUUMsT0FBT2MsT0FBTyx3QkFHbENDLFVBQVVELE9BQU9rSyxnQiIsImZpbGUiOiJuZy1vZmZsaW5lLWFzc2V0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgODQ0MjE5OWFiZGVmMjI0MjdmNjhcbiAqKi8iLCIndXNlIHN0cmljdCc7XHJcblxyXG5pbXBvcnQgeyBfbmFtZSBhcyBvYUJnIH0gZnJvbSAnLi9kaXJlY3RpdmVzL29hQmcnO1xyXG5pbXBvcnQgeyBfbmFtZSBhcyBvYVNyYyB9IGZyb20gJy4vZGlyZWN0aXZlcy9vYVNyYyc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnbmdPZmZsaW5lQXNzZXRzJywgW1xyXG4gIG9hQmcsXHJcbiAgb2FTcmNcclxuXSlcclxuXHJcbi5jb25zdGFudCgnT0FfVkVSU0lPTicsICcwLjAuMScpXHJcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2luZGV4LmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gb2FCZ0RpcmVjdGl2ZShvZmZsaW5lQXNzZXRzU2VydmljZSwgJHRpbWVvdXQpIHsgJ25nSW5qZWN0JztcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgIHNjb3BlOiB7XHJcbiAgICAgIHVybDogJz1vYUJnJyxcclxuICAgICAgbG9jYWxVcmw6ICc9b2FMb2NhbFVybCcsXHJcbiAgICB9LFxyXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgIG9mZmxpbmVBc3NldHNTZXJ2aWNlLmRvd25sb2FkKHNjb3BlLnVybCwgZnVuY3Rpb24gKHVybCkge1xyXG4gICAgICAgIGlmIChzY29wZS5sb2NhbFVybCl7XHJcbiAgICAgICAgICBzY29wZS5sb2NhbFVybCA9IHVybDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gU2V0IHNyYyB0byBpbWFnZSBhdHRyc1xyXG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICBlbGVtZW50LmNzcygnYmFja2dyb3VuZC1pbWFnZScsICd1cmwoJyArIHVybCArICcpJyk7XHJcbiAgICAgICAgfSwgMTApO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9O1xyXG59O1xyXG5cclxuaW1wb3J0IHsgX25hbWUgYXMgb2ZmbGluZUFzc2V0cyB9IGZyb20gJy4uL3NlcnZpY2VzL29mZmxpbmVBc3NldHMnO1xyXG5cclxuZXhwb3J0IHZhciBfbmFtZSA9ICdvYUJnJztcclxuZXhwb3J0IGRlZmF1bHQgYW5ndWxhci5tb2R1bGUoX25hbWUsIFtcclxuICBvZmZsaW5lQXNzZXRzXHJcbl0pXHJcbiAgLmRpcmVjdGl2ZShfbmFtZSwgb2FCZ0RpcmVjdGl2ZSk7XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvZGlyZWN0aXZlcy9vYUJnLmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5fbmFtZSA9IHVuZGVmaW5lZDtcblxudmFyIF9vZmZsaW5lQXNzZXRzID0gcmVxdWlyZSgnLi4vc2VydmljZXMvb2ZmbGluZUFzc2V0cycpO1xuXG5mdW5jdGlvbiBvYUJnRGlyZWN0aXZlKG9mZmxpbmVBc3NldHNTZXJ2aWNlLCAkdGltZW91dCkge1xuICAnbmdJbmplY3QnO1xuXG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICBzY29wZToge1xuICAgICAgdXJsOiAnPW9hQmcnLFxuICAgICAgbG9jYWxVcmw6ICc9b2FMb2NhbFVybCdcbiAgICB9LFxuICAgIGxpbms6IGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICBvZmZsaW5lQXNzZXRzU2VydmljZS5kb3dubG9hZChzY29wZS51cmwsIGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgaWYgKHNjb3BlLmxvY2FsVXJsKSB7XG4gICAgICAgICAgc2NvcGUubG9jYWxVcmwgPSB1cmw7XG4gICAgICAgIH1cbiAgICAgICAgLy8gU2V0IHNyYyB0byBpbWFnZSBhdHRyc1xuICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZWxlbWVudC5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCAndXJsKCcgKyB1cmwgKyAnKScpO1xuICAgICAgICB9LCAxMCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59O1xuXG52YXIgX25hbWUgPSBleHBvcnRzLl9uYW1lID0gJ29hQmcnO1xuZXhwb3J0cy5kZWZhdWx0ID0gYW5ndWxhci5tb2R1bGUoX25hbWUsIFtfb2ZmbGluZUFzc2V0cy5fbmFtZV0pLmRpcmVjdGl2ZShfbmFtZSwgb2FCZ0RpcmVjdGl2ZSk7XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvZGlyZWN0aXZlcy9vYUJnLmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gb2ZmbGluZUFzc2V0c1NlcnZpY2Uob2ZmbGluZUFzc2V0c0ZzU2VydmljZSwgd29yaywgJHEsICRsb2csICRodHRwKSB7ICduZ0luamVjdCc7XHJcbiAgdmFyIGZzID0gb2ZmbGluZUFzc2V0c0ZzU2VydmljZTtcclxuXHJcbiAgLy8gUmVhbGl6YSBlbCBsbGFtYWRvIGRlIHVuYSBsaXN0YSBkZSBjYWxsYmFja3MgcGFzYW5kbyBwb3IgcGFyYW1ldHJvIHVuYSB1cmxcclxuICBmdW5jdGlvbiByZXNvbHZlZFVybChpdGVtLCB1cmwpe1xyXG4gICAgaXRlbS4kcmVzb2x2ZWRVcmwgPSB1cmwgKyAnPycgKyBpdGVtLiR2ZXJzaW9uKys7XHJcbiAgICBpdGVtLiRjYnMgPSBpdGVtLiRjYnMgfHwgW107XHJcbiAgICBhbmd1bGFyLmZvckVhY2goaXRlbS4kY2JzLCBmdW5jdGlvbiAoY2IpIHtcclxuICAgICAgaWYoY2IpIGNiKGl0ZW0uJHJlc29sdmVkVXJsKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgdmFyIGRlc3QgPSBudWxsO1xyXG5cclxuICB2YXIgZ2V0RmlsZU5hbWVUbyA9IGZ1bmN0aW9uICh1cmwpIHtcclxuXHJcbiAgICByZXR1cm4gW11cclxuICAgICAgLmNvbmNhdCgoZnMuZ2V0RGVzdCgpIHx8ICcvJykuc3BsaXQoJy8nKSlcclxuICAgICAgLmNvbmNhdChkZXN0IHx8IFtdKVxyXG4gICAgICAuY29uY2F0KHVybC5ob3N0LnNwbGl0KCc6JykpXHJcbiAgICAgIC5jb25jYXQodXJsLnBhdGhuYW1lLnNwbGl0KCcvJykpXHJcbiAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHZhbG9yKSB7XHJcbiAgICAgICAgcmV0dXJuICh2YWxvciB8fCAnJykudHJpbSgpICE9ICcnO1xyXG4gICAgICB9KVxyXG4gICAgICAuam9pbignLycpO1xyXG5cclxuICB9O1xyXG4gIFxyXG4gIC8vIExpc3RhIGRlIGRlc2Nhcmdhc1xyXG4gIHZhciBxdWV1ZSA9IG5ldyB3b3JrKGZ1bmN0aW9uIChpZHgsIGl0ZW0sIG5leHQpIHtcclxuICAgIHZhciBwYXRoZmlsZSA9IGdldEZpbGVOYW1lVG8oaXRlbS4kdXJsKTtcclxuICAgIGZzLmRvd25sb2FkKGl0ZW0uJHVybCwgcGF0aGZpbGUpLnRoZW4oZnVuY3Rpb24gKGZpbGVFbnRyeSkge1xyXG4gICAgICAkbG9nLmxvZyhbJ2Rvd25sb2FkZWQ6JyxpdGVtLiR1cmxdLmpvaW4oJycpKTtcclxuICAgICAgcmVzb2x2ZWRVcmwoaXRlbSwgZmlsZUVudHJ5LnRvVVJMKCkpO1xyXG4gICAgICBuZXh0KCk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgJGxvZy5lcnJvcihbaWR4LCBlcnJdKTtcclxuICAgICAgbmV4dCgpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG5cclxuICAvLyBGdW5jaW9uYSBwYXJhIGluaWNhciBsYSBkZXNjYXJnYSBkZSB1biBhcmNoaXZvXHJcbiAgZnVuY3Rpb24gZG93bmxvYWQgKHVybCwgY2IpIHtcclxuICAgIC8vICRsb2cubG9nKFsnZG93bmxvYWQ6JywgdXJsXS5qb2luKCcnKSk7XHJcblxyXG4gICAgLy8gT2J0ZW5lciBlbGVtZW50byBjb3JyZXNwb25kaWVudGUgYSBsYSBVUkxcclxuICAgIHZhciBpdGVtID0gcXVldWUuZ2V0KHVybCk7XHJcblxyXG4gICAgLy8gTm8gZXhpc3RlIHVuIGVsZW1lbnRvIHBhcmEgbGEgVVJMXHJcbiAgICBpZiAoIWl0ZW0pIHtcclxuXHJcbiAgICAgIC8vIENyZWFyIGVsIGVsZW1lbnRvXHJcbiAgICAgIGl0ZW0gPSB7fTtcclxuICAgICAgaXRlbS4kdmVyc2lvbiA9IDE7XHJcblxyXG4gICAgICB0cnl7XHJcbiAgICAgICAgaXRlbS4kdXJsID0gbmV3IFVSTCh1cmwpO1xyXG4gICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgaXRlbS4kdXJsID0gKGxvY2F0aW9uLm9yaWdpbiArIGxvY2F0aW9uLnBhdGhuYW1lKS5zcGxpdCgnLycpO1xyXG4gICAgICAgIGl0ZW0uJHVybC5wb3AoKTtcclxuICAgICAgICBpdGVtLiR1cmwgPSBpdGVtLiR1cmwuam9pbignLycpICsgdXJsO1xyXG4gICAgICAgIGl0ZW0uJHVybCA9IG5ldyBVUkwoaXRlbS4kdXJsKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdXJsID0gaXRlbS4kdXJsLnRvU3RyaW5nKCk7XHJcblxyXG4gICAgICBpdGVtLiRjYnMgPSBbXTsgLy8gTGlzdGEgZGUgY2FsbGJhY2tzIGRlbCBlbGVtZW50b1xyXG4gICAgICAgIFxyXG4gICAgICBmdW5jdGlvbiBhZGRUb1F1ZXVlICgpIHtcclxuICAgICAgICAvLyBBZ3JlZ2FyIGFsIGFyY2hpdm8gZGUgZGVzY2FyZ2FzXHJcbiAgICAgICAgcXVldWUuYWRkKHVybCwgaXRlbSk7XHJcbiAgICAgICAgLy8gU2kgbm8gc2UgaGEgaW5pY2lhZG8gbGEgZGVzY2FyZ2FyIGluaWNpYXJsYSBhbCB0ZXJtaW5hciBsYSBjYXJnYVxyXG4gICAgICAgIC8vIGRlbCBGUy5cclxuICAgICAgICBpZiAoIXF1ZXVlLnN0YXJ0ZWQoKSkge1xyXG4gICAgICAgICAgcXVldWUuc3RhcnQoKTtcclxuICAgICAgICAgIHF1ZXVlLm5leHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZzLnJlYWR5KCkudGhlbihmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHZhciBwYXRoZmlsZSA9IGdldEZpbGVOYW1lVG8oaXRlbS4kdXJsKTtcclxuICAgICAgICAvLyBPYnRlbmVyIGxhIGluc3RhbmNpYSBkZWwgYXJjaGl2b1xyXG4gICAgICAgIGZzLmdldEZpbGUocGF0aGZpbGUpLnRoZW4oZnVuY3Rpb24gKGZmKSB7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHJlc29sdmVkVXJsKGl0ZW0sIGZmLmZpbGVFbnRyeS50b1VSTCgpKTtcclxuXHJcbiAgICAgICAgICAvLyBPYnRlbmVyIGxhcyBjYWJlY2VyYXMgZGVsIGFyY2hpdm9cclxuICAgICAgICAgICRodHRwLmhlYWQodXJsKS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBpc1VwZGF0ZSA9ICghcmVzLmhlYWRlcnMoJ2NvbnRlbnQtbGVuZ3RoJykgfHwgZmYuZmlsZS5zaXplID09IHBhcnNlSW50KHJlcy5oZWFkZXJzKCdjb250ZW50LWxlbmd0aCcpKSkgJiZcclxuICAgICAgICAgICAgICAoIXJlcy5oZWFkZXJzKCdsYXN0LW1vZGlmaWVkJykgfHwgZmYuZmlsZS5sYXN0TW9kaWZpZWREYXRlID4gbmV3IERhdGUocmVzLmhlYWRlcnMoJ2xhc3QtbW9kaWZpZWQnKSkpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFpc1VwZGF0ZSkge1xyXG4gICAgICAgICAgICAgIGFkZFRvUXVldWUoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICAvLyBTaSBubyBleGlzdGUgZWwgYXJjaGl2b1xyXG4gICAgICAgIC5jYXRjaChhZGRUb1F1ZXVlKTtcclxuICAgICAgICBcclxuICAgICAgfSk7XHJcblxyXG4gICAgfSBlbHNlIGlmIChpdGVtLiRyZXNvbHZlZFVybCl7XHJcbiAgICAgIGNiKGl0ZW0uJHJlc29sdmVkVXJsKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBZ3JlZ2FyIGVsIGNiIHJlY2liaWRvIHBvciBwYXLDoW1ldHJvIGEgbGEgbGlzdGEgZGUgY2FsbGJhY2tzXHJcbiAgICBpdGVtLiRjYnMucHVzaChjYik7XHJcblxyXG4gIH1cclxuXHJcbiAgLy8gUmVtdWV2ZSB1biBjYlxyXG4gIGZ1bmN0aW9uIHJlbGVhc2UgKHVybCwgY2IpIHtcclxuXHJcbiAgICB2YXIgaXRlbSA9IHF1ZXVlLmdldCh1cmwpO1xyXG4gICAgaWYgKGl0ZW0pIHtcclxuICAgICAgdmFyIGlkeCA9IGl0ZW0uJGNicy5pbmRleE9mKGNiKTtcclxuICAgICAgaWYgKGlkeCAhPSAtMSkgaXRlbS4kY2JzLnNwbGljZShpZHgsIDEpO1xyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG4gIC8vIEFzaWduYSBlbCBkaXJlY3RvcmlvIGRlc3Rpbm8gcGFyYSBsb3MgYXJjaGl2b3NcclxuICBmdW5jdGlvbiBzZXREZXN0IChwRGVzdCkge1xyXG5cclxuICAgIGRlc3QgPSBwRGVzdDtcclxuXHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgZG93bmxvYWQgOiBkb3dubG9hZCxcclxuICAgIHJlbGVhc2UgOiByZWxlYXNlLFxyXG4gICAgc2V0RGlyOiBzZXREZXN0LFxyXG4gIH07XHJcblxyXG59XHJcblxyXG5pbXBvcnQgeyBfbmFtZSBhcyBvZmZsaW5lQXNzZXRzRnMgfSBmcm9tICcuL29mZmxpbmVBc3NldHNGcyc7XHJcbmltcG9ydCB7IF9uYW1lIGFzIHdvcmsgfSBmcm9tICcuL3dvcmsnO1xyXG5cclxuZXhwb3J0IHZhciBfbmFtZSA9ICdvZmZsaW5lQXNzZXRzJztcclxuZXhwb3J0IGRlZmF1bHQgYW5ndWxhci5tb2R1bGUoX25hbWUsIFtcclxuICBvZmZsaW5lQXNzZXRzRnMsXHJcbiAgd29ya1xyXG5dKVxyXG4gIC5mYWN0b3J5KFtfbmFtZSwgJ1NlcnZpY2UnXS5qb2luKCcnKSwgb2ZmbGluZUFzc2V0c1NlcnZpY2UpO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3NlcnZpY2VzL29mZmxpbmVBc3NldHMuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLl9uYW1lID0gdW5kZWZpbmVkO1xuXG52YXIgX29mZmxpbmVBc3NldHNGcyA9IHJlcXVpcmUoJy4vb2ZmbGluZUFzc2V0c0ZzJyk7XG5cbnZhciBfd29yayA9IHJlcXVpcmUoJy4vd29yaycpO1xuXG5mdW5jdGlvbiBvZmZsaW5lQXNzZXRzU2VydmljZShvZmZsaW5lQXNzZXRzRnNTZXJ2aWNlLCB3b3JrLCAkcSwgJGxvZywgJGh0dHApIHtcbiAgJ25nSW5qZWN0JztcblxuICB2YXIgZnMgPSBvZmZsaW5lQXNzZXRzRnNTZXJ2aWNlO1xuXG4gIC8vIFJlYWxpemEgZWwgbGxhbWFkbyBkZSB1bmEgbGlzdGEgZGUgY2FsbGJhY2tzIHBhc2FuZG8gcG9yIHBhcmFtZXRybyB1bmEgdXJsXG4gIGZ1bmN0aW9uIHJlc29sdmVkVXJsKGl0ZW0sIHVybCkge1xuICAgIGl0ZW0uJHJlc29sdmVkVXJsID0gdXJsICsgJz8nICsgaXRlbS4kdmVyc2lvbisrO1xuICAgIGl0ZW0uJGNicyA9IGl0ZW0uJGNicyB8fCBbXTtcbiAgICBhbmd1bGFyLmZvckVhY2goaXRlbS4kY2JzLCBmdW5jdGlvbiAoY2IpIHtcbiAgICAgIGlmIChjYikgY2IoaXRlbS4kcmVzb2x2ZWRVcmwpO1xuICAgIH0pO1xuICB9XG5cbiAgdmFyIGRlc3QgPSBudWxsO1xuXG4gIHZhciBnZXRGaWxlTmFtZVRvID0gZnVuY3Rpb24gZ2V0RmlsZU5hbWVUbyh1cmwpIHtcblxuICAgIHJldHVybiBbXS5jb25jYXQoKGZzLmdldERlc3QoKSB8fCAnLycpLnNwbGl0KCcvJykpLmNvbmNhdChkZXN0IHx8IFtdKS5jb25jYXQodXJsLmhvc3Quc3BsaXQoJzonKSkuY29uY2F0KHVybC5wYXRobmFtZS5zcGxpdCgnLycpKS5maWx0ZXIoZnVuY3Rpb24gKHZhbG9yKSB7XG4gICAgICByZXR1cm4gKHZhbG9yIHx8ICcnKS50cmltKCkgIT0gJyc7XG4gICAgfSkuam9pbignLycpO1xuICB9O1xuXG4gIC8vIExpc3RhIGRlIGRlc2Nhcmdhc1xuICB2YXIgcXVldWUgPSBuZXcgd29yayhmdW5jdGlvbiAoaWR4LCBpdGVtLCBuZXh0KSB7XG4gICAgdmFyIHBhdGhmaWxlID0gZ2V0RmlsZU5hbWVUbyhpdGVtLiR1cmwpO1xuICAgIGZzLmRvd25sb2FkKGl0ZW0uJHVybCwgcGF0aGZpbGUpLnRoZW4oZnVuY3Rpb24gKGZpbGVFbnRyeSkge1xuICAgICAgJGxvZy5sb2coWydkb3dubG9hZGVkOicsIGl0ZW0uJHVybF0uam9pbignJykpO1xuICAgICAgcmVzb2x2ZWRVcmwoaXRlbSwgZmlsZUVudHJ5LnRvVVJMKCkpO1xuICAgICAgbmV4dCgpO1xuICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICRsb2cuZXJyb3IoW2lkeCwgZXJyXSk7XG4gICAgICBuZXh0KCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8vIEZ1bmNpb25hIHBhcmEgaW5pY2FyIGxhIGRlc2NhcmdhIGRlIHVuIGFyY2hpdm9cbiAgZnVuY3Rpb24gZG93bmxvYWQodXJsLCBjYikge1xuICAgIC8vICRsb2cubG9nKFsnZG93bmxvYWQ6JywgdXJsXS5qb2luKCcnKSk7XG5cbiAgICAvLyBPYnRlbmVyIGVsZW1lbnRvIGNvcnJlc3BvbmRpZW50ZSBhIGxhIFVSTFxuICAgIHZhciBpdGVtID0gcXVldWUuZ2V0KHVybCk7XG5cbiAgICAvLyBObyBleGlzdGUgdW4gZWxlbWVudG8gcGFyYSBsYSBVUkxcbiAgICBpZiAoIWl0ZW0pIHtcbiAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIExpc3RhIGRlIGNhbGxiYWNrcyBkZWwgZWxlbWVudG9cblxuICAgICAgICB2YXIgYWRkVG9RdWV1ZSA9IGZ1bmN0aW9uIGFkZFRvUXVldWUoKSB7XG4gICAgICAgICAgLy8gQWdyZWdhciBhbCBhcmNoaXZvIGRlIGRlc2Nhcmdhc1xuICAgICAgICAgIHF1ZXVlLmFkZCh1cmwsIGl0ZW0pO1xuICAgICAgICAgIC8vIFNpIG5vIHNlIGhhIGluaWNpYWRvIGxhIGRlc2NhcmdhciBpbmljaWFybGEgYWwgdGVybWluYXIgbGEgY2FyZ2FcbiAgICAgICAgICAvLyBkZWwgRlMuXG4gICAgICAgICAgaWYgKCFxdWV1ZS5zdGFydGVkKCkpIHtcbiAgICAgICAgICAgIHF1ZXVlLnN0YXJ0KCk7XG4gICAgICAgICAgICBxdWV1ZS5uZXh0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIENyZWFyIGVsIGVsZW1lbnRvXG4gICAgICAgIGl0ZW0gPSB7fTtcbiAgICAgICAgaXRlbS4kdmVyc2lvbiA9IDE7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpdGVtLiR1cmwgPSBuZXcgVVJMKHVybCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBpdGVtLiR1cmwgPSAobG9jYXRpb24ub3JpZ2luICsgbG9jYXRpb24ucGF0aG5hbWUpLnNwbGl0KCcvJyk7XG4gICAgICAgICAgaXRlbS4kdXJsLnBvcCgpO1xuICAgICAgICAgIGl0ZW0uJHVybCA9IGl0ZW0uJHVybC5qb2luKCcvJykgKyB1cmw7XG4gICAgICAgICAgaXRlbS4kdXJsID0gbmV3IFVSTChpdGVtLiR1cmwpO1xuICAgICAgICB9XG5cbiAgICAgICAgdXJsID0gaXRlbS4kdXJsLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgaXRlbS4kY2JzID0gW107XG5cbiAgICAgICAgZnMucmVhZHkoKS50aGVuKGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgIHZhciBwYXRoZmlsZSA9IGdldEZpbGVOYW1lVG8oaXRlbS4kdXJsKTtcbiAgICAgICAgICAvLyBPYnRlbmVyIGxhIGluc3RhbmNpYSBkZWwgYXJjaGl2b1xuICAgICAgICAgIGZzLmdldEZpbGUocGF0aGZpbGUpLnRoZW4oZnVuY3Rpb24gKGZmKSB7XG5cbiAgICAgICAgICAgIHJlc29sdmVkVXJsKGl0ZW0sIGZmLmZpbGVFbnRyeS50b1VSTCgpKTtcblxuICAgICAgICAgICAgLy8gT2J0ZW5lciBsYXMgY2FiZWNlcmFzIGRlbCBhcmNoaXZvXG4gICAgICAgICAgICAkaHR0cC5oZWFkKHVybCkudGhlbihmdW5jdGlvbiAocmVzKSB7XG5cbiAgICAgICAgICAgICAgdmFyIGlzVXBkYXRlID0gKCFyZXMuaGVhZGVycygnY29udGVudC1sZW5ndGgnKSB8fCBmZi5maWxlLnNpemUgPT0gcGFyc2VJbnQocmVzLmhlYWRlcnMoJ2NvbnRlbnQtbGVuZ3RoJykpKSAmJiAoIXJlcy5oZWFkZXJzKCdsYXN0LW1vZGlmaWVkJykgfHwgZmYuZmlsZS5sYXN0TW9kaWZpZWREYXRlID4gbmV3IERhdGUocmVzLmhlYWRlcnMoJ2xhc3QtbW9kaWZpZWQnKSkpO1xuXG4gICAgICAgICAgICAgIGlmICghaXNVcGRhdGUpIHtcbiAgICAgICAgICAgICAgICBhZGRUb1F1ZXVlKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pXG5cbiAgICAgICAgICAvLyBTaSBubyBleGlzdGUgZWwgYXJjaGl2b1xuICAgICAgICAgIC5jYXRjaChhZGRUb1F1ZXVlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KSgpO1xuICAgIH0gZWxzZSBpZiAoaXRlbS4kcmVzb2x2ZWRVcmwpIHtcbiAgICAgIGNiKGl0ZW0uJHJlc29sdmVkVXJsKTtcbiAgICB9XG5cbiAgICAvLyBBZ3JlZ2FyIGVsIGNiIHJlY2liaWRvIHBvciBwYXLDoW1ldHJvIGEgbGEgbGlzdGEgZGUgY2FsbGJhY2tzXG4gICAgaXRlbS4kY2JzLnB1c2goY2IpO1xuICB9XG5cbiAgLy8gUmVtdWV2ZSB1biBjYlxuICBmdW5jdGlvbiByZWxlYXNlKHVybCwgY2IpIHtcblxuICAgIHZhciBpdGVtID0gcXVldWUuZ2V0KHVybCk7XG4gICAgaWYgKGl0ZW0pIHtcbiAgICAgIHZhciBpZHggPSBpdGVtLiRjYnMuaW5kZXhPZihjYik7XG4gICAgICBpZiAoaWR4ICE9IC0xKSBpdGVtLiRjYnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQXNpZ25hIGVsIGRpcmVjdG9yaW8gZGVzdGlubyBwYXJhIGxvcyBhcmNoaXZvc1xuICBmdW5jdGlvbiBzZXREZXN0KHBEZXN0KSB7XG5cbiAgICBkZXN0ID0gcERlc3Q7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGRvd25sb2FkOiBkb3dubG9hZCxcbiAgICByZWxlYXNlOiByZWxlYXNlLFxuICAgIHNldERpcjogc2V0RGVzdFxuICB9O1xufVxuXG52YXIgX25hbWUgPSBleHBvcnRzLl9uYW1lID0gJ29mZmxpbmVBc3NldHMnO1xuZXhwb3J0cy5kZWZhdWx0ID0gYW5ndWxhci5tb2R1bGUoX25hbWUsIFtfb2ZmbGluZUFzc2V0c0ZzLl9uYW1lLCBfd29yay5fbmFtZV0pLmZhY3RvcnkoW19uYW1lLCAnU2VydmljZSddLmpvaW4oJycpLCBvZmZsaW5lQXNzZXRzU2VydmljZSk7XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvc2VydmljZXMvb2ZmbGluZUFzc2V0cy5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIG9mZmxpbmVBc3NldHNGc1NlcnZpY2UoJHEsICRsb2cpIHsgJ25nSW5qZWN0JztcclxuICBcclxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAvLyBBdHRyaWJ1dG9zIGdsb2JhbGVzXHJcbiAgdmFyIGF0dHJzID0ge1xyXG4gICAgLy8gVGFtYcOxbyBkZWwgYmxvcXVlIGRlIG1lbW9yaWEgcSBzZSBpcmEgcGlkaWVuZG8gY2FkYSB2ZXogcXVlIHNlIHNvYnJlIHBhc2VcclxuICAgIC8vIGxhIGN1b3RhIGRlIGFsbWFjZW5hbWllbnRvXHJcbiAgICBibG9ja1NpemU6IDE2ICogMTAxNCAqIDEwMjQsXHJcblxyXG4gICAgLy8gRXNwYWNpbyBkZSBsYSBjdW90YSBkZSBhbG1hY2VuYW1pZW50b1xyXG4gICAgY3VycmVudFF1b3RhOiAwLFxyXG5cclxuICAgIC8vIEVzcGFjaW8gdXNhZG8gZGUgbGEgY3VvdGEgZGUgYWxtYWNlbmFtaWVudG9cclxuICAgIGN1cnJlbnRVc2FnZTogMCxcclxuXHJcbiAgICAvLyBFc3BhY2lvIGRlIGxhIGN1b3RhIGRlIGFsbWFjZW5hbWllbnRvXHJcbiAgICBkZXN0OiAgJycsXHJcblxyXG4gIH07XHJcblxyXG4gIC8vIEluc3RhbmNpYSBkZWwgbWFuZWphZG9yIGRlbCBmaWxlIHN5c3RlbVxyXG4gIHZhciBmcyA9IG51bGw7XHJcblxyXG4gIC8vIERlZmFycmVkZXNcclxuICB2YXIgYXBpTG9hZGVkRGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG4gIHZhciBxdW90YUluZm9EZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcbiAgdmFyIHJlYWR5RGVmZXJyZWQgPSAkcS5hbGwoW1xyXG4gICAgYXBpTG9hZGVkRGVmZXJyZWQucHJvbWlzZSxcclxuICAgIHF1b3RhSW5mb0RlZmVycmVkLnByb21pc2VcclxuICBdKTtcclxuICBcclxuICAvLyBBUEkgSFRNTDUgcGFyYSBtYW5lam8gZGUgYXJjaGl2b3NcclxuICB2YXIgcmVxdWVzdEZpbGVTeXN0ZW0gPSB3aW5kb3cucmVxdWVzdEZpbGVTeXN0ZW0gfHwgd2luZG93LndlYmtpdFJlcXVlc3RGaWxlU3lzdGVtO1xyXG4gIHZhciBwU3RvcmFnZSA9IG5hdmlnYXRvci53ZWJraXRQZXJzaXN0ZW50U3RvcmFnZSB8fCB7XHJcbiAgICByZXF1ZXN0UXVvdGE6IGZ1bmN0aW9uKCkge30sXHJcbiAgICBxdWVyeVVzYWdlQW5kUXVvdGE6IGZ1bmN0aW9uKCkge30sXHJcbiAgfTtcclxuXHJcbiAgLy8gTG9hZCBhY3Rpb24gd2hlbiBsb2FkZWQgZmlsZVN5c3RlbVxyXG4gIGlmICh0eXBlb2YgY29yZG92YSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICRsb2cubG9nKCdjb3Jkb3ZhIG9uJyk7XHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdkZXZpY2VyZWFkeScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAkbG9nLmxvZygnZGV2aWRlcmVhZHknKTtcclxuICAgICAgcmVxdWVzdEZpbGVTeXN0ZW0oTG9jYWxGaWxlU3lzdGVtLlBFUlNJU1RFTlQsIDAsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICRsb2cubG9nKCdyZXF1ZXN0RmlsZVN5c3RlbScpO1xyXG5cclxuICAgICAgICBhdHRycy5kZXN0ID0gY29yZG92YS5maWxlLmV4dGVybmFsRGF0YURpcmVjdG9yeSB8fCBjb3Jkb3ZhLmZpbGUuZGF0YURpcmVjdG9yeTtcclxuXHJcbiAgICAgICAgYXBpTG9hZGVkRGVmZXJyZWQucmVzb2x2ZSgpO1xyXG4gICAgICAgIHF1b3RhSW5mb0RlZmVycmVkLnJlc29sdmUoLTEsLTEpO1xyXG4gICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgYXBpTG9hZGVkRGVmZXJyZWQucmVqZWN0KGVycik7XHJcbiAgICAgICAgcXVvdGFJbmZvRGVmZXJyZWQucmVqZWN0KGVycik7XHJcbiAgICAgIH0pO1xyXG4gICAgfSwgZmFsc2UpO1xyXG5cclxuICB9IGVsc2Uge1xyXG4gICAgLy8gJGxvZy5sb2coJ2NvcmRvdmEgb2ZmJyk7XHJcbiAgICBwU3RvcmFnZS5xdWVyeVVzYWdlQW5kUXVvdGEoZnVuY3Rpb24odXNlZCwgZ3JhbnRlZCkge1xyXG4gICAgICAkbG9nLmxvZyhbJ3F1ZXJ5VXNhZ2VBbmRRdW90YTonLCB1c2VkLCAnLCAnLCBncmFudGVkLCAnLCAnLCBncmFudGVkLXVzZWQsICcsICcsIGF0dHJzLmJsb2NrU2l6ZV0uam9pbignJykpO1xyXG4gICAgICBhdHRycy5jdXJyZW50UXVvdGEgPSBncmFudGVkO1xyXG4gICAgICBhdHRycy5jdXJyZW50VXNhZ2UgPSB1c2VkO1xyXG4gICAgICBpZiAoKGdyYW50ZWQtdXNlZCk8YXR0cnMuYmxvY2tTaXplLzIpIHtcclxuICAgICAgICByZXF1ZXN0U3RvcmFnZVF1b3RhKClcclxuICAgICAgICAgIC50aGVuKHF1b3RhSW5mb0RlZmVycmVkLnJlc29sdmUsIHF1b3RhSW5mb0RlZmVycmVkLnJlamVjdCk7XHJcbiAgICAgIH1lbHNlIHtcclxuICAgICAgICBxdW90YUluZm9EZWZlcnJlZC5yZXNvbHZlKHVzZWQsIGdyYW50ZWQpO1xyXG4gICAgICB9XHJcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgIHF1b3RhSW5mb0RlZmVycmVkLnJlamVjdChlcnIpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmVxdWVzdEZpbGVTeXN0ZW0od2luZG93LlBFUlNJU1RFTlQsIDAsIGZ1bmN0aW9uKHBGcykge1xyXG4gICAgICAvLyAkbG9nLmxvZygncmVxdWVzdEZpbGVTeXN0ZW0nKTtcclxuICAgICAgZnMgPSBwRnM7XHJcbiAgICAgIGFwaUxvYWRlZERlZmVycmVkLnJlc29sdmUoKTtcclxuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgYXBpTG9hZGVkRGVmZXJyZWQucmVqZWN0KGVycik7XHJcbiAgICB9KTtcclxuXHJcbiAgfVxyXG5cclxuICByZWFkeURlZmVycmVkLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAkbG9nLmxvZygncmVhZHknKTtcclxuICB9KS5jYXRjaCgkbG9nLmVycm9yKTtcclxuXHJcbiAgZnVuY3Rpb24gcmVhZHkoZm4pIHtcclxuICAgIGlmKCFmbikgcmV0dXJuIHJlYWR5RGVmZXJyZWQ7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG4gICAgICB2YXIgYXJncyA9IFtdO1xyXG4gICAgICBhbmd1bGFyLmZvckVhY2goYXJndW1lbnRzLCBmdW5jdGlvbiAodmFsb3IpIHtcclxuICAgICAgICBhcmdzLnB1c2godmFsb3IpO1xyXG4gICAgICB9KTtcclxuICAgICAgYXJncy51bnNoaWZ0KGRlZmVycmVkKTtcclxuICAgICAgcmVhZHlEZWZlcnJlZC50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBmbi5hcHBseShmbiwgYXJncyk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsIHRvIHJlc29sdmUgbG9jYWwgZmlsZSBzeXN0ZW1cclxuICAgKiAtIHBhdGhmaWxlOiBGaWxlIFVSTCB0byBnZXRcclxuICAgKi9cclxuICB2YXIgZ2V0RmlsZUVudHJ5ID0gcmVhZHkoZnVuY3Rpb24oZGVmZXJyZWQsIHBhdGhmaWxlLCBjcmVhdGUpIHtcclxuICAgIC8vICRsb2cubG9nKFsnZ2V0RmlsZUVudHJ5OicsIHBhdGhmaWxlXS5qb2luKCcnKSk7XHJcblxyXG4gICAgLy8gSWYgY2FuJ3QgY2hlY2sgaWYgZmlsZSBleGlzdHMgdGhlbiBjYWxsIHN1Y2Nlc3MgZGlyZWN0bHlcclxuICAgIGlmICh3aW5kb3cucmVzb2x2ZUxvY2FsRmlsZVN5c3RlbVVSTCkge1xyXG4gICAgICB3aW5kb3cucmVzb2x2ZUxvY2FsRmlsZVN5c3RlbVVSTChwYXRoZmlsZSwgZGVmZXJyZWQucmVzb2x2ZSwgZGVmZXJyZWQucmVqZWN0KTtcclxuICAgIH0gZWxzZSBpZiAoZnMpIHtcclxuICAgICAgZnMucm9vdC5nZXRGaWxlKHBhdGhmaWxlLCB7Y3JlYXRlOiAhIWNyZWF0ZX0sIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShlKTtcclxuICAgICAgfSwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZGVmZXJyZWQucmVqZWN0KHtcclxuICAgICAgICBjb2RlOiAwLFxyXG4gICAgICAgIG5hbWU6ICdOb3RJbnN0YW5jZVRvR2V0RmlsZUVudHJ5JyxcclxuICAgICAgICBtZXNzYWdlOiAnTm8gaGFuZGxlciBpbnN0YW5jZSB0byBnZXQgZmlsZSBlbnRyeSBpbnN0YW5jZSdcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBHZXQgaW5zdGFuY2UgaWYgRmlsZShjb3Jkb3ZhKSBvZiBwaHlzeWNhbCBmaWxlXHJcbiAgICogLSBwYXRoZmlsZTogVVJMIHRvIGRvd25sb2FkXHJcbiAgICovXHJcbiAgdmFyIGdldEZpbGUgPSByZWFkeShmdW5jdGlvbihkZWZlcnJlZCwgcGF0aGZpbGUpIHtcclxuICAgIC8vICRsb2cubG9nKFsnZ2V0RmlsZTonLCBwYXRoZmlsZV0uam9pbignJykpO1xyXG4gICAgXHJcbiAgICAvLyBDaGVjayBpZiBmaWxlIGV4aXN0LlxyXG4gICAgZ2V0RmlsZUVudHJ5KHBhdGhmaWxlKS50aGVuKGZ1bmN0aW9uIChmaWxlRW50cnkpIHtcclxuICAgICAgZmlsZUVudHJ5LmZpbGUoZnVuY3Rpb24oZmlsZSkge1xyXG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoe1xyXG4gICAgICAgICAgZmlsZUVudHJ5OiBmaWxlRW50cnksXHJcbiAgICAgICAgICBmaWxlOiBmaWxlXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG4gICAgICB9KTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xyXG4gICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuICAgIH0pO1xyXG5cclxuICB9KTtcclxuXHJcbiAgLy8gSW5kaWNhdGUgaWYgYW55IHF1b3RhIHJlcXVlc3Qgd2FzIGJlIHJlamVjdGVkXHJcbiAgdmFyIGFueVF1b3RhUmVxdWVzdFJlamVjdCA9IGZhbHNlO1xyXG5cclxuICAvKipcclxuICAgKiBTb2xpY2l0YXIgZXNwYWNpbyBkZSBhbG1hY2VuYW1pZW50b1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIHJlcXVlc3RTdG9yYWdlUXVvdGEgKHJlcXVpcmVkQnl0ZXMpIHtcclxuXHJcbiAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG4gICAgdmFyIHF1b3RhUmVxdWVzdFJlamVjdGVkRXJyb3IgPSBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHsgY29kZTogMCwgbmFtZTogJ1F1b3RhUmVxdWVzdFJlamVjdGVkJyB9XHJcbiAgICB9O1xyXG5cclxuICAgIGlmKGFueVF1b3RhUmVxdWVzdFJlamVjdCkge1xyXG4gICAgICBkZWZlcnJlZC5yZWplY3QocXVvdGFSZXF1ZXN0UmVqZWN0ZWRFcnJvcigpKTtcclxuXHJcbiAgICB9ZWxzZXtcclxuXHJcbiAgICAgIGlmKCFyZXF1aXJlZEJ5dGVzKSB7XHJcbiAgICAgICAgcmVxdWlyZWRCeXRlcyA9IDA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJlcXVpcmVkQnl0ZXMgPSBhdHRycy5jdXJyZW50UXVvdGEgKyBNYXRoLm1heChyZXF1aXJlZEJ5dGVzLCBhdHRycy5ibG9ja1NpemUpO1xyXG5cclxuICAgICAgcFN0b3JhZ2UucmVxdWVzdFF1b3RhKHJlcXVpcmVkQnl0ZXMsXHJcbiAgICAgICAgZnVuY3Rpb24oYnl0ZXNHcmFudGVkKSB7XHJcbiAgICAgICAgICBpZighYnl0ZXNHcmFudGVkKSB7XHJcbiAgICAgICAgICAgIC8vIGxvZyhbJ3JlcXVlc3RRdW90YVJlamVjdCddKTtcclxuICAgICAgICAgICAgYW55UXVvdGFSZXF1ZXN0UmVqZWN0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHF1b3RhUmVxdWVzdFJlamVjdGVkRXJyb3IoKSk7XHJcbiAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgJGxvZy5sb2coWydyZXF1ZXN0UXVvdGFHcmFudGVkJywgYnl0ZXNHcmFudGVkXSk7XHJcbiAgICAgICAgICAgIGF0dHJzLmN1cnJlbnRRdW90YSA9IGJ5dGVzR3JhbnRlZDtcclxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShieXRlc0dyYW50ZWQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICApO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogU29saWNpdGEgbWFzIGJ5dGVzIHNpIGVzIG5lY2VzYXJpb1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIHJlcXVlc3RTdG9yYWdlUXVvdGFJZlJlcXVpcmVkIChuZWVkZWRCeXRlcykge1xyXG5cclxuICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG4gICAgdmFyIG1pc3NpbmdCeXRlcyA9IGF0dHJzLmN1cnJlbnRVc2FnZSArIG5lZWRlZEJ5dGVzIC0gYXR0cnMuY3VycmVudFF1b3RhO1xyXG5cclxuICAgIGlmKG1pc3NpbmdCeXRlcyA+IDApIHtcclxuICAgICAgcmVxdWVzdFN0b3JhZ2VRdW90YShtaXNzaW5nQnl0ZXMgKyAxMCAqIDEwMjQpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oYnl0ZXNHcmFudGVkKSB7XHJcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XHJcbiAgICAgICAgfSwgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWFyIHVuIGRpcmVjdG9yaW9cclxuICAgKi9cclxuICBmdW5jdGlvbiBta2RpciAoZGlyKSB7XHJcbiAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG5cclxuICAgIHZhciBkaXJzID0gZGlyLnNwbGl0KCcvJyk7XHJcblxyXG4gICAgdmFyIF9ta2RpciA9IGZ1bmN0aW9uKGZvbGRlcnMsIHJvb3REaXJFbnRyeSkge1xyXG4gICAgICBpZiAoZm9sZGVyc1swXSA9PSAnLicgfHwgZm9sZGVyc1swXSA9PSAnJykge1xyXG4gICAgICAgIGZvbGRlcnMgPSBmb2xkZXJzLnNsaWNlKDEpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIWZvbGRlcnMubGVuZ3RoKSB7XHJcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShkaXIpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgcm9vdERpckVudHJ5LmdldERpcmVjdG9yeShmb2xkZXJzWzBdLCB7Y3JlYXRlOiB0cnVlfSwgZnVuY3Rpb24oZGlyRW50cnkpIHtcclxuICAgICAgICBfbWtkaXIoZm9sZGVycy5zbGljZSgxKSwgZGlyRW50cnkpO1xyXG4gICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgX21rZGlyKGRpcnMsIGZzLnJvb3QpO1xyXG5cclxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZSBwaHlzaWNhbCBmaWxlLlxyXG4gICAqIC0gcGFyYW1zLmZpbGVFbnRyeTogRmlsZUVudHJ5KGNvcmRvdmEpIGluc3RhbmNlXHJcbiAgICogLSBwYXJhbXMuc3VjY2VzczogY2FsbGJhY2sgd2hlbiBpcyBzdWNjZXNzXHJcbiAgICogLSBwYXJhbXMuZmFpbDogY2FsbGJhY2sgd2hlbiBpcyBmYWlsXHJcbiAgICovXHJcbiAgdmFyIHJlbW92ZUZpbGUgPSBmdW5jdGlvbihmaWxlRW50cnkpIHtcclxuICAgIC8vICRsb2cubG9nKFsncmVtb3ZlRmlsZSddKTtcclxuICAgIGlmKCFmaWxlRW50cnkpIHJldHVybjtcclxuXHJcbiAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG5cclxuICAgIGZpbGVFbnRyeS5yZW1vdmUoZnVuY3Rpb24oZmlsZSl7XHJcbiAgICAgIGRlZmVycmVkLnJlc29sdmUoZmlsZUVudHJ5KTtcclxuICAgIH0sIGZ1bmN0aW9uKGVycil7XHJcbiAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGwgQVBJIHRvIGRvd25sb2FkIGZpbGVcclxuICAgKiAtIGZyb21Vcmw6IEV4dGVybmFsIFVSTCBvZiBmaWxhXHJcbiAgICogLSBsb2NhbFVybDogRmlsZSBVUkwgdG8gZ2V0XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZG93bmxvYWQoZnJvbVVybCwgbG9jYWxVcmwpIHtcclxuICAgIC8vICRsb2cubG9nKFsnY2FsbERvd25sb2FkRmlsZTonLCBmcm9tVXJsLCBsb2NhbFVybF0uam9pbignICcpKTtcclxuXHJcbiAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGN1c3RvbUVycm9ySGFuZGxlciAobXNnKSB7XHJcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgaWYoZXJyLm5hbWUgPT09ICdRdW90YUV4Y2VlZGVkRXJyb3InKSB7XHJcbiAgICAgICAgICByZXF1ZXN0U3RvcmFnZVF1b3RhKClcclxuICAgICAgICAgICAgLnRoZW4oY3VzdG9tRG93bmxvYWRGaWxlLCBkZWZlcnJlZC5yZWplY3QpO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgY29uc29sZS5sb2cobXNnKTtcclxuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjdXN0b21Eb3dubG9hZEZpbGUgKCkge1xyXG5cclxuICAgICAgdmFyIGRpcnMgPSBsb2NhbFVybC5zcGxpdCgnLycpO1xyXG4gICAgICB2YXIgZmlsZW5hbWUgPSBkaXJzLnBvcCgpO1xyXG5cclxuICAgICAgLy8gQ3JlYXIgRGlyZWN0b3Jpb1xyXG4gICAgICAkcS53aGVuKCkudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIG1rZGlyKGRpcnMuam9pbignLycpKTtcclxuXHJcbiAgICAgIH0sIGN1c3RvbUVycm9ySGFuZGxlcignbWtkaXInKSlcclxuXHJcbiAgICAgIC8vIE9idGVuZXIgZWwgZmlsZUVudHJ5IHBhcmEgYm9ycmFybG9cclxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBnZXRGaWxlRW50cnkobG9jYWxVcmwpO1xyXG5cclxuICAgICAgfSwgZnVuY3Rpb24gKCkge30pXHJcblxyXG4gICAgICAvLyBPYnRlbmVyIGVsIGZpbGVFbnRyeVxyXG4gICAgICAudGhlbihmdW5jdGlvbiAoZmlsZUVudHJ5KSB7XHJcbiAgICAgICAgcmV0dXJuIHJlbW92ZUZpbGUoZmlsZUVudHJ5KTtcclxuXHJcbiAgICAgIH0sIGZ1bmN0aW9uICgpIHt9KVxyXG5cclxuICAgICAgLy8gT2J0ZW5lciBlbCBmaWxlRW50cnlcclxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBnZXRGaWxlRW50cnkobG9jYWxVcmwsIHRydWUpO1xyXG5cclxuICAgICAgfSwgY3VzdG9tRXJyb3JIYW5kbGVyKCdnZXRGaWxlRW50cnknKSlcclxuXHJcbiAgICAgIC8vIE9idGVuZXIgbGEgaW5zdGFuY2lhIGRlbCB3cml0ZXIgcGFyYSBlbCBhcmNoaXZvXHJcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChmaWxlRW50cnkpIHtcclxuICAgICAgICBpZiAoIWZpbGVFbnRyeSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBsb2NhbERlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuICAgICAgICBmaWxlRW50cnkuY3JlYXRlV3JpdGVyKGZ1bmN0aW9uICh3cml0ZXIpIHtcclxuXHJcbiAgICAgICAgICB3cml0ZXIub253cml0ZWVuZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGZpbGVFbnRyeSk7XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIHdyaXRlci5vbmVycm9yID0gY3VzdG9tRXJyb3JIYW5kbGVyKCd3cml0ZXInKTtcclxuXHJcbiAgICAgICAgICBsb2NhbERlZmVycmVkLnJlc29sdmUod3JpdGVyKTtcclxuXHJcbiAgICAgICAgfSwgbG9jYWxEZWZlcnJlZC5yZWplY3QpO1xyXG4gICAgICAgIHJldHVybiBsb2NhbERlZmVycmVkLnByb21pc2U7XHJcblxyXG4gICAgICB9LCBjdXN0b21FcnJvckhhbmRsZXIoJ2NyZWF0ZVdyaXRlcicpKVxyXG5cclxuICAgICAgLy8gT2J0ZW5lciBlbCBhcmNoaXZvIHBvciBBSkFYIHkgZXNjcmliaXIgZW4gZWwgYXJjaGl2b1xyXG4gICAgICAudGhlbihmdW5jdGlvbiAod3JpdGVyKSB7XHJcbiAgICAgICAgaWYgKCF3cml0ZXIpIHJldHVybjtcclxuXHJcbiAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpOyBcclxuICAgICAgICB4aHIub3BlbignR0VUJywgZnJvbVVybCwgdHJ1ZSk7IFxyXG4gICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYmxvYic7XHJcbiAgICAgICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYoeGhyLnN0YXR1cyA9PSAyMDApIHtcclxuICAgICAgICAgICAgd2luZG93LmJsb2IgPSB4aHIucmVzcG9uc2U7XHJcbiAgICAgICAgICAgIHJlcXVlc3RTdG9yYWdlUXVvdGFJZlJlcXVpcmVkKHhoci5yZXNwb25zZS5zaXplKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgIHdyaXRlci53cml0ZSh4aHIucmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgIGF0dHJzLmN1cnJlbnRVc2FnZSArPSB4aHIucmVzcG9uc2Uuc2l6ZTtcclxuICAgICAgICAgICAgfSwgY3VzdG9tRXJyb3JIYW5kbGVyKCdyZXF1ZXN0U3RvcmFnZVF1b3RhSWZSZXF1aXJlZCcpKTtcclxuXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgeGhyLnNlbmQobnVsbCk7XHJcblxyXG4gICAgICB9LCBjdXN0b21FcnJvckhhbmRsZXIoJ2ZpbmlzaCcpKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgY3VzdG9tRG93bmxvYWRGaWxlKCk7XHJcblxyXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ2V0RGVzdCAoKSB7XHJcbiAgICByZXR1cm4gYXR0cnMuZGVzdDtcclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICByZWFkeTogcmVhZHksXHJcbiAgICBnZXRGaWxlRW50cnkgOiBnZXRGaWxlRW50cnksXHJcbiAgICBnZXRGaWxlIDogZ2V0RmlsZSxcclxuICAgIHJlcXVlc3RTdG9yYWdlUXVvdGE6IHJlcXVlc3RTdG9yYWdlUXVvdGEsXHJcbiAgICByZXF1ZXN0U3RvcmFnZVF1b3RhSWZSZXF1aXJlZDogcmVxdWVzdFN0b3JhZ2VRdW90YUlmUmVxdWlyZWQsXHJcbiAgICBta2RpcjogbWtkaXIsXHJcbiAgICBkb3dubG9hZDogZG93bmxvYWQsXHJcbiAgICBnZXREZXN0OiBnZXREZXN0LFxyXG4gIH07XHJcblxyXG59XHJcblxyXG5leHBvcnQgdmFyIF9uYW1lID0gJ29mZmxpbmVBc3NldHNGcyc7XHJcbmV4cG9ydCBkZWZhdWx0IGFuZ3VsYXIubW9kdWxlKF9uYW1lLCBbXSlcclxuICAuZmFjdG9yeShbX25hbWUsICdTZXJ2aWNlJ10uam9pbignJyksIG9mZmxpbmVBc3NldHNGc1NlcnZpY2UpO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3NlcnZpY2VzL29mZmxpbmVBc3NldHNGcy5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmZ1bmN0aW9uIG9mZmxpbmVBc3NldHNGc1NlcnZpY2UoJHEsICRsb2cpIHtcbiAgJ25nSW5qZWN0JztcblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gQXR0cmlidXRvcyBnbG9iYWxlc1xuXG4gIHZhciBhdHRycyA9IHtcbiAgICAvLyBUYW1hw7FvIGRlbCBibG9xdWUgZGUgbWVtb3JpYSBxIHNlIGlyYSBwaWRpZW5kbyBjYWRhIHZleiBxdWUgc2Ugc29icmUgcGFzZVxuICAgIC8vIGxhIGN1b3RhIGRlIGFsbWFjZW5hbWllbnRvXG4gICAgYmxvY2tTaXplOiAxNiAqIDEwMTQgKiAxMDI0LFxuXG4gICAgLy8gRXNwYWNpbyBkZSBsYSBjdW90YSBkZSBhbG1hY2VuYW1pZW50b1xuICAgIGN1cnJlbnRRdW90YTogMCxcblxuICAgIC8vIEVzcGFjaW8gdXNhZG8gZGUgbGEgY3VvdGEgZGUgYWxtYWNlbmFtaWVudG9cbiAgICBjdXJyZW50VXNhZ2U6IDAsXG5cbiAgICAvLyBFc3BhY2lvIGRlIGxhIGN1b3RhIGRlIGFsbWFjZW5hbWllbnRvXG4gICAgZGVzdDogJydcblxuICB9O1xuXG4gIC8vIEluc3RhbmNpYSBkZWwgbWFuZWphZG9yIGRlbCBmaWxlIHN5c3RlbVxuICB2YXIgZnMgPSBudWxsO1xuXG4gIC8vIERlZmFycmVkZXNcbiAgdmFyIGFwaUxvYWRlZERlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgdmFyIHF1b3RhSW5mb0RlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgdmFyIHJlYWR5RGVmZXJyZWQgPSAkcS5hbGwoW2FwaUxvYWRlZERlZmVycmVkLnByb21pc2UsIHF1b3RhSW5mb0RlZmVycmVkLnByb21pc2VdKTtcblxuICAvLyBBUEkgSFRNTDUgcGFyYSBtYW5lam8gZGUgYXJjaGl2b3NcbiAgdmFyIHJlcXVlc3RGaWxlU3lzdGVtID0gd2luZG93LnJlcXVlc3RGaWxlU3lzdGVtIHx8IHdpbmRvdy53ZWJraXRSZXF1ZXN0RmlsZVN5c3RlbTtcbiAgdmFyIHBTdG9yYWdlID0gbmF2aWdhdG9yLndlYmtpdFBlcnNpc3RlbnRTdG9yYWdlIHx8IHtcbiAgICByZXF1ZXN0UXVvdGE6IGZ1bmN0aW9uIHJlcXVlc3RRdW90YSgpIHt9LFxuICAgIHF1ZXJ5VXNhZ2VBbmRRdW90YTogZnVuY3Rpb24gcXVlcnlVc2FnZUFuZFF1b3RhKCkge31cbiAgfTtcblxuICAvLyBMb2FkIGFjdGlvbiB3aGVuIGxvYWRlZCBmaWxlU3lzdGVtXG4gIGlmICh0eXBlb2YgY29yZG92YSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAkbG9nLmxvZygnY29yZG92YSBvbicpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2RldmljZXJlYWR5JywgZnVuY3Rpb24gKCkge1xuICAgICAgJGxvZy5sb2coJ2RldmlkZXJlYWR5Jyk7XG4gICAgICByZXF1ZXN0RmlsZVN5c3RlbShMb2NhbEZpbGVTeXN0ZW0uUEVSU0lTVEVOVCwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAkbG9nLmxvZygncmVxdWVzdEZpbGVTeXN0ZW0nKTtcblxuICAgICAgICBhdHRycy5kZXN0ID0gY29yZG92YS5maWxlLmV4dGVybmFsRGF0YURpcmVjdG9yeSB8fCBjb3Jkb3ZhLmZpbGUuZGF0YURpcmVjdG9yeTtcblxuICAgICAgICBhcGlMb2FkZWREZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgIHF1b3RhSW5mb0RlZmVycmVkLnJlc29sdmUoLTEsIC0xKTtcbiAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgYXBpTG9hZGVkRGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgICAgIHF1b3RhSW5mb0RlZmVycmVkLnJlamVjdChlcnIpO1xuICAgICAgfSk7XG4gICAgfSwgZmFsc2UpO1xuICB9IGVsc2Uge1xuICAgIC8vICRsb2cubG9nKCdjb3Jkb3ZhIG9mZicpO1xuICAgIHBTdG9yYWdlLnF1ZXJ5VXNhZ2VBbmRRdW90YShmdW5jdGlvbiAodXNlZCwgZ3JhbnRlZCkge1xuICAgICAgJGxvZy5sb2coWydxdWVyeVVzYWdlQW5kUXVvdGE6JywgdXNlZCwgJywgJywgZ3JhbnRlZCwgJywgJywgZ3JhbnRlZCAtIHVzZWQsICcsICcsIGF0dHJzLmJsb2NrU2l6ZV0uam9pbignJykpO1xuICAgICAgYXR0cnMuY3VycmVudFF1b3RhID0gZ3JhbnRlZDtcbiAgICAgIGF0dHJzLmN1cnJlbnRVc2FnZSA9IHVzZWQ7XG4gICAgICBpZiAoZ3JhbnRlZCAtIHVzZWQgPCBhdHRycy5ibG9ja1NpemUgLyAyKSB7XG4gICAgICAgIHJlcXVlc3RTdG9yYWdlUXVvdGEoKS50aGVuKHF1b3RhSW5mb0RlZmVycmVkLnJlc29sdmUsIHF1b3RhSW5mb0RlZmVycmVkLnJlamVjdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBxdW90YUluZm9EZWZlcnJlZC5yZXNvbHZlKHVzZWQsIGdyYW50ZWQpO1xuICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIHF1b3RhSW5mb0RlZmVycmVkLnJlamVjdChlcnIpO1xuICAgIH0pO1xuXG4gICAgcmVxdWVzdEZpbGVTeXN0ZW0od2luZG93LlBFUlNJU1RFTlQsIDAsIGZ1bmN0aW9uIChwRnMpIHtcbiAgICAgIC8vICRsb2cubG9nKCdyZXF1ZXN0RmlsZVN5c3RlbScpO1xuICAgICAgZnMgPSBwRnM7XG4gICAgICBhcGlMb2FkZWREZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgYXBpTG9hZGVkRGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgfSk7XG4gIH1cblxuICByZWFkeURlZmVycmVkLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICRsb2cubG9nKCdyZWFkeScpO1xuICB9KS5jYXRjaCgkbG9nLmVycm9yKTtcblxuICBmdW5jdGlvbiByZWFkeShmbikge1xuICAgIGlmICghZm4pIHJldHVybiByZWFkeURlZmVycmVkO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChhcmd1bWVudHMsIGZ1bmN0aW9uICh2YWxvcikge1xuICAgICAgICBhcmdzLnB1c2godmFsb3IpO1xuICAgICAgfSk7XG4gICAgICBhcmdzLnVuc2hpZnQoZGVmZXJyZWQpO1xuICAgICAgcmVhZHlEZWZlcnJlZC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm4uYXBwbHkoZm4sIGFyZ3MpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG4gIH1cblxuICAvKipcclxuICAgKiBDYWxsIHRvIHJlc29sdmUgbG9jYWwgZmlsZSBzeXN0ZW1cclxuICAgKiAtIHBhdGhmaWxlOiBGaWxlIFVSTCB0byBnZXRcclxuICAgKi9cbiAgdmFyIGdldEZpbGVFbnRyeSA9IHJlYWR5KGZ1bmN0aW9uIChkZWZlcnJlZCwgcGF0aGZpbGUsIGNyZWF0ZSkge1xuICAgIC8vICRsb2cubG9nKFsnZ2V0RmlsZUVudHJ5OicsIHBhdGhmaWxlXS5qb2luKCcnKSk7XG5cbiAgICAvLyBJZiBjYW4ndCBjaGVjayBpZiBmaWxlIGV4aXN0cyB0aGVuIGNhbGwgc3VjY2VzcyBkaXJlY3RseVxuICAgIGlmICh3aW5kb3cucmVzb2x2ZUxvY2FsRmlsZVN5c3RlbVVSTCkge1xuICAgICAgd2luZG93LnJlc29sdmVMb2NhbEZpbGVTeXN0ZW1VUkwocGF0aGZpbGUsIGRlZmVycmVkLnJlc29sdmUsIGRlZmVycmVkLnJlamVjdCk7XG4gICAgfSBlbHNlIGlmIChmcykge1xuICAgICAgZnMucm9vdC5nZXRGaWxlKHBhdGhmaWxlLCB7IGNyZWF0ZTogISFjcmVhdGUgfSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShlKTtcbiAgICAgIH0sIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWZlcnJlZC5yZWplY3Qoe1xuICAgICAgICBjb2RlOiAwLFxuICAgICAgICBuYW1lOiAnTm90SW5zdGFuY2VUb0dldEZpbGVFbnRyeScsXG4gICAgICAgIG1lc3NhZ2U6ICdObyBoYW5kbGVyIGluc3RhbmNlIHRvIGdldCBmaWxlIGVudHJ5IGluc3RhbmNlJ1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuICAvKipcclxuICAgKiBHZXQgaW5zdGFuY2UgaWYgRmlsZShjb3Jkb3ZhKSBvZiBwaHlzeWNhbCBmaWxlXHJcbiAgICogLSBwYXRoZmlsZTogVVJMIHRvIGRvd25sb2FkXHJcbiAgICovXG4gIHZhciBnZXRGaWxlID0gcmVhZHkoZnVuY3Rpb24gKGRlZmVycmVkLCBwYXRoZmlsZSkge1xuICAgIC8vICRsb2cubG9nKFsnZ2V0RmlsZTonLCBwYXRoZmlsZV0uam9pbignJykpO1xuXG4gICAgLy8gQ2hlY2sgaWYgZmlsZSBleGlzdC5cbiAgICBnZXRGaWxlRW50cnkocGF0aGZpbGUpLnRoZW4oZnVuY3Rpb24gKGZpbGVFbnRyeSkge1xuICAgICAgZmlsZUVudHJ5LmZpbGUoZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh7XG4gICAgICAgICAgZmlsZUVudHJ5OiBmaWxlRW50cnksXG4gICAgICAgICAgZmlsZTogZmlsZVxuICAgICAgICB9KTtcbiAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgICB9KTtcbiAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gSW5kaWNhdGUgaWYgYW55IHF1b3RhIHJlcXVlc3Qgd2FzIGJlIHJlamVjdGVkXG4gIHZhciBhbnlRdW90YVJlcXVlc3RSZWplY3QgPSBmYWxzZTtcblxuICAvKipcclxuICAgKiBTb2xpY2l0YXIgZXNwYWNpbyBkZSBhbG1hY2VuYW1pZW50b1xyXG4gICAqL1xuICBmdW5jdGlvbiByZXF1ZXN0U3RvcmFnZVF1b3RhKHJlcXVpcmVkQnl0ZXMpIHtcblxuICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgdmFyIHF1b3RhUmVxdWVzdFJlamVjdGVkRXJyb3IgPSBmdW5jdGlvbiBxdW90YVJlcXVlc3RSZWplY3RlZEVycm9yKCkge1xuICAgICAgcmV0dXJuIHsgY29kZTogMCwgbmFtZTogJ1F1b3RhUmVxdWVzdFJlamVjdGVkJyB9O1xuICAgIH07XG5cbiAgICBpZiAoYW55UXVvdGFSZXF1ZXN0UmVqZWN0KSB7XG4gICAgICBkZWZlcnJlZC5yZWplY3QocXVvdGFSZXF1ZXN0UmVqZWN0ZWRFcnJvcigpKTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICBpZiAoIXJlcXVpcmVkQnl0ZXMpIHtcbiAgICAgICAgcmVxdWlyZWRCeXRlcyA9IDA7XG4gICAgICB9XG5cbiAgICAgIHJlcXVpcmVkQnl0ZXMgPSBhdHRycy5jdXJyZW50UXVvdGEgKyBNYXRoLm1heChyZXF1aXJlZEJ5dGVzLCBhdHRycy5ibG9ja1NpemUpO1xuXG4gICAgICBwU3RvcmFnZS5yZXF1ZXN0UXVvdGEocmVxdWlyZWRCeXRlcywgZnVuY3Rpb24gKGJ5dGVzR3JhbnRlZCkge1xuICAgICAgICBpZiAoIWJ5dGVzR3JhbnRlZCkge1xuICAgICAgICAgIC8vIGxvZyhbJ3JlcXVlc3RRdW90YVJlamVjdCddKTtcbiAgICAgICAgICBhbnlRdW90YVJlcXVlc3RSZWplY3QgPSB0cnVlO1xuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChxdW90YVJlcXVlc3RSZWplY3RlZEVycm9yKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRsb2cubG9nKFsncmVxdWVzdFF1b3RhR3JhbnRlZCcsIGJ5dGVzR3JhbnRlZF0pO1xuICAgICAgICAgIGF0dHJzLmN1cnJlbnRRdW90YSA9IGJ5dGVzR3JhbnRlZDtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGJ5dGVzR3JhbnRlZCk7XG4gICAgICAgIH1cbiAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgfTtcblxuICAvKipcclxuICAgKiBTb2xpY2l0YSBtYXMgYnl0ZXMgc2kgZXMgbmVjZXNhcmlvXHJcbiAgICovXG4gIGZ1bmN0aW9uIHJlcXVlc3RTdG9yYWdlUXVvdGFJZlJlcXVpcmVkKG5lZWRlZEJ5dGVzKSB7XG5cbiAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgdmFyIG1pc3NpbmdCeXRlcyA9IGF0dHJzLmN1cnJlbnRVc2FnZSArIG5lZWRlZEJ5dGVzIC0gYXR0cnMuY3VycmVudFF1b3RhO1xuXG4gICAgaWYgKG1pc3NpbmdCeXRlcyA+IDApIHtcbiAgICAgIHJlcXVlc3RTdG9yYWdlUXVvdGEobWlzc2luZ0J5dGVzICsgMTAgKiAxMDI0KS50aGVuKGZ1bmN0aW9uIChieXRlc0dyYW50ZWQpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgfSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGUpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgfVxuXG4gIC8qKlxyXG4gICAqIENyZWFyIHVuIGRpcmVjdG9yaW9cclxuICAgKi9cbiAgZnVuY3Rpb24gbWtkaXIoZGlyKSB7XG4gICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgIHZhciBkaXJzID0gZGlyLnNwbGl0KCcvJyk7XG5cbiAgICB2YXIgX21rZGlyID0gZnVuY3Rpb24gX21rZGlyKGZvbGRlcnMsIHJvb3REaXJFbnRyeSkge1xuICAgICAgaWYgKGZvbGRlcnNbMF0gPT0gJy4nIHx8IGZvbGRlcnNbMF0gPT0gJycpIHtcbiAgICAgICAgZm9sZGVycyA9IGZvbGRlcnMuc2xpY2UoMSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghZm9sZGVycy5sZW5ndGgpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShkaXIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJvb3REaXJFbnRyeS5nZXREaXJlY3RvcnkoZm9sZGVyc1swXSwgeyBjcmVhdGU6IHRydWUgfSwgZnVuY3Rpb24gKGRpckVudHJ5KSB7XG4gICAgICAgIF9ta2Rpcihmb2xkZXJzLnNsaWNlKDEpLCBkaXJFbnRyeSk7XG4gICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIF9ta2RpcihkaXJzLCBmcy5yb290KTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICB9XG5cbiAgLyoqXHJcbiAgICogUmVtb3ZlIHBoeXNpY2FsIGZpbGUuXHJcbiAgICogLSBwYXJhbXMuZmlsZUVudHJ5OiBGaWxlRW50cnkoY29yZG92YSkgaW5zdGFuY2VcclxuICAgKiAtIHBhcmFtcy5zdWNjZXNzOiBjYWxsYmFjayB3aGVuIGlzIHN1Y2Nlc3NcclxuICAgKiAtIHBhcmFtcy5mYWlsOiBjYWxsYmFjayB3aGVuIGlzIGZhaWxcclxuICAgKi9cbiAgdmFyIHJlbW92ZUZpbGUgPSBmdW5jdGlvbiByZW1vdmVGaWxlKGZpbGVFbnRyeSkge1xuICAgIC8vICRsb2cubG9nKFsncmVtb3ZlRmlsZSddKTtcbiAgICBpZiAoIWZpbGVFbnRyeSkgcmV0dXJuO1xuXG4gICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgIGZpbGVFbnRyeS5yZW1vdmUoZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgIGRlZmVycmVkLnJlc29sdmUoZmlsZUVudHJ5KTtcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICB9O1xuXG4gIC8qKlxyXG4gICAqIENhbGwgQVBJIHRvIGRvd25sb2FkIGZpbGVcclxuICAgKiAtIGZyb21Vcmw6IEV4dGVybmFsIFVSTCBvZiBmaWxhXHJcbiAgICogLSBsb2NhbFVybDogRmlsZSBVUkwgdG8gZ2V0XHJcbiAgICovXG4gIGZ1bmN0aW9uIGRvd25sb2FkKGZyb21VcmwsIGxvY2FsVXJsKSB7XG4gICAgLy8gJGxvZy5sb2coWydjYWxsRG93bmxvYWRGaWxlOicsIGZyb21VcmwsIGxvY2FsVXJsXS5qb2luKCcgJykpO1xuXG4gICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgIGZ1bmN0aW9uIGN1c3RvbUVycm9ySGFuZGxlcihtc2cpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGlmIChlcnIubmFtZSA9PT0gJ1F1b3RhRXhjZWVkZWRFcnJvcicpIHtcbiAgICAgICAgICByZXF1ZXN0U3RvcmFnZVF1b3RhKCkudGhlbihjdXN0b21Eb3dubG9hZEZpbGUsIGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5sb2cobXNnKTtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjdXN0b21Eb3dubG9hZEZpbGUoKSB7XG5cbiAgICAgIHZhciBkaXJzID0gbG9jYWxVcmwuc3BsaXQoJy8nKTtcbiAgICAgIHZhciBmaWxlbmFtZSA9IGRpcnMucG9wKCk7XG5cbiAgICAgIC8vIENyZWFyIERpcmVjdG9yaW9cbiAgICAgICRxLndoZW4oKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG1rZGlyKGRpcnMuam9pbignLycpKTtcbiAgICAgIH0sIGN1c3RvbUVycm9ySGFuZGxlcignbWtkaXInKSlcblxuICAgICAgLy8gT2J0ZW5lciBlbCBmaWxlRW50cnkgcGFyYSBib3JyYXJsb1xuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZ2V0RmlsZUVudHJ5KGxvY2FsVXJsKTtcbiAgICAgIH0sIGZ1bmN0aW9uICgpIHt9KVxuXG4gICAgICAvLyBPYnRlbmVyIGVsIGZpbGVFbnRyeVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKGZpbGVFbnRyeSkge1xuICAgICAgICByZXR1cm4gcmVtb3ZlRmlsZShmaWxlRW50cnkpO1xuICAgICAgfSwgZnVuY3Rpb24gKCkge30pXG5cbiAgICAgIC8vIE9idGVuZXIgZWwgZmlsZUVudHJ5XG4gICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBnZXRGaWxlRW50cnkobG9jYWxVcmwsIHRydWUpO1xuICAgICAgfSwgY3VzdG9tRXJyb3JIYW5kbGVyKCdnZXRGaWxlRW50cnknKSlcblxuICAgICAgLy8gT2J0ZW5lciBsYSBpbnN0YW5jaWEgZGVsIHdyaXRlciBwYXJhIGVsIGFyY2hpdm9cbiAgICAgIC50aGVuKGZ1bmN0aW9uIChmaWxlRW50cnkpIHtcbiAgICAgICAgaWYgKCFmaWxlRW50cnkpIHJldHVybjtcbiAgICAgICAgdmFyIGxvY2FsRGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICBmaWxlRW50cnkuY3JlYXRlV3JpdGVyKGZ1bmN0aW9uICh3cml0ZXIpIHtcblxuICAgICAgICAgIHdyaXRlci5vbndyaXRlZW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShmaWxlRW50cnkpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICB3cml0ZXIub25lcnJvciA9IGN1c3RvbUVycm9ySGFuZGxlcignd3JpdGVyJyk7XG5cbiAgICAgICAgICBsb2NhbERlZmVycmVkLnJlc29sdmUod3JpdGVyKTtcbiAgICAgICAgfSwgbG9jYWxEZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICByZXR1cm4gbG9jYWxEZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSwgY3VzdG9tRXJyb3JIYW5kbGVyKCdjcmVhdGVXcml0ZXInKSlcblxuICAgICAgLy8gT2J0ZW5lciBlbCBhcmNoaXZvIHBvciBBSkFYIHkgZXNjcmliaXIgZW4gZWwgYXJjaGl2b1xuICAgICAgLnRoZW4oZnVuY3Rpb24gKHdyaXRlcikge1xuICAgICAgICBpZiAoIXdyaXRlcikgcmV0dXJuO1xuXG4gICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIGZyb21VcmwsIHRydWUpO1xuICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2Jsb2InO1xuICAgICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGlmICh4aHIuc3RhdHVzID09IDIwMCkge1xuICAgICAgICAgICAgd2luZG93LmJsb2IgPSB4aHIucmVzcG9uc2U7XG4gICAgICAgICAgICByZXF1ZXN0U3RvcmFnZVF1b3RhSWZSZXF1aXJlZCh4aHIucmVzcG9uc2Uuc2l6ZSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHdyaXRlci53cml0ZSh4aHIucmVzcG9uc2UpO1xuICAgICAgICAgICAgICBhdHRycy5jdXJyZW50VXNhZ2UgKz0geGhyLnJlc3BvbnNlLnNpemU7XG4gICAgICAgICAgICB9LCBjdXN0b21FcnJvckhhbmRsZXIoJ3JlcXVlc3RTdG9yYWdlUXVvdGFJZlJlcXVpcmVkJykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB4aHIuc2VuZChudWxsKTtcbiAgICAgIH0sIGN1c3RvbUVycm9ySGFuZGxlcignZmluaXNoJykpO1xuICAgIH1cblxuICAgIGN1c3RvbURvd25sb2FkRmlsZSgpO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gIH1cblxuICBmdW5jdGlvbiBnZXREZXN0KCkge1xuICAgIHJldHVybiBhdHRycy5kZXN0O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICByZWFkeTogcmVhZHksXG4gICAgZ2V0RmlsZUVudHJ5OiBnZXRGaWxlRW50cnksXG4gICAgZ2V0RmlsZTogZ2V0RmlsZSxcbiAgICByZXF1ZXN0U3RvcmFnZVF1b3RhOiByZXF1ZXN0U3RvcmFnZVF1b3RhLFxuICAgIHJlcXVlc3RTdG9yYWdlUXVvdGFJZlJlcXVpcmVkOiByZXF1ZXN0U3RvcmFnZVF1b3RhSWZSZXF1aXJlZCxcbiAgICBta2RpcjogbWtkaXIsXG4gICAgZG93bmxvYWQ6IGRvd25sb2FkLFxuICAgIGdldERlc3Q6IGdldERlc3RcbiAgfTtcbn1cblxudmFyIF9uYW1lID0gZXhwb3J0cy5fbmFtZSA9ICdvZmZsaW5lQXNzZXRzRnMnO1xuZXhwb3J0cy5kZWZhdWx0ID0gYW5ndWxhci5tb2R1bGUoX25hbWUsIFtdKS5mYWN0b3J5KFtfbmFtZSwgJ1NlcnZpY2UnXS5qb2luKCcnKSwgb2ZmbGluZUFzc2V0c0ZzU2VydmljZSk7XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvc2VydmljZXMvb2ZmbGluZUFzc2V0c0ZzLmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gd29yaygkcSwgJGxvZykgeyAnbmdJbmplY3QnO1xyXG5cclxuICByZXR1cm4gZnVuY3Rpb24gKGNiKSB7IHZhciAgc2VsZiA9IHRoaXM7XHJcbiAgICBcclxuICAgIHZhciBpdGVtcyA9IHt9OyAvLyBFbGVtZW50byBkZSBsYSBjb2xhXHJcbiAgICB2YXIgaWR4cyA9IFtdOyAgLy8gSW5kaWNlcyBkZSBsYSBjb2xhXHJcbiAgICB2YXIgX3dvcmtpbmcgPSBmYWxzZTsgLy8gSW5kaWNhIHNpIGxhIGNvbGEgZXN0YSB0cmFiYWphbmRvXHJcbiAgICB2YXIgX3N0YXJ0ZWQgPSBmYWxzZTsgLy8gSW5kaWNhIHNpIGVsIHRyYWJham8gc2UgaW5pY2lvXHJcblxyXG4gICAgLy8gQWdyZWdhIHVuIGVsZW1lbnRvIGEgbGEgY29sYVxyXG4gICAgc2VsZi5hZGQgPSBmdW5jdGlvbiAoaWR4LCBpdGVtKSB7XHJcbiAgICAgIGl0ZW1zW2lkeF0gPSBpdGVtO1xyXG4gICAgICBpZHhzLnB1c2goaWR4KTtcclxuICAgICAgXHJcbiAgICAgIC8vIEluaWNpYXIgZWwgdHJhYmFqb1xyXG4gICAgICBpZiAoIV93b3JraW5nKSB7XHJcbiAgICAgICAgX3dvcmtpbmcgPSB0cnVlO1xyXG4gICAgICAgIC8vIFNpIHlhIHNlIGluaWNpbyBlbnRvbmNlIGluaWNhciBsYSBkZXNjYXJnYVxyXG4gICAgICAgIGlmIChfc3RhcnRlZCkge1xyXG4gICAgICAgICAgc2VsZi5uZXh0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBJbmljaWEgZWwgdHJhYmFqbyBkZSBsYSBjb2xhXHJcbiAgICBzZWxmLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICBfc3RhcnRlZCA9IHRydWU7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIERldnVlbHZlIHNpIGxhIGNvbGEgZXN0YSBwcm9jZXNhbmRvXHJcbiAgICBzZWxmLndvcmtpbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBfd29ya2luZztcclxuICAgIH07XHJcblxyXG4gICAgLy8gRGV2dWVsdmUgc2kgbGEgY29sYSBlc3RhIHByb2Nlc2FuZG9cclxuICAgIHNlbGYuc3RhcnRlZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIF9zdGFydGVkO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBEZXZ1ZWx2ZSB1biBlbGVtZW50byBwb3IgZWwgSURYXHJcbiAgICBzZWxmLmdldCA9IGZ1bmN0aW9uIChpZHgpIHtcclxuICAgICAgcmV0dXJuIGl0ZW1zW2lkeF07XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFByb2Nlc2EgZWwgc2lndWllbnRlIGVsZW1lbnRvIGRlIGxhIGNvbGFcclxuICAgIHNlbGYubmV4dCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICBfd29ya2luZyA9ICEhaWR4cy5sZW5ndGg7XHJcbiAgICAgIGlmICghX3dvcmtpbmcpIHJldHVybjtcclxuICAgICAgdmFyIGlkeCA9IGlkeHMuc2hpZnQoKTtcclxuICAgICAgdmFyIGl0ZW0gPSBpdGVtc1tpZHhdO1xyXG4gICAgICBjYihpZHgsIGl0ZW0sIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBzZWxmLm5leHQoKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG59XHJcblxyXG5leHBvcnQgdmFyIF9uYW1lID0gJ3dvcmsnO1xyXG5leHBvcnQgZGVmYXVsdCBhbmd1bGFyLm1vZHVsZShfbmFtZSwgW10pXHJcbiAgLmZhY3RvcnkoW19uYW1lXS5qb2luKCcnKSwgd29yayk7XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvc2VydmljZXMvd29yay5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmZ1bmN0aW9uIHdvcmsoJHEsICRsb2cpIHtcbiAgJ25nSW5qZWN0JztcblxuICByZXR1cm4gZnVuY3Rpb24gKGNiKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIGl0ZW1zID0ge307IC8vIEVsZW1lbnRvIGRlIGxhIGNvbGFcbiAgICB2YXIgaWR4cyA9IFtdOyAvLyBJbmRpY2VzIGRlIGxhIGNvbGFcbiAgICB2YXIgX3dvcmtpbmcgPSBmYWxzZTsgLy8gSW5kaWNhIHNpIGxhIGNvbGEgZXN0YSB0cmFiYWphbmRvXG4gICAgdmFyIF9zdGFydGVkID0gZmFsc2U7IC8vIEluZGljYSBzaSBlbCB0cmFiYWpvIHNlIGluaWNpb1xuXG4gICAgLy8gQWdyZWdhIHVuIGVsZW1lbnRvIGEgbGEgY29sYVxuICAgIHNlbGYuYWRkID0gZnVuY3Rpb24gKGlkeCwgaXRlbSkge1xuICAgICAgaXRlbXNbaWR4XSA9IGl0ZW07XG4gICAgICBpZHhzLnB1c2goaWR4KTtcblxuICAgICAgLy8gSW5pY2lhciBlbCB0cmFiYWpvXG4gICAgICBpZiAoIV93b3JraW5nKSB7XG4gICAgICAgIF93b3JraW5nID0gdHJ1ZTtcbiAgICAgICAgLy8gU2kgeWEgc2UgaW5pY2lvIGVudG9uY2UgaW5pY2FyIGxhIGRlc2NhcmdhXG4gICAgICAgIGlmIChfc3RhcnRlZCkge1xuICAgICAgICAgIHNlbGYubmV4dCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIEluaWNpYSBlbCB0cmFiYWpvIGRlIGxhIGNvbGFcbiAgICBzZWxmLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgX3N0YXJ0ZWQgPSB0cnVlO1xuICAgIH07XG5cbiAgICAvLyBEZXZ1ZWx2ZSBzaSBsYSBjb2xhIGVzdGEgcHJvY2VzYW5kb1xuICAgIHNlbGYud29ya2luZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBfd29ya2luZztcbiAgICB9O1xuXG4gICAgLy8gRGV2dWVsdmUgc2kgbGEgY29sYSBlc3RhIHByb2Nlc2FuZG9cbiAgICBzZWxmLnN0YXJ0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gX3N0YXJ0ZWQ7XG4gICAgfTtcblxuICAgIC8vIERldnVlbHZlIHVuIGVsZW1lbnRvIHBvciBlbCBJRFhcbiAgICBzZWxmLmdldCA9IGZ1bmN0aW9uIChpZHgpIHtcbiAgICAgIHJldHVybiBpdGVtc1tpZHhdO1xuICAgIH07XG5cbiAgICAvLyBQcm9jZXNhIGVsIHNpZ3VpZW50ZSBlbGVtZW50byBkZSBsYSBjb2xhXG4gICAgc2VsZi5uZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgX3dvcmtpbmcgPSAhIWlkeHMubGVuZ3RoO1xuICAgICAgaWYgKCFfd29ya2luZykgcmV0dXJuO1xuICAgICAgdmFyIGlkeCA9IGlkeHMuc2hpZnQoKTtcbiAgICAgIHZhciBpdGVtID0gaXRlbXNbaWR4XTtcbiAgICAgIGNiKGlkeCwgaXRlbSwgZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLm5leHQoKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH07XG59XG5cbnZhciBfbmFtZSA9IGV4cG9ydHMuX25hbWUgPSAnd29yayc7XG5leHBvcnRzLmRlZmF1bHQgPSBhbmd1bGFyLm1vZHVsZShfbmFtZSwgW10pLmZhY3RvcnkoW19uYW1lXS5qb2luKCcnKSwgd29yayk7XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvc2VydmljZXMvd29yay5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIG9hU3JjRGlyZWN0aXZlKG9mZmxpbmVBc3NldHNTZXJ2aWNlLCAkdGltZW91dCkgeyAnbmdJbmplY3QnO1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgc2NvcGU6IHtcclxuICAgICAgdXJsOiAnPW9hU3JjJyxcclxuICAgICAgbG9jYWxVcmw6ICc9b2FMb2NhbFVybCcsXHJcbiAgICB9LFxyXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcblxyXG4gICAgICBmdW5jdGlvbiBjYih1cmwpIHtcclxuICAgICAgICBpZiAoc2NvcGUubG9jYWxVcmwpe1xyXG4gICAgICAgICAgc2NvcGUubG9jYWxVcmwgPSB1cmw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFNldCBzcmMgdG8gaW1hZ2UgYXR0cnNcclxuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgZWxlbWVudC5hdHRyKCdzcmMnLCB1cmwpO1xyXG4gICAgICAgIH0sIDEwKTtcclxuICAgICAgfVxyXG4gICAgICBvZmZsaW5lQXNzZXRzU2VydmljZS5kb3dubG9hZChzY29wZS51cmwsIGNiKTtcclxuICAgICAgZWxlbWVudC5vbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgb2ZmbGluZUFzc2V0c1NlcnZpY2UucmVsZWFzZShzY29wZS51cmwsIGNiKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG4gIH07XHJcbn07XHJcblxyXG5pbXBvcnQgeyBfbmFtZSBhcyBvZmZsaW5lQXNzZXRzIH0gZnJvbSAnLi4vc2VydmljZXMvb2ZmbGluZUFzc2V0cyc7XHJcblxyXG5leHBvcnQgdmFyIF9uYW1lID0gJ29hU3JjJztcclxuZXhwb3J0IGRlZmF1bHQgYW5ndWxhci5tb2R1bGUoX25hbWUsIFtcclxuICBvZmZsaW5lQXNzZXRzXHJcbl0pXHJcbiAgLmRpcmVjdGl2ZShfbmFtZSwgb2FTcmNEaXJlY3RpdmUpO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2RpcmVjdGl2ZXMvb2FTcmMuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLl9uYW1lID0gdW5kZWZpbmVkO1xuXG52YXIgX29mZmxpbmVBc3NldHMgPSByZXF1aXJlKCcuLi9zZXJ2aWNlcy9vZmZsaW5lQXNzZXRzJyk7XG5cbmZ1bmN0aW9uIG9hU3JjRGlyZWN0aXZlKG9mZmxpbmVBc3NldHNTZXJ2aWNlLCAkdGltZW91dCkge1xuICAnbmdJbmplY3QnO1xuXG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICBzY29wZToge1xuICAgICAgdXJsOiAnPW9hU3JjJyxcbiAgICAgIGxvY2FsVXJsOiAnPW9hTG9jYWxVcmwnXG4gICAgfSxcbiAgICBsaW5rOiBmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXG4gICAgICBmdW5jdGlvbiBjYih1cmwpIHtcbiAgICAgICAgaWYgKHNjb3BlLmxvY2FsVXJsKSB7XG4gICAgICAgICAgc2NvcGUubG9jYWxVcmwgPSB1cmw7XG4gICAgICAgIH1cbiAgICAgICAgLy8gU2V0IHNyYyB0byBpbWFnZSBhdHRyc1xuICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZWxlbWVudC5hdHRyKCdzcmMnLCB1cmwpO1xuICAgICAgICB9LCAxMCk7XG4gICAgICB9XG4gICAgICBvZmZsaW5lQXNzZXRzU2VydmljZS5kb3dubG9hZChzY29wZS51cmwsIGNiKTtcbiAgICAgIGVsZW1lbnQub24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBvZmZsaW5lQXNzZXRzU2VydmljZS5yZWxlYXNlKHNjb3BlLnVybCwgY2IpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xufTtcblxudmFyIF9uYW1lID0gZXhwb3J0cy5fbmFtZSA9ICdvYVNyYyc7XG5leHBvcnRzLmRlZmF1bHQgPSBhbmd1bGFyLm1vZHVsZShfbmFtZSwgW19vZmZsaW5lQXNzZXRzLl9uYW1lXSkuZGlyZWN0aXZlKF9uYW1lLCBvYVNyY0RpcmVjdGl2ZSk7XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvZGlyZWN0aXZlcy9vYVNyYy5qc1xuICoqLyJdLCJzb3VyY2VSb290IjoiIn0=