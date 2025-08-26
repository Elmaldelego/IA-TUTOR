import DropdownSheet from '@components/input/DropdownSheet'
import ThemedCheckbox from '@components/input/ThemedCheckbox'
import ThemedSlider from '@components/input/ThemedSlider'
import ThemedTextInput from '@components/input/ThemedTextInput'
import Alert from '@components/views/Alert'
import HeaderButton from '@components/views/HeaderButton'
import HeaderTitle from '@components/views/HeaderTitle'
import PopupMenu from '@components/views/PopupMenu'
import TextBoxModal from '@components/views/TextBoxModal'
import { SamplerID, Samplers } from '@lib/constants/SamplerData'
import { APIConfiguration, APISampler } from '@lib/engine/API/APIBuilder.types'
import { APIManager as APIStateNew } from '@lib/engine/API/APIManagerState'
import { localSamplerData } from '@lib/engine/LocalInference'
import { useAppMode } from '@lib/state/AppMode'
import { Logger } from '@lib/state/Logger'
import { SamplersManager } from '@lib/state/SamplerState'
import { Theme } from '@lib/theme/ThemeManager'
import { saveStringToDownload } from '@lib/utils/File'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useShallow } from 'zustand/react/shallow'
import ContextLimitPreview from './ContextLimitPreview'

const SamplerManagerScreen = () => {
    const styles = useStyles()
    const { spacing } = Theme.useTheme()
    const { appMode } = useAppMode()
    const [showNewSampler, setShowNewSampler] = useState<boolean>(false)

    const {
        addSamplerConfig,
        deleteSamplerConfig,
        changeConfig,
        updateCurrentConfig,
        currentConfigIndex,
        currentConfig,
        configList,
    } = SamplersManager.useSamplers()

    const { apiValues, activeIndex, getTemplates } = APIStateNew.useConnectionsStore(
        useShallow((state) => ({
            apiValues: state.values,
            activeIndex: state.activeIndex,
            getTemplates: state.getTemplates,
        }))
    )

    const getSamplerList = (): APISampler[] => {
        if (appMode === 'local') return localSamplerData
        if (activeIndex !== -1) {
            const template = getTemplates().find(
                (item: APIConfiguration) => item.name === apiValues[activeIndex].configName
            )
            if (!template) return []
            return template.request.samplerFields
        }
        return []
    }

    const handleExportSampler = () => {
        saveStringToDownload(
            JSON.stringify(currentConfig.data),
            `${currentConfig.name}.json`,
            'utf8'
        ).then(() => {
            Logger.infoToast('¡Configuración de profesor descargada!')
        })
    }

    const handleImportSampler = () => {
        //TODO : Implement
        Logger.errorToast('Importación no implementada')
    }

    const handleDeleteSampler = () => {
        if (configList.length === 1) {
            Logger.errorToast(`Cannot Delete Last Configuration`)
            return false
        }

        Alert.alert({
            title: `Eliminar Profesor`,
            description: `¿Estás seguro de que quieres eliminar '${currentConfig.name}'?`,
            buttons: [
                { label: 'Cancelar' },
                {
                    label: 'Eliminar Profesor',
                    onPress: async () => {
                        deleteSamplerConfig(currentConfigIndex)
                    },
                    type: 'warning',
                },
            ],
        })
        return true
    }

    const samplerList = getSamplerList()

    const headerRight = () => (
        <PopupMenu
            icon="setting"
            iconSize={24}
            placement="bottom"
            options={[
                {
                    label: 'Crear Profesor',
                    icon: 'addfile',
                    onPress: (menu) => {
                        setShowNewSampler(true)
                        menu.current?.close()
                    },
                },
                {
                    label: 'Exportar Profesor',
                    icon: 'download',
                    onPress: (menu) => {
                        handleExportSampler()
                        menu.current?.close()
                    },
                },
                /*{
                    label: 'Import Sampler',
                    icon: 'upload',
                    onPress: (menu) => {
                        handleImportSampler()
                        menu.current?.close()
                    },
                },*/
                {
                    label: 'Eliminar Profesor',
                    icon: 'delete',
                    onPress: (menu) => {
                        if (handleDeleteSampler()) menu.current?.close()
                    },
                    warning: true,
                },
            ]}
        />
    )

    return (
        <SafeAreaView edges={['bottom']} style={{ flex: 1 }} key={currentConfig.name}>
            <TextBoxModal
                booleans={[showNewSampler, setShowNewSampler]}
                onConfirm={(text: string) => {
                    if (text === '') {
                        Logger.errorToast(`El nombre del Profesor no puede estar vacío`)
                        return
                    }

                    for (const item of configList)
                        if (item.name === text) {
                            Logger.errorToast(`El nombre del Profesor ya existe.`)
                            return
                        }
                    addSamplerConfig({ name: text, data: currentConfig.data })
                }}
            />

            <HeaderTitle title="Profesores" />
            <HeaderButton headerRight={headerRight} />

            <DropdownSheet
                containerStyle={{ marginHorizontal: spacing.xl, paddingVertical: spacing.m }}
                selected={currentConfig}
                data={configList}
                onChangeValue={(item) => {
                    if (item.name === currentConfig.name) return
                    changeConfig(configList.indexOf(item))
                }}
                labelExtractor={(item) => item.name}
            />

            {samplerList.length !== 0 && currentConfig && (
                <KeyboardAwareScrollView contentContainerStyle={styles.scrollContainer}>
                    {samplerList.some((item) => item.samplerID === SamplerID.GENERATED_LENGTH) && (
                        <ContextLimitPreview
                            generatedLength={currentConfig.data[SamplerID.GENERATED_LENGTH]}
                        />
                    )}
                    {samplerList.map((item, index) => {
                        const samplerItem = Samplers?.[item.samplerID]
                        if (!samplerItem)
                            return (
                                <Text style={styles.unsupported}>
                                    Sampler ID {`[${item.samplerID}]`} no compatible
                                </Text>
                            )
                        switch (samplerItem.inputType) {
                            case 'slider':
                                return (
                                    (samplerItem.values.type === 'float' ||
                                        samplerItem.values.type === 'integer') && (
                                        <ThemedSlider
                                            key={item.samplerID}
                                            value={
                                                currentConfig.data[samplerItem.internalID] as number
                                            }
                                            onValueChange={(value) => {
                                                updateCurrentConfig({
                                                    ...currentConfig,
                                                    data: {
                                                        ...currentConfig.data,
                                                        [samplerItem.internalID]: value,
                                                    },
                                                })
                                            }}
                                            label={samplerItem.friendlyName}
                                            min={samplerItem.values.min}
                                            max={samplerItem.values.max}
                                            step={samplerItem.values.step}
                                            precision={samplerItem.values.precision ?? 2}
                                        />
                                    )
                                )
                            case 'checkbox':
                                return (
                                    <ThemedCheckbox
                                        value={currentConfig.data[item.samplerID] as boolean}
                                        key={item.samplerID}
                                        onChangeValue={(b) => {
                                            updateCurrentConfig({
                                                ...currentConfig,
                                                data: {
                                                    ...currentConfig.data,
                                                    [samplerItem.internalID]: b,
                                                },
                                            })
                                        }}
                                        label={samplerItem.friendlyName}
                                    />
                                )
                            case 'textinput':
                                return (
                                    <ThemedTextInput
                                        key={item.samplerID}
                                        value={currentConfig.data[item.samplerID] as string}
                                        onChangeText={(text) => {
                                            updateCurrentConfig({
                                                ...currentConfig,
                                                data: {
                                                    ...currentConfig.data,
                                                    [item.samplerID]: text,
                                                },
                                            })
                                        }}
                                        label={samplerItem.friendlyName}
                                    />
                                )
                            //case 'custom':
                            default:
                                return (
                                    <Text style={styles.warningText}>¡Campo de muestreador no válido!</Text>
                                )
                        }
                    })}
                </KeyboardAwareScrollView>
            )}
            {samplerList.length === 0 && (
                <View
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        rowGap: 12,
                    }}>
                    <Text style={styles.noSamplersText}>No hay muestreadores para configurar</Text>
                    {appMode === 'remote' && (
                        <Text style={styles.noSamplersText}>
                            Probablemente aún no has añadido una conexión API
                        </Text>
                    )}
                </View>
            )}
        </SafeAreaView>
    )
}

export default SamplerManagerScreen

const useStyles = () => {
    const { color, spacing } = Theme.useTheme()
    return StyleSheet.create({
        scrollContainer: {
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.xl2,
            rowGap: spacing.xl,
        },

        dropdownContainer: {
            marginHorizontal: spacing.xl,
        },

        button: {
            padding: spacing.s,
            borderRadius: spacing.s,
            marginLeft: spacing.m,
        },

        warningText: {
            color: color.text._100,
            backgroundColor: color.error._500,
            padding: spacing.m,
            margin: spacing.xl,
            borderRadius: spacing.m,
        },

        unsupported: {
            color: color.text._400,
            textAlign: 'center',
            paddingVertical: spacing.m,
            marginVertical: spacing.m,
            borderRadius: spacing.m,
            backgroundColor: color.neutral._300,
        },

        noSamplersText: {
            color: color.text._400,
        },
    })
}
