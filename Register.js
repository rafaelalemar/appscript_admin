var planNames = {
    '1': 'Advanced',
    '10': 'Professional',
    '99': 'Free',
    100: 'Enterprise'
};

/**
 * Recebe um email do usuário e verifica se é válido, caso for, realiza uma consulta e retorna os dados necessários.
 * @param userTarget
 * @returns {{expireOn: string, planType: string, lastAccess: string, quota: string, bonus: string, username: string, status: number, message: string, monthlyUpdates: string, planPeriod: string, active: string}}
 */
function checar_cadastro(userTarget) {
    //userTarget = "sheetgotest@outlook.com.br"
    var retorno = {
        expireOn: '',
        planType: '',
        lastAccess: '',
        createdAt: '',
        quota: '',
        bonus: '',
        username: '',
        email: '',
        status: 0,
        message: '',
        monthlyUpdates: '',
        lastMonthUpdates: '',
        planPeriod: '',
        active: '',
        beta_tester: '',
        subscr_id: '',
        teams: '',
        Notes: '',
        iframe: '',
        user_list: []
    };
    if (!userTarget) {
        retorno.message = "The user " + userTarget + " was not found on the database";
        return retorno;

    }
    var db = Parse.getUserInstance();
    var user = db.execute({
        where: {
            'username': userTarget
        }
    });

    if (!user.length) {
        retorno.user_list = trazerUsuarios(userTarget);
        // if(!userList.length) {
        retorno.message = "The user " + userTarget + " was not found on the database";
        return retorno;
        // }
    }
    //Salva o usuário no CACHE por 5 minutos.
    CacheService.getScriptCache().put(user[0].email, JSON.stringify(user[0]), 600);
    var dataExpire = new Date(user[0].expireOn.iso);
    var createdDate = new Date(user[0].createdAt);
    var lastAccess = user[0].lastAccess ? new Date(user[0].lastAccess.iso) : 0;
    var dataAtual = new Date();
    var dataRef = ((dataAtual.getMonth() + 1).padLeft(2, '0')) + '/' + dataAtual.getFullYear();
    var lastDataRef = ((dataAtual.getMonth()).padLeft(2, '0')) + '/' + dataAtual.getFullYear();
    //Mostra o máximo de Updates de acordo com cada Plano
    var updates = 0;
    switch (user[0].planType) {
        case 99:
            updates = 60;
            break;
        case 2:
            updates = 300;
            break;
        case 1:
            updates = 3000;
            break;
        case 10:
            updates = 30000;
            break;
        case 100:
            updates = 100000;
            break;
    }
    if (dataAtual > dataExpire) {
        updates = 60;
    } else if (dataAtual < dataExpire && user[0].quotas && user[0].quotas.imports > updates) {
        updates = user[0].quotas.imports;
    }
    retorno.createdAt = (createdDate.getMonth() + 1) + '/' + createdDate.getDate() + '/' + createdDate.getFullYear();
    retorno.active = dataExpire > dataAtual;
    retorno.username = user[0].username;
    retorno.email = user[0].email;
    retorno.firstName = user[0].firstName;
    retorno.lastName = user[0].lastName;
    retorno.beta_tester = user[0].beta_tester;
    retorno.expireOn = (dataExpire.getMonth() + 1) + '/' + dataExpire.getDate() + '/' + dataExpire.getFullYear();
    retorno.planType = user[0].planType;
    retorno.lastAccess = user[0].lastAccess ? (lastAccess.getMonth() + 1) + '/' + lastAccess.getDate() + '/' + lastAccess.getFullYear() : '';
    retorno.Notes = user[0].Notes;
    retorno.iframe = user[0].iframe;
    if (user[0].quotas) {
        retorno.quota = user[0].quotas.imports || 0;
        if (user[0].analytics && user[0].analytics.bonus) {
            retorno.bonus = (user[0].quotas.bonus - user[0].analytics.bonus) || 0;
        } else {
            retorno.bonus = user[0].quotas.bonus || 0
        }
        if (retorno.bonus <= 0) {
            retorno.bonus = 0
        }
    } else {
        retorno.quota = 0;
        retorno.bonus = 0;
    }
    retorno.status = 1;
    retorno.planPeriod = user[0].period3 || '';
    retorno.subscr_id = user[0].subscr_id || '';
    retorno.teams = user[0].teams || false;
    if (user[0].analytics && user[0].analytics.imports) {
        retorno.monthlyUpdates = (user[0].analytics.imports[dataRef] || 0) + ' of ' + updates;
        retorno.lastMonthUpdates = (user[0].analytics.imports[lastDataRef] || 0)
    } else {
        retorno.monthlyUpdates = 0 + ' of ' + updates;
    }
    return retorno;

}

/**Função para alterar os dados do usuário
 * Recebe um objeto do front end com os valores atualizados do input e verifica para fazer as mudanças
 * @param dadosRecebidos {JSON}
 */

function saveUserData(dadosRecebidos) {
    //dadosRecebidos = {username:"sheetgotest@outlook.com.br", expireOn: "2018-05-15T20:59:00.000Z"};
    Logger.log(dadosRecebidos.email);
    var response = {
        message: '',
        status: 1
    };
    try {
        // Recebe o cache do usuario paara fazer as verificações
        var userCacheData = CacheService.getScriptCache().get(dadosRecebidos.email);
        var userObject = JSON.parse(userCacheData);

        if (!userObject.quotas) {
            userObject.quotas = {bonus: 0, imports: 0}
        }
        if (!userObject.analytics) {
            userObject.analytics = {bonus: 0}
        }
        var saveData = {
            objectId: userObject.objectId,
            expireOn: {
                "__type": "Date",
                "iso": dadosRecebidos.expireOn
            },
            "quotas": {
                "bonus": userObject.quotas ? userObject.quotas.bonus : 0,
                "imports": userObject.quotas ? userObject.quotas.imports : 0
            },
            getId: function () {
                return this.objectId
            }
        };
        var test = saveData.getId();
        if (dadosRecebidos.firstName != userObject.firstName) {
            saveData.firstName = dadosRecebidos.firstName;
        }
        if (dadosRecebidos.Notes && dadosRecebidos.Notes != userObject.Notes) {
            saveData.Notes = dadosRecebidos.Notes;

        }
        if (dadosRecebidos.lastName != userObject.lastName) {
            saveData.lastName = dadosRecebidos.lastName;
        }
        if (dadosRecebidos.planType != userObject.planType) {
            saveData.planType = dadosRecebidos.planType;
        }
        if (dadosRecebidos.planPeriod != userObject.period3) {
            saveData.period3 = dadosRecebidos.planPeriod
        }
        // var conta = userObject.quotas.bonus - userObject.analytics.bonus || 0;
        // if (dadosRecebidos.bonus != conta) {
        //     saveData.quotas.bonus = dadosRecebidos.bonus + userObject.analytics.bonus;
        // }
        if (dadosRecebidos.subscr_id != userObject.subscr_id) {
            saveData.subscr_id = dadosRecebidos.subscr_id;
        }
        if (dadosRecebidos.teams != userObject.teams) {
            saveData.teams = dadosRecebidos.teams
        }
        if (dadosRecebidos.beta_tester != userObject.beta_tester) {
            saveData.beta_tester = dadosRecebidos.beta_tester
        }
        if (dadosRecebidos.iframe != userObject.iframe) {
            saveData.iframe = dadosRecebidos.iframe
        }
        // Váriaveis para salvar o valor na planilha
        var betaTester = saveData.beta_tester === undefined ? '' : dadosRecebidos.beta_tester;
        var iFrame = saveData.iframe === undefined ? '' : dadosRecebidos.iframe;
        // Comando para salvar os dados no Parse
        var registrado = Parse.getUserInstance().save(saveData);

        if(userObject.subscr_id && (!saveData.subscr_id || saveData.subscr_id.length < 2)){
            saveData.subscr_id = "[" + userObject.subscr_id + "] DELETED"
        }

        // Código para salvar os dados na planilha de LOG
        var activeUser = Session.getActiveUser().getEmail();
        //var activeUser = Session.getEffectiveUser().getEmail();
        var after = [new Date(), userObject.username || '', saveData.firstName || '', saveData.lastName || '', saveData.expireOn.iso || '', planNames[saveData.planType] || '', saveData.period3 || '', saveData.subscr_id || '', betaTester, iFrame, dadosRecebidos.justification, activeUser, '', '', 'MODIFIED'];
        SpreadsheetApp.openById("1hGmf-q1j7HB7bbbG735ntbMoSzn-z7J8pcT9VsWy2JM").getSheetByName("Data history").appendRow(after)
    } catch (erro) {
        response.message = erro.message;
        response.status = 0;
        response.lineNumber = erro.lineNumber;
        response.fileName = erro.fileName;
        response.stack = erro.stack;
        saveErrorLog(erro);
    }
    return response;
}

function saveErrorLog(error) {
    PropertiesService.getScriptProperties().setProperty(new Date().toISOString(), JSON.stringify(error))
}


function deleteUser(email) {

    // email = 'felipe@gedu-demo-sheetgo.com';
    Logger.log(email);

    var response = {
        message: '',
        status: 1
    };

    try {


        //DELETA CONEXÕES
        var db = Parse.getConnectionInstance();
        var connections = db.execute({
            where: {
                email: email
            },
            limit: 1000
        }).map(function (item) {
            item.getId = function () {
                return this.objectId;
            };
            item.getData = function () {
                return {email: encode_email(this.email), deleted: true};
            };
            return item;
        });
        if (connections) {
            var response_connections = db.batchUpdate(connections);
        }


        // DELETA USUARIO
        var user = trazerUsuarios(email);

        var encryptUser = {
            objectId: user[0].objectId,
            email: encode_email(user[0].email),
            username: encode_email(user[0].username),
            picture: null,
            firstName: null,
            lastName: null,
            credentials: null,
            user_details: null,
            getId: function () {
                return this.objectId
            }
        };

        if (user[0].email_ms) {

            encryptUser.email_ms = encode_email(user[0].email_ms);

        }
        var user_db = Parse.getUserInstance();

        if (email === decode_email(encryptUser.email)) {
            var response_user = user_db.save(encryptUser);
        }


        // DELETE INTERCOM
        var intercom_id = get_intercom_id(user[0].objectId);

        delete_intercom_user(intercom_id);


        // LIST FILES WITH USER EMAIL
        var user_files = files_search(email);

        if (user_files[0][0]) {
            send_files_information(email, user_files);
        }

        // DELETE BIG QUERY
    //    send_update_query(encode_email(email), email);


        var activeUser = Session.getActiveUser().getEmail();
        var after = [new Date(), email, '', '', '', '', '', '', '', '', '', activeUser, encryptUser.email, encryptUser.email_ms || '', 'DELETED'];
        SpreadsheetApp.openById("xxxxxxxxxxxxxxxxxxx").getSheetByName("name").appendRow(after);


        // PODEMOS TESTAR
    } catch (erro) {
        response.message = erro.message;
        response.status = 0;
        response.lineNumber = erro.lineNumber;
        response.fileName = erro.fileName;
        response.stack = erro.stack;
        saveErrorLog(erro);
    }

    return response;


}


function getErrors() {
    var errors = PropertiesService.getScriptProperties().getProperties();
    return errors
}


function trazerUsuarios(email) {
    //Consulta o banco de dados para pegar lista de usuários
    // email = '@sheetgo.com'
    var db = Parse.getUserInstance();
    var userList = db.execute({
        where: {
            username: {
                "$regex": email
            }
        },
        limit: 10,
        order: 'email'
    });
    return userList
}