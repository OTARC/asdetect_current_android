var db = require('./pghelper'),
    winston = require('winston');

/**
 * Get a list of stores
 * @param req
 * @param res
 * @param next
 */

function findAll() {
    return db.query("SELECT id, name, location__latitude__s AS latitude, location__longitude__s AS longitude FROM salesforce.store__c ORDER BY lastmodifieddate DESC");
};



function getAll(req, res, next) {
    findAll()
        .then(function (stores) {
            console.log(JSON.stringify(stores));
            return res.send(JSON.stringify(stores));
        })
        .catch(next);
};


exports.getAll = getAll;
