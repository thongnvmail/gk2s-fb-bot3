"use strict";

let logo_image_url = process.env.LOGO_IMAGE_URL;



let moment = require("moment"),
    numeral = require("numeral");


//by TNT 2017-01
exports.formatWelcome  = favouriteLocations  => {
    let elements = [];
    var btns = [];
    if(favouriteLocations && Array.isArray(favouriteLocations)){
        favouriteLocations.forEach(item=>{

            if (item.location && item.location.long ){
                btns.push({
                    "type": "postback",
                    "title": item.address,
                    "payload": `rebook,${item.location.long } ,${item.location.lat } ,${encodeURIComponent(item.address)},${+moment()}`
                });
            }
        });
    }
    if (btns.length == 0 ) {
            btns.push({
                "type": "postback",
                "title": "Tiếng Việt",
                "payload": "language, vi"
            });
            btns.push({
                "type": "postback",
                "title": "English",
                "payload": "language, en"
            });
    }


    elements.push({
        title: __('WELLCOME_CHAT'),
        subtitle: __('SELECT_LOCATION'),
        "image_url": logo_image_url,
        "buttons": btns
    });


    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": elements
            }
        }
    };
};

//by TNT 2017-05 
exports.formatReSend  = ()  => {
    let elements = [];
    var btns = [{
        "type": "postback",
        "title": __('CHANGE_PHONE_NO'),
        "payload": `change_phone_no,${ +moment()}`
    }];


    elements.push({
        title: __('SMS_CHECK_MSG'),
        subtitle: __('SEND_SMS_RERTY'),
        "buttons": btns
    });

    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": elements
            }
        }
    };
};


//by TNT 2017-01
exports.formatHiLanagues    = (firstName, nextStep)    => {
    let elements = [];
    elements.push({
        title: `Welcome ${firstName} `,
        subtitle: `Xin chọn ngôn ngữ:           \n Please select the language: `,
        "image_url": logo_image_url,
        "buttons":[
            {
                "type": "postback",
                "title": "Tiếng Việt",
                "payload": "language, vi"
            },
            {
                "type": "postback",
                "title": "English",
                "payload": "language, en"
            },
        ]
    });

    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": elements
            }
        }
    };
};

exports.formatScheduleBooking  =  ( car_productcode , car_product_type__c ) => {
    // var time1 = moment().utcOffset(7).locale(getLocale());
    // var time2 = moment().utcOffset(7).locale(getLocale());
    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": __('SELECT_TIME'),
                "buttons": [
                    {
                        "type": "postback",
                        "title": __('SELECT_TIME1'),
                        "payload": `book_now,1 ,${car_productcode} ,${car_product_type__c},${+moment()}`
                    },
                    {
                        "type": "postback",
                        "title": __('SELECT_TIME2'),
                        "payload": `book_now,2,${car_productcode}  ,${car_product_type__c},${+moment()}`
                    },
                    {
                        "type": "postback",
                        "title": __('CONTACT_ME'),
                        "payload": `book_now,3 ,${car_productcode}  ,${car_product_type__c},${+moment()}`
                    }
                ]
            }
        }
    };
};



exports.formatCarTypes = carTypes => {
    let elements = [];
    if(carTypes.length == 0){
        return {text: __('NOT_FOUND_CAR')};
    }
    carTypes.forEach(car => {
        if(car._fields){
            car = car._fields;
        }

        // console.log(car.Product_Type__c, car.name );

            elements.push({
                title: car.name,
                subtitle: car.description  ,
                "image_url": car.product_image__c,
                "buttons":[
                    {
                        "type": "postback",
                        "title": __('CONTACT_ME'),
                        "payload": `book_now,3,${car.productcode}, ${car.product_type__c},${+moment()}`
                    },
                    {
                        "type": "postback",
                        "title": __('SELECT_TIME1'),
                        "payload": `book_now,1,${car.productcode}, ${car.product_type__c},${+moment()}`
                    },
                    {
                        "type": "postback",
                        "title": __('BOOK_NOW'),
                        "payload": `book_now,0,${car.productcode}, ${car.product_type__c},${+moment()}`
                    },
                    // {
                    //     "type": "postback",
                    //     "title": __('SCHEDULE'),
                    //     "payload": `book_schedule, ${car.productcode}, ${car.product_type__c},${+moment()}`
                    // },
                ]
            })
        }
    );
    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": elements
            }
        }
    };
};


exports.informBookingState = (code,  vehicle_plate , ticket_id, address  )  => {
    let elements = [];
    let title = __('RECEIPT_ACEPTED');
    let subtitle =  __('SEE_YOU_AGAIN'); 
    let image_url = __('ACCEPTED_IMG');
    let payload_cmd = 'cancel'; 




    if(code == '0'){
        // XIN LÔI KO CÓ XE NHẬN & THOÁT CUỐC 
        title = __('RECEIPT_SORRY'); 
        image_url = __('SORRY_IMG');
        payload_cmd = "do_nothing";


    } else if(code == '-1'){
        // Có xe nhận chưa rõ loại xe.
        subtitle =  `Racing to ${address || "you now." }`;
    

    } else if(code  == '-2'){
        // XIN LÔI KO CÓ XE NHẬN & THOÁT CUỐC 
        title = __('RECEIPT_SORRY2'); 
        image_url = __('SORRY_IMG');
        payload_cmd = "do_nothing";

    } else if(code == '-9'){
        // Đã nhận khách và thoát. 

        title = __('RECEIPT_THANK_YOU'); 
        image_url = logo_image_url;
        payload_cmd = "do_nothing";

    } else if(code  == '-5'){
        // Đã gửi Booking chờ confirm 


        title = __('BOOK_NOW_MSG'); 
        image_url = __('BOOKING_IMG');        
        subtitle =  `  ${address || "" }`;


    }else{ 
        // Có xe nhận cụ thể. 

        subtitle =  `${subtitle} \n CAR : ${vehicle_plate }  ( No. ${code} ) `;
    }


    elements.push({
        title: title,
        subtitle: subtitle,
        image_url: image_url,  
        "buttons": [
            {
                "type": "postback",
                "title": __('CANCEL_BOOKING'),
                "payload": payload_cmd + "," + ticket_id
            },
        ]
    });



    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": elements
            }
        }
    };
};



exports.formatBookingProcessing  = (subtile_msg, ticket_id  )  => {
    let elements = [];
    elements.push({
        title:   __('BOOK_NOW_MSG'),
        subtitle: subtile_msg,
        image_url: __('BOOKING_IMG'),  
        "buttons": [
            {
                "type": "postback",
                "title": __('CANCEL_BOOKING'),
                "payload": "cancel," +  ticket_id
            },
        ]
    });

    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": elements
            }
        }
    };
};

