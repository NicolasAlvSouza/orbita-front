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
        renderizarListaProdutos();
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

function renderizarListaProdutos() {
    const tbody = document.getElementById('corpo-lista-produtos');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (todosProdutos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #fff;">Nenhum produto disponível</td></tr>';
        return;
    }

    todosProdutos.forEach((produto) => {
        const nomeProduto = getNomeProduto(produto);
        const preco = (produto.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        const tr = document.createElement('tr');
        tr.style.color = '#fff';
        tr.innerHTML = `
            <td>${nomeProduto}</td>
            <td>${preco}</td>
            <td class="table-actions">
                <button type="button" class="small" onclick="abrirEditarProduto(${produto.id})">Editar</button>
                <button type="button" class="small danger" onclick="excluirProduto(${produto.id})">Deletar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function abrirEditarProduto(id) {
    const produto = getProdutoPorId(id);
    if (!produto) return;

    // Preencher modal com dados atuais
    document.getElementById('edit-produto-id').value = id;
    document.getElementById('edit-produto-nome').value = getNomeProduto(produto);
    document.getElementById('edit-produto-preco').value = produto.preco || '';

    if (window.bootstrap && document.getElementById('editarProdutoModal')) {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('editarProdutoModal')).show();
    }
}

async function salvarEdicaoProduto(event) {
    event.preventDefault();

    const id = document.getElementById('edit-produto-id').value;
    const nome = document.getElementById('edit-produto-nome').value.trim();
    const preco = parseFloat(document.getElementById('edit-produto-preco').value);

    if (!nome) {
        mostrarResultado('Nome do produto é obrigatório.', 'error');
        return;
    }

    if (Number.isNaN(preco) || preco < 0) {
        mostrarResultado('Preço inválido.', 'error');
        return;
    }

    try {
        await apiRequest(`/produtos/${id}`, {
            method: 'PUT',
            body: { 
                nome,
                preco: preco 
            }
        });

        const produto = getProdutoPorId(id);
        if (produto) {
            produto.nome = nome;
            produto.preco = preco;
        }
        
        renderizarListaProdutos();
        preencherSelectProdutos();
        document.getElementById('form-editar-produto').reset();
        
        if (window.bootstrap) {
            bootstrap.Modal.getOrCreateInstance(document.getElementById('editarProdutoModal')).hide();
        }
        
        mostrarResultado('Produto atualizado com sucesso.');
    } catch (erro) {
        console.error('Erro ao atualizar produto:', erro);
        mostrarResultado(`Falha ao atualizar produto: ${erro.message}`, 'error');
    }
}

async function excluirProduto(id) {
    const produto = getProdutoPorId(id);
    if (!produto) return;

    const confirmar = window.Swal
        ? await Swal.fire({
            icon: 'warning',
            title: 'Remover produto?',
            text: `Deseja deletar "${getNomeProduto(produto)}" permanentemente?`,
            showCancelButton: true,
            confirmButtonText: 'Deletar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
        })
        : { isConfirmed: confirm(`Deletar "${getNomeProduto(produto)}"?`) };

    if (!confirmar.isConfirmed) return;

    try {
        await apiRequest(`/produtos/${id}`, { method: 'DELETE' });
        
        todosProdutos = todosProdutos.filter((p) => String(p.id) !== String(id));
        renderizarListaProdutos();
        preencherSelectProdutos();
        mostrarResultado('Produto deletado com sucesso.');
    } catch (erro) {
        console.error('Erro ao deletar produto:', erro);
        mostrarResultado(`Falha ao deletar produto: ${erro.message}`, 'error');
    }
}

window.carregarProdutos = carregarProdutos;
window.getTodosProdutos = getTodosProdutos;
window.getProdutoPorId = getProdutoPorId;
window.getNomeProduto = getNomeProduto;
window.abrirEditarProduto = abrirEditarProduto;
window.excluirProduto = excluirProduto;
window.renderizarListaProdutos = renderizarListaProdutos;
window.submitCriarProduto = submitCriarProduto;
window.salvarEdicaoProduto = salvarEdicaoProduto;

async function submitCriarProduto(event) {
    event.preventDefault();

    const nomeEl = document.getElementById('produto-nome');
    const precoEl = document.getElementById('produto-preco');
    if (!nomeEl || !precoEl) return;

    const nome = nomeEl.value.trim();
    const preco = parseFloat(precoEl.value);

    if (!nome) {
        mostrarResultado('Nome do produto é obrigatório.', 'error');
        return;
    }

    if (Number.isNaN(preco) || preco < 0) {
        mostrarResultado('Preço inválido.', 'error');
        return;
    }

    try {
        const payload = { nome, preco: preco };
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
    
    const formEditar = document.getElementById('form-editar-produto');
    if (formEditar) formEditar.addEventListener('submit', salvarEdicaoProduto);
    
    // Recarregar tabela quando o modal de gerenciar produtos for aberto
    const gerenciarProdutosModal = document.getElementById('gerenciarProdutosModal');
    if (gerenciarProdutosModal) {
        gerenciarProdutosModal.addEventListener('show.bs.modal', () => {
            renderizarListaProdutos();
        });
    }
});
