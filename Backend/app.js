const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const {verify} = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const{createAccessToken, createRefreshToken, sendAccessToken, sendRefreshToken,} = require('./utils/tokens.js');
const User = require('./models/user.js');

app.use(cors({origin: "*"}));
app.use(express.json());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

app.post('/register', async (req, res)=>{
    const {name, email, password} = req.body;
    try{
        const newUser = new User({
            name: name,
            email: email,
            password: password,
        });

        data = await newUser.save();
        console.log(data);
    }catch(err){
        console.log(err);
    }

    res.send("User created");
});

app.get('/test', async (req, res)=>{
    try {
    const dummyUser = new User({
      name: "Umar Mahmood",
      email: "umar@test.com",
      password: "password123",   // will be hashed automatically
      duressPin: "9999",         // will be hashed automatically
    });

    await dummyUser.save();

    res.status(201).json({
      message: "Dummy user created successfully",
      user: dummyUser
    });

    const data = await User.find({});
    console.log(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating dummy user" });
  }
});


app.post('/login', async (req, res)=>{
    const {email, password} = req.body;
    console.log("Received");
    console.log(req.body);

    try{
        //Find in database using email and check pass
        //check and handle conditions for user does not exist or wrong password.
        const refreshToken = createAccessToken(user.id);
        const accessToken = createRefreshToken(user.id);
        //hash and store refresh token in database
        //send refresh token as a cookie and accesstoken as a regular response.
        sendRefreshToken(res, refreshToken);
        sendAccessToken(req, res, accessToken);
    }catch(err){
        res.send(err);
    }
    res.send("done");
});

app.post('/logout', (req, res)=>{
    res.clearCookie('refreshToken');
    return res.send({
        message: "Logged Out",
    })
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Could not connect to MongoDB", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));