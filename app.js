require('dotenv').config();
const express =  require("express");
const app = express();
const middleware = require("./middleware");
const bodyParser = require('body-parser');
var crypto = require('crypto');
var session  = require('express-session');
const moment = require('moment');
const connection = require("./config/database");
var passport = require("passport");
var flash = require("connect-flash");
const request = require('request');
const btoken = 'Bearer '+process.env.token;
const pstoken = 'Bearer '+process.env.paystackkey;
const methodOverride = require("method-override");

require('./config/passport')(passport);



app.set("view engine", "ejs");
app.use(express.static(__dirname+"/public"));
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(session({
	secret: process.env.ssecret,
	resave: true,
	saveUninitialized: true
 } )); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());

app.use(session({
  secret: "sosecret",
  saveUninitialized: false,
  resave: false
}));

app.use(function(req, res, next) {
  if(!req.session.passport)
  {
    res.locals.muser = null;
  }else{
    res.locals.muser = req.session.passport.user;
  }
  
  next();
});

app.get("/", isLoggedIn, function(req, res){
    const options = {
        'method': 'GET',
        'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/getuserdet/'+req.session.passport.user.USERID,
        'headers': {
            'Content-Type': 'application/json',
            'Authorization': btoken
        }
      };
      request(options, function (error, response) { 
        if (error) throw new Error(error);
        const i = JSON.parse(response.body);
        const bank = {
            'method': 'GET',
            'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/getbankdet/'+req.session.passport.user.USERID,
            'headers': {
                'Content-Type': 'application/json',
                'Authorization': btoken
            }
          };
          request(bank, function (error, bresponse) { 
            if (error) throw new Error(error);
            const b = JSON.parse(bresponse.body);
            const frbank = {
              'method': 'GET',
              'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/getfreebankdet/'+req.session.passport.user.USERID,
              'headers': {
                  'Content-Type': 'application/json',
                  'Authorization': btoken
              }
            };
            request(frbank, function (error, bresponse) { 
              if (error) throw new Error(error);
              const f = JSON.parse(bresponse.body);
              res.render("index", {cUser:i, moment:moment, pbank:b, fbank:f});
            });
          });
          
        
      });
    
  });


app.get('/login', function(req, res) {

  // render the page and pass in any flash data if it exists
  res.render('login');
});

	// process the login form
app.post('/login', passport.authenticate('local-login', {
          successRedirect : '/', // redirect to the secure profile section
          failureRedirect : '/register', // redirect back to the signup page if there is an error
          failureFlash : true // allow flash messages
}),
function(req, res) {
});


app.get('/signup', function(req, res) {
  // render the page and pass in any flash data if it exists
  res.render('signup', { message: req.flash('signupMessage') });
});
  
    // process the signup form
app.post('/signup', passport.authenticate('local-signup', {
  successRedirect : '/login', // redirect to the secure profile section
  failureRedirect : '/register', // redirect back to the signup page if there is an error
  failureFlash : true // allow flash messages
}));

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/login');
});

app.get("/managespeed", isLoggedIn, function(req, res){
    const cspeed = {
      'method': 'GET',
      'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/speed/'+req.session.passport.user.USERID,
      'headers': {
          'Content-Type': 'application/json',
          'Authorization': btoken
      }
    };
    request(cspeed, function (error, bresponse) { 
      if (error) throw new Error(error);
      const sp = JSON.parse(bresponse.body);
      res.render("speed", { speed:sp});
    });
});

app.post("/speed", isLoggedIn, function(req, res){

  const pspeed = {
    'method': 'POST',
    'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/speed/'+req.session.passport.user.USERID,
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': btoken
    },
    body: JSON.stringify({"speed":req.body.speedradio})
  
  };
  request(pspeed, function (error, response) { 
    if (error) throw new Error(error);
    res.redirect('/managespeed')
  });
  
});

app.get("/updateuser", isLoggedIn, function(req, res){
  const getDet = {
    'method': 'GET',
    'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/getuserdet/'+req.session.passport.user.USERID,
    'headers': {
        'Content-Type': 'application/json',
        'Authorization': btoken
    }
  };
  request(getDet, function (error, bresponse) { 
    if (error) throw new Error(error);
    const ud = JSON.parse(bresponse.body);
    res.render("updateUser", { uDet:ud});
  });
});
app.put("/updateuser", isLoggedIn, function(req, res){
  const uUser = {
    'method': 'POST',
    'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/updateuserdet/'+req.session.passport.user.USERID,
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': btoken
  },
    body: JSON.stringify({
      "dnd":req.body.uDND,
      "email":req.body.uEmail,
      "number":req.body.uMOBILE,
      "address":req.body.uADDRESS
    })

  };
  request(uUser, function (error, response) { 
    if (error) throw new Error(error);
    res.redirect('/updateuser');
  });
});
app.get("/session", isLoggedIn, function(req, res){
  const getSess = {
    'method': 'GET',
    'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/usagehistory/'+req.session.passport.user.USERID,
    'headers': {
        'Content-Type': 'application/json',
        'Authorization': btoken
    },
    body: JSON.stringify({
      "start":moment().subtract(7, "days").format('YYYY-MM-DD'),
      "end":moment().format('YYYY-MM-DD')
    })    
  };
  request(getSess, function (error, bresponse) { 
    if (error) throw new Error(error);
    const uS = JSON.parse(bresponse.body);
    var st = moment().subtract(7, "days").format('YYYY-MM-DD');
    var et = moment().format('YYYY-MM-DD');
    res.render("session", { uSes:uS, moment:moment, st:st, et:et});
  });
});

app.post("/session", isLoggedIn, function(req, res){
  const getuSess = {
    'method': 'GET',
    'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/usagehistory/'+req.session.passport.user.USERID,
    'headers': {
        'Content-Type': 'application/json',
        'Authorization': btoken
    },
    body: JSON.stringify({
      "start":req.body.startdate,
      "end":req.body.enddate
    })    
  };
  request(getuSess, function (error, bresponse) { 
    if (error) throw new Error(error);
    const uuS = JSON.parse(bresponse.body);
    var st = req.body.startdate;
    var et = req.body.enddate;
    res.render("session", { uSes:uuS, moment:moment, st:st, et:et});
  });
});


app.get("/paymenthist", isLoggedIn, function(req, res){
  const getupay = {
    'method': 'GET',
    'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/paymenthistory/'+req.session.passport.user.USERID,
    'headers': {
        'Content-Type': 'application/json',
        'Authorization': btoken
    },
    body: JSON.stringify({
      "start":moment().subtract(7, "days").format('YYYY-MM-DD'),
      "end":moment().format('YYYY-MM-DD')
    })    
  };
  request(getupay, function (error, bresponse) { 
    if (error) throw new Error(error);
    const uP = JSON.parse(bresponse.body);
    var st = moment().subtract(7, "days").format('YYYY-MM-DD');
    var et = moment().format('YYYY-MM-DD');
    res.render("paymenthist", { uPay:uP, moment:moment, st:st, et:et});
  });
});

app.post("/paymenthist", isLoggedIn, function(req, res){
  const getuupay = {
    'method': 'GET',
    'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/paymenthistory/'+req.session.passport.user.USERID,
    'headers': {
        'Content-Type': 'application/json',
        'Authorization': btoken
    },
    body: JSON.stringify({
      "start":req.body.startdate,
      "end":req.body.enddate
    })    
  };
  request(getuupay, function (error, bresponse) { 
    if (error) throw new Error(error);
    const uuP = JSON.parse(bresponse.body);
    var st = req.body.startdate;
    var et = req.body.enddate;
    res.render("paymenthist", { uPay:uuP, moment:moment, st:st, et:et});
  });
});

app.get("/renewhist", isLoggedIn, function(req, res){
  const getrenhist = {
    'method': 'GET',
    'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/renewhistory/'+req.session.passport.user.USERID,
    'headers': {
        'Content-Type': 'application/json',
        'Authorization': btoken
    },
    body: JSON.stringify({
      "start":moment().subtract(7, "days").format('YYYY-MM-DD'),
      "end":moment().format('YYYY-MM-DD')
    })    
  };
  request(getrenhist, function (error, bresponse) { 
    if (error) throw new Error(error);
    const rh = JSON.parse(bresponse.body);
    var st = moment().subtract(7, "days").format('YYYY-MM-DD');
    var et = moment().format('YYYY-MM-DD');
    res.render("renewhist", { rehist:rh, moment:moment, st:st, et:et});
  });
});

app.post("/renewhist", isLoggedIn, function(req, res){
  const rehisP = {
    'method': 'GET',
    'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/paymenthistory/'+req.session.passport.user.USERID,
    'headers': {
        'Content-Type': 'application/json',
        'Authorization': btoken
    },
    body: JSON.stringify({
      "start":req.body.startdate,
      "end":req.body.enddate
    })    
  };
  request(rehisP, function (error, bresponse) { 
    if (error) throw new Error(error);
    const rhP = JSON.parse(bresponse.body);
    var st = req.body.startdate;
    var et = req.body.enddate;
    res.render("renewhist", { rehist:rhP, moment:moment, st:st, et:et});
  });
});

app.get("/makepayment", isLoggedIn, function(req, res){
  res.render("paynow");
});

app.get("/interpayment", isLoggedIn, function(req, res){
  res.render("pay_inter");
});

app.get("/paystackpayment", isLoggedIn, function(req, res){
  res.render("pay_paystack");
});

app.post("/gatewaysubmit", isLoggedIn, function(req, res){
  const uniqueID = Date.now();  
  if(req.body.pType == "interswitch")
  {
    let inserthash = uniqueID+process.env.product_id+process.env.pay_item_id+(req.body.amount*100)+process.env.returnurl+process.env.MacKey;
    let encrypted = crypto.createHash('sha512').update(inserthash).digest('hex');
    //shajs('sha256').update(inserthash).digest('hex');
    const keyVal = [
      uniqueID,
      req.body.amount,
      req.body.custID,
      process.env.product_id,
      process.env.pay_item_id,
      process.env.CURRENCY,
      process.env.returnurl,
      encrypted,
      'Interswitch',
    ];
    const insertTransSql = 'INSERT INTO `paymentlogs` (`LONGTIME`, `AMOUNT`, `USERID`, `PRODUCT_ID`, `PAY_ITEM_ID`, `CURRENCY`, `SITE_REDIRECT_URL`, `HASH`,`PaymentType`,`CREATEDATE`, `LASTMODIFY`, `STATE`, `POSTAMOUNTTYPE`) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?, DATE_ADD(NOW(), INTERVAL 1 HOUR),  DATE_ADD(NOW(), INTERVAL 1 HOUR), 3, "Total")'
    connection.query({sql: insertTransSql,timeout: 40000 },keyVal, function (error, results, fields) {
      if (error)
      {
        console.log(error)
        console.log("something is not right");
        return res.redirect("/interpayment");
      }
      else
      {
        return res.render("submitgate", { keyVal:keyVal});
      }
        
    });
    
  }
  else if(req.body.pType == "paystack")
  {

    const payKey = [
      uniqueID,
      req.body.amount,
      req.body.custID,
      000,
      000,
      process.env.CURRENCY,
      process.env.returnurl,
      'No Hash',
      'Paystack',
    ];
    const insertPSTransSql = 'INSERT INTO `paymentlogs` (`LONGTIME`, `AMOUNT`, `USERID`, `PRODUCT_ID`, `PAY_ITEM_ID`, `CURRENCY`, `SITE_REDIRECT_URL`, `HASH`,`PaymentType`,`CREATEDATE`, `LASTMODIFY`, `STATE`, `POSTAMOUNTTYPE`) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?, DATE_ADD(NOW(), INTERVAL 1 HOUR),  DATE_ADD(NOW(), INTERVAL 1 HOUR), 3, "Total")'
    connection.query({sql: insertPSTransSql,timeout: 40000 },payKey, function (error, results, fields) {
      if (error)
      {
        console.log(error)
        console.log("something is not right");
        return res.redirect("/paystackpayment");
      }
      else
      {
        return res.render("submitgate", { keyVal:payKey});
      }
        
    });
    
  }
  else{
    return res.send(req.body);
  }
  
});
app.post("/paystackredirect", isLoggedIn, function(req, res){
  const paystackurl = {
    'method': 'POST',
    'url': 'https://api.paystack.co/transaction/initialize',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': pstoken
    },
    body: JSON.stringify({
      "callback_url":req.body.callback_url,
      "reference":req.body.reference,
      "amount":req.body.amount,
      "email":req.body.email
    })
  
  };
  request(paystackurl, function (error, response) { 
    if (error) throw new Error(error);
    
    const ps = JSON.parse(response.body);
    if(ps.status == true)
    {
      res.redirect(ps.data.authorization_url);
      
    }
    else
    {
      res.send("wrong!!");
    }
  });
});
app.post("/paymentreturn", isLoggedIn, function(req, res){
  var stat = '';
  if(req.body.resp=='00'){
    stat = 1
  }else {
    stat = 2
  }
  var intRes = [
    stat,
    req.body.CardNumber,
    req.body.retRef,
    req.body.resp,
    req.body.desc,
    req.body.txnref
  ];

  middleware.updatepaymentlog(intRes, (err, results) =>{
    if(err || results.length ==0) 
    {
      return res.json({
          status: 99,
          message: "i dont even know what can go wrong here"
      });
    }
  });

  var pdet = {
    "transactionid": req.body.txnref,
    "error": req.body.desc,
    "amount": '0.00',
    "status": false
  };

  if(req.body.resp == '00')
  {

    const postreq = {
      'method': 'POST',
      'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/postpayment',
      'headers': {
          'Content-Type': 'application/json',
          'Authorization': btoken
      },
      body: JSON.stringify({
        "userid":req.session.passport.user.USERID,
        "amount": req.body.amount/100,
        "paymentmethod":"1",
        "paymentreference": req.body.retRef,
        "transactionid": req.body.txnref
      })

    };
    request(postreq, function (error, response) { 
      if (error) throw new Error(error);
      pdet.amount =req.body.amount/100;
      pdet.status = true;
      return res.render("preturned" ,{pdet:pdet});
    });

  }
  else{
    return res.render("preturned" ,{pdet:pdet});
  }
    
});

app.get("/paymentreturn", isLoggedIn, function(req, res){
    const verifypaystack = {
      'method': 'GET',
      'url': 'https://api.paystack.co/transaction/verify/'+req.query.reference,
      'headers': {
        'Authorization': pstoken
      }
    };
    request(verifypaystack, function (error, response) { 
      if (error) throw new Error(error);
      const vps = JSON.parse(response.body);
      var pdet = {
        "transactionid": vps.data.reference,
        "error":vps.data.gateway_response,
        "amount": '0.00',
        "status": false
      };
       //res.send(vps);
       var stat = '';
       if(vps.data.status == 'success'){
         stat = 1
       }else {
         stat = 2
       }
       var intRes = [
         stat,
         vps.data.authorization.last4,
         vps.data.reference,
         vps.data.status,
         vps.data.gateway_response,
         vps.data.reference
       ];
     
       middleware.updatepaymentlog(intRes, (err, results) =>{
         if(err || results.length ==0) 
         {
           return res.json({
               status: 99,
               message: "i dont even know what can go wrong here"
           });
         }
       });
       if(vps.data.status == 'success')
       {
        const postreqp = {
          'method': 'POST',
          'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/postpayment',
          'headers': {
              'Content-Type': 'application/json',
              'Authorization': btoken
          },
          body: JSON.stringify({
            "userid":req.session.passport.user.USERID,
            "amount": vps.data.amount/100,
            "paymentmethod":"2",
            "paymentreference": vps.data.reference,
            "transactionid": vps.data.reference
          })
    
        };
        request(postreqp, function (error, response) { 
          if (error) throw new Error(error);
          pdet.amount =vps.data.amount/100;
          pdet.status = true;
          
          return res.render("preturned" ,{pdet:pdet});
        });
         
       }
       else
       {
         
        return res.render("preturned" ,{pdet:vps});
       }
    });

});


app.get("/viewpayment", isLoggedIn, function(req, res){
    const querySql = 'SELECT `LONGTIME`, `AMOUNT`, `HASH`,`USERID`,`PAYREF`,`PaymentType`,`CREATEDATE`, `LASTMODIFY`,`STATE`,`EXTERNALERRORCODE`,`EXTERNALERRORDESCRIPTION` FROM `paymentlogs` WHERE `USERID` = ? order by CREATEDATE desc'
    connection.query({sql: querySql,timeout: 40000 },[req.session.passport.user.USERID], function (error, results, fields) {
        if (error)
        {
          console.log("something is not right");
            return res.json({
              status: 99,
              message: "please check that user id, it seems invalid"
          });
        }
        else
        {
          var resul =  JSON.parse(JSON.stringify(results));
          res.render("viewpaylog", {moment:moment, uPay:resul});

        }
    });
});

app.get("/renew", isLoggedIn, function(req, res){
  res.render("renew");
});
app.post("/renew", isLoggedIn, function(req, res){
  const renewplan = {
    'method': 'POST',
    'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/activateplan',
    'headers': {
        'Content-Type': 'application/json',
        'Authorization': btoken
    },
    body: JSON.stringify({
      "planindex":req.body.newproduct,
      "userid":req.body.userid
    })    
  };
  request(renewplan, function (error, bresponse) { 
    if (error) throw new Error(error);
    res.redirect('/');
  });  
});
app.get("/productswitch", isLoggedIn, function(req, res){
  const getplanlist = {
    'method': 'GET',
    'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/getplanlist/'+req.session.passport.user.USERID,
    'headers': {
        'Content-Type': 'application/json',
        'Authorization': btoken
    }  
  };
  request(getplanlist, function (error, bresponse) { 
    if (error) throw new Error(error);
    const pl = JSON.parse(bresponse.body);
    res.render("switch", { planlist:pl});
  });
});
app.post("/productswitch", isLoggedIn, function(req, res){
  const switchplan = {
    'method': 'POST',
    'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/activateplan',
    'headers': {
        'Content-Type': 'application/json',
        'Authorization': btoken
    },
    body: JSON.stringify({
      "planindex":req.body.optradio,
      "userid":req.body.userid
    })    
  };
  request(switchplan, function (error, bresponse) { 
    if (error) throw new Error(error);
    res.redirect('/');
  }); 
});
app.post("/requery", isLoggedIn, function(req, res){
  if(req.body.ptype == "Paystack")
  {
    const repaystack = {
      'method': 'GET',
      'url': 'https://api.paystack.co/transaction/verify/'+req.body.txtid,
      'headers': {
        'Authorization': pstoken
      }
    };
    request(repaystack, function (error, response) { 
      if (error) throw new Error(error);
      const rps = JSON.parse(response.body);
      if(rps.status == true)
      {
        var pdet = {
          "transactionid": rps.data.reference,
          "error":rps.data.gateway_response,
          "amount": '0.00',
          "status": false
        };
        //res.send(vps);
        var stat = '';
        if(rps.data.status == 'success'){
          stat = 1
        }else {
          stat = 2
        }
        var intRes = [
          stat,
          rps.data.authorization.last4,
          rps.data.reference,
          rps.data.status,
          rps.data.gateway_response,
          rps.data.reference
        ];
      
        middleware.updatepaymentlog(intRes, (err, results) =>{
          if(err || results.length ==0) 
          {
            return res.json({
                status: 99,
                message: "i dont even know what can go wrong here"
            });
          }
        });
        if(rps.data.status == 'success')
        {
              const postqreqp = {
                'method': 'POST',
                'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/postpayment',
                'headers': {
                    'Content-Type': 'application/json',
                    'Authorization': btoken
                },
                body: JSON.stringify({
                  "userid":req.session.passport.user.USERID,
                  "amount": rps.data.amount/100,
                  "paymentmethod":"2",
                  "paymentreference": rps.data.reference,
                  "transactionid": rps.data.reference
                })
          
              };
              request(postqreqp, function (error, response) { 
                if (error) throw new Error(error);
                return res.redirect("/viewpayment");
              });
        }
        else{
          return res.redirect("/viewpayment");   
        }
        
      }
      else{
        //res.send(vps);
        var intRes = [
          2,
          0,
          req.body.txtid,
          'failed',
          rps.data.status,
          req.body.txtid
        ];
      
        middleware.updatepaymentlog(intRes, (err, results) =>{
          if(err || results.length ==0) 
          {
            return res.json({
                status: 99,
                message: "i dont even know what can go wrong here"
            });
          }
          return res.redirect("/viewpayment");
        });
      }

    });
  }
  if(req.body.ptype == "Interswitch")
  {
    var options = {
      'method': 'GET',
      'url': 'https://sandbox.interswitchng.com/collections/api/v1/gettransaction.json?amount='+req.body.amount+'&productid='+ process.env.product_id+'&transactionreference='+req.body.txtid,
      'headers': {
        'Hash': req.body.hash
      }
    };
    request(options, function (error, response) { 
      if (error) throw new Error(error);
      const rqi = JSON.parse(response.body);
      var stat = '';
      if(rqi.ResponseCode=='00'){
        stat = 1
      }else {
        stat = 2
      }
      var intRes = [
        stat,
        rqi.CardNumber,
        rqi.MerchantReference,
        rqi.ResponseCode,
        rqi.ResponseDescription,
        rqi.MerchantReference
      ];
    
      middleware.updatepaymentlog(intRes, (err, results) =>{
        if(err || results.length ==0) 
        {
          return res.json({
              status: 99,
              message: "i dont even know what can go wrong here"
          });
        }
      });
    
      var pdet = {
        "transactionid": rqi.MerchantReference,
        "error": rqi.ResponseDescription,
        "amount": '0.00',
        "status": false
      };
    
      if(rqi.ResponseCode == '00')
      {
    
        const postqreq = {
          'method': 'POST',
          'url': 'https://aqueous-anchorage-36905.herokuapp.com/api/postpayment',
          'headers': {
              'Content-Type': 'application/json',
              'Authorization': btoken
          },
          body: JSON.stringify({
            "userid":req.session.passport.user.USERID,
            "amount": rqi.Amount/100,
            "paymentmethod":"1",
            "paymentreference": rqi.MerchantReference,
            "transactionid": rqi.MerchantReference
          })
    
        };
        request(postqreq, function (error, response) { 
          if (error) throw new Error(error);
          return res.redirect("/viewpayment");
        });
    
      }
      else{
        return res.redirect("/viewpayment");
      }     
    });
  }  
  
});

app.get("*", function(req, res){

  res.render("under");
  
});


function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/login');
}

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Has Started!");
});