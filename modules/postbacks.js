"use strict";

let messenger = require('./messenger'),
    _ = require('lodash'),
    service = require('./service'),
    operating = require('./operating'),
    handlers = require('./handlers'),
    redisCache = require('./redis.cache'),
    moment = require('moment'),
    formatter = require('./formatter');

//let salesforce = require('./salesforce');


let serviceResult = {
    "F" : "Không thành công",
    "E1" : "Lỗi trong quá trình cập nhật thông tin vào database",
    "E2" : "Lỗi convert dữ liệu",
    "E3" : "Không đúng thông tin truy cập",
    "E4" : "Lỗi Khác"
};


// // Process  new_location 
// exports.new_location = (sender, values) => {
    
//     messenger.send({
//         text: __('PRESS_LOCATION_MSG'),
//         "quick_replies":[
//           {
//             "content_type":"location",
//           }
//         ]
//     }, sender);
// }

 
// Process book   OK 
exports.book_now = (sender, values, senderState) => {


    handlers.showBookingProccessing( sender,  ticket_id => { 
        if ( ticket_id) {
            console.log("Booking in progress, not book any more ,  ticket_id : ", ticket_id );
            return;
        }


        let timestamp = Number(values[4]);
        let now = +moment();
        let expiredTime = 5 * 60 * 1000; // expired time is 5 minute


        if(now - timestamp > expiredTime || ! senderState.location ){
            //messenger.send(formatter.formatReorder(), sender);
            messenger.send({text: __('BOOK_EXPRIED')}, sender ,() => {
                handlers.hiMessage(sender, senderState);
            });
            return;
        }

        let book_time_code  = Number(values[1]);
        let book_time =  moment().add(1, 'minutes').utcOffset(7).format("YYYY-MM-DDTHH:mm:ss");
        let highlight  = " GỌI KHÁCH NGAY ";
        
        //book_time_code  = 0 : now, 1 = sau 15p, 2 = sau 30p, 3 = goi lai.

        if (book_time_code == 0 ){
        
            book_time = moment().utcOffset(7).format("YYYY-MM-DDTHH:mm:ss");
            highlight  = " ĐẶT NGAY ";

        }else if (book_time_code == 1){
            
            book_time = moment().add(15, 'minutes').utcOffset(7).format("YYYY-MM-DDTHH:mm:ss");
            highlight  = " ĐẶT sau 15p ";
        
        }else if (book_time_code == 2){
        
            book_time = moment().add(30, 'minutes').utcOffset(7).format("YYYY-MM-DDTHH:mm:ss");
            highlight  = " ĐẶT sau 30p ";
        } 



        let car_productcode  = values[3];

        let car_product_type__c = Number(values[3]);

        let sender_name =  senderState.name ||  `${senderState.first_name} ${senderState.last_name}`; 

        //console.log(book_time_code, book_time, car_product_type__c);


        operating.createTicket({
            "CustName": sender_name,
            "Addr": senderState.address ,
            "Phone" : senderState.mobile || senderState.mobilephone,
            "SenderID": sender,
            "Latitude": (senderState.location || {}).lat,
            "Longitude":(senderState.location || {}).lng,
            "VehType": car_product_type__c || 1 ,
            "Time": book_time,
            "Qty":"1",
            "GhiChu":  `MSG_BOTv2 - ${highlight}` ,
            "Src ": "2",
            "Dmn": "thanhcongtaxi.vn"
        });



    	var args ={
    		dmn: 'thanhcongtaxi.vn',
    		CustName: sender_name,
    		Phone: senderState.mobile || senderState.mobilephone ,
    		Addr: senderState.address,
    		VehType: car_product_type__c || 1,
    		Qty: 1,
    		brand: 1,
    		senderID: sender,
    		lat: (senderState.location || {}).lat,
    		lng:(senderState.location || {}).long,
    		Time: book_time ,
    		GhiChu: `MSG_BOTv2 - ${highlight}`,
    		src: 1,
    		extension1: '',
    		extension2: ''
    	};

        service(client=>{
                
    		console.log("BookTaxi body", JSON.stringify(args));
            client.BookingTaxi_V2(args, (err, result)=> {

    			console.log("BookingTaxi_V2",JSON.stringify(result));

                if(err){
                    console.error(JSON.stringify(err));
                }
                if(result && result.statusCode && result.statusCode != 100){
                    console.error(`Save order info to System error message: ${result.statusMessage}`);
                    return;
                }else if(result.BookingTaxi_V2Result){


                    messenger.send(formatter.informBookingState('-5', 'Searching', result.BookingTaxi_V2Result, senderState.address  ) , sender ) ;


                    //messenger.send(formatter.formatBookingProcessing( 'Call-Center: 04.32.57.57.57 ' , result.BookingTaxi_V2Result), sender);

                    //log state to session
                    redisCache.setIsBooking(sender,result.BookingTaxi_V2Result, 1, senderState.address );
                    redisCache.updateSenderState(sender, {location: undefined});

                }else{
                    //say sorry for cannot book
                    messenger.send({text: __('RECEIPT_SORRY')}, sender);
                }


            })
        });

    });


};



//rebook recent address 
exports.rebook = (sender, values, senderState) => {
    handlers.showBookingProccessing( sender,   ticket_id => { 
        if ( ticket_id) {
            console.log("Booking in progress, not book any more ! ticket_id ", ticket_id );
            return;
        }

        let loc_lng  = values[1];
        let loc_lat  = values[2];
        let address = decodeURIComponent(values[3]);
        let loc = {lat: loc_lat, long: loc_lng  };
    
        if (loc_lng){
            redisCache.updateSenderState(sender, {address: address, location: loc });
            handlers.searchCarType(sender, loc, address);
        }
    });
};



//Show schedule booking 
exports.book_schedule = (sender, values) => {
    messenger.send(formatter.formatScheduleBooking( values[1] ), sender);
};

//Show code retry 
exports.retry_code = (sender, values) => {
    let timestamp = Number(values[1]);
    let now = +moment();
    let expird_time = 15 * 60 * 1000; // expired time is 15 minute
    if(now - timestamp > expird_time){
        messenger.send({text: __('RESEND_CODE_EXPIRED')}, sender);
    }else{
        redisCache.getSenderState(sender, results=>{
            handlers.sendCodeToMobile(sender, results.mobile)
        });
    }
};

//



//startup 
exports.first_hi  = (sender , values , senderState)  => {

    handlers.hiMessage(sender, senderState );

}  



//change_phone_no
exports.change_phone_no = (sender, values , senderState) => {

    senderState.stateValue = 4 ;
    handlers.messageProccessing(sender , senderState);

    redisCache.updateSenderState(sender, {stateValue: 4 , stateText: " Wrong code input mobile again  "});


}  



//langues choosed 
exports.language = (sender, values , senderState) => {

    let langId = values[1] || 'vi';


    // set language
    setLocale(langId );
    redisCache.updateSenderState(sender, {langId: langId });
    handlers.messageProccessing(sender , senderState);

//     if (! senderState.mobile ){ 
// //        senderState.stateValue = 3;

// //        redisCache.updateSenderState(sender, {stateValue: 3 , stateText: " From language choose "});
//     }




}  

//Cancel Booking 
exports.cancel = (sender, values) => {

    let tickedID = values[1];
    messenger.send({text: __('CANCEL_BOOK_MSG')}, sender);

    //clear booking in sesion. 
    redisCache.clearBooking(sender);

    var args ={
        dmn: 'thanhcongtaxi.vn',
        brand: 1,
        tickedID: tickedID
    };


    service(client=>{

        console.log("Cancel  body", JSON.stringify(args));
        client.CancelBooking_V2(args, (err, result)=> {


            console.log("CancelBooking_V2",JSON.stringify(result));

            if(err){
                console.error(JSON.stringify(err));
            }

            if(result && result.statusCode && result.statusCode != 100){
                console.error(`Save order info to System error message: ${result.statusMessage}`);
                return;
            }


        })
    });

};


