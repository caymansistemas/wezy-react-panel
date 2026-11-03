import { useEffect, useRef, useState } from 'react'
import { useAuthContext } from '@/auth'
import { listarContas } from '@/auth/providers/authApi'
import { getCustomerHost } from '@/utils/customerHost'
import { getApiUrl } from '@/utils/apiUrl'
import { KeenIcon } from '@/components/keenicons'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const ModalTrocarConta = ({ open, onOpenChange, onCloseAutoFocus }) => {
    const { trocarConta } = useAuthContext()
    const [paineis, setPaineis] = useState([])
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState('')
    const [escolhido, setEscolhido] = useState(null)
    const [tentativa, setTentativa] = useState(0)
    const emAndamento = useRef(false)

    useEffect(() => {
        if (!open) return
        const controller = new AbortController()
        setCarregando(true)
        setPaineis([])
        setErro('')
        setEscolhido(null)
        listarContas(controller.signal)
            .then((contas) => { if (!controller.signal.aborted) setPaineis(contas) })
            .catch((error) => { if (!controller.signal.aborted) setErro(error.message) })
            .finally(() => { if (!controller.signal.aborted) setCarregando(false) })
        return () => controller.abort()
    }, [open, tentativa])

    const escolher = async (painel) => {
        if (emAndamento.current) return
        emAndamento.current = true
        setEscolhido(`${painel.host}:${painel.id_painel_cliente}`)
        setErro('')
        try {
            await trocarConta(painel)
        } catch (error) {
            setErro(error.message || 'Não foi possível trocar de conta. Tente novamente.')
            setEscolhido(null)
            emAndamento.current = false
        }
    }

    return (
        <Dialog open={open} onOpenChange={(aberto) => { if (!emAndamento.current) onOpenChange(aberto) }}>
            <DialogContent
                className="w-[calc(100%-32px)] max-w-sm rounded-xl"
                onCloseAutoFocus={onCloseAutoFocus}
            >
                <DialogHeader className="flex-col items-start gap-1 border-b-0 px-5 pe-12">
                    <DialogTitle>Trocar de conta</DialogTitle>
                    <DialogDescription className="mt-1">Escolha o cliente que deseja acessar.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2.5 p-5 pt-0" aria-busy={carregando || !!escolhido}>
                    {carregando && <p role="status" className="text-sm text-gray-600">Carregando contas...</p>}
                    {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
                    {!carregando && !erro && paineis.length === 0 && (
                        <p className="text-sm text-gray-600">Nenhuma conta disponível para este acesso.</p>
                    )}
                    {paineis.map((painel) => {
                        const chave = `${painel.host}:${painel.id_painel_cliente}`
                        const atual = painel.dominio === getCustomerHost() && getApiUrl().includes(`api.${painel.host}.`)
                        return (
                            <button
                                key={chave}
                                type="button"
                                disabled={atual || !!escolhido}
                                onClick={() => escolher(painel)}
                                className="flex w-full min-w-0 items-center gap-3 rounded-lg border border-gray-300 bg-light p-3 text-start hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
                            >
                                <KeenIcon icon="abstract-26" className="shrink-0 text-xl text-primary" />
                                <span className="flex min-w-0 grow flex-col gap-1">
                                    <span className="text-sm font-semibold text-gray-900 [overflow-wrap:anywhere]">{painel.cliente || painel.dominio}</span>
                                    <span className="text-xs text-gray-600 [overflow-wrap:anywhere]">{painel.dominio}</span>
                                </span>
                                {atual && <span className="shrink-0 text-xs text-gray-600">Atual</span>}
                                {escolhido === chave && <span role="status" className="shrink-0 text-xs">Entrando...</span>}
                            </button>
                        )
                    })}
                    {!carregando && erro && paineis.length === 0 && (
                        <button type="button" className="btn btn-light justify-center" onClick={() => setTentativa((valor) => valor + 1)}>Tentar novamente</button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export { ModalTrocarConta }
