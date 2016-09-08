var db = require('./pghelper'),
    winston = require('winston'),
    util=require('util');


function deleteChildrenAndTests(req, res, next) { 
    var externalUserId = req.externalUserId;
    console.log('!!!!!! DELETING CHILDREN AND TESTS !!!!!!');
    db.query("select delete_children_and_tests($1)", [externalUserId])       
        .then(function (result) {
            return res.send(JSON.stringify(result));
        })
        .catch(next);
};


function deleteContactAndChildrenAndTests(req, res, next) { 
    var externalUserId = req.externalUserId;
    console.log('!!!!!! DELETING CONTACT AND CHILDREN AND TESTS !!!!!');
    db.query("select delete_contact_and_children_and_tests($1)", [externalUserId])       
        .then(function (result) {
            return res.send(JSON.stringify(result));
        })
        .catch(next);
};


function deleteContactAndChildrenAndTestsByLastName(req, res, next) { 
    var externalUserId = req.externalUserId;
    var lastname=req.params.lastname;
    console.log('!!!!!! DANGER DANGER !!!!! DELETING CONTACT AND CHILDREN AND TESTS BY LASTNAME !!!!!');
    db.query("select delete_contact_and_children_and_tests_by_username($1)", [lastname])       
        .then(function (result) {
            return res.send(JSON.stringify(result));
        })
        .catch(next);
};

function deleteOldTokens(req, res, next) { 
    var externalUserId = req.externalUserId;
    console.log('!!!!!! DELETING ALL OLD TOKENS !!!!!');
    db.query("select delete_old_tokens()")       
        .then(function (result) {
            return res.send(JSON.stringify(result));
        })
        .catch(next);
};


exports.deleteChildrenAndTests=deleteChildrenAndTests;
exports.deleteContactAndChildrenAndTests=deleteContactAndChildrenAndTests;
exports.deleteContactAndChildrenAndTestsByLastName=deleteContactAndChildrenAndTestsByLastName;
exports.deleteOldTokens=deleteOldTokens;