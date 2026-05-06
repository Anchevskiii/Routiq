export interface Group {
  id: string
  name: string
  description?: string
  createdAt: string
  members: GroupMember[]
  itineraries: GroupItinerary[]
  memberCount: number
  itineraryCount: number
}

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  role: GroupRole
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string
  }
}

export interface GroupItinerary {
  id: string
  groupId: string
  itineraryId: string
  addedAt: string
  itinerary: {
    id: string
    destination: string
    startDate: string
    endDate: string
    travelType: string
    createdAt: string
    user: {
      id: string
      name: string
      avatarUrl?: string
    }
  }
  comments: Comment[]
  votes: Vote[]
  _count: {
    comments: number
    votes: number
  }
}

export interface Comment {
  id: string
  groupItineraryId: string
  userId: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    avatarUrl?: string
  }
}

export interface Vote {
  id: string
  groupItineraryId: string
  userId: string
  attractionId: string
  createdAt: string
  user: {
    id: string
    name: string
  }
}

export type GroupRole = 'ADMIN' | 'MEMBER'

export interface CreateGroupDto {
  name: string
  description?: string
}

export interface InviteMemberDto {
  email: string
}

export interface AddCommentDto {
  content: string
}
