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
            //VÁRIOS NAMES SEPARADOS POR ESPAÇO (GRUPO DE Ckb): BASTA UM COM VALOR
            const nomes = linha.getAttribute('data-obrigatorio').split(' ').filter(Boolean)
            return !nomes.some((nome) => dados.getAll(nome).some((valor) => typeof valor !== 'string' || !VAZIO.has(valor.trim())))
        })

        if (!vazia) return true

        const rotulo = vazia.getAttribute('data-rotulo') || 'obrigatório'
        destacar(vazia)
        avisoErro(vazia.querySelector('input[type="checkbox"]') ? `Marque o campo "${rotulo}".` : `Preencha o campo "${rotulo}".`)
        vazia.scrollIntoView({ block: 'center', behavior: 'smooth' })
        vazia.querySelector('[role="combobox"], input:not([type="hidden"])')?.focus({ preventScroll: true })

        return false

    }

    //LINHA DO CAMPO: O ANCESTRAL QUE TEM O .form-label (TÍTULO) COMO FILHO DIRETO (VER FormInput)
    const linhaDoCampo = (campo, form) => {
        let linha = campo.parentElement
        while (linha && linha !== form) {
            if (linha.querySelector(':scope > .form-label')) return linha
            linha = linha.parentElement
        }
        return null
    }

    const rotuloDoCampo = (campo, linha) =>
        (campo.getAttribute('aria-label') || linha?.querySelector(':scope > .form-label label')?.textContent || '').replace(/\s*\*\s*$/, '').trim()

    //CAMPO NATIVO required INVÁLIDO NO ENVIO (EVENTO invalid DA VALIDAÇÃO DO NAVEGADOR). O BALÃO DO NAVEGADOR NÃO DIZ O
    //CAMPO, E CAMPO ESCONDIDO (textarea DO TinyMCE, LINHA ESCONDIDA PELA BUSCA DO textos-e-imagens) NEM TEM BALÃO: O ENVIO
    //PARAVA SEM AVISO NENHUM ("An invalid form control ... is not focusable"). AQUI AVISA O PRIMEIRO CAMPO DE CADA ENVIO,
    //DESTACA A LINHA E LEVA ATÉ ELA (O EDITOR TinyMCE RECEBE O FOCO)
    export const avisarCampoInvalido = (event) => {

        const campo = event.target
        const form  = event.currentTarget
        if (!(campo instanceof HTMLElement) || form.__campoInvalidoAvisado) return

        form.__campoInvalidoAvisado = true
        setTimeout(() => { form.__campoInvalidoAvisado = false }, 0)

        const linha  = linhaDoCampo(campo, form)
        const rotulo = rotuloDoCampo(campo, linha) || 'obrigatório'

        avisoErro(campo.validity?.valueMissing ? `Preencha o campo "${rotulo}".` : `Confira o campo "${rotulo}": ${campo.validationMessage}`)

        if (linha) destacar(linha)

        //DEPOIS DO JS DO CARTÃO (QUE PODE MOSTRAR A LINHA, ex.: LIMPAR A BUSCA DO textos-e-imagens)
        setTimeout(() => {
            const editor = campo.id && window.tinymce?.get?.(campo.id)
            const alvo   = editor?.getContainer?.() || linha || campo
            alvo.scrollIntoView({ block: 'center', behavior: 'smooth' })
            if (editor) editor.focus()
        }, 0)

    }

    //ATRIBUTOS DA LINHA OBRIGATÓRIA (SPREAD DEPOIS DO rowAttr DA PONTE)
    export const marcaObrigatorio = (required, name, rotulo) =>
        required && name ? { 'data-obrigatorio': name, 'data-rotulo': String(rotulo || '').trim() } : {}
