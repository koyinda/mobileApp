const connection = require("../config/database");


module.exports = {
    updatepaymentlog :(id, callBack) =>
    {   
        const updatePaymentlogq = 'UPDATE `paymentlogs` SET `STATE` = ?, `CARDNUMBER` = ?, `MERCHANTREFERENCE` = ?, `LASTMODIFY` = now(), `EXTERNALERRORCODE` = ?, `EXTERNALERRORDESCRIPTION` = ? WHERE LONGTIME = ?'
        connection.query({sql: updatePaymentlogq,timeout: 40000 },id, (error, results, fields) => 
        {
            if (error)
            {
                console.log("something is not right");
                callBack(error);
            }
                return callBack(null, results);
            
        });
    }

};