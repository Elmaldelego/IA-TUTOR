import HeaderTitle from '@components/views/HeaderTitle'
import { StudyPlans } from '@lib/state/StudyPlans'
import { Theme } from '@lib/theme/ThemeManager'
import React, { useEffect } from 'react'
import { FlatList, View } from 'react-native'
import StudyPlanListing from './StudyPlanListing'

const StudyPlanListScreen = () => {
    const { spacing } = Theme.useTheme()
    const { plans, fetchPlans } = StudyPlans.useStudyPlanStore()

    useEffect(() => {
        fetchPlans()
    }, [])

    return (
        <View
            style={{
                marginVertical: spacing.xl2,
                paddingHorizontal: spacing.xl2,
                flex: 1,
                rowGap: spacing.sm,
            }}>
            <HeaderTitle title="Mis Planes de Estudio" />
            <FlatList
                data={plans}
                renderItem={({ item }) => <StudyPlanListing plan={item} />}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ rowGap: spacing.sm }}
            />
        </View>
    )
}

export default StudyPlanListScreen
