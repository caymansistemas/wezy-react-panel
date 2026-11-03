import { getData, setData } from '@/utils'

const AUTH_LOCAL_STORAGE_KEY = `${
    import.meta.env.VITE_APP_NAME
}-auth-v${import.meta.env.VITE_APP_VERSION}`
const LOCAL_STORAGE_AUTH = 'auth-token'

const getAuthToken = () => {
    try {
        const auth = getData(AUTH_LOCAL_STORAGE_KEY)
        const localAuth = getData(LOCAL_STORAGE_AUTH)

        if (auth?.access_token) {
            return auth.access_token
        } else if (localAuth) {
            return localAuth
        } else {
            return null
        }
    } catch (error) {
        console.error('AUTH LOCAL STORAGE ERROR', error)
        return null
    }
}

//RESPOSTA COMPLETA DO LOGIN (/auth/master) SALVA NO localStorage — O getAuthToken DEVOLVE SÓ O TOKEN
const getAuth = () => {
    try {
        return getData(AUTH_LOCAL_STORAGE_KEY)
    } catch (error) {
        console.error('AUTH LOCAL STORAGE ERROR', error)
        return null
    }
}

// Sessão com que esta aba trabalha. O localStorage é compartilhado: se outra aba entrar em outra conta,
// esta não pode enviar o formulário aberto com o token, o cliente e a API novos.
let tokenDaAba = getAuthToken()

const sessaoTrocadaEmOutraAba = () => !!tokenDaAba && getAuthToken() !== tokenDaAba

if (typeof window !== 'undefined') {
    window.addEventListener('storage', () => {
        if (sessaoTrocadaEmOutraAba()) window.location.reload()
    })
}

const setAuth = (auth) => {
    setData(AUTH_LOCAL_STORAGE_KEY, auth)
    tokenDaAba = getAuthToken()
}

const setLocalAuth = (auth) => {
    setData(LOCAL_STORAGE_AUTH, auth)
    tokenDaAba = getAuthToken()
}

const removeAuth = () => {
    try {
        localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY)
        localStorage.removeItem(LOCAL_STORAGE_AUTH)
    } catch (error) {
        console.error('AUTH LOCAL STORAGE REMOVE ERROR', error)
    }
    tokenDaAba = null
}

export function setupAxios(axios) {
    axios.defaults.headers.Accept = 'application/json'
    axios.interceptors.request.use(
        (config) => {
            if (sessaoTrocadaEmOutraAba()) {
                window.location.reload()
                return Promise.reject(new Error('A sessão foi trocada em outra aba. Recarregando...'))
            }
            const token = getAuthToken()
            // Chamadas como o logout durante a troca de conta já capturam o token da sessão anterior.
            if (token && !config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${token}`
            }
            return config
        },
        async (err) => await Promise.reject(err)
    )
}

export {
    AUTH_LOCAL_STORAGE_KEY,
    getAuth,
    getAuthToken,
    removeAuth,
    sessaoTrocadaEmOutraAba,
    setAuth,
    setLocalAuth,
}
