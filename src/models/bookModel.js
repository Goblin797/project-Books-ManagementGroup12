const mongoose = require('mongoose')

const bookSchema = new mongoose.Schema({
    title:{
        type:String,
        required:"title is required",
        unique:"title must be unique",
        trim:true
    },
    excerpt:{
        type:String,
        required:"excerpt is required",
        trim:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:"userId is required",
        ref:'User',
        trim:true
    },
    ISBN:{
        type:String,
        required:"ISBN is required",
        unique:"ISBN must be unique",
        trim:true
    },
    category:{
        type:String,
        required:"category is required",
        trim:true
    },
    subcategory:{
        type:[String],
        required:"subcategory is required",
        trim:true
    },
    reviews:{
        type:Number,
        default:0,
        trim:true
    },
    deletedAt:{
        type:Date
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    releasedAt:{
        type:Date,
        required:"true",
        trim:true
    }
},{timestamps:true})

module.exports = mongoose.model('Book',bookSchema)