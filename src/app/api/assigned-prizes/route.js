import { SpinResult } from '@/lib/models'
import connectDB from '@/lib/mongodb'

export async function GET() {
  try {
    await connectDB()

    const assignedPrizes = await SpinResult.find({ isAssigned: true })
      .populate('userId', 'name email phone code')
      .populate('prizeId', 'name description color probability')
      .populate('assignedBy', 'name email')
      .sort({ spinTime: -1 })

    // Transform to object format similar to mockData structure
    const assignedPrizesMap = {}
    assignedPrizes.forEach(result => {
      if (result.userId) {
        assignedPrizesMap[result.userId._id.toString()] = {
          userId: result?.userId._id.toString(),
          prizeId: result?.prizeId?._id.toString(),
          prize: result?.prizeId,
          prizeName: result?.prizeId?.name,
          isAssigned: true,
          spinTime: result.spinTime
        }
      }
    })

 

    return Response.json(assignedPrizesMap)
  } catch (error) {
    console.error('Get assigned prizes error:', error)
    return Response.json(
      { message: 'Terjadi kesalahan saat mengambil data assigned prizes' },
      { status: 500 }
    )
  }
}