"use strict";

let messenger = require('./messenger'),
    url = require('url'),
    formatter = require('./formatter'),
    redis = require('./redis'),
    redisCache = require('./redis.cache'),
    _ = require('lodash'),
    utils = require('./utils'),
    smsApi = require('./sms-api');
    
let salesforce = require('./salesforce');


//OK 
let hiMobile   = (sender, senderState )  => {
    
    messenger.send({text: __('HELP_FIRST_MSG')}, sender, ()=>{
        redisCache.updateSenderState(sender, {stateValue: 5 , stateText: " Mobile wait : "});
    });
};

//OK 
let hiLanguage = (sender, senderState)=>{
    if(!senderState ){
         messenger.getUserInfo(sender).then(response => {
            response.stateValue = 2 ;
            response.stateText = "Select languagues "
            messenger.send(formatter.formatHiLanagues(response.first_name), sender);//, ()=> {
            redisCache.updateSenderState(sender, response);
//            });
         });
    }else{
        messenger.send(formatter.formatHiLanagues(senderState.name), sender);
    }
}

//OK

let sendCodeToMobile = (sender, mobile)=>{
    
    //TODO: Validate Right Mobile Phone
    let rex =new RegExp(/^[0-9\-\+]{9,15}$/);
    if(!rex.test(mobile)){
        messenger.send({text: __('RERTY_SEND_PHONE')}, sender, ()=> {});
        return;
    }
    let code = _.random(1000,9999);

    messenger.send({text: `${__('SMS_AUTHORIE')} ${mobile} .... `}, sender, ()=> {
        //TODO sending Code : 
        redisCache.setMobileCode(sender, code, mobile);
        smsApi.send(mobile, `${__('MSG_SMS')} ${code}`).then(result=>{
            if(result){
                messenger.send({text: __('SMS_CHECK_MSG')}, sender, ()=> {});
                redisCache.updateSenderState(sender,{ stateValue: 6, mobile: mobile,stateText: `Send code ${code} to mobile ${mobile} successfull `});
            }else{
                messenger.send({text: __('SEND_SMS_RERTY')}, sender, ()=> {});
            }
        }).catch(err=>{
            console.log("Send code to mobile fail", JSON.stringify(err));
        });
    });
};

// validate code form from mobile
let validateMobileCode  = (sender, code, state)=>{
    // check code
    redisCache.validateMobileCode(sender, code , (result, mobileSession) => {
        if (result){
            messenger.send({text: __('VALIDATE_CODE_SUCCESS')}, sender);
            let contact = Object.assign(state, mobileSession);
            //contact.fb_id = sender;
            state = Object.assign(state, {stateValue: 11 ,stateText: 'Right code !'});
            redisCache.updateSenderState(sender, state);

            salesforce.createContact(contact).then((result)=>{
                state = Object.assign(state, result._fields);
                redisCache.updateSenderState(sender, state);
            }).catch((err)=>{
                redisCache.updateSenderState(sender, state);
                console.error("Save contact to saleforce fail:",JSON.stringify(err));
            });

            sayHi(sender, state);
        }else {
            messenger.send({text: __('VALIDATE_CODE_FAIL')}, sender);
            redisCache.updateSenderState(sender,{stateValue: 6  , stateText: 'Wrong code  & Retry :'});
            messenger.send(formatter.formatReSend(), sender);

            // , ()=> {
            //     redisCache.updateSenderState(sender, response);
            // });

        }
    });
};

// Change Favourite Location
let sayHi = (sender, state) => {

    if (state && (state.stateValue >= 10 )) {

        exports.showBookingProccessing( sender,  ticket_id => { 
            if (! ticket_id) {
                var favouriteLocations = state.hist;
                messenger.send(formatter.formatWelcome(favouriteLocations), sender, ()=> {
                    messenger.send({
                        text: __('PRESS_LOCATION_MSG'),
                        "quick_replies":[
                          {
                            "content_type":"location",
                          }
                        ]
                    }, sender);
                });
            }
        });
    }else{

        exports.messageProccessing(sender, state, "");  

    }
};


exports.findCarFromCache = ( city_code, callback)=>{

    redisCache.getCarTypeState(city_code, results=>{

        if(!results || !Array.isArray(results)){
            return callback(null);
        }

        var cars = results.filter(item=>{
            return item.city_code__c.indexOf(city_code) != -1;
        });
        return callback(cars);
    });
};
//OK 


exports.showBookingProccessing = (sender,  callback) => {


    redisCache.hasBooking(sender, booking_value  =>{ // check has booked
        if(booking_value){
            messenger.send({text: __("HAS_BOOKED")}, sender ,()=>{

                messenger.send(formatter.informBookingState( '-5', 'Searching', booking_value.ticket_id, booking_value.address ) , sender) ;

            });
            
            if (callback)  callback( booking_value ) ;
        }else{
            
            if (callback)  callback( null  ) ;
        }
    });


};

exports.messageProccessing = (sender, senderState , message , handler) => {
    console.log('Sender State :  ' ,  senderState ) ;
    senderState.mobile = senderState.mobile || senderState.mobilephone ;

    if (  ! senderState  ||    Number(senderState.stateValue)   < 10 ||  ! senderState.mobile ) {

        //console.log(' Number(senderState.stateValue)   < 10  ',  Number(senderState.stateValue)   ) ;


        //  FIRST TRANSACTION             
        if ( ! senderState ||   senderState.stateValue < 2) {
            console.log('Not Authorized yet - so Hi First ') ;
            hiLanguage(sender);

        }else if ( senderState.stateValue  < 5  ) {
            console.log('Hi & Mobile : ') ;
            hiMobile(sender, senderState );

        }else if (senderState.stateValue == 5  || !  senderState.mobile ) {
            console.log('Get Mobile phone & sendcode :  ') ;
            sendCodeToMobile(sender, message);

        }else if (senderState.stateValue == 6) {
            console.log('Validate Code :  ') ;
            validateMobileCode(sender,message, senderState);
        }
    } 

    else {
        console.log("state", senderState);
        if(!senderState.langId){
            hiLanguage(sender, senderState);
        }else{
            sayHi(sender, senderState);
        }
    }
};

//TODO: Cached 
exports.searchCarType = (sender, location, address) => {
    messenger.send({text: __('SEARCH_CAR')}, sender);

    if(_.isString(location)){
        //add to Cached 
        //addHistLocationToCache(sender, {address: address, city_code: location});


        exports.findCarFromCache(location, results=>{
            if(!results){
                salesforce.findCarTypes({CityCode: location}).then(carSearchResult => {
                    redisCache.updateCarTypeState(location , carSearchResult);
                    messenger.send(formatter.formatCarTypes(carSearchResult), sender);
                });
            }else{
                messenger.send(formatter.formatCarTypes(results), sender);
            }
        });
    }
    else{
        utils.getCityCodeFromLocation(location).then(city=>{
            // add location to hist
            //addHistLocationToCache(sender, {address: address, city_code: city.code});

            exports.findCarFromCache( city.code, results=>{
                if(!results){
                    salesforce.findCarTypes({CityCode: city.code}).then(carSearchResult => {
                        redisCache.updateCarTypeState(city.code, carSearchResult);
                        messenger.send(formatter.formatCarTypes(carSearchResult), sender);
                    });
                }else{
                    messenger.send(formatter.formatCarTypes(results), sender);
                }
            });
        });
    }

};

//OK 
exports.recivedLocation = ( payload, sender)=>{
    var parseObject = url.parse(payload.url, true);
    var address = payload.title;
    if(parseObject.query.u){
        var parseObject2 = url.parse(parseObject.query.u, true);
        address =`${address} - ${parseObject2.query.where1}`;
//        redisCache.updateSenderState(sender, {address: address, location: payload.location});
    }

    //console.log("Cancel  body", JSON.stringify(payload));
        


    redisCache.updateSenderState(sender, {address: address, location: payload.location});
    addHistLocationToCache(sender, {address: address, location: payload.location});

    exports.searchCarType(sender, payload.location, address);
};






let addHistLocationToCache = (sender, hist)=>{
    redisCache.getSenderState(sender, results=>{
        if(!results || !  results.hist){
            redisCache.updateSenderState(sender, {hist: [hist]});
            return;
        }

        var newHist = results.hist; // _.takeRight(results.hist);
        newHist.push(hist);
        while  ( newHist.length > 3 ) {
            newHist.shift();
        } 
        redisCache.updateSenderState(sender, {hist: newHist});

        //console.log("newHist",JSON.stringify(newHist));

    });
};




//OK 
exports.checkContactByFacebookSender   = (sender, handler) => {

    let returnState = { stateValue :  -99 , stateText : 'Not Cached' } ;
    
    redisCache.getSenderState(sender , (state) => {

        console.log(' cached :', state );
        if( ! state || state.stateValue  < 0   ){
            //not found in REDIS

            console.log('Not cached , checkin Salesforce', sender);
            messenger.getUserInfo(sender).then(response => {
                salesforce.findContact({FacebookId : response.profile_pic } ).then(contactsFound  => {
                    if (contactsFound.length == 0 ){
                        if (handler)  handler(returnState);
                    }else{

                        console.log('Found in Salesforce:', contactsFound[0] );

                        var contact = contactsFound[0];
                        console.log("Search result : " + contact.get("MobilePhone"));

                        //Found & save State > 10
                        state = Object.assign(contact._fields, { stateValue: 11, stateText: 'Found contact in SF'});
                        state.langId = state.langid__cc? state.langid__cc: 'en';
                        redisCache.setSenderState(sender, state, (new_state) => {
                            if (handler)  handler(new_state);
                        } );
                    }
                });
            });
        } else{
            if (handler)  handler(state);
        }
    });
};


exports.informAccepted  = (sender, driverInfo)=>{

    let driver_code = driverInfo.driver_code || '-5';
    let vehicle_plate = driverInfo.vehicle_plate || "";
    let ticket_id = driverInfo.ticket_id || "-5";

    redisCache.hasBooking(sender, booking_value  =>{ // check has booked
        if (booking_value) {
            messenger.send(formatter.informBookingState(driver_code,  vehicle_plate , ticket_id, booking_value.address ), sender);
        }else {
            messenger.send(formatter.informBookingState(driver_code,  vehicle_plate , ticket_id, 'Address?' ), sender);
        }
    
        if (driver_code  == '0' || driver_code = '-2'  || driver_code = '-9'){

                redisCache.clearBooking(sender);

        }
    }); 



};


exports.help = (sender) => {
    messenger.send({text: __('HELP')}, sender);
};




exports.hiMessage = sayHi;
