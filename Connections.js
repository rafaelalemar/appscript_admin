var MIMETYPES = {
    "google_sheet": [
        "application/vnd.google-apps.spreadsheet"
    ],
    "excel": [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel.sheet.macroenabled.12",
        "application/vnd.ms-excel.sheet.macroEnabled.12"
    ],
    "csv": [
        "text/csv"
    ],
    "tsv": [
        "text/tab-separated-values"
    ],
    "ods": [
        "application/vnd.oasis.opendocument.spreadsheet"
    ],
    "folder": [
        "application/vnd.google-apps.folder"
    ]
};

var retorno = {
    message: '',
    dataArray: [],
    status: 0
};

function connectionList(userTarget) {
    //userTarget = "student-test-126@gedu-demo-sheetgo.com";
    // userTarget = 'felipe@sheetgo.com'
    var db = new Connections();
    var connections = db.syncData(userTarget);

    //Variaveis do usuário
    var email, flow, connectionType, consolidateCount, autoUpdate, autoUpdateRecurrency, spreadsheetId,
        spreadsheetName, sourceId, sourceName, fileType, createdAt, databaseUpdate, updatedAt, sourceSheet;
    var filter, storageOrigin, timeZone, connectionName, connectionObjectId, errorMessages;

    var connectionsList = [];
    var sourceList = [];
    var sourceSheetList = [];
    var sourceIdList = [];


    for (var i = 0; i < connections.length; i++) {

        var consolidate = [];
        var consolidateSheets = [];

        //Email do dono da conexão
        email = connections[i].email;

        //Se o valor for true ele é Export, caso não for é Import
        flow = connections[i].sheet['export'];
        flow === true ? flow = 'Export' : flow = 'Import';

        fileType = verifyFile(connections[i].sheet.fileType);

        //Verifica o tipo de conexão
        if (connections[i].sheet.consolidate) {
            connectionType = 'Consolidate [' +connections[i].sheet.consolidate.length+']';
        } else if (connections[i].appendData) {
            connectionType = 'Append'

        } else if (fileType === 'folder'){
            connectionType = 'Consolidate From Folder'
        } else {
            connectionType = 'Connect'
        }

        // connections[i].sheet.consolidate ? consolidateCount = connections[i].sheet.consolidate.length : consolidateCount = 1;
        // consolidateCount = i;

        autoUpdate = connections[i].triggerType;

        if (autoUpdate === 'Daily') {
            autoUpdateRecurrency = ''
        } else if (autoUpdate === 'Hourly') {
            autoUpdateRecurrency = 'Every ' + connections[i].trigger_hourTimer + ' hour(s)';
        } else {
            autoUpdateRecurrency = '';
        }


        spreadsheetId = connections[i].sheetId;

        spreadsheetName = connections[i].spreadsheet_name;

        /**
         * VERIFICAR OS CONSOLIDATES PARA MOSTRAR TODOS
         * @type {number}
         */
        sourceId = connections[i].sheet.id;
        // ####### VALIDAR JUNTO #####
        sourceName = connections[i].sheet.spreadsheetName;

        sourceSheet = connections[i].sheet.name;

        if (connections[i].sheet.consolidate) {
            for (var j = 0; j < connections[i].sheet.consolidate.length; j++) {
                consolidateSheets.push([connections[i].sheet.consolidate[j].id, connections[i].sheet.consolidate[j].spreadsheetName, connections[i].sheet.consolidate[j].name])
                // teste.push(connections[i].sheet.consolidate[j].spreadsheetName)
                // teste.push(connections[i].sheet.consolidate[j].name)
            }
        }


        createdAt = connections[i].createdAt;
        createdAt = createdAt.slice(0, createdAt.indexOf('.')).split('T').join(' ');

        databaseUpdate = connections[i].updatedAt;
        databaseUpdate = databaseUpdate.slice(0, databaseUpdate.indexOf('.')).split('T').join(' ');

        updatedAt = connections[i].lastImport ? connections[i].lastImport.iso : '';
        updatedAt = updatedAt.slice(0, updatedAt.indexOf('.')).split('T').join(' ');

        filter = connections[i].sheet.query ? connections[i].sheet.query.active : '';

        storageOrigin = connections[i].service_origin || '';

        timeZone = connections[i].timezone || '';

        connectionName = connections[i].linkName || '';

        connectionObjectId = connections[i].objectId || '';
        ;

        errorMessages = connections[i].statistics ? connections[i].statistics.message : ''

        var activeConnections = connections.length || 0;
        if (activeConnections > 0) {
            for (var j = 0; j < activeConnections; j++) {
                if (connections[j].sheet && connections[j].sheet.consolidate) {
                    for (var k = 0; k < connections[j].sheet.consolidate.length; k++) {
                        consolidate.push(connections[j].sheet.consolidate[k]);
                    }
                }
            }
        }

        connectionsList.push([connectionObjectId, flow, connectionName, connectionType, autoUpdate, autoUpdateRecurrency, spreadsheetId, spreadsheetName, sourceId, sourceName, sourceSheet, fileType, createdAt, updatedAt, databaseUpdate, filter, storageOrigin, timeZone, errorMessages, consolidateSheets]);

    }

    retorno.status = 1;
    retorno.message = 'oi';
    retorno.dataArray = connectionsList;
    return retorno;
}

Connections = function () {
    this.limit = 1000;
    this.db = Parse.getConnectionInstance();
    this.syncData = function (email) {
        return this.db.execute({
            where: {
                email: email,
                deleted: false
            }, limit: this.limit
        })
    }
};
/**
 * Essa função recebe um array, cria um novo array com base no parâmetro e retorna seu tamanho;
 * @param type (Qualquer tipo ex. String, num etc)
 * @returns {number} Tamanho do Array
 */
Array.prototype.count = function (type) {
    return this.filter(word = function (array) {
        return array === type
    }).length;
};


function verifyFile(file) {
    switch (file) {
        case "application/vnd.google-apps.spreadsheet":
            file = 'google-sheet';
            break;
        case "text/csv":
            file = 'csv';
            break;
        case "text/tab-separated-values":
            file = 'tsv';
            break;
        case "application/vnd.oasis.opendocument.spreadsheet":
            file = 'ods';
            break;
        case "application/vnd.google-apps.folder":
            file = 'folder';
            break;
        case !file:
            file = '';
            break;
        default:
            file = 'excel';
    }
    return file;

}