import { z } from 'zod'

export const companyKeySchema = z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
