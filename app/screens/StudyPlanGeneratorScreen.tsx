import ThemedButton from '@components/buttons/ThemedButton'
import ThemedTextInput from '@components/input/ThemedTextInput'
import HeaderTitle from '@components/views/HeaderTitle'
import { Chats } from '@lib/state/Chat'
import { Theme } from '@lib/theme/ThemeManager'
import React, { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { useStudyPlanGenerator } from '@lib/engine/StudyPlanGenerator'
import { StudyPlans } from '@lib/state/StudyPlans'
import { useRouter } from 'expo-router'

const StudyPlanGeneratorScreen = () => {
    const { spacing, color } = Theme.useTheme()
    const router = useRouter()
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const {
        generatedPlan,
        loading,
        generate,
        stopGenerating,
    } = useStudyPlanGenerator()

    const handleGeneratePlan = async () => {
        try {
            const start = new Date(startDate).getTime()
            const end = new Date(endDate).getTime()

            if (isNaN(start) || isNaN(end)) {
                console.error('Invalid date format')
                // TODO: Show error to user
                return
            }

            const chats = await Chats.db.query.chatsBetween(start, end)

            const formattedChats = chats
                .map((chat) => {
                    const messages = chat.messages
                        .map((message) => {
                            const swipe = message.swipes[message.swipe_id]
                            return `${message.name}: ${swipe.swipe}`
                        })
                        .join('\n')
                    return `Chat: ${chat.name}\n${messages}`
                })
                .join('\n\n---\n\n')

            await generate(formattedChats)
        } catch (error) {
            console.error(error)
            // TODO: Show error to user
            stopGenerating()
        }
    }

    const handleSavePlan = async () => {
        const title = generatedPlan.split('\n')[0].replace('#', '').trim()
        const planId = await StudyPlans.useStudyPlanStore.getState().createPlan(title, generatedPlan)
        if (planId) {
            router.replace(`/screens/StudyPlanViewerScreen?planId=${planId}`)
        }
    }

    return (
        <ScrollView>
            <View
                style={{
                    marginVertical: spacing.xl2,
                    paddingHorizontal: spacing.xl2,
                    rowGap: spacing.sm,
                }}>
                <HeaderTitle title="Crear Plan de Estudios" />

                <ThemedTextInput
                    title="Fecha de Inicio"
                    placeholder="YYYY-MM-DD"
                    value={startDate}
                    onChangeText={setStartDate}
                />

                <ThemedTextInput
                    title="Fecha de Fin"
                    placeholder="YYYY-MM-DD"
                    value={endDate}
                    onChangeText={setEndDate}
                />

                {loading ? (
                    <ActivityIndicator size="large" color={color.primary._500} />
                ) : (
                    <ThemedButton text="Generar Plan" onPress={handleGeneratePlan} />
                )}

                {generatedPlan ? (
                    <View style={{ rowGap: spacing.sm, marginTop: spacing.lg }}>
                        <Text style={{ color: color.text._100, fontSize: 18, fontWeight: 'bold' }}>
                            Plan de Estudios Generado
                        </Text>
                        <View
                            style={{
                                padding: spacing.md,
                                backgroundColor: color.neutral._200,
                                borderRadius: 8,
                            }}>
                            <Text style={{ color: color.text._100 }}>{generatedPlan}</Text>
                        </View>
                        <ThemedButton text="Guardar Plan" onPress={handleSavePlan} />
                    </View>
                ) : null}
            </View>
        </ScrollView>
    )
}

export default StudyPlanGeneratorScreen
