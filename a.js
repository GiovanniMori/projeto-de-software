const { Client, LocalAuth } = require("whatsapp-web.js");
const mysql = require("mysql2/promise");
const qrcode = require("qrcode-terminal");
var CronJob = require("cron").CronJob;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox"],
  },
});
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});
client.initialize();
var job = new CronJob("0 0 */1 * * *", function () {
  client.sendMessage(
    "213@c.us",
    `Verificação Automática: Estou Online`
  );
});
job.start();

const createConnection = async () => {
  return mysql.createConnection({
    host: "123",
    user: "213",
    password: "12",
    database: "whats",
  });
};

let todos = ["123@c.us", "123@c.us"];
let lago = [];
let tarde = [];
let planejada = [];
let madrugada = [];
const getFuncionario = async () => {
  todos = ["123@c.us", "123@c.us"];
  lago = [];
  tarde = [];
  planejada = [];
  madrugada = [];
  const connection = await createConnection();
  const [dados] = await connection.execute(`SELECT * FROM funcionarios`);
  connection.end();
  if (dados.length > 0) {
    console.log(`Quantidade de funcionários: ${dados.length}`);
    for (var i = 0; i < dados.length; i++) {
      if (dados[i].rota.includes("lago")) {
        lago.push(dados[i].telefone);
      }
      if (dados[i].rota.includes("tarde")) {
        tarde.push(dados[i].telefone);
      }
      if (dados[i].rota.includes("planejada")) {
        planejada.push(dados[i].telefone);
      }
      if (dados[i].rota.includes("madrugada")) {
        madrugada.push(dados[i].telefone);
      }
      if (dados[i].rota.includes("todos")) {
        todos.push(dados[i].telefone);
      }
    }
    console.log(
      `Todos: ${todos}\nLago: ${lago}\nTarde: ${tarde}\nPlanejada: ${planejada}\nMadrugada: ${madrugada}`
    );
    return dados[0];
  }
};
getFuncionario();
// const deleteFuncionario = async () => {
//   const connection = await createConnection();
//   try {
//     await connection.execute(
//       `DELETE FROM funcionarios WHERE telefone = "5511953207250"`
//     );
//   } catch {
//     return "Não foi possível deletar";
//   }
//   connection.end();
//   return "Funcionário Deletado com Sucesso";
// };

// deleteFuncionario();

const createUser = async (name, msgfrom) => {
  const connection = await createConnection();
  const [rows] = await connection.execute(
    `insert into cliente (data, endereco, nome, pedido, rota, status, telefone) values ('0000-00-00', 'inserir', '${name}', '', 'balcao', 0, '${msgfrom}')`
  );
  connection.end();
  if (rows.length > 0) return true;
  return false;
};

const getCliente = async (msgfrom) => {
  const connection = await createConnection();
  const dados = await connection.execute(
    `SELECT * FROM cliente WHERE telefone = '${msgfrom}'`
  );
  connection.end();
  if (dados.length > 0) {
    return dados;
  }
};

const setClient = async (msgfrom, pedido, set) => {
  const connection = await createConnection();
  const [rows] = await connection.execute(
    `UPDATE cliente SET ${set} = '${pedido}' WHERE cliente.telefone = '${msgfrom}' `
  );
  connection.end();
  if (rows.length > 0) return rows[0].pedido;
  return false;
};

const createEncomenda = async (pedido, msgfrom, year, month, day) => {
  const connection = await createConnection();
  const [rows] = await connection.execute(
    "INSERT INTO pedidos(id, pedidode, pedido, status, data) VALUES (NULL, ?, ?, 0, ?)",
    [msgfrom, pedido, `${year}/${month}/${day}`]
  );
  //'INSERT INTO cliente (nome, endereco, status, telefone, pedido) VALUES (?, "inserir", "0", ? , " ")', [name, msgfrom]);
  connection.end();
  if (rows.length > 0) return true;
  return false;
};

client.on("message", async (message) => {
  try {
    let chat = await message.getChat();
    if (chat.isGroup) return;

    const userNumber = message.from.replace(/\D/g, "");

    const menu =
      "Digite o número:\n*1-* 🛒 Fazer Pedido\n*2-* 🍞 Ver Produtos/Preços\n*3-* 💲 Pix\n\n*0-* ℹ️  Pedir Ajuda";
    const produtos =
      "*Hambúrguer:*\nNormal - R$10,00\nCom Gergilim - R$11,00\nEspecial - R$11,00\nEspecial c/ Gergilim - R$12,00\n\nHamburgão c/ 6 Unid - R$12,00\nHamburgão c/ 2 Unid - R$12,00\nHot Dog - R$14,00\nBaguete - R$1,00\nPão Francês - R$0,60\nPão de Metro - R$7,00\nPão de Lanche -  R$0,90 \nPão de Banha - R$0,60\nPão para Bolo Salgado - R$12,00 \nBisnaga c/ 60 Unid - R$27,00 \nMini Francês - R$0,40\nMini Dog 49 Unid - R$22,50\n*Preço somente para retirada*";
    const sorryMsg = `😕 Desculpa, eu ainda não consigo entender algumas palavras.\nVou te mostrar novamente os assuntos que já aprendi, fica mais fácil pra mim se você escolher uma das opções:\n\n${menu}`;
    const confirmaPedido = `\n*Está correto?*\nDigite: \n*1-* ✅ Sim, confirmar pedido\n*2-* ❌ Não, voltar ao menu
        \n*3-* 📍 Atualizar Endereço \n*4-* 🥖 Alterar Pedido\n*5-* 🕒 Agendar Encomenda\n*6-* 📦 Retirar no Balcão`;
    ////

    /////
    let [getUser] = await getCliente(userNumber);

    const updateUser = async () => {
      [getUser] = await getCliente(userNumber);
    };

    if (getUser == "") {
      await createUser(message._data.notifyName, userNumber);
      await client.sendMessage(
        message.from,
        `Olá ${message._data.notifyName}, vimos que você é um novo cliente por aqui, para facilitar nosso atendimento, digite o *número* que deseja para navegar no menu.\n*Só entregamos para lanchonetes*, demais pedidos devem ser retirados no balcão`
      );
      await client.sendMessage(message.from, `${menu}`);
      client.sendMessage(
        "5511999547461@c.us",
        `Novo cliente: ${message._data.notifyName} - *${userNumber}* \nÉ um cliente?`
      );
      return;
    }

    let nome = getUser[0].nome;
    let statusCode = getUser[0].status;
    let endereco = getUser[0].endereco;
    let pedido = getUser[0].pedido;
    let telefone = getUser[0].telefone;
    let rota = getUser[0].rota;

    if (message.type != "chat" && statusCode != 13) {
      if (statusCode == -1) {
        return;
      }
      client.sendMessage(message.from, `${sorryMsg}`);
      return;
    }
    let mensagem = message.body.toLowerCase();
    if (mensagem == "desligar000") {
      setClient(userNumber, -1, "status");
      client.sendMessage(message.from, `Mensagem Automática desligada!`);
      return;
    }
    if (mensagem == "atualizarfuncionario001") {
      await getFuncionario();
      client.sendMessage(
        message.from,
        `Funcionario Atualizados!\n Todos: ${todos}\nLago: ${lago}\nTarde: ${tarde}\nPlanejada: ${planejada}\nMadrugada: ${madrugada}`
      );
      return;
    }

    switch (statusCode) {
      case -1:
        return;
      case 0:
        break; //deixar
      case 1:
        await setClient(userNumber, message.body, "pedido");
        client
          .sendMessage(
            message.from,
            `*Seu pedido:*\n${message.body}\n*Endereço:*\n${endereco} ${confirmaPedido}`
          )
          .then((result) => {
            setClient(userNumber, 4, "status");
          });
        return;
      case 2:
        client
          .sendMessage(
            message.from,
            `Qual o local para entrega?\n_(Exemplo: Rua Santa Bárbara, 670_\n_Caso deseje retirar o produto digite "balcão")_`
          )
          .then((result) => {
            setClient(userNumber, message.body, "pedido");
            setClient(userNumber, 3, "status");
          });
        return;
      case 3:
        setClient(userNumber, message.body, "endereco");
        client
          .sendMessage(
            message.from,
            `*Seu pedido:*\n${pedido}\n*Endereço:*\n${message.body}${confirmaPedido}`
          )
          .then((result) => {
            setClient(userNumber, 4, "status");
          });
        return;
      case 4:
        if (mensagem == "1") {
          client
            .sendMessage(
              message.from,
              `Seu pedido foi anotado, obrigado pela preferência ${message._data.notifyName} ☺️`
            )
            .then((result) => {
              setClient(userNumber, 0, "status");
            });
          for (var i = 0; i < todos.length; i++) {
            client.sendMessage(
              todos[i],
              `Novo Pedido de *${nome}*\n\n*Pedido*: ${pedido}\n*Local*: ${endereco}\n*Rota*: ${rota}`
            );
          }
          switch (rota) {
            case "tarde":
              for (var i = 0; i < tarde.length; i++) {
                client.sendMessage(
                  tarde[i],
                  `Novo Pedido de *${nome}*\n\n*Pedido*: ${pedido}\n*Local*: ${endereco}`
                );
              }
              return;
            case "lago":
              for (var i = 0; i < lago.length; i++) {
                client.sendMessage(
                  lago[i],
                  `Novo Pedido de *${nome}*\n\n*Pedido*: ${pedido}\n*Local*: ${endereco}`
                );
              }
              return;
            case "planejada":
              for (var i = 0; i < planejada.length; i++) {
                client.sendMessage(
                  planejada[i],
                  `Novo Pedido de *${nome}*\n\n*Pedido*: ${pedido}\n*Local*: ${endereco}`
                );
              }
              return;
            case "madrugada":
              for (var i = 0; i < madrugada.length; i++) {
                client.sendMessage(
                  madrugada[i],
                  `Novo Pedido de *${nome}*\n\n*Pedido*: ${pedido}\n*Local*: ${endereco}`
                );
              }
              return;
          }
        } else if (mensagem == "2") {
          await client
            .sendMessage(message.from, `Seu pedido foi cancelado.`)
            .then((result) => {
              setClient(userNumber, 0, "status");
            });
          client.sendMessage(message.from, menu);
        } else if (mensagem == "3") {
          client
            .sendMessage(
              message.from,
              `Insira seu endereço:\n_(Exemplo: Rua Santa Bárbara, 670_\n_Caso deseje retirar o produto digite "balcão")_`
            )
            .then((result) => {
              setClient(userNumber, 12, "status");
            });
        } else if (mensagem == "4") {
          client
            .sendMessage(
              message.from,
              `Digite seu pedido:\n_(Exemplo: 2 Hambúrguer sem embalar)_`
            )
            .then((result) => {
              setClient(userNumber, 11, "status");
            });
        } else if (mensagem == "5") {
          //Para quando deseja encomendar? (Exemplo: 11)
          client
            .sendMessage(message.from, `Insira o dia que deseja encomendar`)
            .then((result) => {
              setClient(userNumber, 15, "status");
            });
        } else if (mensagem == "6") {
          client
            .sendMessage(
              message.from,
              `Seu pedido foi anotado e ficará disponível para retirada no balcão.\nObrigado pela preferência ${message._data.notifyName} ☺️\n\nFicamos localizados na Rua Santa Bárbara, 670`
            )
            .then((result) => {
              setClient(userNumber, 0, "status");
            });
          for (var i = 0; i < todos.length; i++) {
            client.sendMessage(
              todos[i],
              `Novo Pedido de *${nome}*\n\n*Pedido*: ${pedido}\n*Local*: ${endereco}`
            );
          }
        } else {
          client.sendMessage(
            message.from,
            `Desculpe, seu pedido ainda *não foi confirmado*, tente novamente.\n*Seu pedido:*\n${pedido}\n*Endereço:*\n${endereco} \n ${confirmaPedido}`
          );
        }
        return;
      case 11:
        setClient(userNumber, message.body, "pedido");
        client
          .sendMessage(
            message.from,
            `*Seu pedido:*\n${message.body}\n*Endereço:*\n${endereco} ${confirmaPedido}`
          )
          .then((result) => {
            setClient(userNumber, 4, "status");
          });
        return;
      case 12:
        setClient(userNumber, message.body, "endereco");
        client
          .sendMessage(
            message.from,
            `*Seu pedido:*\n${pedido}\n*Endereço:*\n${message.body} ${confirmaPedido}`
          )
          .then((result) => {
            setClient(userNumber, 4, "status");
          });

        return;
      case 13:
        if (mensagem == "1") {
          client.sendMessage(message.from, `${menu}`).then((result) => {
            setClient(userNumber, 0, "status");
          });
          return;
        } else {
          client
            .sendMessage(
              message.from,
              "Seu pagamento foi armazenado em nosso sistema e será analisado em breve!"
            )
            .then((result) => {
              setClient(userNumber, 0, "status");
            });
          client.sendMessage("5511999547461@c.us", `Pix feito por ${nome}`);
          return;
        }
      case 15:
        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1; //months from 1-12
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();
        if (isNaN(message.body) || message.body > 31 || message.body <= 0) {
          client
            .sendMessage(
              message.from,
              `Desculpe não entendi, insira novamente o dia que deseja encomendar\n_(Exemplo: 22)_`
            )
            .then((result) => {
              setClient(userNumber, 15, "status");
            })
            .catch((erro) => {
              console.error("Erro pagamento: ", erro); //return um objeto de erro
            });
          return;
        } else {
          if (message.body < day) {
            if (month == 12) {
              month = 1;
              year = year + 1;
            }
            month = month + 1;
          }
          if (month == 4 || month == 6 || month == 9 || month == 11) {
            if (message.body > 30) {
              client
                .sendMessage(
                  message.from,
                  `Erro a data escolhida não existe, tente novamente.`
                )
                .then((result) => {
                  setClient(userNumber, 15, "status");
                })
                .catch((erro) => {
                  console.error("Erro agendar: ", erro); //return um objeto de erro
                });
            }
          }
          var criouPedido = createEncomenda(
            pedido,
            userNumber,
            year,
            month,
            message.body
          );
          if ((criouPedido = true)) {
            console.log("entrou");
          }
          client
            .sendMessage(
              message.from,
              `Seu pedido foi agendado para data: *${message.body}/${month}*`
            )
            .then((result) => {
              setClient(userNumber, 0, "status");
            });

          client.sendMessage(
            "5511999547461@c.us",
            `*ENCOMENDA PARA O DIA ${message.body}/${month}* de ${nome}\n\n*Encomenda:* ${pedido}\n*Endereço:* ${endereco}`
          );
          return;
        }
      /*case 16:
                if (mensagem == "1") {
                    var criouPedido = createEncomenda("teste", "numero", year, month, message.body);
                    if (criouPedido = true) {
                        console.log("entrou");
                    }
                    client.sendMessage(message.from, `Seu pedido foi agendado com sucesso`)
                        .then((result) => {
                            setStatus(userNumber, 0);
                        }).catch((erro) => {
                            console.error("Erro ao setar pedido: ", erro); //return um objeto de erro
                        });
                    return;
                } else if (mensagem == "2") {
                    client.sendMessage(message.from, "Agendamento Cancelado!")
                        .then((result) => {
                            setStatus(userNumber, 4);
                        })
                        .catch((erro) => {
                            console.error("Erro pagamento: ", erro); //return um objeto de erro
                        });
                    return;
                } else {
                    client.sendMessage(message.from, "Digite 1 para cancelar 2 para confirmar!")
                        .then((result) => {
                            setStatus(userNumber, 16);
                        })
                        .catch((erro) => {
                            console.error("Erro pagamento: ", erro); //return um objeto de erro
                        });
                }
                return;*/
    }
    switch (mensagem) {
      case "1":
        client
          .sendMessage(
            message.from,
            `Digite seu pedido:\n_(Exemplo: 2 Hambúrguer sem embalar)_`
          )
          .then((result) => {
            if (endereco == "inserir") {
              setClient(userNumber, 2, "status");
            } else {
              setClient(userNumber, 1, "status");
            }
          });
        return;
      case "2":
        await client.sendMessage(message.from, produtos);
        client.sendMessage(message.from, menu);
        return;
      case "3":
        client
          .sendMessage(
            message.from,
            `CNPJ: 08161042/0001-16\nEnvie um comprovante do pagamento\nDigite "1" para sair.`
          )
          .then((result) => {
            setClient(userNumber, 13, "status");
          });
        return;
      case "0":
        client.sendMessage(
          message.from,
          `Não está conseguindo fazer pedidos ou precisa de outra informação?\n☎️ Ligue para (11)4034-0520\n📍 Ficamos localizados na Rua Santa Bárbara, 670\n🕡 Horário de Atendimento: Segunda à Sábado das 6:30 às 18:00 horas`
        );
        return;
    }

    // Welcome - Sorry - Thanks Msg
    const saudacoes = [
      "bom",
      "oi",
      "olá",
      "ola",
      "tarde",
      "noite",
      "dia",
      "boa",
    ];
    const agradecimento = [
      "ok",
      "obrigado",
      "obrigada",
      "dnd",
      "obg",
      "obgd",
      "obgda",
      "okk",
    ];

    if (saudacoes.includes(mensagem)) {
      client.sendMessage(
        message.from,
        `Olá, ${message._data.notifyName}\n${menu}`
      );
      return;
    } else if (agradecimento.includes(mensagem)) {
      client.sendMessage(message.from, `;)`);
      return;
    } else {
      client.sendMessage(
        message.from,
        `${sorryMsg}\n\nNão está conseguindo fazer pedidos ou precisa de outra informação?\n☎️ Ligue para (11)4034-0520\n📍 Ficamos localizados na Rua Santa Bárbara, 670\n🕡 Horário de Atendimento: Segunda à Sábado das 6:30 às 18:00 horas`
      );
    }
  } catch (error) {
    console.log("Error Grandão: ", error);
    client.sendMessage("5511953207250@c.us", `Erro: Padaria ${error}`);
  }
});
