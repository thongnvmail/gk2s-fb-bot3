"use strict";

let nforce = require('nforce'),

    SF_CLIENT_ID        = process.env.SF_CLIENT_ID,
    SF_CLIENT_SECRET    = process.env.SF_CLIENT_SECRET,
    SF_USER_NAME        = process.env.SF_USER_NAME,
    SF_PASSWORD         = process.env.SF_PASSWORD,
    SF_ACCOUNT_ID       = process.env.SF_ACCOUNT_ID;

//    SF_CLIENT_ID        = "3MVG9YDQS5WtC11pXBwTzbRf4ddzdrrO4R0ef606BEXwyUbgRzt_trZozbVl0E0_7SwdwYAQlJruz8HSiQxa2",
//    SF_CLIENT_SECRET    = "8515404020403067380",
//    SF_USER_NAME        = "tcc01@gk2s.net",
//    SF_PASSWORD         = "lovingU@2017",
//    SF_ACCOUNT_ID       = '0016F00001xAztbQAC';

let org = nforce.createConnection({
    clientId: SF_CLIENT_ID,
    clientSecret: SF_CLIENT_SECRET,
    redirectUri: 'http://localhost:3000/oauth/_callback',
    mode: 'single',
    autoRefresh: true
});


// OK 
let login = () => {
    org.authenticate({username: SF_USER_NAME, password: SF_PASSWORD}, err => {
        if (err) {
            console.error("SF : Authentication error");
            console.error("Login SF error", err);
        } else {
            console.log("SF : Authentication successful");
        }
    });
};

let listAccount = ()=>{
    let where = "";
//    return new Promise((resolve, reject) => {
        let q = `SELECT Id,
                        Name
                FROM Account
                ${where}
                ORDER BY Name `;

        //console.error(q);

        org.query({query: q}, (err, resp) => {
            if (err) {
                console.log("An error as occurred : " + err);
            } else {
                console.log(JSON.stringify(resp.records));
            }
        });
//    });
};

//OK 
let findCarTypes  = (params) => {
    let where = "";
    if (params) {
        let parts = [];
        parts.push(`IsActive = true`);
        if (params.Id) parts.push(`Id='${params.Id}'`);
        if (params.ProductCode) parts.push(`ProductCode='${params.ProductCode}'`);
        if (params.CityCode) parts.push(`City_code__c INCLUDES('${params.CityCode}')`);
        if (parts.length>0) {
            where = "WHERE " + parts.join(' AND ');
        }
    }
    return new Promise((resolve, reject) => {
        let q = `SELECT Id,
                        Name,
                        ProductCode,
                        Product_Image__c,
                        Product_Type__c,
                        Description,
                        City_code__c,
                        Family
                FROM Product2 
                ${where}
                ORDER BY ProductCode `;
        
        //console.error(q);

        org.query({query: q}, (err, resp) => {
            if (err) {
                reject("An error as occurred : " + err);
            } else {
                resolve(resp.records);
            }
        });
    });
};


//OK 

let findContact  = (params) => {
    let where = "";
    if (params) {
        let parts = [];
        if (params.Id) parts.push(`Id='${params.Id}'`);
        if (params.FacebookId ) parts.push(`FacebookId__c='${params.FacebookId}'`);
        if (params.MobilePhone ) parts.push(`MobilePhone='${params.MobilePhone}'`);
        if (parts.length>0) {
            where = "WHERE " + parts.join(' AND ');
        }
    }
    return new Promise((resolve, reject) => {
        let q = `SELECT Id,
                        Name,
                        Title,
                        MobilePhone,
                        FacebookId__c,
                        Description
                FROM Contact 
                ${where} 
                LIMIT 1 
            `;

        org.query({query: q}, (err, resp) => {
            if (err) {
                reject("An error as occurred : " + err);
            } else {
                resolve(resp.records);
            }
        });
    });

};




// let findPropertiesByCategory = (category) => {
//     return new Promise((resolve, reject) => {
//         let q = `SELECT id,
//                     title__c,
//                     address__c,
//                     city__c,
//                     state__c,
//                     price__c,
//                     beds__c,
//                     baths__c,
//                     picture__c
//                 FROM property__c
//                 WHERE tags__c LIKE '%${category}%'
//                 LIMIT 5`;
//         console.log(q);
//         org.query({query: q}, (err, resp) => {
//             if (err) {
//                 console.error(err);
//                 reject("An error as occurred");
//             } else {
//                 resolve(resp.records);
//             }
//         });
//     });

// };

// let findPriceChanges = () => {
//     return new Promise((resolve, reject) => {
//         let q = `SELECT
//                     OldValue,
//                     NewValue,
//                     CreatedDate,
//                     Field,
//                     Parent.Id,
//                     Parent.title__c,
//                     Parent.address__c,
//                     Parent.city__c,
//                     Parent.state__c,
//                     Parent.price__c,
//                     Parent.beds__c,
//                     Parent.baths__c,
//                     Parent.picture__c
//                 FROM property__history
//                 WHERE field = 'Price__c'
//                 ORDER BY CreatedDate DESC
//                 LIMIT 3`;
//         org.query({query: q}, (err, resp) => {
//             if (err) {
//                 reject("An error as occurred");
//             } else {
//                 resolve(resp.records);
//             }
//         });
//     });
// };


let createCase = (propertyId, customerName, customerId) => {

    return new Promise((resolve, reject) => {
        let c = nforce.createSObject('Case');
        c.set('subject', `Contact ${customerName} (Facebook Customer)`);
        c.set('description', "Facebook id: " + customerId);
        c.set('origin', 'Facebook Bot');
        c.set('status', 'New');
        c.set('Property__c', propertyId);

        org.insert({sobject: c}, err => {
            if (err) {
                console.error(err);
                reject("An error occurred while creating a case");
            } else {
                resolve(c.toJSON());
            }
        });
    });

};

/*
* Create contact on saleforce
* @author dien.tran
*/
let createContact = (contact)=>{
    return new Promise((resolve, reject) => {
        let c = nforce.createSObject('Contact');
        c.set('AccountId', SF_ACCOUNT_ID);
        c.set('LastName', contact.last_name);
        c.set('FirstName', contact.first_name);
        c.set('FacebookId__c', contact.profile_pic );
        c.set('LangId__c', contact.langId);
        c.set('Title', 'Facebook');
        c.set('MobilePhone', contact.mobile);

        org.insert({sobject: c}, err => {
            if (err) {
                console.error(err);
                reject("An error occurred while creating a contact");
            } else {
                console.log('Save contact to saleforce success');
                resolve(c.toJSON());
            }
        });
    });
};

var test = ()=>{
    var data = {
        first_name: "gk2s",
        last_name: "test",
        mobile: "0123456789",
        id: "0123465934"
    };
    createContact(data).then(contact=>{
        console.log("Test create contact result", contact);
    }).catch(err=>{
        console.log("Test create contact error", err);
    })
};

login();

exports.org = org;
exports.findCarTypes = findCarTypes;
exports.findContact = findContact;

// exports.findPropertiesByCategory = findPropertiesByCategory;
// exports.findPriceChanges = findPriceChanges;
exports.createCase = createCase;
exports.createContact = createContact;




