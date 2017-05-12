'use strict';
//
//  operating.js
//  handle operating api logic
//
//  Created by dientn on 2017-03-17.
//

//Module depenendcy
let request = require('request'),
    _ = require('lodash'),
    url = process.env.OP_API_URL;


//BOOK CAR to TicketLog System 



let createTicket = (data)=>{
    return new Promise((resolve, reject)=>{
        var body = {
            channel:1,
            data:  data
        };

        var options = {
            url: url,
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        };

        request.post(options, (error, response, body) => {
            if (error) {
                console.log('Error sending message: ', error);
                return reject(error);
            } else{
                return resolve(body);
            }
        });
    });
};



exports.createTicket = createTicket;
