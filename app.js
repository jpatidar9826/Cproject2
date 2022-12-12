require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const MemoryStore = require('memorystore')(session)
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');

app.use(express.static("public"));

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.DATABASE_KEY, {
  useNewUrlParser: true
});


const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  FirstName: String,
  LastName: String,
  UserEmail: String,
  UserPersonalSite: String,
  UserGithub: String,
  UserLinkedin: String,
  JobTitle: String,
  ResumeSummary: String,
  WorkHistory: [{
    WorkPeriod: String,
    WorkPosition: String,
    WorkEmployer: String,
    WorkSummary: String
  }],
  EducationalQualification: [{
    EQPeriod: String,
    EQDegree: String,
    EQInstitute: String
  }],
  Skills: [{
    SkillName: String
  }],
  Certificates: [{
    CertName: String
  }],
  Hobbies: [{
    HobbName: String
  }],
  Languages: [{
    LangName: String
  }]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req, res) {
  res.render("home1");
});

app.get("/auth/google",
  passport.authenticate('google', {
    scope: ["profile"]
  })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', {
    failureRedirect: "/login2"
  }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });





app.get("/login", function(req, res) {
  res.render("login2");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/secrets", function(req, res) {

  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          res.render("secrets", {
            UserNow: foundUser
          });
        }
      }
    });

  } else {
    res.redirect("/login");
  }


});

app.get("/preview", function(req, res) {

  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          res.render("preview", {
            UserNow: foundUser
          });
        }
      }
    });

  } else {
    res.redirect("/login");
  }


});
app.post("/personal", function(req, res) {
  const sdname = req.body.name;
  const sdlastname = req.body.lastname;
  const sdemail = req.body.lemail;
  const sdpsite = req.body.lpsite;
  const sdgithub = req.body.lgithub;
  const sdlinkein = req.body.llinkedin;
  const sdjobtitle = req.body.jobtitle;
  const sdsummary = req.body.summary;




  User.findById(req.user.id, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {

      if (foundUser) {
        foundUser.FirstName = sdname;
        foundUser.LastName = sdlastname;
        foundUser.UserEmail = sdemail;
        foundUser.UserPersonalSite = sdpsite;
        foundUser.UserGithub = sdgithub;
        foundUser.UserLinkedin = sdlinkein;
        foundUser.JobTitle = sdjobtitle;
        foundUser.ResumeSummary = sdsummary;


        foundUser.save(function() {
          res.redirect("/secrets");
        });
      }
    }
  });
});
/// Work Details Updates and Deletion
app.post("/work", function(req, res) {
    User.findById(req.user.id,function(err,foundUser){
    if (err) {
      console.log(err);
    }else{
      User.findByIdAndUpdate(foundUser.id, {
          $push: {
            "WorkHistory": {
              WorkPeriod: req.body.wperiod,
              WorkPosition: req.body.wjobprofile,
              WorkEmployer: req.body.wimployer,
              WorkSummary: req.body.wsummary

            }}},
            {safe: true,upsert: true},

        function(err, result) {
          console.log(err);
          res.redirect("/secrets");
        });
    }
  });
});
app.post("/workdelete",function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  User.findById(req.user.id,function(err,foundUser){
    if (err) {
      console.log(err);
    }else{
      User.findByIdAndUpdate(foundUser.id, {$pull: { "WorkHistory": {_id : checkedItemId}}},
          {safe: true,upsert: true},
          function(err, result) {
          if (err) {
            console.log(err);
          }else{
            res.redirect("/secrets");
          }
        });
    }
  });
});

/// Educational Updates and Deletion

app.post("/edu", function(req, res) {
    User.findById(req.user.id,function(err,foundUser){
    if (err) {
      console.log(err);
    }else{
      User.findByIdAndUpdate(foundUser.id, {
          $push: {
            "EducationalQualification": {
              EQPeriod: req.body.eperiod,
              EQDegree: req.body.edegree,
              EQInstitute: req.body.einstitute
            }}},
            {safe: true,upsert: true},

        function(err, result) {
          console.log(err);
          res.redirect("/secrets");
        });
    }
  });
});
app.post("/edudelete",function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  User.findById(req.user.id,function(err,foundUser){
    if (err) {
      console.log(err);
    }else{
      User.findByIdAndUpdate(foundUser.id, {$pull: { "EducationalQualification": {_id : checkedItemId}}},
          {safe: true,upsert: true},
          function(err, result) {
          if (err) {
            console.log(err);
          }else{
            res.redirect("/secrets");
          }
        });
    }
  });
});

/// Skills Updates and Deletion
app.post("/skill", function(req, res) {
    User.findById(req.user.id,function(err,foundUser){
    if (err) {
      console.log(err);
    }else{
      User.findByIdAndUpdate(foundUser.id, { $push: { "Skills": { SkillName: req.body.skillname }}},
            {safe: true,upsert: true},

        function(err, result) {
          console.log(err);
          res.redirect("/secrets");
        });
    }
  });
});
app.post("/skilldelete",function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  User.findById(req.user.id,function(err,foundUser){
    if (err) {
      console.log(err);
    }else{
      User.findByIdAndUpdate(foundUser.id, {$pull: { "Skills": {_id : checkedItemId}}},
          {safe: true,upsert: true},
          function(err, result) {
          if (err) {
            console.log(err);
          }else{
            res.redirect("/secrets");
          }
        });
    }
  });
});


/// certificates Details Updates and Deletion
app.post("/certificate", function(req, res) {
    User.findById(req.user.id,function(err,foundUser){
    if (err) {
      console.log(err);
    }else{
      User.findByIdAndUpdate(foundUser.id, { $push: { "Certificates": { CertName: req.body.certname }}},
            {safe: true,upsert: true},

        function(err, result) {
          console.log(err);
          res.redirect("/secrets");
        });
    }
  });
});
app.post("/certidelete",function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  User.findById(req.user.id,function(err,foundUser){
    if (err) {
      console.log(err);
    }else{
      User.findByIdAndUpdate(foundUser.id, {$pull: { "Certificates": {_id : checkedItemId}}},
          {safe: true,upsert: true},
          function(err, result) {
          if (err) {
            console.log(err);
          }else{
            res.redirect("/secrets");
          }
        });
    }
  });
});

/// Hobbies Updates and Deletion
app.post("/hobbie", function(req, res) {
    User.findById(req.user.id,function(err,foundUser){
    if (err) {
      console.log(err);
    }else{
      User.findByIdAndUpdate(foundUser.id, { $push: { "Hobbies": { HobbName: req.body.hobbiename }}},
            {safe: true,upsert: true},

        function(err, result) {
          console.log(err);
          res.redirect("/secrets");
        });
    }
  });
});
app.post("/hobbiedelete",function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  User.findById(req.user.id,function(err,foundUser){
    if (err) {
      console.log(err);
    }else{
      User.findByIdAndUpdate(foundUser.id, {$pull: { "Hobbies": {_id : checkedItemId}}},
          {safe: true,upsert: true},
          function(err, result) {
          if (err) {
            console.log(err);
          }else{
            res.redirect("/secrets");
          }
        });
    }
  });
});



/// Languages Details Updates and Deletion
app.post("/language", function(req, res) {
    User.findById(req.user.id,function(err,foundUser){
    if (err) {
      console.log(err);
    }else{
      User.findByIdAndUpdate(foundUser.id, { $push: { "Languages": { LangName: req.body.langname }}},
            {safe: true,upsert: true},

        function(err, result) {
          console.log(err);
          res.redirect("/secrets");
        });
    }
  });
});
app.post("/langdelete",function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  User.findById(req.user.id,function(err,foundUser){
    if (err) {
      console.log(err);
    }else{
      User.findByIdAndUpdate(foundUser.id, {$pull: { "Languages": {_id : checkedItemId}}},
          {safe: true,upsert: true},
          function(err, result) {
          if (err) {
            console.log(err);
          }else{
            res.redirect("/secrets");
          }
        });
    }
  });
});


app.get("/logout", function(req, res) {
  req.logout(function(err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });

});

app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });

});

app.post("/register", function(req, res) {

  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });

});
const hostname = '0.0.0.0';
const port = 3000;

app.listen(port, hostname , () => {
  console.log('Server running at http://$(hostname):$(port)/');
});
