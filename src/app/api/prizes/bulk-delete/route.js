import { Prize } from '@/lib/models'
import connectDB from '@/lib/mongodb'

export async function DELETE(request) {
  try {
    await connectDB()

    const { prizeIds } = await request.json()
    
    if (!prizeIds || !Array.isArray(prizeIds)) {
      return Response.json(
        { message: 'Prize IDs array is required' },
        { status: 400 }
      )
    }

    // Delete prizes
    const deleteResult = await Prize.deleteMany({ _id: { $in: prizeIds } })
    const deletedCount = deleteResult.deletedCount

    return Response.json({
      message: `Successfully deleted ${deletedCount} prizes`,
      deletedCount
    })
  } catch (error) {
    console.error('Bulk delete prizes error:', error)
    return Response.json(
      { message: 'Terjadi kesalahan saat menghapus hadiah' },
      { status: 500 }
    )
  }
}

