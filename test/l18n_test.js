var async_test  = require('async_testing'),
	wrap        = async_test.wrap,
	L18n        = require('../src/l18n.js');

var saveWasCalled = 0,
	deleteWasCalled = 0;
	
var testAssert;
var stubStorageEngine = function() {
	return {
		save: function(translations) {
			++saveWasCalled;
			if (saveWasCalled === 1) {
				testAssert.equal(Object.keys(translations).length, 3, 'there should be three text ressources to save');
				testAssert.equal(Object.keys(translations['empty'].translations).length, 0, 'there should be no translation for ressource empty');
				testAssert.equal(translations['empty'].meta.val, 'foo', 'metadata should also be given to storage engine to save');
	
				testAssert.equal(Object.keys(translations['test'].translations).length, 2, 'there should be two translation for ressource test');
				testAssert.equal(translations['test'].translations['en'].length, 4, 'there should be two translation into english for ressource test');
				testAssert.equal(translations['test'].translations['en'][1].value, 'I am no legend', 'the actual translation of test into english should be "I am no legend"');
				testAssert.equal(translations['test'].translations['en'][1].author, 'author3', 'the author of the actual translation of test into english should be "author3"');
	
				testAssert.equal(Object.keys(translations['values'].translations).length, 1, 'there should be one translation for ressource values');
			}
		},
		load: function(callback) {
			callback(null, {
				'test1': {
					'meta': {
						'creator': 'Chuck',
						'createdAt': new Date()
					},
					'translations': {
						'en': [{
							'value':      'Test me',
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
							'value':      'Foobar is old',
							'author':     'Bob',
							'modifiedAt': new Date()
						}, {
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
			});
		},
		delete: function(keys) {
			++deleteWasCalled;
			testAssert.ok(keys.indexOf('empty') !== -1, 'empty should be marked as deleted');
			testAssert.ok(keys.indexOf('values') !== -1, 'values should be marked as deleted');
		}
	};
};


var l = new L18n();

var testSuite = {
	'creating a key without meta data works fine': function(test) {
		var now = new Date();
		l.createKey('test.me');
		var meta = l.getMeta('test.me');

		test.equal(Object.keys(meta).length, 1, "there should be only one meta information set");
		test.ok(meta.createdAt, "createdAt should be set in meta");
		test.ok(meta.createdAt >= now && meta.createdAt <= new Date(), "the createdAt time is set correctly");
		test.finish();
	},
	'creating a key with some more meta data works fine too': function(test) {
		l.createKey('test.more', {
			author:      'Chuck Norris',
			description: 'A text to rule the world',
			something:   'Nonsense'
		});
		var meta = l.getMeta('test.more');

		test.equal(Object.keys(meta).length, 4, "there should be only one meta information set");
		test.equal(meta.author, 'Chuck Norris', 'Name should be correctly'),
		test.equal(meta.description, 'A text to rule the world', 'Description should be correctly'),
		test.equal(meta.something, 'Nonsense', 'some more information can be appended'),


		meta = l.getMeta('test.me');
		test.equal(Object.keys(meta).length, 1, 'The meta data of previously set key shouldn\'t have changed');
		test.finish();
	},
	'creating a already existing key throws up': function(test) {
		test.throws(function() {
			l.createKey('test.me');
		}, Error, 'should have thrown');
		test.finish();
	},
	'similar looking keys shouldn\'t throw': function(test) {
		l.createKey('test.memore');
		l.createKey('test');
		test.finish();
	},
	'retrieving a non existent key should throw': function(test) {
		test.throws(function() {
			l.getMeta('testmeyeah');
		}, Error, 'should have thrown');
		test.finish();
	}
};

var testSuite2;
(function() {
	var l = new L18n({
		storageEngine: stubStorageEngine
	});
	l.createKey('test');
	l.createKey('empty', { val: 'foo' });
	l.createKey('values');
	
	testSuite2 = {
		'adding the first translation': function(test) {
			l.storeTranslation('test', 'en', 'I am legend');
			test.equal(l.getText('test', 'en'), 'I am legend');
			var locals = l.getTranslations('test');
			test.equal(Object.keys(locals).length, 1, 'There should be one translation for key test');
			test.finish();
		},
		'adding the second translation': function(test) {
			l.storeTranslation('test', 'de', 'I bin ein Held', 'author2');
			test.equal(l.getText('test', 'de'), 'I bin ein Held');
			test.equal(l.getText('test', 'en'), 'I am legend', 'Should\'t have changed the other language');
	
			var locals = l.getTranslations('test');
			test.equal(Object.keys(locals).length, 2, 'There should be two translations for key test now');
			test.finish();
		},
		'adding a new translation for already translated key/locale': function(test) {
			l.storeTranslation('test', 'en', 'I am no legend', 'author3');
			test.equal(l.getText('test', 'en'), 'I am no legend', 'text should have changed now');
	
			var locals = l.getTranslations('test');
			test.equal(Object.keys(locals).length, 2, 'There should still be two translations for key test');
			test.finish();
		},
		'testing all value possibilities': function(test) {
			test.throws(function() {
				l.storeTranslation('values', 'en', {});
			});
			test.throws(function() {
				l.storeTranslation('values', 'en', 23);
			});
			test.throws(function() {
				l.storeTranslation('values', 'en', []);
			});
			test.throws(function() {
				l.storeTranslation('values', 'en', ['ferfaer']);
			});
			test.throws(function() {
				l.storeTranslation('values', 'en', ['babs', 'bla', 'blubb']);
			});
			test.throws(function() {
				l.storeTranslation('values', 'en', ['babs', 42]);
			});
			l.storeTranslation('values', 'en', ['hey', 'ho']);
			l.storeTranslation('values', 'en', 'masterpiece');
			test.finish();
		},
		'getting the english History': function(test) {
			var h = l.getTranslationHistory('test', 'en');
			test.equal(h.length, 2, 'it has two entries');
	
			test.equal(h[0].author, '', 'it\'s first entry has no author');
			test.equal(h[1].author, 'author3', 'it\'s second entry is of author3');
			test.equal(h[0].modifiedAt.constructor, Date, 'it\'s first enry has a modified Date set');
			test.equal(h[1].modifiedAt.constructor, Date, 'it\'s second entry has a modified Date set');
			test.finish();
		},
		'getting the german History': function(test) {
			var h = l.getTranslationHistory('test', 'de');
	
			test.equal(h.length, 1, 'it has one entry');
			test.equal(h[0].author, 'author2', 'it is of author2');
			test.equal(h[0].modifiedAt.constructor, Date, 'it has a modified Date set');
			test.finish();
		},
		'getting a History of not set language': function(test) {
			var h = l.getTranslationHistory('test', 'es');
	
			test.ok(h === false, 'is empty');
			test.finish();
		},
		'and trying to translate an unknown key': function(test) {
			test.throws(function() {
				l.storeTranslation('testing', 'en', 'I dont work');
			}, Error);
			test.finish();
		},
		'adding a translation with singular and plural': function(test) {
			l.storeTranslation('test', 'en', ['friend', 'friends']);
			test.equal(l.getText('test', 'en'), 'friends', 'should return plural when count is 0 or not set');
			test.equal(l.getText('test', 'en', { count: 0 }), 'friends', 'should return plural when count is 0 or not set');
			test.equal(l.getText('test', 'en', { count: 1 }), 'friend', 'should return singular when count is 1 or not set');
			test.equal(l.getText('test', 'en', { count: 2 }), 'friends', 'should return plural when count is 2 or more');
			test.finish();
		},
		'adding a translation with some vars in singular and plural': function(test) {
			l.storeTranslation('test', 'en', ['{count} friend, {count}', '{count} friends, {count}']);
			test.equal(l.getText('test', 'en'), '0 friends, 0', 'should return plural when count is not set and parse count into it');
			test.equal(l.getText('test', 'en', { count: 0 }), '0 friends, 0', 'should return plural when count is 0 or not set and parse count into it');
			test.equal(l.getText('test', 'en', { count: 1 }), '1 friend, 1', 'should return singular when count is 1 or not set and parse count into it');
			test.equal(l.getText('test', 'en', { count: 3 }), '3 friends, 3', 'should return plural when count is 3 or more and parse count into it');
			test.finish();
		},
		'adding a translation with some other vars in singular and plural': function(test) {
			var l2 = new L18n();
			l2.createKey('paladin');
			l2.storeTranslation('paladin', 'en', ['One Paladin named {name}', 'More Paladins named {name}']);
			test.equal(l2.getText('paladin', 'en'), 'More Paladins named {name}', 'should not parse {name} if not set');
			test.equal(l2.getText('paladin', 'en', { count: 0, name: 'Tim' }), 'More Paladins named Tim', 'should return plural when count is 0 or not set and parse name into it');
			test.equal(l2.getText('paladin', 'en', { count: 1, name: 'Bob' }), 'One Paladin named Bob', 'should return singular when count is 1 and parse name if set');
			test.equal(l2.getText('paladin', 'en', { count: 1, named: 'Bob' }), 'One Paladin named {name}', 'should return singular when count is 1 and parse nothing if name is not set');
			test.equal(l2.getText('paladin', 'de', { count: 2 }), false, 'should return false if text doesn\'t exist in this language');
			test.finish();
		},
		'testing method keyExists': function(test) {
			test.ok(l.keyExists('test'), 'test should exist');
			test.ok(!l.keyExists('test.me'), 'test should not exist');
			test.ok(!l.keyExists(''), ' should not exist');
			test.finish();
		},
		'testing method getDefinedLanguages': function(test) {
			var langs = l.getDefinedLanguages('test');
			test.equal(langs.length, 2, 'test should be translated into 2 languages');
			test.ok(langs.indexOf('de') !== -1, 'test should be translated into de');
			test.ok(langs.indexOf('en') !== -1, 'test should be translated into en');
			test.finish();
		},
		'testing flushing to storage engine': function(test) {
			testAssert = test;
			l.flush();
			test.equal(saveWasCalled, 1, 'The save method of storage engine should be called');
			test.equal(deleteWasCalled, 0, 'The delete method of storage engine should not be called, because nothing was marked as deleted');
			test.finish();
		},
		'testing loading from storage engine': function(test) {
			test.numAssertions = 12;
			l.load(function() {
				// old data should still be there
				test.equal(l.getText('test', 'en'), '0 friends, 0', 'ressource test should still be there');
				test.equal(l.getText('test1', 'en'), 'Test me', 'ressource test1 should be loaded');
				test.equal(l.getText('testtwo', 'en'), 'Foobar', 'ressource testtwo should be loaded now');
				test.equal(l.getText('testtwo', 'de'), 'Feuerbar', 'ressource testtwo should be loaded now also in german');
	
				var meta = l.getMeta('test1');
				test.equal(meta.creator, 'Chuck', 'creator of test1 should be Chuck');
				meta = l.getMeta('testtwo');
				test.equal(meta.creator, 'Chucky', 'creator of testtwo should be Chucky');
	
				var langs = l.getDefinedLanguages('testtwo');
				test.equal(langs.length, 2, 'test should be translated into 2 languages');
				test.ok(langs.indexOf('de') !== -1, 'test should be translated into de');
				test.ok(langs.indexOf('en') !== -1, 'test should be translated into en');
	
				var h = l.getTranslationHistory('testtwo', 'en');
				test.equal(h.length, 2, 'testtwo should have 2 english translation');
				test.ok(h[0].author, 'Bill', 'the first english of testtwo should come from Bill');
				test.ok(h[1].author, 'Bob', 'the second english of testtwo should come from Bill');
				test.finish();
			});
		},

		'testing deletion of keys': function(test) {
			testAssert = test;
			l.deleteKey('empty');
			l.deleteKey('values');
			test.throws(function() {
				l.getMeta('empty');
			}, Error, 'there should be no key empty anymore');
			test.throws(function() {
				l.getText('values', 'en');
			}, Error, 'there should be no key values anymore');
			test.throws(function() {
				l.getTranslations('values');
			}, Error, 'there should be no key values anymore');
	
			l.flush();
			test.equal(deleteWasCalled, 1, 'The delete method of storage engine should now be called');
			test.finish();
		},
		'testing getting of all keys with metas': function(test) {
			l.createKey('bla', { creator: 'me' });
			var data = l.getAllMetadata();
	
			test.equal(Object.keys(data).length, 4, 'There should be two keys');
			test.ok(data.bla, 'key bla should exists');
			test.ok(data.test, 'key test should exists');
			test.ok(data.test1, 'key test should exists');
			test.ok(data.testtwo, 'key test should exists');
			test.equal(Object.keys(data.test).length, 1, 'key test should have no meta data except createdAt');
			test.ok(data.test.createdAt, 'key test should have no meta data except createdAt');
			test.equal(data.bla.creator, 'me', 'key bla should have a creator as meta data');
			test.finish();
		},
		'testing updating of key meta data': function(test) {
			var origData = l.getMeta('bla');
			var createdAt = origData.createdAt;
	
			l.updateKey('bla', { creator: 'not me', more: 'something' });
			var data = l.getMeta('bla');
			test.equal(Object.keys(data).length, 3, 'There should be three meta data now');
			test.equal(data.creator, 'not me', 'the creator should now be not me');
			test.equal(data.more, 'something', 'more data should be appended');
			test.equal(data.createdAt, createdAt, 'createdAt should not have changed');
	
			l.updateKey('bla', { creator: 'me' });
			data = l.getMeta('bla');
			test.equal(Object.keys(data).length, 3, 'There should still be three meta data');
			test.equal(data.creator, 'me', 'the creator should again be not me');
			test.equal(data.more, 'something', 'more data should still be there');
	
			l.updateKey('bla');
			data = l.getMeta('bla');
			test.equal(Object.keys(data).length, 3, 'There should still be three meta data');
			test.equal(data.creator, 'me', 'the creator should not have changed');
			test.equal(data.more, 'something', 'more data should not have changed');
			test.equal(data.createdAt, createdAt, 'createdAt should not have changed');
			test.finish();
		},
		'testing renaming of a key': function(test) {
			var origData = l.getMeta('bla');
			var createdAt = origData.createdAt;
	
			l.renameKey('bla', 'blubb');
			test.ok(!l.keyExists('bla'), 'Key bla should not exist anymore');
	
			var data = l.getMeta('blubb');
			test.equal(Object.keys(data).length, 3, 'There should be three meta data');
			test.equal(data.creator, 'me', 'the creator should not have changed');
			test.equal(data.more, 'something', 'more data should not have changed');
			test.equal(data.createdAt, createdAt, 'createdAt should not have changed');
			test.throws(function() {
				l.renameKey('blubb', 'test');
			}, Error, 'renaming into an already existing key should throw an error');
			test.throws(function() {
				l.renameKey('notthere', 'notthereeither');
			}, Error, 'renaming of a not existing key should throw an error');
			test.finish();
		},
		'testing if we can get all keys (and texts) with given language': function(test) {
			test.numAssertions = 5;
			l = new L18n({
				storageEngine: stubStorageEngine
			});
			l.load(function() {
				var enTexts = l.getAllOfLanguage('en'),
					deTexts = l.getAllOfLanguage('de');

				test.equal(Object.keys(enTexts).length, 2, 'should be two english translations');
				test.equal(Object.keys(deTexts).length, 1, 'should be two german translations');

				test.equal(enTexts.test1, 'Test me', 'test1 should be english translated as Test me');
				test.equal(enTexts.testtwo, 'Foobar', 'testtwo should be english translated as Foobar');
				test.equal(deTexts.testtwo, 'Feuerbar', 'testtwo should be  german translated to Feuerbar');
				test.finish();
			});
		},
		'test getting a plain text version without parsing vars inside': function(test) {
			var l2 = new L18n();
			l2.createKey('paladin');
			l2.storeTranslation('paladin', 'en', ['One Paladin named {name}', 'More Paladins named {name}']);
			test.equal(l2.getPlainText('paladin', 'en'), 'More Paladins named {name}', 'should get plain text in plural version when nothing is said');
			test.equal(l2.getPlainText('paladin', 'en', 2), 'More Paladins named {name}', 'should get plain text in plural version when told to do so');
			test.equal(l2.getPlainText('paladin', 'en', 0), 'More Paladins named {name}', 'should get plain text in plural version when told to do so');
			test.equal(l2.getPlainText('paladin', 'en', 1), 'One Paladin named {name}', 'should get plain text in singular version when told to do so');
			test.equal(l2.getPlainText('paladin', 'de', 1), false, 'should return false if text doesn\'t exist in this language');
			test.finish();
		}
	};
})();
	// TODO: test überschneidungen (sortiert nach times) check nach meta gleichness (author & createdAt)?
	// TODO: export method, similar to map

for(var i in testSuite2) {
	testSuite[i] = testSuite2[i];
}

module.exports = testSuite;

if (module === require.main) {
  return async_test.run(__filename, process.ARGV);
}
