import { SpinResult } from "@/lib/models"
import connectDB from "@/lib/mongodb"

export async function GET() {
  try {
    await connectDB()

    const spinResults = await SpinResult.find({})
      .populate('userId', 'name email phone code')
      .populate('prizeId', 'name description color probability')
      .sort({ spinTime: -1 })

    return Response.json(spinResults)
  } catch (error) {
    console.error('Get spin results error:', error)
    return Response.json(
      { message: 'Terjadi kesalahan saat mengambil data spin results' },
      { status: 500 }
    )
  }
}