function checkData() {
    var db = Parse.getUserInstance();
    var userList = db.execute({
        where:{
            "bonus_redeemed":{"$ne": null}},
        limit: 978,
    });
    var emails = []
    for(var i =0;i<userList.length;i++){
        if(userList[i].bonus_redeemed["march-madness-2018"]){
            emails.push([userList[i].email])
        }
    }
    var ss = SpreadsheetApp.openById('xxxxxxxxxxxxxxxxxxxxx').getSheetByName('List').getRange(1,1,emails.length,1).setValues(emails)

    return 0
}