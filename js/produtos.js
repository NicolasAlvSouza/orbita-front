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
