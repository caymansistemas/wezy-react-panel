import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { cleanUrl } from '@/utils/urlHelper'
import { alvoDoLink, relDoAlvo } from '@/utils/alvoDoLink'
import { comChaves } from '@/utils/chavesUnicas'

//DEGRADÊ NAS BORDAS COM MAIS ABAS ESCONDIDAS: MOSTRA QUE DÁ PARA ARRASTAR (A ABA CORTADA SOME AOS POUCOS, COMO UM
//CARROSSEL COM "1.5 POR TELA"). O DA ESQUERDA SÓ APARECE DEPOIS DE ROLAR
const FADE = '40px'
const mascaraDasBordas = ({ antes, depois }) => {
    if (!antes && !depois) return undefined
    const inicio = antes ? `transparent, #000 ${FADE}` : '#000, #000'
    const fim = depois ? `#000 calc(100% - ${FADE}), transparent` : '#000, #000'
    const mascara = `linear-gradient(to right, ${inicio}, ${fim})`
    return { maskImage: mascara, WebkitMaskImage: mascara }
}

const Tabs = ({ className, tabs }) => {

    const containerRef = useRef(null)
    const [bordas, setBordas] = useState({ antes: false, depois: false })

    //QUAIS LADOS TÊM ABAS FORA DA TELA (AO ROLAR E AO MUDAR A LARGURA)
    useEffect(() => {

        const container = containerRef.current
        if (!container) return

        const medir = () => {
            const resto = container.scrollWidth - container.clientWidth - container.scrollLeft
            setBordas((atual) => {
                const novo = { antes: container.scrollLeft > 1, depois: resto > 1 }
                return atual.antes === novo.antes && atual.depois === novo.depois ? atual : novo
            })
        }

        medir()
        container.addEventListener('scroll', medir, { passive: true })
        const observer = new ResizeObserver(medir)
        observer.observe(container)

        return () => {
            container.removeEventListener('scroll', medir)
            observer.disconnect()
        }

    }, [tabs])

    //ARRASTAR COM O MOUSE (NO TOQUE A ROLAGEM NATIVA JÁ ARRASTA). DEPOIS DE ARRASTAR, O CLIQUE NÃO ABRE A ABA
    const arrasto = useRef(null)

    const aoPressionar = (event) => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return
        const container = containerRef.current
        if (container.scrollWidth <= container.clientWidth) return
        arrasto.current = { x: event.clientX, scrollLeft: container.scrollLeft, moveu: false }
    }

    const aoMover = (event) => {
        const atual = arrasto.current
        if (!atual) return
        const deslocamento = event.clientX - atual.x
        if (!atual.moveu && Math.abs(deslocamento) < 5) return
        if (!atual.moveu) {
            atual.moveu = true
            containerRef.current.setPointerCapture(event.pointerId)
        }
        containerRef.current.scrollLeft = atual.scrollLeft - deslocamento
    }

    const aoSoltar = () => {
        //moveu FICA ATÉ O click (QUE VEM LOGO DEPOIS DO pointerup) PARA CANCELÁ-LO. SOLTOU FORA E NÃO HOUVE click:
        //O setTimeout LIMPA, SENÃO O PRÓXIMO CLIQUE DE VERDADE SERIA ENGOLIDO
        if (!arrasto.current) return
        if (!arrasto.current.moveu) {
            arrasto.current = null
            return
        }
        setTimeout(() => {
            arrasto.current = null
        })
    }

    const aoClicar = (event) => {
        if (arrasto.current?.moveu) {
            event.preventDefault()
            event.stopPropagation()
        }
        arrasto.current = null
    }

    //EM TELAS ESTREITAS AS ABAS ROLAM NA HORIZONTAL; A ATIVA FICA VISÍVEL (SEM MEXER NA ROLAGEM DA PÁGINA)
    useEffect(() => {

        const container = containerRef.current
        const ativa = container?.querySelector('.tab.active')
        if (!container || !ativa) return

        const inicio = ativa.offsetLeft - container.offsetLeft
        const fim = inicio + ativa.offsetWidth

        if (inicio < container.scrollLeft || fim > container.scrollLeft + container.clientWidth) {
            container.scrollLeft = inicio - 24
        }

    }, [tabs])

    if (!tabs || !Array.isArray(tabs)) {
        return null
    }

    return (
        <div
            ref={containerRef}
            data-tabs="true"
            className={cn(
                className ? className : 'tabs w-f mb-3',
                //BARRA DE ROLAGEM ESCONDIDA: O DEGRADÊ DAS BORDAS É QUEM AVISA QUE HÁ MAIS ABAS
                'overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-x-contain',
                (bordas.antes || bordas.depois) && 'cursor-grab active:cursor-grabbing select-none'
            )}
            style={mascaraDasBordas(bordas)}
            onPointerDown={aoPressionar}
            onPointerMove={aoMover}
            onPointerUp={aoSoltar}
            onPointerCancel={aoSoltar}
            onClickCapture={aoClicar}
            onDragStart={(event) => event.preventDefault()}
        >
            {comChaves(tabs, (tab) => `${tab.url || ''}|${tab.categoria || ''}|${tab.content}`).map(({ item: tab, chave }) => {

                const isInvalidUrl = !tab.url || tab.url === 'javascript:;'

                //ABA QUE TROCA CONTEÚDO NA MESMA TELA (ex.: ABAS DE CATEGORIA DO FormContext): BOTÃO, ATIVA PELO tab.ativa
                if (tab.onClick) {
                    return (
                        <button
                            key={chave}
                            type="button"
                            className={`tab shrink-0 whitespace-nowrap${tab.ativa ? ' active' : ''}`}
                            onClick={tab.onClick}
                        >
                            {tab.content}
                        </button>
                    )
                }

                return isInvalidUrl ? (
                    <button
                        key={chave}
                        type="button"
                        className={`active tab shrink-0 whitespace-nowrap`}
                    >
                        {tab.content}
                    </button>
                ) : (
                    //active: ABA ATUAL QUE O CARTÃO MANDA COM LINK (ex.: "Módulos" DENTRO DE UM MÓDULO VOLTA PARA A LISTAGEM)
                    <a
                        key={chave}
                        className={`tab shrink-0 whitespace-nowrap${tab.active ? ' active' : ''}`}
                        href={cleanUrl(tab.url)}
                        target={alvoDoLink(tab.target)}
                        rel={relDoAlvo(tab.target)}
                    >
                        {tab.content}
                    </a>
                )

            })}
        </div>
    )
}

export { Tabs }
