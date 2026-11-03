// BOTÃO DE BUSCA/FILTRO COM "LOAD": AO ENVIAR UM FORMULÁRIO DE BUSCA (FILTRO DO CARTÃO EM .legacy-html, BUSCA DA LISTAGEM
// role="search" OU form[data-botao-carregando]), O BOTÃO CLICADO MOSTRA UM SPINNER NO LUGAR DO CONTEÚDO ATÉ AS
// REQUISIÇÕES DA API TERMINAREM. O SPINNER É SÓ CSS ([data-carregando] NO globals.css): O REACT CONTINUA DONO DOS FILHOS.

const FORMULARIOS = '.legacy-html form, form[role="search"], form[data-botao-carregando]'

// REQUISIÇÕES DA API EM ANDAMENTO (INTERCEPTORS DO services/api.js)
let pendentes = 0
let botao = null
let verificacao = null
let limite = null

const restaurar = () => {
    clearTimeout(verificacao)
    clearTimeout(limite)
    if (!botao) return
    botao.removeAttribute('data-carregando')
    botao.removeAttribute('aria-busy')
    botao.removeAttribute('aria-disabled')
    if (botao.dataset.valorOriginal !== undefined) {
        botao.value = botao.dataset.valorOriginal
        delete botao.dataset.valorOriginal
    }
    botao = null
}

// SEM REQUISIÇÃO POR UM INSTANTE (ENTRE O POST E O RECARREGAMENTO DA TELA HÁ UM INTERVALO CURTO): TERMINOU
const agendarVerificacao = (espera = 250) => {
    clearTimeout(verificacao)
    verificacao = setTimeout(() => {
        if (pendentes === 0) restaurar()
    }, espera)
}

const aoEnviar = (event) => {

    const form = event.target
    if (!(form instanceof HTMLFormElement) || !form.matches(FORMULARIOS)) return

    // SEGUNDO CLIQUE DURANTE A BUSCA: NÃO ENVIA DE NOVO
    if (botao && form.contains(botao)) {
        event.preventDefault()
        event.stopImmediatePropagation()
        return
    }

    const clicado = event.submitter || form.querySelector('button[type="submit"], button:not([type]), input[type="submit"]')
    if (!clicado) return

    restaurar()
    botao = clicado
    // A COR DO TEXTO É LIDA ANTES DO [data-carregando], QUE DEIXA O TEXTO TRANSPARENTE
    botao.style.setProperty('--cor-carregando', getComputedStyle(botao).color)
    botao.setAttribute('data-carregando', '')
    botao.setAttribute('aria-busy', 'true')
    botao.setAttribute('aria-disabled', 'true')

    // <input type="submit"> NÃO TEM ::after: O TEXTO VIRA "Aguarde..."
    if (botao instanceof HTMLInputElement) {
        botao.dataset.valorOriginal = botao.value
        botao.value = 'Aguarde...'
    }

    // A REQUISIÇÃO PODE NEM COMEÇAR (BUSCA IGUAL À ATUAL, VALIDAÇÃO DO CARTÃO): VOLTA SOZINHO. NUNCA FICA PRESO
    agendarVerificacao(600)
    limite = setTimeout(restaurar, 60000)

}

export const instalarBotaoCarregando = (api) => {

    api.interceptors.request.use((config) => {
        pendentes++
        clearTimeout(verificacao)
        return config
    })

    const terminou = () => {
        pendentes = Math.max(0, pendentes - 1)
        if (pendentes === 0 && botao) agendarVerificacao()
    }

    api.interceptors.response.use(
        (response) => { terminou(); return response },
        (error) => { terminou(); return Promise.reject(error) }
    )

    // FASE DE CAPTURA: VEM ANTES DOS onSubmit DO REACT E DO LegacyHtml
    document.addEventListener('submit', aoEnviar, true)

}
