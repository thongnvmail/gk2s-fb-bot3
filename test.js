"use strict";

var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    service = require('./modules/service'),
    app = express();
    var i18n = require('./modules/i18n');
    var moment = require('moment');
    var APP_TOKEN = "93cd84d7-7c92-429d-b252-50da999aa568";


app.set('port', process.env.PORT || 5000);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(i18n);
let serviceUrl = "http://210.211.124.121:86/TaxiOperation_Services.asmx?WSDL";
let serviceUser = 'thanhcongtaxi';
let servicePass = 'BA-8B-10-80-49-8E-45-A1-0E-CE-73-2A-25-1C-50-C1-51-AB-CB-96';

// serving homepage
app.get('/', function (req, res) {
    // set language
    res.send("Wellcome"+ getLocale());
});

app.listen(app.get('port'), function () {

    console.log('Express server listening on port ' + app.get('port'));
});

//let soap = require('soap');
//soap.createClient(serviceUrl, (err, client)=> {
//    if(err) {
//        console.error(err);
//        return next(null);
//    }
//    var headers ='<Action  xmlns="http://schemas.microsoft.com/ws/2005/05/addressing/none">http://tempuri.org/BookingTaxi</Action>'
//    +'<h:Authentication xmlns="http://tempuri.org/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:h="http://tempuri.org/">'
//    +'<UserName>thanhcongtaxi</UserName>'
//    +'<Password>BA-8B-10-80-49-8E-45-A1-0E-CE-73-2A-25-1C-50-C1-51-AB-CB-96</Password>'
//    +'</h:Authentication>';
//    client.addSoapHeader(headers);
//    var args ={
//        CustName: `Dien test chatbot`,
//        Phone: "0936546789",
//        Addr: "Khong co",
//        VehType: "4",
//        Qty: 1,
//        brand: 1,
//        Time: moment().add(1, 'hours').toISOString(),//"2017-04-17T16:34:00",
//        GhiChu: "Đặt xe từ chatbot",
//        src: 1,
//        dmn: 'thanhcongtaxi.vn',
//    };
//
//    client.BookingTaxi(args, (err, result)=> {
//        console.log(result);
//        if(err){
//            console.error(err);
//            return;
//        }
//        if(result && result.statusCode && result.statusCode != 100){
//            console.error(`Save order info to System error message: ${result.statusMessage}`);
//            return;
//        }
//        if(result.BookingTaxiResult !=  '1'){
//            console.log(`Save order info fail with error:`);
//            return;
//        }
//    });
//});


app.post('/bot/informAccepted', (req, res) => {
    var auth = req.headers['authorization'];

    if(!auth){
        console.log("11111111111111");
        return res.json({error_code: 1});
    }else{
        console.log("2222222222222222222");
        var token = auth.split(' ').pop();
        if(token != APP_TOKEN){
            return res.json({error_code: 1});
        }
    }

    //handlers.informAccepted(informAccepted.sender, req.body);
    res.json({success: true});
//    res.sendStatus(200);
});

