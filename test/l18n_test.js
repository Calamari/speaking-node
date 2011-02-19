var test   = require('testosterone')({ title: 'l18n module'}),
	assert = test.assert,
	L18n   = require('../src/l18n.js');

var saveWasCalled = 0,
	deleteWasCalled = 0;
var stubStorageEngine = function() {
	return {
		save: function(translations) {
			++saveWasCalled;
			if (saveWasCalled === 1) {
				assert.equal(Object.keys(translations).length, 3, 'there should be three text ressources to save');
				assert.equal(Object.keys(translations['empty'].translations).length, 0, 'there should be no translation for ressource empty');
				assert.equal(translations['empty'].meta.val, 'foo', 'metadata should also be given to storage engine to save');
	
				assert.equal(Object.keys(translations['test'].translations).length, 2, 'there should be two translation for ressource test');
				assert.equal(translations['test'].translations['en'].length, 4, 'there should be two translation into english for ressource test');
				assert.equal(translations['test'].translations['en'][1].value, 'I am no legend', 'the actual translation of test into english should be "I am no legend"');
				assert.equal(translations['test'].translations['en'][1].author, 'author3', 'the author of the actual translation of test into english should be "author3"');
	
				assert.equal(Object.keys(translations['values'].translations).length, 1, 'there should be one translation for ressource values');
			}
		},
		load: function(callback) {
			callback({
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
			assert.ok(keys.indexOf('empty') !== -1, 'empty should be marked as deleted');
			assert.ok(keys.indexOf('values') !== -1, 'values should be marked as deleted');
		}
	};
};


var l = new L18n();

test
	.add('creating a key without meta data works fine', function(spec) {
		var now = new Date();
		l.createKey('test.me');
		var meta = l.getMeta('test.me');

		assert.equal(Object.keys(meta).length, 1, "there should be only one meta information set");
		assert.ok(meta.createdAt, "createdAt should be set in meta");
		assert.ok(meta.createdAt >= now && meta.createdAt <= new Date(), "the createdAt time is set correctly")
	})
	.add('creating a key with some more meta data works fine too', function(spec) {
			l.createKey('test.more', {
				author:      'Chuck Norris',
				description: 'A text to rule the world',
				something:   'Nonsense'
			});
			var meta = l.getMeta('test.more');

			assert.equal(Object.keys(meta).length, 4, "there should be only one meta information set");
			assert.equal(meta.author, 'Chuck Norris', 'Name should be correctly'),
			assert.equal(meta.description, 'A text to rule the world', 'Description should be correctly'),
			assert.equal(meta.something, 'Nonsense', 'some more information can be appended'),


			meta = l.getMeta('test.me');
			assert.equal(Object.keys(meta).length, 1, 'The meta data of previously set key shouldn\'t have changed');
	})
	.add('creating a already existing key throws up', function(spec) {
		assert.throws(function() {
			l.createKey('test.me');
		}, Error, 'should have thrown');
	})
	.add('similar looking keys shouldn\'t throw', function(spec) {
		l.createKey('test.memore');
		l.createKey('test');
	})
	.add('retrieving a non existent key should throw', function(spec) {
		assert.throws(function() {
			l.getMeta('testmeyeah');
		}, Error, 'should have thrown');
	});

l = new L18n({
	storageEngine: stubStorageEngine
});
l.createKey('test');
l.createKey('empty', { val: 'foo' });
l.createKey('values');
test
	.add('adding the first translation', function(spec) {
			l.storeTranslation('test', 'en', 'I am legend');
			assert.equal(l.getText('test', 'en'), 'I am legend');
			var locals = l.getTranslations('test');
			assert.equal(Object.keys(locals).length, 1, 'There should be one translation for key test');
	})
	.add('adding the second translation', function(spec) {
			l.storeTranslation('test', 'de', 'I bin ein Held', 'author2');
			assert.equal(l.getText('test', 'de'), 'I bin ein Held');
			assert.equal(l.getText('test', 'en'), 'I am legend', 'Should\'t have changed the other language');

			var locals = l.getTranslations('test');
			assert.equal(Object.keys(locals).length, 2, 'There should be two translations for key test now');
	})
	.add('adding a new translation for already translated key/locale', function(spec) {
			l.storeTranslation('test', 'en', 'I am no legend', 'author3');
			assert.equal(l.getText('test', 'en'), 'I am no legend', 'text should have changed now');

			var locals = l.getTranslations('test');
			assert.equal(Object.keys(locals).length, 2, 'There should still be two translations for key test');
	})
	.add('testing all value possibilities', function(spec) {
		assert.throws(function() {
			l.storeTranslation('values', 'en', {});
		});
		assert.throws(function() {
			l.storeTranslation('values', 'en', 23);
		});
		assert.throws(function() {
			l.storeTranslation('values', 'en', []);
		});
		assert.throws(function() {
			l.storeTranslation('values', 'en', ['ferfaer']);
		});
		assert.throws(function() {
			l.storeTranslation('values', 'en', ['babs', 'bla', 'blubb']);
		});
		assert.throws(function() {
			l.storeTranslation('values', 'en', ['babs', 42]);
		});
		l.storeTranslation('values', 'en', ['hey', 'ho']);
		l.storeTranslation('values', 'en', 'masterpiece');
	})
	.add('getting the english History', function(spec) {
		var h = l.getTranslationHistory('test', 'en');
		assert.equal(h.length, 2, 'it has two entries');

		assert.equal(h[0].author, '', 'it\'s first entry has no author');
		assert.equal(h[1].author, 'author3', 'it\'s second entry is of author3');
		assert.equal(h[0].modifiedAt.constructor, Date, 'it\'s first enry has a modified Date set');
		assert.equal(h[1].modifiedAt.constructor, Date, 'it\'s second entry has a modified Date set');
	})
	.add('getting the german History', function(spec) {
		var h = l.getTranslationHistory('test', 'de');

		assert.equal(h.length, 1, 'it has one entry');
		assert.equal(h[0].author, 'author2', 'it is of author2');
		assert.equal(h[0].modifiedAt.constructor, Date, 'it has a modified Date set');
	})
	.add('getting a History of not set language', function(spec) {
		var h = l.getTranslationHistory('test', 'es');
		
		assert.ok(h === false, 'is empty');
	})
	.add('and trying to translate an unknown key', function(spec) {
		assert.throws(function() {
			l.storeTranslation('testing', 'en', 'I dont work');
		}, Error);
	})
	.add('adding a translation with singular and plural', function(spec) {
		l.storeTranslation('test', 'en', ['friend', 'friends']);
		assert.equal(l.getText('test', 'en'), 'friends', 'should return plural when count is 0 or not set');
		assert.equal(l.getText('test', 'en', { count: 0 }), 'friends', 'should return plural when count is 0 or not set');
		assert.equal(l.getText('test', 'en', { count: 1 }), 'friend', 'should return singular when count is 1 or not set');
		assert.equal(l.getText('test', 'en', { count: 2 }), 'friends', 'should return plural when count is 2 or more');
	})
	.add('adding a translation with some vars in singular and plural', function(spec) {
		l.storeTranslation('test', 'en', ['{count} friend, {count}', '{count} friends, {count}']);
		assert.equal(l.getText('test', 'en'), '0 friends, 0', 'should return plural when count is not set and parse count into it');
		assert.equal(l.getText('test', 'en', { count: 0 }), '0 friends, 0', 'should return plural when count is 0 or not set and parse count into it');
		assert.equal(l.getText('test', 'en', { count: 1 }), '1 friend, 1', 'should return singular when count is 1 or not set and parse count into it');
		assert.equal(l.getText('test', 'en', { count: 3 }), '3 friends, 3', 'should return plural when count is 3 or more and parse count into it');
	})
	.add('testing method keyExists', function(spec) {
		assert.ok(l.keyExists('test'), 'test should exist');
		assert.ok(!l.keyExists('test.me'), 'test should not exist');
		assert.ok(!l.keyExists(''), ' should not exist');
	})
	.add('testing method getDefinedLanguages', function(spec) {
		var langs = l.getDefinedLanguages('test');
		assert.equal(langs.length, 2, 'test should be translated into 2 languages');
		assert.ok(langs.indexOf('de') !== -1, 'test should be translated into de');
		assert.ok(langs.indexOf('en') !== -1, 'test should be translated into en');
	})
	.add('testing flushing to storage engine', function(spec) {
		l.flush();
		assert.equal(saveWasCalled, 1, 'The save method of storage engine should be called');
		assert.equal(deleteWasCalled, 0, 'The delete method of storage engine should not be called, because nothing was marked as deleted');
	})
	.add('testing loading from storage engine', function(spec) {
		l.load(function() {
			// old data should still be there
			assert.equal(l.getText('test', 'en'), '0 friends, 0', 'ressource test should still be there');
			assert.equal(l.getText('test1', 'en'), 'Test me', 'ressource test1 should be loaded');
			assert.equal(l.getText('testtwo', 'en'), 'Foobar', 'ressource testtwo should be loaded now');
			assert.equal(l.getText('testtwo', 'de'), 'Feuerbar', 'ressource testtwo should be loaded now also in german');
	
			var meta = l.getMeta('test1');
			assert.equal(meta.creator, 'Chuck', 'creator of test1 should be Chuck');
			meta = l.getMeta('testtwo');
			assert.equal(meta.creator, 'Chucky', 'creator of testtwo should be Chucky');
	
			var langs = l.getDefinedLanguages('testtwo');
			assert.equal(langs.length, 2, 'test should be translated into 2 languages');
			assert.ok(langs.indexOf('de') !== -1, 'test should be translated into de');
			assert.ok(langs.indexOf('en') !== -1, 'test should be translated into en');
	
			var h = l.getTranslationHistory('testtwo', 'en');
			assert.equal(h.length, 1, 'testtwo should have 1 english translation');
			assert.ok(h[0].author, 'Bill', 'the english of testtwo should come from Bill');
		});
	})
	.add('testing deletion of keys', function(spec) {
		l.deleteKey('empty');
		l.deleteKey('values');
		assert.throws(function() {
			l.getMeta('empty');
		}, Error, 'there should be no key empty anymore');
		assert.throws(function() {
			l.getText('values', 'en');
		}, Error, 'there should be no key values anymore');
		assert.throws(function() {
			l.getTranslations('values');
		}, Error, 'there should be no key values anymore');
		
		l.flush();
		assert.equal(deleteWasCalled, 1, 'The delete method of storage engine should now be called');
	})
	// TODO: test überschneidungen (sortiert nach times) check nach meta gleichness (author & createdAt)?
	// TODO: exporting nach languages und only key: texts
	.serial(function() {
		console.log('Translations should be working!');
	});
