    import { KeenIcon } from '@/components'
    import { Tabs } from '@/components/custom/tabs/tabs'
    import { BotoesDasAbas } from '@/components/custom/tabs/BotoesDasAbas'
    import { cleanUrl } from '@/utils/urlHelper'

    // CAMPO DE BUSCA DA LISTAGEM: ENTER/LUPA BUSCA NO SERVIDOR (?busca=); "LIMPAR" IGUAL AO LINK DO PAINEL-PHP
    const BuscaDaListagem = ({ search, searchInput, setSearchInput, onBuscar, onLimpar }) => {

        const buscaAtiva = (search?.value || '') !== '' || searchInput !== ''

        const enviar = (e) => {
            e.preventDefault()
            onBuscar(searchInput.trim())
        }

        return (
            //NO MOBILE (< sm) A BUSCA QUEBRA PARA A LINHA DE BAIXO: OCUPA A LARGURA TODA EM VEZ DE FICAR ENCOSTADA À DIREITA
            <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap gap-2 lg:gap-5">

                <form
                    id="form2"
                    name="form2"
                    role="search"
                    onSubmit={enviar}
                    className="flex form-busca w-full sm:w-auto"
                >

                    {/* sm:flex-initial E NÃO flex-none: O .input TEM width:100% E, SEM PODER ENCOLHER, EMPURRAVA A LUPA PARA FORA DO CARD */}
                    <label className="input input-sm min-w-0 flex-1 sm:flex-initial">
                        <input
                            type="text"
                            name="FrmBusca"
                            id="FrmBusca"
                            className="inputBusca min-w-0"
                            aria-label={search?.placeholder || 'Buscar'}
                            placeholder={search?.placeholder}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </label>

                    <button
                        type="submit"
                        className="btn btn-primary btn-sm ml-1"
                        aria-label="Buscar"
                    >
                        <KeenIcon icon="magnifier" className="!text-sm" />
                    </button>

                    {buscaAtiva && (
                        <button
                            type="button"
                            className="btn btn-light btn-sm ml-1"
                            onClick={onLimpar}
                            title="Limpar busca"
                        >
                            LIMPAR
                        </button>
                    )}

                </form>

            </div>
        )

    }

    // ABAS, FILTRO DE STATUS, BOTÃO "Adicionar", BUSCA E BOTÕES EXTRAS DO TOPO DA LISTAGEM.
    // COMPONENTE PRÓPRIO (FORA DO Models): DECLARADO LÁ DENTRO ELE SERIA RECRIADO A CADA RENDER E O
    // INPUT DA BUSCA PERDERIA O FOCO A CADA LETRA DO FILTRO AO DIGITAR
    const BarraDaListagem = ({ tabs, btnAdd, search, searchInput, setSearchInput, onBuscar, onLimpar }) => (
        <>

            {Array.isArray(tabs?.before) ? (
                <Tabs tabs={tabs.before} className="tabs w-f px-6" />
            ) : null}

            {/* FILTRO Todos/Ativos/Inativos DO CARTÃO ($setBotoesStatus) */}
            {Array.isArray(tabs?.status) ? (
                <Tabs tabs={tabs.status} className="tabs w-f px-6" />
            ) : null}

            <div className="bg-transparent">

                {search !== undefined && (

                    <div className="card-header flex-wrap my-0 gap-2 border-b-0 px-3">

                        {btnAdd?.label ? (
                            <a
                                className="btn btn-primary btn-sm"
                                href={cleanUrl(btnAdd?.url)}
                                target="_self"
                            >
                                <i className="ki-filled ki-plus !text-sm"></i>
                                {btnAdd?.label}
                            </a>
                        ) : ''}

                        {search !== false && (
                            <BuscaDaListagem
                                search={search}
                                searchInput={searchInput}
                                setSearchInput={setSearchInput}
                                onBuscar={onBuscar}
                                onLimpar={onLimpar}
                            />
                        )}

                    </div>
                )}

                <BotoesDasAbas botoes={tabs?.after} className="px-5" />

            </div>
        </>
    )

    export { BarraDaListagem }
