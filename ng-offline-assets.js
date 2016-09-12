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
	      from: '=oaFrom',
	      dest: '=oaDest',
	      important: '=oaImportant',
	      loadingClass: '@oaLoadingClass',
	      failClass: '@oaFailClass',
	      fail: '&oaOnFail',
	      removeLoading: '@oaRemoveLoadingClass'
	    },
	    link: function link(scope, element, attrs) {
	      offlineAssetsService.download(scope.url, function (url) {
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
	        item.$url = new URL(url);
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
	      url: '=oaSrc'
	    },
	    link: function link(scope, element, attrs) {
	
	      function cb(url) {
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
	exports.default = angular.module(_name, [_offlineAssets._name]).directive(_name, oaBgDirective);

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMGEzODg1MGZiNmEyNjlhNzc3NzUiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9kaXJlY3RpdmVzL29hQmcuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2RpcmVjdGl2ZXMvb2FCZy5qcz8xN2ViIiwid2VicGFjazovLy8uL3NyYy9zZXJ2aWNlcy9vZmZsaW5lQXNzZXRzLmpzIiwid2VicGFjazovLy8uL3NyYy9zZXJ2aWNlcy9vZmZsaW5lQXNzZXRzLmpzPzViNWMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3NlcnZpY2VzL29mZmxpbmVBc3NldHNGcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvc2VydmljZXMvb2ZmbGluZUFzc2V0c0ZzLmpzPzU5OTQiLCJ3ZWJwYWNrOi8vLy4vc3JjL3NlcnZpY2VzL3dvcmsuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3NlcnZpY2VzL3dvcmsuanM/MjQ2ZCIsIndlYnBhY2s6Ly8vLi9zcmMvZGlyZWN0aXZlcy9vYVNyYy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvZGlyZWN0aXZlcy9vYVNyYy5qcz80NGRiIl0sIm5hbWVzIjpbImFuZ3VsYXIiLCJtb2R1bGUiLCJjb25zdGFudCIsIm9hQmdEaXJlY3RpdmUiLCJvZmZsaW5lQXNzZXRzU2VydmljZSIsIiR0aW1lb3V0IiwicmVzdHJpY3QiLCJzY29wZSIsInVybCIsImZyb20iLCJkZXN0IiwiaW1wb3J0YW50IiwibG9hZGluZ0NsYXNzIiwiZmFpbENsYXNzIiwiZmFpbCIsInJlbW92ZUxvYWRpbmciLCJsaW5rIiwiZWxlbWVudCIsImF0dHJzIiwiZG93bmxvYWQiLCJjc3MiLCJfbmFtZSIsImRpcmVjdGl2ZSIsIm9mZmxpbmVBc3NldHNGc1NlcnZpY2UiLCJ3b3JrIiwiJHEiLCIkbG9nIiwiJGh0dHAiLCJmcyIsInJlc29sdmVkVXJsIiwiaXRlbSIsIiRyZXNvbHZlZFVybCIsIiR2ZXJzaW9uIiwiJGNicyIsImZvckVhY2giLCJjYiIsImdldEZpbGVOYW1lVG8iLCJjb25jYXQiLCJnZXREZXN0Iiwic3BsaXQiLCJob3N0IiwicGF0aG5hbWUiLCJmaWx0ZXIiLCJ2YWxvciIsInRyaW0iLCJqb2luIiwicXVldWUiLCJpZHgiLCJuZXh0IiwicGF0aGZpbGUiLCIkdXJsIiwidGhlbiIsImZpbGVFbnRyeSIsImxvZyIsInRvVVJMIiwiY2F0Y2giLCJlcnIiLCJlcnJvciIsImdldCIsImFkZFRvUXVldWUiLCJhZGQiLCJzdGFydGVkIiwic3RhcnQiLCJVUkwiLCJyZWFkeSIsImdldEZpbGUiLCJmZiIsImhlYWQiLCJyZXMiLCJpc1VwZGF0ZSIsImhlYWRlcnMiLCJmaWxlIiwic2l6ZSIsInBhcnNlSW50IiwibGFzdE1vZGlmaWVkRGF0ZSIsIkRhdGUiLCJwdXNoIiwicmVsZWFzZSIsImluZGV4T2YiLCJzcGxpY2UiLCJzZXREZXN0IiwicERlc3QiLCJzZXREaXIiLCJmYWN0b3J5IiwiYmxvY2tTaXplIiwiY3VycmVudFF1b3RhIiwiY3VycmVudFVzYWdlIiwiYXBpTG9hZGVkRGVmZXJyZWQiLCJkZWZlciIsInF1b3RhSW5mb0RlZmVycmVkIiwicmVhZHlEZWZlcnJlZCIsImFsbCIsInByb21pc2UiLCJyZXF1ZXN0RmlsZVN5c3RlbSIsIndpbmRvdyIsIndlYmtpdFJlcXVlc3RGaWxlU3lzdGVtIiwicFN0b3JhZ2UiLCJuYXZpZ2F0b3IiLCJ3ZWJraXRQZXJzaXN0ZW50U3RvcmFnZSIsInJlcXVlc3RRdW90YSIsInF1ZXJ5VXNhZ2VBbmRRdW90YSIsImNvcmRvdmEiLCJkb2N1bWVudCIsImFkZEV2ZW50TGlzdGVuZXIiLCJMb2NhbEZpbGVTeXN0ZW0iLCJQRVJTSVNURU5UIiwiZXh0ZXJuYWxEYXRhRGlyZWN0b3J5IiwiZGF0YURpcmVjdG9yeSIsInJlc29sdmUiLCJyZWplY3QiLCJ1c2VkIiwiZ3JhbnRlZCIsInJlcXVlc3RTdG9yYWdlUXVvdGEiLCJwRnMiLCJmbiIsImRlZmVycmVkIiwiYXJncyIsImFyZ3VtZW50cyIsInVuc2hpZnQiLCJhcHBseSIsImdldEZpbGVFbnRyeSIsImNyZWF0ZSIsInJlc29sdmVMb2NhbEZpbGVTeXN0ZW1VUkwiLCJyb290IiwiZSIsImNvZGUiLCJuYW1lIiwibWVzc2FnZSIsImFueVF1b3RhUmVxdWVzdFJlamVjdCIsInJlcXVpcmVkQnl0ZXMiLCJxdW90YVJlcXVlc3RSZWplY3RlZEVycm9yIiwiTWF0aCIsIm1heCIsImJ5dGVzR3JhbnRlZCIsInJlcXVlc3RTdG9yYWdlUXVvdGFJZlJlcXVpcmVkIiwibmVlZGVkQnl0ZXMiLCJtaXNzaW5nQnl0ZXMiLCJta2RpciIsImRpciIsImRpcnMiLCJfbWtkaXIiLCJmb2xkZXJzIiwicm9vdERpckVudHJ5Iiwic2xpY2UiLCJsZW5ndGgiLCJnZXREaXJlY3RvcnkiLCJkaXJFbnRyeSIsInJlbW92ZUZpbGUiLCJyZW1vdmUiLCJmcm9tVXJsIiwibG9jYWxVcmwiLCJjdXN0b21FcnJvckhhbmRsZXIiLCJtc2ciLCJjdXN0b21Eb3dubG9hZEZpbGUiLCJjb25zb2xlIiwiZmlsZW5hbWUiLCJwb3AiLCJ3aGVuIiwibG9jYWxEZWZlcnJlZCIsImNyZWF0ZVdyaXRlciIsIndyaXRlciIsIm9ud3JpdGVlbmQiLCJvbmVycm9yIiwieGhyIiwiWE1MSHR0cFJlcXVlc3QiLCJvcGVuIiwicmVzcG9uc2VUeXBlIiwib25sb2FkIiwic3RhdHVzIiwiYmxvYiIsInJlc3BvbnNlIiwid3JpdGUiLCJzZW5kIiwic2VsZiIsIml0ZW1zIiwiaWR4cyIsIl93b3JraW5nIiwiX3N0YXJ0ZWQiLCJ3b3JraW5nIiwic2hpZnQiLCJhdHRyIiwib24iXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7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QU8rSCxNQUFNL0g7Ozs7S0FJZjhILEtBQUs3SCxPQUFPLFlBQVc7T0FDckJnSSxXQUFXLENBQUMsQ0FBQ0QsS0FBSy9CO09BQ2xCLElBQUksQ0FBQ2dDLFVBQVU7T0FDZixJQUFJakksTUFBTWdJLEtBQUtJO09BQ2YsSUFBSXJKLE9BQU9nSixNQUFNL0g7T0FDakJaLEdBQUdZLEtBQUtqQixNQUFNLFlBQVk7U0FDeEIrSSxLQUFLN0g7Ozs7OztBQVFOLEtBQUkzQix3QkFBUTtBQ0duQixTQUFRLFVERk9yQixRQUFRQyxPQUFPb0IsT0FBTyxJQUNsQzhELFFBQVEsQ0FBQzlELE9BQU93QixLQUFLLEtBQUtyQixNOzs7Ozs7QUVoRTdCOzs7QUNFQSxRQUFPLGVBQWUsU0FBUyxjQUFjO0dBQzNDLE9BQU87O0FBRVQsU0FBUSxRQUFROztBRDRCaEI7O0FBL0JBLFVBQVNyQixjQUFjQyxzQkFBc0JDLFVBQVU7R0FBRTs7R0FDdkQsT0FBTztLQUNMQyxVQUFVO0tBQ1ZDLE9BQU87T0FDTEMsS0FBSzs7S0FTUFEsTUFBTSxjQUFTVCxPQUFPVSxTQUFTQyxPQUFPOztPQUVwQyxTQUFTaUIsR0FBRzNCLEtBQUs7O1NBRWZILFNBQVMsWUFBVTtXQUNqQlksUUFBUW1LLEtBQUssT0FBTzVLO1lBQ25COzs7T0FHTEoscUJBQXFCZSxTQUFTWixNQUFNQyxLQUFLMkI7T0FDekNsQixRQUFRb0ssR0FBRyxZQUFZLFlBQVk7U0FDakNqTCxxQkFBcUJ5RSxRQUFRdEUsTUFBTUMsS0FBSzJCOzs7O0VBSy9DOztBQUlNLEtBQUlkLHdCQUFRO0FDQW5CLFNBQVEsVURDT3JCLFFBQVFDLE9BQU9vQixPQUFPLHdCQUdsQ0MsVUFBVUQsT0FBT2xCLGUiLCJmaWxlIjoibmctb2ZmbGluZS1hc3NldHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIDBhMzg4NTBmYjZhMjY5YTc3Nzc1XG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuaW1wb3J0IHsgX25hbWUgYXMgb2FCZyB9IGZyb20gJy4vZGlyZWN0aXZlcy9vYUJnJztcclxuaW1wb3J0IHsgX25hbWUgYXMgb2FTcmMgfSBmcm9tICcuL2RpcmVjdGl2ZXMvb2FTcmMnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ25nT2ZmbGluZUFzc2V0cycsIFtcclxuICBvYUJnLFxyXG4gIG9hU3JjXHJcbl0pXHJcblxyXG4uY29uc3RhbnQoJ09BX1ZFUlNJT04nLCAnMC4wLjEnKVxyXG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9pbmRleC5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIG9hQmdEaXJlY3RpdmUob2ZmbGluZUFzc2V0c1NlcnZpY2UsICR0aW1lb3V0KSB7ICduZ0luamVjdCc7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICBzY29wZToge1xyXG4gICAgICB1cmw6ICc9b2FCZycsXHJcbiAgICAgIGZyb206ICc9b2FGcm9tJyxcclxuICAgICAgZGVzdDogJz1vYURlc3QnLFxyXG4gICAgICBpbXBvcnRhbnQ6ICc9b2FJbXBvcnRhbnQnLFxyXG4gICAgICBsb2FkaW5nQ2xhc3M6ICdAb2FMb2FkaW5nQ2xhc3MnLFxyXG4gICAgICBmYWlsQ2xhc3M6ICdAb2FGYWlsQ2xhc3MnLFxyXG4gICAgICBmYWlsOiAnJm9hT25GYWlsJyxcclxuICAgICAgcmVtb3ZlTG9hZGluZzogJ0BvYVJlbW92ZUxvYWRpbmdDbGFzcycsXHJcbiAgICB9LFxyXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgIG9mZmxpbmVBc3NldHNTZXJ2aWNlLmRvd25sb2FkKHNjb3BlLnVybCwgZnVuY3Rpb24gKHVybCkge1xyXG4gICAgICAgIC8vIFNldCBzcmMgdG8gaW1hZ2UgYXR0cnNcclxuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgZWxlbWVudC5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCAndXJsKCcgKyB1cmwgKyAnKScpO1xyXG4gICAgICAgIH0sIDEwKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxufTtcclxuXHJcbmltcG9ydCB7IF9uYW1lIGFzIG9mZmxpbmVBc3NldHMgfSBmcm9tICcuLi9zZXJ2aWNlcy9vZmZsaW5lQXNzZXRzJztcclxuXHJcbmV4cG9ydCB2YXIgX25hbWUgPSAnb2FCZyc7XHJcbmV4cG9ydCBkZWZhdWx0IGFuZ3VsYXIubW9kdWxlKF9uYW1lLCBbXHJcbiAgb2ZmbGluZUFzc2V0c1xyXG5dKVxyXG4gIC5kaXJlY3RpdmUoX25hbWUsIG9hQmdEaXJlY3RpdmUpO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2RpcmVjdGl2ZXMvb2FCZy5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuX25hbWUgPSB1bmRlZmluZWQ7XG5cbnZhciBfb2ZmbGluZUFzc2V0cyA9IHJlcXVpcmUoJy4uL3NlcnZpY2VzL29mZmxpbmVBc3NldHMnKTtcblxuZnVuY3Rpb24gb2FCZ0RpcmVjdGl2ZShvZmZsaW5lQXNzZXRzU2VydmljZSwgJHRpbWVvdXQpIHtcbiAgJ25nSW5qZWN0JztcblxuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgc2NvcGU6IHtcbiAgICAgIHVybDogJz1vYUJnJyxcbiAgICAgIGZyb206ICc9b2FGcm9tJyxcbiAgICAgIGRlc3Q6ICc9b2FEZXN0JyxcbiAgICAgIGltcG9ydGFudDogJz1vYUltcG9ydGFudCcsXG4gICAgICBsb2FkaW5nQ2xhc3M6ICdAb2FMb2FkaW5nQ2xhc3MnLFxuICAgICAgZmFpbENsYXNzOiAnQG9hRmFpbENsYXNzJyxcbiAgICAgIGZhaWw6ICcmb2FPbkZhaWwnLFxuICAgICAgcmVtb3ZlTG9hZGluZzogJ0BvYVJlbW92ZUxvYWRpbmdDbGFzcydcbiAgICB9LFxuICAgIGxpbms6IGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICBvZmZsaW5lQXNzZXRzU2VydmljZS5kb3dubG9hZChzY29wZS51cmwsIGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgLy8gU2V0IHNyYyB0byBpbWFnZSBhdHRyc1xuICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZWxlbWVudC5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCAndXJsKCcgKyB1cmwgKyAnKScpO1xuICAgICAgICB9LCAxMCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59O1xuXG52YXIgX25hbWUgPSBleHBvcnRzLl9uYW1lID0gJ29hQmcnO1xuZXhwb3J0cy5kZWZhdWx0ID0gYW5ndWxhci5tb2R1bGUoX25hbWUsIFtfb2ZmbGluZUFzc2V0cy5fbmFtZV0pLmRpcmVjdGl2ZShfbmFtZSwgb2FCZ0RpcmVjdGl2ZSk7XG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvZGlyZWN0aXZlcy9vYUJnLmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gb2ZmbGluZUFzc2V0c1NlcnZpY2Uob2ZmbGluZUFzc2V0c0ZzU2VydmljZSwgd29yaywgJHEsICRsb2csICRodHRwKSB7ICduZ0luamVjdCc7XHJcbiAgdmFyIGZzID0gb2ZmbGluZUFzc2V0c0ZzU2VydmljZTtcclxuXHJcbiAgLy8gUmVhbGl6YSBlbCBsbGFtYWRvIGRlIHVuYSBsaXN0YSBkZSBjYWxsYmFja3MgcGFzYW5kbyBwb3IgcGFyYW1ldHJvIHVuYSB1cmxcclxuICBmdW5jdGlvbiByZXNvbHZlZFVybChpdGVtLCB1cmwpe1xyXG4gICAgaXRlbS4kcmVzb2x2ZWRVcmwgPSB1cmwgKyAnPycgKyBpdGVtLiR2ZXJzaW9uKys7XHJcbiAgICBpdGVtLiRjYnMgPSBpdGVtLiRjYnMgfHwgW107XHJcbiAgICBhbmd1bGFyLmZvckVhY2goaXRlbS4kY2JzLCBmdW5jdGlvbiAoY2IpIHtcclxuICAgICAgaWYoY2IpIGNiKGl0ZW0uJHJlc29sdmVkVXJsKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgdmFyIGRlc3QgPSBudWxsO1xyXG5cclxuICB2YXIgZ2V0RmlsZU5hbWVUbyA9IGZ1bmN0aW9uICh1cmwpIHtcclxuXHJcbiAgICByZXR1cm4gW11cclxuICAgICAgLmNvbmNhdCgoZnMuZ2V0RGVzdCgpIHx8ICcvJykuc3BsaXQoJy8nKSlcclxuICAgICAgLmNvbmNhdChkZXN0IHx8IFtdKVxyXG4gICAgICAuY29uY2F0KHVybC5ob3N0LnNwbGl0KCc6JykpXHJcbiAgICAgIC5jb25jYXQodXJsLnBhdGhuYW1lLnNwbGl0KCcvJykpXHJcbiAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHZhbG9yKSB7XHJcbiAgICAgICAgcmV0dXJuICh2YWxvciB8fCAnJykudHJpbSgpICE9ICcnO1xyXG4gICAgICB9KVxyXG4gICAgICAuam9pbignLycpO1xyXG5cclxuICB9O1xyXG4gIFxyXG4gIC8vIExpc3RhIGRlIGRlc2Nhcmdhc1xyXG4gIHZhciBxdWV1ZSA9IG5ldyB3b3JrKGZ1bmN0aW9uIChpZHgsIGl0ZW0sIG5leHQpIHtcclxuICAgIHZhciBwYXRoZmlsZSA9IGdldEZpbGVOYW1lVG8oaXRlbS4kdXJsKTtcclxuICAgIGZzLmRvd25sb2FkKGl0ZW0uJHVybCwgcGF0aGZpbGUpLnRoZW4oZnVuY3Rpb24gKGZpbGVFbnRyeSkge1xyXG4gICAgICAkbG9nLmxvZyhbJ2Rvd25sb2FkZWQ6JyxpdGVtLiR1cmxdLmpvaW4oJycpKTtcclxuICAgICAgcmVzb2x2ZWRVcmwoaXRlbSwgZmlsZUVudHJ5LnRvVVJMKCkpO1xyXG4gICAgICBuZXh0KCk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgJGxvZy5lcnJvcihbaWR4LCBlcnJdKTtcclxuICAgICAgbmV4dCgpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG5cclxuICAvLyBGdW5jaW9uYSBwYXJhIGluaWNhciBsYSBkZXNjYXJnYSBkZSB1biBhcmNoaXZvXHJcbiAgZnVuY3Rpb24gZG93bmxvYWQgKHVybCwgY2IpIHtcclxuICAgIC8vICRsb2cubG9nKFsnZG93bmxvYWQ6JywgdXJsXS5qb2luKCcnKSk7XHJcblxyXG4gICAgLy8gT2J0ZW5lciBlbGVtZW50byBjb3JyZXNwb25kaWVudGUgYSBsYSBVUkxcclxuICAgIHZhciBpdGVtID0gcXVldWUuZ2V0KHVybCk7XHJcblxyXG4gICAgLy8gTm8gZXhpc3RlIHVuIGVsZW1lbnRvIHBhcmEgbGEgVVJMXHJcbiAgICBpZiAoIWl0ZW0pIHtcclxuXHJcbiAgICAgIC8vIENyZWFyIGVsIGVsZW1lbnRvXHJcbiAgICAgIGl0ZW0gPSB7fTtcclxuICAgICAgaXRlbS4kdmVyc2lvbiA9IDE7XHJcbiAgICAgIGl0ZW0uJHVybCA9IG5ldyBVUkwodXJsKTtcclxuICAgICAgaXRlbS4kY2JzID0gW107IC8vIExpc3RhIGRlIGNhbGxiYWNrcyBkZWwgZWxlbWVudG9cclxuICAgICAgICBcclxuICAgICAgZnVuY3Rpb24gYWRkVG9RdWV1ZSAoKSB7XHJcbiAgICAgICAgLy8gQWdyZWdhciBhbCBhcmNoaXZvIGRlIGRlc2Nhcmdhc1xyXG4gICAgICAgIHF1ZXVlLmFkZCh1cmwsIGl0ZW0pO1xyXG4gICAgICAgIC8vIFNpIG5vIHNlIGhhIGluaWNpYWRvIGxhIGRlc2NhcmdhciBpbmljaWFybGEgYWwgdGVybWluYXIgbGEgY2FyZ2FcclxuICAgICAgICAvLyBkZWwgRlMuXHJcbiAgICAgICAgaWYgKCFxdWV1ZS5zdGFydGVkKCkpIHtcclxuICAgICAgICAgIHF1ZXVlLnN0YXJ0KCk7XHJcbiAgICAgICAgICBxdWV1ZS5uZXh0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBmcy5yZWFkeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgcGF0aGZpbGUgPSBnZXRGaWxlTmFtZVRvKGl0ZW0uJHVybCk7XHJcbiAgICAgICAgLy8gT2J0ZW5lciBsYSBpbnN0YW5jaWEgZGVsIGFyY2hpdm9cclxuICAgICAgICBmcy5nZXRGaWxlKHBhdGhmaWxlKS50aGVuKGZ1bmN0aW9uIChmZikge1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICByZXNvbHZlZFVybChpdGVtLCBmZi5maWxlRW50cnkudG9VUkwoKSk7XHJcblxyXG4gICAgICAgICAgLy8gT2J0ZW5lciBsYXMgY2FiZWNlcmFzIGRlbCBhcmNoaXZvXHJcbiAgICAgICAgICAkaHR0cC5oZWFkKHVybCkudGhlbihmdW5jdGlvbiAocmVzKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgaXNVcGRhdGUgPSAoIXJlcy5oZWFkZXJzKCdjb250ZW50LWxlbmd0aCcpIHx8IGZmLmZpbGUuc2l6ZSA9PSBwYXJzZUludChyZXMuaGVhZGVycygnY29udGVudC1sZW5ndGgnKSkpICYmXHJcbiAgICAgICAgICAgICAgKCFyZXMuaGVhZGVycygnbGFzdC1tb2RpZmllZCcpIHx8IGZmLmZpbGUubGFzdE1vZGlmaWVkRGF0ZSA+IG5ldyBEYXRlKHJlcy5oZWFkZXJzKCdsYXN0LW1vZGlmaWVkJykpKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghaXNVcGRhdGUpIHtcclxuICAgICAgICAgICAgICBhZGRUb1F1ZXVlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgLy8gU2kgbm8gZXhpc3RlIGVsIGFyY2hpdm9cclxuICAgICAgICAuY2F0Y2goYWRkVG9RdWV1ZSk7XHJcbiAgICAgICAgXHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH0gZWxzZSBpZiAoaXRlbS4kcmVzb2x2ZWRVcmwpe1xyXG4gICAgICBjYihpdGVtLiRyZXNvbHZlZFVybCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWdyZWdhciBlbCBjYiByZWNpYmlkbyBwb3IgcGFyw6FtZXRybyBhIGxhIGxpc3RhIGRlIGNhbGxiYWNrc1xyXG4gICAgaXRlbS4kY2JzLnB1c2goY2IpO1xyXG5cclxuICB9XHJcblxyXG4gIC8vIFJlbXVldmUgdW4gY2JcclxuICBmdW5jdGlvbiByZWxlYXNlICh1cmwsIGNiKSB7XHJcblxyXG4gICAgdmFyIGl0ZW0gPSBxdWV1ZS5nZXQodXJsKTtcclxuICAgIGlmIChpdGVtKSB7XHJcbiAgICAgIHZhciBpZHggPSBpdGVtLiRjYnMuaW5kZXhPZihjYik7XHJcbiAgICAgIGlmIChpZHggIT0gLTEpIGl0ZW0uJGNicy5zcGxpY2UoaWR4LCAxKTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG5cclxuICAvLyBBc2lnbmEgZWwgZGlyZWN0b3JpbyBkZXN0aW5vIHBhcmEgbG9zIGFyY2hpdm9zXHJcbiAgZnVuY3Rpb24gc2V0RGVzdCAocERlc3QpIHtcclxuXHJcbiAgICBkZXN0ID0gcERlc3Q7XHJcblxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGRvd25sb2FkIDogZG93bmxvYWQsXHJcbiAgICByZWxlYXNlIDogcmVsZWFzZSxcclxuICAgIHNldERpcjogc2V0RGVzdCxcclxuICB9O1xyXG5cclxufVxyXG5cclxuaW1wb3J0IHsgX25hbWUgYXMgb2ZmbGluZUFzc2V0c0ZzIH0gZnJvbSAnLi9vZmZsaW5lQXNzZXRzRnMnO1xyXG5pbXBvcnQgeyBfbmFtZSBhcyB3b3JrIH0gZnJvbSAnLi93b3JrJztcclxuXHJcbmV4cG9ydCB2YXIgX25hbWUgPSAnb2ZmbGluZUFzc2V0cyc7XHJcbmV4cG9ydCBkZWZhdWx0IGFuZ3VsYXIubW9kdWxlKF9uYW1lLCBbXHJcbiAgb2ZmbGluZUFzc2V0c0ZzLFxyXG4gIHdvcmtcclxuXSlcclxuICAuZmFjdG9yeShbX25hbWUsICdTZXJ2aWNlJ10uam9pbignJyksIG9mZmxpbmVBc3NldHNTZXJ2aWNlKTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9zZXJ2aWNlcy9vZmZsaW5lQXNzZXRzLmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5fbmFtZSA9IHVuZGVmaW5lZDtcblxudmFyIF9vZmZsaW5lQXNzZXRzRnMgPSByZXF1aXJlKCcuL29mZmxpbmVBc3NldHNGcycpO1xuXG52YXIgX3dvcmsgPSByZXF1aXJlKCcuL3dvcmsnKTtcblxuZnVuY3Rpb24gb2ZmbGluZUFzc2V0c1NlcnZpY2Uob2ZmbGluZUFzc2V0c0ZzU2VydmljZSwgd29yaywgJHEsICRsb2csICRodHRwKSB7XG4gICduZ0luamVjdCc7XG5cbiAgdmFyIGZzID0gb2ZmbGluZUFzc2V0c0ZzU2VydmljZTtcblxuICAvLyBSZWFsaXphIGVsIGxsYW1hZG8gZGUgdW5hIGxpc3RhIGRlIGNhbGxiYWNrcyBwYXNhbmRvIHBvciBwYXJhbWV0cm8gdW5hIHVybFxuICBmdW5jdGlvbiByZXNvbHZlZFVybChpdGVtLCB1cmwpIHtcbiAgICBpdGVtLiRyZXNvbHZlZFVybCA9IHVybCArICc/JyArIGl0ZW0uJHZlcnNpb24rKztcbiAgICBpdGVtLiRjYnMgPSBpdGVtLiRjYnMgfHwgW107XG4gICAgYW5ndWxhci5mb3JFYWNoKGl0ZW0uJGNicywgZnVuY3Rpb24gKGNiKSB7XG4gICAgICBpZiAoY2IpIGNiKGl0ZW0uJHJlc29sdmVkVXJsKTtcbiAgICB9KTtcbiAgfVxuXG4gIHZhciBkZXN0ID0gbnVsbDtcblxuICB2YXIgZ2V0RmlsZU5hbWVUbyA9IGZ1bmN0aW9uIGdldEZpbGVOYW1lVG8odXJsKSB7XG5cbiAgICByZXR1cm4gW10uY29uY2F0KChmcy5nZXREZXN0KCkgfHwgJy8nKS5zcGxpdCgnLycpKS5jb25jYXQoZGVzdCB8fCBbXSkuY29uY2F0KHVybC5ob3N0LnNwbGl0KCc6JykpLmNvbmNhdCh1cmwucGF0aG5hbWUuc3BsaXQoJy8nKSkuZmlsdGVyKGZ1bmN0aW9uICh2YWxvcikge1xuICAgICAgcmV0dXJuICh2YWxvciB8fCAnJykudHJpbSgpICE9ICcnO1xuICAgIH0pLmpvaW4oJy8nKTtcbiAgfTtcblxuICAvLyBMaXN0YSBkZSBkZXNjYXJnYXNcbiAgdmFyIHF1ZXVlID0gbmV3IHdvcmsoZnVuY3Rpb24gKGlkeCwgaXRlbSwgbmV4dCkge1xuICAgIHZhciBwYXRoZmlsZSA9IGdldEZpbGVOYW1lVG8oaXRlbS4kdXJsKTtcbiAgICBmcy5kb3dubG9hZChpdGVtLiR1cmwsIHBhdGhmaWxlKS50aGVuKGZ1bmN0aW9uIChmaWxlRW50cnkpIHtcbiAgICAgICRsb2cubG9nKFsnZG93bmxvYWRlZDonLCBpdGVtLiR1cmxdLmpvaW4oJycpKTtcbiAgICAgIHJlc29sdmVkVXJsKGl0ZW0sIGZpbGVFbnRyeS50b1VSTCgpKTtcbiAgICAgIG5leHQoKTtcbiAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAkbG9nLmVycm9yKFtpZHgsIGVycl0pO1xuICAgICAgbmV4dCgpO1xuICAgIH0pO1xuICB9KTtcblxuICAvLyBGdW5jaW9uYSBwYXJhIGluaWNhciBsYSBkZXNjYXJnYSBkZSB1biBhcmNoaXZvXG4gIGZ1bmN0aW9uIGRvd25sb2FkKHVybCwgY2IpIHtcbiAgICAvLyAkbG9nLmxvZyhbJ2Rvd25sb2FkOicsIHVybF0uam9pbignJykpO1xuXG4gICAgLy8gT2J0ZW5lciBlbGVtZW50byBjb3JyZXNwb25kaWVudGUgYSBsYSBVUkxcbiAgICB2YXIgaXRlbSA9IHF1ZXVlLmdldCh1cmwpO1xuXG4gICAgLy8gTm8gZXhpc3RlIHVuIGVsZW1lbnRvIHBhcmEgbGEgVVJMXG4gICAgaWYgKCFpdGVtKSB7XG4gICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBMaXN0YSBkZSBjYWxsYmFja3MgZGVsIGVsZW1lbnRvXG5cbiAgICAgICAgdmFyIGFkZFRvUXVldWUgPSBmdW5jdGlvbiBhZGRUb1F1ZXVlKCkge1xuICAgICAgICAgIC8vIEFncmVnYXIgYWwgYXJjaGl2byBkZSBkZXNjYXJnYXNcbiAgICAgICAgICBxdWV1ZS5hZGQodXJsLCBpdGVtKTtcbiAgICAgICAgICAvLyBTaSBubyBzZSBoYSBpbmljaWFkbyBsYSBkZXNjYXJnYXIgaW5pY2lhcmxhIGFsIHRlcm1pbmFyIGxhIGNhcmdhXG4gICAgICAgICAgLy8gZGVsIEZTLlxuICAgICAgICAgIGlmICghcXVldWUuc3RhcnRlZCgpKSB7XG4gICAgICAgICAgICBxdWV1ZS5zdGFydCgpO1xuICAgICAgICAgICAgcXVldWUubmV4dCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBDcmVhciBlbCBlbGVtZW50b1xuICAgICAgICBpdGVtID0ge307XG4gICAgICAgIGl0ZW0uJHZlcnNpb24gPSAxO1xuICAgICAgICBpdGVtLiR1cmwgPSBuZXcgVVJMKHVybCk7XG4gICAgICAgIGl0ZW0uJGNicyA9IFtdO1xuXG4gICAgICAgIGZzLnJlYWR5KCkudGhlbihmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICB2YXIgcGF0aGZpbGUgPSBnZXRGaWxlTmFtZVRvKGl0ZW0uJHVybCk7XG4gICAgICAgICAgLy8gT2J0ZW5lciBsYSBpbnN0YW5jaWEgZGVsIGFyY2hpdm9cbiAgICAgICAgICBmcy5nZXRGaWxlKHBhdGhmaWxlKS50aGVuKGZ1bmN0aW9uIChmZikge1xuXG4gICAgICAgICAgICByZXNvbHZlZFVybChpdGVtLCBmZi5maWxlRW50cnkudG9VUkwoKSk7XG5cbiAgICAgICAgICAgIC8vIE9idGVuZXIgbGFzIGNhYmVjZXJhcyBkZWwgYXJjaGl2b1xuICAgICAgICAgICAgJGh0dHAuaGVhZCh1cmwpLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuXG4gICAgICAgICAgICAgIHZhciBpc1VwZGF0ZSA9ICghcmVzLmhlYWRlcnMoJ2NvbnRlbnQtbGVuZ3RoJykgfHwgZmYuZmlsZS5zaXplID09IHBhcnNlSW50KHJlcy5oZWFkZXJzKCdjb250ZW50LWxlbmd0aCcpKSkgJiYgKCFyZXMuaGVhZGVycygnbGFzdC1tb2RpZmllZCcpIHx8IGZmLmZpbGUubGFzdE1vZGlmaWVkRGF0ZSA+IG5ldyBEYXRlKHJlcy5oZWFkZXJzKCdsYXN0LW1vZGlmaWVkJykpKTtcblxuICAgICAgICAgICAgICBpZiAoIWlzVXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgYWRkVG9RdWV1ZSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgLy8gU2kgbm8gZXhpc3RlIGVsIGFyY2hpdm9cbiAgICAgICAgICAuY2F0Y2goYWRkVG9RdWV1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSkoKTtcbiAgICB9IGVsc2UgaWYgKGl0ZW0uJHJlc29sdmVkVXJsKSB7XG4gICAgICBjYihpdGVtLiRyZXNvbHZlZFVybCk7XG4gICAgfVxuXG4gICAgLy8gQWdyZWdhciBlbCBjYiByZWNpYmlkbyBwb3IgcGFyw6FtZXRybyBhIGxhIGxpc3RhIGRlIGNhbGxiYWNrc1xuICAgIGl0ZW0uJGNicy5wdXNoKGNiKTtcbiAgfVxuXG4gIC8vIFJlbXVldmUgdW4gY2JcbiAgZnVuY3Rpb24gcmVsZWFzZSh1cmwsIGNiKSB7XG5cbiAgICB2YXIgaXRlbSA9IHF1ZXVlLmdldCh1cmwpO1xuICAgIGlmIChpdGVtKSB7XG4gICAgICB2YXIgaWR4ID0gaXRlbS4kY2JzLmluZGV4T2YoY2IpO1xuICAgICAgaWYgKGlkeCAhPSAtMSkgaXRlbS4kY2JzLnNwbGljZShpZHgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFzaWduYSBlbCBkaXJlY3RvcmlvIGRlc3Rpbm8gcGFyYSBsb3MgYXJjaGl2b3NcbiAgZnVuY3Rpb24gc2V0RGVzdChwRGVzdCkge1xuXG4gICAgZGVzdCA9IHBEZXN0O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBkb3dubG9hZDogZG93bmxvYWQsXG4gICAgcmVsZWFzZTogcmVsZWFzZSxcbiAgICBzZXREaXI6IHNldERlc3RcbiAgfTtcbn1cblxudmFyIF9uYW1lID0gZXhwb3J0cy5fbmFtZSA9ICdvZmZsaW5lQXNzZXRzJztcbmV4cG9ydHMuZGVmYXVsdCA9IGFuZ3VsYXIubW9kdWxlKF9uYW1lLCBbX29mZmxpbmVBc3NldHNGcy5fbmFtZSwgX3dvcmsuX25hbWVdKS5mYWN0b3J5KFtfbmFtZSwgJ1NlcnZpY2UnXS5qb2luKCcnKSwgb2ZmbGluZUFzc2V0c1NlcnZpY2UpO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3NlcnZpY2VzL29mZmxpbmVBc3NldHMuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiBvZmZsaW5lQXNzZXRzRnNTZXJ2aWNlKCRxLCAkbG9nKSB7ICduZ0luamVjdCc7XHJcbiAgXHJcbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgLy8gQXR0cmlidXRvcyBnbG9iYWxlc1xyXG4gIHZhciBhdHRycyA9IHtcclxuICAgIC8vIFRhbWHDsW8gZGVsIGJsb3F1ZSBkZSBtZW1vcmlhIHEgc2UgaXJhIHBpZGllbmRvIGNhZGEgdmV6IHF1ZSBzZSBzb2JyZSBwYXNlXHJcbiAgICAvLyBsYSBjdW90YSBkZSBhbG1hY2VuYW1pZW50b1xyXG4gICAgYmxvY2tTaXplOiAxNiAqIDEwMTQgKiAxMDI0LFxyXG5cclxuICAgIC8vIEVzcGFjaW8gZGUgbGEgY3VvdGEgZGUgYWxtYWNlbmFtaWVudG9cclxuICAgIGN1cnJlbnRRdW90YTogMCxcclxuXHJcbiAgICAvLyBFc3BhY2lvIHVzYWRvIGRlIGxhIGN1b3RhIGRlIGFsbWFjZW5hbWllbnRvXHJcbiAgICBjdXJyZW50VXNhZ2U6IDAsXHJcblxyXG4gICAgLy8gRXNwYWNpbyBkZSBsYSBjdW90YSBkZSBhbG1hY2VuYW1pZW50b1xyXG4gICAgZGVzdDogICcnLFxyXG5cclxuICB9O1xyXG5cclxuICAvLyBJbnN0YW5jaWEgZGVsIG1hbmVqYWRvciBkZWwgZmlsZSBzeXN0ZW1cclxuICB2YXIgZnMgPSBudWxsO1xyXG5cclxuICAvLyBEZWZhcnJlZGVzXHJcbiAgdmFyIGFwaUxvYWRlZERlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuICB2YXIgcXVvdGFJbmZvRGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG4gIHZhciByZWFkeURlZmVycmVkID0gJHEuYWxsKFtcclxuICAgIGFwaUxvYWRlZERlZmVycmVkLnByb21pc2UsXHJcbiAgICBxdW90YUluZm9EZWZlcnJlZC5wcm9taXNlXHJcbiAgXSk7XHJcbiAgXHJcbiAgLy8gQVBJIEhUTUw1IHBhcmEgbWFuZWpvIGRlIGFyY2hpdm9zXHJcbiAgdmFyIHJlcXVlc3RGaWxlU3lzdGVtID0gd2luZG93LnJlcXVlc3RGaWxlU3lzdGVtIHx8IHdpbmRvdy53ZWJraXRSZXF1ZXN0RmlsZVN5c3RlbTtcclxuICB2YXIgcFN0b3JhZ2UgPSBuYXZpZ2F0b3Iud2Via2l0UGVyc2lzdGVudFN0b3JhZ2UgfHwge1xyXG4gICAgcmVxdWVzdFF1b3RhOiBmdW5jdGlvbigpIHt9LFxyXG4gICAgcXVlcnlVc2FnZUFuZFF1b3RhOiBmdW5jdGlvbigpIHt9LFxyXG4gIH07XHJcblxyXG4gIC8vIExvYWQgYWN0aW9uIHdoZW4gbG9hZGVkIGZpbGVTeXN0ZW1cclxuICBpZiAodHlwZW9mIGNvcmRvdmEgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAkbG9nLmxvZygnY29yZG92YSBvbicpO1xyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZGV2aWNlcmVhZHknLCBmdW5jdGlvbigpIHtcclxuICAgICAgJGxvZy5sb2coJ2RldmlkZXJlYWR5Jyk7XHJcbiAgICAgIHJlcXVlc3RGaWxlU3lzdGVtKExvY2FsRmlsZVN5c3RlbS5QRVJTSVNURU5ULCAwLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAkbG9nLmxvZygncmVxdWVzdEZpbGVTeXN0ZW0nKTtcclxuXHJcbiAgICAgICAgYXR0cnMuZGVzdCA9IGNvcmRvdmEuZmlsZS5leHRlcm5hbERhdGFEaXJlY3RvcnkgfHwgY29yZG92YS5maWxlLmRhdGFEaXJlY3Rvcnk7XHJcblxyXG4gICAgICAgIGFwaUxvYWRlZERlZmVycmVkLnJlc29sdmUoKTtcclxuICAgICAgICBxdW90YUluZm9EZWZlcnJlZC5yZXNvbHZlKC0xLC0xKTtcclxuICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgIGFwaUxvYWRlZERlZmVycmVkLnJlamVjdChlcnIpO1xyXG4gICAgICAgIHF1b3RhSW5mb0RlZmVycmVkLnJlamVjdChlcnIpO1xyXG4gICAgICB9KTtcclxuICAgIH0sIGZhbHNlKTtcclxuXHJcbiAgfSBlbHNlIHtcclxuICAgIC8vICRsb2cubG9nKCdjb3Jkb3ZhIG9mZicpO1xyXG4gICAgcFN0b3JhZ2UucXVlcnlVc2FnZUFuZFF1b3RhKGZ1bmN0aW9uKHVzZWQsIGdyYW50ZWQpIHtcclxuICAgICAgJGxvZy5sb2coWydxdWVyeVVzYWdlQW5kUXVvdGE6JywgdXNlZCwgJywgJywgZ3JhbnRlZCwgJywgJywgZ3JhbnRlZC11c2VkLCAnLCAnLCBhdHRycy5ibG9ja1NpemVdLmpvaW4oJycpKTtcclxuICAgICAgYXR0cnMuY3VycmVudFF1b3RhID0gZ3JhbnRlZDtcclxuICAgICAgYXR0cnMuY3VycmVudFVzYWdlID0gdXNlZDtcclxuICAgICAgaWYgKChncmFudGVkLXVzZWQpPGF0dHJzLmJsb2NrU2l6ZS8yKSB7XHJcbiAgICAgICAgcmVxdWVzdFN0b3JhZ2VRdW90YSgpXHJcbiAgICAgICAgICAudGhlbihxdW90YUluZm9EZWZlcnJlZC5yZXNvbHZlLCBxdW90YUluZm9EZWZlcnJlZC5yZWplY3QpO1xyXG4gICAgICB9ZWxzZSB7XHJcbiAgICAgICAgcXVvdGFJbmZvRGVmZXJyZWQucmVzb2x2ZSh1c2VkLCBncmFudGVkKTtcclxuICAgICAgfVxyXG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICBxdW90YUluZm9EZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJlcXVlc3RGaWxlU3lzdGVtKHdpbmRvdy5QRVJTSVNURU5ULCAwLCBmdW5jdGlvbihwRnMpIHtcclxuICAgICAgLy8gJGxvZy5sb2coJ3JlcXVlc3RGaWxlU3lzdGVtJyk7XHJcbiAgICAgIGZzID0gcEZzO1xyXG4gICAgICBhcGlMb2FkZWREZWZlcnJlZC5yZXNvbHZlKCk7XHJcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgIGFwaUxvYWRlZERlZmVycmVkLnJlamVjdChlcnIpO1xyXG4gICAgfSk7XHJcblxyXG4gIH1cclxuXHJcbiAgcmVhZHlEZWZlcnJlZC50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgJGxvZy5sb2coJ3JlYWR5Jyk7XHJcbiAgfSkuY2F0Y2goJGxvZy5lcnJvcik7XHJcblxyXG4gIGZ1bmN0aW9uIHJlYWR5KGZuKSB7XHJcbiAgICBpZighZm4pIHJldHVybiByZWFkeURlZmVycmVkO1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuICAgICAgdmFyIGFyZ3MgPSBbXTtcclxuICAgICAgYW5ndWxhci5mb3JFYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24gKHZhbG9yKSB7XHJcbiAgICAgICAgYXJncy5wdXNoKHZhbG9yKTtcclxuICAgICAgfSk7XHJcbiAgICAgIGFyZ3MudW5zaGlmdChkZWZlcnJlZCk7XHJcbiAgICAgIHJlYWR5RGVmZXJyZWQudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZm4uYXBwbHkoZm4sIGFyZ3MpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbCB0byByZXNvbHZlIGxvY2FsIGZpbGUgc3lzdGVtXHJcbiAgICogLSBwYXRoZmlsZTogRmlsZSBVUkwgdG8gZ2V0XHJcbiAgICovXHJcbiAgdmFyIGdldEZpbGVFbnRyeSA9IHJlYWR5KGZ1bmN0aW9uKGRlZmVycmVkLCBwYXRoZmlsZSwgY3JlYXRlKSB7XHJcbiAgICAvLyAkbG9nLmxvZyhbJ2dldEZpbGVFbnRyeTonLCBwYXRoZmlsZV0uam9pbignJykpO1xyXG5cclxuICAgIC8vIElmIGNhbid0IGNoZWNrIGlmIGZpbGUgZXhpc3RzIHRoZW4gY2FsbCBzdWNjZXNzIGRpcmVjdGx5XHJcbiAgICBpZiAod2luZG93LnJlc29sdmVMb2NhbEZpbGVTeXN0ZW1VUkwpIHtcclxuICAgICAgd2luZG93LnJlc29sdmVMb2NhbEZpbGVTeXN0ZW1VUkwocGF0aGZpbGUsIGRlZmVycmVkLnJlc29sdmUsIGRlZmVycmVkLnJlamVjdCk7XHJcbiAgICB9IGVsc2UgaWYgKGZzKSB7XHJcbiAgICAgIGZzLnJvb3QuZ2V0RmlsZShwYXRoZmlsZSwge2NyZWF0ZTogISFjcmVhdGV9LCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoZSk7XHJcbiAgICAgIH0sIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGUpO1xyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRlZmVycmVkLnJlamVjdCh7XHJcbiAgICAgICAgY29kZTogMCxcclxuICAgICAgICBuYW1lOiAnTm90SW5zdGFuY2VUb0dldEZpbGVFbnRyeScsXHJcbiAgICAgICAgbWVzc2FnZTogJ05vIGhhbmRsZXIgaW5zdGFuY2UgdG8gZ2V0IGZpbGUgZW50cnkgaW5zdGFuY2UnXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IGluc3RhbmNlIGlmIEZpbGUoY29yZG92YSkgb2YgcGh5c3ljYWwgZmlsZVxyXG4gICAqIC0gcGF0aGZpbGU6IFVSTCB0byBkb3dubG9hZFxyXG4gICAqL1xyXG4gIHZhciBnZXRGaWxlID0gcmVhZHkoZnVuY3Rpb24oZGVmZXJyZWQsIHBhdGhmaWxlKSB7XHJcbiAgICAvLyAkbG9nLmxvZyhbJ2dldEZpbGU6JywgcGF0aGZpbGVdLmpvaW4oJycpKTtcclxuICAgIFxyXG4gICAgLy8gQ2hlY2sgaWYgZmlsZSBleGlzdC5cclxuICAgIGdldEZpbGVFbnRyeShwYXRoZmlsZSkudGhlbihmdW5jdGlvbiAoZmlsZUVudHJ5KSB7XHJcbiAgICAgIGZpbGVFbnRyeS5maWxlKGZ1bmN0aW9uKGZpbGUpIHtcclxuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHtcclxuICAgICAgICAgIGZpbGVFbnRyeTogZmlsZUVudHJ5LFxyXG4gICAgICAgICAgZmlsZTogZmlsZVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9LCBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XHJcbiAgICB9KTtcclxuXHJcbiAgfSk7XHJcblxyXG4gIC8vIEluZGljYXRlIGlmIGFueSBxdW90YSByZXF1ZXN0IHdhcyBiZSByZWplY3RlZFxyXG4gIHZhciBhbnlRdW90YVJlcXVlc3RSZWplY3QgPSBmYWxzZTtcclxuXHJcbiAgLyoqXHJcbiAgICogU29saWNpdGFyIGVzcGFjaW8gZGUgYWxtYWNlbmFtaWVudG9cclxuICAgKi9cclxuICBmdW5jdGlvbiByZXF1ZXN0U3RvcmFnZVF1b3RhIChyZXF1aXJlZEJ5dGVzKSB7XHJcblxyXG4gICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuICAgIHZhciBxdW90YVJlcXVlc3RSZWplY3RlZEVycm9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7IGNvZGU6IDAsIG5hbWU6ICdRdW90YVJlcXVlc3RSZWplY3RlZCcgfVxyXG4gICAgfTtcclxuXHJcbiAgICBpZihhbnlRdW90YVJlcXVlc3RSZWplY3QpIHtcclxuICAgICAgZGVmZXJyZWQucmVqZWN0KHF1b3RhUmVxdWVzdFJlamVjdGVkRXJyb3IoKSk7XHJcblxyXG4gICAgfWVsc2V7XHJcblxyXG4gICAgICBpZighcmVxdWlyZWRCeXRlcykge1xyXG4gICAgICAgIHJlcXVpcmVkQnl0ZXMgPSAwO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXF1aXJlZEJ5dGVzID0gYXR0cnMuY3VycmVudFF1b3RhICsgTWF0aC5tYXgocmVxdWlyZWRCeXRlcywgYXR0cnMuYmxvY2tTaXplKTtcclxuXHJcbiAgICAgIHBTdG9yYWdlLnJlcXVlc3RRdW90YShyZXF1aXJlZEJ5dGVzLFxyXG4gICAgICAgIGZ1bmN0aW9uKGJ5dGVzR3JhbnRlZCkge1xyXG4gICAgICAgICAgaWYoIWJ5dGVzR3JhbnRlZCkge1xyXG4gICAgICAgICAgICAvLyBsb2coWydyZXF1ZXN0UXVvdGFSZWplY3QnXSk7XHJcbiAgICAgICAgICAgIGFueVF1b3RhUmVxdWVzdFJlamVjdCA9IHRydWU7XHJcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChxdW90YVJlcXVlc3RSZWplY3RlZEVycm9yKCkpO1xyXG4gICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICRsb2cubG9nKFsncmVxdWVzdFF1b3RhR3JhbnRlZCcsIGJ5dGVzR3JhbnRlZF0pO1xyXG4gICAgICAgICAgICBhdHRycy5jdXJyZW50UXVvdGEgPSBieXRlc0dyYW50ZWQ7XHJcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoYnl0ZXNHcmFudGVkKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFNvbGljaXRhIG1hcyBieXRlcyBzaSBlcyBuZWNlc2FyaW9cclxuICAgKi9cclxuICBmdW5jdGlvbiByZXF1ZXN0U3RvcmFnZVF1b3RhSWZSZXF1aXJlZCAobmVlZGVkQnl0ZXMpIHtcclxuXHJcbiAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG5cclxuICAgIHZhciBtaXNzaW5nQnl0ZXMgPSBhdHRycy5jdXJyZW50VXNhZ2UgKyBuZWVkZWRCeXRlcyAtIGF0dHJzLmN1cnJlbnRRdW90YTtcclxuXHJcbiAgICBpZihtaXNzaW5nQnl0ZXMgPiAwKSB7XHJcbiAgICAgIHJlcXVlc3RTdG9yYWdlUXVvdGEobWlzc2luZ0J5dGVzICsgMTAgKiAxMDI0KVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGJ5dGVzR3JhbnRlZCkge1xyXG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlKTtcclxuICAgICAgICB9KTtcclxuICAgIH1lbHNle1xyXG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhciB1biBkaXJlY3RvcmlvXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gbWtkaXIgKGRpcikge1xyXG4gICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcbiAgICB2YXIgZGlycyA9IGRpci5zcGxpdCgnLycpO1xyXG5cclxuICAgIHZhciBfbWtkaXIgPSBmdW5jdGlvbihmb2xkZXJzLCByb290RGlyRW50cnkpIHtcclxuICAgICAgaWYgKGZvbGRlcnNbMF0gPT0gJy4nIHx8IGZvbGRlcnNbMF0gPT0gJycpIHtcclxuICAgICAgICBmb2xkZXJzID0gZm9sZGVycy5zbGljZSgxKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFmb2xkZXJzLmxlbmd0aCkge1xyXG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoZGlyKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJvb3REaXJFbnRyeS5nZXREaXJlY3RvcnkoZm9sZGVyc1swXSwge2NyZWF0ZTogdHJ1ZX0sIGZ1bmN0aW9uKGRpckVudHJ5KSB7XHJcbiAgICAgICAgX21rZGlyKGZvbGRlcnMuc2xpY2UoMSksIGRpckVudHJ5KTtcclxuICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIF9ta2RpcihkaXJzLCBmcy5yb290KTtcclxuXHJcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmUgcGh5c2ljYWwgZmlsZS5cclxuICAgKiAtIHBhcmFtcy5maWxlRW50cnk6IEZpbGVFbnRyeShjb3Jkb3ZhKSBpbnN0YW5jZVxyXG4gICAqIC0gcGFyYW1zLnN1Y2Nlc3M6IGNhbGxiYWNrIHdoZW4gaXMgc3VjY2Vzc1xyXG4gICAqIC0gcGFyYW1zLmZhaWw6IGNhbGxiYWNrIHdoZW4gaXMgZmFpbFxyXG4gICAqL1xyXG4gIHZhciByZW1vdmVGaWxlID0gZnVuY3Rpb24oZmlsZUVudHJ5KSB7XHJcbiAgICAvLyAkbG9nLmxvZyhbJ3JlbW92ZUZpbGUnXSk7XHJcbiAgICBpZighZmlsZUVudHJ5KSByZXR1cm47XHJcblxyXG4gICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcbiAgICBmaWxlRW50cnkucmVtb3ZlKGZ1bmN0aW9uKGZpbGUpe1xyXG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKGZpbGVFbnRyeSk7XHJcbiAgICB9LCBmdW5jdGlvbihlcnIpe1xyXG4gICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDYWxsIEFQSSB0byBkb3dubG9hZCBmaWxlXHJcbiAgICogLSBmcm9tVXJsOiBFeHRlcm5hbCBVUkwgb2YgZmlsYVxyXG4gICAqIC0gbG9jYWxVcmw6IEZpbGUgVVJMIHRvIGdldFxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGRvd25sb2FkKGZyb21VcmwsIGxvY2FsVXJsKSB7XHJcbiAgICAvLyAkbG9nLmxvZyhbJ2NhbGxEb3dubG9hZEZpbGU6JywgZnJvbVVybCwgbG9jYWxVcmxdLmpvaW4oJyAnKSk7XHJcblxyXG4gICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcbiAgICBmdW5jdGlvbiBjdXN0b21FcnJvckhhbmRsZXIgKG1zZykge1xyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgIGlmKGVyci5uYW1lID09PSAnUXVvdGFFeGNlZWRlZEVycm9yJykge1xyXG4gICAgICAgICAgcmVxdWVzdFN0b3JhZ2VRdW90YSgpXHJcbiAgICAgICAgICAgIC50aGVuKGN1c3RvbURvd25sb2FkRmlsZSwgZGVmZXJyZWQucmVqZWN0KTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKG1zZyk7XHJcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY3VzdG9tRG93bmxvYWRGaWxlICgpIHtcclxuXHJcbiAgICAgIHZhciBkaXJzID0gbG9jYWxVcmwuc3BsaXQoJy8nKTtcclxuICAgICAgdmFyIGZpbGVuYW1lID0gZGlycy5wb3AoKTtcclxuXHJcbiAgICAgIC8vIENyZWFyIERpcmVjdG9yaW9cclxuICAgICAgJHEud2hlbigpLnRoZW4oZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBta2RpcihkaXJzLmpvaW4oJy8nKSk7XHJcblxyXG4gICAgICB9LCBjdXN0b21FcnJvckhhbmRsZXIoJ21rZGlyJykpXHJcblxyXG4gICAgICAvLyBPYnRlbmVyIGVsIGZpbGVFbnRyeSBwYXJhIGJvcnJhcmxvXHJcbiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gZ2V0RmlsZUVudHJ5KGxvY2FsVXJsKTtcclxuXHJcbiAgICAgIH0sIGZ1bmN0aW9uICgpIHt9KVxyXG5cclxuICAgICAgLy8gT2J0ZW5lciBlbCBmaWxlRW50cnlcclxuICAgICAgLnRoZW4oZnVuY3Rpb24gKGZpbGVFbnRyeSkge1xyXG4gICAgICAgIHJldHVybiByZW1vdmVGaWxlKGZpbGVFbnRyeSk7XHJcblxyXG4gICAgICB9LCBmdW5jdGlvbiAoKSB7fSlcclxuXHJcbiAgICAgIC8vIE9idGVuZXIgZWwgZmlsZUVudHJ5XHJcbiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gZ2V0RmlsZUVudHJ5KGxvY2FsVXJsLCB0cnVlKTtcclxuXHJcbiAgICAgIH0sIGN1c3RvbUVycm9ySGFuZGxlcignZ2V0RmlsZUVudHJ5JykpXHJcblxyXG4gICAgICAvLyBPYnRlbmVyIGxhIGluc3RhbmNpYSBkZWwgd3JpdGVyIHBhcmEgZWwgYXJjaGl2b1xyXG4gICAgICAudGhlbihmdW5jdGlvbiAoZmlsZUVudHJ5KSB7XHJcbiAgICAgICAgaWYgKCFmaWxlRW50cnkpIHJldHVybjtcclxuICAgICAgICB2YXIgbG9jYWxEZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcbiAgICAgICAgZmlsZUVudHJ5LmNyZWF0ZVdyaXRlcihmdW5jdGlvbiAod3JpdGVyKSB7XHJcblxyXG4gICAgICAgICAgd3JpdGVyLm9ud3JpdGVlbmQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShmaWxlRW50cnkpO1xyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICB3cml0ZXIub25lcnJvciA9IGN1c3RvbUVycm9ySGFuZGxlcignd3JpdGVyJyk7XHJcblxyXG4gICAgICAgICAgbG9jYWxEZWZlcnJlZC5yZXNvbHZlKHdyaXRlcik7XHJcblxyXG4gICAgICAgIH0sIGxvY2FsRGVmZXJyZWQucmVqZWN0KTtcclxuICAgICAgICByZXR1cm4gbG9jYWxEZWZlcnJlZC5wcm9taXNlO1xyXG5cclxuICAgICAgfSwgY3VzdG9tRXJyb3JIYW5kbGVyKCdjcmVhdGVXcml0ZXInKSlcclxuXHJcbiAgICAgIC8vIE9idGVuZXIgZWwgYXJjaGl2byBwb3IgQUpBWCB5IGVzY3JpYmlyIGVuIGVsIGFyY2hpdm9cclxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHdyaXRlcikge1xyXG4gICAgICAgIGlmICghd3JpdGVyKSByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTsgXHJcbiAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIGZyb21VcmwsIHRydWUpOyBcclxuICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2Jsb2InO1xyXG4gICAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmKHhoci5zdGF0dXMgPT0gMjAwKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5ibG9iID0geGhyLnJlc3BvbnNlO1xyXG4gICAgICAgICAgICByZXF1ZXN0U3RvcmFnZVF1b3RhSWZSZXF1aXJlZCh4aHIucmVzcG9uc2Uuc2l6ZSkudGhlbihmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICB3cml0ZXIud3JpdGUoeGhyLnJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICBhdHRycy5jdXJyZW50VXNhZ2UgKz0geGhyLnJlc3BvbnNlLnNpemU7XHJcbiAgICAgICAgICAgIH0sIGN1c3RvbUVycm9ySGFuZGxlcigncmVxdWVzdFN0b3JhZ2VRdW90YUlmUmVxdWlyZWQnKSk7XHJcblxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHhoci5zZW5kKG51bGwpO1xyXG5cclxuICAgICAgfSwgY3VzdG9tRXJyb3JIYW5kbGVyKCdmaW5pc2gnKSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGN1c3RvbURvd25sb2FkRmlsZSgpO1xyXG5cclxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdldERlc3QgKCkge1xyXG4gICAgcmV0dXJuIGF0dHJzLmRlc3Q7XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgcmVhZHk6IHJlYWR5LFxyXG4gICAgZ2V0RmlsZUVudHJ5IDogZ2V0RmlsZUVudHJ5LFxyXG4gICAgZ2V0RmlsZSA6IGdldEZpbGUsXHJcbiAgICByZXF1ZXN0U3RvcmFnZVF1b3RhOiByZXF1ZXN0U3RvcmFnZVF1b3RhLFxyXG4gICAgcmVxdWVzdFN0b3JhZ2VRdW90YUlmUmVxdWlyZWQ6IHJlcXVlc3RTdG9yYWdlUXVvdGFJZlJlcXVpcmVkLFxyXG4gICAgbWtkaXI6IG1rZGlyLFxyXG4gICAgZG93bmxvYWQ6IGRvd25sb2FkLFxyXG4gICAgZ2V0RGVzdDogZ2V0RGVzdCxcclxuICB9O1xyXG5cclxufVxyXG5cclxuZXhwb3J0IHZhciBfbmFtZSA9ICdvZmZsaW5lQXNzZXRzRnMnO1xyXG5leHBvcnQgZGVmYXVsdCBhbmd1bGFyLm1vZHVsZShfbmFtZSwgW10pXHJcbiAgLmZhY3RvcnkoW19uYW1lLCAnU2VydmljZSddLmpvaW4oJycpLCBvZmZsaW5lQXNzZXRzRnNTZXJ2aWNlKTtcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9zZXJ2aWNlcy9vZmZsaW5lQXNzZXRzRnMuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5mdW5jdGlvbiBvZmZsaW5lQXNzZXRzRnNTZXJ2aWNlKCRxLCAkbG9nKSB7XG4gICduZ0luamVjdCc7XG5cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gIC8vIEF0dHJpYnV0b3MgZ2xvYmFsZXNcblxuICB2YXIgYXR0cnMgPSB7XG4gICAgLy8gVGFtYcOxbyBkZWwgYmxvcXVlIGRlIG1lbW9yaWEgcSBzZSBpcmEgcGlkaWVuZG8gY2FkYSB2ZXogcXVlIHNlIHNvYnJlIHBhc2VcbiAgICAvLyBsYSBjdW90YSBkZSBhbG1hY2VuYW1pZW50b1xuICAgIGJsb2NrU2l6ZTogMTYgKiAxMDE0ICogMTAyNCxcblxuICAgIC8vIEVzcGFjaW8gZGUgbGEgY3VvdGEgZGUgYWxtYWNlbmFtaWVudG9cbiAgICBjdXJyZW50UXVvdGE6IDAsXG5cbiAgICAvLyBFc3BhY2lvIHVzYWRvIGRlIGxhIGN1b3RhIGRlIGFsbWFjZW5hbWllbnRvXG4gICAgY3VycmVudFVzYWdlOiAwLFxuXG4gICAgLy8gRXNwYWNpbyBkZSBsYSBjdW90YSBkZSBhbG1hY2VuYW1pZW50b1xuICAgIGRlc3Q6ICcnXG5cbiAgfTtcblxuICAvLyBJbnN0YW5jaWEgZGVsIG1hbmVqYWRvciBkZWwgZmlsZSBzeXN0ZW1cbiAgdmFyIGZzID0gbnVsbDtcblxuICAvLyBEZWZhcnJlZGVzXG4gIHZhciBhcGlMb2FkZWREZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gIHZhciBxdW90YUluZm9EZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gIHZhciByZWFkeURlZmVycmVkID0gJHEuYWxsKFthcGlMb2FkZWREZWZlcnJlZC5wcm9taXNlLCBxdW90YUluZm9EZWZlcnJlZC5wcm9taXNlXSk7XG5cbiAgLy8gQVBJIEhUTUw1IHBhcmEgbWFuZWpvIGRlIGFyY2hpdm9zXG4gIHZhciByZXF1ZXN0RmlsZVN5c3RlbSA9IHdpbmRvdy5yZXF1ZXN0RmlsZVN5c3RlbSB8fCB3aW5kb3cud2Via2l0UmVxdWVzdEZpbGVTeXN0ZW07XG4gIHZhciBwU3RvcmFnZSA9IG5hdmlnYXRvci53ZWJraXRQZXJzaXN0ZW50U3RvcmFnZSB8fCB7XG4gICAgcmVxdWVzdFF1b3RhOiBmdW5jdGlvbiByZXF1ZXN0UXVvdGEoKSB7fSxcbiAgICBxdWVyeVVzYWdlQW5kUXVvdGE6IGZ1bmN0aW9uIHF1ZXJ5VXNhZ2VBbmRRdW90YSgpIHt9XG4gIH07XG5cbiAgLy8gTG9hZCBhY3Rpb24gd2hlbiBsb2FkZWQgZmlsZVN5c3RlbVxuICBpZiAodHlwZW9mIGNvcmRvdmEgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgJGxvZy5sb2coJ2NvcmRvdmEgb24nKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdkZXZpY2VyZWFkeScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICRsb2cubG9nKCdkZXZpZGVyZWFkeScpO1xuICAgICAgcmVxdWVzdEZpbGVTeXN0ZW0oTG9jYWxGaWxlU3lzdGVtLlBFUlNJU1RFTlQsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJGxvZy5sb2coJ3JlcXVlc3RGaWxlU3lzdGVtJyk7XG5cbiAgICAgICAgYXR0cnMuZGVzdCA9IGNvcmRvdmEuZmlsZS5leHRlcm5hbERhdGFEaXJlY3RvcnkgfHwgY29yZG92YS5maWxlLmRhdGFEaXJlY3Rvcnk7XG5cbiAgICAgICAgYXBpTG9hZGVkRGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICBxdW90YUluZm9EZWZlcnJlZC5yZXNvbHZlKC0xLCAtMSk7XG4gICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGFwaUxvYWRlZERlZmVycmVkLnJlamVjdChlcnIpO1xuICAgICAgICBxdW90YUluZm9EZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICAgIH0pO1xuICAgIH0sIGZhbHNlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyAkbG9nLmxvZygnY29yZG92YSBvZmYnKTtcbiAgICBwU3RvcmFnZS5xdWVyeVVzYWdlQW5kUXVvdGEoZnVuY3Rpb24gKHVzZWQsIGdyYW50ZWQpIHtcbiAgICAgICRsb2cubG9nKFsncXVlcnlVc2FnZUFuZFF1b3RhOicsIHVzZWQsICcsICcsIGdyYW50ZWQsICcsICcsIGdyYW50ZWQgLSB1c2VkLCAnLCAnLCBhdHRycy5ibG9ja1NpemVdLmpvaW4oJycpKTtcbiAgICAgIGF0dHJzLmN1cnJlbnRRdW90YSA9IGdyYW50ZWQ7XG4gICAgICBhdHRycy5jdXJyZW50VXNhZ2UgPSB1c2VkO1xuICAgICAgaWYgKGdyYW50ZWQgLSB1c2VkIDwgYXR0cnMuYmxvY2tTaXplIC8gMikge1xuICAgICAgICByZXF1ZXN0U3RvcmFnZVF1b3RhKCkudGhlbihxdW90YUluZm9EZWZlcnJlZC5yZXNvbHZlLCBxdW90YUluZm9EZWZlcnJlZC5yZWplY3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcXVvdGFJbmZvRGVmZXJyZWQucmVzb2x2ZSh1c2VkLCBncmFudGVkKTtcbiAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBxdW90YUluZm9EZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICB9KTtcblxuICAgIHJlcXVlc3RGaWxlU3lzdGVtKHdpbmRvdy5QRVJTSVNURU5ULCAwLCBmdW5jdGlvbiAocEZzKSB7XG4gICAgICAvLyAkbG9nLmxvZygncmVxdWVzdEZpbGVTeXN0ZW0nKTtcbiAgICAgIGZzID0gcEZzO1xuICAgICAgYXBpTG9hZGVkRGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGFwaUxvYWRlZERlZmVycmVkLnJlamVjdChlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVhZHlEZWZlcnJlZC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAkbG9nLmxvZygncmVhZHknKTtcbiAgfSkuY2F0Y2goJGxvZy5lcnJvcik7XG5cbiAgZnVuY3Rpb24gcmVhZHkoZm4pIHtcbiAgICBpZiAoIWZuKSByZXR1cm4gcmVhZHlEZWZlcnJlZDtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgIHZhciBhcmdzID0gW107XG4gICAgICBhbmd1bGFyLmZvckVhY2goYXJndW1lbnRzLCBmdW5jdGlvbiAodmFsb3IpIHtcbiAgICAgICAgYXJncy5wdXNoKHZhbG9yKTtcbiAgICAgIH0pO1xuICAgICAgYXJncy51bnNoaWZ0KGRlZmVycmVkKTtcbiAgICAgIHJlYWR5RGVmZXJyZWQudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZuLmFwcGx5KGZuLCBhcmdzKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXHJcbiAgICogQ2FsbCB0byByZXNvbHZlIGxvY2FsIGZpbGUgc3lzdGVtXHJcbiAgICogLSBwYXRoZmlsZTogRmlsZSBVUkwgdG8gZ2V0XHJcbiAgICovXG4gIHZhciBnZXRGaWxlRW50cnkgPSByZWFkeShmdW5jdGlvbiAoZGVmZXJyZWQsIHBhdGhmaWxlLCBjcmVhdGUpIHtcbiAgICAvLyAkbG9nLmxvZyhbJ2dldEZpbGVFbnRyeTonLCBwYXRoZmlsZV0uam9pbignJykpO1xuXG4gICAgLy8gSWYgY2FuJ3QgY2hlY2sgaWYgZmlsZSBleGlzdHMgdGhlbiBjYWxsIHN1Y2Nlc3MgZGlyZWN0bHlcbiAgICBpZiAod2luZG93LnJlc29sdmVMb2NhbEZpbGVTeXN0ZW1VUkwpIHtcbiAgICAgIHdpbmRvdy5yZXNvbHZlTG9jYWxGaWxlU3lzdGVtVVJMKHBhdGhmaWxlLCBkZWZlcnJlZC5yZXNvbHZlLCBkZWZlcnJlZC5yZWplY3QpO1xuICAgIH0gZWxzZSBpZiAoZnMpIHtcbiAgICAgIGZzLnJvb3QuZ2V0RmlsZShwYXRoZmlsZSwgeyBjcmVhdGU6ICEhY3JlYXRlIH0sIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoZSk7XG4gICAgICB9LCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVmZXJyZWQucmVqZWN0KHtcbiAgICAgICAgY29kZTogMCxcbiAgICAgICAgbmFtZTogJ05vdEluc3RhbmNlVG9HZXRGaWxlRW50cnknLFxuICAgICAgICBtZXNzYWdlOiAnTm8gaGFuZGxlciBpbnN0YW5jZSB0byBnZXQgZmlsZSBlbnRyeSBpbnN0YW5jZSdcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgLyoqXHJcbiAgICogR2V0IGluc3RhbmNlIGlmIEZpbGUoY29yZG92YSkgb2YgcGh5c3ljYWwgZmlsZVxyXG4gICAqIC0gcGF0aGZpbGU6IFVSTCB0byBkb3dubG9hZFxyXG4gICAqL1xuICB2YXIgZ2V0RmlsZSA9IHJlYWR5KGZ1bmN0aW9uIChkZWZlcnJlZCwgcGF0aGZpbGUpIHtcbiAgICAvLyAkbG9nLmxvZyhbJ2dldEZpbGU6JywgcGF0aGZpbGVdLmpvaW4oJycpKTtcblxuICAgIC8vIENoZWNrIGlmIGZpbGUgZXhpc3QuXG4gICAgZ2V0RmlsZUVudHJ5KHBhdGhmaWxlKS50aGVuKGZ1bmN0aW9uIChmaWxlRW50cnkpIHtcbiAgICAgIGZpbGVFbnRyeS5maWxlKGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoe1xuICAgICAgICAgIGZpbGVFbnRyeTogZmlsZUVudHJ5LFxuICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICAgICAgfSk7XG4gICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgICAgfSk7XG4gICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8vIEluZGljYXRlIGlmIGFueSBxdW90YSByZXF1ZXN0IHdhcyBiZSByZWplY3RlZFxuICB2YXIgYW55UXVvdGFSZXF1ZXN0UmVqZWN0ID0gZmFsc2U7XG5cbiAgLyoqXHJcbiAgICogU29saWNpdGFyIGVzcGFjaW8gZGUgYWxtYWNlbmFtaWVudG9cclxuICAgKi9cbiAgZnVuY3Rpb24gcmVxdWVzdFN0b3JhZ2VRdW90YShyZXF1aXJlZEJ5dGVzKSB7XG5cbiAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgIHZhciBxdW90YVJlcXVlc3RSZWplY3RlZEVycm9yID0gZnVuY3Rpb24gcXVvdGFSZXF1ZXN0UmVqZWN0ZWRFcnJvcigpIHtcbiAgICAgIHJldHVybiB7IGNvZGU6IDAsIG5hbWU6ICdRdW90YVJlcXVlc3RSZWplY3RlZCcgfTtcbiAgICB9O1xuXG4gICAgaWYgKGFueVF1b3RhUmVxdWVzdFJlamVjdCkge1xuICAgICAgZGVmZXJyZWQucmVqZWN0KHF1b3RhUmVxdWVzdFJlamVjdGVkRXJyb3IoKSk7XG4gICAgfSBlbHNlIHtcblxuICAgICAgaWYgKCFyZXF1aXJlZEJ5dGVzKSB7XG4gICAgICAgIHJlcXVpcmVkQnl0ZXMgPSAwO1xuICAgICAgfVxuXG4gICAgICByZXF1aXJlZEJ5dGVzID0gYXR0cnMuY3VycmVudFF1b3RhICsgTWF0aC5tYXgocmVxdWlyZWRCeXRlcywgYXR0cnMuYmxvY2tTaXplKTtcblxuICAgICAgcFN0b3JhZ2UucmVxdWVzdFF1b3RhKHJlcXVpcmVkQnl0ZXMsIGZ1bmN0aW9uIChieXRlc0dyYW50ZWQpIHtcbiAgICAgICAgaWYgKCFieXRlc0dyYW50ZWQpIHtcbiAgICAgICAgICAvLyBsb2coWydyZXF1ZXN0UXVvdGFSZWplY3QnXSk7XG4gICAgICAgICAgYW55UXVvdGFSZXF1ZXN0UmVqZWN0ID0gdHJ1ZTtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3QocXVvdGFSZXF1ZXN0UmVqZWN0ZWRFcnJvcigpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkbG9nLmxvZyhbJ3JlcXVlc3RRdW90YUdyYW50ZWQnLCBieXRlc0dyYW50ZWRdKTtcbiAgICAgICAgICBhdHRycy5jdXJyZW50UXVvdGEgPSBieXRlc0dyYW50ZWQ7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShieXRlc0dyYW50ZWQpO1xuICAgICAgICB9XG4gICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnIpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gIH07XG5cbiAgLyoqXHJcbiAgICogU29saWNpdGEgbWFzIGJ5dGVzIHNpIGVzIG5lY2VzYXJpb1xyXG4gICAqL1xuICBmdW5jdGlvbiByZXF1ZXN0U3RvcmFnZVF1b3RhSWZSZXF1aXJlZChuZWVkZWRCeXRlcykge1xuXG4gICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgIHZhciBtaXNzaW5nQnl0ZXMgPSBhdHRycy5jdXJyZW50VXNhZ2UgKyBuZWVkZWRCeXRlcyAtIGF0dHJzLmN1cnJlbnRRdW90YTtcblxuICAgIGlmIChtaXNzaW5nQnl0ZXMgPiAwKSB7XG4gICAgICByZXF1ZXN0U3RvcmFnZVF1b3RhKG1pc3NpbmdCeXRlcyArIDEwICogMTAyNCkudGhlbihmdW5jdGlvbiAoYnl0ZXNHcmFudGVkKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgIH0sIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gIH1cblxuICAvKipcclxuICAgKiBDcmVhciB1biBkaXJlY3RvcmlvXHJcbiAgICovXG4gIGZ1bmN0aW9uIG1rZGlyKGRpcikge1xuICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICB2YXIgZGlycyA9IGRpci5zcGxpdCgnLycpO1xuXG4gICAgdmFyIF9ta2RpciA9IGZ1bmN0aW9uIF9ta2Rpcihmb2xkZXJzLCByb290RGlyRW50cnkpIHtcbiAgICAgIGlmIChmb2xkZXJzWzBdID09ICcuJyB8fCBmb2xkZXJzWzBdID09ICcnKSB7XG4gICAgICAgIGZvbGRlcnMgPSBmb2xkZXJzLnNsaWNlKDEpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWZvbGRlcnMubGVuZ3RoKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoZGlyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByb290RGlyRW50cnkuZ2V0RGlyZWN0b3J5KGZvbGRlcnNbMF0sIHsgY3JlYXRlOiB0cnVlIH0sIGZ1bmN0aW9uIChkaXJFbnRyeSkge1xuICAgICAgICBfbWtkaXIoZm9sZGVycy5zbGljZSgxKSwgZGlyRW50cnkpO1xuICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBfbWtkaXIoZGlycywgZnMucm9vdCk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgfVxuXG4gIC8qKlxyXG4gICAqIFJlbW92ZSBwaHlzaWNhbCBmaWxlLlxyXG4gICAqIC0gcGFyYW1zLmZpbGVFbnRyeTogRmlsZUVudHJ5KGNvcmRvdmEpIGluc3RhbmNlXHJcbiAgICogLSBwYXJhbXMuc3VjY2VzczogY2FsbGJhY2sgd2hlbiBpcyBzdWNjZXNzXHJcbiAgICogLSBwYXJhbXMuZmFpbDogY2FsbGJhY2sgd2hlbiBpcyBmYWlsXHJcbiAgICovXG4gIHZhciByZW1vdmVGaWxlID0gZnVuY3Rpb24gcmVtb3ZlRmlsZShmaWxlRW50cnkpIHtcbiAgICAvLyAkbG9nLmxvZyhbJ3JlbW92ZUZpbGUnXSk7XG4gICAgaWYgKCFmaWxlRW50cnkpIHJldHVybjtcblxuICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICBmaWxlRW50cnkucmVtb3ZlKGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKGZpbGVFbnRyeSk7XG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgfTtcblxuICAvKipcclxuICAgKiBDYWxsIEFQSSB0byBkb3dubG9hZCBmaWxlXHJcbiAgICogLSBmcm9tVXJsOiBFeHRlcm5hbCBVUkwgb2YgZmlsYVxyXG4gICAqIC0gbG9jYWxVcmw6IEZpbGUgVVJMIHRvIGdldFxyXG4gICAqL1xuICBmdW5jdGlvbiBkb3dubG9hZChmcm9tVXJsLCBsb2NhbFVybCkge1xuICAgIC8vICRsb2cubG9nKFsnY2FsbERvd25sb2FkRmlsZTonLCBmcm9tVXJsLCBsb2NhbFVybF0uam9pbignICcpKTtcblxuICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICBmdW5jdGlvbiBjdXN0b21FcnJvckhhbmRsZXIobXNnKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKGVycikge1xuICAgICAgICBpZiAoZXJyLm5hbWUgPT09ICdRdW90YUV4Y2VlZGVkRXJyb3InKSB7XG4gICAgICAgICAgcmVxdWVzdFN0b3JhZ2VRdW90YSgpLnRoZW4oY3VzdG9tRG93bmxvYWRGaWxlLCBkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUubG9nKG1zZyk7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycik7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3VzdG9tRG93bmxvYWRGaWxlKCkge1xuXG4gICAgICB2YXIgZGlycyA9IGxvY2FsVXJsLnNwbGl0KCcvJyk7XG4gICAgICB2YXIgZmlsZW5hbWUgPSBkaXJzLnBvcCgpO1xuXG4gICAgICAvLyBDcmVhciBEaXJlY3RvcmlvXG4gICAgICAkcS53aGVuKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBta2RpcihkaXJzLmpvaW4oJy8nKSk7XG4gICAgICB9LCBjdXN0b21FcnJvckhhbmRsZXIoJ21rZGlyJykpXG5cbiAgICAgIC8vIE9idGVuZXIgZWwgZmlsZUVudHJ5IHBhcmEgYm9ycmFybG9cbiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGdldEZpbGVFbnRyeShsb2NhbFVybCk7XG4gICAgICB9LCBmdW5jdGlvbiAoKSB7fSlcblxuICAgICAgLy8gT2J0ZW5lciBlbCBmaWxlRW50cnlcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChmaWxlRW50cnkpIHtcbiAgICAgICAgcmV0dXJuIHJlbW92ZUZpbGUoZmlsZUVudHJ5KTtcbiAgICAgIH0sIGZ1bmN0aW9uICgpIHt9KVxuXG4gICAgICAvLyBPYnRlbmVyIGVsIGZpbGVFbnRyeVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZ2V0RmlsZUVudHJ5KGxvY2FsVXJsLCB0cnVlKTtcbiAgICAgIH0sIGN1c3RvbUVycm9ySGFuZGxlcignZ2V0RmlsZUVudHJ5JykpXG5cbiAgICAgIC8vIE9idGVuZXIgbGEgaW5zdGFuY2lhIGRlbCB3cml0ZXIgcGFyYSBlbCBhcmNoaXZvXG4gICAgICAudGhlbihmdW5jdGlvbiAoZmlsZUVudHJ5KSB7XG4gICAgICAgIGlmICghZmlsZUVudHJ5KSByZXR1cm47XG4gICAgICAgIHZhciBsb2NhbERlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgZmlsZUVudHJ5LmNyZWF0ZVdyaXRlcihmdW5jdGlvbiAod3JpdGVyKSB7XG5cbiAgICAgICAgICB3cml0ZXIub253cml0ZWVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoZmlsZUVudHJ5KTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgd3JpdGVyLm9uZXJyb3IgPSBjdXN0b21FcnJvckhhbmRsZXIoJ3dyaXRlcicpO1xuXG4gICAgICAgICAgbG9jYWxEZWZlcnJlZC5yZXNvbHZlKHdyaXRlcik7XG4gICAgICAgIH0sIGxvY2FsRGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuIGxvY2FsRGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sIGN1c3RvbUVycm9ySGFuZGxlcignY3JlYXRlV3JpdGVyJykpXG5cbiAgICAgIC8vIE9idGVuZXIgZWwgYXJjaGl2byBwb3IgQUpBWCB5IGVzY3JpYmlyIGVuIGVsIGFyY2hpdm9cbiAgICAgIC50aGVuKGZ1bmN0aW9uICh3cml0ZXIpIHtcbiAgICAgICAgaWYgKCF3cml0ZXIpIHJldHVybjtcblxuICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHhoci5vcGVuKCdHRVQnLCBmcm9tVXJsLCB0cnVlKTtcbiAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdibG9iJztcbiAgICAgICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PSAyMDApIHtcbiAgICAgICAgICAgIHdpbmRvdy5ibG9iID0geGhyLnJlc3BvbnNlO1xuICAgICAgICAgICAgcmVxdWVzdFN0b3JhZ2VRdW90YUlmUmVxdWlyZWQoeGhyLnJlc3BvbnNlLnNpemUpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICB3cml0ZXIud3JpdGUoeGhyLnJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgYXR0cnMuY3VycmVudFVzYWdlICs9IHhoci5yZXNwb25zZS5zaXplO1xuICAgICAgICAgICAgfSwgY3VzdG9tRXJyb3JIYW5kbGVyKCdyZXF1ZXN0U3RvcmFnZVF1b3RhSWZSZXF1aXJlZCcpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgeGhyLnNlbmQobnVsbCk7XG4gICAgICB9LCBjdXN0b21FcnJvckhhbmRsZXIoJ2ZpbmlzaCcpKTtcbiAgICB9XG5cbiAgICBjdXN0b21Eb3dubG9hZEZpbGUoKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0RGVzdCgpIHtcbiAgICByZXR1cm4gYXR0cnMuZGVzdDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcmVhZHk6IHJlYWR5LFxuICAgIGdldEZpbGVFbnRyeTogZ2V0RmlsZUVudHJ5LFxuICAgIGdldEZpbGU6IGdldEZpbGUsXG4gICAgcmVxdWVzdFN0b3JhZ2VRdW90YTogcmVxdWVzdFN0b3JhZ2VRdW90YSxcbiAgICByZXF1ZXN0U3RvcmFnZVF1b3RhSWZSZXF1aXJlZDogcmVxdWVzdFN0b3JhZ2VRdW90YUlmUmVxdWlyZWQsXG4gICAgbWtkaXI6IG1rZGlyLFxuICAgIGRvd25sb2FkOiBkb3dubG9hZCxcbiAgICBnZXREZXN0OiBnZXREZXN0XG4gIH07XG59XG5cbnZhciBfbmFtZSA9IGV4cG9ydHMuX25hbWUgPSAnb2ZmbGluZUFzc2V0c0ZzJztcbmV4cG9ydHMuZGVmYXVsdCA9IGFuZ3VsYXIubW9kdWxlKF9uYW1lLCBbXSkuZmFjdG9yeShbX25hbWUsICdTZXJ2aWNlJ10uam9pbignJyksIG9mZmxpbmVBc3NldHNGc1NlcnZpY2UpO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3NlcnZpY2VzL29mZmxpbmVBc3NldHNGcy5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIHdvcmsoJHEsICRsb2cpIHsgJ25nSW5qZWN0JztcclxuXHJcbiAgcmV0dXJuIGZ1bmN0aW9uIChjYikgeyB2YXIgIHNlbGYgPSB0aGlzO1xyXG4gICAgXHJcbiAgICB2YXIgaXRlbXMgPSB7fTsgLy8gRWxlbWVudG8gZGUgbGEgY29sYVxyXG4gICAgdmFyIGlkeHMgPSBbXTsgIC8vIEluZGljZXMgZGUgbGEgY29sYVxyXG4gICAgdmFyIF93b3JraW5nID0gZmFsc2U7IC8vIEluZGljYSBzaSBsYSBjb2xhIGVzdGEgdHJhYmFqYW5kb1xyXG4gICAgdmFyIF9zdGFydGVkID0gZmFsc2U7IC8vIEluZGljYSBzaSBlbCB0cmFiYWpvIHNlIGluaWNpb1xyXG5cclxuICAgIC8vIEFncmVnYSB1biBlbGVtZW50byBhIGxhIGNvbGFcclxuICAgIHNlbGYuYWRkID0gZnVuY3Rpb24gKGlkeCwgaXRlbSkge1xyXG4gICAgICBpdGVtc1tpZHhdID0gaXRlbTtcclxuICAgICAgaWR4cy5wdXNoKGlkeCk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBJbmljaWFyIGVsIHRyYWJham9cclxuICAgICAgaWYgKCFfd29ya2luZykge1xyXG4gICAgICAgIF93b3JraW5nID0gdHJ1ZTtcclxuICAgICAgICAvLyBTaSB5YSBzZSBpbmljaW8gZW50b25jZSBpbmljYXIgbGEgZGVzY2FyZ2FcclxuICAgICAgICBpZiAoX3N0YXJ0ZWQpIHtcclxuICAgICAgICAgIHNlbGYubmV4dCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgLy8gSW5pY2lhIGVsIHRyYWJham8gZGUgbGEgY29sYVxyXG4gICAgc2VsZi5zdGFydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgX3N0YXJ0ZWQgPSB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBEZXZ1ZWx2ZSBzaSBsYSBjb2xhIGVzdGEgcHJvY2VzYW5kb1xyXG4gICAgc2VsZi53b3JraW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gX3dvcmtpbmc7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIERldnVlbHZlIHNpIGxhIGNvbGEgZXN0YSBwcm9jZXNhbmRvXHJcbiAgICBzZWxmLnN0YXJ0ZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBfc3RhcnRlZDtcclxuICAgIH07XHJcblxyXG4gICAgLy8gRGV2dWVsdmUgdW4gZWxlbWVudG8gcG9yIGVsIElEWFxyXG4gICAgc2VsZi5nZXQgPSBmdW5jdGlvbiAoaWR4KSB7XHJcbiAgICAgIHJldHVybiBpdGVtc1tpZHhdO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBQcm9jZXNhIGVsIHNpZ3VpZW50ZSBlbGVtZW50byBkZSBsYSBjb2xhXHJcbiAgICBzZWxmLm5leHQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgX3dvcmtpbmcgPSAhIWlkeHMubGVuZ3RoO1xyXG4gICAgICBpZiAoIV93b3JraW5nKSByZXR1cm47XHJcbiAgICAgIHZhciBpZHggPSBpZHhzLnNoaWZ0KCk7XHJcbiAgICAgIHZhciBpdGVtID0gaXRlbXNbaWR4XTtcclxuICAgICAgY2IoaWR4LCBpdGVtLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgc2VsZi5uZXh0KCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxufVxyXG5cclxuZXhwb3J0IHZhciBfbmFtZSA9ICd3b3JrJztcclxuZXhwb3J0IGRlZmF1bHQgYW5ndWxhci5tb2R1bGUoX25hbWUsIFtdKVxyXG4gIC5mYWN0b3J5KFtfbmFtZV0uam9pbignJyksIHdvcmspO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3NlcnZpY2VzL3dvcmsuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5mdW5jdGlvbiB3b3JrKCRxLCAkbG9nKSB7XG4gICduZ0luamVjdCc7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChjYikge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHZhciBpdGVtcyA9IHt9OyAvLyBFbGVtZW50byBkZSBsYSBjb2xhXG4gICAgdmFyIGlkeHMgPSBbXTsgLy8gSW5kaWNlcyBkZSBsYSBjb2xhXG4gICAgdmFyIF93b3JraW5nID0gZmFsc2U7IC8vIEluZGljYSBzaSBsYSBjb2xhIGVzdGEgdHJhYmFqYW5kb1xuICAgIHZhciBfc3RhcnRlZCA9IGZhbHNlOyAvLyBJbmRpY2Egc2kgZWwgdHJhYmFqbyBzZSBpbmljaW9cblxuICAgIC8vIEFncmVnYSB1biBlbGVtZW50byBhIGxhIGNvbGFcbiAgICBzZWxmLmFkZCA9IGZ1bmN0aW9uIChpZHgsIGl0ZW0pIHtcbiAgICAgIGl0ZW1zW2lkeF0gPSBpdGVtO1xuICAgICAgaWR4cy5wdXNoKGlkeCk7XG5cbiAgICAgIC8vIEluaWNpYXIgZWwgdHJhYmFqb1xuICAgICAgaWYgKCFfd29ya2luZykge1xuICAgICAgICBfd29ya2luZyA9IHRydWU7XG4gICAgICAgIC8vIFNpIHlhIHNlIGluaWNpbyBlbnRvbmNlIGluaWNhciBsYSBkZXNjYXJnYVxuICAgICAgICBpZiAoX3N0YXJ0ZWQpIHtcbiAgICAgICAgICBzZWxmLm5leHQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBJbmljaWEgZWwgdHJhYmFqbyBkZSBsYSBjb2xhXG4gICAgc2VsZi5zdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIF9zdGFydGVkID0gdHJ1ZTtcbiAgICB9O1xuXG4gICAgLy8gRGV2dWVsdmUgc2kgbGEgY29sYSBlc3RhIHByb2Nlc2FuZG9cbiAgICBzZWxmLndvcmtpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gX3dvcmtpbmc7XG4gICAgfTtcblxuICAgIC8vIERldnVlbHZlIHNpIGxhIGNvbGEgZXN0YSBwcm9jZXNhbmRvXG4gICAgc2VsZi5zdGFydGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIF9zdGFydGVkO1xuICAgIH07XG5cbiAgICAvLyBEZXZ1ZWx2ZSB1biBlbGVtZW50byBwb3IgZWwgSURYXG4gICAgc2VsZi5nZXQgPSBmdW5jdGlvbiAoaWR4KSB7XG4gICAgICByZXR1cm4gaXRlbXNbaWR4XTtcbiAgICB9O1xuXG4gICAgLy8gUHJvY2VzYSBlbCBzaWd1aWVudGUgZWxlbWVudG8gZGUgbGEgY29sYVxuICAgIHNlbGYubmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIF93b3JraW5nID0gISFpZHhzLmxlbmd0aDtcbiAgICAgIGlmICghX3dvcmtpbmcpIHJldHVybjtcbiAgICAgIHZhciBpZHggPSBpZHhzLnNoaWZ0KCk7XG4gICAgICB2YXIgaXRlbSA9IGl0ZW1zW2lkeF07XG4gICAgICBjYihpZHgsIGl0ZW0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5uZXh0KCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9O1xufVxuXG52YXIgX25hbWUgPSBleHBvcnRzLl9uYW1lID0gJ3dvcmsnO1xuZXhwb3J0cy5kZWZhdWx0ID0gYW5ndWxhci5tb2R1bGUoX25hbWUsIFtdKS5mYWN0b3J5KFtfbmFtZV0uam9pbignJyksIHdvcmspO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3NlcnZpY2VzL3dvcmsuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiBvYUJnRGlyZWN0aXZlKG9mZmxpbmVBc3NldHNTZXJ2aWNlLCAkdGltZW91dCkgeyAnbmdJbmplY3QnO1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgc2NvcGU6IHtcclxuICAgICAgdXJsOiAnPW9hU3JjJyxcclxuICAgICAgLy8gZnJvbTogJz1vYUZyb20nLFxyXG4gICAgICAvLyBkZXN0OiAnPW9hRGVzdCcsXHJcbiAgICAgIC8vIGltcG9ydGFudDogJz1vYUltcG9ydGFudCcsXHJcbiAgICAgIC8vIGxvYWRpbmdDbGFzczogJ0BvYUxvYWRpbmdDbGFzcycsXHJcbiAgICAgIC8vIGZhaWxDbGFzczogJ0BvYUZhaWxDbGFzcycsXHJcbiAgICAgIC8vIGZhaWw6ICcmb2FPbkZhaWwnLFxyXG4gICAgICAvLyByZW1vdmVMb2FkaW5nOiAnQG9hUmVtb3ZlTG9hZGluZ0NsYXNzJyxcclxuICAgIH0sXHJcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIGNiKHVybCkge1xyXG4gICAgICAgIC8vIFNldCBzcmMgdG8gaW1hZ2UgYXR0cnNcclxuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgZWxlbWVudC5hdHRyKCdzcmMnLCB1cmwpO1xyXG4gICAgICAgIH0sIDEwKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgb2ZmbGluZUFzc2V0c1NlcnZpY2UuZG93bmxvYWQoc2NvcGUudXJsLCBjYik7XHJcbiAgICAgIGVsZW1lbnQub24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIG9mZmxpbmVBc3NldHNTZXJ2aWNlLnJlbGVhc2Uoc2NvcGUudXJsLCBjYik7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuICB9O1xyXG59O1xyXG5cclxuaW1wb3J0IHsgX25hbWUgYXMgb2ZmbGluZUFzc2V0cyB9IGZyb20gJy4uL3NlcnZpY2VzL29mZmxpbmVBc3NldHMnO1xyXG5cclxuZXhwb3J0IHZhciBfbmFtZSA9ICdvYVNyYyc7XHJcbmV4cG9ydCBkZWZhdWx0IGFuZ3VsYXIubW9kdWxlKF9uYW1lLCBbXHJcbiAgb2ZmbGluZUFzc2V0c1xyXG5dKVxyXG4gIC5kaXJlY3RpdmUoX25hbWUsIG9hQmdEaXJlY3RpdmUpO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2RpcmVjdGl2ZXMvb2FTcmMuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLl9uYW1lID0gdW5kZWZpbmVkO1xuXG52YXIgX29mZmxpbmVBc3NldHMgPSByZXF1aXJlKCcuLi9zZXJ2aWNlcy9vZmZsaW5lQXNzZXRzJyk7XG5cbmZ1bmN0aW9uIG9hQmdEaXJlY3RpdmUob2ZmbGluZUFzc2V0c1NlcnZpY2UsICR0aW1lb3V0KSB7XG4gICduZ0luamVjdCc7XG5cbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHNjb3BlOiB7XG4gICAgICB1cmw6ICc9b2FTcmMnXG4gICAgfSxcbiAgICBsaW5rOiBmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXG4gICAgICBmdW5jdGlvbiBjYih1cmwpIHtcbiAgICAgICAgLy8gU2V0IHNyYyB0byBpbWFnZSBhdHRyc1xuICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZWxlbWVudC5hdHRyKCdzcmMnLCB1cmwpO1xuICAgICAgICB9LCAxMCk7XG4gICAgICB9XG5cbiAgICAgIG9mZmxpbmVBc3NldHNTZXJ2aWNlLmRvd25sb2FkKHNjb3BlLnVybCwgY2IpO1xuICAgICAgZWxlbWVudC5vbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG9mZmxpbmVBc3NldHNTZXJ2aWNlLnJlbGVhc2Uoc2NvcGUudXJsLCBjYik7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59O1xuXG52YXIgX25hbWUgPSBleHBvcnRzLl9uYW1lID0gJ29hU3JjJztcbmV4cG9ydHMuZGVmYXVsdCA9IGFuZ3VsYXIubW9kdWxlKF9uYW1lLCBbX29mZmxpbmVBc3NldHMuX25hbWVdKS5kaXJlY3RpdmUoX25hbWUsIG9hQmdEaXJlY3RpdmUpO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2RpcmVjdGl2ZXMvb2FTcmMuanNcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9