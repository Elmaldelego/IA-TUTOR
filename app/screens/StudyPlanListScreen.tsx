import HeaderTitle from '@components/views/HeaderTitle'
import { StudyPlans } from '@lib/state/StudyPlans'
import { Theme } from '@lib/theme/ThemeManager'
import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'

const StudyPlanListItem = ({ item, onPress }) => {
    const { color, spacing } = Theme.useTheme()
    return (
        <Pressable
            onPress={onPress}
            style={{
                padding: spacing.md,
                backgroundColor: color.neutral._200,
                borderRadius: 8,
            }}>
            <Text style={{ color: color.text._100, fontSize: 16, fontWeight: 'bold' }}>
                {item.title}
            </Text>
            <Text style={{ color: color.text._300, fontSize: 12 }}>
                Creado el: {new Date(item.createdAt).toLocaleDateString()}
            </Text>
        </Pressable>
    )
}

const StudyPlanListScreen = () => {
    const { spacing } = Theme.useTheme()
    const router = useRouter()
    const { plans, fetchPlans } = StudyPlans.useStudyPlanStore()

    useEffect(() => {
        fetchPlans()
    }, [])

    const handlePlanPress = (planId: number) => {
        router.push(`/screens/StudyPlanViewerScreen?planId=${planId}`)
    }

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
                renderItem={({ item }) => (
                    <StudyPlanListItem item={item} onPress={() => handlePlanPress(item.id)} />
                )}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ rowGap: spacing.sm }}
            />
        </View>
    )
}

export default StudyPlanListScreen
