import ThemedButton from '@components/buttons/ThemedButton'
import DropdownSheet from '@components/input/DropdownSheet'
import StringArrayEditor from '@components/input/StringArrayEditor'
import ThemedCheckbox from '@components/input/ThemedCheckbox'
import ThemedSwitch from '@components/input/ThemedSwitch'
import ThemedTextInput from '@components/input/ThemedTextInput'
import SectionTitle from '@components/text/SectionTitle'
import Alert from '@components/views/Alert'
import HeaderButton from '@components/views/HeaderButton'
import HeaderTitle from '@components/views/HeaderTitle'
import PopupMenu from '@components/views/PopupMenu'
import TextBoxModal from '@components/views/TextBoxModal'
import { AppSettings } from '@lib/constants/GlobalValues'
import useAutosave from '@lib/hooks/AutoSave'
import { useTextFilterStore } from '@lib/hooks/TextFilter'
import { MarkdownStyle } from '@lib/markdown/Markdown'
import { Instructs } from '@lib/state/Instructs'
import { Logger } from '@lib/state/Logger'
import { Theme } from '@lib/theme/ThemeManager'
import { saveStringToDownload } from '@lib/utils/File'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Markdown from 'react-native-markdown-display'
import { useMMKVBoolean } from 'react-native-mmkv'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useShallow } from 'zustand/react/shallow'

const autoformatterData = [
    { label: 'Disabled', example: '*<No Formatting>*' },
    { label: 'Plain Action, Quote Speech', example: 'Some action, "Some speech"' },
    { label: 'Asterisk Action, Plain Speech', example: '*Some action* Some speech' },
    { label: 'Asterisk Action, Quote Speech', example: '*Some action* "Some speech"' },
]

const FormattingManager = () => {
    const markdownStyle = MarkdownStyle.useMarkdownStyle()
    const [useTemplate, setUseTemplate] = useMMKVBoolean(AppSettings.UseModelTemplate)
    const { currentInstruct, loadInstruct, setCurrentInstruct } = Instructs.useInstruct(
        useShallow((state) => ({
            currentInstruct: state.data,
            loadInstruct: state.load,
            setCurrentInstruct: state.setData,
        }))
    )
    const instructID = currentInstruct?.id
    const { color, spacing, borderRadius } = Theme.useTheme()
    const { data } = useLiveQuery(Instructs.db.query.instructListQuery())
    const instructList = data
    const selectedItem = data.filter((item) => item.id === instructID)?.[0]
    const [showNewInstruct, setShowNewInstruct] = useState<boolean>(false)
    const { textFilter, setTextFilter } = useTextFilterStore(
        useShallow((state) => ({
            textFilter: state.filter,
            setTextFilter: state.setFilter,
        }))
    )

    const handleSaveInstruct = (log: boolean) => {
        if (currentInstruct && instructID)
            Instructs.db.mutate.updateInstruct(instructID, currentInstruct)
    }

    const handleRegenerateDefaults = () => {
        Alert.alert({
            title: `Regenerar Instrucciones Predeterminadas`,
            description: `¿Estás seguro de que quieres regenerar las instrucciones predeterminadas?`,
            buttons: [
                { label: 'Cancelar' },
                {
                    label: 'Regenerar Ajustes Predeterminados',
                    onPress: async () => {
                        await Instructs.generateInitialDefaults()
                    },
                },
            ],
        })
    }

    const handleExportPreset = async () => {
        if (!instructID) return
        const name = (currentInstruct?.name ?? 'Default') + '.json'
        await saveStringToDownload(JSON.stringify(currentInstruct), name, 'utf8')
        Logger.infoToast(`Saved "${name}" to Downloads`)
    }

    const handleDeletePreset = () => {
        if (instructList.length === 1) {
            Logger.warnToast(`No se puede eliminar el último ajuste preestablecido de instrucción.`)
            return
        }

        Alert.alert({
            title: `Eliminar Configuración`,
            description: `¿Estás seguro de que quieres eliminar '${currentInstruct?.name}'?`,
            buttons: [
                { label: 'Cancelar' },
                {
                    label: 'Eliminar Instrucción',
                    onPress: async () => {
                        if (!instructID) return
                        const leftover = data.filter((item) => item.id !== instructID)
                        if (leftover.length === 0) {
                            Logger.warnToast('No se puede eliminar la última instrucción')
                            return
                        }
                        Instructs.db.mutate.deleteInstruct(instructID)
                        loadInstruct(leftover[0].id)
                    },
                    type: 'warning',
                },
            ],
        })
    }

    const headerRight = () => (
        <PopupMenu
            icon="setting"
            iconSize={24}
            placement="bottom"
            options={[
                {
                    label: 'Crear Configuración',
                    icon: 'addfile',
                    onPress: (menu) => {
                        setShowNewInstruct(true)

                        menu.current?.close()
                    },
                },
                {
                    label: 'Exportar Configuración',
                    icon: 'download',
                    onPress: (menu) => {
                        handleExportPreset()
                        menu.current?.close()
                    },
                },
                {
                    label: 'Eliminar Configuración',
                    icon: 'delete',
                    onPress: (menu) => {
                        handleDeletePreset()
                        menu.current?.close()
                    },
                    warning: true,
                },
                {
                    label: 'Regenerar Predeterminados',
                    icon: 'reload1',
                    onPress: (menu) => {
                        handleRegenerateDefaults()
                        menu.current?.close()
                    },
                },
            ]}
        />
    )

    useAutosave({ data: currentInstruct, onSave: () => handleSaveInstruct(false), interval: 3000 })

    if (currentInstruct)
        return (
            <SafeAreaView
                edges={['bottom']}
                key={currentInstruct.id}
                style={{
                    marginVertical: spacing.xl,
                    flex: 1,
                }}>
                <HeaderTitle title="Formato" />
                <HeaderButton headerRight={headerRight} />
                <View>
                    <TextBoxModal
                        booleans={[showNewInstruct, setShowNewInstruct]}
                        onConfirm={(text) => {
                            if (instructList.some((item) => item.name === text)) {
                                Logger.warnToast(`El nombre de la configuración ya existe.`)
                                return
                            }
                            if (!currentInstruct) return

                            Instructs.db.mutate
                                .createInstruct({ ...currentInstruct, name: text })
                                .then(async (newid) => {
                                    Logger.infoToast(`Configuración creada.`)
                                    await loadInstruct(newid)
                                })
                        }}
                    />
                </View>

                <View
                    style={{
                        paddingHorizontal: spacing.xl,
                        marginTop: spacing.xl,
                        paddingBottom: spacing.l,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                    <DropdownSheet
                        containerStyle={{ flex: 1 }}
                        selected={selectedItem}
                        data={instructList}
                        labelExtractor={(item) => item.name}
                        onChangeValue={(item) => {
                            if (item.id === instructID) return
                            loadInstruct(item.id)
                        }}
                        modalTitle="Seleccionar Configuración"
                        search
                    />
                    <ThemedButton iconName="save" iconSize={28} variant="tertiary" />
                </View>

                <KeyboardAwareScrollView
                    showsVerticalScrollIndicator={false}
                    style={{
                        flex: 1,
                        marginTop: 16,
                    }}
                    contentContainerStyle={{
                        rowGap: spacing.xl,
                        paddingHorizontal: spacing.xl,
                    }}>
                    <SectionTitle>Formato de Instrucción</SectionTitle>
                    <ThemedTextInput
                        label="Prompt del Sistema"
                        value={currentInstruct.system_prompt}
                        onChangeText={(text) => {
                            setCurrentInstruct({
                                ...currentInstruct,
                                system_prompt: text,
                            })
                        }}
                        numberOfLines={5}
                        multiline
                    />

                    <ThemedTextInput
                        label="Formato de Prompt del Sistema"
                        value={currentInstruct.system_prompt_format}
                        onChangeText={(text) => {
                            setCurrentInstruct({
                                ...currentInstruct,
                                system_prompt_format: text,
                            })
                        }}
                        numberOfLines={3}
                        multiline
                    />
                    <View style={{ flexDirection: 'row', columnGap: spacing.m }}>
                        <ThemedTextInput
                            label="Prefijo del Sistema"
                            value={currentInstruct.system_prefix}
                            onChangeText={(text) => {
                                setCurrentInstruct({
                                    ...currentInstruct,
                                    system_prefix: text,
                                })
                            }}
                            numberOfLines={5}
                            multiline
                        />
                        <ThemedTextInput
                            label="Sufijo del Sistema"
                            value={currentInstruct.system_suffix}
                            onChangeText={(text) => {
                                setCurrentInstruct({
                                    ...currentInstruct,
                                    system_suffix: text,
                                })
                            }}
                            numberOfLines={5}
                            multiline
                        />
                    </View>
                    <View style={{ flexDirection: 'row', columnGap: spacing.m }}>
                        <ThemedTextInput
                            label="Prefijo de Entrada"
                            value={currentInstruct.input_prefix}
                            onChangeText={(text) => {
                                setCurrentInstruct({
                                    ...currentInstruct,
                                    input_prefix: text,
                                })
                            }}
                            numberOfLines={5}
                            multiline
                        />
                        <ThemedTextInput
                            label="Sufijo de Entrada"
                            value={currentInstruct.input_suffix}
                            onChangeText={(text) => {
                                setCurrentInstruct({
                                    ...currentInstruct,
                                    input_suffix: text,
                                })
                            }}
                            numberOfLines={5}
                            multiline
                        />
                    </View>
                    <View style={{ flexDirection: 'row', columnGap: spacing.m }}>
                        <ThemedTextInput
                            label="Prefijo de Salida"
                            value={currentInstruct.output_prefix}
                            onChangeText={(text) => {
                                setCurrentInstruct({
                                    ...currentInstruct,
                                    output_prefix: text,
                                })
                            }}
                            numberOfLines={5}
                            multiline
                        />
                        <ThemedTextInput
                            label="Sufijo de Salida"
                            value={currentInstruct.output_suffix}
                            onChangeText={(text) => {
                                setCurrentInstruct({
                                    ...currentInstruct,
                                    output_suffix: text,
                                })
                            }}
                            numberOfLines={5}
                            multiline
                        />
                    </View>

                    <View style={{ flexDirection: 'row' }}>
                        <ThemedTextInput
                            label="Último Prefijo de Salida"
                            value={currentInstruct.last_output_prefix}
                            onChangeText={(text) => {
                                setCurrentInstruct({
                                    ...currentInstruct,
                                    last_output_prefix: text,
                                })
                            }}
                            numberOfLines={5}
                            multiline
                        />
                    </View>

                    <StringArrayEditor
                        containerStyle={{}}
                        label="Secuencia de Parada"
                        value={
                            currentInstruct.stop_sequence
                                ? currentInstruct.stop_sequence.split(',')
                                : []
                        }
                        setValue={(data) => {
                            setCurrentInstruct({
                                ...currentInstruct,
                                stop_sequence: data.join(','),
                            })
                        }}
                        replaceNewLine="\n"
                    />

                    <ThemedCheckbox
                        label="Usar Secuencias de Parada Comunes"
                        value={currentInstruct.use_common_stop}
                        onChangeValue={(b) => {
                            setCurrentInstruct({
                                ...currentInstruct,
                                use_common_stop: b,
                            })
                        }}
                    />

                    <SectionTitle>Macros y Tarjeta de Personaje</SectionTitle>

                    <View
                        style={{
                            flexDirection: 'row',
                            columnGap: spacing.xl2,
                        }}>
                        <View style={{ flex: 1 }}>
                            <ThemedCheckbox
                                label="Envolver en Nueva Línea"
                                value={currentInstruct.wrap}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        wrap: b,
                                    })
                                }}
                            />
                            <ThemedCheckbox
                                label="Incluir Nombres"
                                value={currentInstruct.names}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        names: b,
                                    })
                                }}
                            />
                            <ThemedCheckbox
                                label="Añadir Marca de Tiempo"
                                value={currentInstruct.timestamp}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        timestamp: b,
                                    })
                                }}
                            />
                            <ThemedCheckbox
                                label="Eliminar Etiquetas de Pensamiento"
                                value={currentInstruct.hide_think_tags}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        hide_think_tags: b,
                                    })
                                }}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedCheckbox
                                label="Usar Ejemplos"
                                value={currentInstruct.examples}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        examples: b,
                                    })
                                }}
                            />
                            <ThemedCheckbox
                                label="Usar Escenario"
                                value={currentInstruct.scenario}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        scenario: b,
                                    })
                                }}
                            />

                            <ThemedCheckbox
                                label="Usar Personalidad"
                                value={currentInstruct.personality}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        personality: b,
                                    })
                                }}
                            />
                        </View>
                    </View>

                    <SectionTitle>Archivos Adjuntos</SectionTitle>

                    <View
                        style={{
                            flexDirection: 'row',
                            columnGap: spacing.xl2,
                            justifyContent: 'space-between',
                        }}>
                        <View style={{ flex: 1 }}>
                            <ThemedCheckbox
                                label="Enviar Imágenes"
                                value={currentInstruct.send_images}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        send_images: b,
                                    })
                                }}
                            />
                            <ThemedCheckbox
                                label="Enviar Documentos"
                                value={currentInstruct.send_documents}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        send_documents: b,
                                    })
                                }}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedCheckbox
                                label="Enviar Audio"
                                value={currentInstruct.send_audio}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        send_audio: b,
                                    })
                                }}
                            />
                            <ThemedCheckbox
                                label="Usar Solo Última Imagen"
                                value={currentInstruct.last_image_only}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        last_image_only: b,
                                    })
                                }}
                            />
                        </View>
                    </View>

                    <View style={{ rowGap: 8 }}>
                        <SectionTitle>Formateador de Texto</SectionTitle>
                        <Text
                            style={{
                                color: color.text._400,
                            }}>
                            Formatea automáticamente el primer mensaje al estilo siguiente:
                        </Text>
                        <View
                            style={{
                                backgroundColor: color.neutral._300,
                                marginTop: spacing.m,
                                paddingHorizontal: spacing.xl2,
                                alignItems: 'center',
                                borderRadius: borderRadius.m,
                            }}>
                            <Markdown
                                markdownit={MarkdownStyle.Rules}
                                rules={MarkdownStyle.RenderRules}
                                style={markdownStyle}>
                                {autoformatterData[currentInstruct.format_type].example}
                            </Markdown>
                        </View>
                        <View>
                            {autoformatterData.map((item, index) => (
                                <ThemedCheckbox
                                    key={item.label}
                                    label={item.label}
                                    value={currentInstruct.format_type === index}
                                    onChangeValue={(b) => {
                                        if (b)
                                            setCurrentInstruct({
                                                ...currentInstruct,
                                                format_type: index,
                                            })
                                    }}
                                />
                            ))}
                        </View>
                    </View>

                    <SectionTitle>Texto Oculto</SectionTitle>
                    <Text
                        style={{
                            color: color.text._400,
                        }}>
                        Oculta el texto que coincide con los patrones de expresiones regulares definidos a continuación. (no distingue entre mayúsculas y minúsculas)
                    </Text>

                    <StringArrayEditor value={textFilter} setValue={setTextFilter} />

                    <SectionTitle>Plantilla Local</SectionTitle>

                    <ThemedSwitch
                        label="Usar Plantilla de Modelo Local Incorporada"
                        description="Cuando está en Modo Local, OPEN-TUTOR-IA usa automáticamente la plantilla de instrucción proporcionada por el modelo cargado. Deshabilita esto si quieres que los mensajes se formateen usando Instruct en su lugar. Sin embargo, el Prompt del Sistema siempre se usa."
                        value={useTemplate}
                        onChangeValue={setUseTemplate}
                    />

                    {/* @TODO: Macros are always replaced - people may want this to be changed
                            <CheckboxTitle
                                name="Replace Macro In Sequences"
                                varname="macro"
                                body={currentInstruct}
                                setValue={setCurrentInstruct}
                            />
                            */}

                    {/*  Groups are not implemented - leftover from ST
                            <CheckboxTitle
                                name="Force for Groups and Personas"
                                varname="names_force_groups"
                                body={currentInstruct}
                                setValue={setCurrentInstruct}
                            />
                            */}
                    {/* Activates Instruct when model is loaded with specific name that matches regex
                    
                            <TextBox
                                name="Activation Regex"
                                varname="activation_regex"
                                body={currentInstruct}
                                setValue={setCurrentInstruct}
                            />*/}
                    {/*    User Alignment Messages may be needed in future, might be removed on CCv3
                            <TextBox
                                name="User Alignment"
                                varname="user_alignment_message"
                                body={currentInstruct}
                                setValue={setCurrentInstruct}
                                multiline
                            />*/}
                </KeyboardAwareScrollView>
            </SafeAreaView>
        )
}

export default FormattingManager
