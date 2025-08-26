import ThemedButton from '@components/buttons/ThemedButton'
import SectionTitle from '@components/text/SectionTitle'
import Alert from '@components/views/Alert'
import { Characters } from '@lib/state/Characters'
import React from 'react'
import { View } from 'react-native'

import TagHiderSettings from './TagHiderSettings'

const CharacterSettings = () => {
    return (
        <View style={{ rowGap: 8 }}>
            <SectionTitle>Character Management</SectionTitle>
            <ThemedButton
                label="Regenerate Default Card"
                variant="secondary"
                onPress={() => {
                    Alert.alert({
                        title: `Regenerar Tarjeta por Defecto`,
                        description: `Esto agregará la tarjeta de Tutor de Estudio a tu lista de personajes.`,
                        buttons: [
                            { label: 'Cancelar' },
                            {
                                label: 'Crear Tarjeta por Defecto',
                                onPress: async () => await Characters.createDefaultCard(),
                            },
                        ],
                    })
                }}
            />
            <TagHiderSettings />
        </View>
    )
}

export default CharacterSettings
