let todosProdutos = [];

async function carregarProdutos() {
    try {
        const resposta = await apiRequest('/produtos');
        let produtos = [];

        if (Array.isArray(resposta)) {
            produtos = resposta;
        } else if (Array.isArray(resposta?.produtos)) {
            produtos = resposta.produtos;
        } else if (Array.isArray(resposta?.data)) {
            produtos = resposta.data;
        }

        todosProdutos = produtos;
        preencherSelectProdutos();
    } catch (erro) {
        console.error('Erro ao carregar produtos:', erro.message);
        mostrarResultado(`Erro ao carregar produtos: ${erro.message}`, 'error');
    }
}

function getTodosProdutos() {
    return todosProdutos;
}

function getProdutoPorId(id) {
    return todosProdutos.find((produto) => String(produto.id) === String(id));
}

function preencherSelectProdutos() {
    const selectProduto = document.getElementById('produto-select');
    if (!selectProduto) return;

    selectProduto.innerHTML = '<option value="">Selecione um produto</option>';

    todosProdutos.forEach((produto) => {
        const option = document.createElement('option');
        option.value = produto.id;
        option.textContent = produto.nome || produto.name || `Produto ${produto.id}`;
        selectProduto.appendChild(option);
    });
}

function getNomeProduto(produto) {
    return produto?.nome || produto?.name || `Produto ${produto?.id}`;
}

window.carregarProdutos = carregarProdutos;
window.getTodosProdutos = getTodosProdutos;
window.getProdutoPorId = getProdutoPorId;
window.getNomeProduto = getNomeProduto;

async function submitCriarProduto(event) {
    event.preventDefault();

    const nomeEl = document.getElementById('produto-nome');
    const precoEl = document.getElementById('produto-preco');
    if (!nomeEl || !precoEl) return;

    const nome = nomeEl.value.trim();
    const valor = parseFloat(precoEl.value);

    if (!nome) {
        mostrarResultado('Nome do produto é obrigatório.', 'error');
        return;
    }

    if (Number.isNaN(valor) || valor < 0) {
        mostrarResultado('Preço inválido.', 'error');
        return;
    }

    try {
        const payload = { nome, valor };
        const novo = await apiRequest('/produtos', { method: 'POST', body: payload });
        mostrarResultado('Produto criado com sucesso.');
        // reset form
        const form = document.getElementById('form-criar-produto');
        if (form) form.reset();
        // fechar modal
        const modalEl = document.getElementById('criarProdutoModal');
        if (modalEl && window.bootstrap) {
            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        }
        // recarregar produtos
        await carregarProdutos();
    } catch (erro) {
        console.error('Erro ao criar produto:', erro);
        mostrarResultado(`Falha ao criar produto: ${erro.message}`, 'error');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const formCriar = document.getElementById('form-criar-produto');
    if (formCriar) formCriar.addEventListener('submit', submitCriarProduto);
});
