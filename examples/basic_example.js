var L18n   = require('../src/l18n.js');

// It's using the basic file storage engine (it's the default)
var lang = new L18n({
	storageEngineOptions: {
		dir: __dirname,
		filename: 'example_translations.txt'
	}
});

// Add some text resources
lang.createKey('startpage.pageTitle', {
	author: 'Calamari',
	description: 'It\'s the text on top of the page.'
});
lang.createKey('startpage.introText', {
	author: 'Calamari',
	description: 'Text describing what is found on this site.'
});

// translate the ressources into english
lang.storeTranslation('startpage.pageTitle', 'en', 'Example Page', 'Translation Guy 1');
lang.storeTranslation('startpage.introText', 'en', 'You find here much useful stuff. Just browser around.', 'Translation Guy 1');

// translate the ressources into german
lang.storeTranslation('startpage.pageTitle', 'de', 'Beispielseite', 'German Guy');
lang.storeTranslation('startpage.introText', 'de', 'Schauen sie um und kaufen sie viel.', 'German Guy');

// save it into out storage may be a good idea
lang.flush();


// Now show us what we got...
console.log('PageTitle in english:', lang.getText('startpage.pageTitle', 'en'));
console.log('PageTitle in german:', lang.getText('startpage.pageTitle', 'de'));
