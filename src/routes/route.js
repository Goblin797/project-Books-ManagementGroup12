const express = require('express');
const router = express.Router();
//const mongoose = require('mongoose')

const UserController = require("../controller/userController")
const BookController = require("../controller/bookController")
const ReviewController = require("../controller/reviewController")

const middleware = require("../middleware/commonMiddleware")


router.post("/register",UserController.createUser)

router.post("/login",UserController.login)

router.post("/books",middleware.authentication,BookController.createBook)

router.get("/books",middleware.authentication,BookController.getBooks)

router.get("/books/:bookId",middleware.authentication,BookController.getBookReview)

router.put("/books/:bookId",middleware.authentication,BookController.updateBook)

router.delete("/books/:bookId",middleware.authentication,BookController.deleteBooks)

router.post("/books/:bookId/review",ReviewController.createReview)

router.put("/books/:bookId/review/:reviewId",ReviewController.updateReview)

router.delete("/books/:bookId/review/:reviewId",ReviewController.deleteReview)

module.exports = router;