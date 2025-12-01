import { User, SpinResult, Prize } from '@/lib/models'
import connectDB from '@/lib/mongodb'

export async function POST(request) {
  try {
    await connectDB()

    const { userId, prizeId, prizeName, isAssigned, assignedBy } = await request.json()

    // Check if user exists
    const user = await User.findById(userId)
    
    if (!user) {
      return Response.json(
        { message: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    if (user.hasSpun) {
      console.log('User already spun:', user);
      return Response.json(
        { message: 'User sudah pernah memutar Lucky Wheel' },
        { status: 400 }
      )
    }

    // Only check assigned prizes for random spins (not admin-assigned spins)
    if (!isAssigned) {
      const existingAssignment = await SpinResult.findOne({ 
        userId: userId, 
        isAssigned: true 
      }).populate('prizeId')
      
      if (existingAssignment) {
        console.log('User has assigned prize, allowing spin with assigned prize');
        // User has assigned prize, use the assigned prize instead of random
        // Update user hasSpun status
        await User.findByIdAndUpdate(userId, { hasSpun: true })
        
        const assignedSpinResult = await SpinResult.findById(existingAssignment._id)
          .populate('userId', 'name email phone code')
          .populate('prizeId', 'name description color probability')

        console.log('=== ASSIGNED PRIZE SPIN RESULT ===')
        console.log('Assigned Spin Result:', assignedSpinResult)
        console.log('==================================')

        return Response.json({
          message: 'Hasil putaran berhasil disimpan',
          spinResult: assignedSpinResult
        })
      }
    }

    // Verify prize exists
    const prize = await Prize.findById(prizeId)
    if (!prize) {
      return Response.json(
        { message: 'Hadiah tidak ditemukan' },
        { status: 404 }
      )
    }

    // Create spin result
    const spinResult = await SpinResult.create({
      userId: userId,
      prizeId: prizeId,
      isAssigned: isAssigned || false,
      assignedBy: assignedBy || null,
      spinTime: new Date()
    })

    // Populate the result
    const populatedResult = await SpinResult.findById(spinResult._id)
      .populate('userId', 'name email phone code')
      .populate('prizeId', 'name description color probability')

    console.log('=== SPIN RESULT CREATED ===')
    console.log('Spin Result:', populatedResult)
    console.log('===========================')

    // Update user hasSpun status
    await User.findByIdAndUpdate(userId, { hasSpun: true })
    
    console.log('=== USER UPDATED ===')
    console.log('User hasSpun set to true')
    console.log('====================')

    return Response.json({
      message: 'Hasil putaran berhasil disimpan',
      spinResult: populatedResult
    })
  } catch (error) {
    console.error('Spin error:', error)
    return Response.json(
      { message: 'Terjadi kesalahan saat menyimpan hasil putaran' },
      { status: 500 }
    )
  }
}