import { Prize } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import { NextRequest } from 'next/server';

export async function GET() {

  try {
    await connectDB();

    const prizes = await Prize.find();

    return Response.json({ prizes })
  } catch (error) {
    console.error('Get prizes error:', error)
    return Response.json(
      { message: 'Terjadi kesalahan saat mengambil data hadiah' },
      { status: 500 }
    )
  }
}


export async function POST(request = NextRequest) {
  try {

    await connectDB();

    const { name, description, color, probability } = await request.json();

    // Create new user
    const newPrize = await Prize.create({
      name,
      description,
      color,
      probability,
      isActive: true
    });

    return Response.json({
      success: true,
      name: newPrize.name,
      description: newPrize.description,
      color: newPrize.color,
      probability: newPrize.probability,
      isActive: newPrize.isActive,
      message: 'Hadiah berhasil ditambahkan'
    })
  } catch (error) {
    console.error('Registration error:', error)
    return Response.json(
      { message: 'Terjadi kesalahan saat menambahkan hadiah' },
      { status: 500 }
    )
  }
}