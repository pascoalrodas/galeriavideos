const cardLogin = document.getElementById('card-login');
        const cardCadastro = document.getElementById('card-cadastro');

        function mostrarCadastro() {
            cardLogin.classList.add('escondido');
            cardCadastro.classList.remove('escondido');
        }

        function mostrarLogin() {
            cardCadastro.classList.add('escondido');
            cardLogin.classList.remove('escondido');
        }

        const form = document.getElementById('cadastro-form');
        const mensagemDiv = document.getElementById('mensagem');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            mensagemDiv.className = 'hidden';

            try {
                const resposta = await fetch('/cadastrar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, senha })
                });
                const dados = await resposta.json();
                if (resposta.ok) {
                    mensagemDiv.textContent = dados.mensagem;
                    mensagemDiv.className = 'sucesso';
                    form.reset();
                    setTimeout(mostrarLogin, 2000);
                } else {
                    mensagemDiv.textContent = dados.erro;
                    mensagemDiv.className = 'erro';
                }
            } catch {
                mensagemDiv.textContent = 'Erro ao conectar com o servidor.';
                mensagemDiv.className = 'erro';
            }
        });

        const loginForm = document.getElementById('login-form');
        const mensagemLogin = document.getElementById('mensagem-login');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-senha').value;
            mensagemLogin.className = 'hidden';

            try {
                const resposta = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });
                const dados = await resposta.json();

                if (resposta.ok) {
                    window.location.href = '/galeria';
                } else {
                    mensagemLogin.textContent = dados.erro;
                    mensagemLogin.className = 'erro';
                }
            } catch {
                mensagemLogin.textContent = 'Erro ao conectar com o servidor.';
                mensagemLogin.className = 'erro';
            }
        });