'use strict';
//
//  utils.js
//  handle common
//
//  Created by dientn on 2017-03-17.
//
let request = require('request'),
    _ = require('lodash'),
    geo_api_url = process.env.GEO_API_URL,
    geo_username= process.env.GEO_USER;
//    geo_api_url = process.env.GEO_API_URL,
//    geo_username= process.env.GEO_USER;

exports.getCityCodeFromLocation = (location)=>{
    return new Promise((resolve, reject)=>{
        request.get({url: `${geo_api_url}countrySubdivisionJSON`, qs :{
            lat: location.lat,
            lng: location.long,
            username: geo_username
        }}, (error, response, body) => {

            if (error) {
                console.log('Error sending message: ', error);
                return reject(error);
            } else {
                if(typeof body === 'string'){
                    body = JSON.parse(body);
                }
                var code = _.find(body.codes, ['type', 'ISO3166-2']);
                return resolve( code );
            }
        });
    });
};
