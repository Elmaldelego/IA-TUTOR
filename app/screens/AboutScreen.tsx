import SupportButton from '@components/buttons/SupportButton'
import ThemedButton from '@components/buttons/ThemedButton'
import HeaderTitle from '@components/views/HeaderTitle'
import { AppSettings } from '@lib/constants/GlobalValues'
import { Logger } from '@lib/state/Logger'
import { Theme } from '@lib/theme/ThemeManager'
import appConfig from 'app.config'
import React, { useState } from 'react'
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'

const AboutScreen = () => {
    const styles = useStyles()
    const { spacing } = Theme.useTheme()
    const [counter, setCounter] = useState<number>(0)
    const [devMode, setDevMode] = useMMKVBoolean(AppSettings.DevMode)

    const updateCounter = () => {
        if (devMode) return
        if (counter === 6) {
            Logger.infoToast(`Has habilitado el modo de desarrollador.`)
            setDevMode(true)
        }
        setCounter(counter + 1)
    }

    const version = 'v' + appConfig.expo.version
    return (
        <View style={styles.container}>
            <HeaderTitle title="Acerca de" />
            <TouchableOpacity activeOpacity={0.8} onPress={updateCounter}>
                <Image source={require('../../assets/images/icon.png')} style={styles.icon} />
            </TouchableOpacity>

            <Text style={styles.titleText}>Open Tutor IA</Text>
            <Text style={styles.subtitleText}>
                Version {version} {devMode && '[MODO DESARROLLADOR]'}
            </Text>
            {devMode && (
                <ThemedButton
                    label="Desactivar Modo Desarrollador"
                    variant="critical"
                    buttonStyle={{
                        marginTop: spacing.xl,
                    }}
                    onPress={() => {
                        setCounter(0)
                        setDevMode(false)
                        Logger.info('Modo desarrollador deshabilitado')
                    }}
                />
            )}

            <Text style={styles.body}>
                Open Tutor IA es un proyecto de código abierto, desarrollado por Emiliano Dorantes & Karen Espinosa, que busca impulsar el uso de IA en la educación.
            </Text>
            <Text style={{ marginBottom: spacing.xl3, ...styles.body }}>
                Esta app es un proyecto que me apasiona y que desarrollo en mi tiempo libre. Si te gusta, ¡considera apoyar su desarrollo!
            </Text>
            <Text style={{ marginBottom: spacing.xl3, ...styles.body }}>
                Un especial agradecimiento a Chatter UI y a Unsloth, por que sin sus aportes esto no seria posible
            </Text>
            <Text style={{ ...styles.body, marginBottom: spacing.m }}>
                Dona a Open Tutor IA aquí:
            </Text>

            <SupportButton />

            <Text style={styles.body}>¿Tienes algún problema? Repórtalo aquí.:</Text>
            <Text style={styles.subtitleText}>(¡No olvides agregar tus Logs!)</Text>

            <ThemedButton
                buttonStyle={{ marginTop: spacing.m }}
                variant="secondary"
                label="Repositorio de Github"
                iconName="github"
                iconSize={20}
                onPress={() => {
                    Linking.openURL('https://github.com/Elmaldelego/OPEN-TUTOR-IA-BETA.git')
                }}
            />
        </View>
    )
}

export default AboutScreen

const useStyles = () => {
    const { color, spacing } = Theme.useTheme()

    return StyleSheet.create({
        container: {
            paddingHorizontal: spacing.xl3,
            paddingBottom: spacing.xl2,
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
        },
        titleText: { color: color.text._100, fontSize: 32, marginTop: 16 },
        subtitleText: { color: color.text._400 },
        body: { color: color.text._100, marginTop: spacing.l, textAlign: 'center' },
        icon: {
            width: 120,
            height: 120,
            backgroundColor: 'black',
            // eslint-disable-next-line internal/enforce-spacing-values
            borderRadius: 60,
        },
    })
}
