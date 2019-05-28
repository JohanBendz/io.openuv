'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

// defining variables
let uv_index = "";
let uv_max = "";
let ozone_level = "";
let st_1 = "";
let st_2 = "";
let st_3 = "";
let st_4 = "";
let st_5 = "";
let st_6 = "";

//Set Cron parameters
const cronName = "openUVCronTask"
const cronInterval = "30 5,7,8,9,10,11,12,13,14,15,16,17,18,19,21 * * *"; // = every day, 5:30, 7:30..every half hour...19:30 and 21:30.

class OpenUVDevice extends Homey.Device {

    onInit() {
        this.log('OpenUV device initiated');

		//Register crontask
		Homey.ManagerCron.getTask(cronName)
        .then(task => {
            this.log("This crontask is already registred: " + cronName);
            task.on('run', () => this.fetchUVData());
        })
        .catch(err => {
            if (err.code == 404) {
                this.log("This crontask has not been registered yet, registering task: " + cronName);
                Homey.ManagerCron.registerTask(cronName, cronInterval, null)
                .then(task => {
                    task.on('run', () => this.fetchUVData());
                })
                .catch(err => {
                    this.log(`problem with registering crontask: ${err.message}`);
                });
            } else {
                this.log(`other cron error: ${err.message}`);
            }
        });
        
        console.log("register flow triggers");
		// register Flow triggers
        this._flowTriggerUVIndexChange = new Homey.FlowCardTriggerDevice('uvIndexChange').register();
        this._flowTriggerOzoneLevelChange = new Homey.FlowCardTriggerDevice('ozoneChange').register();

        console.log("\nregister flow conditions");
        // Register Flow conditions
		this.uvIndexStatus = new Homey.FlowCardCondition('measure_uv_index_cp').register().registerRunListener((args, state) => {
			var result = (this.getCapabilityValue('measure_uv_index_cp') > args.index);
			return Promise.resolve(result);
        });
        
        this.uvMaxStatus = new Homey.FlowCardCondition('measure_uv_max_cp').register().registerRunListener((args, state) => {
			var result = (this.getCapabilityValue('measure_uv_max_cp') > args.index);
			return Promise.resolve(result);
        });
        
        this.ozoneStatus = new Homey.FlowCardCondition('measure_ozone_cp').register().registerRunListener((args, state) => {
			var result = (this.getCapabilityValue('measure_ozone_cp') > args.du);
			return Promise.resolve(result);
        });
        
        this.st1Status = new Homey.FlowCardCondition('safe_exposure_time_st1_cp').register().registerRunListener((args, state) => {
			var result = (this.getCapabilityValue('safe_exposure_time_st1_cp') > args.minutes);
			return Promise.resolve(result);
        });
        
        this.st2Status = new Homey.FlowCardCondition('safe_exposure_time_st2_cp').register().registerRunListener((args, state) => {
			var result = (this.getCapabilityValue('safe_exposure_time_st2_cp')> args.minutes);
			return Promise.resolve(result);
        });
        
        this.st3Status = new Homey.FlowCardCondition('safe_exposure_time_st3_cp').register().registerRunListener((args, state) => {
			var result = (this.getCapabilityValue('safe_exposure_time_st3_cp') > args.minutes);
			return Promise.resolve(result);
        });
        
        this.st4Status = new Homey.FlowCardCondition('safe_exposure_time_st4_cp').register().registerRunListener((args, state) => {
			var result = (this.getCapabilityValue('safe_exposure_time_st4_cp') > args.minutes);
			return Promise.resolve(result);
        });
        
        this.st5Status = new Homey.FlowCardCondition('safe_exposure_time_st5_cp').register().registerRunListener((args, state) => {
			var result = (this.getCapabilityValue('safe_exposure_time_st5_cp') > args.minutes);
			return Promise.resolve(result);
        });
        
        this.st6Status = new Homey.FlowCardCondition('safe_exposure_time_st6_cp').register().registerRunListener((args, state) => {
			var result = (this.getCapabilityValue('safe_exposure_time_st6_cp') > args.minutes);
			return Promise.resolve(result);
        });

    }; // end onInit
    
    onAdded() {
        let id = this.getData().id;
        this.log('device added: ', id);

        this.fetchUVData()
        .catch( err => {
			this.error( err );
        });
        
        console.log("data fetched on add\n");
      
    }; // end onAdded
    
    async onSettings(oldSettingsObj, newSettingsObj, changedKeysArr) {
		if (changedKeysArr == 'offset') {
			this.log('Settings changed for UV Index offset from ' + oldSettingsObj.offset + ' to ' + newSettingsObj.offset) + '. Fetching UV data.';
            this.fetchUVData()
            .catch( err => {
                this.error( err );
            });
        console.log("data fetched on settings\n");
        };
        
        if (changedKeysArr == 'xaccesstoken') {
            this.log('Settings changed for OpenUV API Key from ' + oldSettingsObj.xaccesstoken + ' to ' + newSettingsObj.xaccesstoken) + '. Fetching UV data.';
            this.fetchUVData()
            .catch( err => {
                this.error( err );
            });
        console.log("data fetched on settings\n");
		};

    }; // end onSettings

    async fetchUVData() {

        console.log("defining fetch data");

        // get current settings
		let settings = this.getSettings();
        let offset = parseInt(settings.offset);
        let xaccesstoken = settings.xaccesstoken;
        let device = this;
        
        // defining variables
        console.log("Collecting geolocation coordinates for this Homey");
        const lat = (Homey.ManagerGeolocation.getLatitude()).toString().slice(0,9);
        const lng = (Homey.ManagerGeolocation.getLongitude()).toString().slice(0,9);
        console.log("latitude:",lat,", longitude:",lng,"\n");
             
        let dt = new Date();
        dt.setHours( dt.getHours() + offset );
        let url = "https://api.openuv.io/api/v1/uv?lat="+lat+"&lng="+lng+"&dt="+dt;
       
        console.log(url);
        console.log("fetching data\n");

        let uvdata = await fetch(url, {
            method: "GET",
            headers: {
                'content-type': 'application/json',
                "x-access-token": xaccesstoken
            }
        })
        .catch( err => {
			this.error( err );
        });
        
        let uvinfo = await uvdata.json();
        
		var month = [];
		month[0] = "January";
		month[1] = "February";
		month[2] = "March";
		month[3] = "April";
		month[4] = "May";
		month[5] = "June";
		month[6] = "July";
		month[7] = "August";
		month[8] = "September";
		month[9] = "October";
		month[10] = "November";
        month[11] = "December";
        
        let uv_index = uvinfo.result.uv;
        let uv_time_O = new Date(uvinfo.result.uv_time);
        var uv_time_M = month[uv_time_O.getMonth()];
        let uv_time = (uv_time_M+" "+uv_time_O.getDate()+" "+(uv_time_O.toLocaleTimeString().slice(0,-3)));
        
        let uv_max = uvinfo.result.uv_max;
        let uv_max_time_O = new Date(uvinfo.result.uv_max_time);
        var uv_max_time_M = month[uv_max_time_O.getMonth()];
        let uv_max_time = (uv_max_time_M+" "+uv_max_time_O.getDate()+" "+(uv_max_time_O.toLocaleTimeString().slice(0,-3)));

        let ozone_level = uvinfo.result.ozone;
        let ozone_time_O = new Date(uvinfo.result.ozone_time);
        var ozone_time_M = month[ozone_time_O.getMonth()];
        let ozone_time = (ozone_time_M+" "+ozone_time_O.getDate()+" "+(ozone_time_O.toLocaleTimeString().slice(0,-3)));

        let st_1 = uvinfo.result.safe_exposure_time.st1;
        if (st_1 == null) {st_1 = 0} else {st_1 = parseInt(st_1)};
        let st_2 = uvinfo.result.safe_exposure_time.st2;
        if (st_2 == null) {st_2 = 0} else {st_2 = parseInt(st_2)};
        let st_3 = uvinfo.result.safe_exposure_time.st3;
        if (st_3 == null) {st_3 = 0} else {st_3 = parseInt(st_3)};
        let st_4 = uvinfo.result.safe_exposure_time.st4;
        if (st_4 == null) {st_4 = 0} else {st_4 = parseInt(st_4)};
        let st_5 = uvinfo.result.safe_exposure_time.st5;
        if (st_5 == null) {st_5 = 0} else {st_5 = parseInt(st_5)};
        let st_6 = uvinfo.result.safe_exposure_time.st6;
        if (st_6 == null) {st_6 = 0} else {st_6 = parseInt(st_6)};

        console.log("uv_index="+uv_index+"\n");

        // setting device capabilities
        this.setCapabilityValue('measure_uv_index_cp', uv_index);
        this.setCapabilityValue('uv_time_cp', uv_time);
        this.setCapabilityValue('measure_uv_max_cp', uv_max);
        this.setCapabilityValue('uv_max_time_cp', uv_max_time);
        this.setCapabilityValue('measure_ozone_cp', ozone_level);
        this.setCapabilityValue('ozone_time_cp', ozone_time);
        this.setCapabilityValue('safe_exposure_time_st1_cp', st_1);
        this.setCapabilityValue('safe_exposure_time_st2_cp', st_2);
        this.setCapabilityValue('safe_exposure_time_st3_cp', st_3);
        this.setCapabilityValue('safe_exposure_time_st4_cp', st_4);
        this.setCapabilityValue('safe_exposure_time_st5_cp', st_5);
        this.setCapabilityValue('safe_exposure_time_st6_cp', st_6);

        console.log("done setting device capabilities");

        // updatingFlowTriggers
		if (this.getCapabilityValue('measure_uv_index_cp') != uv_index) {
			let state = {"measure_uv_index_cp": uv_index};
			let tokens = {"measure_uv_index_cp": uv_index};
			this._flowTriggerUVIndexChange.trigger(device, tokens, state).catch(this.error)
        };
        
        if (this.getCapabilityValue('measure_ozone_cp') != ozone_level) {
			let state = {"measure_ozone_cp": ozone_level};
			let tokens = {"measure_ozone_cp": ozone_level};
			this._flowTriggerOzoneLevelChange.trigger(device, tokens, state).catch(this.error)
		};
        
        console.log("done updating flow triggers");

    };

    onDeleted() {
        let id = this.getData().id;
        this.log('device deleted:', id);
        
        //Unregister crontask on unload
        Homey.on('unload', () => {
            Homey.ManagerCron.unregisterTask(cronName);
        });
    
    }; // end onDeleted

};

module.exports = OpenUVDevice;