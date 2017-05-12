"use strict";

var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    processor = require('./modules/processor'),
    handlers = require('./modules/handlers'),
    postbacks = require('./modules/postbacks'),
    uploads = require('./modules/uploads'),
    FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN,
    APP_TOKEN = process.env.APP_TOKEN,
    i18n = require('./modules/i18n'),
    app = express();


app.set('port', process.env.PORT || 5000);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(i18n);


// serving homepage
app.get('/', function (req, res) {
    // set language
    setLocale('vi');
    res.send(greeting);
});


app.get('/webhook', (req, res) => {
    if (req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Error, wrong validation token');
    }
});

app.post('/webhook', (req, res) => {
    let events = req.body.entry[0].messaging;
    for (let i = 0; i < events.length; i++) {
        let event = events[i];
        let sender = event.sender.id;
        
        if (process.env.MAINTENANCE_MODE && ((event.message && event.message.text) || event.postback)) {
            
            sendMessage({text: `Sorry I'm taking a break right now.`}, sender);

        } else if (event.message && event.message.text && !event.message.is_echo) {

            console.log( 'Received msg :  ' + sender + ' :: ' + event.message.text );

            handlers.checkContactByFacebookSender(sender, (senderState) =>{
                // set language
                setLocale(senderState.langId || 'vi');
                
                handlers.messageProccessing(sender, senderState, event.message.text);
            });
        } else if (event.postback) {
            let payload = event.postback.payload.split(",");
            let postback = postbacks[payload[0]];
            if (postback && typeof postback === "function") {

                handlers.checkContactByFacebookSender(sender, (senderState) =>{  

                    // set language
                    setLocale(senderState.langId || 'vi');
                    postback(sender,  payload , senderState );
                }); 

            } else {
                console.log("Postback " + postback + " is not defined");
            }
        } else if (event.message && event.message.attachments) {
            handlers.checkContactByFacebookSender(sender, (senderState) =>{  
                var messageAttachments = event.message.attachments;
                var data = {
                    url: messageAttachments[0].url,
                    location: messageAttachments[0].payload.coordinates,
                    title: messageAttachments[0].title
                };
                if( senderState && senderState.stateValue > 10 && messageAttachments[0].payload.coordinates){
                    handlers.recivedLocation(data, sender);
                }
            }); 
        }
    }
    res.sendStatus(200);
});


//API 

app.post('/bot/informAccepted',(req, res) => {
    var auth = req.headers['authorization']
    if(!auth){
        return res.json({error_code: 1});
    }else{
        var token = auth.split(' ').pop();
        if(token != APP_TOKEN){
            return res.json({error_code: 1});
        }
    }

    console.log("body",JSON.stringify(req.body));
    if(!req.body.sender_id){
         return res.json({error_code: 2, msg: "sender must be required"});
    }
    handlers.informAccepted(req.body.sender_id, req.body);
    res.json({success: true});
});


app.post('sms-update', (req, res) => {
    //TODO:
    console.log("sms body post", req.body);
    res.sendStatus(200);
});

app.get('sms-update', (req, res) => {
    //TODO:
    console.log("sms body get", req.query);
    res.sendStatus(200);
});

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

// set env
// token : 93cd84d7-7c92-429d-b252-50da999aa568
