import { User } from '@/lib/models';
import connectDB from '@/lib/mongodb'


export async function GET(request) {
  try {

    await connectDB();

     const users = await User.find({});

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const search = searchParams.get('search') || ''

   

    // Filter users based on search term
    let filteredUsers = users.filter(user => 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.code.toLowerCase().includes(search.toLowerCase())
    )

    // Sort by registration date (newest first)
    filteredUsers.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt))

    // Calculate pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

    return Response.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit),
        hasMore: endIndex < filteredUsers.length
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    return Response.json(
      { message: 'Terjadi kesalahan saat mengambil data users' },
      { status: 500 }
    )
  }
}