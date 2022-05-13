const BookModel = require("../models/bookModel")
const UserModel=require("../models/userModel")
const ReviewModel = require("../models/reviewModel")

const mongoose=require('mongoose');
const { resetWatchers } = require("nodemon/lib/monitor/watch");

const validateField = (field) => {
    return String(field).trim().match(
        /^[a-zA-Z0-9][a-zA-Z0-9\s\-,?_.]+$/);
};

const createBook = async (req, res) => {
    try {
       

        const data = req.body
        const userId = req.userId

        //check for empty body
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "please enter some DETAILS!!!" })
        }
        //title--------------------------------------------------------------------------------------------

        if (!data.title) {
            return res.status(400).send({ status: false, message: "TITLE is required!!!" })
        }
        if (!validateField(data.title)) {
            return res.status(400).send({ status: false, message: "format of title is wrong!!!" })
        }
        //check for unique title
        const title = await BookModel.findOne({ title: data.title })
        if (title) {
            return res.status(400).send({ status: false, message: "title already exist" })
        }

        //excerpt----------------------------------------------------------------------------------------
        if (!data.excerpt) {
            return res.status(400).send({ status: false, message: "EXCERPT is required!!!" })
        }
        if (!validateField(data.excerpt)) {
            return res.status(400).send({ status: false, message: "format of excerpt is wrong!!!" })
        }

        //userId------------------------------------------------------------------------------------------
        data.userId = userId

        //ISBN----------------------------------------------------------------------------------------------
        if (!data.ISBN) {
            return res.status(400).send({ status: false, message: "ISBN is required!!!" })
        }
        let validateISBN = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/
        if (!validateISBN.test(data.ISBN)) {
            return res.status(400).send({ status: false, message: "enter valid ISBN number" })
        }
        //check for unique ISBN
        const ISBN = await BookModel.findOne({ ISBN: data.ISBN })
        if (ISBN) {
           return res.status(400).send({ status: false, message: "ISBN already exist" })
        }


        //category-----------------------------------------------------------------------------------------
        if (!data.category) {
            return res.status(400).send({ status: false, message: "CATEGORY is required!!!" })
        }
        if (!validateField(data.category)) {
            return res.status(400).send({ status: false, message: "format of category is invalid!!!" })
        }

        //subcategory--------------------------------------------------------------------------------------

        if (!Array.isArray(data.subcategory)) {
            return res.status(400).send({ status: false, message: "SUBCATEGORY is type is invalid!!!" })
        }
        const t = data.subcategory.filter((e) => e.trim().length != 0)
        data.subcategory = t

        if (data.subcategory.length == 0) {
            return res.status(400).send({ status: false, message: "SUBCATEGORY cannot be empty!!!" })

        }


        //reviews-------------------------------------------------------------------------------------------
        let reviews = data.reviews
        if (reviews) {
            if (!(reviews >= 0 && reviews <= 5)) {
                return res.status(400).send({ status: false, message: "rewiew rating is between 0 and 5!!!" })
            }
        }

        //deletedAt-------------------------------------------------------------------------------------------


        //releasedAt-----------------------------------------------------------------------------------------
        if (!data.releasedAt) {
            return res.status(400).send({ status: false, message: "RELEASED DATE is required!!!" })
        }
        let validateDate = /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/gm
        if (!validateDate.test(data.releasedAt)) {
            return res.status(400).send({ status: false, message: "date must be in format  YYYY-MM-DD!!!" })

        }

        const book = await BookModel.create(data)
        return res.status(201).send({status:true , message:"success" , data:book})
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

//---------------------------------------------------get books ------------------------------------------------------------------------

const getBooks = async function (req, res) {  //get book using filter query params
    try {
        const userId = req.query.userId;
        const category = req.query.category;
        const subcategory = req.query.subcategory;
        const obj = {
            isDeleted: false,
        };
        if (category)
            obj.category = category;
        if (userId)
            obj.userId = userId;
        if (subcategory)
            obj.subcategory = subcategory;

        if (obj.userId) {
            let isValidauthorID = mongoose.Types.ObjectId.isValid(obj.userId);//check if objectId is objectid
            if (!isValidauthorID) {
                return res.status(400).send({ status: false, message: "User Id is Not Valid" });
            }

            const id = await UserModel.findById(obj.userId)//check id exist in user model
            if (!id)
                return res.status(404).send({ status:false,msg: "UserId dont exist" })
        }

        const data = await BookModel.find(obj).select({deletedAt:0,isDeleted:0,createdAt:0,updatedAt:0,__v:0,subcategory:0,ISBN:0});
        if (data.length == 0) {
            return res.status(404).send({ status: false, msg: "Books not found" });
        }else{
        return res.status(200).send({ status: true, data: data });
        }
    } catch (err) {
       res.status(500).send({ status: false, message: err.message });
    }
};

const getBookReview = async (req,res) => {
    try
    {
        let bookId  = req.params.bookId   //getting bookid from path params
        //let userId = req.userId
        if(!bookId){
            return res.status(400).send({status:false , message: "Please give book id"})
        }
        let isValidbookID = mongoose.Types.ObjectId.isValid(bookId);//check if objectId is objectid
        if (!isValidbookID) {
            return res.status(400).send({ status: false, message: "Book Id is Not Valid" });
        }

        const book = await BookModel.findOne({_id:bookId,isDeleted:false}).select({__v:0,ISBN:0}).lean()//check id exist in book model
        if (!book)
            return res.status(404).send({ status:false,message: "BookId dont exist" })

      
        //find because there can be many reviews------------------------------------------------------------------------
        const review = await ReviewModel.find({bookId:book._id}).select({isDeleted:0,createdAt:0,updatedAt:0,__v:0})

        book.reviewsData = review   //adding new review property inside book object

        return res.status(200).send({status:true, message : "Book Lists" , data:book})
    }
    catch(err){
        return res.status(500).send({status:false , message:err.message})  
    }
}

const updateBook = async (req,res) => {
    try
    {
        let bookId  = req.params.bookId   //getting bookid from path params
        let userId = req.userId   //req.userId is the userId present in jwt token
        //bookId validation-------------------------------------------------------------------
        if(!bookId){
            return res.status(400).send({status:false , message: "Please give book id"})
        }
        let isValidbookID = mongoose.Types.ObjectId.isValid(bookId);//check if objectId is objectid
        if (!isValidbookID) {
            return res.status(400).send({ status: false, message: "Book Id is Not Valid" });
        }
        
        //bookId exist in our database>-------------------------------------------------------------------------
        const book = await BookModel.findOne({_id:bookId, isDeleted:false})//check id exist in book model
        if (!book)
            return res.status(404).send({ status:false,message: "BookId dont exist" })

        //authorization-------------------------------------------------------------------------------
        if(book.userId!=userId){
            return res.status(403).send({status:false , message: "you cannot access others book data"})
        }
        //----------------------------------------------------------------------------------------------------
        let data = req.body
         //check for empty body
         if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "please enter some DETAILS!!!" })
        }

       
        //title--------------------------------------------------------------------------------------------

        if (!data.title) {
            return res.status(400).send({ status: false, message: "TITLE is required!!!" })
        }
        if (!validateField(data.title)) {
            return res.status(400).send({ status: false, message: "format of title is wrong!!!" })
        }
        //check for unique title
        const title = await BookModel.findOne({ title: data.title })
        if (title) {
            return res.status(400).send({ status: false, message: `title ${data.title} already taken ` })
        }

        //excerpt-----------------------------------------------------------------------------------------
        if (!data.excerpt) {
            return res.status(400).send({ status: false, message: "EXCERPT is required!!!" })
        }
        if (!validateField(data.excerpt)) {
            return res.status(400).send({ status: false, message: "format of excerpt is wrong!!!" })
        }

     //releasedAt-----------------------------------------------------------------------------------------
     let releasedAt=data.releasedate
     if (!releasedAt) {
        return res.status(400).send({ status: false, message: "RELEASED DATE is required!!!" })
    }
    let validateDate = /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/gm
    if (!validateDate.test(releasedAt)) {
        return res.status(400).send({ status: false, message: "date must be in format  YYYY-MM-DD or invalid!!!" })

    }

        //ISBN---------------------------------------------------------------------------------------------
        if (!data.ISBN) {
            return res.status(400).send({ status: false, message: "ISBN is required!!!" })
        }
        let validateISBN = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/
        if (!validateISBN.test(data.ISBN)) {
            return res.status(400).send({ status: false, message: "enter valid ISBN number" })
        }
        //check for unique ISBN
        const ISBN = await BookModel.findOne({ ISBN: data.ISBN })
        if (ISBN) {
           return res.status(400).send({ status: false, message: `ISBN number ${data.ISBN} already taken` })
        }

        //updation process---------------------------------------------------------------------------------

        book.title=data.title
        book.excerpt=data.excerpt
        book.ISBN=data.ISBN
        book.releasedAt=releasedAt

        book.save()

        return res.status(200).send({status:true, message:"updated book", data:book})


    }
    catch(err)
    {
        return res.status(500).send({status:false , message:err.message})  
    }
}

const deleteBooks = async (req, res) => {
    try
    {
        let bookId  = req.params.bookId   //getting bookid from path params
        let userId = req.userId
        if(!bookId){
            return res.status(400).send({status:false , message: "Please give book id"})
        }

        let isValidbookID = mongoose.Types.ObjectId.isValid(bookId);//check if objectId is objectid
        if (!isValidbookID) {
            return res.status(400).send({ status: false, message: "Book Id is Not Valid" });
        }

        const book = await BookModel.findOne({_id:bookId,isDeleted:false})//check id exist in book model
        if (!book)
            return res.status(404).send({ status:false,message: "BookId dont exist" })

        //authorization-------------------------------------------------------------------------------
        if(book.userId!=userId){
            return res.status(403).send({status:false , message: "you cannot access others book data"})
        }

        //reviews of that particular book should also be deleted
        
        const review=await ReviewModel.updateMany({bookId:bookId,isDeleted:false} ,{ $set: {isDeleted:true}})
        
        book.isDeleted=true
        book.deletedAt=new Date()

        book.save()

        return res.status(200).send({status:true, message:"deleted book", deletedbook : `${book.title} book is deleted along with ${review.matchedCount} reviews`})
}
    catch(err){
        return res.status(500).send({status:false , message:err.message})  
    }
}

module.exports = { createBook ,getBooks ,getBookReview ,updateBook ,deleteBooks}