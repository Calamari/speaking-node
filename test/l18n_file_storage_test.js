var async_test  = require('async_testing'),
    wrap        = async_test.wrap,
    FileStorage = require('../src/l18n_file_storage.js'),
    fs          = require('fs');

var storage = new FileStorage({
  dir: __dirname + '/assets',
  filename: 'translation.txt'
});
var testObj = {
      'test1': {
        'meta': {
          'creator': 'Chuck',
          'createdAt': new Date()
        },
        'translations': {
          'en': [{
            'value':      'Test\nme',
            'author':     'Chuck',
            'modifiedAt': new Date()
          }]
        }
      },
      'testtwo': {
        'meta': {
          'creator': 'Chucky',
          'createdAt': new Date()
        },
        'translations': {
          'en': [{
            'value':      'Foobar',
            'author':     'Bill',
            'modifiedAt': new Date()
          }],
          'de': [{
            'value':      'Feuerbar',
            'author':     'Chucky',
            'modifiedAt': new Date()
          }]
        }
      }
    };

var testObj2 = {
  'go\n[1]o': {
    'meta': {},
    'translations': {}
  },
  'just another key': {
    'meta': {},
    'translations': {}
  },
  'living dead': {
    'meta': {},
    'translations': {}
  },
  'four': {
    'meta': {},
    'translations': {}
  }
}

var testSuite = {
  'test saving translations': function(test) {
    test.numAssertions = 6;
    storage.save(testObj, function(err) {

      test.equal(err, null, 'There shouln\'t be a problem if dir exists (and permissions are right)');

      fs.readFile(__dirname + '/assets/translation.txt', 'utf8', function(err, data) {
//        console.log(data);

        test.equal(err, null, 'The file should exist');

        test.ok((/^\[test1\]\n/).test(data) || (/\n\[test1\]\n/).test(data), 'ressource test1 was written to file');
        test.ok(data.indexOf(JSON.stringify(testObj.test1)) !== -1, 'ressource test1 was written to file');

        test.ok((/^\[testtwo\]\n/).test(data) || (/\n\[testtwo\]\n/).test(data), 'ressource testtwo was written to file');
        test.ok(data.indexOf(JSON.stringify(testObj.testtwo)) !== -1, 'ressource testtwp was written to file');

        test.finish();
      });
    });
  },

  'saving to a filestorage with broken dir': function(test) {
    new FileStorage({
      dir: __dirname + '/dirNotExistent'
    }).save({}, function(err) {
      test.ok(err, 'When write wasn\'t possible, then throw up');
      test.finish();
    });
  },

  'loading translations again': function(test) {
    test.numAssertions = 8;

    storage.load(function(err, translations) {
      test.equal(err, null);

      test.equal(Object.keys(translations).length, 2, 'Two Ressources should be loaded');
      test.ok(translations.test1, 'Ressource test1 should be loaded');
      test.ok(translations.testtwo, 'Ressource testtwo should be loaded');

      test.deepEqual(translations.test1.meta, testObj.test1.meta, 'Ressource test1 should have meta data');
      test.deepEqual(translations.test1.translations, testObj.test1.translations, 'Ressource test1 should have translations');

      test.deepEqual(translations.testtwo.meta, testObj.testtwo.meta, 'Ressource testtwo should have meta data');
      test.deepEqual(translations.testtwo.translations, testObj.testtwo.translations, 'Ressource testtwo should have translations');

      test.finish();
    });
  },

  'deleting of keys can be called with one or more keys': function(test) {
    storage.save(testObj2, function() {
      storage.delete(['living dead', 'four'], function() {
        storage.delete('go\n[1]o', function() {
          storage.load(function(err, translations) {
            test.equal(err, null);
            test.equal(Object.keys(translations).length, 1, 'There should be only one Ressources now');
            test.ok(translations['just another key'], 'Ressource just another key should be loaded');

            test.finish();
          });
        });
      });
    });
  }
};

/* Doesn't work, strange... wrap is undefined
module.exports = wrap({
  suiteTeardown: function(done) {
    fs.unlink(__dirname + '/assets/translation.txt', function() {
      done();
    });
  },
  suite: testSuite
});
*/
module.exports = testSuite;

if (module === require.main) {
  return async_test.run(__filename, process.ARGV);
}
