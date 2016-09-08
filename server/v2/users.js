var db = require('./pghelper'),
    //activities = require('./activities'),
    winston = require('winston');

/**
 * Get user profile
 * @param req
 * @param res
 * @param next
 */
function getProfile(req, res, next) {
    
var userId = req.userId, 
externalUserId = req.externalUserId;
winston.info('getProfile(): externalUserId='+externalUserId);
   
            db.query(
                    'SELECT id, sfid, name, loyaltyid__c,firstname__c , lastname__c , email__c,createddate,preference__c ,size__c,_hc_lastop,_hc_err FROM latrobeasdetect.asdetect_contact__c WHERE loyaltyid__c=$1',
                    [externalUserId], true)
                .then(function (user) {
                    //dtermine what to do with Points later - perhaps we could introduce a membership concept??
                    user.points = 0;
                    user.status = 1;
                    console.log(user);
                    res.send(JSON.stringify(user));
                })
                .catch(next);
       
}

/**
 * Update user profile
 * @param req
 * @param res
 * @param next
 */
function updateProfile(req, res, next) {
winston.info('updateProfile()');
    var user = req.body,
        userId = req.userId,
        externalUserId = req.externalUserId;

    console.log('updating: ' + JSON.stringify(user));

    db.query('update latrobeasdetect.asdetect_contact__c SET firstName__c=$1, lastName__c=$2, Preference__c=$3,size__c=$4  WHERE loyaltyid__c=$5',
            [user.firstname__c, user.lastname__c, user.preference__c,user.size__c, externalUserId])
        .then(function () {
            res.send(user);
        })
        .catch(next);
};

exports.getProfile = getProfile;
exports.updateProfile = updateProfile;