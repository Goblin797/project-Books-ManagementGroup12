const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const UserModel = require("../models/userModel")

const createUser = async (req, res) => {
    try {
        //name validation name can only contain [a-z],[A-Z]and space
        const validateName = (name) => {
            return String(name).trim().match(
                /^[a-zA-Z][a-zA-Z\s]+$/);
        };

        //email validation function
        const validateEmail = (email) => {
            return String(email).trim()
                .toLowerCase()
                .match(
                    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                );
        };

        //password validation function must contain capital,number and special symbol
        const validatePassword = (password) => {
            return String(password).trim()
                .match(
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/
                );
        };

        //MOBILE NUMBER VALIDATION must be number start with 6,7,8,9 and of 10 digit 
        const validateNumber = (number) => {
            return String(number).trim().match(
                ///^(\+\d{1,3}[- ]?)?\d{10}$/
                /^[6-9]\d{9}$/gi
            )
        }

        //title be must be only of these Mr,Mrs,Miss
        const validateTitle = (title) => {
            return ["Mr", "Mrs", "Miss"].indexOf(title) != -1
        }

        //---------------------------------------FUNCTIONS------------------------------------------------------
        const data = req.body

        //check for empty body
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "please enter some DETAILS!!!" })
        }

        //title is mandatory and must be in [Mr , Mrs , Miss]------------------------------------------------
        if (!data.title) {
            return res.status(400).send({ status: false, message: "TITLE is required!!!" })
        }
        if (!validateTitle(data.title)) {
            return res.status(400).send({ status: false, message: "TITLE is INVALID!!!" })
        }

        //check for user name---------------------------------------------------------------------------------
        if (!data.name) {
            return res.status(400).send({ status: false, message: "NAME is required!!!" })
        }
        if (!validateName(data.name)) {
            return res.status(400).send({ status: false, message: "NAME is INVALID!!!" })
        }

        //phone no---------------------------------------------------------------------------------------------

        if (!data.phone) {
            return res.status(400).send({ status: false, message: "User phone number is missing" })
        }
        if (!validateNumber(data.phone)) {
            return res.status(400).send({ status: false, message: "User phone number is INVALID" })
        }
        //check for unique phone number
        const phone = await UserModel.findOne({ phone: data.phone })
        if (phone) {
            return res.status(400).send({ status: false, message: "User phone number already exists" })

        }

        //email--------------------------------------------------------------------------------------------------
        if (!data.email)
            return res.status(400).send({ status: false, message: "email is missing" })

        if (!validateEmail(data.email)) {
            return res.status(400).send({ status: false, message: "Invaild E-mail id " })//email validation
        }
        //check for unique email
        const email = await UserModel.findOne({ email: data.email })
        if (email) {
            return res.status(400).send({ status: false, message: "email already exist" })
        }

        //password----------------------------------------------------------------------------------------------
        if (!data.password)
            return res.status(400).send({ status: false, message: "password is missing" })

        if (data.password.length < 8 || data.password.length > 15)
            return res.status(400).send({ message: "password length must be minimum of 8 and max of 15 character" })

        if (!validatePassword(data.password)) {
            return res.status(400).send({ status: false, message: "password should contain atleast one number,one special character and one capital letter" })//password validation
        }

        //hashing password and storing in database
        const hashPassword = await bcrypt.hash(data.password, 10)
        data.password = hashPassword


        //address---------------------------------------------------------------------------------------------------
        let street = data.address.street
        let city = data.address.city
        let pincode = data.address.pincode
        if(street){
            let validateStreet = /^[a-zA-Z0-9]/
            if (!validateStreet.test(street)) {
                return res.status(400).send({ status: false, message: "enter valid street name" })
            }
        }

        if (city) {
            let validateCity = /^[a-zA-z',.\s-]{1,25}$/gm
            if (!validateCity.test(city)) {
                return res.status(400).send({ status: false, message: "enter valid city name" })
            }
        }
        if (pincode) {
            let validatePincode = /^[1-9]{1}[0-9]{2}\s{0,1}[0-9]{3}$/gm      //must not start with 0,6 digits and space(optional)
            if (!validatePincode.test(pincode)) {
                return res.status(400).send({ status: false, message: "enter valid pincode" })
            }
        }



        //create user--------------------------------------------------------------------------------------------------
        const user = await UserModel.create(data)
        return res.status(201).send({ status: true, message: "success", data: user })

    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}


//login controller

const login = async function (req, res) {
    try {
        const data = req.body

        //check for empty body
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "please enter emailId and password" })//details is given or not
        }

        let email = data.email
        let password = data.password
        //email missing
        if (!email)
            return res.status(400).send({ status: fasle, message: "email is missing" })

        //password missing
        if (!password)
            return res.status(400).send({ status: false, message: "password is missing" })

        //check if emial is present in our collection
        const match = await UserModel.findOne({ email: email })//verification

        if (!match)
            return res.status(401).send({ status: false, msg: "INVALID EMAIL" })

        let p = await bcrypt.compare(password, match.password)
        if (!p)
            return res.status(401).send({ status: false, msg: "invalid password" })

        //if user successful login provise the user with jwt token
        const token = jwt.sign(
            {
                userId: match._id,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60 //login successfully give the token
            },
            "group12" //secret key
        )
        
        res.setHeader("x-api-key", token)
        res.status(200).send({ status: true, message: 'user login successful', data: token })
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}
module.exports = { createUser ,login}