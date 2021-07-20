const express = require('express')
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const fetch = require("node-fetch");

const app = express();
const port = process.env.PORT || 3003;
const token = process.env.APP_MT;
const uri = process.env.APP_URI || "mongodb+srv://dbElSalto:x9eAYrYf100awsmA@dbelsalto.bvchh.mongodb.net/myFirstDatabase";

const proxy = process.env.APP_PROXY || "https://proxy-wozx.herokuapp.com/";


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const options = { useNewUrlParser: true, useUnifiedTopology: true };

mongoose.connect(uri, options).then(
  () => { console.log("Conectado Exitodamente!");},
  err => { console.log(err); }
);

var user = mongoose.model('usuarios', {
        id: Number,
        active: Boolean,
        value: Number,
        start: Number,
        end: Number
       
    });



app.get('/', async(req,res) => {

    mongoose.connect(uri, options).then(
      () => { res.send("Conectado a mongoDB Exitodamente!");},
      err => { res.send(err); }
    );


});

app.get('/precio/usd/trx', async(req,res) => {


  var apiUrl = 'https://data.gateapi.io/api2/1/marketlist';
  const response = await fetch(apiUrl)
  .catch(error =>{console.error(error)})
  const json = await response.json();

  var upd = json.data.find(element => element.pair == "trx_usdt");


  res.status(200).send({
    "data":{
      "tron":{
        "usd":parseFloat(upd.rate)
      }
    }
  })

});

app.get('/precio/gpxs/usd', async(req,res) => {


  var apiUrl = 'https://data-asg.goldprice.org/dbXRates/USD';
  const response = await fetch(apiUrl)
  .catch(error =>{console.error(error)})
  const json = await response.json();


  res.status(200).send({
    "data":{
      "gpxs":{
        "usd":parseFloat(json.items[0].xauPrice)
      },
      "usd":{
        "gpxs":parseFloat(1/json.items[0].xauPrice)
      }
    }
  })

  //res.status(200).send(data)

});


app.get('/consultar/todos', async(req,res) => {

    usuario = await user.find({}, function (err, docs) {});

    console.log(usuario);

    res.send(usuario);

});


app.get('/consultar/:direccion', async(req,res) => {

    let cuenta = req.params.direccion;
    let respuesta = {};
    usuario = await user.find({ wallet: cuenta }, function (err, docs) {});

    //console.log(usuario);

    var contrato = await TronWeb.contract().at(contractAddress);
    var decimales = await contrato.decimals().call();

    var saldo = await contrato.balanceOf(cuenta).call();
    saldo = parseInt(saldo._hex)/10**decimales;

    var frozen = await contrato.balanceFrozen(cuenta).call();
    frozen = parseInt(frozen._hex)/10**decimales;

    var investor = await contrato.investors(cuenta).call();

    if ( usuario == "" ) {

        respuesta = {
          wallet: cuenta,
          id: parseInt(investor.id),
          active: false,
          txhash: "",
          balance: saldo,
          frozen: frozen,
          deposit: [{
            amount: 0,
            start: 0,
            end: 0,
            finalized: false

          }],
          record: [{
            amount: 0,
            method: 'N/A',
            date: 0,
            done: false,
            dateSend: 0

          }]

       }

        respuesta.status = "200";
        respuesta.txt = "Esta cuenta no está registrada";
        res.status(200).send(respuesta);

    }else{
        respuesta = usuario[0];
        res.status(200).send(respuesta);
    }

});

app.post('/registrar/:direccion', async(req,res) => {

    let cuenta = req.params.direccion;
    let token2 = req.body.token;
    let id = req.body.id;
    let txhash = req.body.txhash
    let respuesta = {};
  
    if ( token == token2 ) {

      usuario = await user.find({ wallet: cuenta }, function (err, docs) {});

        if ( usuario != "" ) {
            respuesta = usuario[0];
            respuesta.txt = "Cuenta ya registrada";

            res.status(303).send(respuesta);

        }else{

             var users = new user({
                id: id,
                active: ids,
                txhash: txhash,
                balance: saldo,
                frozen: frozen,
                deposit: [],
                record: []
            });

            users.save().then(() => {
                respuesta.txt = "Usuario creado exitodamente";
                respuesta.usuario = users;

                res.status(200).send(respuesta);
            });

        }
    }else{
        respuesta.txt = "Ingrese una dirección de TRX";
        res.status(200).send(respuesta);
    }


});

app.post('/actualizar/:direccion', async(req,res) => {

    let cuenta = req.params.direccion;
    let token2 = req.body.token;
    let datos = req.body

    if ( token == token2 ) {
      usuario = await user.updateOne({ wallet: cuenta }, datos);
      res.send(usuario);

    }else{
      res.send("No autorizado");

    }

});

app.get('/actualizar/:direccion', async(req,res) => {

  let cuenta = req.params.direccion;
  let datos = req.body

  var contrato = await TronWeb.contract().at(contractAddress);
  var decimales = await contrato.decimals().call();

  var usuario = await user.find({ wallet: cuenta }, function (err, docs) {});

  var saldo = await contrato.balanceOf(cuenta).call();
  saldo = parseInt(saldo._hex)/10**decimales;

  var frozen = await contrato.balanceFrozen(cuenta).call();
  frozen = parseInt(frozen._hex)/10**decimales;

  var ids = await contrato.ids(cuenta).call();

  var investor = await contrato.investors(cuenta).call();

  var deposito = [];

  if (ids) {

    var deposito1 = await contrato.viewDeposits(cuenta,0).call();

        
    for (let i = 0; i < parseInt(deposito1[4]._hex); i++) {

      deposito1 = await contrato.viewDeposits(cuenta,i).call();

      deposito1[0] = parseInt(deposito1[0]._hex);
      deposito1[1] = parseInt(deposito1[1]._hex);
      deposito1[2] = parseInt(deposito1[2]._hex)/10**decimales;

      if(deposito1[3] && Date.now()/1000 > deposito1[1]){
        //true
        texto = true;
      }else{
        //false

        if( parseInt(investor.paidAt._hex) > deposito1[1]){
          //reclamado
          texto = false;
        }else{
          //no disponible para reclamar en proceso
          texto = false;
        }
        
      }

      deposito2 = {};

      deposito2.amount = deposito1[2];
      deposito2.start = deposito1[0];
      deposito2.end = deposito1[1];
      deposito2.finalized = texto;

      deposito[i] = deposito2;
    }
  }


  if ( usuario == "" ) {

    usuario = {
        wallet: cuenta,
        id: parseInt(investor.id),
        active: ids,
        txhash: "",
        balance: saldo,
        frozen: frozen,
        deposit: [{
          amount: 0,
          start: 0,
          end: 0,
          finalized: false

        }],
        record: [{
          amount: 0,
          method: 'N/A',
          date: 0,
          done: false,
          dateSend: 0

        }]

      }
    res.send(usuario);

  }else{
    datos = usuario[0];

    datos.wallet = cuenta;

    datos.id = parseInt(investor.id);

    datos.active = ids;

    datos.balance = saldo;

    datos.frozen = frozen;

    datos.deposit = deposito;
    
    update = await user.updateOne({ wallet: cuenta }, datos);

    datos.update = update;

    res.send(datos);
  }

  


});



app.listen(port, ()=> console.log('Escuchando Puerto: ' + port))
