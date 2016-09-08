var db = require('./pghelper'),
    Q = require('q');
    //wallet = require('./wallet'),
    //wishlist = require('./wishlist');

/**
 * Add interaction
 * @param req
 * @param res
 * @param next
 */
function addItem(req, res, next) {
    var userId = req.externalUserId,
        interaction = req.body;
        

    console.log('Adding interaction: ' + JSON.stringify(interaction));


            db.query('INSERT INTO latrobeasdetect.asdetect_interaction__c (asdetect_contact__r__loyaltyid__c, type__c,description__c,mch_child_asdetect__r__externalchildid__c) VALUES ($1, $2, $3,$4)',
                    [userId, interaction.type__c, interaction.description__c,interaction.externalchildid__c], true)
                .then(function() {
                    res.send('ok');
                    //res.send({originalBalance: balance, points: interaction.points, newBalance: balance + interaction.points, originalStatus: getStatus(balance), newStatus: getStatus(balance + interaction.points)});
                console.log('adding interaction: here would be a good place to return something...');
                })
                .catch(next);
       

}

/**
 * Get user's recent interaction
 * @param req
 * @param res
 * @param next
 */
function getItems(req, res, next) {

    var externalUserId = req.externalUserId;
    console.log('external user id:' + externalUserId);

    // currently the last 20 interactions
    db.query("SELECT i.id,i.sfid,i.name,i.asdetect_contact__r__loyaltyid__c AS userId, i.type__c , i.description__c, i.name, c.child_s_first_name__c,i.createddate,i.mch_child_asdetect__r__externalchildid__c as externalchildid__c, i._hc_lastop,i._hc_err FROM latrobeasdetect.asdetect_interaction__c i LEFT OUTER JOIN latrobeasdetect.mch_child_asdetect__c c ON (i.mch_child_asdetect__r__externalchildid__c=c.externalchildid__c) WHERE i.asdetect_contact__r__loyaltyid__c=$1 order by i.createdDate desc LIMIT 20", [externalUserId])
        .then(function (interactions) {
            console.log(JSON.stringify(interactions));
            return res.send(JSON.stringify(interactions));
        })
        .catch(next);
};

/**
 * Delete all interactions for logged in user. Used for demo purpose to reset interactions and start demo with empty list.
 * Also deletes user's wallet and wish list for consistency.
 * @param req
 * @param res
 * @param next
 */
function deleteAll(req, res, next) {
    var externalUserId = req.externalUserId,
        userId = req.userId;
        console.log('deleteAll interactions....stubbed out');

    //Q.all([deleteItems(externalUserId), wallet.deleteItems(userId), wishlist.deleteItems(userId)])
        //.then(function () {
            return res.send('ok');
        //})
       // .catch(next);
}

/**
 * Delete all interactions for the given user
 * @param userId
 * @returns {*}
 */
function deleteItems(userId) {
    console.log('deleting interaction items for user ' + userId);
    return db.query("DELETE FROM latrobeasdetect.asdetect_interaction__c WHERE asdetect_contact__r__loyaltyid__c=$1", [userId]);
}

/**
 * Get user's point balance
 * @param userId
 * @returns {*}
 */
function getPointBalance(userId) {
    //legacy stuff
        return db.query('select sum(points__c) as points from salesforce.interaction__c where contact__loyaltyid__c=$1', [userId], true);
//return 0;
}

/**
 * Returns status level based on number of points
 * @param points
 * @returns {number}
 */
function getStatus(points) {
    //if (points>9999) {
       // return 3;
   // } else if (points>4999) {
        //return 2;
    //} else {
        //return 1;
    //}
    return 1;
}

exports.getItems = getItems;
exports.addItem = addItem;
//exports.getPointBalance = getPointBalance;
exports.getStatus = getStatus;
exports.deleteAll = deleteAll;