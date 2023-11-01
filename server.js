//imports
const express = require("express");
const app = express();
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const session = require('express-session');
const flash = require('express-flash');
const passport = require("passport");


const initializePassport = require("./passportConfig");

initializePassport(passport);



// middlewares
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: false}));
app.use(session({
    secret: 'secret',

    resave: false, 

    saveUninitialized: false
})
);
app.use(passport.initialize())
app.use(passport.session())

app.use(flash({

}))




//routes
app.get('/', (req, res)=>{
    res.render("index")
});

app.get('/users/register', (req, res)=>{
    res.render("register")
});

app.get('/users/login', (req, res)=>{
    res.render("login")
});

app.get('/users/dashboard', (req, res)=>{
    res.render("dashboard", {user: req.user.name})
});



app.get('/users/logout', (req, res) => {
    // Logging out with a callback function
    req.logout((err) => {
        if (err) {
            // Handle any errors here
        }
        console.log("Logged out");
    });

    req.flash('success_msg', "You have logged out");
    res.redirect("/users/login");
});

// app.get('/users/logout', (req, res)=>{
//     // Logging out with a callback function
// req.logout((err) => {
//     if (err) {
//         // Handle any errors here
//     }
//     console.log("Logged out");
// });

//     req.flash('success_msg', "You have logged out");
//     res.redirect("/users/login")
// })

app.post('/users/register', async (req, res)=>{
    let {name, email, password, password2} = req.body;

    console.log({name, email, password, password2});

    let errors = [];

    if (!name || !email || !password || !password2) {
        errors.push({message: "Please enter all fields"})    
    }

    if (password.length < 8) {
        errors.push({message: "Passwords should be at least 6 characters"})
    }

    if (password != password2) {
        errors.push({message: "Passwords do not match"})
    }

    if (errors.length > 0) {
        res.render('register', { errors })
    }else{

        let hashedPassword = await bcrypt.hash(password, 10)
        console.log(hashedPassword);


        // to check if the user already exists
        pool.query(
            `SELECT * FROM users WHERE email = $1`, [email], (err, results)=>{
                if (err) {
                    throw err
                }

                console.log(results.rows);

                if (results.rows.length > 0) {
                    errors.push({message: "Email already registered"});
                    res.render('register', { errors })
                } else{
                    pool.query(
                        `INSERT INTO users (name, email, password)
                        VALUES ($1, $2, $3)
                        RETURNING id, password`, [name, email, hashedPassword], (err, results) =>{
                            if(err){
                                throw err
                            }
                            console.log(results.rows);
                            req.flash('success_msg', "You are now registered. Please log in");
                            res.redirect("/users/login")
                        }
                    )
                }
            }
)
    }

});

app.post('/users/login', passport.authenticate('local',{
    successRedirect: "/users/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true
}))

app.listen(400, ()=>{
    console.log("Server runing on port 400");
})