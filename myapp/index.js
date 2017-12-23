// =======================
// get the packages we need ============
// =======================
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var mongoose    = require('mongoose');
var server = require('http').createServer(app);
var socket = require('socket.io');
var io = socket(server);

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var User   = require('./models/user'); // get our mongoose model
var Messages = require('./models/Messages');
var SocketUsers = [];

  
// =======================
// configuration =========
// =======================
var port = process.env.PORT || 3000; // used to create, sign, and verify tokens
mongoose.connect("mongodb://mongo/chatapp"); // connect to database
app.set('superSecret', "mysupersecretabcdefghi12356"); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// =======================
// routes ================
// =======================
// basic route

app.use(function(req,res,next){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS,PUT,PATCH,DELETE');
  res.setHeader('Access-Control-Allow-Headers','X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials',true);
  next();
});

// API ROUTES -------------------
// we'll get to these in a second
var apiRoutes = express.Router();

apiRoutes.post('/register', function(req, res) {

  var user = new User({
    username:req.body.UserName,
    lastname:req.body.LastName,
    Email:req.body.Email,
    name: req.body.Name,
    password: req.body.Password,
    admin: false
  });
  // save the sample user
  user.save(function(err) {
    if (err) throw err;
    res.json({ success: true,username:req.body.UserName,password:req.body.Password,email:req.body.Email,name:req.body.Name,lastname:req.body.LastName });
  });
});

apiRoutes.post('/login', function(req, res) {

  User.findOne({
    username: req.body.UserName
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

      // check if password matches
      if (user.password != req.body.Password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        // if user is found and password is right
        // create a token
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresIn : 60*60*12 // expires in 12 hours
        });
        // return the information including token as JSON
        res.json({
          success: true,
          message:"you have been successfully logged in!",
          token: token
        });
      }
    }
  });
});
/*
apiRoutes.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.send({
        success: false,
        message: 'No token provided.'
    });
  }
});

*/
apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});


app.use('/api', apiRoutes);

app.get('/online',function(req,res){
  res.json(SocketUsers);
});
// =======================
// WebSockets ======
// =======================

io.on('connection',function(socket){
  socket.on('loggedin',function(data){
    var FirstLogin = true;
      for(var i=0;i<SocketUsers.length;i++){
        if(SocketUsers[i].User == data){
          SocketUsers[i].ID = socket.id;
          SocketUsers[i].Online = true;
          FirstLogin = false;
        }
      }
      if(FirstLogin){
        io.emit('message',data+' has been connected!');
        SocketUsers.push({User:data,ID:socket.id,Online:true});
      }
  });

  socket.on("chat",function(data){
    io.emit("message",data);
  });

  socket.on("pm",function(username){
    for(var i=0;i<SocketUsers.length;i++){
      if(SocketUsers[i].User == username){
        socket.broadcast.to(SocketUsers[i].ID).emit('specialmsg', 'for your eyes only');
      }
    }
  });

  socket.on('disconnectuser',function(data){
    for(var i=0;i<SocketUsers.length;i++){
      if(SocketUsers[i].User == data){
        SocketUsers.splice(i,1);
      }
    }
  });

  socket.on('disconnect',function(){
    for(var i=0;i<SocketUsers.length;i++){
      if(SocketUsers[i].ID == socket.id){
        SocketUsers[i].Online = false;
      }
    }
  });
});

// =======================
// start the server ======
// =======================

server.listen(port);
console.log('Magic happens at http://localhost:' + port);
