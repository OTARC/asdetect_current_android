var db = require('./pghelper'),
    winston = require('winston'),
    uuid = require('node-uuid'),
    missingChildInformation ='One or more mandatory fields are missing for this Child - (child_s_first_name__c, child_s_last_name__c, gender__c, birthdate__c, adult_can_act_on_child_s_behalf__c). Please refer to API guide.',
    util=require('util');

//helper to determine if a field is null
function isEmpty(field,val){
    winston.info('child.isEmpty():  Checking field: '+field);
    return (val === undefined || val == null || val == "") ? true : false;
}

function findById(externalUserId,externalchildid__c) {
    // Retrieve offer either by Salesforce id or Postgres id
    //TODO tighten this up to show only a child of this user (refer getAll)
    //
    return db.query("select id,sfId,childs_initials__c,child_s_first_name__c, child_s_last_name__c, childs_nickname__c,birthdate__c,total_months_old__c,gender__c ,child_currently_at_risk__c ,child_Ever_at_risk__c,asdetect_contact__c ,externalchildid__c,_hc_lastop,_hc_err from latrobeasdetect.mch_child_Asdetect__c WHERE asdetect_contact__r__loyaltyid__c=$1 and externalchildid__c=$2", [externalUserId,externalchildid__c], true);
};

//get all children for a contact
function getAll(req, res, next) { 
    var externalUserId = req.externalUserId;
    winston.info('child.getAll(): externalUserId='+externalUserId);
    db.query("select id,sfId,childs_initials__c,child_s_first_name__c, child_s_last_name__c, childs_nickname__c,birthdate__c,total_months_old__c,gender__c,child_currently_at_risk__c ,child_ever_at_risk__c, asdetect_contact__c ,externalchildid__c,_hc_lastop,_hc_err from latrobeasdetect.mch_child_Asdetect__c where asdetect_contact__r__loyaltyid__c=$1 LIMIT $2", [externalUserId,20])       
        .then(function (child) {
            winston.info('child.getAll(): result='+JSON.stringify(child));
            return res.send(JSON.stringify(child));
        })
        .catch(next);
};


function getById(req, res, next) {
    //console.log('logging req: '+ util.inspect(req));
    var externalchildid__c = req.params.id;
    var externalUserId = req.externalUserId;

    findById(externalUserId,externalchildid__c)
        .then(function (child) {
            console.log(JSON.stringify(child));
            return res.send(JSON.stringify(child));
        })
        .catch(next);
};


function addChild(req, res, next) {
    winston.info('child.addChild(): externalUserId='+req.externalUserId);
    winston.info('child.addChild(): payload='+JSON.stringify(req.body));
    var externalUserId = req.externalUserId,
    birthdate__c = req.body.birthdate__c,
    childs_initials__c=req.body.childs_initials__c,
    child_s_first_name__c=req.body.child_s_first_name__c,
    child_s_last_name__c=req.body.child_s_last_name__c,
    childs_nickname__c=req.body.childs_nickname__c,
    diagnosis__c=req.body.diagnosis__c,
    gender__c=req.body.gender__c,
    adult_can_act_on_child_s_behalf__c=req.body.adult_can_act_on_child_s_behalf__c,
    OTARC_can_use_childs_data_for_research__c=req.body.OTARC_can_use_childs_data_for_research__c,
    child_has_a_sibling_with_an_asd__c=req.body.child_has_a_sibling_with_an_asd__c;  

    
    if (isEmpty('birthdate__c',birthdate__c)||isEmpty('childs_initials__c',childs_initials__c)||isEmpty('child_s_last_name__c',child_s_last_name__c)||isEmpty('child_s_first_name__c',child_s_first_name__c)|| isEmpty('gender__c',gender__c)||isEmpty('adult_can_act_on_child_s_behalf__c',adult_can_act_on_child_s_behalf__c)) 


    {
      winston.info('child.addChild(): ERROR: Failed mandatory fields validation')
      return res.send(400, missingChildInformation);  
    }

    //externalchildid__c = (+new Date()).toString(36); // TODO: more robust UID logic
    externalchildid__c=uuid.v4();
    winston.info('addChild(): generated externalchildid__c='+externalchildid__c);
    
        
            db.query('INSERT INTO latrobeasdetect.mch_child_asdetect__c (asdetect_contact__r__loyaltyid__c, childs_initials__c,child_s_first_name__c,child_s_last_name__c,childs_nickname__c,birthdate__c,gender__c,diagnosis__c,externalchildid__c,adult_can_act_on_child_s_behalf__c,OTARC_can_use_childs_data_for_research__c,child_has_a_sibling_with_an_asd__c,rest_endpoint_version__c) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)', [externalUserId, childs_initials__c,child_s_first_name__c,child_s_last_name__c,childs_nickname__c,birthdate__c,gender__c,diagnosis__c,externalchildid__c,adult_can_act_on_child_s_behalf__c,OTARC_can_use_childs_data_for_research__c,child_has_a_sibling_with_an_asd__c,'1.0'], true)

                .then(function () {
                    return res.send({'externalchildid__c':externalchildid__c});
                    //return res.send('ok');
                })
                .fail(function(err) {
                    return next(err);
                })
        .catch(next);

};



exports.findById = findById;
exports.getAll = getAll;
exports.getById = getById;
exports.addChild= addChild;
