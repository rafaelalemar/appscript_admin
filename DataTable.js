
var retorno = {
    message: '',
    dataArray: [],
    status: 0
};

function usersDataTable(userTarget) {
    //userTarget = "felipe@sheetgo.com"
    if (!userTarget) {
        retorno.message = "The user " + userTarget + " was not found on the database";
        return retorno;
    } else {
        //Variaveis do usuário
        var email, username, plan, createdAt, lastAccess, surveyDate, forTeams, bonus,status;
        //Variaveis de Auxilio
        var dataAtual, dataRefM, dataRefLM, lastAccessRef, createdDate, expireDate;
        //Consulta o banco de dados para pegar lista de usuários
        var db = Parse.getUserInstance();
        var userList = db.execute({
            where: {
                'username': {"$regex":userTarget}
            },
            limit: 1000,
            order: '-lastAccess' //Ordena os usuários que acessaram por último primeiro
        });
        if (!userList.length) {
            retorno.message = "The user " + userTarget + " was not found on the database";
            return retorno;
        }


        dataAtual = new Date();
        dataRefM = ((dataAtual.getMonth() + 1).padLeft(2, '0')) + '/' + dataAtual.getFullYear();
        dataRefLM = (dataAtual.getMonth().padLeft(2, '0')) + '/' + dataAtual.getFullYear();
        var db = new Connections();

        //Array dos usuários
        var usuarios = [];

        for (var i = 0; i < userList.length; i++) {
            var hourly = 0, daily = 0, weekly = 0, monthly = 0, importsM = 0, importsLM = 0;
            var triggers = [], consolidate = [];

            bonus = userList[i].quotas ? userList[i].quotas.bonus : 0;
            lastAccessRef = userList[i].lastAccess ? new Date(userList[i].lastAccess.iso) : 0;
            username = userList[i].username;
            email = userList[i].email;
            expireDate = new Date(userList[i].expireOn.iso);


            var connectionsData = db.syncData(email);
            var activeConnections = connectionsData.length || 0;
            if (activeConnections > 0) {
                for (var j = 0; j < activeConnections; j++) {
                    triggers.push(connectionsData[j].triggerType);
                    if (connectionsData[j].sheet && connectionsData[j].sheet.consolidate) {
                        for(var k = 0; k < connectionsData[j].sheet.consolidate.length;k++){
                            consolidate.push(connectionsData[j].sheet.consolidate[k]);
                        }
                    }
                }
            }
            //Caso as conexões ativas tiverem acinadores automáticos, será realizado a contagem dos mesmos.
            if (triggers) {
                hourly = triggers.count('Hourly');
                daily = triggers.count('Daily');
                weekly = triggers.count('Weekly');
                monthly = triggers.count('Monthly');
            }
            plan = planNames[userList[i].planType] + ' ' + (userList[i].period3 || '');
            // Status do plano
            if(expireDate > dataAtual){
                status = "Active";
            }else if(userList[i].planType == 99){
                status = "";
            }else{
                status = 'Expired';
            }
            createdDate = new Date(userList[i].createdAt);
            createdAt = ((createdDate.getMonth() + 1).padLeft(2, '0')) + '/' + (createdDate.getDate().padLeft(2, '0')) + '/' + createdDate.getFullYear();
            lastAccess = userList[i].lastAccess ? ((lastAccessRef.getMonth() + 1).padLeft(2, '0')) + '/' + (lastAccessRef.getDate().padLeft(2, '0')) + '/' + lastAccessRef.getFullYear() : '';
            if (userList[i].analytics) {
                if (userList[i].analytics.imports) {
                    importsLM = (userList[i].analytics.imports[dataRefLM] || 0);
                    importsM = (userList[i].analytics.imports[dataRefM] || 0);
                }
            }
            var surveyRef = userList[i].survey ? new Date(userList[i].survey) : undefined;
            surveyDate = surveyRef ? (surveyRef.getMonth() + 1) + '/' + surveyRef.getDate() + '/' + surveyRef.getFullYear() : 'No Survey';
            forTeams = userList[i].teams ? "Yes" : "No";

            //Grava os dados dos usuários para fazer a Table
            usuarios.push([username, plan,status, createdAt, lastAccess, bonus, importsLM, importsM, surveyDate, forTeams, activeConnections, consolidate.length, hourly, daily, weekly, monthly]);
        }

        retorno.status = 1;
        retorno.dataArray = usuarios;
        return retorno;
    }
}

Connections = function () {
    this.limit = 1000;
    this.db = Parse.getConnectionInstance();
    this.syncData = function (email) {
        return this.db.execute({
            where: {
                email: email,
                deleted: false,
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
Number.prototype.padLeft = function (n, str) {
    return Array(n - String(this).length + 1).join(str || '0') + this;
};