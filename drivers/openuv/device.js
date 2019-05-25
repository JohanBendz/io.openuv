'use strict';

const Homey = require('./node_modules/homey');
const fetch = require('./node_modules/node-fetch');

/* //Set Cron parameters
const cronName = "openUVCronTask"
const cronInterval = "30 5,7,8,9,10,11,12,13,14,15,16,17,18,19,21 * * *"; // = every day, 5:30, 7:30..every half hour...19:30 and 21:30. */

class OpenUVDevice extends Homey.Device {

    onInit() {
        this.log('OpenUV device initiated');

/* 		//Register crontask
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
        }); */

		// register Flow triggers
        this._flowTriggerUVIndexChange = new Homey.FlowCardTriggerDevice('uvIndexChange').register();
        this._flowTriggerOzoneLevelChange = new Homey.FlowCardTriggerDevice('ozoneChange').register();
        
        // Register Flow conditions
		this.uvIndexStatus = new Homey.FlowCardCondition('measure_uv_index_cp').register().registerRunListener((args, state) => {
			var result = (uv_index > args.index);
			return Promise.resolve(result);
        });
        
        this.uvMaxStatus = new Homey.FlowCardCondition('measure_uv_max_cp').register().registerRunListener((args, state) => {
			var result = (uv_max > args.index);
			return Promise.resolve(result);
        });
        
        this.ozoneStatus = new Homey.FlowCardCondition('measure_ozone_cp').register().registerRunListener((args, state) => {
			var result = (ozone_level > args.du);
			return Promise.resolve(result);
        });
        
        this.st1Status = new Homey.FlowCardCondition('safe_exposure_time_st1_cp').register().registerRunListener((args, state) => {
			var result = (st_1 > args.minutes);
			return Promise.resolve(result);
        });
        
        this.st2Status = new Homey.FlowCardCondition('safe_exposure_time_st2_cp').register().registerRunListener((args, state) => {
			var result = (st_2 > args.minutes);
			return Promise.resolve(result);
        });
        
        this.st3Status = new Homey.FlowCardCondition('safe_exposure_time_st3_cp').register().registerRunListener((args, state) => {
			var result = (st_3 > args.minutes);
			return Promise.resolve(result);
        });
        
        this.st4Status = new Homey.FlowCardCondition('safe_exposure_time_st4_cp').register().registerRunListener((args, state) => {
			var result = (st_4 > args.minutes);
			return Promise.resolve(result);
        });
        
        this.st5Status = new Homey.FlowCardCondition('safe_exposure_time_st5_cp').register().registerRunListener((args, state) => {
			var result = (st_5 > args.minutes);
			return Promise.resolve(result);
        });
        
        this.st6Status = new Homey.FlowCardCondition('safe_exposure_time_st6_cp').register().registerRunListener((args, state) => {
			var result = (st_6 > args.minutes);
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
      
    }; // end onAdded
    
    async onSettings(oldSettingsObj, newSettingsObj, changedKeysArr) {
		if (changedKeysArr == 'uvTime') {
			this.log('Settings changed for UV Index time from ' + oldSettingsObj.XYZ + ' to ' + newSettingsObj.XYZ) + '. Fetching UV data.';
			this.fetchUVData();
		}

    }; // end onSettings

    async fetchUVData() {

        // get current settings
		let settings = this.getSettings();
        let offset = parseInt(settings.offset);

        // defining variables
        console.log("Collecting geolocation coordinates for this Homey");
        const lat = (Homey.ManagerGeolocation.getLatitude()).toString().slice(0,9);
        const lng = (Homey.ManagerGeolocation.getLongitude()).toString().slice(0,9);
        console.log("latitude:",lat,", longitude:",lng,"\n");
        
        let xaccesstoken = "5ff05db31b3d6822b5174f7dd0ffe425";
        
        let dt = new Date();
        dt.setHours( dt.getHours() + offset );
        let url = "https://api.openuv.io/api/v1/uv?lat="+lat+"&lng="+lng+"&dt="+dt;

        uvinfo = await fetch(url, {
            method: "GET",
            body: JSON.stringify(data),
            headers: {
                "x-access-token": xaccesstoken
            }
        }).json();
        
        let uv_index = uvinfo.result.uv;
        let uv_time = uvinfo.result.uv_time;
        let uv_max = uvinfo.result.uv_max;
        let uv_max_time = uvinfo.result.uv_max_time;
        let ozone_level = uvinfo.result.ozone;
        let ozone_time = uvinfo.result.ozone_time;
        let st_1 = uvinfo.result.safe_exposure_time.st1;
        let st_2 = uvinfo.result.safe_exposure_time.st2;
        let st_3 = uvinfo.result.safe_exposure_time.st3;
        let st_4 = uvinfo.result.safe_exposure_time.st4;
        let st_5 = uvinfo.result.safe_exposure_time.st5;
        let st_6 = uvinfo.result.safe_exposure_time.st6;

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

    };

    onDeleted() {
        let id = this.getData().id;
        this.log('device deleted:', id);
        
        //Unregister crontask on unload
        Homey.on('unload', () => {
            Homey.ManagerCron.unregisterTask(cronName);
        });
    
    }; // end onDeleted

    // flow triggers
    trigger_UV_Index_Change_Flow(device, tokens, state) {
    this._flowTriggerUVIndexChange
        .trigger(device, tokens, state)
        .then(this.log)
        .catch(this.error)
    };

    trigger_Ozone_Level_Change_Flow(device, tokens, state) {
        this._flowTriggerOzoneLevelChange
            .trigger(device, tokens, state)
            .then(this.log)
            .catch(this.error)
        };

};

module.exports = OpenUVDevice;