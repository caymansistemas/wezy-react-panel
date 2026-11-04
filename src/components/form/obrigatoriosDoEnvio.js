    import { avisoErro } from '@/utils/avisos'
    import { LINHA_ESCONDIDA } from './atributosDaLinha'

    //CAMPOS obg SEM INPUT NATIVO COM required (COMBOBOX DO Sel/Mul E GRUPO DE Rdo): A LINHA LEVA data-obrigatorio=<name> E
    //data-rotulo=<título>. NO ENVIO, LINHA VISÍVEL SEM VALOR NO FormData CANCELA O POST COM O AVISO, COMO O painel.js DO
    //LEGADO FAZIA. LINHA ESCONDIDA POR data-valid-* NÃO CONTA (ex.: "Etapa do funil de origem" COM "Restringir" DESMARCADO)
    const VAZIO = new Set(['', '-1'])

    const destacar = (linha) => {
        linha.setAttribute('data-obrigatorio-vazio', '')
        const limpar = () => {
            linha.removeAttribute('data-obrigatorio-vazio')
            linha.removeEventListener('pointerdown', limpar, true)
            linha.removeEventListener('keydown', limpar, true)
        }
        linha.addEventListener('pointerdown', limpar, true)
        linha.addEventListener('keydown', limpar, true)
    }

    export const camposObrigatoriosPreenchidos = (form) => {

        const dados = new FormData(form)

        const vazia = [...form.querySelectorAll('[data-obrigatorio]')].find((linha) => {
            if (linha.closest('.' + LINHA_ESCONDIDA)) return false
            return !dados.getAll(linha.getAttribute('data-obrigatorio')).some((valor) => typeof valor !== 'string' || !VAZIO.has(valor.trim()))
        })

        if (!vazia) return true

        destacar(vazia)
        avisoErro(`Preencha o campo "${vazia.getAttribute('data-rotulo') || 'obrigatório'}".`)
        vazia.scrollIntoView({ block: 'center', behavior: 'smooth' })
        vazia.querySelector('[role="combobox"], input:not([type="hidden"])')?.focus({ preventScroll: true })

        return false

    }

    //ATRIBUTOS DA LINHA OBRIGATÓRIA (SPREAD DEPOIS DO rowAttr DA PONTE)
    export const marcaObrigatorio = (required, name, rotulo) =>
        required && name ? { 'data-obrigatorio': name, 'data-rotulo': String(rotulo || '').trim() } : {}
