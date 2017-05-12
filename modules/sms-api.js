'use strict';
//
//  sms-api.js
//  handle sms api logic
//
//  Created by dientn on 2017-03-17.
//

//Module depenendcy

let request = require('request'),
    xmlParseString = require('xml2js').parseString,
    _ = require('lodash'),
    sms_url = process.env.SMS_URL,
    sms_api_key = process.env.SMS_API_KEY,
    sms_secret_key = process.env.SMS_SECRET_KEY,
    sms_type = process.env.SMS_TYPE;

exports.send = (mobile, content)=>{
    return new Promise((resolve, reject)=>{
        request.get({url: sms_url, qs :{
            Phone: mobile,
            Content: content,
            ApiKey: sms_api_key,
            SecretKey: sms_secret_key,
            SmsType: sms_type
        }}, (error, response, body) => {

            if (error) {
                console.log('Error sending message: ', error);
                return reject(error);
            } else {
                xmlParseString(body,  (err, result)=>{
                    console.log("APi Send code to mobile result", JSON.stringify(result));
                    return resolve((result.SmsResultModel.CodeResult || {}) == 100);
                });
            }
        });
    });
};
