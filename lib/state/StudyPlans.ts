import { db as database } from '@db'
import { studyPlans } from 'db/schema'
import { desc, eq } from 'drizzle-orm'
import { create } from 'zustand'

export type StudyPlan = typeof studyPlans.$inferSelect

type StudyPlanState = {
    plans: StudyPlan[]
    fetchPlans: () => Promise<void>
    createPlan: (title: string, content: string) => Promise<number | undefined>
    getPlan: (id: number) => Promise<StudyPlan | undefined>
}

export namespace StudyPlans {
    export const useStudyPlanStore = create<StudyPlanState>()((set, get) => ({
        plans: [],
        fetchPlans: async () => {
            const plans = await db.query.all()
            set({ plans })
        },
        createPlan: async (title: string, content: string) => {
            const result = await db.mutate.create(title, content)
            if (result) {
                await get().fetchPlans() // Refresh the list
                return result.id
            }
        },
        getPlan: async (id: number) => {
            return await db.query.get(id)
        },
    }))

    export namespace db {
        export namespace query {
            export const all = async () => {
                return await database.query.studyPlans.findMany({
                    orderBy: desc(studyPlans.createdAt),
                })
            }

            export const get = async (id: number) => {
                return await database.query.studyPlans.findFirst({
                    where: eq(studyPlans.id, id),
                })
            }
        }

        export namespace mutate {
            export const create = async (title: string, content: string) => {
                const [result] = await database
                    .insert(studyPlans)
                    .values({ title, content })
                    .returning({ id: studyPlans.id })
                return result
            }
        }
    }
}
