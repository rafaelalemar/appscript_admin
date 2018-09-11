//Funcão para renderizar o html
function doGet(e) {
    Logger.log(e);
    var html = HtmlService.createTemplateFromFile('index2');
    html.email = '';
    if (e.parameter.hasOwnProperty('user')) {
        html.email = e.parameter.user
    } else if (e.parameter.hasOwnProperty('datatable')) {
        var dTable = usersDataTable(e.parameter.datatable);
        return ContentService.createTextOutput(JSON.stringify(dTable.dataArray)).setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return html.evaluate();

}


/**
 * Função para validar o Email
 * @param {string} userTarget Email do usuário a ser validado
 * @returns {JSON}
 */
function check_email(userTarget) {
    var dados_usuario = {
        plan_type: 99,
        situation: '',
        email: ''
    };
    if (!userTarget) {
        dados_usuario.situation = "inexistente";
        return dados_usuario;

    }
    var db = Parse.getUserInstance();
    var user = db.execute({
        where: {
            'username': userTarget
        }
    });

    if (!user.length) {
        dados_usuario.situation = "inexistente";
        return dados_usuario;
    }
    dados_usuario.email = user[0].email;
    var expireOn = new Date(user[0].expireOn.iso);
    var hoje = new Date();
    dados_usuario.plan_type = user[0].planType;
    var usuario_ativo = expireOn > hoje && dados_usuario.plan_type !== 99;
    //verifica se o usuário é ativo de acordo com o plano e data de expiração
    if (dados_usuario.plan_type === 99) {
        dados_usuario.situation = "free"
    } else if (usuario_ativo) {
        dados_usuario.situation = "ativo"
    } else {
        dados_usuario.situation = "inativo"
    }
    return dados_usuario
}

/**
 * Função para receber o número de conexões ativas do usuário
 * @param {string} user Email do usuário
 * @returns {number|*}
 */
getTotalConnections = function (user) {
    var db = Parse.getConnectionInstance();
    return db.execute({
        where: {
            email: user,
            deleted: false
        },
        count: 1,
        limit: 0
    }, true).count
};

/**
 * Função para transferir as conexões , caso der erro envia um JSON para o front com uma mensagem de erro.
 * @param {string} from Email remetente
 * @param {string} to Email destinatário
 * @returns {{status: number, message: string}}
 */
function transfer_connections_1(from, to) {

    //cotas é o tanto de conexões que um plano pode ter
    var retorno = {
        "status": 0,
        "message": ''
    };

    var validar = check_email(from);

    if (validar.situation === "inexistente") {
        // user nao existe. erro
        retorno.message = "The user " + from + " was not found on the database";
        return retorno
    }
    var destino = check_email(to);

    //recebe as conexões ativas dos 2 usuários

    var planilhas_enviar = getTotalConnections(validar.email);
    var planilhas_receber = getTotalConnections(destino.email);

    if (destino.situation == "inexistente") {

        retorno.message = "The user " + to + " was not found on the database.";

    } else if (destino.situation) {  // Switch atribui o máximo de conexoes que o usuario pode ter de acordo com o plano;

        var userName = Session.getActiveUser().getEmail();
        var domain = destino.email.split("@")[1];

        var db = Parse.getConnectionInstance();
        var user = db.execute({
            where: {
                email: validar.email
            },
            limit: 1000
        }).map(function (item) {
            item.getId = function () {
                return this.objectId;
            };
            item.buildParseData = function () {
                return {email: destino.email, domain: domain};
            };
            return item;
        });
        var response = db.saveBatch(user);

        retorno.status = 1;

        // Salva na planilha Transfer Connections
        var values = [new Date(), userName, from, to, planilhas_enviar];
        SpreadsheetApp.openById("xxxxxxxxxxxxxxxxxxxxxxxxxx").getSheetByName("name").appendRow(values);
    }

    return retorno
}