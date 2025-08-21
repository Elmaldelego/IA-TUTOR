import { APIManager } from './API/APIManagerState'
import { buildAndSendRequest, APIBuilderParams } from './API/APIBuilder'
import { SamplersManager } from '@lib/state/SamplerState'
import { create } from 'zustand'
import { Logger } from '@lib/state/Logger'
import { useAppModeStore } from '@lib/state/AppMode'
import { localInference } from './LocalInference'

interface StudyPlanState {
    generatedPlan: string
    loading: boolean
    generate: (chats: any[]) => Promise<void>
    stopGenerating: () => void
}

/**
 *  Convierte historial de chats al formato estándar:
 * [{ role: "system" | "user" | "assistant", content: "..." }]
 * - Une mensajes consecutivos del mismo rol
 * - Mantiene orden y contexto
 */
function sanitizeMessages(chats: any[], system_prompt: string) {
    const cleanMessages: { role: "system" | "user" | "assistant", content: string }[] = []

    if (system_prompt) {
        cleanMessages.push({ role: "system", content: system_prompt });
    }

    chats.forEach(chat => {
        chat.messages.forEach(message => {
            const role = message.name === 'user' ? 'user' : 'assistant';
            const content = message.swipes[message.swipe_id].swipe;

            if (cleanMessages.length > 0 && cleanMessages[cleanMessages.length - 1].role === role) {
                cleanMessages[cleanMessages.length - 1].content += `\n${content}`;
            } else {
                cleanMessages.push({ role, content });
            }
        });
    });

    return cleanMessages;
}


export const useStudyPlanGenerator = create<StudyPlanState>()((set, get) => ({
    generatedPlan: '',
    loading: false,
    stopGenerating: () => {
        set({ loading: false })
    },
    generate: async (chats: any[]) => {
        set({ loading: true, generatedPlan: '' })

        const appMode = useAppModeStore.getState().appMode

        const system_prompt = `Eres un mentor académico especializado en crear planes de estudio personalizados.  
Analiza la conversación del estudiante (mensajes incluidos abajo) e identifica los temas que requieren mayor refuerzo.  
Elabora un plan estructurado con **Módulos**, cada uno con:  
- Objetivo  
- Subtemas  
- Actividades sugeridas  
- Duración estimada  

Al final incluye una sección de **Autoevaluación**.  
Mantén un tono motivador y claro.  

### Formato esperado de salida (ejemplo):

# Plan de Estudio Personalizado

## Módulo 1: Fundamentos básicos
- **Objetivo:** Reforzar la comprensión de los conceptos esenciales para construir una base sólida.  
- **Subtemas:**  
  - Concepto 1  
  - Concepto 2  
- **Actividades sugeridas:**  
  - Leer un resumen introductorio.  
  - Resolver 3 ejercicios básicos.  
  - Explicar en tus propias palabras el concepto a un compañero o en voz alta.  
- **Duración estimada:** 2 días  

---

## Módulo 2: Aplicaciones prácticas
- **Objetivo:** Aplicar los conceptos en problemas cotidianos y ejemplos prácticos.  
- **Subtemas:**  
  - Caso de uso A  
  - Caso de uso B  
- **Actividades sugeridas:**  
  - Resolver 5 problemas prácticos.  
  - Relacionar el tema con un ejemplo real de tu vida diaria.  
- **Duración estimada:** 3 días  

---

## Módulo 3: Profundización y resolución de errores comunes
- **Objetivo:** Identificar y superar las dificultades más frecuentes en los temas.  
- **Subtemas:**  
  - Error común 1  
  - Error común 2  
- **Actividades sugeridas:**  
  - Resolver un cuestionario de autoevaluación.  
  - Explicar las soluciones paso a paso.  
- **Duración estimada:** 3 días  

---

## Autoevaluación Final
- **Preguntas de repaso:**  
  1. Explica en una frase el concepto principal de cada módulo.  
  2. Resuelve un ejercicio integrador que combine los temas vistos.  
- **Reflexión:** Escribe brevemente qué tema fue más difícil y cómo planeas reforzarlo.  
`;

        const messages = sanitizeMessages(chats, system_prompt);

        if (appMode === 'local') {
            const stop = () => get().stopGenerating()
            const onData = (data: string) => {
                set((state) => ({ generatedPlan: state.generatedPlan + data }))
            }
            const onEnd = () => {
                set({ loading: false })
            }

            try {
                await localInference({
                    messages: messages,
                    onData: onData,
                    onEnd: onEnd,
                    stop: stop,
                })
            } catch (e) {
                Logger.errorToast('Error during local inference: ' + e)
                stop()
            }

        } else {
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

            const params: Partial<APIBuilderParams> = {
                apiConfig: apiConfig,
                apiValues: apiValues,
                samplers: samplers,
                messages: messages,
                onData: (data) => {
                    set((state) => ({ generatedPlan: state.generatedPlan + data }))
                },
                onEnd: () => {
                    set({ loading: false })
                },
                stopGenerating: () => get().stopGenerating(),
            }

            await buildAndSendRequest(params as APIBuilderParams)
        }
    },
}))