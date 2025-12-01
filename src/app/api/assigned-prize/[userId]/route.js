import { User, Prize, SpinResult } from "@/lib/models"
import connectDB from "@/lib/mongodb"

export async function GET(request, { params }) {
  try {
    await connectDB()

    const { userId } = await params
    
    const assignedPrize = await SpinResult.findOne({ 
      userId: userId, 
      isAssigned: true 
    }).populate('prizeId', 'name description color probability')
    
    if (assignedPrize && assignedPrize.prizeId) {
      return Response.json({
        prize: assignedPrize.prizeId,
        isAssigned: true
      })
    }

    return Response.json({
      prize: null,
      isAssigned: false
    })
  } catch (error) {
   
    return Response.json(
      { message: 'Terjadi kesalahan saat mengambil data hadiah' },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    await connectDB()

    const { userId } = await params
    const { prizeId, assignedBy } = await request.json()

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return Response.json(
        { message: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if prize exists
    const prize = await Prize.findById(prizeId)
    if (!prize) {
      return Response.json(
        { message: 'Hadiah tidak ditemukan' },
        { status: 404 }
      )
    }

    // Remove any existing assigned prize for this user
    await SpinResult.deleteMany({ userId: userId, isAssigned: true })

    // Create new assigned prize
    const assignedPrize = await SpinResult.create({
      userId: userId,
      prizeId: prizeId,
      isAssigned: true,
      assignedBy: assignedBy || null,
      spinTime: new Date()
    })

    const populatedResult = await SpinResult.findById(assignedPrize._id)
      .populate('userId', 'name email phone code')
      .populate('prizeId', 'name description color probability')
      .populate('assignedBy', 'name email')

    return Response.json({
      message: 'Hadiah berhasil ditetapkan untuk user',
      assignedPrize: {
        userId: populatedResult.userId._id.toString(),
        prizeId: populatedResult.prizeId._id.toString(),
        prize: populatedResult.prizeId,
        prizeName: populatedResult.prizeId.name,
        isAssigned: true,
        spinTime: populatedResult.spinTime
      }
    })
  } catch (error) {
    console.error('Assign prize error:', error)
    return Response.json(
      { message: 'Terjadi kesalahan saat menetapkan hadiah' },
      { status: 500 }
    )
  }
}