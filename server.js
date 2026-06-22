import express from 'express';
import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// ==========================================
// ⚠️ ATENÇÃO: COLE SUAS CREDENCIAIS DO TURSO AQUI EMBAIXO
const TURSO_URL = "libsql://meu-banco-edvaldo.aws-us-east-1.turso.io";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODIwOTE4MDEsImlkIjoiMDE5ZWVjZTUtN2MwMS03NDRlLWExYjAtNjJiNjRhMzJjY2FjIiwicmlkIjoiMjM3ZWNmY2MtM2JhNS00OTEzLTk0YzktY2EyZGMxODNhMWQ2In0.zPYGnj-6OhIg33p28jyB8W-usaGOg5NSqiXEPKaEyMHVvPH21_cyF4WQPFoLlBlcydn3_84zsqVmnlQwTHPcCg";
// ==========================================

// Configurações para o servidor entender JSON e achar os arquivos do Front-end
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(__dirname));

// Conectar ao banco de dados do Turso
const banco = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN
});

// ROTA DE CADASTRO: É aqui que o Front-end vai enviar os dados
app.post('/cadastrar', async (req, res) => {
    const { nome, email, senha } = req.body;

    // Validação simples
    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios!" });
    }

    try {
        // Insere o usuário no banco de dados do Turso usando SQL puro
        await banco.execute({
            sql: "INSERT INTO utilizadores (nome, email, senha) VALUES (?, ?, ?)",
            args: [nome, email, senha]
        });

        return res.status(201).json({ mensagem: "Usuário cadastrado com sucesso!" });
    } catch (error) {
        // Se o e-mail já existir, o Turso vai dar um erro de restrição (Constraint)
        if (error.message && error.message.includes("UNIQUE")) {
            return res.status(400).json({ erro: "Este e-mail já está cadastrado!" });
        }
        
        console.error("Erro no banco:", error);
        return res.status(500).json({ erro: "Erro interno ao salvar no banco de dados." });
    }
});

//  AQUI ENTROU A NOVA ROTA DE LOGIN:
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: "E-mail e senha são obrigatórios!" });
    }

    try {
        // Busca o usuário no Turso pelo e-mail
        const resultado = await banco.execute({
            sql: "SELECT * FROM utilizadores WHERE email = ?",
            args: [email]
        });

        // Se não achar o e-mail
        if (resultado.rows.length === 0) {
            return res.status(401).json({ erro: "E-mail ou senha incorretos!" });
        }

        const usuario = resultado.rows[0];

        // Verifica se a senha bate
        if (usuario.senha !== senha) {
            return res.status(401).json({ erro: "E-mail ou senha incorretos!" });
        }

        // Se tudo der certo, responde com sucesso
        return res.status(200).json({ mensagem: "Login autorizado!" });

    } catch (error) {
        console.error("Erro no login:", error);
        return res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

// Iniciar o servidor na porta 3000 (Sempre a última linha)
app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});