import { User } from "@/lib/models";
import connectDB from "@/lib/mongodb"


export async function GET(request, { params }) {
  try {

    await connectDB();

    const { code } = await params
    
    const user = await User.findOne({ code: code.toUpperCase() })
    
    if (!user) {
      return Response.json(
        { message: 'Kode user tidak ditemukan' },
        { status: 404 }
      )
    }

    return Response.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    return Response.json(
      { message: 'Terjadi kesalahan saat mengambil data user' },
      { status: 500 }
    )
  }
}