let soap = require('soap');

let serviceUrl = process.env.SERVICE_API_URL;//"http://210.211.124.121:86/TaxiOperation_Services.asmx?WSDL";
let serviceUser = process.env.SERVICE_USER; //'thanhcongtaxi';
let servicePass = process.env.SERVICE_PASS; //'BA-8B-10-80-49-8E-45-A1-0E-CE-73-2A-25-1C-50-C1-51-AB-CB-96';


module.exports = (next)=>{
    soap.createClient(serviceUrl, (err, client)=> {
        if(err) {
            console.error(err);
            return next(null);
        }
        var headers ='<Action xmlns="http://schemas.microsoft.com/ws/2005/05/addressing/none">http://tempuri.org/BookingTaxi_V2</Action>'
    +'<h:Authentication xmlns="http://tempuri.org/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:h="http://tempuri.org/">'
    +`<UserName>${serviceUser}</UserName>`
    +`<Password>${servicePass}</Password>`
    +'</h:Authentication>';
        client.addSoapHeader(headers);
        next(client);
    });
};

