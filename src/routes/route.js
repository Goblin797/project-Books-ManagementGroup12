const express = require('express');
const router = express.Router();
//const mongoose = require('mongoose')

const UserController = require("../controller/userController")


//const middleware = require("../middleware/commonMiddleware")

router.post("/register",UserController.createUser)

// router.post("/register",authorController.createAuthor)


module.exports = router;