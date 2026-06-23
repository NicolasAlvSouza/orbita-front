let produtosSelecionados = [];

function getProdutosSelecionados() {
    return produtosSelecionados;
}

function normalizarProdutoSelecionado(item) {
    if (!item) return null;

    const produto_id = Number(
        item.produto_id ?? item.id_produto ?? item.produto_id ?? item.id
    );

    return {
        produto_id,
        quantidade: Number(item.quantidade ?? 1),
        valor_unitario: item.valor_unitario ?? null,
        observacao: item.observacao ?? ''
    };
}

function setProdutosSelecionados(lista) {
    produtosSelecionados = Array.isArray(lista)
        ? lista.map(normalizarProdutoSelecionado).filter((item) => item && item.produto_id != null)
        : [];
    atualizarTabelaProdutos();
}

function montarProdutosParaDemanda() {
    return produtosSelecionados.map((item) => ({
        produto_id: Number(item.produto_id),
        quantidade: Number(item.quantidade ?? 1),
        valor_unitario: item.valor_unitario ?? null,
        observacao: item.observacao ?? null
    }));
}

function atualizarTabelaProdutos() {
    const tbody = document.getElementById('corpo-tabela-produtos');
    const semProdutosMsg = document.getElementById('sem-produtos-msg');
    const tabelaProdutos = document.getElementById('tabela-produtos');

    if (!tbody || !semProdutosMsg || !tabelaProdutos) return;

    tbody.innerHTML = '';

    if (produtosSelecionados.length === 0) {
        semProdutosMsg.style.display = 'block';
        tabelaProdutos.style.display = 'none';
        return;
    }

    semProdutosMsg.style.display = 'none';
    tabelaProdutos.style.display = 'table';

    produtosSelecionados.forEach((item, index) => {
        const produto_id = item.produto_id ?? item.id_produto ?? item.produto_id ?? item.id;
        const produto = window.getProdutoPorId(produto_id);
        const nomeProduto = produto ? window.getNomeProduto(produto) : `Produto ${produto_id}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${nomeProduto}</td>
            <td>${item.quantidade}</td>
            <td>${item.valor_unitario ?? '-'}</td>
            <td>${item.observacao ?? '-'}</td>
            <td>
                <button type="button" class="btn-remover-produto" onclick="removerProdutoSelecionado(${index})">Remover</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}


function abrirModalProduto() {
    const produtoModalEl = document.getElementById('produtoModal');
    const produtoModal = produtoModalEl && window.bootstrap
        ? bootstrap.Modal.getOrCreateInstance(produtoModalEl)
        : null;

    if (produtoModal) {
        produtoModal.show();
    }
}

function adicionarProduto(event) {
    event.preventDefault();

    const produtoSelect = document.getElementById('produto-select');
    const quantidadeInput = document.getElementById('produto-quantidade');

    const produto_id = produtoSelect?.value;
    const quantidade = parseInt(quantidadeInput?.value, 10);

    if (!produto_id || !quantidade || quantidade < 1) {
        mostrarResultado('Por favor, selecione um produto e informe uma quantidade válida', 'error');
        return;
    }

    const jaAdicionado = produtosSelecionados.find(
    (p) => String(p.produto_id ?? p.produto_id) === String(produto_id)
);

    if (jaAdicionado) {
        jaAdicionado.quantidade += quantidade;
    } else {
        produtosSelecionados.push({
            produto_id: Number(produto_id),
            quantidade,
            valor_unitario: null,
            observacao: ''
        });
    }

    // atualiza tabela
    atualizarTabelaProdutos();

    // reset form
    const form = document.getElementById('form-produto');
    if (form) form.reset();

    if (quantidadeInput) {
        quantidadeInput.value = '1';
    }

    // fecha modal
    const produtoModalEl = document.getElementById('produtoModal');
    if (produtoModalEl && window.bootstrap) {
        bootstrap.Modal.getOrCreateInstance(produtoModalEl).hide();
    }

    mostrarResultado('Produto adicionado com sucesso!');
}

function limparProdutosSelecionados() {
    produtosSelecionados = [];
    atualizarTabelaProdutos();
}

function removerProdutoSelecionado(index) {
    produtosSelecionados.splice(index, 1);
    atualizarTabelaProdutos();
}

window.getProdutosSelecionados = getProdutosSelecionados;
window.setProdutosSelecionados = setProdutosSelecionados;
window.montarProdutosParaDemanda = montarProdutosParaDemanda;
window.adicionarProduto = adicionarProduto;
window.removerProdutoSelecionado = removerProdutoSelecionado;
window.abrirModalProduto = abrirModalProduto;
window.limparProdutosSelecionados = limparProdutosSelecionados;
window.atualizarTabelaProdutos = atualizarTabelaProdutos;
