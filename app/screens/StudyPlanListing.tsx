import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Theme } from '@lib/theme/ThemeManager';
import { useRouter } from 'expo-router';
import { StudyPlan } from '@lib/state/StudyPlans';
import { getFriendlyTimeStamp } from '@lib/utils/Time';
import Avatar from '@components/views/Avatar';

type StudyPlanListingProps = {
    plan: StudyPlan;
};

const StudyPlanListing: React.FC<StudyPlanListingProps> = ({ plan }) => {
    const { color, spacing, borderRadius, fontSize } = Theme.useTheme();
    const router = useRouter();
    const styles = useStyles();

    const handlePress = () => {
        router.push(`/screens/StudyPlanViewerScreen?planId=${plan.id}`);
    };

    return (
        <View style={styles.longButtonContainer}>
            <TouchableOpacity style={styles.longButton} onPress={handlePress}>
                <Avatar style={styles.avatar} />
                <View style={{ flex: 1, paddingLeft: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.nametag} numberOfLines={2}>
                            {plan.title}
                        </Text>
                        <Text style={styles.timestamp}>
                            {new Date(plan.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const useStyles = () => {
    const { color, spacing, borderWidth, borderRadius, fontSize } = Theme.useTheme();

    return StyleSheet.create({
        longButton: {
            flexDirection: 'row',
            flex: 1,
            padding: spacing.l,
        },
        longButtonContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: borderRadius.m,
            flex: 1,
            backgroundColor: color.neutral._200,
        },
        avatar: {
            width: 48,
            height: 48,
            borderRadius: borderRadius.l,
            margin: spacing.sm,
            backgroundColor: color.neutral._300,
            borderColor: color.neutral._300,
            borderWidth: 1,
        },
        nametag: {
            flex: 1,
            fontSize: fontSize.l,
            fontWeight: '500',
            color: color.text._100,
        },
        timestamp: {
            fontSize: fontSize.s,
            color: color.text._400,
        },
    });
};

export default StudyPlanListing;
