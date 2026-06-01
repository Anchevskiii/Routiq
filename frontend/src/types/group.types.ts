export interface Group {
  id: string
  name: string
  description?: string
  imageUrl?: string
  themeColor?: string
  createdAt: string
  members: GroupMember[]
  itineraries: GroupItinerary[]
  comments: Comment[]
  memberCount: number
  itineraryCount: number
}

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  role: GroupRole
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
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
  score: number
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
  votes: Vote[]
  _count: {
    votes: number
  }
}

export interface CommentReaction {
  emoji: string
  userId: string
}

export interface Comment {
  id: string
  groupId: string
  userId: string
  parentId?: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    avatarUrl?: string
  }
  replies?: Comment[]
  reactions?: CommentReaction[]
}

export interface Vote {
  id: string
  groupItineraryId: string
  userId: string
  voteType: 'UPVOTE' | 'DOWNVOTE'
  createdAt: string
  user: {
    id: string
    name: string
  }
}

export type GroupRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER'

export interface CreateGroupDto {
  name: string
  description?: string
  imageUrl?: string
  themeColor?: string
}

export interface InviteMemberDto {
  email: string
}

export interface AddCommentDto {
  content: string
  parentId?: string
}

export interface Invitation {
  id: string
  groupId: string
  inviterId: string
  status: string
  group: {
    id: string
    name: string
    createdBy: {
      name: string
    }
  }
}
