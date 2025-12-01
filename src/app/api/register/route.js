import { generateCode } from '@/lib/generateCode';
import { User } from '@/lib/models';
import connectDB from '@/lib/mongodb';

// Function to get client IP address
// function getClientIP(request) {
//   // Try to get IP from various headers (for proxies, load balancers, etc.)
//   const forwarded = request.headers.get('x-forwarded-for');
//   const realIP = request.headers.get('x-real-ip');
//   const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
//   if (forwarded) {
//     // x-forwarded-for can contain multiple IPs, take the first one
//     return forwarded.split(',')[0].trim();
//   }
  
//   if (realIP) {
//     return realIP.trim();
//   }
  
//   if (cfConnectingIP) {
//     return cfConnectingIP.trim();
//   }
  
//   // Fallback: try to get from request (may not work in all environments)
//   // In Next.js, we can't directly access request.ip, so we rely on headers
//   return 'unknown';
// }

export async function POST(request) {
  try {
    await connectDB();

    const { name, email, phone } = await request.json()

    // Get client IP address
    // const clientIP = getClientIP(request);
    
    // console.log('Registration request:', { name, email, phone, ipAddress: clientIP });

    // const existingUser = await User.findOne({ 
    //   $or: [{ email }]
    // });

    // console.log('Existing user:', existingUser);

    // if (existingUser) {
    //   return Response.json(
    //     { message: 'User dengan email ini sudah terdaftar' },
    //     { status: 400 }
    //   )
    // }

    // if (clientIP && clientIP !== 'unknown') {
    //   const existingIPUser = await User.findOne({ 
    //     ipAddress: clientIP 
    //   });

    //   if (existingIPUser) {
    //     console.log('Duplicate registration attempt from IP:', clientIP);
    //     return Response.json(
    //       { message: 'Anda sudah terdaftar sebelumnya. Satu IP address hanya dapat mendaftar sekali.' },
    //       { status: 400 }
    //     )
    //   }
    // }

    // Generate unique 4 digit code
    let code;
    let isUnique = false;

    while (!isUnique) {
      code = generateCode();
      const exists = await User.findOne({ code });
      if (!exists) isUnique = true;
    }

    // Create new user with IP address
    const newReg = await User.create({
      name,
      email,
      phone,
      code,
      // ipAddress: clientIP !== 'unknown' ? clientIP : null,
      hasSpun: false,
      registeredAt: new Date()
    });



    console.log('New user created:', newReg);

    

    return Response.json({
      success: true,
      code: newReg.code,
      nama: newReg.name,
      email: newReg.email,
      telepon: newReg.phone,
      message: 'Registrasi berhasil'
    })
  } catch (error) {
    console.error('Registration error:', error)
    return Response.json(
      { message: 'Terjadi kesalahan saat registrasi' },
      { status: 500 }
    )
  }
}