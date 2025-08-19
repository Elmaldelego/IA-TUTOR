import { APIManager } from './API/APIManagerState'
import { buildAndSendRequest, APIBuilderParams } from './API/APIBuilder'
import { SamplersManager } from '@lib/state/SamplerState'
import { create } from 'zustand'
import { Logger } from '@lib/state/Logger'

interface StudyPlanState {
    generatedPlan: string
    loading: boolean
    generate: (chats: string) => Promise<void>
    stopGenerating: () => void
}

export const useStudyPlanGenerator = create<StudyPlanState>()((set, get) => ({
    generatedPlan: '',
    loading: false,
    stopGenerating: () => {
        set({ loading: false })
    },
    generate: async (chats: string) => {
        set({ loading: true, generatedPlan: '' })

        const apiState = APIManager.useConnectionsStore.getState()
        const apiValues = apiState.values.find((item, index) => index === apiState.activeIndex)
        if (!apiValues) {
            Logger.warnToast(`No Active API`)
            set({ loading: false })
            return
        }

        const configs = apiState.getTemplates().filter((item) => item.name === apiValues.configName)
        const apiConfig = configs[0]
        if (!apiConfig) {
            Logger.errorToast(`Configuration "${apiValues?.configName}" not found`)
            set({ loading: false })
            return
        }

        const samplers = SamplersManager.getCurrentSampler()

        const prompt = `Basado en las siguientes preguntas y conversaciones de un estudiante, genera un plan de estudios estructurado. Identifica los temas principales, sugiere un orden de estudio, y proporciona recursos o conceptos clave a reforzar. El plan debe ser claro, conciso y motivador. Conversaciones:\n\n${chats}`

        const params: Partial<APIBuilderParams> = {
            apiConfig: apiConfig,
            apiValues: apiValues,
            samplers: samplers,
            messages: [{ name: 'user', is_user: true, swipes: [{ swipe: prompt, id: 0, entry_id: 0, send_date: new Date(), gen_started: new Date(), gen_finished: new Date(), timings: null }], id: 0, chat_id: 0, order: 0, swipe_id: 0, attachments: [] }],
            onData: (data) => {
                set((state) => ({ generatedPlan: state.generatedPlan + data }))
            },
            onEnd: () => {
                set({ loading: false })
            },
            stopGenerating: () => get().stopGenerating(),
        }

        await buildAndSendRequest(params as APIBuilderParams)
    },
}))