const formCadastro = document.getElementById('form-cadastro');

setupValidation(formCadastro);

async function cadastrarUsuario(event) {
    event.preventDefault();

    const nome = document.getElementById('cadastro-nome').value.trim();
    const email = document.getElementById('cadastro-email').value.trim();
    const senha = document.getElementById('cadastro-senha').value;

    // Validação básica
    if (!nome || !email || !senha) {
        mostrarResultado('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }

    if (senha.length < 6) {
        mostrarResultado('A senha deve ter no mínimo 6 caracteres.', 'error');
        return;
    }

    const payload = {
        nome,
        email,
        senha,
    };

    try {
        console.log('Enviando cadastro:', payload);
        const usuario = await apiRequest('/usuarios', { method: 'POST', body: payload, auth: false });
        console.log('Cadastro realizado:', usuario);
        mostrarResultado(`Cadastro realizado com sucesso: ${usuario.nome}`);
        formCadastro.reset();
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    } catch (erro) {
        console.error('Erro no cadastro:', erro);
        mostrarResultado(`Falha no cadastro: ${erro.message}`, 'error');
    }
}

if (formCadastro) {
    formCadastro.addEventListener('submit', cadastrarUsuario);
}
