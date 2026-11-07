import { useMemo } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { ptBR } from '@mui/x-date-pickers/locales'
import 'dayjs/locale/pt-br'
import { useSettings } from '@/providers/SettingsProvider'

export const DatePickersProvider = ({ children }) => {
    const { getThemeMode } = useSettings()
    const mode = getThemeMode()
    const theme = useMemo(() => createTheme({
        palette: {
            mode,
            ...(mode === 'dark' ? {
                background: { paper: '#111217' },
                text: { primary: '#fff', secondary: '#cbd5e1' },
            } : {}),
        },
    }), [mode])

    return (
        <ThemeProvider theme={theme}>
            {/* MESES/DIAS DA SEMANA (adapterLocale) E TEXTOS DOS BOTÕES (localeText) EM PORTUGUÊS */}
            <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="pt-br"
                localeText={ptBR.components.MuiLocalizationProvider.defaultProps.localeText}
            >
                {children}
            </LocalizationProvider>
        </ThemeProvider>
    )
}
