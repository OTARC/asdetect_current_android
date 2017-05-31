var bcrypt = require('bcrypt'),
    db = require('./pghelper'),
    config = require('./config'),
    uuid = require('node-uuid'),
    Q = require('q'),
    validator = require('validator'),
    winston = require('winston'),
    UAParser = require('ua-parser-js'),
    invalidCredentials = 'Invalid email or password';

/**
 * Encrypt password with per-user salt
 * @param password
 * @param callback
 */
function encryptPassword(password, callback) {
    winston.info('encryptPassword()');
    bcrypt.genSalt(10, function (err, salt) {
        if (err) {
            return callback(err);
        }
        bcrypt.hash(password, salt, function (err, hash) {
            return callback(err, hash);
        });
    });
}

/***
 * Compare clear with hashed password
 * @param password
 * @param hash
 * @param callback
 */
function comparePassword(password, hash, callback) {
    winston.info('comparePassword(): checking password for match');
    winston.info('comparePassword(): password is '+password);
    winston.info('comparePassword(): hash is '+hash);

    bcrypt.compare(password, hash, function (err, match) {
        if (err) {
            winston.info('comparePassword(): ERROR - incorrect password');
            return callback(err);
        }
        winston.info('comparePassword(): Match found');
        return callback(null, match);
    });
}

/**
 * Create an access token
 * @param user
 * @returns {promise|*|Q.promise}
 */
function createAccessToken(user) {
    var token = uuid.v4(), 
    deferred = Q.defer();

    
    winston.info('createAccessToken(): user='+user.email__c+' ('+user.externaluserid+') token='+token);

    
    
    db.query('INSERT INTO tokens (userId, externalUserId, token) VALUES ($1, $2, $3)', [user.id, user.externaluserid, token])
        .then(function() {
            deferred.resolve(token);
        })

        .catch(function(err) {
            deferred.reject(err);
        });
    return deferred.promise;
}


function logUserInteraction(externaluserid,itype,idescription,ios) {
    winston.info('logUserInteraction(): externaluserid='+externaluserid+' type='+itype);

    var token = uuid.v4(),  
    deferred = Q.defer();
    db.query('INSERT INTO latrobeasdetect.asdetect_interaction__c (asdetect_contact__r__loyaltyid__c, type__c,description__c,os__c,rest_endpoint_version__c) VALUES ($1, $2, $3, $4,$5)',
                    [externaluserid, itype, idescription,ios,config.restEndpointVersion], true)
    .then(function() {
            deferred.resolve(token);
        })
        .catch(function(err) {
            deferred.reject(err);
        });
    return deferred.promise;
}


function cleanupAccessTokens(user) {
    winston.info('cleanupAccessTokens(): user='+user.email__c);

    var tokenlife=config.asdetect.tokenlife;
    
    var deferred = Q.defer();
    
    db.query('delete from tokens where externaluserid=$1 and now()-created > $2', [user.externaluserid, tokenlife])
        .then(function() {
            //deferred.resolve(token);
        })
        .catch(function(err) {
            deferred.reject(err);
        });
    return deferred.promise;
}



/**
 * Regular login with application credentials
 * @param req
 * @param res
 * @param next
 * @returns {*|ServerResponse}
 */
function login(req, res, next) {
    

    var creds = req.body;

    winston.info('login(): '+creds.email__c);
    winston.info('login(): body - ', creds);
    //console.log(creds);

    var parser = new UAParser();
    var ua = req.headers['user-agent'];
    console.log('user agent is: '+ua);
    
    var os='undefined';

 switch(ua) {
    case 'ASDetect-iPhone-App':
        os='iPhone';
        break;
    case 'ASDetect-iPad-App':
        os='iPad';
        break;
    case 'ASDetect-Android-App':
        os='Android';
        break;
    default:
    //is not an ipad or iphone or android? - lets do the best we can to find out the agent os
        os=parser.setUA(ua).getResult().os.name;
    }

    // Don't allow empty passwords which may allow people to login using the email address of a Facebook user since
    // these users don't have passwords
    if (!creds.password__c || !validator.isLength(creds.password__c, 1)) {
        return res.send(401, invalidCredentials);
    }

    db.query('SELECT id, sfid, firstname__c, lastname__c , email__c, loyaltyid__c as externalUserId, password__c  FROM latrobeasdetect.asdetect_contact__c WHERE email__c=$1', [creds.email__c], true)
        .then(function (user) {
            if (!user) {
                winston.info('login(): ERROR - User '+creds.email__c+ ' not found');
                return res.send(401, invalidCredentials);
            }
            comparePassword(creds.password__c, user.password__c, function (err, match) {
                if (err) return next(err);
                
                //If password matches, log user in and create interaction record
                if (match) {  

                    //updateRESTEndpointVersion(user)
                    //.then
                    
                    //Code has been changed
                    console.log("attempting to update contacts where email__c = $1", [user.email__c]);
                    //db.query('update latrobeasdetect.asdetect_contact__c SET REST_endpoint_version__c=$1 WHERE email__c=$2', [endpoint, user.email__c]);

                    //Update REST Endpoint Version of user - needed for segmented system logic such as email communication
                    console.log('update latrobeasdetect.asdetect_contact__c SET REST_endpoint_version__c=$1 WHERE email__c=$2', [config.restEndpointVersion, user.email__c]);
                    db.query('update latrobeasdetect.asdetect_contact__c SET REST_endpoint_version__c=$1 WHERE email__c=$2', [config.restEndpointVersion, user.email__c]);

                    logUserInteraction(user.externaluserid,'Logged In','Node.js auth',os)    
                    .then             
                    cleanupAccessTokens(user)
                    .then
                    createAccessToken(user)
                    .then(function(token) {
                        return res.send({'user':{'email__c': user.email__c, 'firstname__c': user.firstname__c, 'lastname__c': user.lastname__c, 'sfid': user.sfid, 'hash': user.password__c}, 'token': token});
                        })
                        .catch(function(err) {
                            return next(err);    
                        });


                } else {
                    // Passwords don't match
                    winston.info('login(): ERROR  User '+creds.email__c+ ' incorrect password');
                    return res.send(401, invalidCredentials);
                }
            });
        })
        .catch(next);
};


/**
 * Logout user
 * @param req
 * @param res
 * @param next
 */
function logout(req, res, next) {
    
    var token = req.headers['authorization'];
    
    winston.info('logout(): externaluserid='+req.externalUserId+' token='+token);

    logUserInteraction(req.externalUserId,'Logged Out','Node.js auth','')
    .then
    db.query('delete from tokens WHERE token = $1', [token])
        .then(function () {
            winston.info('Logout successful');
            res.send('OK');
        })
        .catch(next);
};

/**
 * Signup
 * @param req
 * @param res
 * @param next
 * @returns {*|ServerResponse}
 */
function signup(req, res, next) {

    var user = req.body;
    winston.info('signup(): email=['+user.email__c+'] firstname=['+user.firstname__c+
    		'] lastname=['+user.lastname__c+'] country='+user.country__c);

    //console.log(user);

//quick fix for annoying iPhone extraneous space ?added by the keyboard? - 
//trim it off to get through validation
    
    if (!validator.isEmail(user.email__c)) {
        return res.send(400, "Invalid email address");
    }
    if (!validator.isLength(user.firstname__c, 1)) {
        return res.send(400, "First name cannot be blank");
    }
    if (!validator.isLength(user.lastname__c, 1)) {
        return res.send(400, "Last name cannot be blank");
    }
    if (!validator.isLength(user.password__c, 4)) {
        return res.send(400, "Password must be at least 4 characters");
    }

    db.query('SELECT id FROM latrobeasdetect.asdetect_contact__C WHERE lower(email__c)=lower($1)', [user.email__c], true)
        .then(function (u) {
            if(u) {
                winston.info('signup(): ERROR  Email address '+user.email__c+ ' already exists');
                return res.send(400, "Sorry, that email is already registered");
            }
            encryptPassword(user.password__c, function (err, hash) {
                if (err) return next(err);
                createUser(user, hash)
                    .then(function () {
                        return res.send('OK');
                    })
                    .catch(next);
            });
        })
        .catch(next);
};

/**
 * REsetpassword
 * @param req
 * @param res
 * @param next
 * @returns {*|ServerResponse}
 */
function requestResetPassword(req, res, next) {


    var user = req.body,
        token = uuid.v4();
    winston.info('requestResetPassword(): user='+user.email__c);

    console.log('user received resetpassword request for: '+user.email__c);

    if (!validator.isEmail(user.email__c)) {
        return res.send(400, "Invalid email address");
    }
   
    db.query('UPDATE latrobeasdetect.asdetect_contact__C set password_reset_token__c=$1 WHERE email__c=$2', [token,user.email__c], true)
        .then(function () {     
            return res.send('OK');            
        })
        .catch(next);
};

function resetPassword(req, res, next) {

 
    var user = req.body;  
    winston.info('resetPassword(): user='+ user.email__c);      
    console.log('resetting password request for: '+user.email__c);

    encryptPassword(user.password__c, function (err, hash) {
                if (err) return next(err);
                updateUserPassword(user, hash)
                    .then(function () {
                        return res.send('OK');
                    })
                    .catch(next);
            });
};


/**
 * Create a user
 * @param user
 * @param password
 * @returns {promise|*|Q.promise}
 */
function createUser(user, password) {

    winston.info('createUser(): user='+user.email__c+' country='+user.country__c);
    var deferred = Q.defer(),
        //external userid is the EXTERNALID in the ASDetect_Contact__c table - it's critical for hooking up the MCH_Child_Asdetect__C detail records
        //externalUserId = (+new Date()).toString(36); // TODO: more robust UID logic
        externalUserId=uuid.v4();  
    db.query('INSERT INTO latrobeasdetect.asdetect_contact__c (email__c, password__c, firstname__c, lastname__c, country__c, loyaltyid__c) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, firstname__c, lastname__c, email__c, loyaltyid__c as externalUserId',
        [user.email__c, password, user.firstname__c, user.lastname__c, user.country__c, externalUserId], true)

        .then(function (insertedUser) {
            deferred.resolve(insertedUser);
        })
        .catch(function(err) {
            deferred.reject(err);
        });
    return deferred.promise;
};


/**
 * Update user password
 * @param user
 * @param password
 * @returns {promise|*|Q.promise}
 */
function updateUserPassword(user, password) {

    winston.info('updateUserPassword(): user='+user.email__c);
    var deferred = Q.defer();
        
// the loyaltyid__c field identifies the user
    db.query('UPDATE latrobeasdetect.asdetect_contact__c SET password__c=$1, password_reset_token__c=NULL WHERE password_reset_token__c=$2',
        [password, user.password_reset_token__c], true)
        .then(function (updatedUser) {
            deferred.resolve(updatedUser);
        })
        .catch(function(err) {
            deferred.reject(err);
        });
    return deferred.promise;
};


/**
 * Validate authorization token
 * @param req
 * @param res
 * @param next
 * @returns {*|ServerResponse}
 */
function validateToken (req, res, next) {
    
    var token = req.headers['authorization'];
    winston.info('validateToken(): Validating token '+token+ 'for req.path='+req.path);
    
    if (!token) {
        token = req.session['token']; // Allow token to be passed in session cookie
    }
    if (!token) {
        winston.info('validateToken(): ERROR No token provided');
        return res.send(401, 'Invalid token');
    }
    db.query('SELECT * FROM tokens WHERE token = $1', [token], true, true)
        .then(function (item) {
            if (!item) {
                winston.info('validateToken(): ERROR Invalid token');
                return res.send(401, 'Invalid token');
            }
            req.userId = item.userid;
            req.externalUserId = item.externaluserid;
            winston.info('vaidateToken(): Validated token '+token+' for req.path='+req.path+' externaluserid='+req.externalUserId);
            return next();
        })
        .catch(next);
};

function validateTokenForUser (req, res, next) {
    
    var token=req.body.token;
    var email__c=req.body.email__c;

    winston.info('validateToken(): Validating token '+token+ 'for user='+email__c);
 
    db.query('SELECT * FROM tokens t,latrobeasdetect.asdetect_contact__c c WHERE t.externaluserid=c.loyaltyid__c and c.email__c=$1 and t.token = $2', [email__c,token], true, true)
        .then(function (item) {
            if (!item) {
                winston.info('validateToken(): ERROR Invalid token');
                return res.send(401, 'Invalid token');
            }
            winston.info('validateToken(): Validated token '+token+' for req.path='+req.path+' externaluserid='+req.externalUserId);
            return res.send('ok');
        })
        .catch(next);
};






exports.login = login;
exports.logout = logout;
exports.signup = signup;
exports.requestResetPassword=requestResetPassword;
exports.resetPassword=resetPassword;
exports.createUser = createUser;
exports.createAccessToken = createAccessToken;
exports.validateToken = validateToken;
exports.validateTokenForUser=validateTokenForUser;