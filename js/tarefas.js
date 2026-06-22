const formTarefa = document.getElementById('form-tarefa');
const inputId = document.getElementById('tarefa-id');
const inputTitulo = document.getElementById('tarefa-titulo');
const inputDescricao = document.getElementById('tarefa-descricao');
const inputPrioridade = document.getElementById('tarefa-prioridade');
const inputStatus = document.getElementById('tarefa-status');
const modalTitle = document.getElementById('tarefaModalTitle');
const btnNovaTarefa = document.getElementById('btn-nova-tarefa');
const btnModalSalvar = document.getElementById('btn-modal-salvar');
const btnModalEditar = document.getElementById('btn-modal-editar');
const btnModalExcluir = document.getElementById('btn-modal-excluir');
const btnModalProdutos = document.getElementById('btn-modal-produtos');

const listaCards = document.getElementById('lista-tarefas-cards');
const listaTabela = document.getElementById('lista-tarefas-tabela');

const cardsWrapper = document.getElementById('tarefas-cards-wrapper');
const kanbanWrapper = document.getElementById('tarefas-kanban-wrapper');
const tabelaWrapper = document.getElementById('tarefas-tabela-wrapper');

const colunaNovo = document.getElementById('kanban-novo');
const colunaAndamento = document.getElementById('kanban-andamento');
const colunaConcluida = document.getElementById('kanban-concluida');
const colunaEntrega = document.getElementById('kanban-entrega');
const colunaAtrasada = document.getElementById('kanban-atrasada');

const btnViewCards = document.getElementById('view-cards');
const btnViewKanban = document.getElementById('view-kanban');
const btnViewTable = document.getElementById('view-table');
const tarefaModalEl = document.getElementById('tarefaModal');
const produtoModalEl = document.getElementById('produtoModal');

const tarefaModal = tarefaModalEl && window.bootstrap
    ? bootstrap.Modal.getOrCreateInstance(tarefaModalEl)
    : null;

const produtoModal = produtoModalEl && window.bootstrap
    ? bootstrap.Modal.getOrCreateInstance(produtoModalEl)
    : null;

const STATUS_LABEL = {
    novo: 'Novo',
    andamento: 'Em andamento',
    entrega: 'Em entrega',
    atrasada: 'Atrasada',
    concluida: 'Concluída',
};

let tarefas = [];
let viewMode = 'cards';
let tarefaSelecionadaId = null;
let modalMode = 'create';
let produtosSelecionados = [];
let todosProdutos = [];

function normalizarStatus(tarefa) {
    const bruto = String(tarefa?.status || '').toLowerCase();

    if (bruto.includes('and')) return 'andamento';
    if (bruto.includes('entreg')) return 'entrega';
    if (bruto.includes('atras')) return 'atrasada';
    if (bruto.includes('concl')) return 'concluida';
    if (tarefa?.concluida) return 'concluida';

    return 'novo';
}

function aplicarViewMode() {
    cardsWrapper.classList.toggle('is-hidden', viewMode !== 'cards');
    kanbanWrapper.classList.toggle('is-hidden', viewMode !== 'kanban');
    tabelaWrapper.classList.toggle('is-hidden', viewMode !== 'table');

    btnViewCards.classList.toggle('active', viewMode === 'cards');
    btnViewKanban.classList.toggle('active', viewMode === 'kanban');
    btnViewTable.classList.toggle('active', viewMode === 'table');
}

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

function preencherSelectProdutos() {
    const selectProduto = document.getElementById('produto-select');
    selectProduto.innerHTML = '<option value="">Selecione um produto</option>';
    
    todosProdutos.forEach(produto => {
        const option = document.createElement('option');
        option.value = produto.id;
        option.textContent = produto.nome || produto.name || `Produto ${produto.id}`;
        selectProduto.appendChild(option);
    });
}

function atualizarTabelaProdutos() {
    const tbody = document.getElementById('corpo-tabela-produtos');
    const semProdutosMsg = document.getElementById('sem-produtos-msg');
    const tabelaProdutos = document.getElementById('tabela-produtos');
    
    tbody.innerHTML = '';
    
    if (produtosSelecionados.length === 0) {
        semProdutosMsg.style.display = 'block';
        tabelaProdutos.style.display = 'none';
    } else {
        semProdutosMsg.style.display = 'none';
        tabelaProdutos.style.display = 'table';
        
        produtosSelecionados.forEach((item, index) => {
            const produto = todosProdutos.find(p => String(p.id) === String(item.produtoId));
            const nomeProduto = produto ? (produto.nome || produto.name || `Produto ${item.produtoId}`) : `Produto ${item.produtoId}`;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${nomeProduto}</td>
                <td>${item.quantidade}</td>
                <td><button type="button" class="btn-remover-produto" onclick="removerProdutoSelecionado(${index})">Remover</button></td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function removerProdutoSelecionado(index) {
    produtosSelecionados.splice(index, 1);
    atualizarTabelaProdutos();
}

function abrirModalProduto() {
    if (produtoModal) {
        produtoModal.show();
    }
}

function criarBadgeStatus(status) {
    return `<span class="status-pill ${status}">${STATUS_LABEL[status] || 'Novo'}</span>`;
}

function criarCardHtml(tarefa) {
    const status = normalizarStatus(tarefa);
    const descricao = tarefa.descricao || '';
    return `
        <div class="tarefa-card ${status}">
            <div class="tarefa-card-title"><b>#${tarefa.id}</b> ${tarefa.titulo}</div>
            ${descricao ? `<div class="tarefa-card-desc">${descricao}</div>` : ''}
            <div>${criarBadgeStatus(status)}</div>
        </div>
    `;
}

function criarKanbanItem(tarefa) {
    const status = normalizarStatus(tarefa);
    const item = document.createElement('div');
    item.className = `kanban-card ${status}`;
    item.draggable = true;
    item.dataset.id = tarefa.id;

    item.innerHTML = `
        <div class="tarefa-card-title"><b>#${tarefa.id}</b> ${tarefa.titulo}</div>
        ${tarefa.descricao ? `<div class="tarefa-card-desc">${tarefa.descricao}</div>` : ''}
        <div>${criarBadgeStatus(status)}</div>
    `;

    item.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', String(tarefa.id));
    });

    item.addEventListener('click', () => {
        verTarefa(tarefa.id);
    });

    return item;
}

function renderCards() {
    listaCards.innerHTML = '';

    if (!tarefas.length) {
        listaCards.innerHTML = '<div class="empty-state"><p>Nenhuma tarefa encontrada.</p></div>';
        return;
    }

    tarefas.forEach((tarefa) => {
        const card = document.createElement('div');
        card.innerHTML = criarCardHtml(tarefa);
        const item = card.firstElementChild;
        item.addEventListener('click', () => {
            verTarefa(tarefa.id);
        });
        listaCards.appendChild(item);
    });
}

function renderTabela() {
    listaTabela.innerHTML = '';

    if (!tarefas.length) {
        listaTabela.innerHTML = '<tr><td colspan="5">Nenhuma tarefa encontrada.</td></tr>';
        return;
    }

    tarefas.forEach((tarefa) => {
        const status = normalizarStatus(tarefa);
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>${tarefa.id}</td>
            <td>${tarefa.titulo}</td>
            <td>${tarefa.descricao || '-'}</td>
            <td>${criarBadgeStatus(status)}</td>
            <td class="table-actions">
                <button type="button" class="small" onclick="verTarefa(${tarefa.id})">Ver</button>
                <button type="button" class="small" onclick="editarTarefa(${tarefa.id})">Editar</button>
                <button type="button" class="small danger" onclick="excluirTarefa(${tarefa.id})">Excluir</button>
            </td>
        `;
        listaTabela.appendChild(linha);
    });
}

function renderKanban() {
    colunaNovo.innerHTML = '';
    colunaAndamento.innerHTML = '';
    colunaEntrega.innerHTML = '';
    colunaConcluida.innerHTML = '';
    colunaAtrasada.innerHTML = '';

    tarefas.forEach((tarefa) => {
        const status = normalizarStatus(tarefa);
        const card = criarKanbanItem(tarefa);

        if (status === 'andamento') {
            colunaAndamento.appendChild(card);
        } else if (status === 'entrega') {
            colunaEntrega.appendChild(card);
        } else if (status === 'concluida') {
            colunaConcluida.appendChild(card);
        } else if (status === 'atrasada') {
            colunaAtrasada.appendChild(card);
        } else {
            colunaNovo.appendChild(card);
        }
    });
}

function renderTudo() {
    renderCards();
    renderKanban();
    renderTabela();
    aplicarViewMode();
}

async function carregarTarefas() {
    try {
        const resposta = await apiRequest('/demandas');

        if (Array.isArray(resposta)) {
            tarefas = resposta;
        } else if (Array.isArray(resposta?.tarefas)) {
            tarefas = resposta.tarefas;
        } else if (Array.isArray(resposta?.data)) {
            tarefas = resposta.data;
        } else {
            tarefas = [];
        }

        renderTudo();
    } catch (erro) {
        mostrarResultado(`Erro ao carregar tarefas: ${erro.message}`, 'error');
    }
}

async function atualizarStatusApi(tarefa, novoStatus) {
    const payload = {
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || '',
        status: novoStatus,
        concluida: novoStatus === 'concluida',
    };

    await apiRequest(`/demandas/${tarefa.id}`, {
        method: 'PUT',
        body: payload,
    });
}

async function  moverTarefa(id, novoStatus) {
    const tarefa = tarefas.find((item) => String(item.id) === String(id));
    if (!tarefa) return;

    try {
        await atualizarStatusApi(tarefa, novoStatus);

        tarefa.status = novoStatus;
        tarefa.concluida = novoStatus === 'concluida';

        renderTudo();
        mostrarResultado(`Status atualizado para ${STATUS_LABEL[novoStatus]}.`);
    } catch (erro) {
        mostrarResultado(`Erro ao atualizar status: ${erro.message}`, 'error');
    }
}

function configurarDrop(coluna, statusDestino) {
    coluna.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    coluna.addEventListener('drop', async (event) => {
        event.preventDefault();
        const id = event.dataTransfer.getData('text/plain');
        await moverTarefa(id, statusDestino);
    });
}

function getTarefaById(id) {
    return tarefas.find((item) => String(item.id) === String(id));
}

function setCamposSomenteLeitura(somenteLeitura) {
    inputTitulo.readOnly = somenteLeitura;
    inputDescricao.readOnly = somenteLeitura;
    inputStatus.disabled = somenteLeitura;
    if (inputPrioridade) {
        inputPrioridade.disabled = somenteLeitura;
    }
}

function preencherModal(tarefa) {
    inputId.value = tarefa?.id || '';
    inputTitulo.value = tarefa?.titulo || '';
    inputDescricao.value = tarefa?.descricao || '';
    if (inputPrioridade) {
        inputPrioridade.value = tarefa?.prioridade || 'baixa';
    }
    inputStatus.value = normalizarStatus(tarefa || {});
}

function aplicarModoModal() {
    const isCreate = modalMode === 'create';
    const isView = modalMode === 'view';

    setCamposSomenteLeitura(isView);

    btnModalSalvar.classList.toggle('is-hidden', isView);
    btnModalEditar.classList.toggle('is-hidden', !isView);
    btnModalExcluir.classList.toggle('is-hidden', isCreate);

    if (isCreate) {
        modalTitle.textContent = 'Nova tarefa';
        btnModalSalvar.textContent = 'Salvar';
    } else if (isView) {
        modalTitle.textContent = 'Detalhes da tarefa';
    } else {
        modalTitle.textContent = 'Editar tarefa';
        btnModalSalvar.textContent = 'Salvar alterações';
    }
}

function abrirNovaTarefa() {
    tarefaSelecionadaId = null;
    modalMode = 'create';
    produtosSelecionados = [];
    preencherModal({ id: '', titulo: '', descricao: '', status: 'novo', prioridade: 'baixa' });
    atualizarTabelaProdutos();
    aplicarModoModal();
}

function verTarefa(id) {
    const tarefa = getTarefaById(id);
    if (!tarefa) return;

    tarefaSelecionadaId = tarefa.id;
    modalMode = 'view';
    preencherModal(tarefa);
    
    // Carregar produtos da tarefa
    produtosSelecionados = tarefa.produtos ? [...tarefa.produtos] : [];
    atualizarTabelaProdutos();
    
    aplicarModoModal();
    tarefaModal?.show();
}

function editarTarefa(id = null) {
    const tarefa = getTarefaById(id || tarefaSelecionadaId);
    if (!tarefa) return;

    tarefaSelecionadaId = tarefa.id;
    modalMode = 'edit';
    preencherModal(tarefa);
    
    // Carregar produtos da tarefa
    produtosSelecionados = tarefa.produtos ? [...tarefa.produtos] : [];
    atualizarTabelaProdutos();
    
    aplicarModoModal();
    tarefaModal?.show();
}

async function excluirTarefa(id = null) {
    const tarefa = getTarefaById(id || tarefaSelecionadaId);
    if (!tarefa) return;

    const confirmar = window.Swal
        ? await Swal.fire({
            icon: 'warning',
            text: `Excluir a tarefa "${tarefa.titulo}"?`,
            showCancelButton: true,
            confirmButtonText: 'Excluir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
        })
        : { isConfirmed: confirm('Excluir esta tarefa?') };

    if (!confirmar.isConfirmed) return;

    try {
        await apiRequest(`/demandas/${tarefa.id}`, { method: 'DELETE' });
        tarefas = tarefas.filter((item) => String(item.id) !== String(tarefa.id));
        tarefaModal?.hide();
        renderTudo();
        mostrarResultado('Tarefa excluída com sucesso.');
    } catch (erro) {
        mostrarResultado(`Erro ao excluir tarefa: ${erro.message}`, 'error');
    }
}

async function criarTarefa(event) {
    event.preventDefault();

    const id = inputId.value;
    const titulo = inputTitulo.value.trim();
    const descricao = inputDescricao.value.trim();
    const prioridade = inputPrioridade ? inputPrioridade.value : 'baixa';
    const status = inputStatus.value;

    if (!titulo) return;

    try {
        if (modalMode === 'edit' && id) {
            const payload = { 
                titulo, 
                descricao, 
                prioridade,
                status, 
                concluida: status === 'concluida',
                produtos: produtosSelecionados
            };
            const resposta = await apiRequest(`/demandas/${id}`, {
                method: 'PUT',
                body: payload,
            });

            const index = tarefas.findIndex((item) => String(item.id) === String(id));
            if (index >= 0) {
                tarefas[index] = {
                    ...tarefas[index],
                    ...payload,
                    ...(typeof resposta === 'object' ? resposta : {}),
                };
            }

            mostrarResultado('Tarefa atualizada com sucesso.');
        } else {
            const nova = await apiRequest('/demandas', {
                method: 'POST',
                body: { 
                    titulo, 
                    descricao, 
                    prioridade,
                    status, 
                    concluida: status === 'concluida',
                    produtos: produtosSelecionados
                },
            });

            if (nova && nova.id) {
                tarefas.push({ 
                    ...nova, 
                    descricao, 
                    status, 
                    concluida: status === 'concluida',
                    produtos: produtosSelecionados
                });
            } else {
                await carregarTarefas();
            }

            mostrarResultado('Tarefa criada com sucesso.');
        }

        renderTudo();
        if (tarefaModal) tarefaModal.hide();
        formTarefa.reset();
        inputStatus.value = 'novo';
        if (inputPrioridade) {
            inputPrioridade.value = 'baixa';
        }
        produtosSelecionados = [];
        modalMode = 'create';
        tarefaSelecionadaId = null;
    } catch (erro) {
        mostrarResultado(`Erro ao salvar tarefa: ${erro.message}`, 'error');
    }
}

function adicionarProduto(event) {
    event.preventDefault();
    
    const produtoId = document.getElementById('produto-select').value;
    const quantidade = parseInt(document.getElementById('produto-quantidade').value);
    
    if (!produtoId || !quantidade || quantidade < 1) {
        mostrarResultado('Por favor, selecione um produto e informe uma quantidade válida', 'error');
        return;
    }
    
    // Verificar se o produto já foi adicionado
    const jaAdicionado = produtosSelecionados.find(p => String(p.produtoId) === String(produtoId));
    
    if (jaAdicionado) {
        // Atualizar quantidade
        jaAdicionado.quantidade += quantidade;
    } else {
        // Adicionar novo produto
        produtosSelecionados.push({
            produtoId: parseInt(produtoId),
            quantidade: quantidade
        });
    }
    
    atualizarTabelaProdutos();
    
    // Resetar form e fechar modal
    document.getElementById('form-produto').reset();
    document.getElementById('produto-quantidade').value = '1';
    if (produtoModal) produtoModal.hide();
    
    mostrarResultado('Produto adicionado com sucesso!');
}

btnViewCards.addEventListener('click', () => {
    viewMode = 'cards';
    aplicarViewMode();
});

btnViewKanban.addEventListener('click', () => {
    viewMode = 'kanban';
    aplicarViewMode();
});

btnViewTable.addEventListener('click', () => {
    viewMode = 'table';
    aplicarViewMode();
});

formTarefa.addEventListener('submit', criarTarefa);

btnNovaTarefa.addEventListener('click', abrirNovaTarefa);
btnModalEditar.addEventListener('click', () => editarTarefa());
btnModalExcluir.addEventListener('click', () => excluirTarefa());
btnModalProdutos.addEventListener('click', abrirModalProduto);

const formProduto = document.getElementById('form-produto');
if (formProduto) {
    formProduto.addEventListener('submit', adicionarProduto);
}

window.verTarefa = verTarefa;
window.editarTarefa = editarTarefa;
window.excluirTarefa = excluirTarefa;
window.removerProdutoSelecionado = removerProdutoSelecionado;

configurarDrop(colunaNovo, 'novo');
configurarDrop(colunaAndamento, 'andamento');
configurarDrop(colunaConcluida, 'concluida');
configurarDrop(colunaEntrega, 'entrega');
configurarDrop(colunaAtrasada, 'atrasada');

window.addEventListener('DOMContentLoaded', async () => {
    if (!getToken()) {
        window.location.href = 'login.html';
        return;
    }

    await carregarProdutos();
    await carregarTarefas();
});
