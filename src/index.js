const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
require("./db/mongo");
const path = require("path");
const { UserCollection, adminCollection } = require("./db/mongo");

const session=require("express-session")


app.use(session({
    secret:"apple12345",
    resave:false,
    saveUninitialized:false,
    cookie:{secure:false}
}))


// Set up paths and view engine
const static_path = path.join(__dirname, "../public");
const viewPath = path.join(__dirname, "views");
app.use(express.static(static_path));
app.set("view engine", "hbs");
app.set("views", viewPath);

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


// Routes
app.get("/", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/admin", (req, res) => {
    res.render("adminlogin");
});


// app.post("/userCreation", async (req, res) => {
//     const { name, email, password, dob, gender } = req.body;
//     let userData;
//     try {
//         // Check if user already exists
//         const userExisting = await UserCollection.findOne({ email: email });
//         if (userExisting) {
//             return res.redirect('/register?message=userExists');
//         } else {
//             // Create new user
//             userData = await UserCollection.create({
//                 name,
//                 email,
//                 password,
//                 dob,
//                 gender
//             });
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).send('Internal Server Error');
//     }
//     // Render home page with user data
//     res.status(201).render("home", { userData });
// });


app.post("/userCreation", async (req, res) => {
    const { fullName, email, password,phone, dob, gender, enrollment, rollnumber, problem, address } = req.body; // Update field names to match the form
    let userData;
    try {
        // Check if user already exists
        const userExisting = await UserCollection.findOne({ email: email });
        if (userExisting) {
            return res.redirect('/register?message=userExists');
        } else {
            // Create new user
            userData = await UserCollection.create({
                fullName,
                email,
                phone,
                password,
                dob,
                gender,
                enrollmentNumber: enrollment,
                rollNumber: rollnumber,
                problemStatement: problem,
                address
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
    // Render home page with user data
    res.status(201).render("home", { userData });
});


app.post('/login_form', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await UserCollection.findOne({ email: email });
        if (user) {

            if (user.password === password) {

                res.status(200).render("home", { userData: user });
            } else {
                res.status(401).redirect('/?message=incorrectPass');
            }
        } else {

            res.status(404).redirect('/?message=userNotFound');
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});
function sessionval(req,res,next){
    if (req.session.userId){
        next();
    }
    else{
        res.send("UNAUTHORISED ACCESS !");
    }
}
app.get("/logout",(req,res)=>{
    req.session.destroy(err=>{
        if(err){
            console.log(err)
        }
        else{
            res.render("login")
        }
    })
})



// admin login 
app.post("/adminlogin", async (req, res) => {
    const { username, password } = req.body;
    try {
        const adminExist = await adminCollection.findOne({ username: username });
        if (adminExist) {
            if (adminExist.password === password) {
                const allUserData = await UserCollection.find();
                res.status(200).render("adminDash", { AllUserData: allUserData });
            } else {
                res.status(401).send("Invalid password");
            }
        } else {
            res.status(404).send("Admin user not found");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Update user data
app.post("/update/:userId", async (req, res) => {
    const userId = req.params.userId;
    const { name, email, phone, dob, gender, enrollment, rollnumber, problem, address, password } = req.body;
    try {
        await UserCollection.findByIdAndUpdate(userId, {
            fullName: name,
            email: email,
            phone: phone,
            dob: dob,
            gender: gender,
            enrollmentNumber: enrollment,
            rollNumber: rollnumber,
            problemStatement: problem,
            address: address,
            password: password
        });
        // Fetch updated user data
        const allUserData = await UserCollection.find();
        // Render admin dashboard with updated user data
        res.status(200).render("adminDash", { AllUserData: allUserData });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});


// Delete user
app.post("/delete/:userId", async (req, res) => {
    const userId = req.params.userId;
    try {
        await UserCollection.findByIdAndDelete(userId);
        // Redirect to admin dashboard after deletion
        const allUserData = await UserCollection.find();
         // Render admin dashboard with updated user data
         res.status(200).render("adminDash", { AllUserData: allUserData });
        } catch (error) {
            console.error("Error:", error);
            res.status(500).send("Internal Server Error");
        }
});
