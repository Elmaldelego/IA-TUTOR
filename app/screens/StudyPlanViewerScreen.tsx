import HeaderTitle from '@components/views/HeaderTitle'
import { MarkdownStyle } from '@lib/markdown/Markdown'
import { StudyPlans, StudyPlan } from '@lib/state/StudyPlans'
import { Theme } from '@lib/theme/ThemeManager'
import { useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import Markdown from 'react-native-markdown-display'

const StudyPlanViewerScreen = () => {
    const { planId } = useLocalSearchParams<{ planId: string }>()
    const { spacing, color } = Theme.useTheme()
    const { markdown, rules, style } = MarkdownStyle.useCustomFormatting()
    const [plan, setPlan] = useState<StudyPlan | undefined>(undefined)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPlan = async () => {
            if (planId) {
                const fetchedPlan = await StudyPlans.useStudyPlanStore.getState().getPlan(parseInt(planId, 10))
                setPlan(fetchedPlan)
            }
            setLoading(false)
        }

        fetchPlan()
    }, [planId])

    return (
        <ScrollView>
            <View
                style={{
                    marginVertical: spacing.xl2,
                    paddingHorizontal: spacing.xl2,
                }}>
                <HeaderTitle title={plan?.title ?? 'Plan de Estudios'} />
                {loading ? (
                    <ActivityIndicator size="large" color={color.primary._500} />
                ) : (
                    <Markdown markdownit={markdown} rules={rules} style={style}>
                        {plan?.content ?? ''}
                    </Markdown>
                )}
            </View>
        </ScrollView>
    )
}

export default StudyPlanViewerScreen
