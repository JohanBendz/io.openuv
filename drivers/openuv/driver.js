'use strict';

const Homey = require('homey');

class OpenUVDriver extends Homey.Driver {

	onInit() {
		this.log('OpenUV driver initiated');
    
	}; // end onInit
	
	onPairListDevices(data, callback) {
		let devices = [
			{ "name": "OpenUV",
			  "data": {"id": guid()},
			  "settings": {
				  "offset": '0'
			  }
			}
		];
		callback(null, devices);
	};

};

module.exports = OpenUVDriver;

function guid() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};