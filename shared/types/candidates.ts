export type CandidateProfileData = {
  headline: string | null
  about: string | null
  countryCode: string | null
  city: string | null
  phone: string | null
  telegram: string | null
  githubUrl: string | null
  linkedinUrl: string | null
}

export type CandidateProfileResponse = {
  user: {
    id: number
    name: string
    email: string | null
    avatarUrl: string | null
  }
  profile: CandidateProfileData | null
}

export type CandidateApplicationItem = {
  id: number
  status: 'NEW' | 'VIEWED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN'
  coverLetter: string | null
  createdAt: string
  vacancy: {
    slug: string
    title: string
    companyName: string
    city: string | null
    countryCode: string
  }
}

export type CandidateApplicationsResponse = {
  items: CandidateApplicationItem[]
  total: number
}
