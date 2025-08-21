import ThemedButton from '@components/buttons/ThemedButton'
import HeaderTitle from '@components/views/HeaderTitle'
import { Chats } from '@lib/state/Chat'
import { Theme } from '@lib/theme/ThemeManager'
import React, { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View, Modal, TouchableOpacity } from 'react-native'
import { useStudyPlanGenerator } from '@lib/engine/StudyPlanGenerator'
import { StudyPlans } from '@lib/state/StudyPlans'
import { useRouter } from 'expo-router'
import { Calendar } from 'react-native-calendars'

const StudyPlanGeneratorScreen = () => {
    const { spacing, color } = Theme.useTheme()
    const router = useRouter()
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [isCalendarVisible, setCalendarVisible] = useState(false)
    const [dateType, setDateType] = useState<'start' | 'end'>('start')

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

            await generate(chats)
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

    const onDayPress = (day) => {
        const selectedDate = day.dateString
        if (dateType === 'start') {
            setStartDate(selectedDate)
        } else {
            setEndDate(selectedDate)
        }
        setCalendarVisible(false)
    }

    const setDateRange = (days) => {
        const start = new Date()
        const end = new Date()
        end.setDate(start.getDate() + days)
        setStartDate(start.toISOString().split('T')[0])
        setEndDate(end.toISOString().split('T')[0])
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

                <TouchableOpacity onPress={() => { setDateType('start'); setCalendarVisible(true); }}>
                    <Text style={{ color: color.text._100, marginBottom: spacing.sm }}>Fecha de Inicio</Text>
                    <View style={{ borderWidth: 1, borderColor: color.neutral._500, padding: spacing.md, borderRadius: 8 }}>
                        <Text style={{ color: color.text._100 }}>{startDate || 'YYYY-MM-DD'}</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { setDateType('end'); setCalendarVisible(true); }}>
                    <Text style={{ color: color.text._100, marginBottom: spacing.sm }}>Fecha de Fin</Text>
                    <View style={{ borderWidth: 1, borderColor: color.neutral._500, padding: spacing.md, borderRadius: 8 }}>
                        <Text style={{ color: color.text._100 }}>{endDate || 'YYYY-MM-DD'}</Text>
                    </View>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: spacing.md }}>
                    <ThemedButton label="1 Semana" onPress={() => setDateRange(7)} />
                    <ThemedButton label="15 Días" onPress={() => setDateRange(15)} />
                    <ThemedButton label="1 Mes" onPress={() => setDateRange(30)} />
                </View>

                <Modal
                    transparent={true}
                    visible={isCalendarVisible}
                    onRequestClose={() => setCalendarVisible(false)}>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <View style={{ backgroundColor: color.neutral._800, borderRadius: 8, padding: spacing.md }}>
                            <Calendar
                                onDayPress={onDayPress}
                                markedDates={{
                                    [startDate]: { selected: true, marked: true, selectedColor: color.primary._500 },
                                    [endDate]: { selected: true, marked: true, selectedColor: color.primary._500 }
                                }}
                                theme={{
                                    backgroundColor: color.neutral._800,
                                    calendarBackground: color.neutral._800,
                                    textSectionTitleColor: color.text._100,
                                    selectedDayBackgroundColor: color.primary._500,
                                    selectedDayTextColor: '#ffffff',
                                    todayTextColor: color.primary._500,
                                    dayTextColor: color.text._100,
                                    textDisabledColor: color.neutral._500,
                                    dotColor: color.primary._500,
                                    selectedDotColor: '#ffffff',
                                    arrowColor: color.primary._500,
                                    monthTextColor: color.primary._500,
                                    indicatorColor: color.primary._500,
                                    textDayFontWeight: '300',
                                    textMonthFontWeight: 'bold',
                                    textDayHeaderFontWeight: '300',
                                    textDayFontSize: 16,
                                    textMonthFontSize: 16,
                                    textDayHeaderFontSize: 16
                                }}
                            />
                        </View>
                    </View>
                </Modal>

                {loading ? (
                    <ActivityIndicator size="large" color={color.primary._500} />
                ) : (
                    <ThemedButton label="Generar Plan" onPress={handleGeneratePlan} />
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
                        <ThemedButton label="Guardar Plan" onPress={handleSavePlan} />
                    </View>
                ) : null}
            </View>
        </ScrollView>
    )
}

export default StudyPlanGeneratorScreen
