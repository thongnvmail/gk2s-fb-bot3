"use strict";

let request = require('request'),
    redis = require('./redis'),
    FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN;

exports.send = (message, recipient, callback) => {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: FB_PAGE_TOKEN},
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        json: {
            recipient: {id: recipient},
            message: message
        }
    }, (error, response) => {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
        if(callback){
            callback(error, response);
        }
    });
};

exports.send_action  = (sender_action , recipient, callback) => {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: FB_PAGE_TOKEN},
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        json: {
            recipient: {id: recipient},
            sender_action: sender_action
        }
    }, (error, response) => {
        if (error) {
            console.log('Error sending action: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
        if(callback){
            callback(error, response);
        }
    });
};

exports.getUserInfo = (userId) => {

    return new Promise((resolve, reject) => {

        request({
            url: `https://graph.facebook.com/v2.6/${userId}`,
            qs: {fields:"first_name,last_name,profile_pic", access_token: FB_PAGE_TOKEN},
            method: 'GET',
        }, (error, response) => {
            if (error) {
                console.log('Error sending message: ', error);
                reject(error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            } else {
                resolve(JSON.parse(response.body));
            }
        });

    });
};
