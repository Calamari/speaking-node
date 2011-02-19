/**
 * l18n module
 */

//TODO: only save changed ones

/**
 *
 * @param {Object} [options] some initialization options
 */
module.exports = function(options) {
	options = options || {};

	// setup which storageEngine to Use
	options.storageEngine = options.storageEngine || require(__dirname + '/l18n_file_storage.js');
	// some options to pass to the storageEngine
	options.storageEngineOptions = options.storageEngineOptions || {
		dir: __dirname + '/../translations'
	};

	var storageEngine,
		translations = {},
		toDelete = [];		// List of keys that are to delete


	initialize();

	function initialize() {
		storageEngine = options.storageEngine(options.storageEngineOptions);
	}


	/**
	 * Returns the translated ressource in given language
	 * @param {String} key The storage key
	 * @param {String} lang For which language is this translation?
	 * @param {Object} [vars] Some vars that are parsed into the ressource, specials:
	 *						count: used also for choosing between singular and plural version
	 * @returns {String|false} The translated text or false if it doesn't exists
	 *
	 * @throws 'Key doesn\'t exist'-Exception if key doesn't exist ;-)
	 */
	function getText(key, lang, options) {
		options = options || {};
		options.count = options.count || 0;
		if (!translations[key]) throw new Error('Key doesn\'t exist');

		if (!translations[key].translations || !translations[key].translations[lang]) {
			return false;
		}

		var len           = translations[key].translations[lang].length,
			obj           = translations[key].translations[lang][len-1],
			value;
		if (typeof obj.value == 'string') {
			value = obj.value;
		} else {
			value = options.count === 1 ? obj.value[0] : obj.value[1];
		}

		for (var i in options) {
			value = value.replace(new RegExp('{' + i + '}', 'g'), options[i]);
		}
		return value;
	}

	/**
	 * Returns all current translations as object (lang => value)
	 * @param {String} key The storage key
	 * @returns {Object} with keys=lang und value=text
	 *
	 * @throws 'Key doesn\'t exist'-Exception if key doesn't exist ;-)
	 */
	function getTranslations(key) {
		if (!translations[key]) throw new Error('Key doesn\'t exist');

		if (!translations[key].translations) {
			return false;
		}
		var result = {};
		for(var i in translations[key].translations) {
			result[i] = translations[key].translations[i].value;
		}
		return result;
	}

	/**
	 * Returns the history of the translation
	 * @param {String} key The storage key
	 * @param {String} lang Of which language we want the history?
	 * @returns {Array|false} The History or false if language was never translated into
	 * @throws 'Key doesn\'t exist'-Exception if key doesn't exist ;-)
	 */
	function getTranslationHistory(key, lang) {
		if (!translations[key]) throw new Error('Key doesn\'t exist');

		if (!translations[key].translations || !translations[key].translations[lang]) {
			return false;
		}
		return translations[key].translations[lang];
	}

	/**
	 *
	 * @param {String} key The storage key
	 * @param {String} lang For which language is this translation?
	 * @param {String|Array} value The string value or an array with two elements for singular and plural
	 * @param {String} [author] Name of author
	 *
	 * @throws 'Key doesn\'t exist'-Exception if key doesn't exist ;-)
	 * @throws 'Lang wasn\'t set'-Exception if lang wasn't specified
	 * @throws 'value has wrong format'-Exception if the value is whether a string nor a array of length 2
	 */
	function storeTranslation(key, lang, value, author) {
		if (!translations[key]) throw new Error('Key doesn\'t exist');
		if (!lang) throw new Error('Lang wasn\'t set');
		if (typeof value != 'string' && (value.constructor != Array || value.length != 2)) throw new Error('value has wrong format');
		if (value.constructor == Array && (typeof value[0] != 'string' || typeof value[1] != 'string')) {
			 throw new Error('value has wrong format');
		}

		translations[key].translations = translations[key].translations;
		translations[key].translations[lang] = translations[key].translations[lang] || [];
		translations[key].translations[lang].push({
			value:     value || '',
			author:    author || '',
			modifiedAt: new Date()
		});
	}

	/**
	 * Generates a key that can have translations
	 * @param {String} key The key
	 * @param {Object} [meta] Some meta data like
	 *						description: 	Some dscription
	 *						author:			Who added it?
	 *						page:			Where it belongs
	 *						...				More stuff if you like
	 *
	 * @throws 'Key already exist'-Exception if key already exists ;-)
	 */
	function createKey(key, meta) {
		if (!key) { return; }
		if (translations[key]) throw new Error('Key already exist');

		translations[key] = {
			meta: meta || {},
			translations: {}
		};
		translations[key].meta.createdAt = new Date();
	}

	/**
	 * Deletes a key
	 * @param {String} key Key to delete
	 */
	function deleteKey(key) {
		if(key) {
			toDelete.push(key);
			delete translations[key];
		}
	}

	/**
	 * Updates the meta data of a key
	 * @param {String} key Key to update
	 * @param {Object} newData key value pairs of data to update
	 */
	function updateKey(key, newData) {
		if(newData) {
			for(var i in newData) {
				translations[key].meta[i] = newData[i];
			}
		}
	}

	/**
	 * Renames a key
	 * @param {String} key Key to rename
	 * @param {String} newKey New Name for that key
	 *
	 * @throws 'Key already exist'-Exception if key already exists we want name it to
	 * @throws 'Key doesn\'t exist'-Exception if key doesn't exist
	 */
	function renameKey(key, newKey) {
		if (!translations[key]) throw new Error('Key doesn\'t exist');
		if (translations[newKey]) throw new Error('Key already exist');
		
		translations[newKey] = translations[key];
		delete translations[key];
	}

	/**
	 * Checks if key exists
	 * @returns {Boolean} Whether it exists or not
	 */
	function keyExists(key) {
		return !!translations[key];
	}

	/**
	 * Returns the stored metainformation about a key
	 * @param {String} key The key
	 * @returns {Object} The metainformation with description, author, createdAt...
	 *
	 * @throws 'Key doesn\'t exist'-Exception if key doesn't exist ;-)
	 */
	function getMeta(key) {
		if (!translations[key]) throw new Error('Key doesn\'t exist');

		return translations[key].meta;
	}

	/**
	 * Returns all actually defined keys with meta data
	 * @returns {Object} keys are keys, and value is object containing the metadata
	 */
	function getAllMetadata() {
		var result = {};
		Object.keys(translations).forEach(function(key) {
			result[key] = translations[key].meta || {};
		});
		return result;
	}

	/**
	 * Returns list of all defined langauages for this ressouce
	 * @param {String} key The key
	 * @returns {Array} All defined locales
	 *
	 * @throws 'Key doesn\'t exist'-Exception if key doesn't exist ;-)
	 */
	function getDefinedLanguages(key) {
		if (!translations[key]) throw new Error('Key doesn\'t exist');

		if (!translations[key].translations) {
			return [];
		}
		return Object.keys(translations[key].translations);
	}

	/**
	 * Saves the actual version of all translations using the defined storage engine
	 */
	function flush() {
		storageEngine.save(translations);
		if (toDelete.length) {
			storageEngine.delete(toDelete);
			toDelete = [];
		}
	}

	/**
	 * Loads all translations from storage engine
	 */
	function load(callback) {
		var loaded = storageEngine.load(function(loaded) {
			for (var i in loaded) {
				translations[i] = loaded[i];
			}
			// TODO merges
			callback();
		});
	}

	return {
		getText:               getText,
		getTranslations:       getTranslations,
		getTranslationHistory: getTranslationHistory,
		storeTranslation:      storeTranslation,
		createKey:             createKey,
		deleteKey:             deleteKey,
		updateKey:             updateKey,
		renameKey:             renameKey,
		keyExists:             keyExists,
		getMeta:               getMeta,
		getAllMetadata:        getAllMetadata,
		getDefinedLanguages:   getDefinedLanguages,
		flush:                 flush,
		load:                  load
	};
};
