'use strict';

const Homey = require('homey');

class OpenUV extends Homey.App {
	
	onInit() {
		this.log('OpenUV app successfully started');
	}
	
}

module.exports = OpenUV;