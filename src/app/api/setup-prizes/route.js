import { Prize } from '@/lib/models'
import connectDB from '@/lib/mongodb'

export async function GET() {
  try {
    await connectDB()

    const existingPrizes = await Prize.find({})
    
    if (existingPrizes.length > 0) {
      return Response.json({
        message: 'Prizes already exist',
        count: existingPrizes.length,
        prizes: existingPrizes
      })
    }

    // Initialize with default prizes
    const defaultPrizes = [
      { 
        name: 'Mystery Box', 
        description: 'Kotak misteri dengan hadiah kejutan', 
        color: '#FF6B6B', 
        probability: 10, 
        isActive: true 
      },
      { name: 'Voucher 50K', description: 'Voucher belanja senilai Rp 50.000', color: '#4ECDC4', probability: 15, isActive: true },
      { name: 'Merchandise', description: 'Merchandise eksklusif brand', color: '#45B7D1', probability: 20, isActive: true },
      { name: 'Voucher 100K', description: 'Voucher belanja senilai Rp 100.000', color: '#96CEB4', probability: 10, isActive: true },
      { name: 'Grand Prize', description: 'Hadiah utama spesial', color: '#FFEAA7', probability: 5, isActive: true },
      { name: 'Thank You', description: 'Terima kasih telah berpartisipasi', color: '#DDA0DD', probability: 25, isActive: true },
      { name: 'Voucher 25K', description: 'Voucher belanja senilai Rp 25.000', color: '#98D8C8', probability: 10, isActive: true },
      { name: 'Special Gift', description: 'Hadiah spesial dari brand', color: '#FFB6C1', probability: 5, isActive: true }
    ]

    const createdPrizes = await Prize.insertMany(defaultPrizes)
    
    return Response.json({
      message: 'Default prizes created successfully',
      count: createdPrizes.length,
      prizes: createdPrizes
    })
  } catch (error) {
    console.error('Setup prizes error:', error)
    return Response.json(
      { message: 'Terjadi kesalahan saat setup prizes' },
      { status: 500 }
    )
  }
}