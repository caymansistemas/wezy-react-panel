
    import { toast } from 'sonner'
    import { createContext, useState, useContext, useMemo, useCallback } from 'react'
    import * as authHelper from '../_helpers'
    import { api } from '@/services/api'
    import { clearCustomerHost, getFixedCustomerHost, setCustomerHost } from '@/utils/customerHost'
    import { clearApiUrl, setApiUrl } from '@/utils/apiUrl'
    import { marcarSaidaVoluntaria, limparVoltaAposLogin } from '../voltaAposLogin'
    import { entrarNaConta } from './authApi'
    import { hashDaUrl, gravarSessao, entrarPorHash, entrarNoCentral, entrarNoPainel, cadastrar, encerrarSessaoNaApi, usuarioDaSessao } from './authApi'

    //O JS DOS CARTÕES LEGADOS USA O CLIENTE DA API DO PAINEL (window.api)
    if (typeof window !== 'undefined') {
        window.api = api
    }

    const AuthContext = createContext(null)

    //?hash= (ACESSO AO PAINEL DE OUTRO CLIENTE): O TOKEN SALVO É DE OUTRO PAINEL. ESQUECE ANTES DE TUDO — SENÃO O MENU
    //JÁ PEDIA panel/menus COM ELE NO Customer-Host NOVO, TOMAVA 401 E O logout() DERRUBAVA A SESSÃO NOVA DO HASH
    const sessaoInicial = () => {
        if (hashDaUrl()) {
            authHelper.removeAuth()
            return null
        }
        return authHelper.getAuthToken()
    }

    const AuthProvider = ({ children }) => {

        const [ loading, setLoading ] = useState(true)
        const [ auth, setAuth ]       = useState(sessaoInicial)

        const saveAuth = useCallback((sessao) => {
            setAuth(sessao)
            gravarSessao(sessao)
        }, [])

        //ACESSO DE SUPORTE: RECARREGA DEPOIS DE ENTRAR — O "Acessar Painel" PODE VIR DE DENTRO DO PRÓPRIO SPA (PAINEL DE
        //MÓDULOS NO MESMO ENDEREÇO), COM MENU E MÓDULO DO OUTRO CLIENTE JÁ CARREGADOS. A URL JÁ ESTÁ SEM O hash
        const loginPorHash = useCallback(async (hash) => {
            try {
                saveAuth(await entrarPorHash(hash))
                window.location.reload()
            } catch (error) {
                toast('❌ Não foi possível acessar o painel', {
                    description: <span style={{ color: 'white' }}>{error.message}</span>,
                    duration: 10000,
                    style: { color: 'white', background: 'var(--tw-danger)', border: 'none', fontWeight: 'bold' },
                })
                saveAuth(undefined)
            }
        }, [saveAuth])

        const verify = useCallback(async () => {
            const hash = hashDaUrl()
            if (hash) await loginPorHash(hash)
        }, [loginPorHash])

        //FALHA NO LOGIN/CADASTRO TAMBÉM ESQUECE A SESSÃO ANTERIOR
        const entrarCom = useCallback(async (pedirSessao) => {
            try {
                saveAuth(await pedirSessao())
            } catch (error) {
                if (error.code !== 'MULTIPLE_PANELS') saveAuth(undefined)
                throw error
            }
        }, [saveAuth])

        //ENTROU POR ?a=dominio: LOGIN DIRETO NO BANCO DESSE CLIENTE, COMO O index.php LEGADO
        //painelEscolhido: { id_painel_cliente, host } DA LISTA DO 409 (USUÁRIO EM MAIS DE UM PAINEL)
        const login = useCallback((usuario, senha, painelEscolhido = null) =>
            entrarCom(() => (getFixedCustomerHost() ? entrarNoPainel(usuario, senha) : entrarNoCentral(usuario, senha, painelEscolhido))),
        [entrarCom])

        const register = useCallback((...dados) => entrarCom(() => cadastrar(...dados)), [entrarCom])

        const logout = useCallback(() => {
            // 401 de uma requisição antiga depois que outra aba trocou de conta: não derruba a sessão nova.
            if (authHelper.sessaoTrocadaEmOutraAba()) {
                window.location.reload()
                return
            }
            encerrarSessaoNaApi()
            saveAuth(undefined)
            // O próximo login pode pertencer a outro painel: esquece o cliente salvo (inclusive o do ?a=) e a API do servidor dele
            clearCustomerHost()
            clearApiUrl()
        }, [saveAuth])

        //BOTÃO "Sair": COMO O logout, MAS O PRÓXIMO LOGIN NÃO VOLTA PARA A TELA ATUAL (PODE SER OUTRA CONTA, SEM ESTE MÓDULO).
        //O logout PURO FICA PARA A SESSÃO EXPIRADA (401), QUE VOLTA PARA A TELA DEPOIS DO LOGIN
        const sair = useCallback(() => {
            marcarSaidaVoluntaria()
            logout()
        }, [logout])

        const usuarioLogado = useMemo(() => usuarioDaSessao(auth), [auth])

        const trocarConta = useCallback(async (painel) => {
            const sessao = await entrarNaConta(painel)
            // Só encerra a conta anterior depois que a nova sessão estiver pronta.
            await encerrarSessaoNaApi()
            clearCustomerHost()
            setCustomerHost(sessao.data.dominio, true)
            setApiUrl(sessao.data.api_url)
            gravarSessao(sessao)
            limparVoltaAposLogin()
            // Recarrega menus e dados do novo cliente, inclusive ao trocar de servidor.
            window.location.replace('/?a=' + encodeURIComponent(sessao.data.dominio))
        }, [])

        const value = useMemo(
            () => ({ loading, setLoading, auth, usuarioLogado, login, register, logout, sair, verify, trocarConta }),
            [loading, auth, usuarioLogado, login, register, logout, sair, verify, trocarConta]
        )

        return (
            <AuthContext.Provider value={value}>
                {children}
            </AuthContext.Provider>
        )
    }

    const useAuth = () => useContext(AuthContext)

    export { AuthContext, AuthProvider, useAuth }
