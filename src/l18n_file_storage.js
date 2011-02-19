/**
 * File Storage engine for l18n module
 */
var fs = require('fs');

module.exports = function(options) {
  options = options || {};
  options.dir = options.dir || __dirname + '/translations/';
  options.filename = options.filename || 'ressources.txt';
  
  var dirHandle, filename,
      LOADING_REGEX = /\[(.*?)\]\n(.*)\n/;
  
  
  initialization();
  
  function initialization() {
    filename = options.dir + '/' + options.filename;
  }
  
  function save(translations, callback) {
    var str = '';
    Object.keys(translations).forEach(function(key) {
      str += '[' + encodeURI(key) + ']\n';
      str += JSON.stringify(translations[key]) + '\n';
    });
    fs.writeFile(filename, str, 'utf8', function(err, fh) {
      callback && callback(err);
    });
  }
  
  function load(callback) {
    fs.readFile(filename, 'utf8', function(err, data) {
      if (err) {
        callback(err);
      } else {
        var obj = {}, m, o;

        // reconstruct all Date objects
        while (m = data.match(LOADING_REGEX)) {
          o = JSON.parse(m[2]);
          
          if (o.meta) {
            o.meta.createdAt = new Date(o.meta.createdAt);
          }
          if (o.translations) {
            for(var lang in o.translations) {
              for(var i=0, l=o.translations[lang].length; i<l; ++i) {
                o.translations[lang][i].modifiedAt = new Date(o.translations[lang][i].modifiedAt);
              }
            }
          }
          obj[decodeURI(m[1])] = o;

          data = data.replace(LOADING_REGEX, '');
        }
        

        callback(null, obj);
      }
    });
  }
  
  function deleteKeys(keys, callback) {
    if (!Array.isArray(keys)) {
      keys = [keys];
    }
    
    fs.readFile(filename, 'utf8', function(err, data) {
      if (err) {
        callback && callback(err);
      } else {
        keys.forEach(function(key) {
          data = data.replace(new RegExp('\\[' + encodeURI(key) + '\\]\\n(.*)\\n'), '');
        });
        fs.writeFile(filename, data, 'utf8', function(err, fh) {
          callback && callback(err);
        });
      }
    });
    
  }

  return {
    'save': save,
    'load': load,
    'delete': deleteKeys
  };
};
