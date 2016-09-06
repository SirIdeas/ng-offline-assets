'use strict';

function work($q, $log) { 'ngInject';

  return function (cb) { var  self = this;
    
    var items = {}; // Elemento de la cola
    var idxs = [];  // Indices de la cola
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
    self.next = function() {
      _working = !!idxs.length;
      if (!_working) return;
      var idx = idxs.shift();
      var item = items[idx];
      cb(idx, item, function () {
        self.next();
      });
    }

  };

}

export var _name = 'work';
export default angular.module(_name, [])
  .factory([_name].join(''), work);