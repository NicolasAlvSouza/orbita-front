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
const tarefaModal = tarefaModalEl && window.bootstrap
    ? bootstrap.Modal.getOrCreateInstance(tarefaModalEl)
    : null;

const STATUS_LABEL = {
    novo: 'Novo',
    andamento: 'Em andamento',
    entrega: 'Em entrega',
    atrasada: 'Atrasada',
    concluida: 'Concluída',
};

let demandas = [];
let viewMode = 'cards';
let tarefaSelecionadaId = null;
let modalMode = 'create';

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

function criarBadgeStatus(status) {
    return `<span class="status-pill ${status}">${STATUS_LABEL[status] || 'Novo'}</span>`;
}

function criarCardHtml(demanda) {
    const status = normalizarStatus(demanda);
    const prioridade = (demanda.prioridade || 'baixa').toLowerCase();
    const descricao = demanda.descricao || '';
    const prioridadeLabel = prioridade.charAt(0).toUpperCase() + prioridade.slice(1);
    
    return `
        <div class="tarefa-card ${status}">
            <div class="tarefa-card-title-row">
                <span class="prioridade-small ${prioridade}">${prioridadeLabel}</span>
                <div class="tarefa-card-title">${demanda.nome_cliente}</div>
            </div>
            ${descricao ? `<div class="tarefa-card-desc">${descricao}</div>` : ''}
            <div>${criarBadgeStatus(status)}</div>
        </div>
    `;
}

function criarKanbanItem(demanda) {
    const status = normalizarStatus(demanda);
    const prioridade = (demanda.prioridade || 'baixa').toLowerCase();
    const item = document.createElement('div');
    item.className = `kanban-card ${status}`;
    item.draggable = true;
    item.dataset.id = demanda.id;

    const prioridadeLabel = prioridade.charAt(0).toUpperCase() + prioridade.slice(1);

    item.innerHTML = `
        <div class="kanban-card-header">
            <span class="prioridade ${prioridade}">${prioridadeLabel}</span>
        </div>
        <div class="tarefa-card-title">${demanda.nome_cliente}</div>
        <div>${criarBadgeStatus(status)}</div>
    `;

    item.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', String(demanda.id));
    });

    item.addEventListener('click', () => {
        verTarefa(demanda.id);
    });

    return item;
}

function renderCards() {
    listaCards.innerHTML = '';

    if (!demandas.length) {
        listaCards.innerHTML = '<div class="empty-state"><p>Nenhuma demanda encontrada.</p></div>';
        return;
    }

    demandas.forEach((demanda) => {
        const card = document.createElement('div');
        card.innerHTML = criarCardHtml(demanda);
        const item = card.firstElementChild;
        item.addEventListener('click', () => verTarefa(demanda.id));
        listaCards.appendChild(item);
    });
}

function renderTabela() {
    listaTabela.innerHTML = '';

    if (!demandas.length) {
        listaTabela.innerHTML = '<tr><td colspan="5">Nenhuma demanda encontrada.</td></tr>';
        return;
    }

    demandas.forEach((demanda) => {
        const status = normalizarStatus(demanda);
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>${demanda.nome_cliente}</td>
            <td>${demanda.descricao || '-'}</td>
            <td>${criarBadgeStatus(status)}</td>
            <td class="table-actions">
                <button type="button" class="small" onclick="verTarefa(${demanda.id})">Ver</button>
                <button type="button" class="small" onclick="editarTarefa(${demanda.id})">Editar</button>
                <button type="button" class="small danger" onclick="excluirTarefa(${demanda.id})">Excluir</button>
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

    demandas.forEach((demanda) => {
        const status = normalizarStatus(demanda);
        const card = criarKanbanItem(demanda);

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

async function carregarDemandas() {
    try {
        const resposta = await apiRequest('/demandas');

        if (Array.isArray(resposta)) {
            demandas = resposta;
        } else if (Array.isArray(resposta?.demandas)) {
            demandas = resposta.demandas;
        } else if (Array.isArray(resposta?.data)) {
            demandas = resposta.data;
        } else {
            demandas = [];
        }

        renderTudo();
    } catch (erro) {
        mostrarResultado(`Erro ao carregar demandas: ${erro.message}`, 'error');
    }
}

async function atualizarStatusApi(demanda, novoStatus) {
    const payload = {
    nome_cliente: demanda.nome_cliente,
    descricao: demanda.descricao || '',
    prioridade: demanda.prioridade || 'baixa',
    status: novoStatus,
};

    await apiRequest(`/demandas/${demanda.id}`, {
        method: 'PUT',
        body: payload,
    });
}

async function moverTarefa(id, novoStatus) {
    const demanda = demandas.find((item) => String(item.id) === String(id));
    if (!demanda) return;

    try {
        await atualizarStatusApi(demanda, novoStatus);

        demanda.status = novoStatus;
        demanda.concluida = novoStatus === 'concluida';

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

function getDemandaById(id) {
    return demandas.find((item) => String(item.id) === String(id));
}

function setCamposSomenteLeitura(somenteLeitura) {
    inputTitulo.readOnly = somenteLeitura;
    inputDescricao.readOnly = somenteLeitura;
    inputStatus.disabled = somenteLeitura;
    if (inputPrioridade) {
        inputPrioridade.disabled = somenteLeitura;
    }
}

function preencherModal(demanda) {
    inputId.value = demanda?.id || '';
    inputTitulo.value = demanda?.nome_cliente || '';
    inputDescricao.value = demanda?.descricao || '';
    if (inputPrioridade) {
        inputPrioridade.value = demanda?.prioridade || 'baixa';
    }
    inputStatus.value = normalizarStatus(demanda || {});
}

function aplicarModoModal() {
    const isCreate = modalMode === 'create';
    const isView = modalMode === 'view';

    setCamposSomenteLeitura(isView);
    btnModalSalvar.classList.toggle('is-hidden', isView);
    btnModalEditar.classList.toggle('is-hidden', !isView);
    btnModalExcluir.classList.toggle('is-hidden', isCreate);

    if (isCreate) {
        modalTitle.textContent = 'Nova demanda';
        btnModalSalvar.textContent = 'Salvar';
    } else if (isView) {
        modalTitle.textContent = 'Detalhes da demanda';
    } else {
        modalTitle.textContent = 'Editar demanda';
        btnModalSalvar.textContent = 'Salvar alterações';
    }
}

function abrirNovaTarefa() {
    tarefaSelecionadaId = null;
    modalMode = 'create';
    window.limparProdutosSelecionados();
    preencherModal({ id: '', titulo: '', descricao: '', status: 'novo', prioridade: 'baixa' });
    window.atualizarTabelaProdutos();
    aplicarModoModal();
}

function verTarefa(id) {
    const demanda = getDemandaById(id);
    if (!demanda) return;

    tarefaSelecionadaId = demanda.id;
    modalMode = 'view';
    preencherModal(demanda);
    window.setProdutosSelecionados(demanda.produtos ? [...demanda.produtos] : []);
    aplicarModoModal();
    tarefaModal?.show();
}

function editarTarefa(id = null) {
    const demanda = getDemandaById(id || tarefaSelecionadaId);
    if (!demanda) return;

    tarefaSelecionadaId = demanda.id;
    modalMode = 'edit';
    preencherModal(demanda);
    window.setProdutosSelecionados(demanda.produtos ? [...demanda.produtos] : []);
    aplicarModoModal();
    tarefaModal?.show();
}

async function excluirTarefa(id = null) {
    const demanda = getDemandaById(id || tarefaSelecionadaId);
    if (!demanda) return;

    const confirmar = window.Swal
        ? await Swal.fire({
            icon: 'warning',
            text: `Excluir a demanda "${demanda.titulo}"?`,
            showCancelButton: true,
            confirmButtonText: 'Excluir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
        })
        : { isConfirmed: confirm('Excluir esta demanda?') };

    if (!confirmar.isConfirmed) return;

    try {
        await apiRequest(`/demandas/${demanda.id}`, { method: 'DELETE' });
        demandas = demandas.filter((item) => String(item.id) !== String(demanda.id));
        tarefaModal?.hide();
        renderTudo();
        mostrarResultado('Demanda excluída com sucesso.');
    } catch (erro) {
        mostrarResultado(`Erro ao excluir demanda: ${erro.message}`, 'error');
    }
}



btnViewCards.addEventListener('click', () => {
    viewMode = 'cards';
    aplicarViewMode();
});
async function criarTarefa(event) {
    event.preventDefault();

    const id = inputId.value;
    const nome_cliente = inputTitulo.value.trim();
    const descricao = inputDescricao.value.trim();
    const prioridade = inputPrioridade ? inputPrioridade.value : 'baixa';
    const status = inputStatus.value;

    if (!nome_cliente) return;

    try {
        if (modalMode === 'edit' && id) {
            const payload = {
                nome_cliente,
                descricao,
                prioridade,
                status,
            };

            const resposta = await apiRequest(`/demandas/${id}`, {
                method: 'PUT',
                body: payload,
            });

            const index = demandas.findIndex((item) => String(item.id) === String(id));
            if (index >= 0) {
                demandas[index] = {
                    ...demandas[index],
                    ...payload,
                    ...(typeof resposta === 'object' ? resposta : {}),
                };
            }

            mostrarResultado('Demanda atualizada com sucesso.');
        } else {
            const nova = await apiRequest('/demandas', {
                method: 'POST',
                body: {
                    nome_cliente,
                    descricao,
                    prioridade,
                    status,
                },
            });

            if (nova && nova.id) {
                demandas.push({
                    ...nova,
                    descricao,
                    prioridade,
                    status,
                });
            } else {
                await carregarDemandas();
            }

            mostrarResultado('Demanda criada com sucesso.');
        }

        renderTudo();
        if (tarefaModal) tarefaModal.hide();
        formTarefa.reset();
        inputStatus.value = 'novo';
        if (inputPrioridade) {
            inputPrioridade.value = 'baixa';
        }
        window.limparProdutosSelecionados();
        modalMode = 'create';
        tarefaSelecionadaId = null;
    } catch (erro) {
        mostrarResultado(`Erro ao salvar demanda: ${erro.message}`, 'error');
    }
}
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
btnModalProdutos.addEventListener('click', window.abrirModalProduto);

const formProduto = document.getElementById('form-produto');
if (formProduto) {
    formProduto.addEventListener('submit', window.adicionarProduto);
}

window.verTarefa = verTarefa;
window.editarTarefa = editarTarefa;
window.excluirTarefa = excluirTarefa;

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
    await carregarDemandas();
});
