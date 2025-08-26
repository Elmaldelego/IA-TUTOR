import Alert from '@components/views/Alert'
import HeaderButton from '@components/views/HeaderButton'
import HeaderTitle from '@components/views/HeaderTitle'
import PopupMenu from '@components/views/PopupMenu'
import { Logger, LogLevel } from '@lib/state/Logger'
import { Theme } from '@lib/theme/ThemeManager'
import { saveStringToDownload } from '@lib/utils/File'
import { FlashList } from '@shopify/flash-list'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useShallow } from 'zustand/react/shallow'

const LogsScreen = () => {
    const { color } = Theme.useTheme()
    const { logs, flushLogs } = Logger.useLoggerStore(
        useShallow((state) => ({
            logs: state.logs,
            flushLogs: state.flushLogs,
        }))
    )

    const logitems = logs.toReversed()
    const handleExportLogs = () => {
        if (!logs) return
        const data = logs
            .map((item) => `${Logger.LevelName[item.level]} ${item.timestamp}: ${item.message}`)
            .join('\n')
        saveStringToDownload(data, `logs-chatterui-${Date.now()}.txt`, 'utf8')
            .then(() => {
                Logger.infoToast('¡Registros Descargados!')
            })
            .catch((e) => {
                Logger.errorToast(`No se pudieron exportar los registros: ${e}`)
            })
    }

    const handleFlushLogs = () => {
        Alert.alert({
            title: `Eliminar Registros`,
            description: `¿Estás seguro de que quieres eliminar todos los registros? Esto no se puede deshacer.`,
            buttons: [
                { label: 'Cancelar' },
                {
                    label: 'Delete Logs',
                    onPress: async () => {
                        flushLogs()
                    },
                    type: 'warning',
                },
            ],
        })
    }

    const logColor: Record<LogLevel, string> = {
        [LogLevel.INFO]: 'white',
        [LogLevel.WARN]: 'yellow',
        [LogLevel.ERROR]: 'red',
        [LogLevel.DEBUG]: 'gray',
    }

    const headerRight = () => (
        <PopupMenu
            placement="bottom"
            icon="setting"
            options={[
                {
                    label: 'Exportar Registros',
                    icon: 'export',
                    onPress: (m) => {
                        handleExportLogs()
                        m.current?.close()
                    },
                },
                {
                    label: 'Vaciar Registros',
                    icon: 'delete',
                    onPress: (m) => {
                        handleFlushLogs()
                        m.current?.close()
                    },
                    warning: true,
                },
            ]}
        />
    )

    return (
        <SafeAreaView
            edges={['bottom']}
            style={{
                flex: 1,
            }}>
            <HeaderTitle title="Registros" />
            <HeaderButton headerRight={headerRight} />
            <View
                style={{
                    borderColor: color.primary._500,
                    borderWidth: 1,
                    borderRadius: 16,
                    flex: 1,
                    margin: 16,
                    backgroundColor: '#000',

                    padding: 16,
                }}>
                <FlashList
                    inverted
                    estimatedItemSize={30}
                    data={logitems}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <Text
                            style={{
                                fontSize: 12,
                                color: logColor[item.level],
                            }}>
                            {Logger.LevelName[item.level]} {item.timestamp}: {item.message}
                        </Text>
                    )}
                />
            </View>
        </SafeAreaView>
    )
}

export default LogsScreen
