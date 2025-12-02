import { Prize } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const { name, description, color, probability, isActive } = await request.json();

    // Find and update prize
    const prize = await Prize.findByIdAndUpdate(
      id,
      {
        name,
        description,
        color,
        probability,
        isActive: isActive !== undefined ? isActive : true
      },
      { new: true, runValidators: true }
    );

    if (!prize) {
      return Response.json(
        { message: 'Hadiah tidak ditemukan' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      prize,
      message: 'Hadiah berhasil diperbarui'
    });
  } catch (error) {
    console.error('Update prize error:', error);
    return Response.json(
      { message: 'Terjadi kesalahan saat memperbarui hadiah' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const prize = await Prize.findByIdAndDelete(id);

    if (!prize) {
      return Response.json(
        { message: 'Hadiah tidak ditemukan' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: 'Hadiah berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete prize error:', error);
    return Response.json(
      { message: 'Terjadi kesalahan saat menghapus hadiah' },
      { status: 500 }
    );
  }
}





