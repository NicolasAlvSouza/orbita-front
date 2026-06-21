let produtosSelecionados = [];

function getProdutosSelecionados() {
    return produtosSelecionados;
}

function setProdutosSelecionados(lista) {
    produtosSelecionados = Array.isArray(lista) ? [...lista] : [];
    atualizarTabelaProdutos();
}

function montarProdutosParaDemanda() {
    return produtosSelecionados.map((item) => ({
        id_produto: item.produtoId || item.id_produto || item.id,
        quantidade: Number(item.quantidade || 1),
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
        const produto = window.getProdutoPorId(item.produtoId || item.id_produto || item.id);
        const nomeProduto = produto ? window.getNomeProduto(produto) : `Produto ${item.produtoId || item.id_produto || item.id}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${nomeProduto}</td>
            <td>${item.quantidade}</td>
            <td><button type="button" class="btn-remover-produto" onclick="removerProdutoSelecionado(${index})">Remover</button></td>
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

    const produtoId = document.getElementById('produto-select').value;
    const quantidade = parseInt(document.getElementById('produto-quantidade').value, 10);

    if (!produtoId || !quantidade || quantidade < 1) {
        mostrarResultado('Por favor, selecione um produto e informe uma quantidade válida', 'error');
        return;
    }

    const jaAdicionado = produtosSelecionados.find((p) => String(p.produtoId) === String(produtoId));

    if (jaAdicionado) {
        jaAdicionado.quantidade += quantidade;
    } else {
        produtosSelecionados.push({
            produtoId: produtoId,
            quantidade,
        });
    }

    atualizarTabelaProdutos();
    document.getElementById('form-produto').reset();
    document.getElementById('produto-quantidade').value = '1';

    const produtoModalEl = document.getElementById('produtoModal');
    if (produtoModalEl && window.bootstrap) {
        bootstrap.Modal.getOrCreateInstance(produtoModalEl).hide();
    }

    mostrarResultado('Produto adicionado com sucesso!');
}

function removerProdutoSelecionado(index) {
    produtosSelecionados.splice(index, 1);
    atualizarTabelaProdutos();
}

function limparProdutosSelecionados() {
    produtosSelecionados = [];
    atualizarTabelaProdutos();
}

window.getProdutosSelecionados = getProdutosSelecionados;
window.setProdutosSelecionados = setProdutosSelecionados;
window.montarProdutosParaDemanda = montarProdutosParaDemanda;
window.adicionarProduto = adicionarProduto;
window.removerProdutoSelecionado = removerProdutoSelecionado;
window.abrirModalProduto = abrirModalProduto;
window.limparProdutosSelecionados = limparProdutosSelecionados;
