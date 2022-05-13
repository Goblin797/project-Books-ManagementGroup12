const jwt = require("jsonwebtoken");



//............................................MIDDLEWARE-FOR AUTHENTICATION..........................................................

const authentication = async function (req, res, next) {
  try {
    let token = req.headers["x-api-key"] || req.headers["x-Api-Key"];

    if (!token){
        return res.status(401).send({ status: false, msg: "Token must be Present" });
    }

    let decodedtoken = jwt.verify(token, "group12"); // to verify that signature is valid or not
    if(!decodedtoken){
        return res.status(401).send({status:false,message:"authentication failed"})
    }

    req.userId = decodedtoken.userId

    next();
  } catch (err) {
    res.status(500).send({ status:false, message: err.message });
  }
};

module.exports={authentication}