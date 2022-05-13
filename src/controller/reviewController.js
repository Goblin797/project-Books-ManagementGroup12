const BookModel = require('../models/bookModel')
const ReviewModel = require('../models/reviewModel')
const moment = require('moment')

const mongoose = require('mongoose')

const validateField = (field) => {
    return String(field).trim().match(
        /^[a-zA-Z0-9][a-zA-Z0-9\s\-,?_.]+$/);
};

const createReview = async (req, res) => {
    try {
        let data = req.body
        //bookId validation-----------------------------------------------------------------------------------------------

        let bookId = req.params.bookId
        if (!bookId) {
            return res.status(400).send({ status: false, message: "bookId is required!!!" })
        }

        let isValidbookID = mongoose.Types.ObjectId.isValid(bookId);//check if objectId is objectid
        if (!isValidbookID) {
            return res.status(400).send({ status: false, message: "Book Id is Not Valid" });
        }

        //bookId exist in our database>-------------------------------------------------------------------------
        const book = await BookModel.findOne({ _id: bookId, isDeleted: false })//check id exist in book model
        if (!book)
            return res.status(404).send({ status: false, message: "BookId dont exist" })


        //check for empty body
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "please enter some DETAILS!!!" })
        }
        //reviewedBy--------------------------------------------------------------------------------------------------------

        let reviewedBy = data.reviewedBy
        if (reviewedBy) {
            if (!validateField(reviewedBy)) {
                return res.status(400).send({ status: false, message: "please enter valid name for reviewer!!!" })
            }
        }




        //reviewedAt--------------------------------------------------------------------------------------------------------
        data.reviewedAt = moment(new Date()).format("YYYY-MM-DD")


        //rating--------------------------------------------------------------------------------------------------------------

        let rating = data.rating
        if (!rating) {
            return res.status(400).send({ status: false, message: "please give the ratings!!!" })
        }
        if (!(rating >= 0 && rating <= 5)) {
            return res.status(400).send({ status: false, message: "rating must be is between 0 and 5!!!" })
        }


        //review---------------------------------------------------------------------------------------------------------------
        data.bookId = bookId
        const review = await ReviewModel.create(data)

        book.reviews = book.reviews + 1
        book.save()

        let BookWithReview = JSON.parse(JSON.stringify(book))

        BookWithReview.reviewsData = review



        return res.status(201).send({ status: true, message: "successfully added review", data: BookWithReview })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

const updateReview = async (req, res) => {
    try {
        let bookId = req.params.bookId

        let userId = req.userId   //req.userId is the userId present in jwt token
        //bookId validation-------------------------------------------------------------------
        if (!bookId) {
            return res.status(400).send({ status: false, message: "Please give book id" })
        }
        let isValidbookID = mongoose.Types.ObjectId.isValid(bookId);//check if objectId is objectid
        if (!isValidbookID) {
            return res.status(400).send({ status: false, message: "Book Id is Not Valid" });
        }

        //bookId exist in our database>-------------------------------------------------------------------------
        const book = await BookModel.findOne({ _id: bookId, isDeleted: false })//check id exist in book model
        if (!book)
            return res.status(404).send({ status: false, message: "BookId dont exist" })

        //review----------------------------------------------------------------------------------------------------
        let reviewId = req.params.reviewId
        let isValidreviewID = mongoose.Types.ObjectId.isValid(reviewId);//check if objectId is objectid
        if (!isValidreviewID) {
            return res.status(400).send({ status: false, message: "Review Id is Not Valid" });
        }

        const updateReview = await ReviewModel.findOne({ _id: reviewId, bookId: bookId, isDeleted: false })//check id exist in review model
        if (!updateReview)
            return res.status(404).send({ status: false, message: `reviewId dont exist or reviews not found for ${book.title} book` })


        //validation of body
        let data = req.body
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "please enter some details for updation" })
        }

        //if rating is given
        let rating = data.rating
        if (rating) {

            if (!(rating >= 0 && rating <= 5)) {
                return res.status(400).send({ status: false, message: "rating must be is between 0 and 5!!!" })
            }

            updateReview.rating = rating   //upation for rating
        }

        //if review is given
        let review = data.review
        if(review){
            if(review.trim().length<0){
                return res.status(400).send({ status: false, message: "you had enter a empty review!!" })
            }
            updateReview.review = review
        }

        //if reviewer name is given
        let reviewerName = data.reviewedBy
        if(reviewerName){
            if(reviewerName.trim().length==0){
                return res.status(400).send({ status: false, message: "you had enter a empty reviewer's name!!" })
            }
            updateReview.reviewedBy = reviewerName
        }

        //saving the upadtion done above for review
        updateReview.save()


        let BookWithReview = JSON.parse(JSON.stringify(book))

        BookWithReview.reviewsData = updateReview



        return res.status(200).send({ status: true, message: "successfully updated review", data: BookWithReview })


    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

const deleteReview = async (req,res) =>{
    try
    {
        let bookId = req.params.bookId

        //bookId validation-------------------------------------------------------------------
        if (!bookId) {
            return res.status(400).send({ status: false, message: "Please give book id" })
        }
        let isValidbookID = mongoose.Types.ObjectId.isValid(bookId);//check if objectId is objectid
        if (!isValidbookID) {
            return res.status(400).send({ status: false, message: "Book Id is Not Valid" });
        }

        //bookId exist in our database>-------------------------------------------------------------------------
        const book = await BookModel.findOne({ _id: bookId, isDeleted: false })//check id exist in book model
        if (!book)
            return res.status(404).send({ status: false, message: "BookId dont exist" })



        //review----------------------------------------------------------------------------------------------------
        let reviewId = req.params.reviewId
        let isValidreviewID = mongoose.Types.ObjectId.isValid(reviewId);//check if objectId is objectid
        if (!isValidreviewID) {
            return res.status(400).send({ status: false, message: "Review Id is Not Valid" });
        }

        const deleteReview = await ReviewModel.findOne({ _id: reviewId, bookId: bookId, isDeleted: false })//check id exist in review model
        if (!deleteReview)
            return res.status(404).send({ status: false, message: `reviewId dont exist or reviews not found for ${book.title} book` })

        //deletion of review
        deleteReview.isDeleted=true
        deleteReview.save()    //saving isdeleted = true

        book.reviews = book.reviews-1  //decrement review count by 1
        book.save()

        let BookWithReview = JSON.parse(JSON.stringify(book))   //convert mongoose object to object

        BookWithReview.reviewsData = deleteReview    //adding property reviewsdata



        return res.status(200).send({ status: true, message: "successfully deleted review", data: BookWithReview })

    }
    catch(err){
        return res.status(500).send({status:false ,message:err.message})
    }
}



module.exports = { createReview, updateReview ,deleteReview}