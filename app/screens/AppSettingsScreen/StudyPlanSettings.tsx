import ThemedButton from '@components/buttons/ThemedButton'
import SectionTitle from '@components/text/SectionTitle'
import { useRouter } from 'expo-router'
import React from 'react'
import { View } from 'react-native'

const StudyPlanSettings = () => {
    const router = useRouter()

    const handleCreateStudyPlan = () => {
        router.push('/screens/StudyPlanGeneratorScreen')
    }

    const handleViewStudyPlans = () => {
        router.push('/screens/StudyPlanListScreen')
    }

    return (
        <View style={{ rowGap: 8 }}>
            <SectionTitle>Plan de Estudios</SectionTitle>
            <ThemedButton
                text="Crear Plan de Estudios"
                onPress={handleCreateStudyPlan}
            />
            <ThemedButton
                text="Ver Mis Planes de Estudio"
                onPress={handleViewStudyPlans}
            />
        </View>
    )
}

export default StudyPlanSettings
