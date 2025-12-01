import { User, SpinResult } from '@/lib/models'
import connectDB from '@/lib/mongodb'

export async function DELETE(request) {
  try {
    await connectDB()

    const { userIds } = await request.json()
    
    if (!userIds || !Array.isArray(userIds)) {
      return Response.json(
        { message: 'User IDs array is required' },
        { status: 400 }
      )
    }

    // Delete related spin results first
    await SpinResult.deleteMany({ userId: { $in: userIds } })
    
    // Delete users
    const deleteResult = await User.deleteMany({ _id: { $in: userIds } })
    const deletedCount = deleteResult.deletedCount

    return Response.json({
      message: `Successfully deleted ${deletedCount} users`,
      deletedCount
    })
  } catch (error) {
    console.error('Bulk delete error:', error)
    return Response.json(
      { message: 'Terjadi kesalahan saat menghapus users' },
      { status: 500 }
    )
  }
}