var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server,{});
var fs = require('fs');
var database = require('./modules/database');
var update_countries = require('./modules/update_countries');
var port = 80;

var username = 'ignacy';
var password = '12345';

var passwordHash = require('password-hash');
var hashedPassword = passwordHash.generate(password);

console.log(hashedPassword);
//app.use(express.static(__dirname)); // Current directory is root
app.use('/', express.static(__dirname + '/public_html')); //  "public" off of current is root
server.listen(port);
console.log("working on port " + port);

app.get('/', function (req, res) {
  res.writeHead(301,
  {Location: '/user/login/'}
  );
  res.end();
})




 function isUserValid(username, password) {
   var value = false;
   connection = database.connect();
   var sql = 'SELECT ID FROM Users ';
   sql += 'WHERE nick = ' + connection.escape(username);
   sql += ' AND password = ' + connection.escape(password);
      connection.query(sql,
        function (error, results, fields) {
          if (error) { return false;};
        console.log('The solution is: ', results[0].ID);
        value = true;

     });
  connection.end();

}

function fetch_data(data, callback) {
  connection = database.connect();
  var sql = 'SELECT ID FROM Users ';
  sql += 'WHERE nick = ' + connection.escape(data.username);
  sql += ' AND password = ' + connection.escape(data.password);
     connection.query(sql,
       function (error, results, fields) {
         if (error) {
           callback(false);
         };
        if (results.length > 0) {
          callback(true);

        } else {
          callback(false);

        }

    });
 connection.end();

}

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

SOCKETS_LIST = {};
io.on('connection', function (socket) {
  socket.id = Math.random();
  SOCKETS_LIST[socket.id] = socket;
  console.log("client connected");
    socket.on('hello', function (data) {
      console.log("hello " + data);
      socket.emit("server_msg", {
        msg : "server_hello",
      });
    });
    socket.on('login', function(data){
      fetch_data(data, function(valid){
        if(valid) {
            socket.emit("login_response", data.username);
        } else {
            socket.emit("login_response", "login_fail");
        }
      });
    });
    socket.on('unit_locate_data', function(data) {
     update_countries.unit_to_country(data, function(valid){
       if(valid) {
          console.log("work");
           socket.emit("update_state", "succes");
       } else {
         console.log("fail");
           socket.emit("update_state", "fail");
       }
     });
    });
});

setInterval(function(){
  for (var i in SOCKETS_LIST ){
    socket = SOCKETS_LIST[i];
    socket.emit("server_msg", {
      msg : "server_hello",
    });
  }},1000);
// function setInterval() {
//
// }
