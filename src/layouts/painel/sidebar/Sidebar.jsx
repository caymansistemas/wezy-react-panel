    import { useEffect, useRef, useState } from 'react'
    import { useResponsive } from '@/hooks'
    import { usePanelLayout } from '../'
    import { SidebarHeader, SidebarMenu, SidebarFooter } from './'
    import { useLocation } from 'react-router-dom'
    import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

    const Sidebar = () => {

        const headerRef                                   = useRef(null)
        const footerRef                                   = useRef(null)
        const desktopMode                                 = useResponsive('up', 'lg')
        const { mobileSidebarOpen, setMobileSidebarOpen } = usePanelLayout()
        const [ search, setSearch ]                       = useState('')
        

        const handleMobileSidebarClose = () => {
            setMobileSidebarOpen(false)
        }

        const renderContent = () => {

            return (
                <div className="fixed flex top-0 bottom-0 z-20 lg:flex flex-col shrink-0 w-[--tw-sidebar-width] bg-[--tw-page-bg] dark:bg-[--tw-page-bg-dark] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]">
                    
                    <SidebarHeader 
                        ref={headerRef} 
                        search={search}
                        setSearch={setSearch}
                    />

                    <SidebarMenu 
                        search={search}
                        setSearch={setSearch}
                    />

                    <SidebarFooter ref={footerRef} />

                </div>
            )

        }

        //FECHA O MENU NO MOBILE AO TROCAR DE PÁGINA. AS PÁGINAS DO PAINEL SÃO ?pag=..., ENTÃO O search TAMBÉM CONTA
        const { pathname, search: queryString } = useLocation()
        useEffect(() => {

            if (!desktopMode) {
                setMobileSidebarOpen(false)
            }

        }, [desktopMode, pathname, queryString, setMobileSidebarOpen])

        if (desktopMode) {
            return renderContent()
        } else {

            return (
                <Sheet
                    open={mobileSidebarOpen}
                    onOpenChange={handleMobileSidebarClose}
                >
                    <SheetContent
                        // A rolagem fica no SidebarMenu; o Sheet não deve deslocar o rodapé ao focar o dropdown.
                        className="border-0 p-0 w-[--tw-sidebar-width] overflow-hidden"
                        forceMount={true}
                        side="left"
                        close={false}
                        //SEM FOCO AUTOMÁTICO NA BUSCA AO ABRIR (NO CELULAR ABRIA O TECLADO)
                        onOpenAutoFocus={(event) => event.preventDefault()}
                    >
                        <SheetHeader className="sr-only">
                            <SheetTitle>Mobile Menu</SheetTitle>
                            <SheetDescription></SheetDescription>
                        </SheetHeader>
                        {renderContent()}
                    </SheetContent>
                </Sheet>
            )

        }

    }

    export { Sidebar }
