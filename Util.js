/**
 * Recebe um email para criptografar
 * @param email
 * @returns {string}
 */
function encode_email(email) {

    return Utilities.base64Encode(email) + '@deleted-com';

}

/**
 * Decodifica um email criptografado
 * @param encoded_email
 * @returns {*}
 */
function decode_email(encoded_email) {

    var decoded = Utilities.base64Decode(encoded_email.split('@')[0]);
    return Utilities.newBlob(decoded).getDataAsString();

}

/**
 *
 * @param (n) Recebe o número máximo de caracteres que sua string deve ter
 * @param (str) Recebe o caracter que deseja usar para completar a string
 * @returns {string}
 */
Number.prototype.padLeft = function (n, str) {
    return Array(n - String(this).length + 1).join(str || '0') + this;
};

/**
 * Envia um email com todos os documentos possíveis onde contém dados do usuário a ser deletado
 * @param email
 */
function files_search(email) {

    var response = [];
    var dates = [];
    var urls = [];

    //email = 'felipe@com';
    var files = DriveApp.searchFiles("not \'" + email + "\' in writers and fullText contains \'" + email + "\'");
    while (files.hasNext()) {
        var file = files.next();
        response.push(file.getName());
        dates.push(file.getLastUpdated());
        urls.push(file.getUrl());
    }
    return [response, dates, urls];

}

/**
 * Recebe um id de usuário e retorna o ID do usuário no Intercom
 * @param user_id
 * @returns {number}
 */
function get_intercom_id(user_id) {

    try {
        // user_id = 'FS2NV3jWgi';

        var requestBody = {};
        requestBody.headers = {'Authorization': 'xxxxxxxxxxxxxxxxxxxxxxxxx'};
        requestBody.contentType = "application/json";
        requestBody.method = "GET";

        var request = UrlFetchApp.fetch('https://api.intercom.io/users?user_id=' + user_id, requestBody).getContentText();
        var response = JSON.parse(request);
        return response.id;

    } catch (e) {

        Logger.log(e);

    }

}

/**
 * Recebe um user_id do intercom e deleta o usuário permanentemente
 * @param intercom_id
 * @returns {number}
 */
function delete_intercom_user(intercom_id) {

    try {

        var requestBody = {};
        requestBody.headers = {
            'Authorization': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            'Accept': "application/json"
        };
        requestBody.contentType = "application/json";
        requestBody.method = "POST";
        requestBody.payload = JSON.stringify({"intercom_user_id": intercom_id});

        var request = UrlFetchApp.fetch('https://api.intercom.io/user_delete_requests', requestBody).getContentText();
        var response = JSON.parse(request);

    } catch (e) {

        Logger.log(e);

    }

}


/**
 * Envia um email com o usuário deletado e os arquivos que podem conter dados dele
 * @param files_data
 * @param user_email
 */
function send_files_information(user_email, files_data) {

    // user_email = 'felipe@gedu-demo-com';

    files_data = files_search(user_email);

    var itemList = '';
    for (var i = 0; i < files_data[0].length; i++) {
        itemList += "<tr><td><a href=" + files_data[2][i] + ">" + files_data[0][i] + "</a></td><td style='text-align:center'>" + files_data[1][i] + '</td></tr>';
    }

    var html = '<p>The user ' + user_email + ' has been deleted and the files below may still contain user data :</p>';
    html += "<table border='1', width ='700'><tr><th>File Name</th><th>Last Updated at</th></tr>";
    html += "<tr><th> &nbsp; </th><th> &nbsp; </th></tr>" + itemList + '</table>';
    var logoUrl = "https://static.com/wp-content/uploads/2017/11/sheetgo-logo.png";
    var logoBlob = UrlFetchApp.fetch(logoUrl).getBlob().setName('logoBlob');
    var mail = MailApp.sendEmail({
        to: 'email@gmail.com',
        replyTo: "email@replyto.com",
        name: 'Admin',
        subject: user_email + " has been deleted.",
        htmlBody: html
    });


}

/**
 *
 * @param new_email
 * @param old_email
 */
function send_update_query(new_email, old_email) {

    var projectId = 'project-name';
    new_email = 'new@gmail.com';
    old_email = 'old@gmail.com';

    var query = [// File queries
        "UPDATE `File` SET user = \'" + new_email + "\' WHERE user = \'" + old_email + "\'",
        "UPDATE `File` SET owners.emailAddress = \'" + new_email + "\' WHERE owners.emailAddress = \'" + old_email + "\'",
        "UPDATE `File` SET permissions.emailAddress = \'" + new_email + "\' WHERE permissions.emailAddress = \'" + old_email + "\'",
        // Resquest Log queries
        "UPDATE `RequestLog` SET user_email = \'" + new_email + "\', user_first_name = " + null + ", user_last_name = " + null + " WHERE user_email = \'" + old_email + "\'",
        // Connection Log queries
        "UPDATE `ConnectionLog` SET updater_user_email = \'" + new_email + "\' WHERE updater_user_email = \'" + old_email + "\'",
        "UPDATE `ConnectionLog` SET owner_email = \'" + new_email + "\' WHERE owner_email = \'" + old_email + "\'"
    ];

    for (var i = 0; i < query.length; i++) {


        var request = { //"not \'" + email + "\' in writers and fullText contains \'" + email + "\'"
            query: query[i],
            useLegacySql: false
        };

        var queryResults = BigQuery.Jobs.query(request, projectId);
     

    }


}