'use strict';
//
//  redis.cache.js
//  lib for caching mongoose query data by redis
//
//  Created by dientn on 2016-01-21.
//  Copyright 2015 Fireflyinnov. All rights reserved.
//

/**
 * Module dependencies.
 */
let _ = require('lodash'),
    messenger = require('./messenger'),
    request = require('request'),
    redis = require('./redis');


// TUTN Save  sender state 
// State  = 1 : Just First Hi & lanague 

// State  = 2 : Wrong Code   

// State  = 5  : Hi & Mobile 
// State  = 6 : Sending Code to Mobile 
// State  = 7 : Code Wait  & Validate  

// State  = 11 : Code OK 


/* @param update : {
    stateValue value of state
    stateText state name
    langId language id
}

*/
exports.setSenderState   = (sender, update,  handler )=>{
    let key = `sender_state_${sender}`;

    redis.get( key , (err, state)=>{
        if(err){
             console.log(`get redis error key[sender_state_${sender}]`, err);
             state = update;
        }else{
            state = state || {};
            state = Object.assign(state, update);
        }

        redis.set(key,  state  , (err, success)=>{
            if(err) console.log("err", err);
            if(success){
                console.log("Redis success :: Set State  :: ", state );

                if (handler) handler(state);

                redis.expire(key, 7 * 24* 3600, (errExpired, resultExpired)=>{// Expired time is 7 day
                    if(errExpired) console.log("err", errExpired);
                });
            }
        });
    });
};

exports.updateSenderState   = (sender, update,  handler )=>{
    let key = `sender_state_${sender}`;

    redis.get( key , (err, state)=>{
        if(err){
             console.log(`get redis error key[sender_state_${sender}]`, err);
             state = update;
        }else{
            state = state || {};
            state = Object.assign(state, update);
        }

        redis.set(key,  state  , (err, success)=>{
            if(err) console.log("err", err);
            if(success){
                console.log("Redis success :: Set State  :: ", state );

                if (handler) handler(state);
            }
        });
    });
};


// TUTN check sender state 
// See updateSenderState
exports.getSenderState = (sender, handler)=>{

    let key = `sender_state_${sender}`;

    let returnState = { stateValue :  -99 , stateText : 'Error in Cached' } ;

    redis.get( key , (err, state)=>{
        if(err){
             console.log(`get redis error key[sender_state_${sender}]`, err);
             if (handler)  handler( returnState ) ; 
        }else{ 
             console.log("Redis:: get State  :: ", state );
             if (handler)  handler( state ) 
        }
    });

};

// set CarTypesState
exports.setCarTypeState   = (city_code, carTypes, handler)=>{
    let key = `car_types_by_city_${city_code}`;
    redis.set(key,  carTypes  , (err, success)=>{
        if(err) console.log("err", err);
        if(success){
            console.log("Redis success :: Set CarTypes  :: ");

            if (handler) handler(state);

            redis.expire(key, 1 * 24* 3600, (errExpired, resultExpired)=>{// Expired time is 1 day
                if(errExpired) console.log("err", errExpired);
            });
        }
    });
};

// set CarTypesState
exports.updateCarTypeState   = (city_code, carTypes, handler)=>{
    let key = `car_types_by_city_${city_code}`;
    redis.get( key , (err, state)=>{
        if(err){
             console.log(`get redis error ${key}`, err);
             if (handler)  handler( returnState ) ;
        }else{
            if(state){// megge
                carTypes = _.uniqBy(carTypes, state, 'id');
            }

            redis.set(key,  carTypes  , (err, success)=>{
                if(err) console.log("err", err);
                if(success){
                    console.log("Redis success :: Set CarTypes  :: ");

                    if (handler) handler(state);

                    redis.expire(key, 1 * 24 * 3600, (errExpired, resultExpired)=>{
                        if(errExpired) console.log("err", errExpired);
                    });
                }
            });
        }
    });

};

// get CarTypes By City  
exports.getCarTypeState = (city_code , handler)=>{

    let key = `car_types_by_city_${city_code}`;

    let returnState = null ;

    redis.get( key , (err, state)=>{
        if(err){
             console.log(`get redis error ${key}`, err);
             if (handler)  handler( returnState ) ;
        }else{
             console.log("Redis:: get Cartype   :: ", state );
             if (handler)  handler( state )
        }
    });
};



exports.checkSender = (sender)=>{
    redis.get(`sender_session_${sender}`,(err, session)=>{
        if(err){
             console.log(`get redis error key[sender_session_${sender}]`, err);
            return 0;
        }
        return session? 1: 0;
    });
};

//DIENT:  OK
exports.setMobileCode =(sender, code, mobile)=>{
    let key = `sender_code_${sender}`;
    redis.set(key, {code: code, mobile: mobile}, (err, success)=>{
        if(err){} console.log("err", err);
        if(success){
            redis.expire(key, 0.1* 3600, (errExpired, resultExpired)=>{
                if(errExpired){} console.log("err", errExpired);
            });
        }
    });
};


//DIENTN:  OK
exports.validateMobileCode =(sender, code, handler )=>{
    let key = `sender_code_${sender}`;
    redis.get(key, (err, session)=>{
        if(err || !session){
            console.log(`get redis error key[sender_session_${sender}]`, err);
            if (handler)  handler(false,  session );
        }else if(session.code == code){
            
            if (handler)  handler(true ,  session );
            
            redis.del(key , (errDel, success)=>{
                if(errDel) console.log(`delete redis err with key[${key}]`, errDel);
            });
        
        }else{

            if (handler)  handler(false ,  session );

        }
    });
};

//DIENTN:  OK
exports.setIsBooking =(sender, ticket_id, brand_id, address  )=>{
    let key = `sender_booking_${sender}`;
    let booking_value = {
            ticket_id : ticket_id , 
            brand_id : brand_id , 
            address: address
        };


    redis.set(key, booking_value , (err, success)=>{
        if(err){} console.log("err", err);
        if(success){
            redis.expire(key, 24 * 3600 , (errExpired, resultExpired)=>{
                if(errExpired){} console.log("err", errExpired);
            });
        }
    });
};

exports.hasBooking =(sender, handler)=>{
    let key = `sender_booking_${sender}`;
    redis.get(key, (err, booking_value)=>{
        if(err){
             console.log(`get redis error key[sender_booking_${sender}]`, err);
             if (handler)  handler( null  ) ;
        }else{
             console.log("Redis:: get is booking  :: ", booking_value );
             if (handler)  handler( booking_value )
        }
    });
};

//TUTN: added May10
exports.clearBooking =(sender)=>{
    let key = `sender_booking_${sender}`;
    redis.del(key, (err, booking_value)=>{
        if(err){
             console.log(`del redis error key[sender_booking_${sender}]`, err);
        }else{
             console.log(`del redis OK  key[sender_booking_${sender}]`, booking_value);
        }
    });
};
