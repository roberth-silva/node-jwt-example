require("dotenv-safe").config();
var jwt = require('jsonwebtoken');

const http = require('http'); 
const express = require('express');
const cookieParser = require('cookie-parser'); 
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());
app.use(cookieParser()); 

/**Função de verificação de autenticação */
function verifyJWT(req, res, next){
  var token = req.headers['x-access-token'];
  if (!token) return res.status(401).json({ auth: false, message: 'No token provided.' });
  
  jwt.verify(token, process.env.SECRET, function(err, decoded) {
    if (err) return res.status(500).json({ auth: false, message: 'Failed to authenticate token.' });
    
    // se tudo estiver ok, salva no request para uso posterior
    req.userId = decoded.id;

    /**A função next() passa para o próximo estágio de execução das funções no 
     * pipeline do middleware do Express, mas não antes de salvar a informação 
     * do id do usuário para a requisição, visando poder ser utilizado pelo próximo estágio.
     * E para usá-la, devemos inserir sua referência na chamada GET /clientes */
    next();
  });
}

app.get('/', (req, res, next) => {
    res.json({message: "Tudo ok por aqui!"});
});

app.get('/clientes', verifyJWT, (req, res, next) => { 
    console.log("Retornou todos clientes!");
    res.json([{id:1,nome:'Giovana'}]);
});

//authentication
app.post('/login', (req, res, next) => {
    //esse teste abaixo deve ser feito no banco de dados
    if(req.body.user === 'rob' && req.body.pwd === '123'){
      //auth ok
      const id = 1; //esse id viria do banco de dados
      var token = jwt.sign({ id }, process.env.SECRET, {
        expiresIn: 300 // expires in 5min
      });
      return res.json({ auth: true, token: token });
    }
    
    res.status(500).json({message: 'Login inválido!'});
});

//logout da aplicação
app.post('/logout', function(req,res){
  res.json({
    auth: false,
    token: null
  });
});

var server = http.createServer(app); 
server.listen(3000);

console.log("Servidor escutando na porta 3000 ...");