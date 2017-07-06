var express = require('express'),
    bodyParser     = require('body-parser'),
    methodOverride = require('method-override'),
    compression = require('compression'),
    http = require('http'),
    path = require('path'),
    winston = require('winston'),
    sqlinit = require('./server/sqlinit'),
    util = require('util'),
    // App modules
    users = require('./server/users'),
    cases = require('./server/cases'),
    auth = require('./server/auth'),
    facebook = require('./server/facebook'),
    s3signing = require('./server/s3signing'),
    utilities=require('./server/utilities.js'),
    interactions = require('./server/interactions'),
    child=require('./server/child'),
    assessment=require('./server/assessment');

    //V2 App modules
    /*users_v2 = require('./server/v2/users'),
    cases_v2 = require('./server/v2/cases'),
    auth_v2 = require('./server/v2/auth'),
    facebook_v2 = require('./server/v2/facebook'),
    s3signing_v2 = require('./server/v2/s3signing'),
    utilities_v2=require('./server/v2/utilities.js'),
    interactions_v2 = require('./server/v2/interactions'),
    child_v2=require('./server/v2/child'),
    assessment_v2=require('./server/v2/assessment');
    */


app = express();

app.set('port', process.env.PORT || 5000);

app.use(compression());
app.use(bodyParser({
    uploadDir: __dirname + '/uploads',
    keepExtensions: true
}));
app.use(methodOverride());

app.use(express.static(path.join(__dirname, './client')));

app.use(function(err, req, res, next) {
    console.log(err.stack);
    res.send(500, err.message);
});

//V1 Endpoint methods
//

app.post('/login', auth.login);
app.post('/logout', auth.validateToken, auth.logout);

app.post('/signup', auth.signup);
app.post('/requestresetpassword', auth.requestResetPassword);
app.post('/resetpassword', auth.resetPassword);

app.post('/fblogin', facebook.login);
app.get('/users/me', auth.validateToken, users.getProfile);
app.put('/users/me', auth.validateToken, users.updateProfile);
app.post('/cases', auth.validateToken, cases.createCase);
//app.get('/nfrevoke', cases.revokeToken);
app.post('/s3signing', auth.validateToken, s3signing.sign);

// ASDETECT REST
// the presence of validateToken indicates the inspection of the authorization header for a valid token
app.get('/child', auth.validateToken,child.getAll);
app.get('/child/:id', auth.validateToken,child.getById);
app.post('/child', auth.validateToken, child.addChild);
//app.post('/updateChild', auth.validateToken, child.updateChild);
//app.post('/deleteChild', auth.validateToken, child.deleteChild);
app.get('/assessment', auth.validateToken, assessment.getAll);
app.get('/assessment/:id', auth.validateToken, assessment.getById);
app.post('/assessment/12m',auth.validateToken, assessment.create12mAssessment);
app.post('/assessment/18m',auth.validateToken, assessment.create18mAssessment);
app.post('/assessment/24m',auth.validateToken, assessment.create24mAssessment);
app.post('/assessment/35y',auth.validateToken, assessment.create35yAssessment);
app.get('/interactions', auth.validateToken, interactions.getItems);
app.post('/interactions', auth.validateToken, interactions.addItem);
app.get('/deleteChildrenAndTests', auth.validateToken,utilities.deleteChildrenAndTests);
app.get('/deleteOldTokens', auth.validateToken,utilities.deleteOldTokens);
app.get('/deleteContactAndChildrenAndTests', auth.validateToken,utilities.deleteContactAndChildrenAndTests);
app.get('/deleteContactAndChildrenAndTestsByLastName/:lastname', auth.validateToken,utilities.deleteContactAndChildrenAndTestsByLastName);
app.delete('/interactions', auth.validateToken, interactions.deleteAll);
app.post('/validateTokenForUser', auth.validateTokenForUser);




//V2 Endpoint methods
//
/*
app.post('/v2/login', auth_v2.login);
app.post('/v2/logout', auth_v2.validateToken, auth_v2.logout);

app.post('/v2/signup', auth_v2.signup);
app.post('/v2/requestresetpassword', auth_v2.requestResetPassword);
app.post('/v2/resetpassword', auth_v2.resetPassword);

app.post('/v2/fblogin', facebook_v2.login);
app.get('/v2/users/me', auth_v2.validateToken, users_v2.getProfile);
app.put('/v2/users/me', auth_v2.validateToken, users_v2.updateProfile);
app.post('/v2/cases', auth_v2.validateToken, cases_v2.createCase);
//app.get('/nfrevoke', cases.revokeToken);
app.post('/v2/s3signing', auth_v2.validateToken, s3signing_v2.sign);

// ASDETECT REST
// the presence of validateToken indicates the inspection of the authorization header for a valid token
app.get('/v2/child', auth_v2.validateToken,child_v2.getAll);
app.get('/v2/child/:id', auth_v2.validateToken,child_v2.getById);
app.post('/v2/child', auth_v2.validateToken,child_v2.addChild);
app.get('/v2/assessment', auth_v2.validateToken, assessment_v2.getAll);
app.get('/v2/assessment/:id', auth_v2.validateToken, assessment_v2.getById);
app.post('/v2/assessment/12m',auth_v2.validateToken,assessment_v2.create12mAssessment);
app.post('/v2/assessment/18m',auth_v2.validateToken,assessment_v2.create18mAssessment);
app.post('/v2/assessment/24m',auth_v2.validateToken,assessment_v2.create24mAssessment);
app.post('/v2/assessment/35y',auth_v2.validateToken,assessment_v2.create35yAssessment);
app.get('/v2/interactions', auth_v2.validateToken, interactions_v2.getItems);
app.post('/v2/interactions', auth_v2.validateToken, interactions_v2.addItem);
app.get('/v2/deleteChildrenAndTests',auth_v2.validateToken,utilities_v2.deleteChildrenAndTests);
app.get('/v2/deleteOldTokens',auth_v2.validateToken,utilities_v2.deleteOldTokens);
app.get('/v2/deleteContactAndChildrenAndTests',auth_v2.validateToken,utilities_v2.deleteContactAndChildrenAndTests);
app.get('/v2/deleteContactAndChildrenAndTestsByLastName/:lastname',auth_v2.validateToken,utilities_v2.deleteContactAndChildrenAndTestsByLastName);
app.delete('/v2/interactions', auth_v2.validateToken, interactions_v2.deleteAll);
app.post('/v2/validateTokenForUser',auth_v2.validateTokenForUser);
*/

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});